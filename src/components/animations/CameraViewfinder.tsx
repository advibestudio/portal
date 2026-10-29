import React, { useEffect, useState } from 'react';

interface CameraViewfinderProps {
  active?: boolean;
  resolution?: string;
  fps?: number;
  label?: string;
  className?: string;
}

export function CameraViewfinder({
  active = true,
  resolution = '4K UHD',
  fps = 60,
  label = 'ADVIBE CINEMA ENGINE',
  className = '',
}: CameraViewfinderProps) {
  const [timecode, setTimecode] = useState('00:00:00:00');

  useEffect(() => {
    let frame = 0;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      frame = (frame + 1) % fps;
      const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');
      const frames = String(frame).padStart(2, '0');
      setTimecode(`${hours}:${minutes}:${seconds}:${frames}`);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [fps]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 font-mono text-[10px] sm:text-xs text-white/80 select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* 4 Corner Framing Brackets */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 h-5 w-5 sm:h-7 sm:w-7 border-t-2 border-l-2 border-[#f5a524]/90" />
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 h-5 w-5 sm:h-7 sm:w-7 border-t-2 border-r-2 border-[#f5a524]/90" />
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 h-5 w-5 sm:h-7 sm:w-7 border-b-2 border-l-2 border-[#f5a524]/90" />
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 h-5 w-5 sm:h-7 sm:w-7 border-b-2 border-r-2 border-[#f5a524]/90" />

      {/* Center Optical Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-40">
        <div className="h-6 w-[1px] bg-[#f5a524]" />
        <div className="w-6 h-[1px] bg-[#f5a524] -ml-[13px]" />
      </div>

      {/* Top HUD: Status Bar */}
      <div className="flex items-center justify-between z-10 w-full backdrop-blur-xs">
        <div className="flex items-center gap-2">
          {active ? (
            <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-[0_0_12px_rgba(239,68,68,0.8)]">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              <span>REC</span>
            </span>
          ) : (
            <span className="rounded bg-black/60 px-2 py-0.5 text-[9px] text-white/60">STANDBY</span>
          )}
          <span className="text-[#f5a524] font-bold tracking-wider">{label}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded bg-black/50 px-2 py-0.5 border border-white/10 text-white/90">
            {resolution} · {fps}FPS
          </span>
          <span className="hidden sm:inline-block text-[#f5a524]">RAW 12-BIT</span>
        </div>
      </div>

      {/* Bottom HUD: Timecode, ISO, Audio */}
      <div className="flex items-center justify-between z-10 w-full">
        <div className="flex items-center gap-2">
          <span className="rounded bg-black/60 px-2.5 py-1 text-[#f5a524] font-bold tracking-widest text-[11px] sm:text-xs border border-[#f5a524]/30 shadow-sm">
            TC {timecode}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] sm:text-[11px]">
          <span className="text-white/70">ISO 800</span>
          <span className="text-white/70">1/120</span>
          <span className="text-[#f5a524] font-semibold">ƒ/1.4</span>
        </div>
      </div>
    </div>
  );
}
export default CameraViewfinder;
