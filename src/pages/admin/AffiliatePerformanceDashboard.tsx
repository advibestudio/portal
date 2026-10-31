import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  MousePointerClick,
  Percent,
  DollarSign,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Eye,
  X,
  Award,
  ArrowUpRight,
  BadgeCheck,
  HelpCircle,
  BarChart2,
  Calendar,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmtMoney } from '@/lib/money';
import type { AffiliatePartner, Lead } from '@/content/types';
import { DEFAULT_AFFILIATES, calculateAffiliateCommission } from '@/lib/referral';

interface AffiliateMetrics {
  affiliate: AffiliatePartner;
  clicks: number;
  totalLeads: number;
  wonLeads: number;
  paidLeads: number;
  leadConversionRate: number; // (totalLeads / clicks) * 100
  winConversionRate: number; // (wonLeads / clicks) * 100
  discountsClaimed: number;
  discountOptInRate: number; // (discountsClaimed / totalLeads) * 100
  totalDiscountAmount: number;
  grossRevenue: number;
  netRevenue: number;
  commissionEarned: number;
  attributedLeadsList: Lead[];
}

type SortField =
  | 'conversionRate'
  | 'clicks'
  | 'totalLeads'
  | 'discountsClaimed'
  | 'discountOptInRate'
  | 'commission'
  | 'revenue';

export function AffiliatePerformanceDashboard() {
  const { content, saveContent, leads, session } = useStore();

  const affiliates: AffiliatePartner[] = content.affiliates?.length
    ? content.affiliates
    : DEFAULT_AFFILIATES;

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');
  const [timeframe, setTimeframe] = useState<'all' | '30d' | '7d'>('all');
  const [sortField, setSortField] = useState<SortField>('conversionRate');
  const [sortAsc, setSortAsc] = useState(false);

  // Modal drilldown state
  const [selectedAffiliateMetrics, setSelectedAffiliateMetrics] = useState<AffiliateMetrics | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [simulatedClickSuccess, setSimulatedClickSuccess] = useState<string | null>(null);

  // Timeframe filter for leads
  const now = Date.now();
  const filteredLeadsByTime = useMemo(() => {
    if (timeframe === 'all') return leads;
    const days = timeframe === '30d' ? 30 : 7;
    const cutoff = now - days * 86400000;
    return leads.filter((l) => {
      const d = new Date(l.date).getTime();
      return isNaN(d) || d >= cutoff;
    });
  }, [leads, timeframe, now]);

  // Compute metrics per affiliate
  const affiliateMetricsList: AffiliateMetrics[] = useMemo(() => {
    return affiliates.map((aff) => {
      // Find all leads attributed to this affiliate
      const cleanCode = aff.code.toUpperCase();
      const affLeads = filteredLeadsByTime.filter((l) => {
        const matchesCode = l.referralCode && l.referralCode.toUpperCase() === cleanCode;
        const matchesId = l.affiliateId && l.affiliateId === aff.id;
        return matchesCode || matchesId;
      });

      const clicks = aff.clicks || 0;
      const totalLeads = affLeads.length;
      const wonLeads = affLeads.filter((l) => l.status === 'Won').length;
      const paidLeads = affLeads.filter((l) => l.paymentStatus === 'Paid').length;

      const leadConversionRate = clicks > 0 ? (totalLeads / clicks) * 100 : 0;
      const winConversionRate = clicks > 0 ? (wonLeads / clicks) * 100 : 0;

      // 5% Discount redemptions
      const discountsClaimedLeads = affLeads.filter((l) => l.discountClaimed);
      const discountsClaimed = discountsClaimedLeads.length;
      const discountOptInRate = totalLeads > 0 ? (discountsClaimed / totalLeads) * 100 : 0;

      // Total discount savings granted to this partner's referred customers
      const totalDiscountAmount = discountsClaimedLeads.reduce((acc, l) => {
        if (typeof l.discountAmount === 'number') return acc + l.discountAmount;
        // If discountAmount isn't recorded but discountClaimed is true and price > 0
        if (l.price > 0) return acc + Math.round(l.price * ((l.discountPercent || 5) / 100));
        return acc;
      }, 0);

      // Financials (calculated on won / paid orders)
      const wonOrPaidLeads = affLeads.filter((l) => l.status === 'Won' || l.paymentStatus === 'Paid');
      const grossRevenue = wonOrPaidLeads.reduce((acc, l) => acc + (l.price || 0), 0);
      const netRevenue = Math.max(0, grossRevenue - totalDiscountAmount);

      // 10% Commission governed on net received amount
      const commissionPercent = aff.commissionPercent || 10;
      const commissionEarned = Math.round(netRevenue * (commissionPercent / 100));

      return {
        affiliate: aff,
        clicks,
        totalLeads,
        wonLeads,
        paidLeads,
        leadConversionRate,
        winConversionRate,
        discountsClaimed,
        discountOptInRate,
        totalDiscountAmount,
        grossRevenue,
        netRevenue,
        commissionEarned,
        attributedLeadsList: affLeads,
      };
    });
  }, [affiliates, filteredLeadsByTime]);

  // Aggregate stats across all affiliates
  const aggregateMetrics = useMemo(() => {
    const totalClicks = affiliateMetricsList.reduce((acc, m) => acc + m.clicks, 0);
    const totalLeads = affiliateMetricsList.reduce((acc, m) => acc + m.totalLeads, 0);
    const totalWon = affiliateMetricsList.reduce((acc, m) => acc + m.wonLeads, 0);
    const overallConversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;

    const totalDiscountsClaimed = affiliateMetricsList.reduce((acc, m) => acc + m.discountsClaimed, 0);
    const overallDiscountOptInRate = totalLeads > 0 ? (totalDiscountsClaimed / totalLeads) * 100 : 0;
    const totalDiscountSavings = affiliateMetricsList.reduce((acc, m) => acc + m.totalDiscountAmount, 0);

    const totalGrossRevenue = affiliateMetricsList.reduce((acc, m) => acc + m.grossRevenue, 0);
    const totalCommissionLiability = affiliateMetricsList.reduce((acc, m) => acc + m.commissionEarned, 0);

    return {
      totalClicks,
      totalLeads,
      totalWon,
      overallConversionRate,
      totalDiscountsClaimed,
      overallDiscountOptInRate,
      totalDiscountSavings,
      totalGrossRevenue,
      totalCommissionLiability,
    };
  }, [affiliateMetricsList]);

  // Filtering & Sorting
  const filteredAndSortedList = useMemo(() => {
    let list = affiliateMetricsList;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.affiliate.name.toLowerCase().includes(q) ||
          m.affiliate.code.toLowerCase().includes(q) ||
          m.affiliate.email.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      list = list.filter((m) => m.affiliate.status === statusFilter);
    }

    // Sort
    return [...list].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortField) {
        case 'conversionRate':
          valA = a.leadConversionRate;
          valB = b.leadConversionRate;
          break;
        case 'clicks':
          valA = a.clicks;
          valB = b.clicks;
          break;
        case 'totalLeads':
          valA = a.totalLeads;
          valB = b.totalLeads;
          break;
        case 'discountsClaimed':
          valA = a.discountsClaimed;
          valB = b.discountsClaimed;
          break;
        case 'discountOptInRate':
          valA = a.discountOptInRate;
          valB = b.discountOptInRate;
          break;
        case 'commission':
          valA = a.commissionEarned;
          valB = b.commissionEarned;
          break;
        case 'revenue':
          valA = a.grossRevenue;
          valB = b.grossRevenue;
          break;
      }

      return sortAsc ? valA - valB : valB - valA;
    });
  }, [affiliateMetricsList, searchQuery, statusFilter, sortField, sortAsc]);

  // Copy referral link handler
  const getReferralUrl = (code: string) => {
    const baseUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : 'https://advibe.com/';
    return `${baseUrl}#/book-strategy-session?ref=${code}`;
  };

  const handleCopyLink = (code: string) => {
    const link = getReferralUrl(code);
    navigator.clipboard?.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Simulate / increment referral click
  const handleSimulateClick = async (affId: string, affCode: string) => {
    const updatedAffiliates = affiliates.map((a) => {
      if (a.id === affId) {
        return { ...a, clicks: (a.clicks || 0) + 1 };
      }
      return a;
    });

    await saveContent(
      { ...content, affiliates: updatedAffiliates },
      session?.name,
      `Tracked simulated click for affiliate ${affCode}`
    );

    setSimulatedClickSuccess(affCode);
    setTimeout(() => setSimulatedClickSuccess(null), 2500);
  };

  // Export CSV report
  const handleExportCSV = () => {
    const headers = [
      'Partner Name',
      'Affiliate Code',
      'Status',
      'Commission %',
      'Link Clicks (Usage)',
      'Attributed Leads',
      'Won Deals',
      'Conversion Rate %',
      '5% Discounts Claimed',
      'Discount Opt-in Rate %',
      'Discount Savings Granted (NGN)',
      'Gross Revenue Attributed (NGN)',
      'Net Commission Earned (NGN)',
    ];

    const rows = filteredAndSortedList.map((m) => [
      `"${m.affiliate.name.replace(/"/g, '""')}"`,
      m.affiliate.code,
      m.affiliate.status,
      `${m.affiliate.commissionPercent || 10}%`,
      m.clicks,
      m.totalLeads,
      m.wonLeads,
      `${m.leadConversionRate.toFixed(1)}%`,
      m.discountsClaimed,
      `${m.discountOptInRate.toFixed(1)}%`,
      m.totalDiscountAmount,
      m.grossRevenue,
      m.commissionEarned,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `advibe-affiliate-performance-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-7 text-left">
      {/* Header & Subtitle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#f5a524]/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#f5a524]">
              ANALYTICS & ATTRIBUTION INTELLIGENCE
            </span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
            Affiliate Performance Dashboard
          </h2>
          <p className="mt-1 text-xs text-white/60 sm:text-sm max-w-2xl">
            Real-time tracking of referral link usage, visitor-to-booking conversion rates, and 5% customer discount redemption statistics per partner.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Selector */}
          <div className="flex items-center rounded-xl border border-white/10 bg-[#121518] p-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setTimeframe('all')}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                timeframe === 'all' ? 'bg-[#f5a524] font-bold text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('30d')}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                timeframe === '30d' ? 'bg-[#f5a524] font-bold text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('7d')}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                timeframe === '7d' ? 'bg-[#f5a524] font-bold text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              7 Days
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex min-h-[42px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white active:scale-[0.98] transition shadow"
          >
            <Download className="h-3.5 w-3.5 text-[#f5a524]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* AGGREGATE KPI CARDS ROW */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        {/* 1. Link Usage / Clicks */}
        <div className="rounded-2xl border border-white/10 bg-[#121518] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50">
            <p className="text-[10px] font-mono uppercase tracking-wider">Referral Link Visits</p>
            <MousePointerClick className="h-4 w-4 text-[#f5a524]" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white">
            {aggregateMetrics.totalClicks.toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/50">
            <span>Avg {Math.round(aggregateMetrics.totalClicks / Math.max(1, affiliates.length))} clicks/partner</span>
          </div>
        </div>

        {/* 2. Attributed Leads */}
        <div className="rounded-2xl border border-white/10 bg-[#121518] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50">
            <p className="text-[10px] font-mono uppercase tracking-wider">Attributed Bookings</p>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white">
            {aggregateMetrics.totalLeads}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
            <span className="font-semibold">{aggregateMetrics.totalWon} closed/won deals</span>
          </div>
        </div>

        {/* 3. Overall Conversion Rate */}
        <div className="rounded-2xl border border-white/10 bg-[#121518] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50">
            <p className="text-[10px] font-mono uppercase tracking-wider">Conversion Rate</p>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-amber-300">
            {aggregateMetrics.overallConversionRate.toFixed(1)}%
          </p>
          <div className="mt-1 text-[11px] text-white/50">
            {aggregateMetrics.overallConversionRate >= 5 ? 'High converting funnel' : 'Standard benchmark'}
          </div>
        </div>

        {/* 4. 5% Discount Redemptions & Opt-in */}
        <div className="rounded-2xl border border-[#f5a524]/20 bg-[#f5a524]/5 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#f5a524]">
            <p className="text-[10px] font-mono uppercase tracking-wider font-semibold">5% Discounts Claimed</p>
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#f5a524]">
            {aggregateMetrics.totalDiscountsClaimed}{' '}
            <span className="text-xs font-mono font-normal text-white/60">
              ({aggregateMetrics.overallDiscountOptInRate.toFixed(0)}% opt-in)
            </span>
          </p>
          <div className="mt-1 text-[11px] text-amber-400/90 font-mono">
            ₦{aggregateMetrics.totalDiscountSavings.toLocaleString()} customer savings
          </div>
        </div>

        {/* 5. Net Commission Payable */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-[#121518] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50">
            <p className="text-[10px] font-mono uppercase tracking-wider">Commission Earned</p>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-emerald-400">
            ₦{aggregateMetrics.totalCommissionLiability.toLocaleString()}
          </p>
          <div className="mt-1 text-[11px] text-white/50">
            10% net of 5% discount
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-[#121518] p-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by partner name, code (ADV-...), or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/40 focus:border-[#f5a524] focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-white/50 hidden md:inline">Status:</span>
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                statusFilter === 'all' ? 'bg-[#f5a524] text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              All ({affiliates.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                statusFilter === 'active' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              Active ({affiliates.filter((a) => a.status === 'active').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('deactivated')}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                statusFilter === 'deactivated' ? 'bg-red-500 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              Deactivated
            </button>
          </div>
        </div>
      </div>

      {/* PERFORMANCE TABLE */}
      <div className="rounded-3xl border border-white/10 bg-[#121518] overflow-hidden shadow-2xl">
        <div className="border-b border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">
              Partner Conversion & Discount Breakdown
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Click any column header to sort. Click on an affiliate row to inspect their attributed client bookings.
            </p>
          </div>
          {simulatedClickSuccess && (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              <span>Simulated visit recorded for {simulatedClickSuccess} (+1 click)</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50 font-mono uppercase tracking-wider bg-white/[0.02]">
                <th className="py-3.5 px-4 font-semibold">Affiliate Partner</th>
                <th
                  onClick={() => handleToggleSort('clicks')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Link Visits</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('totalLeads')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Attributed Leads</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('conversionRate')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Conv. Rate</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('discountsClaimed')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>5% Redemptions</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('revenue')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Gross Revenue</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('commission')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Commission (10%)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAndSortedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/40">
                    No affiliate partners match your search query.
                  </td>
                </tr>
              ) : (
                filteredAndSortedList.map((m) => {
                  const { affiliate, clicks, totalLeads, wonLeads, leadConversionRate, discountsClaimed, discountOptInRate, totalDiscountAmount, grossRevenue, commissionEarned } = m;
                  const isCopied = copiedCode === affiliate.code;

                  return (
                    <tr
                      key={affiliate.id}
                      onClick={() => setSelectedAffiliateMetrics(m)}
                      className="hover:bg-white/[0.03] transition cursor-pointer group"
                    >
                      {/* 1. Partner Profile */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#f5a524]/20 to-amber-600/30 border border-[#f5a524]/30 flex items-center justify-center font-display text-xs font-bold text-[#f5a524]">
                            {affiliate.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white group-hover:text-[#f5a524] transition">
                                {affiliate.name}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${
                                  affiliate.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {affiliate.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/50">
                              <span className="font-mono font-bold text-[#f5a524]">{affiliate.code}</span>
                              <span>•</span>
                              <span>{affiliate.email || affiliate.whatsapp}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Link Visits / Clicks */}
                      <td className="py-4 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{clicks.toLocaleString()}</span>
                          <button
                            type="button"
                            title="Register a test click"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSimulateClick(affiliate.id, affiliate.code);
                            }}
                            className="opacity-0 group-hover:opacity-100 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70 hover:bg-[#f5a524] hover:text-black transition"
                          >
                            +1 test
                          </button>
                        </div>
                        <span className="text-[10px] text-white/40">Unique link visits</span>
                      </td>

                      {/* 3. Attributed Leads */}
                      <td className="py-4 px-4 font-mono">
                        <div className="text-sm font-bold text-white">
                          {totalLeads}{' '}
                          <span className="text-xs font-normal text-emerald-400">
                            ({wonLeads} won)
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40">Bookings recorded</span>
                      </td>

                      {/* 4. Conversion Rate */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-sm font-bold ${
                              leadConversionRate >= 10
                                ? 'text-emerald-400'
                                : leadConversionRate >= 5
                                ? 'text-[#f5a524]'
                                : 'text-white/70'
                            }`}
                          >
                            {leadConversionRate.toFixed(1)}%
                          </span>
                          {leadConversionRate >= 10 && (
                            <span className="rounded-full bg-emerald-500/20 p-0.5 text-emerald-400" title="Top converting partner">
                              <Award className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        {/* Mini visual bar */}
                        <div className="mt-1.5 h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#f5a524] to-emerald-400 rounded-full"
                            style={{ width: `${Math.min(100, leadConversionRate * 4)}%` }}
                          />
                        </div>
                      </td>

                      {/* 5. 5% Discount Redemptions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm font-bold text-amber-300">
                            {discountsClaimed}
                          </span>
                          <span className="text-[10px] font-mono text-white/50">
                            ({discountOptInRate.toFixed(0)}% claim rate)
                          </span>
                        </div>
                        <p className="mt-0.5 font-mono text-[10px] text-amber-400/80">
                          -₦{totalDiscountAmount.toLocaleString()} saved
                        </p>
                      </td>

                      {/* 6. Gross Revenue */}
                      <td className="py-4 px-4 font-mono">
                        <div className="text-sm font-bold text-white">
                          ₦{grossRevenue.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-white/40">From won orders</span>
                      </td>

                      {/* 7. Commission */}
                      <td className="py-4 px-4 font-mono">
                        <div className="text-sm font-bold text-emerald-400">
                          ₦{commissionEarned.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-white/40">
                          {affiliate.commissionPercent || 10}% on net received
                        </span>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-click copy link */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(affiliate.code)}
                            title="Copy partner referral link"
                            className="h-8 rounded-lg border border-white/10 bg-white/5 px-2.5 text-[11px] font-semibold text-white/80 hover:bg-white/10 active:scale-95 transition flex items-center gap-1"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-[#f5a524]" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          {/* View Drilldown */}
                          <button
                            type="button"
                            onClick={() => setSelectedAffiliateMetrics(m)}
                            title="View attributed leads breakdown"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLIANCE & ELIGIBILITY AUDIT NOTE */}
      <div className="rounded-2xl border border-white/10 bg-[#121518] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[#f5a524] mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Strict Referral Link & 5% Discount Attribution Rules Enforced
            </h4>
            <p className="text-xs text-white/60 leading-relaxed">
              In strict accordance with the updated promotion policy, the 5% first-time customer discount is <strong>only unlocked when a customer arrives through an active, approved affiliate referral URL</strong>. Selecting &quot;Friend or Referral&quot; or manually typing a code without a verified partner URL does not unlock the discount. All discount redemptions shown above have verified link origin.
            </p>
          </div>
        </div>
      </div>

      {/* DRILLDOWN MODAL / DRAWER */}
      {selectedAffiliateMetrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-[#121518] p-6 text-white shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#f5a524]/20 border border-[#f5a524]/40 flex items-center justify-center font-display font-bold text-[#f5a524]">
                  {selectedAffiliateMetrics.affiliate.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold uppercase tracking-wide">
                      {selectedAffiliateMetrics.affiliate.name}
                    </h3>
                    <span className="rounded-full bg-[#f5a524]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#f5a524]">
                      {selectedAffiliateMetrics.affiliate.code}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    {selectedAffiliateMetrics.affiliate.email} • {selectedAffiliateMetrics.affiliate.whatsapp}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAffiliateMetrics(null)}
                className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-white/10">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] font-mono text-white/40 uppercase">Referral Link Visits</p>
                <p className="mt-1 font-display text-xl font-bold text-white">
                  {selectedAffiliateMetrics.clicks}
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] font-mono text-white/40 uppercase">Conversion Rate</p>
                <p className="mt-1 font-display text-xl font-bold text-emerald-400">
                  {selectedAffiliateMetrics.leadConversionRate.toFixed(1)}%
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] font-mono text-white/40 uppercase">5% Discount Claims</p>
                <p className="mt-1 font-display text-xl font-bold text-amber-300">
                  {selectedAffiliateMetrics.discountsClaimed}{' '}
                  <span className="text-xs font-normal text-white/50">
                    ({selectedAffiliateMetrics.discountOptInRate.toFixed(0)}%)
                  </span>
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] font-mono text-white/40 uppercase">Net Commission</p>
                <p className="mt-1 font-display text-xl font-bold text-[#f5a524]">
                  ₦{selectedAffiliateMetrics.commissionEarned.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Attributed Leads List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white/70">
                  Attributed Client Bookings ({selectedAffiliateMetrics.attributedLeadsList.length})
                </h4>
                <div className="text-[11px] font-mono text-white/40">
                  Attribution: Affiliate Link ({selectedAffiliateMetrics.affiliate.code})
                </div>
              </div>

              {selectedAffiliateMetrics.attributedLeadsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40 rounded-2xl border border-white/5 bg-white/[0.02]">
                  No leads have been booked through this partner&apos;s link yet in this timeframe.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedAffiliateMetrics.attributedLeadsList.map((lead) => {
                    const math = calculateAffiliateCommission(
                      lead.price || 0,
                      lead.discountPercent || 5,
                      selectedAffiliateMetrics.affiliate.commissionPercent || 10,
                      Boolean(lead.discountClaimed)
                    );

                    return (
                      <div
                        key={lead.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 hover:border-[#f5a524]/30 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#f5a524]">
                              {lead.ref}
                            </span>
                            <span className="font-semibold text-white">{lead.name}</span>
                            {lead.business && (
                              <span className="text-xs text-white/50">({lead.business})</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                                lead.status === 'Won'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : lead.status === 'Qualified'
                                  ? 'bg-sky-500/20 text-sky-300'
                                  : 'bg-white/10 text-white/60'
                              }`}
                            >
                              {lead.status}
                            </span>
                            <span className="text-[11px] font-mono text-white/40">
                              {lead.date}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5 text-xs">
                          <div>
                            <span className="text-white/40 block text-[10px] font-mono uppercase">Package / Service</span>
                            <span className="text-white font-medium">{lead.offerName || 'Free Strategy Session'}</span>
                          </div>

                          <div>
                            <span className="text-white/40 block text-[10px] font-mono uppercase">5% Discount Status</span>
                            {lead.discountClaimed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                <Check className="h-3 w-3" />
                                <span>Claimed (-₦{(lead.discountAmount || math.discountAmount).toLocaleString()})</span>
                              </span>
                            ) : (
                              <span className="text-white/50">Not Claimed / Opted Out</span>
                            )}
                          </div>

                          <div>
                            <span className="text-white/40 block text-[10px] font-mono uppercase">Deal Financials</span>
                            <span className="font-mono text-white">
                              ₦{(lead.price || 0).toLocaleString()} gross
                              {lead.price > 0 && (
                                <span className="text-emerald-400 ml-1">
                                  (₦{math.affiliateCommission.toLocaleString()} comm)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
              <button
                type="button"
                onClick={() => handleCopyLink(selectedAffiliateMetrics.affiliate.code)}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
              >
                <Copy className="h-3.5 w-3.5 text-[#f5a524]" />
                <span>Copy Referral URL</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAffiliateMetrics(null)}
                className="rounded-xl bg-[#f5a524] px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 active:scale-[0.98] transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
