import React, { useState } from 'react';
import type { TrainingCohort } from '@/content/types';
import { useStore } from '@/lib/store';
import { fmtMoney } from '@/lib/money';
import {
  Flame, Plus, Copy, Archive, Calendar, Users, DollarSign,
  CheckCircle2, Clock, Sparkles, ChevronRight, Edit3, X, ArrowRight
} from 'lucide-react';
import { StartNextCohortWizard } from './StartNextCohortWizard';

export function CohortView() {
  const {
    cohorts,
    activeCohortId,
    activeCohort,
    students,
    confirmedPaidCount,
    cohortDisplayStatus,
    updateCohort,
    startNextCohort,
    duplicateCohort,
    switchActiveCohort,
    log,
    session,
  } = useStore();

  const [editOpen, setEditOpen] = useState(false);
  const [nextCohortOpen, setNextCohortOpen] = useState(false);

  // Edit form state
  const [name, setName] = useState(activeCohort.name);
  const [capacity, setCapacity] = useState(activeCohort.seatCapacity || 100);
  const [threshold, setThreshold] = useState(activeCohort.almostFullThreshold || 80);
  const [startDate, setStartDate] = useState(activeCohort.startDate);
  const [endDate, setEndDate] = useState(activeCohort.endDate);
  const [deadline, setDeadline] = useState(activeCohort.enrollmentDeadline);
  const [paymentUrl, setPaymentUrl] = useState(activeCohort.paymentUrl);
  const [status, setStatus] = useState(activeCohort.status);

  // Start Next Cohort wizard state
  const nextNum = Math.max(...cohorts.map((c) => c.cohortNumber), 1) + 1;
  const [nextStartDate, setNextStartDate] = useState('December 15, 2026');
  const [nextEndDate, setNextEndDate] = useState('December 28, 2026');
  const [nextDeadline, setNextDeadline] = useState('2026-12-10T23:59:59');

  const cap = activeCohort.seatCapacity || 100;
  const pct = Math.min(100, Math.round((confirmedPaidCount / cap) * 100));

  const handleSaveActiveCohort = (e: React.FormEvent) => {
    e.preventDefault();
    updateCohort(activeCohort.id, {
      name,
      seatCapacity: Number(capacity),
      almostFullThreshold: Number(threshold),
      startDate,
      endDate,
      enrollmentDeadline: deadline,
      paymentUrl,
      status: status as TrainingCohort['status'],
    });
    setEditOpen(false);
  };

  const handleLaunchNextCohort = () => {
    startNextCohort({
      startDate: nextStartDate,
      endDate: nextEndDate,
      deadline: nextDeadline,
    });
    setNextCohortOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
            Cohort Operations
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Cohort Management
          </h1>
        </div>

        {/* Start Next Cohort 1-Click Action */}
        <button
          onClick={() => setNextCohortOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#f5a524] px-4 py-3 font-display text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-[#f5a524]/20 transition hover:brightness-110 active:scale-95 sm:text-sm"
        >
          <Sparkles className="h-4 w-4" />
          <span>Start Next Cohort</span>
        </button>
      </div>

      {/* ACTIVE COHORT HERO CARD */}
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#181d22] to-[#111416] p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#f5a524]/20 px-3 py-1 font-mono text-xs font-bold text-[#f5a524]">
                CURRENT ACTIVE COHORT
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider ${
                  cohortDisplayStatus === 'Cohort Full'
                    ? 'bg-red-500/20 text-red-400'
                    : cohortDisplayStatus === 'Almost Full'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                ● {cohortDisplayStatus}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
              {activeCohort.name}
            </h2>
            <p className="text-xs text-white/60 sm:text-sm">{activeCohort.scheduleDays}</p>
          </div>

          <button
            onClick={() => {
              setName(activeCohort.name);
              setCapacity(activeCohort.seatCapacity || 100);
              setThreshold(activeCohort.almostFullThreshold || 80);
              setStartDate(activeCohort.startDate);
              setEndDate(activeCohort.endDate);
              setDeadline(activeCohort.enrollmentDeadline);
              setPaymentUrl(activeCohort.paymentUrl);
              setStatus(activeCohort.status);
              setEditOpen(true);
            }}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-[#f5a524] hover:text-[#f5a524]"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Settings</span>
          </button>
        </div>

        {/* Seat Meter */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/60 uppercase">Confirmed Paid Students:</span>
            <span className="text-base font-bold text-[#f5a524]">
              {confirmedPaidCount} / {cap} Seats ({pct}%)
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-2.5 h-3.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct >= 90 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-[#f5a524]'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
            <span>Almost Full Trigger: {activeCohort.almostFullThreshold || 80} seats</span>
            <span>Starts: {activeCohort.startDate}</span>
          </div>
        </div>

        {/* Pricing Matrix Breakdown */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
            Active Regional Founding Pricing:
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { label: '🇳🇬 Nigeria', code: 'NG', cur: '₦', founding: activeCohort.prices.NG?.founding ?? 19997 },
              { label: '🇬🇭 Ghana', code: 'GH', cur: 'GH₵', founding: activeCohort.prices.GH?.founding ?? 350 },
              { label: '🇰🇪 Kenya', code: 'KE', cur: 'KSh', founding: activeCohort.prices.KE?.founding ?? 7500 },
              { label: '🇺🇸 USA', code: 'US', cur: '$', founding: activeCohort.prices.US?.founding ?? 49 },
              { label: '🇬🇧 UK', code: 'UK', cur: '£', founding: activeCohort.prices.UK?.founding ?? 39 },
            ].map((m) => (
              <div key={m.code} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <span className="text-xs text-white/70">{m.label}</span>
                <p className="mt-1 font-mono text-sm font-bold text-[#f5a524]">
                  {m.cur}
                  {m.founding.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ALL COHORTS ARCHIVE & SWITCHER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-white">All Cohorts ({cohorts.length})</h3>
          <span className="text-xs text-white/50">Tap to switch active cohort</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cohorts.map((c) => {
            const isCurrent = c.id === activeCohort.id;
            const cohortPaid = students.filter((s) => s.cohortId === c.id && s.status === 'paid').length;

            return (
              <div
                key={c.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
                  isCurrent
                    ? 'border-[#f5a524] bg-[#14181c]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#f5a524]">
                      COHORT {c.cohortNumber}
                    </span>
                    <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/60 capitalize">
                      {c.status}
                    </span>
                  </div>
                  <h4 className="font-display text-base font-bold text-white">{c.name}</h4>
                  <p className="text-xs text-white/50">
                    {c.startDate} – {c.endDate}
                  </p>
                  <p className="font-mono text-xs text-white/70">
                    Paid Students: <strong className="text-[#f5a524]">{cohortPaid}</strong> / {c.seatCapacity || 100}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  {!isCurrent ? (
                    <button
                      onClick={() => switchActiveCohort(c.id)}
                      className="rounded-lg bg-white/10 px-3 py-1.5 font-mono text-xs font-semibold text-white hover:bg-[#f5a524] hover:text-black transition"
                    >
                      Make Active
                    </button>
                  ) : (
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ✓ Active on Site
                    </span>
                  )}

                  <button
                    onClick={() => duplicateCohort(c.id)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60 hover:text-white"
                    title="Duplicate cohort"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GUIDED START NEXT COHORT 5-STEP WIZARD */}
      <StartNextCohortWizard
        open={nextCohortOpen}
        onClose={() => setNextCohortOpen(false)}
        sourceCohort={activeCohort}
      />

      {/* EDIT COHORT MODAL */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <form
            onSubmit={handleSaveActiveCohort}
            className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-[#14181c] p-6 text-white shadow-2xl sm:p-8 space-y-4 my-8"
          >
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                Settings
              </span>
              <h3 className="font-display text-xl font-bold tracking-tight text-white">
                Edit Cohort Details
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Cohort Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Seat Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Almost Full Threshold
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Start Date</label>
                <input
                  type="text"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">End Date</label>
                <input
                  type="text"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Enrollment Deadline (ISO)
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Payment / Selfany URL</label>
              <input
                type="text"
                value={paymentUrl}
                onChange={(e) => setPaymentUrl(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Manual Status Override</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TrainingCohort['status'])}
                className="w-full min-h-[48px] rounded-xl border border-white/15 bg-[#181d22] px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
              >
                <option value="open">Open (Auto calculates based on seats)</option>
                <option value="almost_full">Almost Full (Force almost full)</option>
                <option value="final_seats">Final Seats (Force final seats)</option>
                <option value="full">Cohort Full (Force closed)</option>
                <option value="paused">Paused (Temporarily paused)</option>
                <option value="ended">Ended (Cohort concluded)</option>
              </select>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 min-h-[48px] rounded-xl bg-[#f5a524] py-3 px-5 font-display text-sm font-bold uppercase tracking-wider text-black hover:brightness-110 active:scale-[0.98] transition shadow-lg"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="min-h-[48px] rounded-xl border border-white/15 px-5 py-3 text-xs font-semibold text-white/60 hover:text-white active:scale-[0.98] transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
