import React, { useState } from 'react';

export function RetentionCurveGraph({ className = '' }: { className?: string }) {
  const [hoverPoint, setHoverPoint] = useState<number | null>(null);

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-[#111412]/10 bg-white p-6 sm:p-8 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#111412]/10 pb-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#a06200]">
            ATTENTION RETENTION COMPARISON
          </span>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#111412]">
            Why Episodic Storytelling Compounds
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            AdVibe Mini-Series (88% Completion)
          </span>
          <span className="flex items-center gap-1.5 text-red-600 font-semibold">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Standard "Buy Now" Ads
          </span>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative mt-6 aspect-[16/8] sm:aspect-[21/9] w-full">
        <svg
          viewBox="0 0 600 240"
          className="h-full w-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Grid Lines */}
          <line x1="40" y1="20" x2="580" y2="20" stroke="#111412" strokeOpacity="0.08" strokeDasharray="3 3" />
          <line x1="40" y1="80" x2="580" y2="80" stroke="#111412" strokeOpacity="0.08" strokeDasharray="3 3" />
          <line x1="40" y1="140" x2="580" y2="140" stroke="#111412" strokeOpacity="0.08" strokeDasharray="3 3" />
          <line x1="40" y1="200" x2="580" y2="200" stroke="#111412" strokeOpacity="0.15" strokeWidth="1.5" />

          {/* Y Axis Labels */}
          <text x="10" y="24" fill="#888" fontSize="10" fontFamily="monospace">100%</text>
          <text x="10" y="84" fill="#888" fontSize="10" fontFamily="monospace">75%</text>
          <text x="10" y="144" fill="#888" fontSize="10" fontFamily="monospace">50%</text>
          <text x="10" y="204" fill="#888" fontSize="10" fontFamily="monospace">0%</text>

          {/* X Axis Time Labels */}
          <text x="50" y="222" fill="#888" fontSize="10" fontFamily="monospace">0:00 (Hook)</text>
          <text x="210" y="222" fill="#888" fontSize="10" fontFamily="monospace">0:15 (Tension)</text>
          <text x="370" y="222" fill="#888" fontSize="10" fontFamily="monospace">0:45 (Climax)</text>
          <text x="520" y="222" fill="#888" fontSize="10" fontFamily="monospace">1:00 (Resolution)</text>

          {/* Standard Ad Drop-off Gradient & Curve (Red) */}
          <defs>
            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5a524" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f5a524" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Red Fill Area */}
          <path
            d="M 50 30 Q 110 180 570 195 L 570 200 L 50 200 Z"
            fill="url(#redGrad)"
          />
          {/* Red Curve */}
          <path
            d="M 50 30 Q 110 180 570 195"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            className="transition-all duration-700"
          />

          {/* Green / Gold Mini-Series Retention Curve */}
          <path
            d="M 50 30 C 180 32, 280 40, 420 50 C 490 55, 540 65, 570 68 L 570 200 L 50 200 Z"
            fill="url(#goldGrad)"
          />
          <path
            d="M 50 30 C 180 32, 280 40, 420 50 C 490 55, 540 65, 570 68"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-all duration-700"
          />

          {/* Data Callout Nodes */}
          {/* Node 1: Red steep drop */}
          <circle cx="110" cy="155" r="4" fill="#ef4444" className="animate-ping" opacity="0.6" />
          <circle cx="110" cy="155" r="4" fill="#ef4444" />
          <text x="120" y="152" fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="bold">
            -82% Drop-off (Feed Fatigue)
          </text>

          {/* Node 2: Gold series retention */}
          <circle cx="420" cy="50" r="5" fill="#f5a524" className="animate-ping" opacity="0.6" />
          <circle cx="420" cy="50" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
          <text x="430" y="45" fill="#047857" fontSize="10" fontFamily="monospace" fontWeight="bold">
            88% Sustained Attention (Story Hook)
          </text>
        </svg>
      </div>

      <div className="mt-4 rounded-2xl bg-[#f3f4ef] p-4 text-xs font-mono text-[#586159] flex items-center justify-between">
        <span>*Based on digital campaign retention benchmarks across narrative vs direct-response video</span>
        <span className="text-[#a06200] font-bold">AdVibe Episodic Engine</span>
      </div>
    </div>
  );
}
export default RetentionCurveGraph;
