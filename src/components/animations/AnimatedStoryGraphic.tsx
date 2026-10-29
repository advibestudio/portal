import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { Film, Play, Sparkles, Volume2, Maximize2, Zap, RefreshCw } from 'lucide-react';

export type StoryGraphicType = 'clapperboard' | 'viewfinder' | 'combo';

export interface AnimatedStoryGraphicProps {
  type?: StoryGraphicType;
  title?: string;
  scene?: string;
  take?: string;
  roll?: string;
  resolution?: string;
  fps?: number;
  focalLength?: string;
  shutter?: string;
  iso?: string;
  interactive?: boolean;
  autoSnapOnInView?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  className?: string;
  onAction?: (actionType: 'snap' | 'focus' | 'record') => void;
}

/**
 * AnimatedStoryGraphic
 * Dynamically renders interactive SVG clapperboard and 4K viewfinder icons.
 * Uses Framer Motion (`motion/react`) to animate viewfinder framing brackets,
 * optical crosshairs, timecode counters, and authentic clapperboard hinge snap action
 * when scrolled into the viewport.
 */
export function AnimatedStoryGraphic({
  type = 'clapperboard',
  title = 'ADVIBE ORIGINAL STORY',
  scene = '01',
  take = '04',
  roll = 'A1',
  resolution = '4K UHD',
  fps = 60,
  focalLength = '35mm',
  shutter = '1/48',
  iso = 'ISO 800',
  interactive = true,
  autoSnapOnInView = true,
  size = 'responsive',
  className = '',
  onAction,
}: AnimatedStoryGraphicProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.35 });

  const [isClapped, setIsClapped] = useState(false);
  const [manualTrigger, setManualTrigger] = useState(0);
  const [timecode, setTimecode] = useState('00:01:24:18');
  const [activeMode, setActiveMode] = useState<StoryGraphicType>(type);

  // Sync prop changes
  useEffect(() => {
    setActiveMode(type);
  }, [type]);

  // Viewport scroll trigger for clapper snap
  useEffect(() => {
    if (isInView && autoSnapOnInView) {
      // Trigger snap sequence when entering viewport
      setIsClapped(false);
      const timer = setTimeout(() => {
        setIsClapped(true);
        onAction?.('snap');
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setIsClapped(false);
    }
  }, [isInView, autoSnapOnInView, manualTrigger, onAction]);

  // Rolling timecode generator for viewfinder
  useEffect(() => {
    if (!isInView) return;
    let frame = 18;
    let sec = 24;
    const interval = setInterval(() => {
      frame = (frame + 1) % fps;
      if (frame === 0) sec = (sec + 1) % 60;
      const fStr = String(frame).padStart(2, '0');
      const sStr = String(sec).padStart(2, '0');
      setTimecode(`00:01:${sStr}:${fStr}`);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [isInView, fps]);

  const handleClapClick = () => {
    if (!interactive) return;
    setIsClapped(false);
    setTimeout(() => {
      setIsClapped(true);
      setManualTrigger((prev) => prev + 1);
      onAction?.('snap');
    }, 80);
  };

  // Dimensions based on size preset
  const sizeClasses = {
    sm: 'max-w-[220px]',
    md: 'max-w-[340px]',
    lg: 'max-w-[480px]',
    responsive: 'w-full max-w-md',
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative inline-block select-none ${sizeClasses} ${className}`}
    >
      {/* =====================================================================
          1. CLAPPERBOARD SVG RENDERING
      ====================================================================== */}
      {(activeMode === 'clapperboard' || activeMode === 'combo') && (
        <div
          onClick={handleClapClick}
          className={`relative group ${interactive ? 'cursor-pointer' : ''}`}
          title={interactive ? 'Click to trigger clapper snap' : undefined}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={(e) => {
            if (interactive && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleClapClick();
            }
          }}
        >
          {/* Snap Soundwave Impact Glow */}
          <AnimatePresence>
            {isClapped && (
              <motion.div
                initial={{ opacity: 0.8, scale: 0.85 }}
                animate={{ opacity: 0, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="pointer-events-none absolute -inset-4 rounded-3xl bg-[radial-gradient(circle,rgba(245,165,36,0.35)_0%,rgba(245,165,36,0)_70%)] z-0"
              />
            )}
          </AnimatePresence>

          <svg
            viewBox="0 0 320 250"
            className="w-full h-auto drop-shadow-[0_16px_36px_rgba(0,0,0,0.6)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="clapperArmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1a1e24" />
                <stop offset="100%" stopColor="#0d1015" />
              </linearGradient>
              <linearGradient id="chalkboardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#12161c" />
                <stop offset="100%" stopColor="#080a0d" />
              </linearGradient>
              <pattern id="clapperStripes" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="20" height="40" fill="#f5a524" />
                <rect x="20" width="20" height="40" fill="#111418" />
              </pattern>
            </defs>

            {/* LOWER SLATE BODY */}
            <rect
              x="20"
              y="85"
              width="280"
              height="150"
              rx="12"
              fill="url(#chalkboardGrad)"
              stroke="#f5a524"
              strokeWidth="2.5"
            />

            {/* Internal Hairline Framing */}
            <rect
              x="26"
              y="91"
              width="268"
              height="138"
              rx="8"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />

            {/* Slate Header Divider */}
            <line x1="20" y1="130" x2="300" y2="130" stroke="#f5a524" strokeWidth="2" strokeOpacity="0.4" />
            {/* Column Dividers */}
            <line x1="110" y1="130" x2="110" y2="190" stroke="#f5a524" strokeWidth="1.5" strokeOpacity="0.3" />
            <line x1="205" y1="130" x2="205" y2="190" stroke="#f5a524" strokeWidth="1.5" strokeOpacity="0.3" />
            <line x1="20" y1="190" x2="300" y2="190" stroke="#f5a524" strokeWidth="1.5" strokeOpacity="0.3" />

            {/* Slate Title Banner */}
            <text x="36" y="114" fill="#ffffff" fontSize="13" fontFamily="monospace" fontWeight="800" letterSpacing="1.5">
              {title}
            </text>
            <text x="270" y="113" fill="#f5a524" fontSize="10" fontFamily="monospace" fontWeight="700" textAnchor="end">
              ADVIBE STUDIOS
            </text>

            {/* Field Headers & Values */}
            {/* SCENE */}
            <text x="36" y="146" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace" fontWeight="600">
              SCENE
            </text>
            <text x="65" y="174" fill="#f5a524" fontSize="22" fontFamily="monospace" fontWeight="800" textAnchor="middle">
              {scene}
            </text>

            {/* TAKE */}
            <text x="125" y="146" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace" fontWeight="600">
              TAKE
            </text>
            <text x="157" y="174" fill="#ffffff" fontSize="22" fontFamily="monospace" fontWeight="800" textAnchor="middle">
              {take}
            </text>

            {/* ROLL */}
            <text x="220" y="146" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace" fontWeight="600">
              ROLL
            </text>
            <text x="252" y="174" fill="#f5a524" fontSize="22" fontFamily="monospace" fontWeight="800" textAnchor="middle">
              {roll}
            </text>

            {/* FOOTER METADATA */}
            <text x="36" y="213" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="monospace">
              FPS: <tspan fill="#ffffff" fontWeight="bold">{fps}</tspan> · FORMAT: <tspan fill="#f5a524" fontWeight="bold">{resolution}</tspan>
            </text>
            <text x="284" y="213" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="end">
              ● SOUND SYNC
            </text>

            {/* HINGED BASE BAR */}
            <rect x="20" y="66" width="280" height="20" rx="3" fill="url(#clapperArmGrad)" stroke="#f5a524" strokeWidth="1.5" />
            {/* Base Bar Stripes */}
            <rect x="22" y="68" width="276" height="16" fill="url(#clapperStripes)" opacity="0.9" />

            {/* =================================================================
                ANIMATED HINGED CLAPPER ARM (GSAP / Framer Motion Snap Action)
            ================================================================== */}
            <motion.g
              style={{ originX: '28px', originY: '66px' }}
              initial={{ rotate: -26 }}
              animate={{ rotate: isClapped ? 0 : -26 }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 18,
                mass: 0.8,
              }}
            >
              {/* Clapper Top Arm Body */}
              <rect
                x="20"
                y="46"
                width="280"
                height="20"
                rx="3"
                fill="url(#clapperArmGrad)"
                stroke="#f5a524"
                strokeWidth="1.5"
              />
              {/* Top Arm Stripes */}
              <rect x="22" y="48" width="276" height="16" fill="url(#clapperStripes)" />

              {/* Hinge Bolt */}
              <circle cx="28" cy="56" r="4.5" fill="#f5a524" stroke="#000" strokeWidth="1.5" />
              <circle cx="28" cy="56" r="1.5" fill="#000" />
            </motion.g>

            {/* Click/Tap Prompt Pill */}
            {interactive && (
              <g className="opacity-70 group-hover:opacity-100 transition-opacity">
                <rect x="110" y="222" width="100" height="14" rx="7" fill="rgba(245,165,36,0.15)" stroke="#f5a524" strokeWidth="0.8" />
                <text x="160" y="232" fill="#f5a524" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  TAP TO SNAP SCENE
                </text>
              </g>
            )}
          </svg>
        </div>
      )}

      {/* =====================================================================
          2. 4K VIEWFINDER SVG RENDERING
      ====================================================================== */}
      {(activeMode === 'viewfinder' || activeMode === 'combo') && (
        <div
          className={`relative group ${activeMode === 'combo' ? 'mt-6' : ''}`}
        >
          <svg
            viewBox="0 0 320 220"
            className="w-full h-auto drop-shadow-[0_16px_36px_rgba(0,0,0,0.7)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Viewfinder Dark Glass Background */}
            <rect
              x="10"
              y="10"
              width="300"
              height="200"
              rx="14"
              fill="#06080b"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
            />

            {/* Optical Sensor Grid Guidelines (Rule of Thirds) */}
            <line x1="110" y1="10" x2="110" y2="210" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="210" y1="10" x2="210" y2="210" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="10" y1="76" x2="310" y2="76" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="10" y1="144" x2="310" y2="144" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />

            {/* =================================================================
                FRAMER MOTION ANIMATED CORNER FRAMING BRACKETS
            ================================================================== */}
            {/* Top-Left Bracket */}
            <motion.path
              d="M 24 44 L 24 24 L 44 24"
              stroke="#f5a524"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, x: -8, y: -8 }}
              animate={isInView ? { pathLength: 1, x: 0, y: 0 } : { pathLength: 0, x: -8, y: -8 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            />

            {/* Top-Right Bracket */}
            <motion.path
              d="M 276 24 L 296 24 L 296 44"
              stroke="#f5a524"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, x: 8, y: -8 }}
              animate={isInView ? { pathLength: 1, x: 0, y: 0 } : { pathLength: 0, x: 8, y: -8 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            />

            {/* Bottom-Left Bracket */}
            <motion.path
              d="M 24 176 L 24 196 L 44 196"
              stroke="#f5a524"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, x: -8, y: 8 }}
              animate={isInView ? { pathLength: 1, x: 0, y: 0 } : { pathLength: 0, x: -8, y: 8 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            />

            {/* Bottom-Right Bracket */}
            <motion.path
              d="M 276 196 L 296 196 L 296 176"
              stroke="#f5a524"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, x: 8, y: 8 }}
              animate={isInView ? { pathLength: 1, x: 0, y: 0 } : { pathLength: 0, x: 8, y: 8 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.25 }}
            />

            {/* =================================================================
                CENTER FOCUSING OPTICAL RETICLE & CROSSHAIRS
            ================================================================== */}
            <motion.g
              initial={{ scale: 1.35, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : { scale: 1.35, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            >
              {/* Outer Focus Circle */}
              <circle cx="160" cy="110" r="28" stroke="rgba(245,165,36,0.35)" strokeWidth="1" strokeDasharray="3 3" />
              {/* Target Square */}
              <rect x="150" y="100" width="20" height="20" stroke="#f5a524" strokeWidth="1.5" fill="none" rx="2" />
              {/* Center Crosshair Tick Marks */}
              <line x1="160" y1="92" x2="160" y2="98" stroke="#f5a524" strokeWidth="1.5" />
              <line x1="160" y1="122" x2="160" y2="128" stroke="#f5a524" strokeWidth="1.5" />
              <line x1="142" y1="110" x2="148" y2="110" stroke="#f5a524" strokeWidth="1.5" />
              <line x1="172" y1="110" x2="178" y2="110" stroke="#f5a524" strokeWidth="1.5" />
            </motion.g>

            {/* =================================================================
                TOP HUD: TALLY LIGHT & 4K RESOLUTION
            ================================================================== */}
            {/* Blinking Red REC Indicator */}
            <g>
              <circle cx="34" cy="36" r="4.5" fill="#ef4444" className="animate-pulse" />
              <text x="44" y="40" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="800" letterSpacing="1">
                REC
              </text>
            </g>

            {/* Rolling Timecode */}
            <text x="160" y="39" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="700" textAnchor="middle" letterSpacing="1">
              {timecode}
            </text>

            {/* 4K Resolution & Battery Indicator */}
            <g>
              <rect x="252" y="30" width="44" height="15" rx="3" fill="#f5a524" />
              <text x="274" y="41" fill="#000000" fontSize="8.5" fontFamily="monospace" fontWeight="900" textAnchor="middle">
                {resolution}
              </text>
            </g>

            {/* =================================================================
                BOTTOM HUD: LENS FOCAL, SHUTTER, ISO & VU METERS
            ================================================================== */}
            <text x="32" y="186" fill="rgba(255,255,255,0.85)" fontSize="9" fontFamily="monospace" fontWeight="bold">
              {focalLength} · {shutter}
            </text>

            <text x="160" y="186" fill="#f5a524" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {iso} · {fps}FPS
            </text>

            {/* Audio Channel Stereo Level VU Meter */}
            <g>
              <text x="250" y="178" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">
                CH1
              </text>
              <rect x="268" y="173" width="28" height="5" rx="1.5" fill="#1e293b" />
              <motion.rect
                x="268"
                y="173"
                height="5"
                rx="1.5"
                fill="#10b981"
                animate={isInView ? { width: [14, 22, 18, 25, 20] } : { width: 14 }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              />

              <text x="250" y="188" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">
                CH2
              </text>
              <rect x="268" y="183" width="28" height="5" rx="1.5" fill="#1e293b" />
              <motion.rect
                x="268"
                y="183"
                height="5"
                rx="1.5"
                fill="#f5a524"
                animate={isInView ? { width: [16, 20, 24, 18, 22] } : { width: 16 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
              />
            </g>
          </svg>
        </div>
      )}

      {/* Switcher Toggle (If interactive combo mode) */}
      {interactive && type === 'combo' && (
        <div className="mt-3 flex items-center justify-center gap-2 font-mono text-[11px]">
          <button
            onClick={() => setActiveMode('clapperboard')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeMode === 'clapperboard' ? 'bg-[#f5a524] text-black font-bold' : 'bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            Clapperboard Slate
          </button>
          <button
            onClick={() => setActiveMode('viewfinder')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeMode === 'viewfinder' ? 'bg-[#f5a524] text-black font-bold' : 'bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            4K Camera Viewfinder
          </button>
        </div>
      )}
    </div>
  );
}
