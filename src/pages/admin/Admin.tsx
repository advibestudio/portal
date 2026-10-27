import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, FolderKanban, Globe, LogOut, ExternalLink,
  Clock, TrendingUp, Wallet, Lock, Download, Sparkles, GraduationCap,
  Flame, Menu, X, ChevronRight, Settings, Sliders, DollarSign,
  CheckCircle2, ArrowRight, BarChart3, AlertCircle, FileEdit, Check,
  Search, SlidersHorizontal, Layers, ShieldCheck, Zap, ArrowUpRight, Rocket
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmtMoney } from '@/lib/money';
import { LeadsView, ProjectsView } from './LeadsProjects';
import { ContentView } from './Content';
import { MarketsView } from './Markets';
import { CohortView } from './CohortView';
import { StudentsView } from './StudentsView';

export type PrimaryAdminTab =
  | 'analytics'
  | 'cohorts'
  | 'content'
  | 'pipeline'
  | 'more';

/* ---------- SIGN IN SCREEN ---------- */
function SignIn() {
  const { signIn, mode } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const err = await signIn(email, password);
    setBusy(false);
    if (err) setError(err);
  };

  const inputCls =
    'w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none';

  return (
    <div className="grid min-h-dvh place-items-center bg-[#0b0b0c] px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#121416] p-7 sm:p-8 shadow-2xl">
        <p className="font-display text-2xl tracking-tight text-white font-bold">
          AdVibe<span className="text-[#f5a524]">.</span>
        </p>
        <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50">
          <Lock className="h-3.5 w-3.5 text-[#f5a524]" /> Admin Portal
        </p>

        <div className="mt-7 space-y-3.5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1">Email</label>
            <input
              className={inputCls}
              placeholder="e.g. owner@advibe.studio"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1">Password</label>
            <input
              className={inputCls}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 min-h-[50px] w-full rounded-xl bg-[#f5a524] font-display text-sm font-bold uppercase tracking-wider text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 shadow-lg"
        >
          {busy ? 'Signing in…' : 'Sign in to Dashboard'}
        </button>

        {mode === 'demo' && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/50">
            <p className="font-semibold text-white/80">Demo Credentials:</p>
            <p className="mt-1 font-mono text-[11px]">Owner: owner@advibe.studio / owner2026</p>
            <p className="font-mono text-[11px]">Ops: ops@advibe.studio / ops2026</p>
            <p className="mt-1 text-[10px] text-white/35">Tap Sign In directly to enter.</p>
          </div>
        )}

        <a href="#/" className="mt-5 block text-center text-xs text-white/40 hover:text-white">
          ← Back to AdVibe Studios Website
        </a>
      </form>
    </div>
  );
}

/* ---------- ANALYTICS & OPERATIONAL OVERVIEW ---------- */
function AnalyticsView({
  goCohort,
  goStudents,
  goContent,
  goPipeline,
  goMarkets
}: {
  goCohort: () => void;
  goStudents: () => void;
  goContent: () => void;
  goPipeline: () => void;
  goMarkets: () => void;
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

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Store Synced
          </span>
        </div>
      </div>

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

/* ---------- REDESIGNED MOBILE-FIRST ADMIN SHELL ---------- */
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
    projects
  } = useStore();

  // Primary navigation tab
  const [tab, setTab] = useState<PrimaryAdminTab>('analytics');

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
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return (
    <div className="min-h-dvh bg-[#0b0b0c] text-white md:flex">
      {/* DESKTOP SIDEBAR (≥ 768px) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#0e1114] p-5 md:flex">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg tracking-tight font-bold">
              AdVibe<span className="text-[#f5a524]">.</span>{' '}
              <span className="text-[10px] font-mono text-white/40">ADMIN</span>
            </p>
            <p className="text-[11px] font-mono text-[#f5a524]">
              Cohort {activeCohort.cohortNumber} Active
            </p>
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav className="mt-7 flex-1 space-y-1">
          {/* Analytics */}
          <button
            onClick={() => handleTabSwitch('analytics')}
            className={`flex w-full min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
              tab === 'analytics'
                ? 'bg-[#f5a524]/15 text-[#f5a524] font-bold'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics & KPIs</span>
            </div>
          </button>

          {/* Cohort Management */}
          <button
            onClick={() => handleTabSwitch('cohorts')}
            className={`flex w-full min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
              tab === 'cohorts'
                ? 'bg-[#f5a524]/15 text-[#f5a524] font-bold'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Flame className="h-4 w-4" />
              <span>Cohort Management</span>
            </div>
            {pendingStudentsCount > 0 ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                {pendingStudentsCount} pending
              </span>
            ) : (
              <span className="rounded-full bg-[#f5a524]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#f5a524]">
                {confirmedPaidCount}/{activeCohort.seatCapacity || 100}
              </span>
            )}
          </button>

          {/* Content Control */}
          <button
            onClick={() => handleTabSwitch('content')}
            className={`flex w-full min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
              tab === 'content'
                ? 'bg-[#f5a524]/15 text-[#f5a524] font-bold'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4" />
              <span>Content Control</span>
            </div>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-white/50">
              CMS
            </span>
          </button>

          {/* Pipeline */}
          <button
            onClick={() => handleTabSwitch('pipeline')}
            className={`flex w-full min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
              tab === 'pipeline'
                ? 'bg-[#f5a524]/15 text-[#f5a524] font-bold'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4" />
              <span>Pipeline & CRM</span>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/60">
              {leads.length}
            </span>
          </button>

          {/* Settings & More */}
          <button
            onClick={() => handleTabSwitch('more')}
            className={`flex w-full min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
              tab === 'more'
                ? 'bg-[#f5a524]/15 text-[#f5a524] font-bold'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Settings & More</span>
            </div>
          </button>
        </nav>

        {/* Bottom Utility Links */}
        <div className="space-y-1.5 border-t border-white/10 pt-4">
          <a
            href="/advibe-studios-final.zip"
            download="advibe-studios-final.zip"
            className="flex min-h-[40px] items-center gap-2 rounded-xl bg-[#f5a524]/10 px-3.5 py-2 text-xs font-semibold text-[#f5a524] transition hover:bg-[#f5a524]/20"
          >
            <Download className="h-4 w-4" />
            <span>Download Source ZIP</span>
          </a>

          <a
            href="#/"
            className="flex min-h-[40px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs text-white/60 transition hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View Public Site</span>
          </a>

          <a
            href="#/training"
            className="flex min-h-[40px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs text-white/60 transition hover:text-white"
          >
            <Sparkles className="h-4 w-4 text-[#f5a524]" />
            <span>Training Portal</span>
          </a>
        </div>

        {/* User Card */}
        <div className="mt-4 border-t border-white/10 pt-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{session.name}</p>
            <p className="text-[10px] capitalize text-white/40">{session.role === 'owner' ? 'Super Admin' : 'Operations'}</p>
          </div>
          <button
            onClick={signOut}
            className="min-h-[36px] min-w-[36px] grid place-items-center rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-red-300"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR (Safe Area Friendly) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0e1114]/95 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2.5">
          <p className="font-display text-base font-bold text-white">
            AdVibe<span className="text-[#f5a524]">.</span>
          </p>
          <span className="rounded-full bg-[#f5a524]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#f5a524]">
            Cohort {activeCohort.cohortNumber}
          </span>
          <span className="font-mono text-[10px] text-white/50">
            {confirmedPaidCount}/{activeCohort.seatCapacity || 100}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#/"
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/70 active:scale-95"
            title="View live site"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={() => handleTabSwitch('more')}
            className={`grid h-9 w-9 place-items-center rounded-xl border border-white/15 ${
              tab === 'more' ? 'bg-[#f5a524] text-black' : 'bg-white/5 text-white/80'
            }`}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 px-4 pb-28 pt-4 sm:px-8 md:pb-12 md:pt-8 overflow-x-hidden">
        <div className="mx-auto max-w-5xl">
          {mode === 'demo' && (
            <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200 text-left">
              <strong>Demo mode active.</strong> Changes are saved to this browser's localStorage. Connect your Supabase keys anytime for live cloud sync.
            </div>
          )}

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
              {pipelineSubTab === 'projects' && <ProjectsView />}
            </div>
          )}

          {/* 5. MORE & SETTINGS */}
          {tab === 'more' && (
            <div className="space-y-6 text-left">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                  Platform Settings
                </span>
                <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
                  Settings & System Controls
                </h1>
                <p className="mt-1 text-xs text-white/50 sm:text-sm">
                  Configure multi-currency rates, export project data, and manage administrative session.
                </p>
              </div>

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

      {/* MOBILE BOTTOM NAVIGATION BAR (THUMB ZONE OPTIMIZED) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-[#0e1114]/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        {/* 1. Analytics */}
        <button
          onClick={() => handleTabSwitch('analytics')}
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold transition active:scale-95 ${
            tab === 'analytics' ? 'text-[#f5a524]' : 'text-white/50 hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Analytics</span>
        </button>

        {/* 2. Cohort Management */}
        <button
          onClick={() => handleTabSwitch('cohorts')}
          className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold transition active:scale-95 ${
            tab === 'cohorts' ? 'text-[#f5a524]' : 'text-white/50 hover:text-white'
          }`}
        >
          <Flame className="h-4 w-4" />
          <span>Cohorts</span>
          {pendingStudentsCount > 0 && (
            <span className="absolute top-1.5 right-4 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-[#0e1114]" />
          )}
        </button>

        {/* 3. Content Control */}
        <button
          onClick={() => handleTabSwitch('content')}
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold transition active:scale-95 ${
            tab === 'content' ? 'text-[#f5a524]' : 'text-white/50 hover:text-white'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Content</span>
        </button>

        {/* 4. Pipeline & CRM */}
        <button
          onClick={() => handleTabSwitch('pipeline')}
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold transition active:scale-95 ${
            tab === 'pipeline' ? 'text-[#f5a524]' : 'text-white/50 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Pipeline</span>
        </button>

        {/* 5. More / Settings */}
        <button
          onClick={() => handleTabSwitch('more')}
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold transition active:scale-95 ${
            tab === 'more' ? 'text-[#f5a524]' : 'text-white/50 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
