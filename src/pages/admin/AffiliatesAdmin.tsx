import React, { useState } from 'react';
import {
  Sparkles, Users, Link2, Copy, Check, Plus, ShieldCheck,
  AlertCircle, DollarSign, Calendar, Percent, RefreshCw,
  ExternalLink, CheckCircle2, Clock, Eye, ToggleLeft, ToggleRight,
  BarChart3, Activity
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmtMoney } from '@/lib/money';
import type { AffiliatePartner, ReferralDiscountSettings } from '@/content/types';
import {
  DEFAULT_AFFILIATES,
  DEFAULT_REFERRAL_SETTINGS,
  calculateAffiliateCommission,
} from '@/lib/referral';
import { AffiliatePerformanceDashboard } from './AffiliatePerformanceDashboard';
import { PromotionsAdmin } from './PromotionsAdmin';

const ALL_SERVICES = [
  { id: 'strategy', label: 'Free Strategy Session (Lead Qualification)' },
  { id: 'monthly-content', label: 'Monthly AI Video Content Retainer' },
  { id: 'promotional-mini-series', label: 'AI Promotional Mini Series' },
  { id: 'single-30', label: 'Single 30s Video' },
  { id: 'single-60', label: 'Single 60s Video' },
  { id: 'bundle-5', label: '5 Creative Test Pack' },
  { id: 'bundle-10', label: '10 High-Converting Creative Pack' },
  { id: 'monthly-studio', label: 'Monthly Studio Retainer' },
];

export function AffiliatesAdmin({ onNavigateToPromotions }: { onNavigateToPromotions?: () => void } = {}) {
  const { content, saveContent, leads, session } = useStore();

  const settings: ReferralDiscountSettings = content.referralSettings || DEFAULT_REFERRAL_SETTINGS;
  const affiliates: AffiliatePartner[] = content.affiliates?.length ? content.affiliates : DEFAULT_AFFILIATES;

  // View mode switcher: performance dashboard vs promotion settings vs partners
  const [viewMode, setViewMode] = useState<'performance' | 'settings' | 'partners'>('performance');

  // Local state for editable settings
  const [localSettings, setLocalSettings] = useState<ReferralDiscountSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Affiliate creation modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAff, setNewAff] = useState<{
    code: string;
    name: string;
    email: string;
    whatsapp: string;
    commissionPercent: number;
    status: 'active' | 'deactivated';
    approved: boolean;
  }>({
    code: '',
    name: '',
    email: '',
    whatsapp: '',
    commissionPercent: 10,
    status: 'active',
    approved: true,
  });
  const [addError, setAddError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Commission simulation calculator state
  const [simPrice, setSimPrice] = useState(200000);
  const [simDiscountPct, setSimDiscountPct] = useState(localSettings.discountPercent || 5);
  const [simCommPct, setSimCommPct] = useState(10);
  const [simHasDiscount, setSimHasDiscount] = useState(true);

  // Handlers for settings save
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsSuccess(false);

    const nextContent = {
      ...content,
      referralSettings: localSettings,
    };

    const err = await saveContent(nextContent, session?.name, 'Updated Referral & 5% Discount Promotion Settings');
    setSavingSettings(false);
    if (!err) {
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2500);
    }
  };

  // Toggle service inclusion in discount promotion
  const toggleService = (srvId: string) => {
    const cur = localSettings.eligibleServices || [];
    const next = cur.includes(srvId) ? cur.filter((x) => x !== srvId) : [...cur, srvId];
    setLocalSettings({ ...localSettings, eligibleServices: next });
  };

  // Add new affiliate partner
  const handleAddAffiliate = async () => {
    setAddError('');
    const code = newAff.code.trim().toUpperCase();
    if (!code || code.length < 3) {
      setAddError('Affiliate code must be at least 3 characters.');
      return;
    }
    if (!newAff.name.trim()) {
      setAddError('Please enter affiliate partner name.');
      return;
    }

    const cleanCode = code.startsWith('ADV-') ? code : `ADV-${code}`;
    const exists = affiliates.some((a) => a.code.toUpperCase() === cleanCode);
    if (exists) {
      setAddError(`Affiliate code ${cleanCode} is already assigned.`);
      return;
    }

    const partner: AffiliatePartner = {
      id: `aff-${Date.now()}`,
      code: cleanCode,
      name: newAff.name.trim(),
      email: newAff.email.trim(),
      whatsapp: newAff.whatsapp.trim(),
      commissionPercent: Number(newAff.commissionPercent) || 10,
      status: newAff.status,
      approved: newAff.approved,
      createdAt: new Date().toISOString().slice(0, 10),
      totalReferrals: 0,
      totalRevenue: 0,
    };

    const nextAffiliates = [partner, ...affiliates];
    const nextContent = {
      ...content,
      affiliates: nextAffiliates,
    };

    await saveContent(nextContent, session?.name, `Added Affiliate Partner: ${partner.code}`);
    setShowAddModal(false);
    setNewAff({
      code: '',
      name: '',
      email: '',
      whatsapp: '',
      commissionPercent: 10,
      status: 'active',
      approved: true,
    });
  };

  // Toggle affiliate active / deactivated status
  const handleToggleAffiliateStatus = async (affId: string) => {
    const nextAffiliates = affiliates.map((a) => {
      if (a.id === affId) {
        const nextStatus = a.status === 'active' ? ('deactivated' as const) : ('active' as const);
        return { ...a, status: nextStatus };
      }
      return a;
    });

    const nextContent = {
      ...content,
      affiliates: nextAffiliates,
    };

    await saveContent(nextContent, session?.name, `Updated Affiliate status (${affId})`);
  };

  // Toggle affiliate approved status
  const handleToggleAffiliateApproved = async (affId: string) => {
    const nextAffiliates = affiliates.map((a) => {
      if (a.id === affId) {
        return { ...a, approved: !a.approved };
      }
      return a;
    });

    const nextContent = {
      ...content,
      affiliates: nextAffiliates,
    };

    await saveContent(nextContent, session?.name, `Updated Affiliate approval (${affId})`);
  };

  // Generate public referral link
  const getReferralUrl = (code: string) => {
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://advibe.com/';
    return `${baseUrl}#/book-strategy-session?ref=${code}`;
  };

  const handleCopyLink = (code: string) => {
    const link = getReferralUrl(code);
    navigator.clipboard?.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Metrics
  const activeAffiliatesCount = affiliates.filter((a) => a.status === 'active' && a.approved).length;
  const referredLeads = leads.filter((l) => l.referralCode || l.referralSource === 'affiliate_link');
  const discountClaimedLeads = leads.filter((l) => l.discountClaimed);

  // Commission simulation math
  const simMath = calculateAffiliateCommission(simPrice, simDiscountPct, simCommPct, simHasDiscount);

  return (
    <div className="space-y-8 text-left">
      {/* Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#f5a524]/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#f5a524]">
              AFFILIATE & PROMOTION ENGINE
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
            Affiliate Tracking & 5% Referral Discount
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/60 max-w-2xl">
            Monitor partner conversion rates, track referral link usage, configure the exclusive 5% first-time discount, and manage commission payouts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex min-h-[46px] items-center gap-2 rounded-xl bg-[#f5a524] px-5 font-display text-xs font-bold uppercase tracking-wide text-black hover:brightness-110 active:scale-[0.98] transition shadow-lg w-fit"
        >
          <Plus className="h-4 w-4" /> Add Affiliate Partner
        </button>
      </div>

      {/* Subtab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setViewMode('performance')}
          className={`flex min-h-[44px] items-center gap-2.5 rounded-xl px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition ${
            viewMode === 'performance'
              ? 'bg-[#f5a524] text-black shadow-lg shadow-[#f5a524]/20'
              : 'border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Affiliate Performance Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onNavigateToPromotions) {
              onNavigateToPromotions();
            } else {
              setViewMode('settings');
            }
          }}
          className={`flex min-h-[44px] items-center gap-2.5 rounded-xl px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition ${
            viewMode === 'settings'
              ? 'bg-[#f5a524] text-black shadow-lg shadow-[#f5a524]/20'
              : 'border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>5% Discount Rules & Controls</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('partners')}
          className={`flex min-h-[44px] items-center gap-2.5 rounded-xl px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition ${
            viewMode === 'partners'
              ? 'bg-[#f5a524] text-black shadow-lg shadow-[#f5a524]/20'
              : 'border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Partner Directory & Commission ({affiliates.length})</span>
        </button>
      </div>

      {/* 1. PERFORMANCE DASHBOARD VIEW */}
      {viewMode === 'performance' && (
        <AffiliatePerformanceDashboard />
      )}

      {/* 2. PROMOTION SETTINGS VIEW */}
      {viewMode === 'settings' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">Active Partners</p>
              <p className="mt-1 font-display text-2xl font-bold text-white">
                {activeAffiliatesCount} <span className="text-xs font-normal text-white/40">/ {affiliates.length}</span>
              </p>
              <p className="mt-1 text-[11px] text-emerald-400">Approved & Active</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">Referred Leads</p>
              <p className="mt-1 font-display text-2xl font-bold text-[#f5a524]">
                {referredLeads.length}
              </p>
              <p className="mt-1 text-[11px] text-white/50">Via partner links & codes</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">Discounts Claimed</p>
              <p className="mt-1 font-display text-2xl font-bold text-amber-300">
                {discountClaimedLeads.length}
              </p>
              <p className="mt-1 text-[11px] text-amber-400/80">5% First-time Opt-ins</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">Standard Commission</p>
              <p className="mt-1 font-display text-2xl font-bold text-white">
                10%
              </p>
              <p className="mt-1 text-[11px] text-white/50">Governed on net received</p>
            </div>
          </div>

          {/* SECTION 1: PROMOTION & ELIGIBILITY SETTINGS (USER REQUIREMENT 6) */}
          <div className="rounded-3xl border border-white/10 bg-[#121518] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-[#f5a524]" />
            <div>
              <h2 className="font-display text-base font-bold uppercase tracking-wide text-white">
                5% Referral Discount Promotion Controls
              </h2>
              <p className="text-xs text-white/50">
                Rule: Valid Affiliate Link + Eligible First-Time Customer + Customer Opt-in = Discount.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-semibold text-white/80">Promotion Status:</span>
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, enabled: !localSettings.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.enabled ? 'bg-emerald-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-mono font-bold ${localSettings.enabled ? 'text-emerald-400' : 'text-white/40'}`}>
                {localSettings.enabled ? 'ACTIVE' : 'PAUSED'}
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Discount Percentage */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
              Discount Percentage (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="50"
                value={localSettings.discountPercent}
                onChange={(e) => setLocalSettings({ ...localSettings, discountPercent: Number(e.target.value) || 5 })}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#f5a524] focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-white/40">%</span>
            </div>
            <p className="mt-1 text-[11px] text-white/40">Default: 5% off first eligible paid project.</p>
          </div>

          {/* Referral Attribution Window */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
              Attribution Window (Days)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="365"
                value={localSettings.attributionWindowDays}
                onChange={(e) => setLocalSettings({ ...localSettings, attributionWindowDays: Number(e.target.value) || 30 })}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#f5a524] focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-white/40">days</span>
            </div>
            <p className="mt-1 text-[11px] text-white/40">Preserves referral cookie/storage duration.</p>
          </div>

          {/* Minimum Purchase Value */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
              Min Purchase Value (Optional)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0 (No minimum)"
              value={localSettings.minPurchaseValue || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, minPurchaseValue: Number(e.target.value) || 0 })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#f5a524] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-white/40">Minimum amount before discount applies.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-2 border-t border-white/5">
          {/* First-time customer eligibility toggle */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start gap-3">
            <input
              type="checkbox"
              id="first-time-toggle"
              checked={localSettings.firstTimeOnly}
              onChange={(e) => setLocalSettings({ ...localSettings, firstTimeOnly: e.target.checked })}
              className="mt-1 h-4 w-4 rounded accent-[#f5a524]"
            />
            <div>
              <label htmlFor="first-time-toggle" className="text-xs font-bold text-white uppercase tracking-wide cursor-pointer">
                Strict First-Time Customer Eligibility
              </label>
              <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                When enabled, the discount is strictly restricted to new clients who haven't previously placed a paid or won order.
              </p>
            </div>
          </div>

          {/* Promotion Expiry Date */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wide">
                Promotion Expiry Date
              </label>
              {localSettings.promotionExpiry && (
                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, promotionExpiry: null })}
                  className="text-[11px] text-red-400 hover:text-red-300 font-mono"
                >
                  Clear (Make Ongoing)
                </button>
              )}
            </div>
            <input
              type="date"
              value={localSettings.promotionExpiry ? localSettings.promotionExpiry.slice(0, 10) : ''}
              onChange={(e) => setLocalSettings({ ...localSettings, promotionExpiry: e.target.value || null })}
              className="w-full rounded-xl border border-white/15 bg-[#181d22] px-3 py-2 text-xs text-white focus:border-[#f5a524] focus:outline-none"
            />
            <p className="text-[11px] text-white/50">
              {localSettings.promotionExpiry
                ? `Expires on ${new Date(localSettings.promotionExpiry).toLocaleDateString()}`
                : 'No expiration date configured — promotion is active and ongoing.'}
            </p>
          </div>
        </div>

        {/* Eligible Services and Packages Checklist */}
        <div className="space-y-3 pt-2 border-t border-white/5">
          <label className="block text-xs font-mono uppercase tracking-wider text-white/60">
            Eligible Services & Packages for 5% Discount
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ALL_SERVICES.map((srv) => {
              const checked = (localSettings.eligibleServices || []).includes(srv.id);
              return (
                <label
                  key={srv.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
                    checked ? 'border-[#f5a524]/40 bg-[#f5a524]/10 text-white' : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleService(srv.id)}
                    className="h-4 w-4 rounded accent-[#f5a524]"
                  />
                  <span className="text-xs font-semibold">{srv.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-xs text-white/50">
            Changes take effect immediately across all public booking and order endpoints.
          </p>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="flex min-h-[46px] items-center gap-2 rounded-xl bg-[#f5a524] px-6 font-display text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 active:scale-[0.98] transition shadow-md disabled:opacity-50"
          >
            {savingSettings ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : settingsSuccess ? (
              <>
                <Check className="h-4 w-4" /> Settings Saved!
              </>
            ) : (
              'Save Promotion Settings'
            )}
          </button>
        </div>
      </div>
      </div>
      )}

      {/* 3. PARTNERS DIRECTORY & COMMISSION VIEW */}
      {viewMode === 'partners' && (
        <div className="space-y-8">
          {/* SECTION 2: APPROVED AFFILIATE PARTNERS DIRECTORY */}
          <div className="rounded-3xl border border-white/10 bg-[#121518] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[#f5a524]" />
            <div>
              <h2 className="font-display text-base font-bold uppercase tracking-wide text-white">
                Approved Affiliate Partners Directory
              </h2>
              <p className="text-xs text-white/50">
                Only active and approved partners generate valid referral links that unlock the 5% discount.
              </p>
            </div>
          </div>
        </div>

        {/* Affiliate Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50 font-mono uppercase tracking-wider">
                <th className="pb-3 font-semibold">Affiliate Code</th>
                <th className="pb-3 font-semibold">Partner Name</th>
                <th className="pb-3 font-semibold">Contact</th>
                <th className="pb-3 font-semibold">Commission</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Approval</th>
                <th className="pb-3 text-right font-semibold">Actions & Referral Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {affiliates.map((aff) => {
                const isCopied = copiedCode === aff.code;
                return (
                  <tr key={aff.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 font-mono font-bold text-[#f5a524]">
                      {aff.code}
                    </td>
                    <td className="py-3.5 font-semibold text-white">
                      {aff.name}
                    </td>
                    <td className="py-3.5 text-white/70">
                      <div>{aff.email || '—'}</div>
                      <div className="text-[11px] text-white/40">{aff.whatsapp || ''}</div>
                    </td>
                    <td className="py-3.5 font-mono text-white/80">
                      {aff.commissionPercent || 10}%
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                          aff.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {aff.status}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                          aff.approved
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {aff.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Copy Referral Link Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(aff.code)}
                          title="Copy unique referral link"
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 text-[11px] font-semibold text-white/80 hover:bg-white/10 active:scale-95 transition"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-[#f5a524]" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        {/* Test in New Tab */}
                        <a
                          href={getReferralUrl(aff.code)}
                          target="_blank"
                          rel="noreferrer"
                          title="Test landing link in new tab"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/5 text-white/60 hover:text-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>

                        {/* Toggle Status */}
                        <button
                          type="button"
                          onClick={() => handleToggleAffiliateStatus(aff.id)}
                          className={`rounded-lg px-2 py-1 text-[10px] font-mono font-bold uppercase border transition ${
                            aff.status === 'active'
                              ? 'border-red-500/30 text-red-300 hover:bg-red-500/10'
                              : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                          }`}
                        >
                          {aff.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: AFFILIATE COMMISSION CALCULATOR (USER REQUIREMENT 7) */}
      <div className="rounded-3xl border border-white/10 bg-[#121518] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <DollarSign className="h-5 w-5 text-[#f5a524]" />
          <div>
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-white">
              10% Commission Calculation on Net Received
            </h2>
            <p className="text-xs text-white/50">
              The 10% affiliate commission is governed separately when qualifying payment is received, calculated on net eligible amount after the 5% discount.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Interactive Calculator Inputs */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-white/70">
              Interactive Commission Calculator
            </p>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1">
                Gross Project Price (e.g. Monthly Retainer)
              </label>
              <input
                type="number"
                value={simPrice}
                onChange={(e) => setSimPrice(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/15 bg-[#181d22] px-4 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1">
                  Customer Discount %
                </label>
                <input
                  type="number"
                  value={simDiscountPct}
                  onChange={(e) => setSimDiscountPct(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/15 bg-[#181d22] px-4 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1">
                  Affiliate Commission %
                </label>
                <input
                  type="number"
                  value={simCommPct}
                  onChange={(e) => setSimCommPct(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/15 bg-[#181d22] px-4 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={simHasDiscount}
                onChange={(e) => setSimHasDiscount(e.target.checked)}
                className="h-4 w-4 rounded accent-[#f5a524]"
              />
              <span className="text-xs text-white/80">Apply customer's 5% first-time referral discount</span>
            </label>
          </div>

          {/* Result Calculation Output Card */}
          <div className="rounded-2xl border border-[#f5a524]/30 bg-[#f5a524]/5 p-5 space-y-4 flex flex-col justify-between">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                Net Settlement Breakdown
              </p>
              <div className="mt-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60">Gross Package Value:</span>
                  <span className="font-bold text-white">₦{simPrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60">Customer 5% Referral Discount:</span>
                  <span className="font-bold text-amber-400">
                    - ₦{simMath.discountAmount.toLocaleString()} ({simHasDiscount ? `${simDiscountPct}%` : '0%'})
                  </span>
                </div>

                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/80 font-bold">Net Eligible Amount Received:</span>
                  <span className="font-bold text-white text-sm">
                    ₦{simMath.netReceived.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-[#f5a524] font-bold">Affiliate 10% Commission:</span>
                  <span className="font-bold text-[#f5a524] text-base">
                    ₦{simMath.affiliateCommission.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-black/40 p-3 text-[11px] text-white/60 leading-relaxed font-mono">
              Note: Commission is paid upon receipt of verified client payment, based on net earnings excluding taxes.
            </div>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* MODAL: ADD AFFILIATE PARTNER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#121518] p-6 text-white shadow-2xl">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide">
              Add Approved Affiliate Partner
            </h3>
            <p className="mt-1 text-xs text-white/60">
              Creates a partner record with a unique referral link for tracking.
            </p>

            <div className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
                  Partner Code *
                </label>
                <input
                  placeholder="e.g. ADV-JOHN"
                  value={newAff.code}
                  onChange={(e) => setNewAff({ ...newAff, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
                  Full Name *
                </label>
                <input
                  placeholder="e.g. John Adebayo"
                  value={newAff.name}
                  onChange={(e) => setNewAff({ ...newAff, name: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
                  Email Address
                </label>
                <input
                  placeholder="e.g. john@partner.advibe.studio"
                  value={newAff.email}
                  onChange={(e) => setNewAff({ ...newAff, email: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
                  WhatsApp Number (with country code)
                </label>
                <input
                  placeholder="e.g. +2348012345678"
                  value={newAff.whatsapp}
                  onChange={(e) => setNewAff({ ...newAff, whatsapp: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
                    Commission %
                  </label>
                  <input
                    type="number"
                    value={newAff.commissionPercent}
                    onChange={(e) => setNewAff({ ...newAff, commissionPercent: Number(e.target.value) || 10 })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newAff.status}
                    onChange={(e) => setNewAff({ ...newAff, status: e.target.value as 'active' | 'deactivated' })}
                    className="w-full rounded-xl border border-white/15 bg-[#181d22] px-3 py-2.5 text-xs text-white focus:border-[#f5a524] focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
              </div>
            </div>

            {addError && (
              <p className="mt-3 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                {addError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddAffiliate}
                className="rounded-xl bg-[#f5a524] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 active:scale-[0.98] transition"
              >
                Save Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
