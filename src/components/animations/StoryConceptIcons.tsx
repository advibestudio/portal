import React, { useEffect, useRef, useState } from 'react';

interface StoryConceptIconProps {
  type: 'relatable' | 'comedy' | 'characters' | 'product-led' | 'mini-series' | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Custom hook to detect when an element scrolls into view.
 * Uses IntersectionObserver with a fallback timer for reliability.
 */
export function useScrollInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setInView(true);
      setHasTriggered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          setHasTriggered(true);
        } else {
          setInView(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    observer.observe(el);

    const fallbackTimer = setTimeout(() => {
      setInView(true);
      setHasTriggered(true);
    }, 4000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [threshold]);

  return { ref, inView, hasTriggered };
}

/**
 * 1. Sound Waves SVG Icon (Relatable Stories / Universal Voice & Emotion)
 * Displays oscillating studio frequency bars + radiating acoustic resonance waves.
 */
export function SoundWaveStoryIcon({ active = false, onClick }: { active: boolean; onClick?: () => void }) {
  const barHeights = [45, 75, 95, 60, 85, 100, 70, 50, 80];

  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer select-none group/icon"
      title="Audio frequency resonance"
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Glow backdrop on active */}
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="#f5a524"
          className={`transition-all duration-700 ${
            active ? 'opacity-15 blur-md' : 'opacity-0 blur-none'
          }`}
        />

        {/* Ambient acoustic ripple rings */}
        <circle
          cx="32"
          cy="32"
          r="24"
          stroke="#f5a524"
          strokeWidth="1"
          strokeDasharray="3 3"
          className={`transition-all duration-1000 ${
            active ? 'opacity-40 scale-105 animate-ping' : 'opacity-10 scale-95'
          }`}
          style={{ animationDuration: '3s' }}
        />

        {/* Outer Circular Boundary */}
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="16"
          fill="#111412"
          stroke={active ? '#f5a524' : '#333834'}
          strokeWidth="1.5"
          className="transition-colors duration-500 shadow-sm"
        />

        {/* Left acoustic sound arcs */}
        <path
          d="M12 26 C10 29 10 35 12 38"
          stroke="#f5a524"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`transition-all duration-500 ${
            active ? 'opacity-80' : 'opacity-20'
          }`}
        />
        <path
          d="M9 22 C6 27 6 37 9 42"
          stroke="#f5a524"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 2"
          className={`transition-all duration-700 ${
            active ? 'opacity-60' : 'opacity-10'
          }`}
        />

        {/* Right acoustic sound arcs */}
        <path
          d="M52 26 C54 29 54 35 52 38"
          stroke="#f5a524"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`transition-all duration-500 ${
            active ? 'opacity-80' : 'opacity-20'
          }`}
        />
        <path
          d="M55 22 C58 27 58 37 55 42"
          stroke="#f5a524"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 2"
          className={`transition-all duration-700 ${
            active ? 'opacity-60' : 'opacity-10'
          }`}
        />

        {/* Equalizer Frequency Bars in Center */}
        {barHeights.map((maxH, i) => {
          const x = 16 + i * 4;
          const h = active ? (maxH / 100) * 28 : 6;
          const y = 32 - h / 2;
          const delay = (i % 5) * 0.12;
          const duration = 0.6 + (i % 4) * 0.18;

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="2.5"
              height={h}
              rx="1.25"
              fill={i === 4 || i === 5 ? '#f5a524' : '#fbd38d'}
              className="transition-all duration-300"
              style={{
                transformOrigin: `${x + 1.25}px 32px`,
                animation: active
                  ? `story-soundwave-bounce ${duration}s ease-in-out infinite alternate`
                  : 'none',
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}

        {/* Center Live Wave Indicator Dot */}
        <circle
          cx="32"
          cy="50"
          r="1.5"
          fill="#22c55e"
          className={active ? 'animate-pulse' : 'opacity-40'}
        />
      </svg>
    </div>
  );
}

/**
 * 2. Clapperboard SVG Icon (Comedy & Unexpected Plot Twists)
 * Top clapper arm animates closed with a snappy clap action when scrolled into view.
 */
export function ClapperboardStoryIcon({ active = false, onClick }: { active: boolean; onClick?: () => void }) {
  const [localClap, setLocalClap] = useState(false);

  useEffect(() => {
    if (active) {
      setLocalClap(true);
      const timer = setTimeout(() => setLocalClap(false), 600);
      return () => clearTimeout(timer);
    }
  }, [active]);

  const handleTap = () => {
    setLocalClap(true);
    setTimeout(() => setLocalClap(false), 500);
    onClick?.();
  };

  return (
    <div
      onClick={handleTap}
      className="relative flex items-center justify-center cursor-pointer select-none group/icon"
      title="Click or scroll to clap scene"
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="#f5a524"
          className={`transition-all duration-700 ${
            active ? 'opacity-15 blur-md' : 'opacity-0'
          }`}
        />

        {/* Outer Circular Boundary */}
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="16"
          fill="#111412"
          stroke={active ? '#f5a524' : '#333834'}
          strokeWidth="1.5"
          className="transition-colors duration-500 shadow-sm"
        />

        {/* Lower Clapper Slate Board */}
        <rect
          x="12"
          y="26"
          width="40"
          height="26"
          rx="3"
          fill="#1a1e1b"
          stroke="#f5a524"
          strokeWidth="1.2"
        />

        {/* Slate Grid Text Metadata */}
        <line x1="12" y1="36" x2="52" y2="36" stroke="#f5a524" strokeWidth="0.8" strokeOpacity="0.4" />
        <line x1="28" y1="36" x2="28" y2="52" stroke="#f5a524" strokeWidth="0.8" strokeOpacity="0.4" />
        <line x1="40" y1="36" x2="40" y2="52" stroke="#f5a524" strokeWidth="0.8" strokeOpacity="0.4" />

        <text x="15" y="33" fill="#f5a524" fontSize="4.5" fontFamily="monospace" fontWeight="bold">
          ACT II · COMEDY
        </text>
        <text x="16" y="44" fill="#ffffff" fillOpacity="0.6" fontSize="3.5" fontFamily="monospace">
          SCENE
        </text>
        <text x="16" y="50" fill="#ffffff" fontSize="5.5" fontFamily="monospace" fontWeight="bold">
          02
        </text>
        <text x="31" y="44" fill="#ffffff" fillOpacity="0.6" fontSize="3.5" fontFamily="monospace">
          TAKE
        </text>
        <text x="31" y="50" fill="#f5a524" fontSize="5.5" fontFamily="monospace" fontWeight="bold">
          01
        </text>
        <text x="43" y="44" fill="#ffffff" fillOpacity="0.6" fontSize="3.5" fontFamily="monospace">
          ROLL
        </text>
        <text x="43" y="50" fill="#22c55e" fontSize="5.5" fontFamily="monospace" fontWeight="bold">
          4K
        </text>

        {/* Hinge Pin */}
        <circle cx="15" cy="25" r="2" fill="#f5a524" />

        {/* Upper Clapper Stick with Zebra Stripes that Claps */}
        <g
          className="transition-transform duration-300 origin-[15px_25px]"
          style={{
            transform: localClap
              ? 'rotate(0deg)'
              : active
              ? 'rotate(-16deg)'
              : 'rotate(-24deg)',
          }}
        >
          <rect
            x="12"
            y="17"
            width="40"
            height="8"
            rx="2"
            fill="#111412"
            stroke="#f5a524"
            strokeWidth="1.2"
          />
          <path d="M16 17 L20 25 L24 25 L20 17 Z" fill="#f5a524" />
          <path d="M26 17 L30 25 L34 25 L30 17 Z" fill="#f5a524" />
          <path d="M36 17 L40 25 L44 25 L40 17 Z" fill="#f5a524" />
          <path d="M46 17 L50 25 L52 25 L50 17 Z" fill="#f5a524" />
        </g>

        {/* Impact action sound rays when clapped */}
        {localClap && (
          <g className="animate-fade-out">
            <line x1="52" y1="21" x2="57" y2="18" stroke="#f5a524" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="53" y1="25" x2="59" y2="25" stroke="#f5a524" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="51" y1="29" x2="56" y2="33" stroke="#f5a524" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * 3. Character & Cinema Reel SVG Icon (Recurring Original Characters)
 * Features dual spinning 35mm film reels and an illuminated character spotlight.
 */
export function CharacterReelStoryIcon({ active = false, onClick }: { active: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer select-none group/icon"
      title="Character spotlight & cinema reel"
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="#f5a524"
          className={`transition-all duration-700 ${
            active ? 'opacity-15 blur-md' : 'opacity-0'
          }`}
        />

        {/* Outer Circular Boundary */}
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="16"
          fill="#111412"
          stroke={active ? '#f5a524' : '#333834'}
          strokeWidth="1.5"
          className="transition-colors duration-500 shadow-sm"
        />

        {/* Spotlight Cone Beam */}
        <polygon
          points="32,10 16,52 48,52"
          fill="url(#spotlightGrad)"
          className={`transition-opacity duration-700 ${
            active ? 'opacity-70' : 'opacity-20'
          }`}
        />
        <defs>
          <linearGradient id="spotlightGrad" x1="32" y1="10" x2="32" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f5a524" stopOpacity="0.5" />
            <stop offset="1" stopColor="#f5a524" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Left Film Reel Spool */}
        <g
          className={`origin-[23px_24px] ${
            active ? 'animate-[spin_6s_linear_infinite]' : ''
          }`}
        >
          <circle cx="23" cy="24" r="9" stroke="#f5a524" strokeWidth="1.5" fill="#181c19" />
          <circle cx="23" cy="24" r="3" fill="#f5a524" />
          <circle cx="23" cy="18" r="1.2" fill="#f5a524" />
          <circle cx="28" cy="22" r="1.2" fill="#f5a524" />
          <circle cx="26" cy="28" r="1.2" fill="#f5a524" />
          <circle cx="19" cy="28" r="1.2" fill="#f5a524" />
          <circle cx="18" cy="21" r="1.2" fill="#f5a524" />
        </g>

        {/* Right Film Reel Spool */}
        <g
          className={`origin-[41px_24px] ${
            active ? 'animate-[spin_6s_linear_infinite_reverse]' : ''
          }`}
        >
          <circle cx="41" cy="24" r="9" stroke="#f5a524" strokeWidth="1.5" fill="#181c19" />
          <circle cx="41" cy="24" r="3" fill="#f5a524" />
          <circle cx="41" cy="18" r="1.2" fill="#f5a524" />
          <circle cx="46" cy="22" r="1.2" fill="#f5a524" />
          <circle cx="44" cy="28" r="1.2" fill="#f5a524" />
          <circle cx="37" cy="28" r="1.2" fill="#f5a524" />
          <circle cx="36" cy="21" r="1.2" fill="#f5a524" />
        </g>

        {/* Film Web Connecting the Spools */}
        <path d="M23 15 L41 15" stroke="#f5a524" strokeWidth="1.2" strokeDasharray="2 2" />

        {/* Center Character Cast Silhouette */}
        <circle cx="32" cy="38" r="4.5" fill="#ffffff" />
        <path
          d="M23 52 C23 45 27 44 32 44 C37 44 41 45 41 52 Z"
          fill="#ffffff"
          className="opacity-90"
        />

        {/* Star Sparkle for Star Power */}
        <path
          d="M32 14 L33 17 L36 18 L33 19 L32 22 L31 19 L28 18 L31 17 Z"
          fill="#f5a524"
          className={`transition-all duration-500 ${
            active ? 'opacity-100 scale-110 animate-pulse' : 'opacity-0 scale-75'
          }`}
        />
      </svg>
    </div>
  );
}

/**
 * 4. Product-Led Lens & Crosshair SVG Icon (Product-Led Storytelling)
 * Features an anamorphic camera lens with 6 iris blades that dilate open and focus brackets.
 */
export function ProductLensStoryIcon({ active = false, onClick }: { active: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer select-none group/icon"
      title="Camera lens aperture focus"
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="#f5a524"
          className={`transition-all duration-700 ${
            active ? 'opacity-15 blur-md' : 'opacity-0'
          }`}
        />

        {/* Outer Circular Boundary */}
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="16"
          fill="#111412"
          stroke={active ? '#f5a524' : '#333834'}
          strokeWidth="1.5"
          className="transition-colors duration-500 shadow-sm"
        />

        {/* Precision Lens Barrel Ticks */}
        <circle
          cx="32"
          cy="32"
          r="20"
          stroke="#f5a524"
          strokeWidth="1"
          strokeDasharray="2 4"
          className={active ? 'animate-[spin_20s_linear_infinite]' : 'opacity-40'}
        />

        {/* Focus Reticle Framing Corners */}
        <path d="M14 20 L14 14 L20 14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" className="opacity-70" />
        <path d="M50 20 L50 14 L44 14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" className="opacity-70" />
        <path d="M14 44 L14 50 L20 50" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" className="opacity-70" />
        <path d="M50 44 L50 50 L44 50" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" className="opacity-70" />

        {/* Rotating Aperture Iris Assembly */}
        <g
          className={`origin-[32px_32px] transition-transform duration-700 ${
            active ? 'rotate-45' : 'rotate-0'
          }`}
        >
          <circle cx="32" cy="32" r="14" fill="#1a1e1b" stroke="#f5a524" strokeWidth="1.5" />

          {/* 6 Overlapping Iris Aperture Blades */}
          <line x1="22" y1="26" x2="36" y2="20" stroke="#f5a524" strokeWidth="1.5" strokeOpacity="0.8" />
          <line x1="36" y1="20" x2="42" y2="32" stroke="#f5a524" strokeWidth="1.5" strokeOpacity="0.8" />
          <line x1="42" y1="32" x2="34" y2="44" stroke="#f5a524" strokeWidth="1.5" strokeOpacity="0.8" />
          <line x1="34" y1="44" x2="22" y2="40" stroke="#f5a524" strokeWidth="1.5" strokeOpacity="0.8" />
          <line x1="22" y1="40" x2="22" y2="26" stroke="#f5a524" strokeWidth="1.5" strokeOpacity="0.8" />

          {/* Golden Center Target Core */}
          <circle
            cx="32"
            cy="32"
            r={active ? 5 : 2}
            fill="#f5a524"
            className="transition-all duration-500 shadow-inner"
          />
        </g>

        {/* Lock Indicator Ticker */}
        <circle cx="48" cy="16" r="2" fill="#22c55e" className={active ? 'animate-ping' : 'opacity-20'} />
        <circle cx="48" cy="16" r="1.5" fill="#22c55e" />
      </svg>
    </div>
  );
}

/**
 * 5. Connected Episodic Film Strip & Arc SVG Icon (Connected Episodic Arcs)
 * Features animated 35mm film perforations and an undulating retention sine wave.
 */
export function EpisodicFilmStripStoryIcon({ active = false, onClick }: { active: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer select-none group/icon"
      title="Episodic continuous film strip"
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="#f5a524"
          className={`transition-all duration-700 ${
            active ? 'opacity-15 blur-md' : 'opacity-0'
          }`}
        />

        {/* Outer Circular Boundary */}
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="16"
          fill="#111412"
          stroke={active ? '#f5a524' : '#333834'}
          strokeWidth="1.5"
          className="transition-colors duration-500 shadow-sm"
        />

        {/* Horizontal 35mm Film Strip */}
        <rect
          x="10"
          y="20"
          width="44"
          height="24"
          rx="3"
          fill="#1a1e1b"
          stroke="#f5a524"
          strokeWidth="1.2"
        />

        {/* Top Sprocket Perforations */}
        {[13, 20, 27, 34, 41, 47].map((px) => (
          <rect key={px} x={px} y="22" width="3.5" height="2.5" rx="0.5" fill="#f5a524" />
        ))}

        {/* Bottom Sprocket Perforations */}
        {[13, 20, 27, 34, 41, 47].map((px) => (
          <rect key={px} x={px} y="39.5" width="3.5" height="2.5" rx="0.5" fill="#f5a524" />
        ))}

        {/* Episodic Frame Dividers */}
        <line x1="24" y1="26" x2="24" y2="38" stroke="#f5a524" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="39" y1="26" x2="39" y2="38" stroke="#f5a524" strokeWidth="1" strokeOpacity="0.4" />

        {/* Episode Indicators inside frames */}
        <text x="14" y="34" fill="#ffffff" fillOpacity="0.7" fontSize="4" fontFamily="monospace" fontWeight="bold">
          E01
        </text>
        <text x="27" y="34" fill="#f5a524" fontSize="4" fontFamily="monospace" fontWeight="bold">
          E02
        </text>
        <text x="42" y="34" fill="#22c55e" fontSize="4" fontFamily="monospace" fontWeight="bold">
          E03
        </text>

        {/* Overlaid Glowing Retention Arc / Sine Curve */}
        <path
          d="M10 35 Q 24 16, 34 32 T 54 28"
          stroke="#f5a524"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          className={`transition-all duration-1000 ${
            active ? 'opacity-90 stroke-dashoffset-0' : 'opacity-40'
          }`}
          style={{
            strokeDasharray: '60',
            strokeDashoffset: active ? '0' : '60',
            animation: active ? 'story-sine-pulse 3s ease-in-out infinite' : 'none',
          }}
        />

        {/* Pulsing Arc Vertex Point */}
        <circle
          cx="28"
          cy="23"
          r="2.5"
          fill="#f5a524"
          className={active ? 'animate-ping' : 'opacity-30'}
        />
        <circle cx="28" cy="23" r="1.5" fill="#ffffff" />
      </svg>
    </div>
  );
}

/**
 * Unified Component: StoryConceptBadge
 * Detects scroll entrance using useScrollInView and mounts the respective animated SVG icon.
 */
export function StoryConceptBadge({
  type,
  className = '',
  size = 'md',
}: StoryConceptIconProps) {
  const { ref, inView } = useScrollInView(0.2);
  const [tapBoost, setTapBoost] = useState(false);

  const handleTap = () => {
    setTapBoost(true);
    setTimeout(() => setTapBoost(false), 700);
  };

  const isTriggered = inView || tapBoost;

  const renderIcon = () => {
    switch (type) {
      case 'relatable':
        return <SoundWaveStoryIcon active={isTriggered} onClick={handleTap} />;
      case 'comedy':
        return <ClapperboardStoryIcon active={isTriggered} onClick={handleTap} />;
      case 'characters':
        return <CharacterReelStoryIcon active={isTriggered} onClick={handleTap} />;
      case 'product-led':
        return <ProductLensStoryIcon active={isTriggered} onClick={handleTap} />;
      case 'mini-series':
        return <EpisodicFilmStripStoryIcon active={isTriggered} onClick={handleTap} />;
      default:
        return <ClapperboardStoryIcon active={isTriggered} onClick={handleTap} />;
    }
  };

  return (
    <div
      ref={ref}
      className={`relative inline-flex items-center justify-center transition-transform duration-500 hover:scale-105 active:scale-95 ${className}`}
    >
      {renderIcon()}
      {/* Subtle indicator beacon when in view */}
      <span
        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 rounded-full bg-[#f5a524] transition-all duration-700 ${
          isTriggered ? 'w-5 opacity-90' : 'w-1 opacity-20'
        }`}
      />
    </div>
  );
}

export default StoryConceptBadge;
