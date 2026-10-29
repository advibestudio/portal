import React, { useState, useCallback, useRef, forwardRef } from 'react';

export interface RippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
  color?: string;
}

export interface TactileRippleProps {
  className?: string;
  glowColor?: string;
  duration?: number;
}

/**
 * TactileRipple
 * Renders an absolute overlay inside any `relative overflow-hidden` container.
 * When a pointerdown (touch or click) occurs, it triggers a subtle golden radial glow
 * that expands and smoothly fades, giving tactile feedback especially on mobile.
 */
export function TactileRipple({
  className = '',
  glowColor = 'rgba(245, 165, 36, 0.45)',
  duration = 600,
}: TactileRippleProps) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.2;
    const id = Date.now() + Math.random();

    setRipples((prev) => [...prev, { id, x, y, size, color: glowColor }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, duration);
  }, [glowColor, duration]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className={`absolute inset-0 pointer-events-auto overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes tactile-ripple-expand {
          0% {
            transform: translate(-50%, -50%) scale(0.15);
            opacity: 0.9;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
      `}</style>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            background: `radial-gradient(circle, ${ripple.color || glowColor} 0%, rgba(245, 165, 36, 0.18) 45%, rgba(245, 165, 36, 0) 72%)`,
            animation: `tactile-ripple-expand ${duration}ms cubic-bezier(0.15, 0.85, 0.35, 1) forwards`,
            boxShadow: '0 0 32px rgba(245, 165, 36, 0.35)',
          }}
        />
      ))}
    </div>
  );
}

/**
 * RippleButton
 * Drop-in replacement for <button> with integrated tactile golden ripple,
 * spring press animation, and pointer-events layering.
 */
export const RippleButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    rippleColor?: string;
  }
>(({ children, className = '', onClick, rippleColor, ...props }, ref) => {
  const [ripples, setRipples] = useState<RippleItem[]>([]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.2;
    const id = Date.now() + Math.random();

    setRipples((prev) => [...prev, { id, x, y, size, color: rippleColor }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  return (
    <button
      ref={ref}
      onPointerDown={handlePointerDown}
      onClick={onClick}
      className={`relative overflow-hidden active:scale-[0.98] transition-transform duration-150 select-none ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full pointer-events-none">
        {children}
      </span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full z-0"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            background: `radial-gradient(circle, ${ripple.color || 'rgba(245, 165, 36, 0.48)'} 0%, rgba(245, 165, 36, 0.18) 45%, rgba(245, 165, 36, 0) 75%)`,
            animation: 'tactile-ripple-expand 600ms cubic-bezier(0.15, 0.85, 0.35, 1) forwards',
            boxShadow: '0 0 30px rgba(245, 165, 36, 0.35)',
          }}
        />
      ))}
    </button>
  );
});
RippleButton.displayName = 'RippleButton';

/**
 * RippleAnchor
 * Drop-in replacement for <a> with integrated tactile golden ripple
 * and spring press animation for outbound links (WhatsApp, Call, etc).
 */
export const RippleAnchor = forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    rippleColor?: string;
  }
>(({ children, className = '', onClick, rippleColor, ...props }, ref) => {
  const [ripples, setRipples] = useState<RippleItem[]>([]);

  const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.2;
    const id = Date.now() + Math.random();

    setRipples((prev) => [...prev, { id, x, y, size, color: rippleColor }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  return (
    <a
      ref={ref}
      onPointerDown={handlePointerDown}
      onClick={onClick}
      className={`relative overflow-hidden active:scale-[0.98] transition-transform duration-150 select-none ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full pointer-events-none">
        {children}
      </span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full z-0"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            background: `radial-gradient(circle, ${ripple.color || 'rgba(245, 165, 36, 0.48)'} 0%, rgba(245, 165, 36, 0.18) 45%, rgba(245, 165, 36, 0) 75%)`,
            animation: 'tactile-ripple-expand 600ms cubic-bezier(0.15, 0.85, 0.35, 1) forwards',
            boxShadow: '0 0 30px rgba(245, 165, 36, 0.35)',
          }}
        />
      ))}
    </a>
  );
});
RippleAnchor.displayName = 'RippleAnchor';
