import React, { useState } from 'react';
import { Sparkles, Check, Lock, AlertCircle, ArrowRight, ShieldCheck, Tag, X } from 'lucide-react';
import { useReferralStore } from '@/lib/referralStore';
import { fmtMoney } from '@/lib/money';
import { useCountry } from '@/lib/country';

interface DiscountEligibilityModuleProps {
  offerId?: string;
  offerTitle?: string;
  rawPrice?: number;
  customerEmail?: string;
  customerWhatsapp?: string;
  compact?: boolean;
  className?: string;
  onApplied?: () => void;
}

export function DiscountEligibilityModule({
  offerId = 'strategy',
  offerTitle,
  rawPrice = 0,
  customerEmail = '',
  customerWhatsapp = '',
  compact = false,
  className = '',
  onApplied,
}: DiscountEligibilityModuleProps) {
  const {
    attribution,
    claimDiscount,
    setClaimDiscount,
    checkEligibility,
    applyReferralCode,
    clearReferral,
    discountPercent,
  } = useReferralStore();

  const { country } = useCountry();

  const [inputCode, setInputCode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showInputForm, setShowInputForm] = useState(false);

  // Check eligibility for current user & offer
  const eligibility = checkEligibility({
    email: customerEmail,
    whatsapp: customerWhatsapp,
    offerId,
    price: rawPrice,
  });

  const isEligible = eligibility.isEligible;
  const isAttributed = Boolean(attribution?.viaAffiliateLink);

  // Handle applying a partner code
  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCode.trim()) {
      setFeedback({ type: 'error', text: 'Please enter a referral code.' });
      return;
    }

    setIsApplying(true);
    const result = applyReferralCode(inputCode);
    setIsApplying(false);

    if (result.success) {
      setFeedback({ type: 'success', text: result.message });
      setInputCode('');
      setShowInputForm(false);
      if (onApplied) onApplied();
    } else {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  // Price calculation
  const discountAmount = rawPrice > 0 && isEligible && claimDiscount
    ? Math.round(rawPrice * (discountPercent / 100))
    : 0;
  const finalPrice = Math.max(0, rawPrice - discountAmount);

  /* =========================================================================
   * CASE 1: VALID AFFILIATE ATTRIBUTION PRESENT & ELIGIBLE
   * Shows the exact required 5% discount offer banner with opt-in checkbox
   * ========================================================================= */
  if (attribution && isAttributed && isEligible) {
    return (
      <div
        className={`rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 text-[#111412] shadow-sm relative overflow-hidden transition-all ${className}`}
        style={{
          border: '1.5px solid #f5a524',
          background: 'linear-gradient(135deg, rgba(245,165,36,0.12) 0%, rgba(245,165,36,0.04) 100%)',
        }}
      >
        {/* Subtle decorative background glow */}
        <div
          className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-amber-400/20 blur-xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Header with badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black">
              <Sparkles size={14} className="animate-pulse" />
            </span>
            <span className="font-mono text-[11px] font-black uppercase tracking-wider text-amber-900">
              YOU'VE UNLOCKED AN EXCLUSIVE {discountPercent}% DISCOUNT!
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-950 font-mono">
            <Lock size={10} className="text-amber-800" />
            <span>Partner: {attribution.code}</span>
          </div>
        </div>

        {/* Core required copy */}
        <p className="mt-2.5 text-xs sm:text-[13px] leading-relaxed text-amber-950 font-medium">
          You've been referred to Advibe through one of our partners ({attribution.affiliateName || attribution.code}).
          As a first-time customer, you can enjoy <strong>{discountPercent}% off</strong> your first eligible paid project.
        </p>

        {/* Price deduction preview (if commercial package with price) */}
        {rawPrice > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/80 p-2.5 px-3 border border-amber-500/20 text-xs">
            <span className="text-stone-600 font-medium">Pricing with Partner Discount:</span>
            <div className="flex items-center gap-2">
              {claimDiscount ? (
                <>
                  <span className="line-through text-stone-400 font-mono text-[11px]">
                    {fmtMoney(rawPrice, country)}
                  </span>
                  <span className="font-bold text-emerald-800 font-mono text-sm">
                    {fmtMoney(finalPrice, country)}
                  </span>
                  <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold font-mono">
                    Save {fmtMoney(discountAmount, country)}
                  </span>
                </>
              ) : (
                <span className="font-bold text-stone-800 font-mono text-xs">
                  {fmtMoney(rawPrice, country)} (discount unselected)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Compulsory Checkbox for claiming discount */}
        <label className="mt-3.5 flex items-start gap-3 cursor-pointer select-none group rounded-xl p-2.5 hover:bg-amber-500/10 transition-colors">
          <input
            type="checkbox"
            checked={claimDiscount}
            onChange={(e) => setClaimDiscount(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer accent-[#f5a524]"
            id="claim-referral-discount-checkbox"
          />
          <div className="flex-1">
            <span className="text-xs sm:text-[13px] font-bold text-amber-950 group-hover:text-amber-900 transition-colors">
              Yes! I want to claim my exclusive {discountPercent}% referral discount.
            </span>
            <p className="mt-0.5 text-[11px] text-amber-900/80">
              Entitlement will be permanently recorded with your booking reference ({attribution.code}).
            </p>
          </div>
        </label>
      </div>
    );
  }

  /* =========================================================================
   * CASE 2: ATTRIBUTION PRESENT BUT INELIGIBLE (e.g. Self-referral / Expired)
   * ========================================================================= */
  if (attribution && isAttributed && !isEligible) {
    return (
      <div
        className={`rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-xs text-amber-900 ${className}`}
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-950">Referral Attribution Not Eligible for Discount</p>
            <p className="mt-0.5 text-[11px] text-amber-800 leading-normal">
              {eligibility.reason || 'This referral does not meet the eligibility conditions for the 5% first-time discount.'}
            </p>
          </div>
          <button
            type="button"
            onClick={clearReferral}
            className="text-[11px] font-mono text-amber-800 underline hover:text-black flex-shrink-0"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================================
   * CASE 3: NO VALID REFERRAL ATTRIBUTION YET (Direct visitors / checkout prompt)
   * Clearly communicates: "Have a referral code? Get 5% discount"
   * Provides input to enter and validate partner code in real-time.
   * ========================================================================= */
  return (
    <div
      className={`rounded-2xl border border-dashed border-stone-300 bg-stone-50/90 p-3.5 sm:p-4 text-xs transition-all ${className}`}
    >
      {!showInputForm ? (
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700">
              <Tag size={15} />
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-xs sm:text-[13px]">
                Have an Advibe referral code?
              </p>
              <p className="text-[11px] text-stone-500">
                Enter your partner code to unlock <strong>5% off</strong> your first project.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInputForm(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 font-mono text-xs font-bold text-white hover:bg-amber-600 transition"
          >
            <span>Apply Code</span>
            <ArrowRight size={12} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Tag size={12} className="text-amber-600" />
              Apply Partner Referral Code (5% Off)
            </span>
            <button
              type="button"
              onClick={() => {
                setShowInputForm(false);
                setFeedback(null);
              }}
              className="text-stone-400 hover:text-stone-700 p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. ADV-JOHN"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value.toUpperCase());
                if (feedback) setFeedback(null);
              }}
              className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 font-mono text-xs uppercase tracking-wider text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              autoCapitalize="characters"
              autoFocus
            />
            <button
              type="submit"
              disabled={isApplying || !inputCode.trim()}
              className="rounded-xl bg-amber-500 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-400 disabled:opacity-50 transition"
            >
              {isApplying ? 'Checking…' : 'Apply'}
            </button>
          </div>

          {feedback && (
            <div
              className={`flex items-start gap-2 rounded-lg p-2 text-[11px] ${
                feedback.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-rose-600" />
              ) : (
                <Check size={14} className="flex-shrink-0 mt-0.5 text-emerald-600" />
              )}
              <span className="flex-1 leading-tight">{feedback.text}</span>
            </div>
          )}

          <p className="text-[10px] text-stone-500 leading-tight">
            * 5% discount is exclusively available to first-time customers referred by an active Advibe affiliate partner.
          </p>
        </form>
      )}
    </div>
  );
}
