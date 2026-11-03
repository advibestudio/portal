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
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className="vcard select-none"
      style={{ aspectRatio: item.orientation === 'vertical' ? '9 / 16' : '16 / 9' }}
      aria-label={`Play video: ${item.title}`}
    >
      {imgOk ? (
        <img src={ytThumb(item.youtubeId)} alt="" loading="lazy" draggable={false} onError={() => setImgOk(false)} />
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
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIframeLoaded(false);
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('is-modal-open');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      document.body.classList.remove('is-modal-open');
    };
  }, [item, onClose]);

  if (!item) return null;
  const vertical = item.orientation === 'vertical';
  return (
    <div
      className="lightbox select-none"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      role="dialog"
      aria-modal="true"
      aria-label={`Video: ${item.title}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(11, 14, 18, 0.92)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Floating top-right corner close button (always above player) */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        style={{
          position: 'fixed',
          top: 14,
          right: 14,
          zIndex: 130,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 16px',
          borderRadius: 999,
          background: '#f5a524',
          color: '#111412',
          fontWeight: 800,
          fontSize: 13,
          border: '2px solid #ffffff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          cursor: 'pointer',
        }}
      >
        <X size={18} strokeWidth={2.8} />
        <span>Exit Video</span>
      </button>

      <div
        className="lightbox-box anim-pop"
        style={{
          width: '100%',
          maxWidth: vertical ? 380 : 900,
          overflow: 'hidden',
          borderRadius: 24,
          background: '#000',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Unmistakable Top Header Bar directly attached to player */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 14px',
            background: '#16191e',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
          }}
        >
          <div style={{ minWidth: 0, textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {item.client} · {item.category}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.14)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
            }}
          >
            <X size={15} />
            <span>Close</span>
          </button>
        </div>

        {/* Video Container with Instant Cached Thumbnail until Iframe finishes loading */}
        <div
          style={{
            position: 'relative',
            aspectRatio: vertical ? '9 / 16' : '16 / 9',
            maxHeight: '72dvh',
            margin: '0 auto',
            background: '#000',
          }}
        >
          {!iframeLoaded && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                display: 'grid',
                placeItems: 'center',
                background: '#000',
              }}
            >
              <img
                src={ytThumb(item.youtubeId)}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
              />
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 18px',
                  borderRadius: 16,
                  background: 'rgba(11,14,18,0.82)',
                  color: '#f5a524',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: '3px solid rgba(245,165,36,0.25)',
                    borderTopColor: '#f5a524',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                <span>Loading Studio Reel…</span>
              </div>
            </div>
          )}
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`}
            title={item.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              height: '100%',
              border: 0,
              opacity: iframeLoaded ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          />
          {/* View-only shield: prevents clicking external title/watch-on-YouTube links while keeping playback & fullscreen controls active */}
          <div
            onContextMenu={(e) => e.preventDefault()}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 56,
              zIndex: 3,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.7)',
              userSelect: 'none',
            }}
          >
            <span>AdVibe Studios · View-Only Stream</span>
            <span>Protected Master</span>
          </div>
          <div
            onContextMenu={(e) => e.preventDefault()}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 44,
              width: 110,
              height: 44,
              zIndex: 3,
              userSelect: 'none',
            }}
          />
        </div>

        <div
          className="lightbox-cap"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 16px',
            color: '#fff',
            background: '#16191e',
          }}
        >
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
            {item.result || `${item.client} Verified Production`}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: '#f5a524',
              color: '#111412',
              fontSize: 12,
              fontWeight: 800,
              border: 0,
              cursor: 'pointer',
            }}
          >
            Done Watching
          </button>
        </div>
      </div>
    </div>
  );
}
