import React, { useEffect } from 'react';

/**
 * Global TapRipple: Creates a golden glow ripple at the touch/click coordinates
 * on interactive elements (buttons, links, cards, tabs).
 * Designed specifically for high-energy mobile touch feedback.
 */
export function TapRipple() {
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = (e.target as HTMLElement)?.closest('button, a, [role="button"], .interactive-card, .tab-btn');
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 1.6;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.className = 'gold-touch-ripple';

      // Ensure target position allows absolute child
      const computedPos = window.getComputedStyle(target).position;
      if (computedPos === 'static') {
        (target as HTMLElement).style.position = 'relative';
      }
      (target as HTMLElement).style.overflow = 'hidden';

      target.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 700);
    }

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return null;
}
export default TapRipple;
