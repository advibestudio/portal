import React, { useState, useCallback } from 'react';

interface ClapperboardGraphicProps {
  scene?: string;
  take?: string;
  roll?: string;
  title?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * ClapperboardGraphic
 * High-precision, mobile-optimized interactive SVG clapperboard.
 * Uses native SVG rotation around hinge origin `(20, 44)` with expanded viewport bounds
 * and pointer/touch event listeners to guarantee zero clipping or distortion on iOS & Android.
 */
export function ClapperboardGraphic({
  scene = '1A',
  take = '01',
  roll = 'EP01',
  title = 'ADVIBE MINI-SERIES',
  className = '',
  onClick,
}: ClapperboardGraphicProps) {
  const [isClapped, setIsClapped] = useState(false);
  const [lastTouchTime, setLastTouchTime] = useState(0);

  const triggerClap = useCallback(() => {
    // Avoid double-firing on devices that trigger both touchstart and click
    const now = Date.now();
    if (now - lastTouchTime < 250) return;
    setLastTouchTime(now);

    setIsClapped(true);
    setTimeout(() => {
      setIsClapped(false);
    }, 450);
    onClick?.();
  }, [lastTouchTime, onClick]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    triggerClap();
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`group relative inline-flex flex-col items-center justify-center cursor-pointer select-none touch-manipulation transition-transform active:scale-95 ${className}`}
      title="Tap to snap clapperboard"
      role="button"
      tabIndex={0}
      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerClap();
        }
      }}
    >
      <svg
        width="180"
        height="150"
        viewBox="0 -32 180 152"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[200px] overflow-visible drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] pointer-events-none"
      >
        <defs>
          <linearGradient id="mobileSlateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#14181f" />
            <stop offset="100%" stopColor="#080a0e" />
          </linearGradient>
          <pattern id="mobileStripes" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="12" height="24" fill="#f5a524" />
            <rect x="12" width="12" height="24" fill="#111418" />
          </pattern>
        </defs>

        {/* Shockwave Radial Glow on Snap */}
        {isClapped && (
          <circle
            cx="20"
            cy="44"
            r="45"
            fill="url(#mobileStripes)"
            opacity="0.15"
            className="animate-ping"
          />
        )}

        {/* Lower Slate Body */}
        <rect
          x="10"
          y="44"
          width="160"
          height="74"
          rx="8"
          fill="url(#mobileSlateGrad)"
          stroke="#f5a524"
          strokeWidth="2"
        />

        {/* Subtle Inner Border */}
        <rect
          x="14"
          y="48"
          width="152"
          height="66"
          rx="5"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />

        {/* Chalkboard Grid Divider Lines */}
        <line x1="10" y1="72" x2="170" y2="72" stroke="#f5a524" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="62" y1="72" x2="62" y2="118" stroke="#f5a524" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="116" y1="72" x2="116" y2="118" stroke="#f5a524" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* Slate Title Banner */}
        <text x="20" y="63" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.8">
          {title}
        </text>
        <text x="160" y="63" fill="#f5a524" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="end">
          ADVIBE
        </text>

        {/* SCENE */}
        <text x="20" y="86" fill="#ffffff" fillOpacity="0.5" fontSize="7" fontFamily="monospace" fontWeight="bold">SCENE</text>
        <text x="36" y="106" fill="#f5a524" fontSize="16" fontFamily="monospace" fontWeight="900" textAnchor="middle">{scene}</text>

        {/* TAKE */}
        <text x="72" y="86" fill="#ffffff" fillOpacity="0.5" fontSize="7" fontFamily="monospace" fontWeight="bold">TAKE</text>
        <text x="89" y="106" fill="#ffffff" fontSize="16" fontFamily="monospace" fontWeight="900" textAnchor="middle">{take}</text>

        {/* ROLL */}
        <text x="126" y="86" fill="#ffffff" fillOpacity="0.5" fontSize="7" fontFamily="monospace" fontWeight="bold">ROLL</text>
        <text x="143" y="106" fill="#f5a524" fontSize="16" fontFamily="monospace" fontWeight="900" textAnchor="middle">{roll}</text>

        {/* Base Fixed Slate Arm with Zebra Stripes */}
        <rect x="10" y="28" width="160" height="16" rx="2" fill="#111418" stroke="#f5a524" strokeWidth="1.5" />
        <rect x="11" y="29" width="158" height="14" fill="url(#mobileStripes)" />

        {/* =================================================================
            UPPER CLAPPER STICK (Rotates around Hinge Pin at (20, 44))
            Using native SVG transform rotate(deg, cx, cy) + CSS transition
            Guarantees 100% correct pivot on iOS Safari & mobile Chrome
        ================================================================== */}
        <g
          transform={`rotate(${isClapped ? 0 : -22}, 20, 44)`}
          style={{
            transformOrigin: '20px 44px',
            transformBox: 'view-box',
            transition: 'transform 320ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          {/* Top Arm Body */}
          <rect x="10" y="12" width="160" height="16" rx="2" fill="#111418" stroke="#f5a524" strokeWidth="1.5" />
          <rect x="11" y="13" width="158" height="14" fill="url(#mobileStripes)" />
        </g>

        {/* Metallic Hinge Pin (Front Layer) */}
        <circle cx="20" cy="44" r="5" fill="#f5a524" stroke="#000" strokeWidth="1.5" />
        <circle cx="20" cy="44" r="2" fill="#000" />
      </svg>

      {/* Mobile-Friendly Tactile Hint Pill */}
      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#f5a524]/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#a06200] border border-[#f5a524]/40">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f5a524] animate-pulse" />
        Tap To Clap Scene
      </span>
    </div>
  );
}

export default ClapperboardGraphic;
