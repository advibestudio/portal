import React, { useState } from 'react';
import type { TrainingSession } from '@/content/types';
import { ChevronDown, PlayCircle, CheckCircle2, Sparkles, Wrench } from 'lucide-react';

interface Props {
  sessions: TrainingSession[];
  track?: 'business' | 'creators';
}

export function CurriculumAccordion({ sessions = [], track = 'business' }: Props) {
  const [openDay, setOpenDay] = useState<number | null>(1);

  const toggleDay = (day: number) => {
    setOpenDay((prev) => (prev === day ? null : day));
  };

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const week1 = safeSessions.filter((s) => s.week === 1);
  const week2 = safeSessions.filter((s) => s.week === 2);

  const renderSessionCard = (s: TrainingSession) => {
    const isOpen = openDay === s.day;

    return (
      <div
        key={s.day}
        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
          isOpen
            ? 'border-[#f5a524]/50 bg-[#121415] shadow-xl shadow-black/40 ring-1 ring-[#f5a524]/20'
            : 'border-white/10 bg-[#14181b]/80 hover:border-white/20 hover:bg-[#181d22]'
        }`}
      >
        {/* Accordion Header */}
        <button
          onClick={() => toggleDay(s.day)}
          className="flex w-full items-start justify-between gap-4 p-5 text-left sm:p-6"
          aria-expanded={isOpen}
        >
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5a524]/40 bg-[#f5a524]/10 px-3 py-1 font-mono text-xs font-bold tracking-wider text-[#f5a524]">
                <PlayCircle className="h-3 w-3" />
                {s.label}
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/50">
                Week {s.week} Live Intensive
              </span>
            </div>
            <h3 className="font-display text-lg font-bold tracking-tight text-white transition group-hover:text-[#f5a524] sm:text-xl">
              {s.title}
            </h3>
            <p className="line-clamp-2 text-xs leading-relaxed text-white/60 sm:text-sm">
              {s.focus}
            </p>
          </div>
          <div
            className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-transform duration-300 ${
              isOpen ? 'rotate-180 border-[#f5a524] text-[#f5a524]' : 'group-hover:text-white'
            }`}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
        </button>

        {/* Accordion Expandable Body */}
        {isOpen && (
          <div className="border-t border-white/10 bg-black/30 p-5 sm:p-6 sm:pt-5">
            {/* Practical Outcome Banner */}
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#f5a524]/20 bg-[#f5a524]/5 p-3.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#f5a524]" />
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#f5a524]">
                  Expected Practical Outcome:
                </p>
                <p className="text-sm font-semibold text-white/90">{s.outcome}</p>
              </div>
            </div>

            {/* What you'll learn */}
            <div className="space-y-3">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-white/40">
                Core Modules & What You'll Learn:
              </p>
              <ul className="space-y-2">
                {s.whatYouLearn.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-white/80 sm:text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f5a524]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tools & Skills */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="mb-2.5 flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white/40">
                <Wrench className="h-3 w-3 text-[#f5a524]" />
                Skills & Technologies:
              </p>
              <div className="flex flex-wrap gap-2">
                {s.toolsAndSkills.map((tool, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Practical Assignment */}
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#f5a524]">
                Session Assignment:
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/75 sm:text-sm">
                {s.practicalExercise}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {/* Week 1 */}
      <div>
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              WEEK 01
            </span>
            <h3 className="font-display text-2xl font-bold tracking-tight text-white">
              Building The AI Creator Foundations
            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/60">
            3 Live Sessions
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
          {week1.map((s) => renderSessionCard(s))}
        </div>
      </div>

      {/* Week 2 */}
      <div>
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              WEEK 02
            </span>
            <h3 className="font-display text-2xl font-bold tracking-tight text-white">
              {track === 'business'
                ? 'Commercial Ad Production, UGC & Campaign Scale'
                : 'AI Directing, Character Consistency & Short Filmmaking'}
            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/60">
            3 Live Sessions + Capstone
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
          {week2.map((s) => renderSessionCard(s))}
        </div>
      </div>
    </div>
  );
}
