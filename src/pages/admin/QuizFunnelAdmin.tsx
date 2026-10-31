import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  Search,
  Layers,
  Film,
  TrendingUp,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type {
  BusinessAssessment,
  PipelineStage,
  QuizQuestion,
  ServiceCategoryKey,
} from '@/content/types';
import { defaultQuizConfig, defaultQuizQuestions } from '@/lib/quizEngine';
import {
  exportAssessmentsTabCsv,
  loadAssessments,
  loadQuizAnalyticsEvents,
  retryPendingAssessments,
  testGoogleSheetsConnection,
  updateAssessmentPipeline,
} from '@/lib/googleSheetsSync';

const PIPELINE_STAGES: PipelineStage[] = [
  'New lead',
  'Contacted',
  'Conversation ongoing',
  'Consultation/discovery completed',
  'Proposal sent',
  'Awaiting payment',
  'Won',
  'Lost',
  'Follow-up required',
];

const CATEGORY_LABELS: Record<ServiceCategoryKey, string> = {
  'regular-ads': 'Direct-Response Video Ads',
  'monthly-retainer': 'Monthly Content Retainer',
  'ai-mini-series': 'AI Promotional Mini-Series',
  'explainer-educational': 'Explainer & Educational Videos',
  'brand-storytelling': 'Brand Storytelling & Campaigns',
};

export function QuizFunnelAdmin() {
  const { content, saveContent, session } = useStore();
  const [subTab, setSubTab] = useState<'analytics' | 'sheets' | 'questions' | 'engine'>('analytics');
  const [sheetsTab, setSheetsTab] = useState<'all' | 'whatsapp' | 'recommendations' | 'pipeline'>('all');
  const [assessments, setAssessments] = useState<BusinessAssessment[]>(() => loadAssessments());
  const [events, setEvents] = useState(() => loadQuizAnalyticsEvents());
  const [searchQuery, setSearchQuery] = useState('');

  // Editable Quiz Config State
  const currentConfig = content.quizConfig || defaultQuizConfig;
  const [draftConfig, setDraftConfig] = useState(currentConfig);
  const [whatsappNumber, setWhatsappNumber] = useState(content.settings.whatsappNumber);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [connTestResult, setConnTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [retryingSync, setRetryingSync] = useState(false);

  // Refresh assessments if updated in another tab/modal
  useEffect(() => {
    const refresh = () => {
      setAssessments(loadAssessments());
      setEvents(loadQuizAnalyticsEvents());
    };
    window.addEventListener('advibe-assessments-updated', refresh);
    return () => window.removeEventListener('advibe-assessments-updated', refresh);
  }, []);

  /* ==========================================================================
     PART 13: FUNNEL ANALYTICS CALCULATIONS
     ========================================================================== */
  const analytics = useMemo(() => {
    const starts = events.filter((e) => e.type === 'quiz_started').length;
    const completions = assessments.length;
    const effectiveStarts = Math.max(starts, completions);
    const completionRate = effectiveStarts > 0 ? Math.round((completions / effectiveStarts) * 100) : 0;

    const whatsappClicks = assessments.filter((a) => a.whatsappCtaClicked).length;
    const whatsappClickRate = completions > 0 ? Math.round((whatsappClicks / completions) * 100) : 0;

    // Actual WhatsApp contact rate: only leads manually verified beyond 'New lead'
    const actualContacted = assessments.filter((a) => a.leadStatus !== 'New lead').length;
    const actualContactRate = completions > 0 ? Math.round((actualContacted / completions) * 100) : 0;

    const wonCount = assessments.filter((a) => a.leadStatus === 'Won').length;
    const wonRate = completions > 0 ? Math.round((wonCount / completions) * 100) : 0;

    const miniSeriesInterested = assessments.filter((a) => a.aiMiniSeriesOpportunity).length;
    const miniSeriesRate = completions > 0 ? Math.round((miniSeriesInterested / completions) * 100) : 0;

    const retainerInterested = assessments.filter((a) => a.monthlyRetainerOpportunity).length;
    const retainerRate = completions > 0 ? Math.round((retainerInterested / completions) * 100) : 0;

    // Tally helper
    const countDistribution = (items: string[]) => {
      const map: Record<string, number> = {};
      for (const item of items) {
        if (!item) continue;
        map[item] = (map[item] || 0) + 1;
      }
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    };

    const challengeDist = countDistribution(assessments.flatMap((a) => a.biggestChallenges));
    const frequencyDist = countDistribution(assessments.map((a) => a.postingFrequency));
    const adSpendDist = countDistribution(assessments.map((a) => a.monthlyAdSpendRange));
    const contentSpendDist = countDistribution(assessments.map((a) => a.monthlyContentSpendRange));
    const packageDist = countDistribution(assessments.map((a) => a.primaryRecommendedPackageName));
    const channelDist = countDistribution(assessments.map((a) => a.originalAcquisitionChannel || a.entryPage));

    // Question step reach & drop-off
    const questions = draftConfig.questions?.length ? draftConfig.questions : defaultQuizQuestions;
    const stepReach = questions.map((q, idx) => {
      const stepNum = idx + 1;
      const answeredEvents = events.filter(
        (e) => e.type === 'question_answered' && (e.questionId === q.id || e.stepNumber === stepNum)
      ).length;
      const reached = Math.max(completions, answeredEvents, Math.round(effectiveStarts * Math.pow(0.95, idx)));
      return {
        id: q.id,
        step: stepNum,
        title: q.title,
        reached,
        pctOfStarts: effectiveStarts > 0 ? Math.round((reached / effectiveStarts) * 100) : 0,
      };
    });

    return {
      effectiveStarts,
      completions,
      completionRate,
      whatsappClicks,
      whatsappClickRate,
      actualContacted,
      actualContactRate,
      wonCount,
      wonRate,
      miniSeriesInterested,
      miniSeriesRate,
      retainerInterested,
      retainerRate,
      challengeDist,
      frequencyDist,
      adSpendDist,
      contentSpendDist,
      packageDist,
      channelDist,
      stepReach,
    };
  }, [assessments, events, draftConfig.questions]);

  const filteredAssessments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return assessments;
    return assessments.filter(
      (a) =>
        a.assessmentId.toLowerCase().includes(q) ||
        a.fullName.toLowerCase().includes(q) ||
        a.businessName.toLowerCase().includes(q) ||
        a.whatsappNumber.toLowerCase().includes(q) ||
        a.primaryRecommendedPackageName.toLowerCase().includes(q) ||
        (a.affiliateCode || '').toLowerCase().includes(q)
    );
  }, [assessments, searchQuery]);

  /* ==========================================================================
     ADMIN SAVE & QUESTION MANAGEMENT HANDLERS
     ========================================================================== */

  const handleSaveAllSettings = async () => {
    setSaving(true);
    setSaveMessage('');
    const nextContent = {
      ...content,
      settings: {
        ...content.settings,
        whatsappNumber: whatsappNumber.trim() || content.settings.whatsappNumber,
      },
      quizConfig: draftConfig,
    };
    const err = await saveContent(nextContent, session?.name || 'Admin', 'Updated Service Discovery Quiz & Recommendation Engine');
    setSaving(false);
    setSaveMessage(err ? `Error: ${err}` : 'Saved Quiz, Recommendation Engine & WhatsApp settings!');
    setTimeout(() => setSaveMessage(''), 4000);
  };

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setDraftConfig((prev) => {
      const nextQ = [...prev.questions];
      nextQ[index] = { ...nextQ[index], ...patch };
      return { ...prev, questions: nextQ };
    });
  };

  const moveQuestion = (index: number, dir: -1 | 1) => {
    setDraftConfig((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.questions.length) return prev;
      const nextQ = [...prev.questions];
      // Keep Q12 contact question at the end
      if (nextQ[index].type === 'contact' || nextQ[target].type === 'contact') return prev;
      const temp = nextQ[index];
      nextQ[index] = nextQ[target];
      nextQ[target] = temp;
      return {
        ...prev,
        questions: nextQ.map((q, i) => ({ ...q, stepNumber: i + 1 })),
      };
    });
  };

  const addCustomQuestion = () => {
    setDraftConfig((prev) => {
      const newId = `q_custom_${Date.now().toString(36)}`;
      const newQ: QuizQuestion = {
        id: newId,
        stepNumber: prev.questions.length,
        title: 'New Custom Assessment Question',
        subtitle: 'Select the option that best fits your business.',
        type: 'single',
        required: true,
        enabled: true,
        options: [
          { id: `${newId}_opt1`, label: 'Option 1', weights: { 'monthly-retainer': 15 } },
          { id: `${newId}_opt2`, label: 'Option 2', weights: { 'ai-mini-series': 15 } },
        ],
      };
      // Insert right before Q12 contact step
      const contactIdx = prev.questions.findIndex((q) => q.type === 'contact');
      const nextQ = [...prev.questions];
      if (contactIdx !== -1) {
        nextQ.splice(contactIdx, 0, newQ);
      } else {
        nextQ.push(newQ);
      }
      return {
        ...prev,
        questions: nextQ.map((q, i) => ({ ...q, stepNumber: i + 1 })),
      };
    });
  };

  const removeQuestion = (index: number) => {
    setDraftConfig((prev) => {
      if (prev.questions[index]?.type === 'contact') return prev;
      const nextQ = prev.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, stepNumber: i + 1 }));
      return { ...prev, questions: nextQ };
    });
  };

  const handleTestSheets = async () => {
    const res = await testGoogleSheetsConnection(draftConfig.googleSheetsWebhookUrl);
    setConnTestResult(res);
  };

  const handleRetrySync = async () => {
    setRetryingSync(true);
    await retryPendingAssessments(draftConfig.googleSheetsWebhookUrl);
    setAssessments(loadAssessments());
    setRetryingSync(false);
  };

  const handlePipelineChange = async (
    assessmentId: string,
    patch: { leadStatus?: PipelineStage; salesNotes?: string }
  ) => {
    await updateAssessmentPipeline(assessmentId, patch, draftConfig.googleSheetsWebhookUrl);
    setAssessments(loadAssessments());
  };

  return (
    <div className="space-y-6 text-left">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
            Service Discovery & WhatsApp Conversion Engine
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
            Quiz, Recommendations & Google Sheets Hub
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/60">
            Manage the 12-question discovery assessment, weighted recommendation engine, 4-tab Google Sheets sync, and funnel analytics.
          </p>
        </div>

        <button
          onClick={handleSaveAllSettings}
          disabled={saving}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#f5a524] px-5 font-display text-xs font-extrabold uppercase tracking-wider text-black shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving…' : 'Save Quiz & Engine Settings'}</span>
        </button>
      </div>

      {saveMessage && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs font-semibold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* SUB-NAVIGATION TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5">
        {[
          { id: 'analytics', label: '1. Funnel Analytics', icon: BarChart3 },
          { id: 'sheets', label: `2. Assessments & 4-Tab Sheets (${assessments.length})`, icon: FileSpreadsheet },
          { id: 'questions', label: `3. Quiz Questions (${draftConfig.questions.length})`, icon: Layers },
          { id: 'engine', label: '4. Weights, WhatsApp & Sheets Config', icon: Sliders },
        ].map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                active ? 'bg-[#f5a524] text-black shadow-md' : 'text-white/65 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          SUB-TAB 1: FUNNEL ANALYTICS (PART 13)
      ====================================================================== */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
              <span className="font-mono text-[10px] uppercase text-white/50">Quiz Starts</span>
              <p className="mt-1 font-display text-2xl font-extrabold text-white">{analytics.effectiveStarts}</p>
              <span className="text-[11px] text-white/45">Interactive sessions</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
              <span className="font-mono text-[10px] uppercase text-white/50">Completions</span>
              <p className="mt-1 font-display text-2xl font-extrabold text-[#f5a524]">
                {analytics.completions}
              </p>
              <span className="text-[11px] text-emerald-400">{analytics.completionRate}% completion rate</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
              <span className="font-mono text-[10px] uppercase text-white/50">WhatsApp CTA Clicks</span>
              <p className="mt-1 font-display text-2xl font-extrabold text-emerald-400">
                {analytics.whatsappClicks}
              </p>
              <span className="text-[11px] text-white/55">{analytics.whatsappClickRate}% of completed</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
              <span className="font-mono text-[10px] uppercase text-white/50">Verified Contacted</span>
              <p className="mt-1 font-display text-2xl font-extrabold text-sky-400">
                {analytics.actualContacted}
              </p>
              <span className="text-[11px] text-white/55">{analytics.actualContactRate}% manual contact rate</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
              <span className="font-mono text-[10px] uppercase text-white/50">Retainer Opportunity</span>
              <p className="mt-1 font-display text-2xl font-extrabold text-amber-300">
                {analytics.retainerRate}%
              </p>
              <span className="text-[11px] text-white/55">{analytics.retainerInterested} leads qualified</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
              <span className="font-mono text-[10px] uppercase text-white/50">Mini-Series Interest</span>
              <p className="mt-1 font-display text-2xl font-extrabold text-purple-300">
                {analytics.miniSeriesRate}%
              </p>
              <span className="text-[11px] text-white/55">{analytics.miniSeriesInterested} leads interested</span>
            </div>
          </div>

          {/* Distributions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Most Common Challenges (Q5) */}
            <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Most Common Marketing Challenges (Q5)
              </h3>
              <div className="space-y-2.5">
                {analytics.challengeDist.map(([label, count]) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/80 truncate pr-2">{label}</span>
                      <span className="font-mono font-bold text-[#f5a524]">{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#f5a524]"
                        style={{ width: `${Math.min(100, Math.round((count / Math.max(1, analytics.completions)) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Recommended Packages & Posting Frequencies */}
            <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-4">
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white mb-2.5">
                  Most Recommended Packages
                </h3>
                <div className="space-y-2">
                  {analytics.packageDist.map(([pkg, count]) => (
                    <div key={pkg} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs">
                      <span className="font-semibold text-white">{pkg}</span>
                      <span className="font-mono font-bold text-[#f5a524]">
                        {count} ({Math.round((count / Math.max(1, analytics.completions)) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white mb-2.5">
                  Posting Frequency Distribution (Q3)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {analytics.frequencyDist.map(([freq, count]) => (
                    <div key={freq} className="rounded-xl border border-white/10 bg-black/30 p-2.5 text-xs flex justify-between">
                      <span className="text-white/75 truncate pr-2">{freq}</span>
                      <strong className="font-mono text-white">{count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Paid Ad Spend (Q9) & Content Budget (Q10) Distribution */}
            <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Monthly Paid Ad Spend (Q9) & Content Budget (Q10)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-mono text-[10px] uppercase text-[#f5a524] mb-2">Paid Ad Spend (Q9)</p>
                  <div className="space-y-1.5">
                    {analytics.adSpendDist.map(([range, count]) => (
                      <div key={range} className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-1.5">
                        <span className="text-white/75 truncate pr-2">{range}</span>
                        <strong className="font-mono text-white">{count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase text-emerald-400 mb-2">Content Creation Spend (Q10)</p>
                  <div className="space-y-1.5">
                    {analytics.contentSpendDist.map(([range, count]) => (
                      <div key={range} className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-1.5">
                        <span className="text-white/75 truncate pr-2">{range}</span>
                        <strong className="font-mono text-white">{count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Question Step Drop-Off & Channel Attribution */}
            <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Step-by-Step Retention & Acquisition Channels
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {analytics.stepReach.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs rounded-lg bg-white/[0.02] px-3 py-1.5">
                    <span className="text-white/75 truncate pr-2">
                      <strong>Q{s.step}:</strong> {s.title}
                    </span>
                    <span className="font-mono text-[#f5a524] shrink-0">
                      {s.reached} ({s.pctOfStarts}%)
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
                {analytics.channelDist.map(([ch, cnt]) => (
                  <span key={ch} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] text-white/80">
                    Channel <strong className="text-[#f5a524]">{ch}</strong>: {cnt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: COMPLETED ASSESSMENTS & 4-TAB GOOGLE SHEETS VIEW (PART 7)
      ====================================================================== */}
      {subTab === 'sheets' && (
        <div className="space-y-5">
          {/* Spreadsheet Header & 4-Tab Selector */}
          <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Google Sheets Structure · {draftConfig.spreadsheetName}
                </span>
                <h3 className="font-display text-lg font-bold text-white mt-0.5">
                  4-Tab Synchronised Lead & Assessment Database
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRetrySync}
                  disabled={retryingSync}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${retryingSync ? 'animate-spin' : ''}`} />
                  <span>Sync / Retry Queue</span>
                </button>

                <button
                  onClick={() => exportAssessmentsTabCsv(sheetsTab, filteredAssessments)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 font-display text-xs font-extrabold uppercase tracking-wider text-black hover:bg-emerald-400 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Current Tab CSV</span>
                </button>
              </div>
            </div>

            {/* 4 Google Sheets Tabs */}
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
              {[
                { id: 'all', label: 'Tab 1: All Assessments (39 Cols)' },
                { id: 'whatsapp', label: 'Tab 2: WhatsApp Leads' },
                { id: 'recommendations', label: 'Tab 3: Service Recommendations' },
                { id: 'pipeline', label: 'Tab 4: Follow-up & Sales Pipeline' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSheetsTab(t.id as typeof sheetsTab)}
                  className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition cursor-pointer ${
                    sheetsTab === t.id
                      ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                      : 'border border-white/10 bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Assessment ID, business name, contact, WhatsApp number, package, or affiliate code..."
                className="w-full rounded-xl border border-white/15 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
              />
            </div>
          </div>

          {/* Assessment Cards / Table Rows */}
          <div className="space-y-3">
            {filteredAssessments.map((a) => (
              <div
                key={a.assessmentId}
                className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="rounded-lg bg-[#f5a524]/15 border border-[#f5a524]/40 px-2.5 py-1 font-mono text-xs font-bold text-[#f5a524]">
                      {a.assessmentId}
                    </span>
                    <strong className="font-display text-base text-white">{a.businessName}</strong>
                    <span className="text-xs text-white/60">({a.fullName} · {a.whatsappNumber})</span>
                    {a.claimed5PercentDiscount && (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                        5% Referral Discount ({a.affiliateCode})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        a.whatsappCtaClicked
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {a.whatsappCtaClicked ? 'WhatsApp Link Clicked' : 'WhatsApp Not Clicked Yet'}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase ${
                        a.syncStatus === 'synced'
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      Sheets: {a.syncStatus}
                    </span>
                  </div>
                </div>

                {/* Tab-specific detail view */}
                {sheetsTab === 'all' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-xl bg-black/30 p-3 space-y-1">
                      <span className="font-mono text-[10px] uppercase text-white/45 block">Business & Offer</span>
                      <p className="text-white/90"><strong>Sells:</strong> {a.whatBusinessSells}</p>
                      <p className="text-white/70"><strong>Entry:</strong> {a.entryPage} (Ch: {a.originalAcquisitionChannel})</p>
                      <p className="text-white/70"><strong>Heard via:</strong> {a.howDidYouHear}</p>
                    </div>
                    <div className="rounded-xl bg-black/30 p-3 space-y-1">
                      <span className="font-mono text-[10px] uppercase text-white/45 block">Current Marketing</span>
                      <p className="text-white/90"><strong>Frequency:</strong> {a.postingFrequency}</p>
                      <p className="text-white/70"><strong>Ad Spend:</strong> {a.monthlyAdSpendRange}</p>
                      <p className="text-white/70"><strong>Content Budget:</strong> {a.monthlyContentSpendRange}</p>
                    </div>
                    <div className="rounded-xl bg-black/30 p-3 space-y-1">
                      <span className="font-mono text-[10px] uppercase text-white/45 block">Challenges & Goal</span>
                      <p className="text-white/90"><strong>Goal:</strong> {a.primaryGoal}</p>
                      <p className="text-white/70"><strong>Challenges:</strong> {a.biggestChallenges.join('; ')}</p>
                    </div>
                    <div className="rounded-xl bg-black/30 p-3 space-y-1">
                      <span className="font-mono text-[10px] uppercase text-white/45 block">Recommendations</span>
                      <p className="text-[#f5a524] font-bold">{a.primaryRecommendedPackageName} ({a.currencyCode} {a.primaryRecommendedPrice.toLocaleString()})</p>
                      <p className="text-white/70"><strong>2nd:</strong> {a.secondaryPackageName}</p>
                      <p className="text-white/70">
                        Retainer Opp: <strong>{a.monthlyRetainerOpportunity ? 'Yes' : 'No'}</strong> · Mini-Series Opp: <strong>{a.aiMiniSeriesOpportunity ? 'Yes' : 'No'}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {sheetsTab === 'whatsapp' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl bg-black/30 p-3">
                      <span className="font-mono text-[10px] uppercase text-white/45 block">WhatsApp Contact</span>
                      <p className="text-sm font-bold text-white mt-0.5">{a.whatsappNumber}</p>
                      <p className="text-white/60">{a.email || 'No email provided'}</p>
                    </div>
                    <div className="rounded-xl bg-black/30 p-3">
                      <span className="font-mono text-[10px] uppercase text-white/45 block">WhatsApp Handoff Status</span>
                      <p className="text-white/90 mt-0.5">
                        CTA Clicked: <strong>{a.whatsappCtaClicked ? `Yes (${a.whatsappCtaClickedAt?.slice(0, 16).replace('T', ' ')})` : 'No'}</strong>
                      </p>
                      <p className="text-white/55 text-[11px] mt-0.5">
                        Note: Clicking WhatsApp opens the prefilled chat; mark as "Contacted" below once message is received.
                      </p>
                    </div>
                    <div className="rounded-xl bg-black/30 p-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/45 block">Recommended Offer</span>
                        <p className="font-bold text-[#f5a524]">{a.primaryRecommendedPackageName}</p>
                      </div>
                      <a
                        href={`https://wa.me/${a.whatsappNumber.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 font-display text-xs font-bold text-black"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Message Lead</span>
                      </a>
                    </div>
                  </div>
                )}

                {sheetsTab === 'recommendations' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-wrap gap-2">
                      {(Object.entries(a.categoryScores) as [ServiceCategoryKey, number][]).map(([cat, sc]) => (
                        <span key={cat} className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono">
                          {CATEGORY_LABELS[cat]}: <strong className="text-[#f5a524]">{sc} pts</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pipeline Stage & Sales Notes Controls (Always accessible in Tab 4 & All) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-white/50 mb-1">
                      Follow-Up & Sales Pipeline Stage
                    </label>
                    <select
                      value={a.leadStatus}
                      onChange={(e) =>
                        handlePipelineChange(a.assessmentId, { leadStatus: e.target.value as PipelineStage })
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#161b22] px-3 py-2 text-xs font-bold text-white focus:border-[#f5a524] focus:outline-none"
                    >
                      {PIPELINE_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-mono text-[10px] uppercase text-white/50 mb-1">
                      Sales Team Follow-Up Notes
                    </label>
                    <input
                      type="text"
                      defaultValue={a.salesNotes}
                      onBlur={(e) =>
                        handlePipelineChange(a.assessmentId, { salesNotes: e.target.value })
                      }
                      placeholder="Add call notes, WhatsApp reply status, or proposal details..."
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: QUIZ QUESTIONS & BRANCHING EDITOR (PART 12)
      ====================================================================== */}
      {subTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#121518] p-4">
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Interactive Quiz Questions (Reorder, Toggle, Edit Copy & Branching)
              </h3>
              <p className="text-xs text-white/55">
                Edit question wording, toggle required/optional or enabled state, reorder steps, or add new discovery questions.
              </p>
            </div>
            <button
              onClick={addCustomQuestion}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#f5a524]" />
              <span>Add Question</span>
            </button>
          </div>

          {draftConfig.questions.map((q, idx) => (
            <div key={q.id} className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-[#f5a524]/20 px-2.5 py-1 font-mono text-xs font-bold text-[#f5a524]">
                    Q{idx + 1} ({q.id})
                  </span>
                  <span className="font-mono text-xs uppercase text-white/50">
                    Type: {q.type}
                  </span>
                  {q.branchingRuleNote && (
                    <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[11px] text-purple-300">
                      Branching: {q.branchingRuleNote}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs text-white/75 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.enabled !== false}
                      onChange={(e) => updateQuestion(idx, { enabled: e.target.checked })}
                    />
                    <span>Enabled</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-white/75 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                    />
                    <span>Required</span>
                  </label>
                  {q.type !== 'contact' && (
                    <>
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, -1)}
                        className="rounded-lg border border-white/10 p-1.5 text-white/60 hover:text-white cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, 1)}
                        className="rounded-lg border border-white/10 p-1.5 text-white/60 hover:text-white cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      {q.id.startsWith('q_custom_') && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(idx)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-300 hover:bg-red-500/20 cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-white/50 mb-1">
                    Question Heading
                  </label>
                  <input
                    type="text"
                    value={q.title}
                    onChange={(e) => updateQuestion(idx, { title: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-[#f5a524] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase text-white/50 mb-1">
                    Supporting Subtitle
                  </label>
                  <input
                    type="text"
                    value={q.subtitle || ''}
                    onChange={(e) => updateQuestion(idx, { subtitle: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-[#f5a524] focus:outline-none"
                  />
                </div>
              </div>

              {q.options.length > 0 && (
                <div className="pt-2">
                  <p className="font-mono text-[10px] uppercase text-white/45 mb-2">
                    Answer Options ({q.options.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => {
                            const nextOpts = [...q.options];
                            nextOpts[oIdx] = { ...nextOpts[oIdx], label: e.target.value };
                            updateQuestion(idx, { options: nextOpts });
                          }}
                          className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white focus:border-[#f5a524] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 4: RECOMMENDATION WEIGHTS, WHATSAPP & GOOGLE SHEETS CONFIG
      ====================================================================== */}
      {subTab === 'engine' && (
        <div className="space-y-6">
          {/* Weighted Recommendation Engine Controls */}
          <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              1. Recommendation Engine Multipliers & Opportunity Thresholds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {(Object.keys(CATEGORY_LABELS) as ServiceCategoryKey[]).map((cat) => (
                <div key={cat} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">
                    {CATEGORY_LABELS[cat]}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="3"
                    value={draftConfig.recommendation.categoryMultipliers[cat] ?? 1.0}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        recommendation: {
                          ...prev.recommendation,
                          categoryMultipliers: {
                            ...prev.recommendation.categoryMultipliers,
                            [cat]: Number(e.target.value) || 1.0,
                          },
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-xs text-[#f5a524]"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">
                  Monthly Retainer Trigger Threshold (Score)
                </label>
                <input
                  type="number"
                  value={draftConfig.recommendation.retainerThreshold}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      recommendation: {
                        ...prev.recommendation,
                        retainerThreshold: Number(e.target.value) || 55,
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">
                  AI Mini-Series Trigger Threshold (Score)
                </label>
                <input
                  type="number"
                  value={draftConfig.recommendation.miniSeriesThreshold}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      recommendation: {
                        ...prev.recommendation,
                        miniSeriesThreshold: Number(e.target.value) || 55,
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">
                  High Budget Score Multiplier
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={draftConfig.recommendation.highBudgetBoost}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      recommendation: {
                        ...prev.recommendation,
                        highBudgetBoost: Number(e.target.value) || 1.2,
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Recommendation Explanations */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <p className="font-mono text-xs font-bold uppercase text-white/70">
                Personalised Recommendation Explanation Copy
              </p>
              {(Object.keys(CATEGORY_LABELS) as ServiceCategoryKey[]).map((cat) => (
                <div key={cat}>
                  <label className="block font-mono text-[10px] uppercase text-[#f5a524] mb-1">
                    {CATEGORY_LABELS[cat]} Explanation
                  </label>
                  <textarea
                    rows={2}
                    value={draftConfig.recommendation.explanations[cat] || ''}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        recommendation: {
                          ...prev.recommendation,
                          explanations: {
                            ...prev.recommendation.explanations,
                            [cat]: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-white/15 bg-black/40 p-3 text-xs text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Official WhatsApp Destination & Message Template */}
          <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              2. Official WhatsApp Conversion Destination & Prefilled Message Template
            </h3>
            <div>
              <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">
                Official Advibe WhatsApp Number (International digits, e.g. 2348012345678)
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full max-w-md rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm font-mono text-white"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">
                Prefilled WhatsApp Message Template
              </label>
              <textarea
                rows={10}
                value={draftConfig.whatsappTemplate}
                onChange={(e) =>
                  setDraftConfig((prev) => ({ ...prev, whatsappTemplate: e.target.value }))
                }
                className="w-full rounded-xl border border-white/15 bg-black/40 p-3.5 font-mono text-xs text-white leading-relaxed"
              />
            </div>
          </div>

          {/* Google Sheets Connectivity & Webhook Configuration */}
          <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              3. Google Sheets Synchronisation & Connectivity Test
            </h3>
            <p className="text-xs text-white/60">
              Every completed quiz is saved first to the primary database and synchronised across the 4 logical tabs of{' '}
              <strong className="text-white">{draftConfig.spreadsheetName}</strong>. No private service-account keys are exposed in frontend code.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">
                  Target Spreadsheet Name
                </label>
                <input
                  type="text"
                  value={draftConfig.spreadsheetName}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({ ...prev, spreadsheetName: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">
                  Google Apps Script Web App / Sheets Webhook URL
                </label>
                <input
                  type="url"
                  value={draftConfig.googleSheetsWebhookUrl}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({ ...prev, googleSheetsWebhookUrl: e.target.value }))
                  }
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestSheets}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Test Google Sheets Connectivity</span>
              </button>

              {connTestResult && (
                <p
                  className={`text-xs ${
                    connTestResult.ok ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {connTestResult.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
