import React, { useState } from 'react';
import {
  Tag, Sparkles, CheckCircle2, Clock, ShieldCheck, AlertCircle,
  DollarSign, Percent, Calendar, Check, Save, RefreshCw,
  Layers, Info, ArrowUpRight, ArrowRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmtMoney } from '@/lib/money';
import type { ReferralDiscountSettings } from '@/content/types';
import {
  DEFAULT_REFERRAL_SETTINGS,
  calculateAffiliateCommission,
} from '@/lib/referral';

interface ServicePackageOption {
  id: string;
  name: string;
  category: 'Strategy' | 'Retainer' | 'Mini-Series' | 'Single' | 'Bundle';
  description: string;
  defaultPrice: number;
  currency: string;
}

export const AVAILABLE_SERVICE_PACKAGES: ServicePackageOption[] = [
  {
    id: 'strategy',
    name: 'Free Strategy Session (Discovery & Qualification)',
    category: 'Strategy',
    description: 'Initial consultation booking where 5% referral discount attribution is first unlocked and recorded.',
    defaultPrice: 0,
    currency: 'NGN',
  },
  {
    id: 'monthly-content',
    name: 'Monthly AI Video Content Retainer',
    category: 'Retainer',
    description: '15 cinematic AI video assets per month with recurring growth pipeline and rapid turnarounds.',
    defaultPrice: 250000,
    currency: 'NGN',
  },
  {
    id: 'promotional-mini-series',
    name: 'AI Promotional Mini Series',
    category: 'Mini-Series',
    description: '15-part narrative episodic campaign built specifically for high-impact social and commercial launches.',
    defaultPrice: 300000,
    currency: 'NGN',
  },
  {
    id: 'single-30',
    name: 'Single 30s High-Converting Video',
    category: 'Single',
    description: 'Targeted short-form video creative engineered for TikTok, Reels, and YouTube Shorts ads.',
    defaultPrice: 45000,
    currency: 'NGN',
  },
  {
    id: 'single-60',
    name: 'Single 60s Brand Storytelling Video',
    category: 'Single',
    description: 'Detailed brand story video with custom scriptwriting, voiceover, and visual effects.',
    defaultPrice: 75000,
    currency: 'NGN',
  },
  {
    id: 'bundle-5',
    name: '5 Creative Test Pack',
    category: 'Bundle',
    description: 'Batch of 5 distinct hooks and angles to rapidly test audience engagement and ROAS.',
    defaultPrice: 120000,
    currency: 'NGN',
  },
  {
    id: 'bundle-10',
    name: '10 High-Converting Creative Pack',
    category: 'Bundle',
    description: 'Comprehensive 10-video omnichannel creative asset library with varied messaging angles.',
    defaultPrice: 185000,
    currency: 'NGN',
  },
];

const PRESET_ATTRIBUTION_DAYS = [7, 14, 30, 60, 90];

export function PromotionsAdmin({ onNavigateToAffiliates }: { onNavigateToAffiliates?: () => void }) {
  const { content, saveContent, leads, session } = useStore();

  const currentSettings: ReferralDiscountSettings = content.referralSettings || DEFAULT_REFERRAL_SETTINGS;

  const [settings, setSettings] = useState<ReferralDiscountSettings>({
    ...DEFAULT_REFERRAL_SETTINGS,
    ...currentSettings,
    eligibleServices: currentSettings.eligibleServices || DEFAULT_REFERRAL_SETTINGS.eligibleServices,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Interactive Simulator state
  const [simServiceId, setSimServiceId] = useState<string>('monthly-content');
  const [customSimPrice, setCustomSimPrice] = useState<number>(250000);

  const selectedSimPackage = AVAILABLE_SERVICE_PACKAGES.find((p) => p.id === simServiceId) || AVAILABLE_SERVICE_PACKAGES[1];
  const isSimPackageEligible = (settings.eligibleServices || []).includes(selectedSimPackage.id);

  // Simulation calculations
  const simPrice = customSimPrice > 0 ? customSimPrice : selectedSimPackage.defaultPrice;
  const simResults = calculateAffiliateCommission(
    simPrice,
    settings.discountPercent || 5,
    10, // Standard 10% affiliate commission
    settings.enabled && isSimPackageEligible
  );

  // Stats from live leads
  const referredLeads = leads.filter((l) => l.referralCode || l.affiliateId || l.howDidYouHear === 'Advibe Affiliate Partner Link');
  const discountClaimedLeads = leads.filter((l) => l.discountClaimed);

  // Toggle individual service eligibility
  const toggleService = (srvId: string) => {
    const cur = settings.eligibleServices || [];
    const updated = cur.includes(srvId)
      ? cur.filter((x) => x !== srvId)
      : [...cur, srvId];
    setSettings({ ...settings, eligibleServices: updated });
  };

  // Bulk actions
  const selectAllServices = () => {
    setSettings({
      ...settings,
      eligibleServices: AVAILABLE_SERVICE_PACKAGES.map((s) => s.id),
    });
  };

  const selectRetainersAndBundles = () => {
    setSettings({
      ...settings,
      eligibleServices: AVAILABLE_SERVICE_PACKAGES
        .filter((s) => ['Retainer', 'Mini-Series', 'Bundle'].includes(s.category))
        .map((s) => s.id),
    });
  };

  const clearAllServices = () => {
    setSettings({ ...settings, eligibleServices: [] });
  };

  const resetToDefaults = () => {
    setSettings({ ...DEFAULT_REFERRAL_SETTINGS });
  };

  // Save changes to persistent content store
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const nextContent = {
      ...content,
      referralSettings: settings,
    };

    const err = await saveContent(
      nextContent,
      session?.name,
      `Updated Promotion Settings: ${settings.enabled ? 'Active' : 'Paused'}, ${settings.attributionWindowDays}d window, ${settings.eligibleServices.length} eligible packages`
    );

    setSaving(false);
    if (!err) {
      setSaveSuccess(true);
      setSaveMessage('Promotions configuration successfully saved to system state!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveMessage(`Failed to save settings: ${err}`);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#f5a524]/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#f5a524]">
              PROMOTIONS & DISCOUNT GOVERNANCE
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold flex items-center gap-1.5 ${
                settings.enabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${settings.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {settings.enabled ? 'PROMOTION ACTIVE' : 'PROMOTION PAUSED'}
            </span>
          </div>

          <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
            Referral Discount & Package Eligibility
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/60 max-w-2xl">
            Control the exclusive 5% affiliate referral discount, set the attribution window duration in days, and define which service packages qualify for discounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToAffiliates && (
            <button
              type="button"
              onClick={onNavigateToAffiliates}
              className="flex min-h-[46px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 font-display text-xs font-bold uppercase tracking-wide text-white/80 hover:bg-white/10 active:scale-[0.98] transition"
            >
              <span>Affiliate Partners & Performance</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex min-h-[46px] items-center gap-2 rounded-xl bg-[#f5a524] px-6 font-display text-xs font-bold uppercase tracking-wide text-black hover:brightness-110 active:scale-[0.98] transition shadow-lg shadow-[#f5a524]/20 disabled:opacity-60"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Promotion Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success / Info Toast */}
      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">Promotion Status</p>
          <p className={`mt-1 font-display text-xl sm:text-2xl font-bold ${settings.enabled ? 'text-emerald-400' : 'text-red-400'}`}>
            {settings.enabled ? 'Active (5% OFF)' : 'Disabled'}
          </p>
          <p className="mt-1 text-[11px] text-white/50">
            {settings.enabled ? 'Available to referred visitors' : 'Hidden from checkout'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">Attribution Window</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#f5a524]">
            {settings.attributionWindowDays} <span className="text-xs font-normal text-white/40">days</span>
          </p>
          <p className="mt-1 text-[11px] text-white/50">Cookie/Storage tracking lifetime</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">Eligible Packages</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
            {settings.eligibleServices?.length || 0}{' '}
            <span className="text-xs font-normal text-white/40">/ {AVAILABLE_SERVICE_PACKAGES.length}</span>
          </p>
          <p className="mt-1 text-[11px] text-white/50">Qualifying commercial offers</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121518] p-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">Discounts Claimed</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-amber-300">
            {discountClaimedLeads.length}{' '}
            <span className="text-xs font-normal text-white/40">leads</span>
          </p>
          <p className="mt-1 text-[11px] text-amber-400/80">From {referredLeads.length} total referred visits</p>
        </div>
      </div>

      {/* CORE CONTROL 1: PROMOTION TOGGLE & CORE RULES */}
      <div className="rounded-3xl border border-white/10 bg-[#121518] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5a524]/10 text-[#f5a524]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                1. 5% Referral Discount Master Toggle
              </h2>
              <p className="text-xs text-white/50">
                Turn the exclusive 5% first-time customer discount on or off site-wide.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/10">
            <span className="text-xs font-mono uppercase tracking-wider text-white/60">
              State:
            </span>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors focus:outline-none ${
                settings.enabled ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  settings.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`font-mono text-xs font-bold ${
                settings.enabled ? 'text-emerald-400' : 'text-white/40'
              }`}
            >
              {settings.enabled ? 'ENABLED' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Golden Rule Callout */}
        <div className="rounded-2xl border border-[#f5a524]/20 bg-[#f5a524]/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-[#f5a524] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                Core Qualification Rule Enforced:
              </p>
              <p className="text-xs text-white/80 font-mono">
                <strong>VALID AFFILIATE REFERRAL LINK + ELIGIBLE FIRST-TIME CUSTOMER + CUSTOMER OPTS IN = 5% DISCOUNT.</strong>
              </p>
              <p className="text-[11px] text-white/60 leading-relaxed pt-1">
                A manually entered referral code alone does not qualify someone for this 5% promotion. The customer's registration must originate through an active partner referral URL (e.g. <span className="font-mono text-[#f5a524]">advibe.com/book-strategy-session?ref=ADV-JOHN</span>).
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Discount Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Discount Percentage */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-white/60">
              Discount Percentage (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={settings.discountPercent ?? 5}
                onChange={(e) => setSettings({ ...settings, discountPercent: Math.max(1, Number(e.target.value) || 5) })}
                className="w-full min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-4 text-base font-bold text-white focus:border-[#f5a524] focus:outline-none"
              />
              <span className="font-display font-bold text-lg text-[#f5a524]">%</span>
            </div>
            <p className="text-[11px] text-white/40">Default is 5% for first-time qualifying clients.</p>
          </div>

          {/* First-Time Only Toggle */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-white/60">
              Customer Eligibility
            </label>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, firstTimeOnly: !settings.firstTimeOnly })}
              className={`flex w-full min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2 border transition ${
                settings.firstTimeOnly
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/15 bg-white/5 text-white/70'
              }`}
            >
              <span className="text-xs font-bold">
                {settings.firstTimeOnly ? 'First-Time Customers Only' : 'All Customers'}
              </span>
              <span className="font-mono text-[11px]">
                {settings.firstTimeOnly ? 'Strict' : 'Open'}
              </span>
            </button>
            <p className="text-[11px] text-white/40">Restricts discount to new customer registrations.</p>
          </div>

          {/* Minimum Eligible Purchase Value */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-white/60">
              Min Purchase Value (NGN)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="5000"
                value={settings.minPurchaseValue ?? 0}
                onChange={(e) => setSettings({ ...settings, minPurchaseValue: Math.max(0, Number(e.target.value) || 0) })}
                placeholder="0 = No minimum"
                className="w-full min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-4 text-base font-bold text-white focus:border-[#f5a524] focus:outline-none"
              />
              <span className="font-mono text-xs text-white/50">₦</span>
            </div>
            <p className="text-[11px] text-white/40">Set to 0 to apply to any package value.</p>
          </div>
        </div>
      </div>

      {/* CORE CONTROL 2: REFERRAL ATTRIBUTION WINDOW */}
      <div className="rounded-3xl border border-white/10 bg-[#121518] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5a524]/10 text-[#f5a524]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
              2. Referral Attribution Window (Days)
            </h2>
            <p className="text-xs text-white/50">
              Specify how many days an affiliate's referral link attribution remains valid after the visitor's first click.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Direct Number Input */}
            <div className="w-full sm:w-48">
              <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                Window Duration (Days)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.attributionWindowDays}
                  onChange={(e) => {
                    const days = Math.max(1, Math.min(365, Number(e.target.value) || 30));
                    setSettings({ ...settings, attributionWindowDays: days });
                  }}
                  className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 text-lg font-bold text-[#f5a524] focus:border-[#f5a524] focus:outline-none"
                />
                <span className="font-mono text-sm text-white/50">Days</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                Quick Attribution Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ATTRIBUTION_DAYS.map((days) => {
                  const isSelected = settings.attributionWindowDays === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSettings({ ...settings, attributionWindowDays: days })}
                      className={`min-h-[44px] px-4 rounded-xl text-xs font-mono font-bold transition ${
                        isSelected
                          ? 'bg-[#f5a524] text-black shadow-md shadow-[#f5a524]/20'
                          : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {days} Days {days === 30 && '(Standard)'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/60 leading-relaxed space-y-2">
            <p className="flex items-center gap-2 font-mono text-[11px] text-white/80 font-semibold">
              <Info className="h-4 w-4 text-[#f5a524]" />
              How Attribution Window Operates:
            </p>
            <p>
              When a prospective client clicks an affiliate link like <code className="text-[#f5a524]">advibe.com/?ref=ADV-JOHN</code>, the partner's attribution is cryptographically saved with a timestamp in browser storage.
            </p>
            <p>
              If the client completes their registration within <strong>{settings.attributionWindowDays} days</strong>, they can claim the 5% discount and the partner is credited. If they return after day {settings.attributionWindowDays + 1} without a fresh referral link, the attribution is treated as expired.
            </p>
          </div>
        </div>
      </div>

      {/* CORE CONTROL 3: SERVICE PACKAGE ELIGIBILITY DEFINITION */}
      <div className="rounded-3xl border border-white/10 bg-[#121518] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5a524]/10 text-[#f5a524]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                3. Service Package Eligibility Matrix
              </h2>
              <p className="text-xs text-white/50">
                Define exactly which service offerings and commercial retainers qualify for the 5% referral discount.
              </p>
            </div>
          </div>

          {/* Quick Bulk Selection Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllServices}
              className="min-h-[38px] px-3 rounded-lg border border-white/15 bg-white/5 text-[11px] font-semibold text-white/80 hover:bg-white/10 active:scale-95 transition"
            >
              Select All ({AVAILABLE_SERVICE_PACKAGES.length})
            </button>
            <button
              type="button"
              onClick={selectRetainersAndBundles}
              className="min-h-[38px] px-3 rounded-lg border border-white/15 bg-white/5 text-[11px] font-semibold text-[#f5a524] hover:bg-[#f5a524]/10 active:scale-95 transition"
            >
              Retainers & Bundles Only
            </button>
            <button
              type="button"
              onClick={clearAllServices}
              className="min-h-[38px] px-3 rounded-lg border border-white/15 bg-white/5 text-[11px] font-semibold text-red-300 hover:bg-red-500/10 active:scale-95 transition"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Packages List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {AVAILABLE_SERVICE_PACKAGES.map((pkg) => {
            const isEligible = (settings.eligibleServices || []).includes(pkg.id);
            const discountAmount = Math.round(pkg.defaultPrice * ((settings.discountPercent || 5) / 100));
            const discountedPrice = Math.max(0, pkg.defaultPrice - discountAmount);

            return (
              <div
                key={pkg.id}
                onClick={() => toggleService(pkg.id)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 select-none ${
                  isEligible
                    ? 'border-[#f5a524]/50 bg-[#f5a524]/5 shadow-md shadow-[#f5a524]/5'
                    : 'border-white/10 bg-black/40 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] uppercase font-bold text-white/60">
                        {pkg.category}
                      </span>
                      <h3 className="font-display text-sm font-bold text-white truncate">
                        {pkg.name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">
                      {pkg.description}
                    </p>
                  </div>

                  {/* Toggle Checkbox / Indicator */}
                  <div
                    className={`shrink-0 mt-0.5 grid h-6 w-6 place-items-center rounded-lg border transition ${
                      isEligible
                        ? 'border-[#f5a524] bg-[#f5a524] text-black font-bold'
                        : 'border-white/20 bg-white/5 text-transparent'
                    }`}
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                </div>

                {/* Price and Discount Info */}
                <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white/40 text-[10px] font-mono uppercase block">Standard Price</span>
                    <span className="font-mono font-bold text-white">
                      {pkg.defaultPrice > 0 ? fmtMoney(pkg.defaultPrice, { symbol: '₦' }) : 'Free Consultation'}
                    </span>
                  </div>

                  {pkg.defaultPrice > 0 && isEligible ? (
                    <div className="text-right">
                      <span className="text-emerald-400 text-[10px] font-mono uppercase block">
                        Referred Price ({settings.discountPercent || 5}% OFF)
                      </span>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="font-mono font-bold text-emerald-400">
                          {fmtMoney(discountedPrice, { symbol: '₦' })}
                        </span>
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300">
                          Save {fmtMoney(discountAmount, { symbol: '₦' })}
                        </span>
                      </div>
                    </div>
                  ) : pkg.defaultPrice > 0 ? (
                    <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-mono text-white/40">
                      Excluded from Discount
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#f5a524]/10 border border-[#f5a524]/30 px-2.5 py-1 text-[10px] font-mono text-[#f5a524]">
                      Qualifies for Onboarding
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE PROMOTIONAL DISCOUNT & COMMISSION SIMULATOR */}
      <div className="rounded-3xl border border-white/10 bg-[#121518] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5a524]/10 text-[#f5a524]">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
              4. Live Discount & Commission Simulator
            </h2>
            <p className="text-xs text-white/50">
              Test how the configured discount percent and package eligibility impact customer pricing and affiliate payouts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                Select Service Package To Test
              </label>
              <select
                value={simServiceId}
                onChange={(e) => {
                  setSimServiceId(e.target.value);
                  const pkg = AVAILABLE_SERVICE_PACKAGES.find((p) => p.id === e.target.value);
                  if (pkg && pkg.defaultPrice > 0) setCustomSimPrice(pkg.defaultPrice);
                }}
                className="w-full min-h-[46px] rounded-xl border border-white/15 bg-white/5 px-3 text-xs text-white focus:border-[#f5a524] focus:outline-none"
              >
                {AVAILABLE_SERVICE_PACKAGES.filter((p) => p.defaultPrice > 0).map((pkg) => (
                  <option key={pkg.id} value={pkg.id} className="bg-[#121518] text-white">
                    {pkg.name} ({fmtMoney(pkg.defaultPrice, { symbol: '₦' })})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                Test Price (NGN)
              </label>
              <input
                type="number"
                step="5000"
                value={customSimPrice}
                onChange={(e) => setCustomSimPrice(Number(e.target.value) || 0)}
                className="w-full min-h-[46px] rounded-xl border border-white/15 bg-white/5 px-4 font-mono text-sm font-bold text-white focus:border-[#f5a524] focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs space-y-1">
              <div className="flex justify-between text-white/60">
                <span>Eligibility Status:</span>
                <span className={`font-mono font-bold ${isSimPackageEligible ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isSimPackageEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Promotion System:</span>
                <span className={`font-mono font-bold ${settings.enabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {settings.enabled ? 'ENABLED' : 'PAUSED'}
                </span>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Customer Pays */}
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 block">
                Customer Price
              </span>
              <p className="font-display text-2xl font-bold text-white">
                {fmtMoney(Math.max(0, simPrice - simResults.discountAmount), { symbol: '₦' })}
              </p>
              <p className="text-[11px] text-white/50">
                Original:{' '}
                <span className={simResults.discountAmount > 0 ? 'line-through text-white/40' : 'font-mono text-white/80'}>
                  {fmtMoney(simPrice, { symbol: '₦' })}
                </span>
              </p>
              {simResults.discountAmount > 0 && (
                <div className="rounded bg-emerald-500/15 p-1.5 text-[11px] font-mono text-emerald-300">
                  Client saves {fmtMoney(simResults.discountAmount, { symbol: '₦' })} ({settings.discountPercent || 5}%)
                </div>
              )}
            </div>

            {/* Net Received by Advibe */}
            <div className="rounded-2xl border border-[#f5a524]/20 bg-[#f5a524]/5 p-4 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#f5a524] block">
                Net Revenue Received
              </span>
              <p className="font-display text-2xl font-bold text-[#f5a524]">
                {fmtMoney(simResults.netReceived, { symbol: '₦' })}
              </p>
              <p className="text-[11px] text-white/50">
                Excludes taxes &amp; client discount
              </p>
              <div className="rounded bg-white/5 p-1.5 text-[10px] font-mono text-white/60">
                Studio Retained: {fmtMoney(simResults.netReceived - simResults.affiliateCommission, { symbol: '₦' })}
              </div>
            </div>

            {/* Affiliate 10% Commission */}
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 block">
                Affiliate Commission (10%)
              </span>
              <p className="font-display text-2xl font-bold text-emerald-400">
                {fmtMoney(simResults.affiliateCommission, { symbol: '₦' })}
              </p>
              <p className="text-[11px] text-white/50">
                Calculated on net received
              </p>
              <div className="rounded bg-emerald-500/10 p-1.5 text-[10px] font-mono text-emerald-300">
                Rate: 10% on paid qualification
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Action Bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-[#0e1114]/95 p-4 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetToDefaults}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            Reset to Standard Defaults
          </button>
          <span className="text-xs text-white/40 hidden sm:inline">
            Status: {settings.enabled ? '5% Discount Active' : 'Promotion Inactive'} · {settings.eligibleServices?.length || 0} packages eligible
          </span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex min-h-[46px] items-center gap-2 rounded-xl bg-[#f5a524] px-6 font-display text-xs font-bold uppercase tracking-wide text-black hover:brightness-110 active:scale-[0.98] transition shadow-lg shadow-[#f5a524]/20 disabled:opacity-60"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : saveSuccess ? (
            <>
              <Check className="h-4 w-4" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Promotion Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
