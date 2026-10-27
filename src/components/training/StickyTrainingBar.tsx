import React from 'react';
import type { TrainingCohort, Country } from '@/content/types';
import { fmtMoney } from '@/lib/money';
import { Flame, ArrowRight } from 'lucide-react';

interface Props {
  cohort: TrainingCohort;
  activeCountry: Country;
  paidCount: number;
  onOpenRegister: () => void;
}

export function StickyTrainingBar({ cohort, activeCountry, paidCount, onOpenRegister }: Props) {
  const priceObj = cohort.prices[activeCountry.code] || cohort.prices.NG || { founding: 19997, regular: 29997 };
  const foundingFormatted = fmtMoney(priceObj.founding, { symbol: activeCountry.symbol });
  const regularFormatted = fmtMoney(priceObj.regular, { symbol: activeCountry.symbol });

  const cap = cohort.seatCapacity || 100;
  const isAlmostFull = paidCount >= (cohort.almostFullThreshold || 80);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-[#0b0e11]/95 px-4 py-3 shadow-2xl backdrop-blur-md sm:px-6"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        {/* Left: Urgency / Seats */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#f5a524]">
            <Flame className="h-3.5 w-3.5 shrink-0 fill-[#f5a524]" />
            <span className="truncate">
              {isAlmostFull ? '🔥 Almost Full' : 'Founding Cohort'} · {paidCount}/{cap} Seats
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-display text-base font-bold text-white sm:text-xl">
              {foundingFormatted}
            </span>
            <span className="hidden text-xs line-through text-white/40 sm:inline">
              {regularFormatted}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
              Founding Price
            </span>
          </div>
        </div>

        {/* Right: CTA Button */}
        <button
          onClick={onOpenRegister}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#f5a524] px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-[#f5a524]/20 transition hover:brightness-110 active:scale-95 sm:px-6 sm:py-3 sm:text-sm"
        >
          <span>Secure My Seat</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
