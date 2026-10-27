import React from 'react';
import type { TrainingPillar } from '@/content/types';

interface Props {
  pillars: TrainingPillar[];
}

export function PillarsGrid({ pillars = [] }: Props) {
  const safePillars = Array.isArray(pillars) ? pillars : [];
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
      {safePillars.map((p) => (
        <div
          key={p.number}
          className="group relative bg-[#0e1215] p-6 transition-colors duration-300 hover:bg-[#141a1f] sm:p-7"
        >
          {/* Phase Badge */}
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
            PILLAR {p.number}
          </span>
          <h4 className="mt-2.5 font-display text-lg font-bold tracking-tight text-white transition group-hover:text-[#f5a524]">
            {p.title}
          </h4>
          <p className="mt-2 text-xs leading-relaxed text-white/60 sm:text-sm">
            {p.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
            {p.topics.map((t, i) => (
              <span
                key={i}
                className="rounded bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/50"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* 6th Card: Capstone Certification */}
      <div className="group relative bg-[#12100a] p-6 transition-colors duration-300 hover:bg-[#19150b] sm:p-7">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
          GRADUATION
        </span>
        <h4 className="mt-2.5 font-display text-lg font-bold tracking-tight text-white group-hover:text-[#f5a524]">
          Capstone & Official Certificate
        </h4>
        <p className="mt-2 text-xs leading-relaxed text-white/60 sm:text-sm">
          Submit your 60–90 second commercial or narrative short film. Once verified by our instructors, earn the verified AdVibe Founding Creator Certificate.
        </p>
        <div className="mt-5 flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
          <span className="rounded bg-[#f5a524]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#f5a524]">
            Track A: Commercial
          </span>
          <span className="rounded bg-[#f5a524]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#f5a524]">
            Track B: Creator
          </span>
          <span className="rounded bg-[#f5a524]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#f5a524]">
            Track C: Short Film
          </span>
        </div>
      </div>
    </div>
  );
}
