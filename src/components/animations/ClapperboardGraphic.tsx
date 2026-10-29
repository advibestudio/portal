import React, { useState } from 'react';

interface ClapperboardGraphicProps {
  scene?: string;
  take?: string;
  roll?: string;
  title?: string;
  className?: string;
  onClick?: () => void;
}

export function ClapperboardGraphic({
  scene = '1A',
  take = '01',
  roll = 'EP01',
  title = 'ADVIBE MINI-SERIES',
  className = '',
  onClick,
}: ClapperboardGraphicProps) {
  const [isClapped, setIsClapped] = useState(false);

  const triggerClap = () => {
    setIsClapped(true);
    setTimeout(() => setIsClapped(false), 400);
    onClick?.();
  };

  return (
    <div
      onClick={triggerClap}
      className={`group relative inline-block cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 ${className}`}
      title="Click to clap scene"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerClap();
        }
      }}
    >
      <svg
        width="160"
        height="130"
        viewBox="0 0 160 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
      >
        {/* Lower Slate Body */}
        <rect x="10" y="44" width="140" height="76" rx="6" fill="#111412" stroke="#f5a524" strokeWidth="2" />

        {/* Chalkboard Grid Divider Lines */}
        <line x1="10" y1="76" x2="150" y2="76" stroke="#f5a524" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="56" y1="76" x2="56" y2="120" stroke="#f5a524" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="104" y1="76" x2="104" y2="120" stroke="#f5a524" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* Chalk Text Metadata */}
        <text x="20" y="66" fill="#f5a524" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="1">
          {title}
        </text>

        <text x="18" y="90" fill="#ffffff" fillOpacity="0.5" fontSize="7" fontFamily="monospace">SCENE</text>
        <text x="20" y="108" fill="#ffffff" fontSize="13" fontFamily="monospace" fontWeight="bold">{scene}</text>

        <text x="64" y="90" fill="#ffffff" fillOpacity="0.5" fontSize="7" fontFamily="monospace">TAKE</text>
        <text x="66" y="108" fill="#f5a524" fontSize="13" fontFamily="monospace" fontWeight="bold">{take}</text>

        <text x="112" y="90" fill="#ffffff" fillOpacity="0.5" fontSize="7" fontFamily="monospace">ROLL</text>
        <text x="114" y="108" fill="#ffffff" fontSize="13" fontFamily="monospace" fontWeight="bold">{roll}</text>

        {/* Hinge Pin */}
        <circle cx="20" cy="42" r="4" fill="#f5a524" />

        {/* Upper Clapper Stick with Zebra Stripes (Rotates on Clap) */}
        <g
          className="transition-transform duration-200 origin-[20px_42px]"
          style={{
            transform: isClapped ? 'rotate(0deg)' : 'rotate(-18deg)',
          }}
        >
          <rect x="10" y="26" width="140" height="18" rx="4" fill="#111412" stroke="#f5a524" strokeWidth="2" />
          {/* Diagonal Yellow Zebra Stripes */}
          <path d="M25 26 L35 44 L45 44 L35 26 Z" fill="#f5a524" />
          <path d="M55 26 L65 44 L75 44 L65 26 Z" fill="#f5a524" />
          <path d="M85 26 L95 44 L105 44 L95 26 Z" fill="#f5a524" />
          <path d="M115 26 L125 44 L135 44 L125 26 Z" fill="#f5a524" />
        </g>
      </svg>
      <span className="sr-only">Interactive clapperboard</span>
    </div>
  );
}
export default ClapperboardGraphic;
