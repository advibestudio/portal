import React, { useState } from 'react';
import type { TrainingCohort } from '@/content/types';
import { useStore } from '@/lib/store';
import { fmtMoney } from '@/lib/money';
import {
  Sparkles, X, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle,
  Copy, Calendar, DollarSign, Layers, Eye, ShieldCheck, Check
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  sourceCohort: TrainingCohort;
}

export function StartNextCohortWizard({ open, onClose, sourceCohort }: Props) {
  const { cohorts, startNextCohort, switchActiveCohort, updateCohort } = useStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const nextNum = Math.max(...cohorts.map((c) => c.cohortNumber), 1) + 1;

  // Step 1: Source
  const [selectedSourceId, setSelectedSourceId] = useState(sourceCohort.id);

  // Step 2: Name & Dates
  const [cohortName, setCohortName] = useState(`The AdVibe AI Cinematography Intensive — Cohort ${nextNum}`);
  const [startDate, setStartDate] = useState('December 15, 2026');
  const [endDate, setEndDate] = useState('December 28, 2026');
  const [deadline, setDeadline] = useState('2026-12-10T23:59:59');

  // Step 3: Pricing & Capacity
  const futureNgPrice = 29997;
  const [ngPrice, setNgPrice] = useState(futureNgPrice);
  const [ghPrice, setGhPrice] = useState(500);
  const [kePrice, setKePrice] = useState(11000);
  const [usPrice, setUsPrice] = useState(79);
  const [ukPrice, setUkPrice] = useState(59);
  const [capacity, setCapacity] = useState(sourceCohort.seatCapacity || 100);
  const [almostFullAt, setAlmostFullAt] = useState(90);
  const [isFoundingLabel, setIsFoundingLabel] = useState(false);

  // Step 5: Launch choice
  const [launchAction, setLaunchAction] = useState<'open_now' | 'schedule' | 'draft'>('open_now');
  const [archiveSource, setArchiveSource] = useState(true);
  const [completedCohort, setCompletedCohort] = useState<TrainingCohort | null>(null);

  if (!open) return null;

  const handleLaunch = () => {
    const pricesTable: Record<string, { founding: number; regular: number }> = {
      NG: { founding: Number(ngPrice), regular: Number(ngPrice) + 10000 },
      GH: { founding: Number(ghPrice), regular: Number(ghPrice) + 150 },
      KE: { founding: Number(kePrice), regular: Number(kePrice) + 3000 },
      US: { founding: Number(usPrice), regular: Number(usPrice) + 20 },
      UK: { founding: Number(ukPrice), regular: Number(ukPrice) + 20 },
    };

    const newCohort = startNextCohort({
      startDate,
      endDate,
      deadline,
      prices: pricesTable,
    });

    updateCohort(newCohort.id, {
      name: cohortName,
      seatCapacity: Number(capacity),
      almostFullThreshold: Number(almostFullAt),
      status: launchAction === 'open_now' ? 'open' : launchAction === 'draft' ? 'upcoming' : 'upcoming',
    });

    if (archiveSource) {
      updateCohort(sourceCohort.id, { status: 'ended' });
    }

    setCompletedCohort(newCohort);
    setStep(5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/20 bg-[#121518] p-5 sm:p-8 text-white shadow-2xl my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/60 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Wizard Stepper Dots */}
        {!completedCohort && (
          <div className="mb-6 flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
              Step {step} of 4 · Launch Cohort {nextNum}
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <span
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    s === step ? 'w-6 bg-[#f5a524]' : s < step ? 'w-2 bg-white/60' : 'w-2 bg-white/15'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: CHOOSE SOURCE */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Choose Source Template</h2>
              <p className="mt-1 text-xs text-white/60">
                Choose which completed cohort to duplicate. All curriculum sessions, bonuses, and content will be preserved.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
              <label className="text-xs font-semibold text-white/70 block">Source Cohort</label>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#181d22] px-3.5 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
              >
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Cohort {c.cohortNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1.5">
                <span className="font-bold text-emerald-400 block mb-1">✓ What Will Be Copied:</span>
                <p className="text-white/70">· All 6 curriculum sessions &amp; exercises</p>
                <p className="text-white/70">· Full bonus package &amp; deliverables</p>
                <p className="text-white/70">· Instructor profiles &amp; testimonials</p>
                <p className="text-white/70">· Course FAQs &amp; structure</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-1.5">
                <span className="font-bold text-white/50 block mb-1">⊘ What Resets Fresh:</span>
                <p className="text-white/70">· Student registrations (= 0)</p>
                <p className="text-white/70">· Seat reservation meter</p>
                <p className="text-white/70">· Payment records &amp; revenue</p>
                <p className="text-white/70">· Schedule &amp; closing dates</p>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl bg-[#f5a524] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:brightness-110"
              >
                <span>Next: Schedule &amp; Dates</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: NAME & DATES */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Cohort Name &amp; Schedule</h2>
              <p className="mt-1 text-xs text-white/60">
                Set the cohort title, training dates, and enrollment deadline.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-white/70 block mb-1">Cohort Public Title</label>
                <input
                  type="text"
                  value={cohortName}
                  onChange={(e) => setCohortName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-white/70 block mb-1">Start Date</label>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-white/70 block mb-1">End Date</label>
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-white/70 block mb-1">Enrollment Closes (ISO)</label>
                <input
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-xs text-white/60 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-xl bg-[#f5a524] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:brightness-110"
              >
                <span>Next: Pricing &amp; Seats</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PRICING & CAPACITY */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Pricing &amp; Capacity</h2>
              <p className="mt-1 text-xs text-white/60">
                Pre-fills the planned post-founding cohort rates. You can adjust per region.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-white/60 block mb-1 font-mono">🇳🇬 Nigeria (₦)</label>
                <input
                  type="number"
                  value={ngPrice}
                  onChange={(e) => setNgPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1 font-mono">🇬🇭 Ghana (GH₵)</label>
                <input
                  type="number"
                  value={ghPrice}
                  onChange={(e) => setGhPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1 font-mono">🇰🇪 Kenya (KSh)</label>
                <input
                  type="number"
                  value={kePrice}
                  onChange={(e) => setKePrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1 font-mono">🇺🇸 USA ($)</label>
                <input
                  type="number"
                  value={usPrice}
                  onChange={(e) => setUsPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1 font-mono">🇬🇧 UK (£)</label>
                <input
                  type="number"
                  value={ukPrice}
                  onChange={(e) => setUkPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1 font-mono">Seat Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-white">Founding Cohort Designation</p>
                <p className="text-white/50 text-[11px]">Keep enabled only if this is still a founding/early cohort</p>
              </div>
              <input
                type="checkbox"
                checked={isFoundingLabel}
                onChange={(e) => setIsFoundingLabel(e.target.checked)}
                className="h-4 w-4 accent-[#f5a524]"
              />
            </div>

            <div className="pt-3 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-xs text-white/60 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 rounded-xl bg-[#f5a524] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:brightness-110"
              >
                <span>Next: Review &amp; Launch</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & LAUNCH */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Review &amp; Confirmation</h2>
              <p className="mt-1 text-xs text-white/60">
                Confirm your configuration before publishing Cohort {nextNum}.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs space-y-2 font-mono">
              <div className="flex justify-between pb-1.5 border-b border-white/10">
                <span className="text-white/60">Cohort:</span>
                <span className="font-bold text-[#f5a524]">Cohort {nextNum}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-white/10">
                <span className="text-white/60">Dates:</span>
                <span className="text-white">{startDate} – {endDate}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-white/10">
                <span className="text-white/60">Enrollment Closes:</span>
                <span className="text-white">{deadline}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-white/10">
                <span className="text-white/60">Nigeria Rate:</span>
                <span className="font-bold text-emerald-400">₦{Number(ngPrice).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Max Capacity:</span>
                <span className="text-white">{capacity} students</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={archiveSource}
                  onChange={(e) => setArchiveSource(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#f5a524]"
                />
                <div>
                  <span className="font-semibold text-white block">Archive Cohort {sourceCohort.cohortNumber}</span>
                  <span className="text-white/50 text-[11px]">Sets current cohort to concluded and makes Cohort {nextNum} the active cohort on the site.</span>
                </div>
              </label>
            </div>

            <div className="pt-3 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-xs text-white/60 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleLaunch}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
              >
                <Sparkles className="h-4 w-4" />
                <span>Confirm &amp; Launch Cohort {nextNum}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS STATE */}
        {step === 5 && completedCohort && (
          <div className="space-y-5 text-center py-4">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                Cohort Launched Successfully
              </span>
              <h2 className="mt-1 font-display text-2xl font-bold text-white">
                Cohort {completedCohort.cohortNumber} is Live!
              </h2>
              <p className="mt-2 text-xs text-white/60 max-w-sm mx-auto">
                Registrations are open. Your new dates and pricing are now live on the public training pages.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
              <a
                href="#/training"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#f5a524] text-xs font-bold uppercase tracking-wider text-black hover:brightness-110"
              >
                <span>View Public Training Page</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={onClose}
                className="rounded-xl border border-white/15 py-2.5 text-xs text-white/60 hover:text-white"
              >
                Close &amp; Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
