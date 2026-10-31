import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
   query,
} from 'firebase/firestore';
import {
  Activity,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Layers,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  auth,
  db,
  getFirestoreQuotaStats,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
  SPARK_DAILY_READ_LIMIT,
  trackFirestoreRead,
} from '@/firebase';
import { useStore, waLink } from '@/lib/store';
import { fmtMoney } from '@/lib/money';
import { loadAssessments, saveAssessments } from '@/lib/googleSheetsSync';
import type { BusinessAssessment, Lead, TrainingStudent } from '@/content/types';

interface Props {
  onNavigatePipeline: () => void;
  onNavigateQuiz: () => void;
  onNavigateAffiliates: () => void;
  onNavigateStudents: () => void;
}

export function RealtimeFirestoreSummaryWidget({
  onNavigatePipeline,
  onNavigateQuiz,
  onNavigateAffiliates,
  onNavigateStudents,
}: Props) {
  const { leads: storeLeads, students: storeStudents, content, refresh } = useStore();

  const [liveLeads, setLiveLeads] = useState<Lead[] | null>(null);
  const [liveAssessments, setLiveAssessments] = useState<BusinessAssessment[]>(() => loadAssessments());
  const [liveStudents, setLiveStudents] = useState<TrainingStudent[] | null>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState<boolean>(true);
  const [streamConnected, setStreamConnected] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeFeedTab, setActiveFeedTab] = useState<'strategy' | 'orders' | 'referrals'>('strategy');
  const [quotaStats, setQuotaStats] = useState(() => getFirestoreQuotaStats());

  // Attach real-time Firestore onSnapshot listeners when authenticated with Firebase Auth
  useEffect(() => {
    if (!isFirebaseConfigured || !realtimeEnabled || !auth.currentUser) {
      setStreamConnected(false);
      return;
    }

    let unsubLeads: (() => void) | undefined;
    let unsubAssessments: (() => void) | undefined;
    let unsubStudents: (() => void) | undefined;

    try {
      const leadsQuery = query(collection(db, 'leads'), limit(250));
      unsubLeads = onSnapshot(
        leadsQuery,
        (snapshot) => {
          trackFirestoreRead(Math.max(1, snapshot.docChanges().length));
          const docs = snapshot.docs.map((d) => d.data() as Lead);
          if (docs.length > 0) {
            setLiveLeads(
              docs.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            );
          }
          setStreamConnected(true);
          setLastSyncedAt(new Date().toLocaleTimeString());
          setQuotaStats(getFirestoreQuotaStats());
        },
        (error) => {
          setStreamConnected(false);
          try {
            handleFirestoreError(error, OperationType.LIST, 'leads');
          } catch {
            // Logged structured FirestoreErrorInfo
          }
        }
      );

      const assessmentsQuery = query(collection(db, 'assessments'), limit(250));
      unsubAssessments = onSnapshot(
        assessmentsQuery,
        (snapshot) => {
          trackFirestoreRead(Math.max(1, snapshot.docChanges().length));
          const docs = snapshot.docs.map((d) => d.data() as BusinessAssessment);
          if (docs.length > 0) {
            const sorted = docs.sort((a, b) =>
              (b.timestampSubmitted || '').localeCompare(a.timestampSubmitted || '')
            );
            setLiveAssessments(sorted);
            saveAssessments(sorted);
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
          setQuotaStats(getFirestoreQuotaStats());
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.LIST, 'assessments');
          } catch {
            // Logged structured FirestoreErrorInfo
          }
        }
      );

      const studentsQuery = query(collection(db, 'students'), limit(250));
      unsubStudents = onSnapshot(
        studentsQuery,
        (snapshot) => {
          trackFirestoreRead(Math.max(1, snapshot.docChanges().length));
          const docs = snapshot.docs.map((d) => d.data() as TrainingStudent);
          if (docs.length > 0) {
            setLiveStudents(docs);
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
          setQuotaStats(getFirestoreQuotaStats());
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.LIST, 'students');
          } catch {
            // Logged structured FirestoreErrorInfo
          }
        }
      );
    } catch (err) {
      console.warn('Realtime listener setup notice:', err);
    }

    return () => {
      if (unsubLeads) unsubLeads();
      if (unsubAssessments) unsubAssessments();
      if (unsubStudents) unsubStudents();
    };
  }, [realtimeEnabled]);

  // Combine Firestore live snapshots with store state so backup-password admins and instant local writes appear immediately
  const effectiveLeads = useMemo(() => {
    const map = new Map<string, Lead>();
    storeLeads.forEach((l) => map.set(l.id, l));
    (liveLeads || []).forEach((l) => map.set(l.id, l));
    return Array.from(map.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [storeLeads, liveLeads]);

  const effectiveStudents = useMemo(() => {
    const map = new Map<string, TrainingStudent>();
    storeStudents.forEach((s) => map.set(s.id, s));
    (liveStudents || []).forEach((s) => map.set(s.id, s));
    return Array.from(map.values());
  }, [storeStudents, liveStudents]);

  const symbolOf = (cur: string) =>
    content.countries.find((c) => c.currency === cur)?.symbol ?? `${cur} `;

  // 1. Total Orders & Commercial Bookings Metrics
  const orderMetrics = useMemo(() => {
    const totalOrders = effectiveLeads.filter((l) => l.leadType !== 'strategy-call').length;
    const paidOrders = effectiveLeads.filter((l) => l.paymentStatus === 'Paid');
    const depositOrders = effectiveLeads.filter((l) => l.paymentStatus === 'Deposit');
    const wonOrders = effectiveLeads.filter((l) => l.status === 'Won');

    const byCur = paidOrders.reduce<Record<string, number>>((acc, l) => {
      const cur = l.currency || 'NGN';
      acc[cur] = (acc[cur] || 0) + (l.finalPrice ?? l.price ?? 0);
      return acc;
    }, {});

    const formattedRevenue =
      Object.entries(byCur)
        .map(([cur, val]) => fmtMoney(val, { symbol: symbolOf(cur) }))
        .join(' · ') || '₦0';

    return {
      totalAllLeads: effectiveLeads.length,
      totalOrders,
      paidCount: paidOrders.length,
      depositCount: depositOrders.length,
      wonCount: wonOrders.length,
      formattedRevenue,
    };
  }, [effectiveLeads, content.countries]);

  // 2. Strategy Session Requests (from Strategy Modal leads + Service Discovery Quiz assessments)
  const strategyMetrics = useMemo(() => {
    const strategyLeads = effectiveLeads.filter(
      (l) =>
        l.leadType === 'strategy-call' ||
        l.bookingStatus === 'clicked' ||
        l.bookingStatus === 'confirmed' ||
        Boolean(l.challengeOrGoal) ||
        l.offerId === 'monthly-content' ||
        l.offerId === 'promotional-mini-series'
    );

    const confirmedBookings = strategyLeads.filter(
      (l) => l.bookingStatus === 'confirmed' || l.bookingStatus === 'clicked'
    );

    // Unified list of recent strategy requests combining StrategyModal leads and Quiz Assessments
    const combinedRequests = [
      ...strategyLeads.map((l) => ({
        id: l.id,
        ref: l.ref,
        name: l.name,
        business: l.business || l.industry || 'Brand Inquiry',
        whatsapp: l.whatsapp,
        email: l.email,
        service: l.offerName,
        goal: l.challengeOrGoal || l.product || 'Strategy Call Request',
        status:
          l.bookingStatus === 'confirmed'
            ? 'Calendar Confirmed'
            : l.bookingStatus === 'clicked'
            ? 'Calendar Opened'
            : l.status,
        date: l.date,
        source: 'Strategy Modal' as const,
        referralCode: l.referralCode,
      })),
      ...liveAssessments.map((a) => ({
        id: a.assessmentId,
        ref: a.assessmentId.slice(0, 10).toUpperCase(),
        name: a.fullName,
        business: a.businessName,
        whatsapp: a.whatsappNumber,
        email: a.email,
        service: a.recommendedServiceTitle,
        goal: a.biggestChallenge || a.additionalNotes || a.primaryGoal,
        status: a.whatsappCtaClicked ? 'WhatsApp Initiated' : 'Quiz Completed',
        date: (a.timestampSubmitted || '').slice(0, 10),
        source: 'Discovery Quiz' as const,
        referralCode: a.referralCode,
      })),
    ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return {
      totalStrategyRequests: combinedRequests.length,
      strategyLeadsCount: strategyLeads.length,
      quizAssessmentsCount: liveAssessments.length,
      confirmedBookingsCount: confirmedBookings.length,
      recentRequests: combinedRequests.slice(0, 6),
    };
  }, [effectiveLeads, liveAssessments]);

  // 3. Active Referrals & Partner Attribution Metrics
  const referralMetrics = useMemo(() => {
    const affiliates = content.affiliates || [];
    const activeAffiliates = affiliates.filter((a) => a.status === 'active');

    const referredLeads = effectiveLeads.filter(
      (l) => Boolean(l.referralCode) || Boolean(l.discountApplied)
    );
    const referredAssessments = liveAssessments.filter(
      (a) => Boolean(a.isReferred) || Boolean(a.referralCode)
    );
    const referredStudents = effectiveStudents.filter((s) => Boolean(s.referralCode));

    const totalReferredConversions =
      referredLeads.length + referredAssessments.length + referredStudents.length;

    const totalDiscountGiven = referredLeads.reduce(
      (sum, l) => sum + (l.discountAmount || 0),
      0
    );

    // Per-affiliate attribution summary
    const partnerRows = activeAffiliates.map((partner) => {
      const codeUpper = partner.code.trim().toUpperCase();
      const matchedLeads = effectiveLeads.filter(
        (l) => (l.referralCode || '').trim().toUpperCase() === codeUpper
      );
      const matchedQuiz = liveAssessments.filter(
        (a) => (a.referralCode || '').trim().toUpperCase() === codeUpper
      );
      const paidMatched = matchedLeads.filter((l) => l.paymentStatus === 'Paid');
      const revenueGenerated = paidMatched.reduce(
        (s, l) => s + (l.finalPrice ?? l.price ?? 0),
        0
      );
      const commissionEarned = Math.round(
        revenueGenerated * ((partner.commissionRatePercent || 10) / 100)
      );

      return {
        ...partner,
        leadsCount: matchedLeads.length,
        quizCount: matchedQuiz.length,
        paidCount: paidMatched.length,
        revenueGenerated,
        commissionEarned,
      };
    });

    return {
      activePartnersCount: activeAffiliates.length,
      totalPartnersCount: affiliates.length,
      totalReferredConversions,
      referredLeadsCount: referredLeads.length,
      referredQuizCount: referredAssessments.length,
      totalDiscountGiven,
      partnerRows,
    };
  }, [content.affiliates, effectiveLeads, liveAssessments, effectiveStudents]);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await refresh();
    setLiveAssessments(loadAssessments());
    setLastSyncedAt(new Date().toLocaleTimeString());
    setQuotaStats(getFirestoreQuotaStats());
    setIsRefreshing(false);
  };

  const readPct = Math.min(
    100,
    Math.round((quotaStats.readsToday / SPARK_DAILY_READ_LIMIT) * 100)
  );

  return (
    <section
      aria-label="Real-Time Firestore Summary Widget"
      className="rounded-3xl border border-[#f5a524]/30 bg-gradient-to-br from-[#13181d] via-[#0f1317] to-[#0b0e11] p-5 sm:p-7 shadow-2xl space-y-6"
    >
      {/* TOP BAR: LIVE FIRESTORE STATUS & CONTROLS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f5a524]/15 border border-[#f5a524]/30 text-[#f5a524]">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#f5a524]">
                FIRESTORE REAL-TIME COMMAND WIDGET
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                  streamConnected
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    streamConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  }`}
                />
                {streamConnected ? 'onSnapshot Live Stream' : 'Hybrid Store + Cache'}
              </span>
            </div>
            <p className="text-xs text-white/55 mt-0.5">
              Live metrics for orders, strategy call requests, and active affiliate referrals · Last updated{' '}
              <span className="font-mono text-white/80">{lastSyncedAt}</span>
            </p>
          </div>
        </div>

        {/* Controls: Live Stream Toggle & Manual Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setRealtimeEnabled((v) => !v)}
            className={`min-h-[38px] rounded-xl border px-3 py-1.5 font-mono text-[11px] font-semibold transition cursor-pointer ${
              realtimeEnabled
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-white/15 bg-white/5 text-white/60 hover:text-white'
            }`}
            title="Toggle real-time Firestore onSnapshot listeners"
          >
            {realtimeEnabled ? '● Live Listener: ON' : '○ Quota-Saver: Paused'}
          </button>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isRefreshing}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-xs font-bold text-white hover:border-[#f5a524] hover:text-[#f5a524] transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#f5a524]' : ''}`} />
            <span>{isRefreshing ? 'Syncing…' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY REAL-TIME KPI CARDS */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Orders & Revenue */}
        <div
          onClick={onNavigatePipeline}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigatePipeline()}
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#f5a524]/50 hover:bg-white/[0.05] transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/50">
              Total Orders & Leads
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#f5a524]/15 text-[#f5a524]">
              <Wallet className="h-4 w-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-white">
                {orderMetrics.totalAllLeads}
              </span>
              <span className="font-mono text-xs text-emerald-400 font-semibold">
                {orderMetrics.paidCount} Paid
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-[#f5a524] truncate">
              Rev: {orderMetrics.formattedRevenue}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] font-mono text-white/50">
            <span>{orderMetrics.depositCount} Deposit · {orderMetrics.wonCount} Won</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-white/40 group-hover:text-[#f5a524] transition" />
          </div>
        </div>

        {/* Card 2: Strategy Session Requests */}
        <div
          onClick={() => setActiveFeedTab('strategy')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveFeedTab('strategy')}
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#f5a524]/50 hover:bg-white/[0.05] transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/50">
              Strategy Session Requests
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
              <Calendar className="h-4 w-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-white">
                {strategyMetrics.totalStrategyRequests}
              </span>
              <span className="font-mono text-xs text-sky-400 font-semibold">
                {strategyMetrics.confirmedBookingsCount} Booked
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-white/60">
              {strategyMetrics.strategyLeadsCount} Call Leads · {strategyMetrics.quizAssessmentsCount} Quiz Briefs
            </p>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] font-mono text-sky-300">
            <span>View Recent Requests</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Card 3: Active Referrals & 5% Off */}
        <div
          onClick={onNavigateAffiliates}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigateAffiliates()}
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#f5a524]/50 hover:bg-white/[0.05] transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/50">
              Active Referrals
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Tag className="h-4 w-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-white">
                {referralMetrics.totalReferredConversions}
              </span>
              <span className="font-mono text-xs text-emerald-400 font-semibold">
                {referralMetrics.activePartnersCount} Active Partners
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-white/60">
              {referralMetrics.referredLeadsCount} Orders · {referralMetrics.referredQuizCount} Quiz Referrals
            </p>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] font-mono text-emerald-300">
            <span>
              5% Saved: ₦{referralMetrics.totalDiscountGiven.toLocaleString('en-US')}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Card 4: Firestore Quota & Sync Health */}
        <div
          onClick={onNavigateQuiz}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigateQuiz()}
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#f5a524]/50 hover:bg-white/[0.05] transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/50">
              Firestore Free-Tier Usage
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/15 text-purple-400">
              <Activity className="h-4 w-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-extrabold text-white">
                {quotaStats.readsToday.toLocaleString('en-US')}
              </span>
              <span className="font-mono text-[11px] text-emerald-400">
                {readPct}% of 50k/day
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#f5a524]"
                style={{ width: `${Math.max(2, readPct)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] font-mono text-white/50">
            <span>Writes: {quotaStats.writesToday} · Cache Hits: {quotaStats.cacheHitsToday}</span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* INTERACTIVE REAL-TIME ACTIVITY TABS */}
      <div className="rounded-2xl border border-white/10 bg-[#0b0e12]/90 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 bg-white/[0.02]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFeedTab('strategy')}
              className={`rounded-xl px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeFeedTab === 'strategy'
                  ? 'bg-[#f5a524] text-black shadow'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              Strategy Requests ({strategyMetrics.totalStrategyRequests})
            </button>
            <button
              type="button"
              onClick={() => setActiveFeedTab('orders')}
              className={`rounded-xl px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeFeedTab === 'orders'
                  ? 'bg-[#f5a524] text-black shadow'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              Recent Orders ({effectiveLeads.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFeedTab('referrals')}
              className={`rounded-xl px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeFeedTab === 'referrals'
                  ? 'bg-[#f5a524] text-black shadow'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              Active Referrals ({referralMetrics.activePartnersCount})
            </button>
          </div>

          <button
            type="button"
            onClick={
              activeFeedTab === 'strategy'
                ? onNavigateQuiz
                : activeFeedTab === 'orders'
                ? onNavigatePipeline
                : onNavigateAffiliates
            }
            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#f5a524] hover:underline cursor-pointer"
          >
            <span>Open Full Manager</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* TAB 1: RECENT STRATEGY SESSION REQUESTS */}
        {activeFeedTab === 'strategy' && (
          <div className="divide-y divide-white/5">
            {strategyMetrics.recentRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-white/50">
                No strategy session requests yet. Submissions from the Strategy Call modal and Discovery Quiz appear here in real time.
              </div>
            ) : (
              strategyMetrics.recentRequests.map((req) => (
                <div
                  key={`${req.source}-${req.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-sm font-bold text-white">
                        {req.name}
                      </span>
                      <span className="text-xs text-white/50">· {req.business}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          req.source === 'Discovery Quiz'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}
                      >
                        {req.source}
                      </span>
                      {req.referralCode && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                          REF: {req.referralCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/70 truncate">
                      <strong className="text-[#f5a524]">{req.service}:</strong> {req.goal}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/70">
                      {req.status}
                    </span>
                    <span className="font-mono text-[11px] text-white/40">{req.date}</span>
                    {req.whatsapp && (
                      <a
                        href={waLink(
                          req.whatsapp,
                          `Hi ${req.name}, this is AdVibe Studios following up on your ${req.service} strategy request.`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: RECENT ORDERS & COMMERCIAL LEADS */}
        {activeFeedTab === 'orders' && (
          <div className="divide-y divide-white/5">
            {effectiveLeads.slice(0, 6).map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#f5a524]">
                      {lead.ref}
                    </span>
                    <span className="font-display text-sm font-bold text-white">
                      {lead.name}
                    </span>
                    <span className="text-xs text-white/50">· {lead.business}</span>
                    {lead.referralCode && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                        5% REF: {lead.referralCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/65 truncate">
                    {lead.offerName} ·{' '}
                    <strong className="text-white">
                      {fmtMoney(lead.finalPrice ?? lead.price, {
                        symbol: symbolOf(lead.currency || 'NGN'),
                      })}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                      lead.paymentStatus === 'Paid'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : lead.paymentStatus === 'Deposit'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {lead.paymentStatus}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-white/70">
                    {lead.status}
                  </span>
                  <span className="font-mono text-[11px] text-white/40">{lead.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ACTIVE REFERRAL PARTNERS */}
        {activeFeedTab === 'referrals' && (
          <div className="divide-y divide-white/5">
            {referralMetrics.partnerRows.length === 0 ? (
              <div className="p-6 text-center text-xs text-white/50">
                No active referral partners configured yet.
              </div>
            ) : (
              referralMetrics.partnerRows.map((partner) => (
                <div
                  key={partner.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-lg bg-[#f5a524]/20 border border-[#f5a524]/40 px-2.5 py-0.5 font-mono text-xs font-bold text-[#f5a524]">
                        {partner.code}
                      </span>
                      <span className="font-display text-sm font-bold text-white">
                        {partner.name}
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 uppercase">
                        5% Client Discount · {partner.commissionRatePercent}% Comm
                      </span>
                    </div>
                    <p className="text-xs text-white/55 font-mono">
                      Link: ?ref={partner.code}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-xs shrink-0">
                    <div className="text-right">
                      <span className="block text-[10px] text-white/40 uppercase">Attributed</span>
                      <strong className="text-white">
                        {partner.leadsCount} orders · {partner.quizCount} quiz
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-white/40 uppercase">Commission</span>
                      <strong className="text-emerald-400">
                        ₦{partner.commissionEarned.toLocaleString('en-US')}
                      </strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
