import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';

export type StoryGraphicType = 'viewfinder' | 'clapperboard' | 'combo';

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
  aperture?: string;
  focusDistance?: string;
  interactive?: boolean;
  autoSnapOnInView?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  className?: string;
  onAction?: (actionType: 'snap' | 'focus' | 'record') => void;
  onFocusChange?: (distance: string) => void;
}

/**
 * AnimatedStoryGraphic
 *
 * High-performance cinematic 4K camera viewfinder and clapperboard slate.
 * Powered by a unified requestAnimationFrame (rAF) render loop with direct SVG DOM
 * ref manipulation. Eliminates high-frequency React re-renders, preventing layout
 * thrashing, frame drops, and battery drain on mobile devices.
 */
export function AnimatedStoryGraphic({
  type = 'viewfinder',
  title = 'ADVIBE 4K CINEMA SYSTEM',
  scene = '01',
  take = '04',
  roll = 'A1',
  resolution = '4K UHD',
  fps = 60,
  focalLength = '35mm',
  shutter = '1/48',
  iso = 'ISO 800',
  aperture = 'f/1.8',
  focusDistance = '1.8m',
  interactive = true,
  autoSnapOnInView = true,
  size = 'responsive',
  className = '',
  onAction,
  onFocusChange,
}: AnimatedStoryGraphicProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.25 });

  const focusMarks = ['0.8m', '1.8m', '3.5m', '8.0m', '∞'];
  const [focusIndex, setFocusIndex] = useState(1);
  const [isFocusPulling, setIsFocusPulling] = useState(false);
  const [activeMode, setActiveMode] = useState<StoryGraphicType>(type);
  const [hasSnappedGlow, setHasSnappedGlow] = useState(false);

  // Direct SVG DOM element references for zero-layout-thrashing updates
  const timecodeElRef = useRef<SVGTextElement | null>(null);
  const vuLeftElRef = useRef<SVGRectElement | null>(null);
  const vuRightElRef = useRef<SVGRectElement | null>(null);
  const needleGroupRef = useRef<SVGGElement | null>(null);
  const reticleGroupRef = useRef<SVGGElement | null>(null);
  const clapperArmGroupRef = useRef<SVGGElement | null>(null);

  // Animation loop state stored in refs to avoid triggering React re-renders
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timeAccumulatorRef = useRef<number>(0);
  const frameCountRef = useRef<number>(18);
  const secCountRef = useRef<number>(24);
  const animTimeRef = useRef<number>(0);

  // Optical indicator interpolation state
  const currentNeedleXRef = useRef<number>((1 / (focusMarks.length - 1)) * 200 + 10);
  const targetNeedleXRef = useRef<number>((1 / (focusMarks.length - 1)) * 200 + 10);
  const currentReticleAngleRef = useRef<number>(36);
  const targetReticleAngleRef = useRef<number>(36);
  const reticleScaleRef = useRef<number>(1);

  // Clapperboard spring physics state: target 0 when clapped, -24 when open
  const clapperAngleRef = useRef<number>(-24);
  const clapperVelocityRef = useRef<number>(0);
  const targetClapperAngleRef = useRef<number>(-24);

  // Sync mode prop
  useEffect(() => {
    setActiveMode(type);
  }, [type]);

  // Keep target focus needle & angle in sync with focusIndex
  useEffect(() => {
    const targetX = (focusIndex / (focusMarks.length - 1)) * 200 + 10;
    targetNeedleXRef.current = targetX;
    targetReticleAngleRef.current = focusIndex * 36;
  }, [focusIndex, focusMarks.length]);

  // Viewport trigger for initial rack focus and clapper snap
  useEffect(() => {
    if (isInView && autoSnapOnInView) {
      // 1. Initial rack focus pulse
      setIsFocusPulling(true);
      reticleScaleRef.current = 1.18;
      const focusTimer = setTimeout(() => {
        setIsFocusPulling(false);
        onAction?.('focus');
      }, 650);

      // 2. Clapper snap spring release
      const snapTimer = setTimeout(() => {
        targetClapperAngleRef.current = 0;
        setHasSnappedGlow(true);
        onAction?.('snap');
        setTimeout(() => setHasSnappedGlow(false), 500);
      }, 400);

      return () => {
        clearTimeout(focusTimer);
        clearTimeout(snapTimer);
      };
    } else {
      // Reset position when scrolled out of view to save power and reset state
      targetClapperAngleRef.current = -24;
      clapperAngleRef.current = -24;
      clapperVelocityRef.current = 0;
      setIsFocusPulling(false);
    }
  }, [isInView, autoSnapOnInView, onAction]);

  /**
   * High-Performance requestAnimationFrame Loop
   * - Runs ONLY when element is in viewport (0% CPU when scrolled away)
   * - Directly modifies SVG textContent and attributes without virtual DOM diffing
   * - Solves mobile layout thrashing by separating read/write phases and avoiding reflow
   */
  useEffect(() => {
    if (!isInView) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.08); // Cap delta to prevent tunneling
      lastTimeRef.current = timestamp;
      animTimeRef.current += dt;

      // -------------------------------------------------------------
      // 1. ROLLING TIMECODE GENERATOR (60 FPS / target FPS)
      // -------------------------------------------------------------
      timeAccumulatorRef.current += dt;
      const frameDuration = 1 / Math.max(1, fps);
      if (timeAccumulatorRef.current >= frameDuration) {
        const stepFrames = Math.floor(timeAccumulatorRef.current / frameDuration);
        timeAccumulatorRef.current -= stepFrames * frameDuration;
        frameCountRef.current = (frameCountRef.current + stepFrames) % fps;
        if (frameCountRef.current < stepFrames) {
          secCountRef.current = (secCountRef.current + 1) % 60;
        }

        if (timecodeElRef.current) {
          const s = String(secCountRef.current).padStart(2, '0');
          const f = String(frameCountRef.current).padStart(2, '0');
          timecodeElRef.current.textContent = `00:01:${s}:${f}`;
        }
      }

      // -------------------------------------------------------------
      // 2. AUDIO VU METERS (Harmonic Wave Simulation)
      // -------------------------------------------------------------
      const t = animTimeRef.current;
      const vuL = 19 + Math.sin(t * 7.5) * 6.5 + Math.sin(t * 16.2) * 4;
      const vuR = 18 + Math.cos(t * 6.8) * 6.0 + Math.sin(t * 14.4) * 4.5;

      if (vuLeftElRef.current) {
        vuLeftElRef.current.setAttribute('width', Math.max(6, Math.min(32, vuL)).toFixed(1));
      }
      if (vuRightElRef.current) {
        vuRightElRef.current.setAttribute('width', Math.max(6, Math.min(32, vuR)).toFixed(1));
      }

      // -------------------------------------------------------------
      // 3. OPTICAL FOCUS-PULL INDICATOR & RETICLE (Critically Damped Lerp)
      // -------------------------------------------------------------
      const lerpFactor = 1 - Math.exp(-18 * dt);
      currentNeedleXRef.current += (targetNeedleXRef.current - currentNeedleXRef.current) * lerpFactor;
      currentReticleAngleRef.current += (targetReticleAngleRef.current - currentReticleAngleRef.current) * lerpFactor;

      // Pulse decay towards 1.0
      reticleScaleRef.current += (1.0 - reticleScaleRef.current) * (1 - Math.exp(-10 * dt));

      if (needleGroupRef.current) {
        needleGroupRef.current.setAttribute('transform', `translate(${currentNeedleXRef.current.toFixed(2)}, 0)`);
      }
      if (reticleGroupRef.current) {
        const rot = currentReticleAngleRef.current.toFixed(2);
        const scale = reticleScaleRef.current.toFixed(3);
        reticleGroupRef.current.setAttribute(
          'transform',
          `translate(170, 115) scale(${scale}) rotate(${rot}) translate(-170, -115)`
        );
      }

      // -------------------------------------------------------------
      // 4. CLAPPERBOARD ARM SPRING PHYSICS (Dynamic Snap & Micro-Bounce)
      // -------------------------------------------------------------
      const springK = 380;
      const damping = 24;
      const displacement = clapperAngleRef.current - targetClapperAngleRef.current;
      const springForce = -springK * displacement - damping * clapperVelocityRef.current;

      clapperVelocityRef.current += springForce * dt;
      clapperAngleRef.current += clapperVelocityRef.current * dt;

      // Hard impact with acoustic bounce when snapping shut at 0 degrees
      if (targetClapperAngleRef.current === 0 && clapperAngleRef.current > 0) {
        clapperAngleRef.current = 0;
        clapperVelocityRef.current = -clapperVelocityRef.current * 0.28; // 28% kinetic bounce rebound
      }

      if (clapperArmGroupRef.current) {
        const deg = clapperAngleRef.current.toFixed(2);
        clapperArmGroupRef.current.setAttribute('transform', `rotate(${deg}, 28, 66)`);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isInView, fps]);

  // Interactive focus-pull rack action
  const handleFocusPull = useCallback(() => {
    if (!interactive) return;
    setIsFocusPulling(true);
    reticleScaleRef.current = 1.25; // Trigger lens breathing pulse

    setFocusIndex((prev) => {
      const nextIdx = (prev + 1) % focusMarks.length;
      onFocusChange?.(focusMarks[nextIdx]);
      return nextIdx;
    });

    onAction?.('focus');

    setTimeout(() => {
      setIsFocusPulling(false);
    }, 550);
  }, [interactive, focusMarks, onAction, onFocusChange]);

  // Interactive clapperboard snap action
  const handleClapClick = useCallback(() => {
    if (!interactive) return;

    // Cock arm back up with spring velocity, then snap down
    targetClapperAngleRef.current = -28;
    clapperAngleRef.current = -28;
    clapperVelocityRef.current = 12;

    setTimeout(() => {
      targetClapperAngleRef.current = 0;
      setHasSnappedGlow(true);
      onAction?.('snap');
      setTimeout(() => setHasSnappedGlow(false), 450);
    }, 75);
  }, [interactive, onAction]);

  const sizeClasses = {
    sm: 'max-w-[240px]',
    md: 'max-w-[360px]',
    lg: 'max-w-[500px]',
    responsive: 'w-full max-w-md',
  }[size];

  const currentDistance = focusMarks[focusIndex];

  return (
    <div
      ref={containerRef}
      className={`relative inline-block select-none ${sizeClasses} ${className}`}
    >
      {/* =====================================================================
          1. INTERACTIVE 4K CAMERA VIEWFINDER SVG OVERLAY (WITH FOCUS-PULL)
      ====================================================================== */}
      {(activeMode === 'viewfinder' || activeMode === 'combo') && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            handleFocusPull();
          }}
          className={`relative group touch-manipulation active:scale-[0.99] transition-transform ${
            interactive ? 'cursor-pointer' : ''
          }`}
          title={interactive ? 'Tap to rack focus pull' : undefined}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          onKeyDown={(e) => {
            if (interactive && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleFocusPull();
            }
          }}
        >
          {/* Focus-Pull Active Laser Ring Glow */}
          <AnimatePresence>
            {isFocusPulling && (
              <motion.div
                initial={{ opacity: 0.9, scale: 0.94 }}
                animate={{ opacity: 0, scale: 1.25 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="pointer-events-none absolute -inset-3 rounded-2xl bg-[radial-gradient(circle,rgba(245,165,36,0.3)_0%,rgba(245,165,36,0)_70%)] z-0"
              />
            )}
          </AnimatePresence>

          <svg
            viewBox="0 0 340 230"
            className="w-full h-auto drop-shadow-[0_20px_45px_rgba(0,0,0,0.8)] pointer-events-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="vfGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0c0f14" />
                <stop offset="100%" stopColor="#05070a" />
              </linearGradient>
              <linearGradient id="focusRailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f5a524" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#f5a524" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f5a524" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Dark Camera Sensor Glass Background */}
            <rect
              x="8"
              y="8"
              width="324"
              height="214"
              rx="14"
              fill="url(#vfGlassGrad)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="2"
            />

            {/* Cinema Anamorphic Framing Guide (2.39:1 Aspect Mask Guidelines) */}
            <line x1="8" y1="42" x2="332" y2="42" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="8" y1="188" x2="332" y2="188" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Rule of Thirds Optical Framing Grid */}
            <line x1="116" y1="8" x2="116" y2="222" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="224" y1="8" x2="224" y2="222" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="8" y1="78" x2="332" y2="78" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="8" y1="152" x2="332" y2="152" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />

            {/* =================================================================
                FRAMER MOTION CORNER FRAMING BRACKETS (Entry Animation)
            ================================================================== */}
            {/* Top-Left Bracket */}
            <motion.path
              d="M 22 46 L 22 22 L 46 22"
              stroke="#f5a524"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, x: -8, y: -8 }}
              animate={isInView ? { pathLength: 1, x: 0, y: 0 } : { pathLength: 0, x: -8, y: -8 }}
              transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
            />

            {/* Top-Right Bracket */}
            <motion.path
              d="M 294 22 L 318 22 L 318 46"
              stroke="#f5a524"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, x: 8, y: -8 }}
              animate={isInView ? { pathLength: 1, x: 0, y: 0 } : { pathLength: 0, x: 8, y: -8 }}
              transition={{ duration: 0.65, ease: 'easeOut', delay: 0.15 }}
            />

            {/* Bottom-Left Bracket */}
            <motion.path
              d="M 22 184 L 22 208 L 46 208"
              stroke="#f5a524"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, x: -8, y: 8 }}
              animate={isInView ? { pathLength: 1, x: 0, y: 0 } : { pathLength: 0, x: -8, y: 8 }}
              transition={{ duration: 0.65, ease: 'easeOut', delay: 0.2 }}
            />

            {/* Bottom-Right Bracket */}
            <motion.path
              d="M 294 208 L 318 208 L 318 184"
              stroke="#f5a524"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, x: 8, y: 8 }}
              animate={isInView ? { pathLength: 1, x: 0, y: 0 } : { pathLength: 0, x: 8, y: 8 }}
              transition={{ duration: 0.65, ease: 'easeOut', delay: 0.25 }}
            />

            {/* =================================================================
                OPTICAL FOCUS-PULL INDICATOR & TARGET RETICLE (rAF-driven)
            ================================================================== */}
            <g ref={reticleGroupRef}>
              {/* Outer Focus Compass Ring */}
              <circle
                cx="170"
                cy="115"
                r="30"
                stroke={isFocusPulling ? '#f5a524' : 'rgba(245,165,36,0.45)'}
                strokeWidth={isFocusPulling ? '2' : '1.2'}
                strokeDasharray="4 4"
              />
              {/* Inner Focusing Target Box */}
              <rect
                x="158"
                y="103"
                width="24"
                height="24"
                stroke="#f5a524"
                strokeWidth="1.8"
                fill={isFocusPulling ? 'rgba(245,165,36,0.15)' : 'none'}
                rx="3"
              />
              {/* Precision Crosshair Marks */}
              <line x1="170" y1="94" x2="170" y2="101" stroke="#f5a524" strokeWidth="1.8" />
              <line x1="170" y1="129" x2="170" y2="136" stroke="#f5a524" strokeWidth="1.8" />
              <line x1="149" y1="115" x2="156" y2="115" stroke="#f5a524" strokeWidth="1.8" />
              <line x1="184" y1="115" x2="191" y2="115" stroke="#f5a524" strokeWidth="1.8" />
            </g>

            {/* =================================================================
                CINEMA FOCUS-PULL GRADUATED SCALE & DISTANCE INDICATOR
            ================================================================== */}
            <g transform="translate(60, 142)">
              {/* Focus Rail Track */}
              <rect x="0" y="0" width="220" height="12" rx="6" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <rect x="0" y="0" width="220" height="12" rx="6" fill="url(#focusRailGrad)" opacity="0.35" />

              {/* Graduation Tick Marks */}
              {focusMarks.map((mark, i) => {
                const markX = (i / (focusMarks.length - 1)) * 200 + 10;
                const isSelected = i === focusIndex;
                return (
                  <g key={mark}>
                    <line
                      x1={markX}
                      y1="2"
                      x2={markX}
                      y2="10"
                      stroke={isSelected ? '#f5a524' : 'rgba(255,255,255,0.3)'}
                      strokeWidth={isSelected ? '2' : '1'}
                    />
                    <text
                      x={markX}
                      y="22"
                      fill={isSelected ? '#f5a524' : 'rgba(255,255,255,0.45)'}
                      fontSize="7.5"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {mark}
                    </text>
                  </g>
                );
              })}

              {/* Animated Sliding Focus-Pull Needle (rAF-driven translation) */}
              <g ref={needleGroupRef}>
                <circle cx="0" cy="6" r="5" fill="#f5a524" stroke="#000" strokeWidth="1.5" />
                <circle cx="0" cy="6" r="2" fill="#000" />
              </g>
            </g>

            {/* FOCUS STATUS BADGE */}
            <g transform="translate(170, 70)">
              <rect
                x="-58"
                y="-9"
                width="116"
                height="18"
                rx="4"
                fill={isFocusPulling ? 'rgba(245,165,36,0.2)' : 'rgba(0,0,0,0.5)'}
                stroke={isFocusPulling ? '#f5a524' : 'rgba(255,255,255,0.2)'}
                strokeWidth="1"
              />
              <text
                x="0"
                y="3.5"
                fill={isFocusPulling ? '#f5a524' : '#10b981'}
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
                letterSpacing="0.8"
              >
                {isFocusPulling ? 'FOCUS: RACKING...' : `FOCUS LOCKED · ${currentDistance}`}
              </text>
            </g>

            {/* =================================================================
                TOP HUD: REC TALLY, ROLLING TIMECODE & 4K RESOLUTION
            ================================================================== */}
            {/* Blinking Red REC Indicator */}
            <g>
              <circle cx="34" cy="34" r="4.5" fill="#ef4444" className="animate-pulse" />
              <text x="44" y="38" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="800" letterSpacing="1">
                REC
              </text>
            </g>

            {/* Rolling Timecode (Direct SVG textContent update via rAF) */}
            <text
              ref={timecodeElRef}
              x="170"
              y="37"
              fill="#ffffff"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="700"
              textAnchor="middle"
              letterSpacing="1.2"
            >
              00:01:24:18
            </text>

            {/* 4K Resolution Badge */}
            <g>
              <rect x="264" y="27" width="46" height="15" rx="3" fill="#f5a524" />
              <text x="287" y="38" fill="#000000" fontSize="8.5" fontFamily="monospace" fontWeight="900" textAnchor="middle">
                {resolution}
              </text>
            </g>

            {/* =================================================================
                BOTTOM HUD: LENS SPECS, ISO & AUDIO VU LEVEL METERS (rAF)
            ================================================================== */}
            <text x="32" y="198" fill="rgba(255,255,255,0.9)" fontSize="9" fontFamily="monospace" fontWeight="bold">
              {focalLength} · {aperture} · {shutter}
            </text>

            <text x="170" y="198" fill="#f5a524" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {iso} · {fps}FPS
            </text>

            {/* Audio Stereo Meters (Direct width updates via rAF) */}
            <g>
              <text x="260" y="192" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">
                L
              </text>
              <rect x="274" y="187" width="34" height="4.5" rx="1.5" fill="#1e293b" />
              <rect
                ref={vuLeftElRef}
                x="274"
                y="187"
                width="20"
                height="4.5"
                rx="1.5"
                fill="#10b981"
              />

              <text x="260" y="202" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">
                R
              </text>
              <rect x="274" y="197" width="34" height="4.5" rx="1.5" fill="#1e293b" />
              <rect
                ref={vuRightElRef}
                x="274"
                y="197"
                width="18"
                height="4.5"
                rx="1.5"
                fill="#f5a524"
              />
            </g>

            {/* Interactive Tap Prompt Banner */}
            {interactive && (
              <g className="opacity-75 group-hover:opacity-100 transition-opacity">
                <rect x="110" y="210" width="120" height="14" rx="7" fill="rgba(245,165,36,0.18)" stroke="#f5a524" strokeWidth="0.8" />
                <text x="170" y="220" fill="#f5a524" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  TAP TO RACK FOCUS PULL
                </text>
              </g>
            )}
          </svg>
        </div>
      )}

      {/* =====================================================================
          2. CLAPPERBOARD SLATE RENDERING (rAF-DRIVEN SPRING PHYSICS & ZERO CLIPPING)
      ====================================================================== */}
      {(activeMode === 'clapperboard' || activeMode === 'combo') && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            handleClapClick();
          }}
          className={`relative group inline-flex flex-col items-center justify-center select-none touch-manipulation active:scale-95 transition-transform ${
            interactive ? 'cursor-pointer' : ''
          }`}
          title={interactive ? 'Tap to snap clapperboard' : undefined}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
          onKeyDown={(e) => {
            if (interactive && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleClapClick();
            }
          }}
        >
          {/* Snap Soundwave Impact Glow */}
          <AnimatePresence>
            {hasSnappedGlow && (
              <motion.div
                initial={{ opacity: 0.95, scale: 0.88 }}
                animate={{ opacity: 0, scale: 1.35 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="pointer-events-none absolute -inset-4 rounded-3xl bg-[radial-gradient(circle,rgba(245,165,36,0.4)_0%,rgba(245,165,36,0)_70%)] z-0"
              />
            )}
          </AnimatePresence>

          <svg
            viewBox="0 -65 320 315"
            className="w-full h-auto overflow-visible drop-shadow-[0_16px_36px_rgba(0,0,0,0.6)] pointer-events-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="chalkboardGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#14181f" />
                <stop offset="100%" stopColor="#080a0e" />
              </linearGradient>
              <pattern id="clapperStripes2" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
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
              fill="url(#chalkboardGrad2)"
              stroke="#f5a524"
              strokeWidth="2.5"
            />

            {/* Inner Border */}
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
            <line x1="110" y1="130" x2="110" y2="190" stroke="#f5a524" strokeWidth="1.5" strokeOpacity="0.3" />
            <line x1="205" y1="130" x2="205" y2="190" stroke="#f5a524" strokeWidth="1.5" strokeOpacity="0.3" />
            <line x1="20" y1="190" x2="300" y2="190" stroke="#f5a524" strokeWidth="1.5" strokeOpacity="0.3" />

            {/* Slate Metadata */}
            <text x="36" y="114" fill="#ffffff" fontSize="13" fontFamily="monospace" fontWeight="800" letterSpacing="1.5">
              {title}
            </text>
            <text x="270" y="113" fill="#f5a524" fontSize="10" fontFamily="monospace" fontWeight="700" textAnchor="end">
              ADVIBE STUDIOS
            </text>

            <text x="36" y="146" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace" fontWeight="600">
              SCENE
            </text>
            <text x="65" y="174" fill="#f5a524" fontSize="22" fontFamily="monospace" fontWeight="800" textAnchor="middle">
              {scene}
            </text>

            <text x="125" y="146" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace" fontWeight="600">
              TAKE
            </text>
            <text x="157" y="174" fill="#ffffff" fontSize="22" fontFamily="monospace" fontWeight="800" textAnchor="middle">
              {take}
            </text>

            <text x="220" y="146" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace" fontWeight="600">
              ROLL
            </text>
            <text x="252" y="174" fill="#f5a524" fontSize="22" fontFamily="monospace" fontWeight="800" textAnchor="middle">
              {roll}
            </text>

            <text x="36" y="213" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="monospace">
              FPS: <tspan fill="#ffffff" fontWeight="bold">{fps}</tspan> · FORMAT: <tspan fill="#f5a524" fontWeight="bold">{resolution}</tspan>
            </text>
            <text x="284" y="213" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="end">
              ● SOUND SYNC
            </text>

            {/* HINGED BASE BAR */}
            <rect x="20" y="66" width="280" height="20" rx="3" fill="#0d1015" stroke="#f5a524" strokeWidth="1.5" />
            <rect x="22" y="68" width="276" height="16" fill="url(#clapperStripes2)" opacity="0.9" />

            {/* =================================================================
                UPPER CLAPPER STICK (rAF-driven spring physics with zero layout thrashing)
                Rotates around hinge point (28, 66) using native SVG transform attribute.
            ================================================================== */}
            <g
              ref={clapperArmGroupRef}
              transform="rotate(-24, 28, 66)"
              style={{
                transformOrigin: '28px 66px',
                transformBox: 'view-box',
              }}
            >
              <rect x="20" y="46" width="280" height="20" rx="3" fill="#0d1015" stroke="#f5a524" strokeWidth="1.5" />
              <rect x="22" y="48" width="276" height="16" fill="url(#clapperStripes2)" />
            </g>

            {/* Hinge Pin Bolt on top of the arm */}
            <circle cx="28" cy="66" r="5" fill="#f5a524" stroke="#000" strokeWidth="1.5" />
            <circle cx="28" cy="66" r="2" fill="#000" />
          </svg>

          {/* Interactive Tap Prompt Badge */}
          {interactive && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#f5a524]/15 px-3 py-1 text-[11px] font-mono font-bold text-[#f5a524] border border-[#f5a524]/40">
              <span className="h-2 w-2 rounded-full bg-[#f5a524] animate-pulse" />
              Tap Clapperboard To Snap Scene
            </span>
          )}
        </div>
      )}

      {/* Switcher Toggle (If interactive combo mode) */}
      {interactive && type === 'combo' && (
        <div className="mt-3 flex items-center justify-center gap-2 font-mono text-[11px]">
          <button
            onClick={() => setActiveMode('viewfinder')}
            className={`px-3 py-1 rounded transition-colors ${
              activeMode === 'viewfinder' ? 'bg-[#f5a524] text-black font-bold' : 'bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            4K Camera Viewfinder
          </button>
          <button
            onClick={() => setActiveMode('clapperboard')}
            className={`px-3 py-1 rounded transition-colors ${
              activeMode === 'clapperboard' ? 'bg-[#f5a524] text-black font-bold' : 'bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            Production Slate
          </button>
        </div>
      )}
    </div>
  );
}
