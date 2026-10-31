import React from 'react';

interface SoundWaveProps {
  label?: string;
  bars?: number;
  height?: number;
  className?: string;
}

export function SoundWaveVisualizer({
  label = 'STUDIO AUDIO STEMS · MASTERED 48KHZ 24-BIT',
  bars = 28,
  height = 42,
  className = '',
}: SoundWaveProps) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-white/70">
          <span className="flex items-center gap-1.5 text-[#f5a524]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f5a524] animate-pulse" />
            <span className="font-bold">{label}</span>
          </span>
          <span className="text-[#f5a524]">PEAK: -0.1 dB</span>
        </div>
      )}

      {/* Rhythmic Oscillating Bars */}
      <div className="flex items-center justify-between gap-1 w-full" style={{ height: `${height}px` }}>
        {Array.from({ length: bars }).map((_, idx) => {
          // Staggered rhythmic heights and animation delays
          const animDelay = (idx % 7) * 0.12;
          const animDuration = 0.8 + (idx % 5) * 0.15;
          return (
            <div
              key={idx}
              className="flex-1 rounded-full bg-gradient-to-t from-[#f5a524]/60 via-[#f5a524] to-amber-200 transition-all"
              style={{
                height: `${Math.max(15, ((idx * 17) % 85) + 15)}%`,
                animationName: 'soundwave-bounce',
                animationDuration: `${animDuration}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
                animationDelay: `${animDelay}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
export default SoundWaveVisualizer;
