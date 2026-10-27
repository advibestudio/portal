import { useEffect, useMemo, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { ytThumb } from '@/lib/store';
import type { PortfolioItem } from '@/content/types';

/**
 * THE 3D VIDEO WALL (hero)
 * ------------------------
 * Cards sit on the inside of a big invisible cylinder. We rotate the cylinder
 * when you drag, swipe, press ← →, or just leave it alone (slow drift).
 *
 * For each card we work out its angle `a` around the cylinder, then place it with
 *   x = R·sin(a)      (left/right)
 *   z = R·(1−cos(a))  (toward you at the edges, so the wall curves around the viewer)
 * and turn it by −a so it faces the middle. Cards behind the cylinder fade out.
 *
 * We move cards by writing straight to the DOM (not React state) so it stays
 * smooth at 60fps.
 */
const wrap180 = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

function WallCard({ item, setRef, onClick }: { item: PortfolioItem; setRef: (el: HTMLButtonElement | null) => void; onClick: () => void }) {
  const [ok, setOk] = useState(true);
  return (
    <button ref={setRef} type="button" className="wall-card" aria-label={`Play video: ${item.title}`} tabIndex={-1} onClick={onClick}>
      {ok ? <img src={ytThumb(item.youtubeId)} alt="" draggable={false} loading="lazy" onError={() => setOk(false)} /> : <div className="fallback" />}
      <span className="wall-play" aria-hidden="true"><span><Play size={22} fill="currentColor" /></span></span>
      <span className="wall-tag" aria-hidden="true">{item.category}</span>
    </button>
  );
}

export function Wall({ items, onPlay }: { items: PortfolioItem[]; onPlay: (i: PortfolioItem) => void }) {
  const wallRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLButtonElement | null)[]>([]);

  // Repeat items so the circle is always full (about 18+ cards), then spread evenly.
  const cards = useMemo(() => {
    if (!items.length) return [];
    const reps = Math.max(1, Math.ceil(18 / items.length));
    return Array.from({ length: items.length * reps }, (_, i) => items[i % items.length]);
  }, [items]);
  const n = cards.length;

  useEffect(() => {
    const wall = wallRef.current;
    if (!wall || !n) return;
    const step = 360 / n;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let R = 520;
    const measure = () => { R = Math.max(520, wall.clientWidth * 0.56); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wall);

    // Start with the middle card of the first group facing front.
    let rot = 0;
    let vel = 0;               // degrees per second (from flicks)
    let target: number | null = null; // used by arrow keys
    let dragging = false;
    let lastX = 0, lastT = 0;
    let idleSince = performance.now() - 3000;
    let hovering = false;
    let visible = true;
    let centerIdx = -1;
    let raf = 0;
    let prev = performance.now();

    const render = () => {
      let best = 999, bestI = 0;
      for (let i = 0; i < n; i++) {
        const el = cardEls.current[i];
        if (!el) continue;
        const a = wrap180(i * step - rot);
        const rad = (a * Math.PI) / 180;
        const op = Math.min(1, Math.max(0, (Math.cos(rad) - 0.208) * 2.85));
        if (op <= 0) {
          if (el.style.visibility !== 'hidden') { el.style.visibility = 'hidden'; el.style.opacity = '0'; }
        } else {
          el.style.visibility = 'visible';
          el.style.opacity = String(op);
          el.style.transform = `translate(-50%,-50%) translate3d(${(R * Math.sin(rad)).toFixed(1)}px,0,${(R * (1 - Math.cos(rad))).toFixed(1)}px) rotateY(${(-a).toFixed(2)}deg)`;
          el.style.zIndex = String(Math.round(Math.cos(rad) * 100));
        }
        if (Math.abs(a) < best) { best = Math.abs(a); bestI = i; }
      }
      if (bestI !== centerIdx) {
        cardEls.current[centerIdx]?.classList.remove('is-center');
        cardEls.current[centerIdx]?.setAttribute('tabindex', '-1');
        cardEls.current[bestI]?.classList.add('is-center');
        cardEls.current[bestI]?.setAttribute('tabindex', '0');
        centerIdx = bestI;
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (visible) {
        if (!dragging) {
          if (target !== null) {
            const d = target - rot;
            rot += d * Math.min(1, dt * 9);
            if (Math.abs(d) < 0.05) { rot = target; target = null; }
          } else if (Math.abs(vel) > 1) {
            rot += vel * dt;
            vel *= Math.pow(0.04, dt); // friction
          } else if (!reduce && now - idleSince > 2500) {
            // keeps moving all the time; hovering only slows it down (it never stops)
            rot += (hovering ? 0.6 : 2.2) * dt;
          }
        }
        render();
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(wall);

    let moved = 0;
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; moved = 0; vel = 0; target = null;
      lastX = e.clientX; lastT = performance.now();
      wall.classList.add('is-dragging');
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const t = performance.now();
      moved += Math.abs(dx);
      const dRot = -dx * 0.16;
      rot += dRot;
      const dtm = Math.max(8, t - lastT) / 1000;
      vel = vel * 0.6 + (dRot / dtm) * 0.4;
      lastX = e.clientX; lastT = t;
      if (moved > 6) wall.dataset.dragged = '1';
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      wall.classList.remove('is-dragging');
      idleSince = performance.now();
      vel = Math.max(-400, Math.min(400, vel));
      // let the click handler read `dragged`, then clear it
      setTimeout(() => { delete wall.dataset.dragged; }, 80);
    };
    const enter = () => { hovering = true; };
    const leave = () => { hovering = false; };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const base = target ?? rot;
        target = Math.round(base / step) * step + dir * step;
        vel = 0; idleSince = performance.now();
      }
    };

    wall.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    wall.addEventListener('mouseenter', enter);
    wall.addEventListener('mouseleave', leave);
    wall.addEventListener('keydown', key);

    render();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      wall.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      wall.removeEventListener('mouseenter', enter);
      wall.removeEventListener('mouseleave', leave);
      wall.removeEventListener('keydown', key);
    };
  }, [n]);

  if (!n) return null;
  return (
    <div
      ref={wallRef}
      className="wall"
      role="region"
      aria-roledescription="carousel"
      aria-label="Video ads we made. Drag, swipe or use the arrow keys to turn the wall, and select a video to watch it."
      tabIndex={0}
    >
      <div className="wall-stage">
        {cards.map((item, i) => (
          <WallCard
            key={`${item.id}-${i}`}
            item={item}
            setRef={(el) => { cardEls.current[i] = el; }}
            onClick={() => { if (wallRef.current?.dataset.dragged) return; onPlay(item); }}
          />
        ))}
      </div>
    </div>
  );
}
