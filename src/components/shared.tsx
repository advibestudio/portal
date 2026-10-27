import React, { useEffect, useRef, useState } from 'react';
import { Play, X } from 'lucide-react';
import { ytThumb } from '@/lib/store';
import type { PortfolioItem } from '@/content/types';

/**
 * Fade-and-rise when scrolled into view. Uses the browser's built-in
 * IntersectionObserver + a CSS transition (no animation library = faster load).
 * A safety timer guarantees content always appears, even if the observer never fires.
 */
export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -60px 0px' });
    io.observe(el);
    const safety = setTimeout(() => setShown(true), 8000);
    return () => { io.disconnect(); clearTimeout(safety); };
  }, []);
  return (
    <div ref={ref} className={`reveal ${shown ? 'is-in' : ''} ${className}`} style={delay ? { transitionDelay: `${delay}s` } : undefined}>
      {children}
    </div>
  );
}

/** Smooth open/close panel (used by FAQs and package drawers). Pure CSS. */
export function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={`fold ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div>{children}</div>
    </div>
  );
}

/** Turns the LAST word of a sentence into the italic-serif accent used in headlines. */
export function EmLast({ text }: { text: string }) {
  const t = text.trim();
  const i = t.lastIndexOf(' ');
  if (i < 0) return <em>{t}</em>;
  return <>{t.slice(0, i + 1)}<em>{t.slice(i + 1)}</em></>;
}

export function SecHead({ label, children, lead, center = false }: { label?: string; children: React.ReactNode; lead?: string; center?: boolean }) {
  return (
    <Reveal className={`sec-head ${center ? 'center' : ''}`}>
      {label && <span className="pill-label">{label}</span>}
      <h2 className="h-section">{children}</h2>
      {lead && <p className="lead">{lead}</p>}
    </Reveal>
  );
}

/** Thumbnail card for a portfolio video (opens the lightbox). */
export function VideoCard({ item, onPlay }: { item: PortfolioItem; onPlay: (item: PortfolioItem) => void }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <button
      onClick={() => onPlay(item)}
      className="vcard"
      style={{ aspectRatio: item.orientation === 'vertical' ? '9 / 16' : '16 / 9' }}
      aria-label={`Play video: ${item.title}`}
    >
      {imgOk ? (
        <img src={ytThumb(item.youtubeId)} alt="" loading="lazy" onError={() => setImgOk(false)} />
      ) : (
        <div className="fallback" />
      )}
      <span className="vcard-play"><Play size={18} fill="currentColor" /></span>
      <span className="vcard-info">
        <span className="vcard-cat">{item.category}</span>
        <span className="vcard-title" style={{ display: 'block' }}>{item.title}</span>
        <span className="vcard-meta" style={{ display: 'block' }}>{item.client}{item.result ? ` · ${item.result}` : ''}</span>
      </span>
    </button>
  );
}

export function Lightbox({ item, onClose }: { item: PortfolioItem | null; onClose: () => void }) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [item, onClose]);
  if (!item) return null;
  const vertical = item.orientation === 'vertical';
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Video: ${item.title}`}>
      <button onClick={onClose} className="lightbox-close" aria-label="Close video"><X size={22} /></button>
      <div
        className="lightbox-box anim-pop"
        style={{ maxWidth: vertical ? 380 : 900 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ aspectRatio: vertical ? '9 / 16' : '16 / 9', maxHeight: '78dvh', margin: '0 auto' }}>
          <iframe
            src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1&rel=0&playsinline=1`}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        </div>
        <div className="lightbox-cap">
          <div>
            <p style={{ font: '700 18px var(--font-display)', letterSpacing: '-.02em' }}>{item.title}</p>
            <p style={{ fontSize: 14, opacity: 0.6 }}>{item.client} · {item.category}</p>
          </div>
          {item.result && <span style={{ flex: 'none', padding: '6px 12px', borderRadius: 999, background: 'rgb(var(--brand))', color: 'rgb(var(--ink))', fontSize: 13, fontWeight: 700 }}>{item.result}</span>}
        </div>
      </div>
    </div>
  );
}
