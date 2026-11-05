import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, FolderKanban, Globe, LogOut, ExternalLink,
  Clock, TrendingUp, Wallet, Lock, Download, Sparkles, GraduationCap,
  Flame, Menu, X, ChevronRight, Settings, Sliders, DollarSign,
  CheckCircle2, ArrowRight, BarChart3, AlertCircle, FileEdit, Check,
  Search, SlidersHorizontal, Layers, ShieldCheck, Zap, ArrowUpRight, Rocket,
  Tag, Percent
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmtMoney } from '@/lib/money';
import { LeadsView, ProjectsView } from './LeadsProjects';
import { ContentView } from './Content';
import { MarketsView } from './Markets';
import { CohortView } from './CohortView';
import { StudentsView } from './StudentsView';
import { AffiliatesAdmin } from './AffiliatesAdmin';
import { PromotionsAdmin } from './PromotionsAdmin';
import { QuizFunnelAdmin } from './QuizFunnelAdmin';
import { TeamAndSyncAdmin } from './TeamAndSyncAdmin';
import { RealtimeFirestoreSummaryWidget } from '@/components/admin/RealtimeFirestoreSummaryWidget';
import { SectionHeatmapWidget } from '@/components/admin/SectionHeatmapWidget';
import { SimpleTrafficSourcesWidget } from '@/components/admin/SimpleTrafficSourcesWidget';
import { ClientProjectsAdminView } from '@/components/admin/ClientProjectsAdminView';
import { PWAInstallButton, AdminNotificationToggle } from '@/lib/pwa';
import { ThemeToggleButton, AppQuickSwitcher } from '@/components/UnifiedAppNav';

export type PrimaryAdminTab =
  | 'analytics'
  | 'portal'
  | 'quiz'
  | 'cohorts'
  | 'content'
  | 'pipeline'
  | 'promotions'
  | 'affiliates'
  | 'team'
  | 'more';

/* ---------- SIGN IN SCREEN ---------- */
function SignIn() {
  const { signIn, signInWithGoogle } = useStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const err = await signIn(identifier, password);
    setBusy(false);
    if (err) setError(err);
  };

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    setError('');
    const err = await signInWithGoogle();
    setGoogleBusy(false);
    if (err) setError(err);
  };

  const inputCls =
    'w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none';

  return (
    <div className="grid min-h-dvh place-items-center bg-[#0b0b0c] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121416] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-2xl tracking-tight text-white font-bold">
            AdVibe<span className="text-[#f5a524]">.</span>
          </p>
          <a
            href="#/client-admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#f5a524]/40 bg-[#f5a524]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524] hover:bg-[#f5a524]/20 transition"
          >
            <span>Mobile Client App →</span>
          </a>
        </div>
        <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50">
          <Lock className="h-3.5 w-3.5 text-[#f5a524]" /> Co-Founder Super Admin Command Center
        </p>

        {/* CO-FOUNDER USERNAME & PASSWORD LOGIN */}
        <form onSubmit={submit} className="mt-6 space-y-3.5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
              Co-Founder Username or Email
            </label>
            <input
              className={inputCls}
              placeholder="enoch or esther (or email)"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
              Super Admin Password
            </label>
            <input
              className={inputCls}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 leading-relaxed">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || googleBusy}
            className="mt-2 min-h-[50px] w-full rounded-xl bg-[#f5a524] font-display text-sm font-bold uppercase tracking-wider text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 shadow-lg cursor-pointer"
          >
            {busy ? 'Signing in…' : 'Sign In as Super Admin'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">
            or connect google account
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleBusy || busy}
          className="min-h-[48px] w-full rounded-xl bg-white text-black font-display text-xs font-bold flex items-center justify-center gap-3 transition hover:bg-white/90 active:scale-[0.98] disabled:opacity-60 shadow-md cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>{googleBusy ? 'Connecting Google Account…' : 'Continue with Google'}</span>
        </button>

        {/* DUAL CO-FOUNDER SUPER ADMIN LOGINS */}
        <div className="mt-6 rounded-2xl border border-[#f5a524]/25 bg-[#f5a524]/[0.06] p-4 text-xs leading-relaxed text-white/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524]">
              Dual Co-Founder Super Admin Logins
            </p>
            <span className="font-mono text-[10px] text-white/40">Tap to autofill</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIdentifier('enoch');
                setPassword('advibe-enoch-2026');
              }}
              className="rounded-xl border border-[#f5a524]/30 bg-black/40 p-2.5 text-left hover:border-[#f5a524] transition cursor-pointer"
            >
              <p className="font-display text-xs font-bold text-white">Co-Founder 1 · Enoch</p>
              <p className="font-mono text-[10px] text-[#f5a524] mt-0.5">user: enoch</p>
              <p className="font-mono text-[10px] text-white/45">pass: advibe-enoch-2026</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier('esther');
                setPassword('advibe-esther-2026');
              }}
              className="rounded-xl border border-emerald-500/30 bg-black/40 p-2.5 text-left hover:border-emerald-400 transition cursor-pointer"
            >
              <p className="font-display text-xs font-bold text-white">Co-Founder 2 · Esther</p>
              <p className="font-mono text-[10px] text-emerald-400 mt-0.5">user: esther</p>
              <p className="font-mono text-[10px] text-white/45">pass: advibe-esther-2026</p>
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-xs text-white/45">
          <a href="#/" className="hover:text-white transition">
            ← Public Website
          </a>
          <a href="#/apps" className="text-[#f5a524] hover:underline font-mono text-[11px]">
            Download WebApps Hub →
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- ANALYTICS & OPERATIONAL OVERVIEW ---------- */
function AnalyticsView({
  goCohort,
  goStudents,
  goContent,
  goPipeline,
  goMarkets,
  goPromotions,
  goAffiliates,
  goQuiz,
}: {
  goCohort: () => void;
  goStudents: () => void;
  goContent: () => void;
  goPipeline: () => void;
  goMarkets: () => void;
  goPromotions: () => void;
  goAffiliates: () => void;
  goQuiz: () => void;
}) {
  const { leads, projects, students, activeCohort, confirmedPaidCount, session, content } = useStore();

  const symbolOf = (cur: string) => content.countries.find((c) => c.currency === cur)?.symbol ?? `${cur} `;
  
  // Agency revenue metrics
  const paidLeads = leads.filter((l) => l.paymentStatus === 'Paid');
  const byCur = paidLeads.reduce<Record<string, number>>((m, l) => {
    m[l.currency] = (m[l.currency] ?? 0) + l.price;
    return m;
  }, {});
  const agencyRevenue = Object.entries(byCur).map(([cur, v]) => fmtMoney(v, { symbol: symbolOf(cur) })).join(' · ') || '—';

  // Training revenue estimation
  const ngPrice = activeCohort.prices?.NG?.founding ?? 19997;
  const estimatedTrainingRev = fmtMoney(confirmedPaidCount * ngPrice, { symbol: '₦' });

  // Capacity calculations
  const cap = activeCohort.seatCapacity || 100;
  const pct = Math.min(100, Math.round((confirmedPaidCount / cap) * 100));
  const seatsRemaining = Math.max(0, cap - confirmedPaidCount);

  // Conversion calculations
  const pendingStudents = students.filter(
    (s) => s.cohortId === activeCohort.id && (s.status === 'registered' || s.status === 'payment_pending')
  );
  const studentConversionRate = students.length > 0 
    ? Math.round((confirmedPaidCount / students.length) * 100) 
    : 0;

  const wonLeadsCount = leads.filter((l) => l.status === 'Won').length;
  const leadCloseRate = leads.length > 0
    ? Math.round((wonLeadsCount / leads.length) * 100)
    : 0;

  return (
    <div className="space-y-6 text-left">
      {/* Header & Status */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
            Operational Analytics
          </span>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
            Performance Overview
          </h1>
          <p className="mt-1 text-xs text-white/50 sm:text-sm">
            Live metrics across the AI Cinematography cohort and agency video retainers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminNotificationToggle />
          <PWAInstallButton variant="admin" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Store Synced
          </span>
        </div>
      </div>

      {/* SIMPLE TRAFFIC SOURCES & GOOGLE SEARCH CONSOLE WIDGET */}
      <SimpleTrafficSourcesWidget />

      {/* REAL-TIME FIRESTORE SUMMARY WIDGET */}
      <RealtimeFirestoreSummaryWidget
        onNavigatePipeline={goPipeline}
        onNavigateQuiz={goQuiz}
        onNavigateAffiliates={goAffiliates}
        onNavigateStudents={goStudents}
      />

      {/* PAGE VIEW & SECTION DWELL-TIME HEATMAP ANALYTICS */}
      <SectionHeatmapWidget />

      {/* URGENT NEEDS ATTENTION QUEUE */}
      {pendingStudents.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
                  {pendingStudents.length} Student Payment{pendingStudents.length > 1 ? 's' : ''} Awaiting Verification
                </p>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  Registrations submitted via WhatsApp or checkout requiring manual approval.
                </p>
              </div>
            </div>
            <button
              onClick={goStudents}
              className="min-h-[44px] rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-1.5 shrink-0 shadow-md"
            >
              <span>Review Payments Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE COHORT LIVE CAPACITY BANNER */}
      <div className="rounded-3xl border border-white/15 bg-gradient-to-r from-[#181d22] to-[#121518] p-5 sm:p-7 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#f5a524]/20 px-3 py-1 font-mono text-[11px] font-bold text-[#f5a524]">
                ACTIVE COHORT #{activeCohort.cohortNumber}
              </span>
              <span className="font-mono text-xs text-white/50">{activeCohort.startDate} – {activeCohort.endDate}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{activeCohort.name}</h2>
            <p className="text-xs text-white/60">
              Confirmed Paid: <strong className="text-[#f5a524]">{confirmedPaidCount}</strong> of {cap} seats ({pct}% filled) · <strong className="text-white">{seatsRemaining}</strong> seats remaining
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goStudents}
              className="flex-1 sm:flex-none min-h-[48px] rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 active:scale-[0.98] transition"
            >
              Verify Students ({students.length})
            </button>
            <button
              onClick={goCohort}
              className="flex-1 sm:flex-none min-h-[48px] rounded-xl bg-[#f5a524] px-5 py-2.5 font-display text-xs font-bold uppercase text-black hover:brightness-110 active:scale-[0.98] transition shadow-lg"
            >
              Cohort Settings
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#f5a524] to-amber-300 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 4 CORE ANALYTICS STATS TILES */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={goStudents}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[#f5a524]/50 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <GraduationCap className="h-5 w-5 text-[#f5a524]" />
            <span className="font-mono text-[10px] text-emerald-400 font-bold">{pct}% Full</span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-white">{confirmedPaidCount}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-white/45">Confirmed Paid Seats</p>
        </button>

        <button
          onClick={goStudents}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[#f5a524]/50 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <Users className="h-5 w-5 text-amber-400" />
            <span className="font-mono text-[10px] text-amber-300 font-bold">{studentConversionRate}% Conv</span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-white">{students.length}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-white/45">Total Registered</p>
        </button>

        <button
          onClick={goPipeline}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[#f5a524]/50 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <span className="font-mono text-[10px] text-emerald-300 font-bold">{leadCloseRate}% Won</span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-white">{leads.length}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-white/45">Agency Client Leads</p>
        </button>

        <button
          onClick={goPipeline}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[#f5a524]/50 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <Wallet className="h-5 w-5 text-[#f5a524]" />
            <span className="font-mono text-[10px] text-white/40 font-bold">{paidLeads.length} Paid</span>
          </div>
          <p className="mt-3 font-display text-lg font-bold text-white truncate">{agencyRevenue}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-white/45">Agency Retainer Rev</p>
        </button>
      </div>

      {/* FINANCIAL & PIPELINE BREAKDOWN CARD */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#121518] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Revenue Breakdown
            </h3>
            <span className="font-mono text-xs text-[#f5a524]">Real Metrics</span>
          </div>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/60">Estimated Training Cohort:</span>
              <strong className="text-white font-bold">{estimatedTrainingRev}</strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/60">Agency Retainer Pipeline:</span>
              <strong className="text-[#f5a524] font-bold">{agencyRevenue}</strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/60">Active Client Projects:</span>
              <strong className="text-white">{projects.length} in production</strong>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-white/60">Student Conversion:</span>
              <strong className="text-emerald-400 font-bold">{studentConversionRate}% ({confirmedPaidCount}/{students.length})</strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121518] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Student Track Distribution
            </h3>
            <span className="font-mono text-xs text-white/40">Cohort 1</span>
          </div>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/60">🏢 Business Owners:</span>
              <strong className="text-white font-bold">
                {students.filter((s) => s.cohortId === activeCohort.id && s.track === 'business').length} students
              </strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/60">🎬 Creators & Filmmakers:</span>
              <strong className="text-white font-bold">
                {students.filter((s) => s.cohortId === activeCohort.id && s.track === 'creators').length} students
              </strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/60">Status: Verified Paid:</span>
              <strong className="text-emerald-400 font-bold">{confirmedPaidCount}</strong>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-white/60">Status: Pending Verification:</span>
              <strong className="text-amber-400 font-bold">{pendingStudents.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK SHORTCUTS & ACTION BAR */}
      <div className="rounded-2xl border border-white/10 bg-[#14181c] p-5">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white mb-3">
          Operational Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <button
            onClick={goCohort}
            className="min-h-[48px] flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs font-semibold text-white/80 hover:border-[#f5a524] hover:text-[#f5a524] active:scale-[0.98] transition"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-[#f5a524]" />
            <span>Launch Next Cohort</span>
          </button>
          <button
            onClick={goStudents}
            className="min-h-[48px] flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs font-semibold text-white/80 hover:border-[#f5a524] hover:text-[#f5a524] active:scale-[0.98] transition"
          >
            <Users className="h-4 w-4 shrink-0 text-[#f5a524]" />
            <span>Review Payments</span>
          </button>
          <button
            onClick={goContent}
            className="min-h-[48px] flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs font-semibold text-white/80 hover:border-[#f5a524] hover:text-[#f5a524] active:scale-[0.98] transition"
          >
            <Globe className="h-4 w-4 shrink-0 text-[#f5a524]" />
            <span>Edit Offers CMS</span>
          </button>
          <button
            onClick={goPromotions}
            className="min-h-[48px] flex items-center gap-2.5 rounded-xl border border-[#f5a524]/30 bg-[#f5a524]/10 p-3 text-left text-xs font-semibold text-[#f5a524] hover:bg-[#f5a524]/20 active:scale-[0.98] transition"
          >
            <Tag className="h-4 w-4 shrink-0 text-[#f5a524]" />
            <span>Promotions & 5% Off</span>
          </button>
          <button
            onClick={goAffiliates}
            className="min-h-[48px] flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs font-semibold text-white/80 hover:border-[#f5a524] hover:text-[#f5a524] active:scale-[0.98] transition"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-[#f5a524]" />
            <span>Affiliate Partners</span>
          </button>
          <button
            onClick={goMarkets}
            className="min-h-[48px] flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs font-semibold text-white/80 hover:border-[#f5a524] hover:text-[#f5a524] active:scale-[0.98] transition"
          >
            <DollarSign className="h-4 w-4 shrink-0 text-[#f5a524]" />
            <span>Multi-Currency</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- REDESIGNED GENERAL ADMIN COMMAND CENTER ---------- */
export default function Admin() {
  const {
    session,
    signOut,
    mode,
    syncError,
    clearSyncError,
    staffReady,
    initStaff,
    activeCohort,
    confirmedPaidCount,
    students,
    leads,
    projects,
    content
  } = useStore();

  // Primary navigation tab
  const [tab, setTab] = useState<PrimaryAdminTab>('analytics');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sub-segmented navigation states for grouped tasks
  const [cohortSubTab, setCohortSubTab] = useState<'active' | 'students'>('active');
  const [contentSubTab, setContentSubTab] = useState<'commercial' | 'site'>('commercial');
  const [pipelineSubTab, setPipelineSubTab] = useState<'leads' | 'projects'>('leads');

  useEffect(() => {
    initStaff();
  }, [initStaff]);

  if (!staffReady) {
    return <div className="grid min-h-dvh place-items-center bg-[#0b0b0c] text-sm text-white/50">Connecting…</div>;
  }
  if (!session) return <SignIn />;

  const pendingStudentsCount = students.filter(
    (s) => s.cohortId === activeCohort.id && (s.status === 'registered' || s.status === 'payment_pending')
  ).length;

  const handleTabSwitch = (newTab: PrimaryAdminTab) => {
    setTab(newTab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const TAB_META: Record<PrimaryAdminTab, { title: string; category: string }> = {
    analytics: { title: 'Analytics & Heatmaps', category: 'Overview' },
    portal: { title: 'Client Portal & Video Gates', category: 'Client Operations' },
    pipeline: { title: 'Leads & Production Pipeline', category: 'Client Operations' },
    quiz: { title: 'Quiz Funnel & Assessments', category: 'Client Operations' },
    affiliates: { title: 'Affiliate Partners & Codes', category: 'Growth & Affiliates' },
    promotions: { title: '5% Referral Promotions', category: 'Growth & Affiliates' },
    cohorts: { title: 'AI Academy Cohorts & Students', category: 'Academy & Website' },
    content: { title: 'Website & Sales Page CMS', category: 'Academy & Website' },
    team: { title: 'Co-Founders & Cloud Sync', category: 'System & Founders' },
    more: { title: 'Platform Settings & Currencies', category: 'System & Founders' },
  };

  return (
    <div className="min-h-dvh bg-[#0b0b0c] text-white md:flex">
      {/* DESKTOP SIDEBAR (≥ 768px) — CATEGORIZED & EASY TO NAVIGATE */}
      <aside className="hidden w-68 shrink-0 flex-col border-r border-white/10 bg-[#0e1114] p-5 md:flex">
        {/* Brand */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <p className="font-display text-lg tracking-tight font-bold">
              AdVibe<span className="text-[#f5a524]">.</span>{' '}
              <span className="text-[10px] font-mono text-white/40">COMMAND</span>
            </p>
            <p className="text-[11px] font-mono text-[#f5a524]">
              {session.username ? `@${session.username}` : session.name} · Super Admin
            </p>
          </div>
          <a
            href="#/client-admin"
            className="rounded-lg border border-[#f5a524]/40 bg-[#f5a524]/15 px-2.5 py-1 font-mono text-[10px] font-bold text-[#f5a524] hover:bg-[#f5a524]/25 transition"
            title="Open Mobile Client Manager App"
          >
            Mobile App
          </a>
        </div>

        {/* Categorized Navigation */}
        <nav className="mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
          {/* GROUP 1: OVERVIEW */}
          <div className="space-y-1">
            <p className="px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white/35">
              1 · Overview
            </p>
            <button
              onClick={() => handleTabSwitch('analytics')}
              className={`flex w-full min-h-[42px] items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                tab === 'analytics'
                  ? 'bg-[#f5a524] text-black font-bold shadow-md'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics & Heatmaps</span>
              </div>
            </button>
          </div>

          {/* GROUP 2: CLIENT OPERATIONS */}
          <div className="space-y-1">
            <p className="px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white/35">
              2 · Client Operations
            </p>
            <button
              onClick={() => handleTabSwitch('portal')}
              className={`flex w-full min-h-[42px] items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                tab === 'portal'
                  ? 'bg-[#f5a524] text-black font-bold shadow-md'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderKanban className="h-4 w-4" />
                <span>Client Portal & Videos</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                tab === 'portal' ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                GATE
              </span>
            </button>

            <button
              onClick={() => handleTabSwitch('pipeline')}
              className={`flex w-full min-h-[42px] items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                tab === 'pipeline'
                  ? 'bg-[#f5a524] text-black font-bold shadow-md'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                <span>Leads & Pipeline</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                tab === 'pipeline' ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-white/60'
              }`}>
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => handleTabSwitch('quiz')}
              className={`flex w-full min-h-[42px] items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                tab === 'quiz'
                  ? 'bg-[#f5a524] text-black font-bold shadow-md'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4" />
                <span>Quiz & Assessments</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                tab === 'quiz' ? 'bg-black/20 text-black' : 'bg-[#f5a524]/20 text-[#f5a524]'
              }`}>
                12 Qs
              </span>
            </button>
          </div>

          {/* GROUP 3: GROWTH & AFFILIATES */}
          <div className="space-y-1">
            <p className="px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white/35">
              3 · Growth & Affiliates
            </p>
            <button
              onClick={() => handleTabSwitch('affiliates')}
              className={`flex w-full min-h-[42px] items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                tab === 'affiliates'
                  ? 'bg-[#f5a524] text-black font-bold shadow-md'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4" />
                <span>Affiliate Partners</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                tab === 'affiliates' ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-white/60'
              }`}>
                {content.affiliates?.length ?? 0}
              </span>
            </button>

            <button
              onClick={() => handleTabSwitch('promotions')}
              className={`flex w-full min-h-[42px] items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                tab === 'promotions'
                  ? 'bg-[#f5a524] text-black font-bold shadow-md'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4" />
                <span>5% Referral Promos</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                tab === 'promotions' ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                5% OFF
              </span>
            </button>
          </div>

          {/* GROUP 4: ACADEMY & WEBSITE CMS */}
          <div className="space-y-1">
            <p className="px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white/35">
              4 · Academy & Website
            </p>
            <button
              onClick={() => handleTabSwitch('cohorts')}
              className={`flex w-full min-h-[42px] items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                tab === 'cohorts'
                  ? 'bg-[#f5a524] text-black font-bold shadow-md'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Flame className="h-4 w-4" />
                <span>Cohort & Students</span>
              </div>
              {pendingStudentsCount > 0 ? (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                  {pendingStudentsCount}
                </span>
              ) : (
                <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                  tab === 'cohorts' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'
                }`}>
                  {confirmedPaidCount}/{activeCohort.seatCapacity || 100}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabSwitch('content')}
              className={`flex w-full min-h-[42px] items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                tab === 'content'
                  ? 'bg-[#f5a524] text-black font-bold shadow-md'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4" />
                <span>Website & Sales CMS</span>
              </div>
            </button>
          </div>

          {/* GROUP 5: SYSTEM & CO-FOUNDERS */}
          <div className="space-y-1">
            <p className="px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white/35">
              5 · System & Founders
            </p>
            <button
              onClick={() => handleTabSwitch('team')}
              className={`flex w-full min-h-[42px] items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                tab === 'team'
                  ? 'bg-[#f5a524] text-black font-bold shadow-md'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4" />
                <span>Co-Founders & Cloud</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                tab === 'team' ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                SYNC
              </span>
            </button>

            <button
              onClick={() => handleTabSwitch('more')}
              className={`flex w-full min-h-[42px] items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                tab === 'more'
                  ? 'bg-[#f5a524] text-black font-bold shadow-md'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Settings & Currencies</span>
              </div>
            </button>
          </div>
        </nav>

        {/* Bottom WebApp Ecosystem Shortcuts */}
        <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
          <p className="px-2 font-mono text-[9px] font-bold uppercase tracking-widest text-white/35">
            WebApp Ecosystem
          </p>
          <a
            href="#/client-admin"
            className="flex min-h-[38px] items-center justify-between rounded-xl bg-[#f5a524]/15 border border-[#f5a524]/30 px-3 py-1.5 text-xs font-bold text-[#f5a524] transition hover:bg-[#f5a524]/25"
          >
            <span>Mobile Client Admin PWA</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <div className="grid grid-cols-2 gap-1.5">
            <a
              href="#/client-portal"
              className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/75 hover:bg-white/10 hover:text-white"
            >
              <span>Client App</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <a
              href="#/affiliate-portal"
              className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/75 hover:bg-white/10 hover:text-white"
            >
              <span>Affiliate App</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <a
            href="#/apps"
            className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white"
          >
            <Download className="h-3.5 w-3.5 text-[#f5a524]" />
            <span>WebApps Download Center</span>
          </a>
        </div>

        {/* User Card */}
        <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{session.name}</p>
            <p className="text-[10px] text-[#f5a524] font-mono">
              {session.username ? `@${session.username}` : session.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="min-h-[36px] min-w-[36px] grid place-items-center rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-red-300 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR (Safe Area Friendly) */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0e1114]/95 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/5 text-white active:scale-95"
              aria-label="Open admin menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-white truncate">
                {TAB_META[tab].title}
              </p>
              <p className="font-mono text-[10px] text-[#f5a524] truncate">
                {TAB_META[tab].category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <AppQuickSwitcher label="Apps" compact includeAdmin />
            <ThemeToggleButton compact />
            <a
              href="#/client-admin"
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#f5a524]/40 bg-[#f5a524]/15 px-2.5 font-mono text-[10px] font-bold text-[#f5a524]"
            >
              <span>Mobile App</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <a
              href="#/"
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/70 active:scale-95"
              title="View live site"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 px-4 pb-28 pt-4 sm:px-8 md:pb-12 md:pt-6 overflow-x-hidden">
        <div className="mx-auto max-w-5xl">
          {/* TOP ECOSYSTEM BAR — INSTANT ACCESS TO ALL WEBAPPS & DOWNLOAD PAGES */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121518] px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/45">
                {TAB_META[tab].category}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-white/30" />
              <span className="font-display font-bold text-white">{TAB_META[tab].title}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AppQuickSwitcher label="Navigate" includeAdmin />
              <ThemeToggleButton />
              <a
                href="#/client-admin"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#f5a524] px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-black hover:brightness-110 transition"
              >
                <span>Mobile Client Manager PWA</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="#/client-portal"
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-white/80 hover:bg-white/10 transition"
              >
                <span>Customer Portal</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
              <a
                href="#/affiliate-portal"
                className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-[11px] text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <span>Affiliate Portal</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
              <a
                href="#/apps"
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-white/80 hover:bg-white/10 transition"
              >
                <Download className="h-3 w-3 text-[#f5a524]" />
                <span>Download Apps</span>
              </a>
            </div>
          </div>

          {syncError && (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-200 text-left">
              <p><strong>Notice:</strong> {syncError}</p>
              <button onClick={clearSyncError} className="font-bold uppercase tracking-wider text-red-300 hover:text-white">
                Dismiss
              </button>
            </div>
          )}

          {/* 1. ANALYTICS VIEW */}
          {tab === 'analytics' && (
            <AnalyticsView
              goCohort={() => {
                setTab('cohorts');
                setCohortSubTab('active');
              }}
              goStudents={() => {
                setTab('cohorts');
                setCohortSubTab('students');
              }}
              goContent={() => {
                setTab('content');
                setContentSubTab('commercial');
              }}
              goPipeline={() => {
                setTab('pipeline');
                setPipelineSubTab('leads');
              }}
              goMarkets={() => {
                setTab('more');
              }}
              goPromotions={() => {
                handleTabSwitch('promotions');
              }}
              goAffiliates={() => {
                handleTabSwitch('affiliates');
              }}
              goQuiz={() => {
                handleTabSwitch('quiz');
              }}
            />
          )}

          {/* 2. COHORT MANAGEMENT HUB */}
          {tab === 'cohorts' && (
            <div className="space-y-6">
              {/* Segmented Sub-Navigation for Cohort Tasks */}
              <div className="flex rounded-2xl bg-white/5 p-1 border border-white/10">
                <button
                  onClick={() => setCohortSubTab('active')}
                  className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] ${
                    cohortSubTab === 'active'
                      ? 'bg-[#f5a524] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Active Cohort & Launch
                </button>
                <button
                  onClick={() => setCohortSubTab('students')}
                  className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 active:scale-[0.98] ${
                    cohortSubTab === 'students'
                      ? 'bg-[#f5a524] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>Students & Verification</span>
                  {pendingStudentsCount > 0 ? (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                      cohortSubTab === 'students' ? 'bg-black text-[#f5a524]' : 'bg-amber-500 text-black'
                    }`}>
                      {pendingStudentsCount}
                    </span>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                      cohortSubTab === 'students' ? 'bg-black text-[#f5a524]' : 'bg-white/10 text-white/60'
                    }`}>
                      {confirmedPaidCount}
                    </span>
                  )}
                </button>
              </div>

              {cohortSubTab === 'active' && <CohortView />}
              {cohortSubTab === 'students' && <StudentsView />}
            </div>
          )}

          {/* 3. CONTENT CONTROL HUB */}
          {tab === 'content' && (
            <div className="space-y-6">
              {/* Segmented Sub-Navigation for Content CMS */}
              <div className="flex rounded-2xl bg-white/5 p-1 border border-white/10">
                <button
                  onClick={() => setContentSubTab('commercial')}
                  className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] ${
                    contentSubTab === 'commercial'
                      ? 'bg-[#f5a524] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Commercial Offers (Retainer & Mini-Series)
                </button>
                <button
                  onClick={() => setContentSubTab('site')}
                  className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] ${
                    contentSubTab === 'site'
                      ? 'bg-[#f5a524] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Site Copy & Proof
                </button>
              </div>

              {contentSubTab === 'commercial' && (
                <ContentView role={session.role} actor={session.name} initialTab="Sales Pages & Offers" />
              )}
              {contentSubTab === 'site' && (
                <ContentView role={session.role} actor={session.name} initialTab="Hero" />
              )}
            </div>
          )}

          {/* 4. PIPELINE & CRM */}
          {tab === 'pipeline' && (
            <div className="space-y-6">
              {/* Segmented Sub-Navigation for Pipeline */}
              <div className="flex rounded-2xl bg-white/5 p-1 border border-white/10">
                <button
                  onClick={() => setPipelineSubTab('leads')}
                  className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] ${
                    pipelineSubTab === 'leads'
                      ? 'bg-[#f5a524] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Client Leads ({leads.length})
                </button>
                <button
                  onClick={() => setPipelineSubTab('projects')}
                  className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] ${
                    pipelineSubTab === 'projects'
                      ? 'bg-[#f5a524] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Production Projects ({projects.length})
                </button>
              </div>

              {pipelineSubTab === 'leads' && <LeadsView />}
              {pipelineSubTab === 'projects' && (
                <div className="space-y-8">
                  <ClientProjectsAdminView />
                  <ProjectsView />
                </div>
              )}
            </div>
          )}

          {/* 4.2 CLIENT PORTAL, PAYMENT GATES & GOOGLE DRIVE DELIVERABLES */}
          {tab === 'portal' && <ClientProjectsAdminView />}

          {/* 4.5 SERVICE DISCOVERY QUIZ, RECOMMENDATIONS & GOOGLE SHEETS HUB */}
          {tab === 'quiz' && <QuizFunnelAdmin />}

          {/* 5. PROMOTIONS & 5% DISCOUNT ELIGIBILITY */}
          {tab === 'promotions' && (
            <PromotionsAdmin onNavigateToAffiliates={() => handleTabSwitch('affiliates')} />
          )}

          {/* 6. AFFILIATES & PARTNERS */}
          {tab === 'affiliates' && (
            <AffiliatesAdmin onNavigateToPromotions={() => handleTabSwitch('promotions')} />
          )}

          {/* 6.5 TEAM ACCESS, FIREBASE & GOOGLE SHEETS SYNC */}
          {tab === 'team' && <TeamAndSyncAdmin />}

          {/* 7. MORE & SETTINGS */}
          {tab === 'more' && (
            <div className="space-y-6 text-left">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                  Platform Settings
                </span>
                <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
                  Settings, Team & Cloud Sync
                </h1>
                <p className="mt-1 text-xs text-white/50 sm:text-sm">
                  Manage Super Admins & Regular Admins, connect Google Sheets with Firebase, and configure multi-currency rates.
                </p>
              </div>

              <TeamAndSyncAdmin />

              {/* Markets & Pricing Section */}
              <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="h-5 w-5 text-[#f5a524]" />
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                      Multi-Currency Markets & Pricing
                    </h3>
                  </div>
                </div>
                <MarketsView />
              </div>

              {/* GitHub Pages Automated Deployment Card */}
              <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Rocket className="h-5 w-5 text-[#f5a524]" />
                    <div>
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                        GitHub Pages Deployment
                      </h3>
                      <p className="text-xs text-white/50 font-mono">
                        Workflow: .github/workflows/deploy.yml
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-semibold text-emerald-400 w-fit">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Automated CI/CD Ready
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2 text-xs font-mono text-white/80">
                  <p className="text-white/60"># Deploy script in package.json:</p>
                  <p className="text-[#f5a524] font-bold">npm run deploy</p>
                  <p className="text-white/60 pt-1"># Triggers on git push to main / master or manual workflow_dispatch.</p>
                  <p className="text-emerald-400/90 pt-1">✓ Resilient install enabled: works with or without package-lock.json</p>
                </div>

                <p className="text-xs text-white/60">
                  Every commit pushed to your GitHub repository automatically builds and publishes the live website to GitHub Pages with relative routing and 404 SPA fallback.
                </p>
              </div>

              {/* System & Downloads Card */}
              <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Download className="h-5 w-5 text-[#f5a524]" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                    Project Backup & Resources
                  </h3>
                </div>
                <p className="text-xs text-white/60">
                  Download the current project codebase, configured schemas, and assets archive.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/advibe-studios-final.zip"
                    download="advibe-studios-final.zip"
                    className="min-h-[44px] flex items-center gap-2 rounded-xl bg-[#f5a524] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 active:scale-[0.98] transition shadow-md"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Project ZIP</span>
                  </a>

                  <a
                    href="#/"
                    target="_blank"
                    className="min-h-[44px] flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 active:scale-[0.98] transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Public Agency Site</span>
                  </a>

                  <a
                    href="#/training"
                    target="_blank"
                    className="min-h-[44px] flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 active:scale-[0.98] transition"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#f5a524]" />
                    <span>Open Training Portal</span>
                  </a>
                </div>
              </div>

              {/* Account Card */}
              <div className="rounded-2xl border border-white/10 bg-[#121518] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-white/50">Signed in as</p>
                  <p className="font-display text-base font-bold text-white">{session.name} ({session.email})</p>
                  <p className="text-xs text-[#f5a524] capitalize font-mono mt-0.5">Role: {session.role === 'owner' ? 'Super Administrator' : 'Operations Staff'}</p>
                </div>
                <button
                  onClick={signOut}
                  className="min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-red-500/20 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/30 active:scale-[0.98] transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CATEGORIZED MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm md:hidden">
          <div className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-white/15 bg-[#11151a] p-5 pb-10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="font-display text-base font-bold text-white">
                  Admin Command Menu
                </p>
                <p className="font-mono text-[10px] text-[#f5a524]">
                  Signed in as {session.name} ({session.username ? `@${session.username}` : session.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Dedicated Mobile Client Manager PWA Banner */}
            <a
              href="#/client-admin"
              className="flex items-center justify-between rounded-2xl border border-[#f5a524]/40 bg-[#f5a524]/15 p-3.5 text-left"
            >
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524]">
                  Built for Mobile
                </p>
                <p className="font-display text-sm font-bold text-white mt-0.5">
                  Switch to Mobile Client Manager PWA
                </p>
                <p className="text-[11px] text-white/65">
                  Fast pocket view for Clients, Orders, Affiliates & Push Alerts
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-[#f5a524] shrink-0" />
            </a>

            {/* Categorized Sections */}
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { id: 'analytics', label: 'Analytics & Heatmaps', sub: 'Overview', icon: BarChart3 },
                  { id: 'portal', label: 'Client Portal & Videos', sub: 'Payment Gates', icon: FolderKanban },
                  { id: 'pipeline', label: `Leads & Pipeline (${leads.length})`, sub: 'CRM & Orders', icon: Users },
                  { id: 'affiliates', label: `Affiliates (${content.affiliates?.length ?? 0})`, sub: 'Partner Codes', icon: Sparkles },
                  { id: 'promotions', label: '5% Referral Promos', sub: 'Discounts', icon: Tag },
                  { id: 'quiz', label: 'Quiz & Assessments', sub: '12-Q Funnel', icon: Layers },
                  { id: 'cohorts', label: 'Academy & Students', sub: `Cohort #${activeCohort.cohortNumber}`, icon: Flame },
                  { id: 'content', label: 'Website & Sales CMS', sub: 'Copy & Proof', icon: Globe },
                  { id: 'team', label: 'Co-Founders & Cloud', sub: 'Logins & Purge', icon: ShieldCheck },
                  { id: 'more', label: 'Settings & Currencies', sub: 'Multi-Market', icon: SlidersHorizontal },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabSwitch(item.id)}
                    className={`flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left transition ${
                      active
                        ? 'border-[#f5a524] bg-[#f5a524] text-black'
                        : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-black' : 'text-[#f5a524]'}`} />
                    <div className="mt-2.5">
                      <p className="font-display text-xs font-bold leading-snug">{item.label}</p>
                      <p className={`font-mono text-[10px] mt-0.5 ${active ? 'text-black/70' : 'text-white/45'}`}>
                        {item.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Ecosystem Links */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
              <a
                href="#/portal"
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center font-mono text-[10px] font-bold text-white/80"
              >
                Customer App ↗
              </a>
              <a
                href="#/affiliate-portal"
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-center font-mono text-[10px] font-bold text-emerald-300"
              >
                Affiliate App ↗
              </a>
              <a
                href="#/apps"
                className="rounded-xl border border-[#f5a524]/30 bg-[#f5a524]/10 p-2.5 text-center font-mono text-[10px] font-bold text-[#f5a524]"
              >
                Download Hub ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CLEAN 5-ITEM MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#0e1114]/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => handleTabSwitch('analytics')}
          className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
            tab === 'analytics' ? 'text-[#f5a524]' : 'text-white/55 hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => handleTabSwitch('portal')}
          className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
            tab === 'portal' ? 'text-[#f5a524]' : 'text-white/55 hover:text-white'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          <span>Clients</span>
        </button>

        <button
          onClick={() => handleTabSwitch('pipeline')}
          className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
            tab === 'pipeline' ? 'text-[#f5a524]' : 'text-white/55 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Leads</span>
        </button>

        <button
          onClick={() => handleTabSwitch('affiliates')}
          className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
            tab === 'affiliates' ? 'text-[#f5a524]' : 'text-white/55 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Affiliates</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
            mobileMenuOpen || !['analytics', 'portal', 'pipeline', 'affiliates'].includes(tab)
              ? 'text-[#f5a524]'
              : 'text-white/55 hover:text-white'
          }`}
        >
          <Menu className="h-4 w-4" />
          <span>All Tools</span>
        </button>
      </nav>
    </div>
  );
}
