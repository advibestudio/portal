import { useEffect, useRef, useState } from 'react';
import heroPosterDesktopUrl from '@/assets/hero/hero-poster.webp';
import heroPosterMobileUrl from '@/assets/hero/hero-poster-mobile.webp';
import heroVideoDesktopUrl from '@/assets/hero/hero-video-fast.mp4';
import heroVideoMobileUrl from '@/assets/hero/hero-video-mobile.mp4';

/**
 * Instant-booting, Git-bundled full-bleed mosaic video backdrop for commercial hero sections.
 * - Bundles both mobile (portrait 3x6 multi-tile mosaic, ~550KB faststart) and desktop (16:9 6x3 mosaic)
 *   directly via Vite ES module imports + relative ./assets/aistudio/ fallbacks so GitHub Pages (/portal/) never 404s.
 * - Paints a lightweight Frame-0 WebP poster at 0ms (zero black screen on slow mobile internet).
 * - Restores the signature dark cinema obsidian vignette + #f5a524 gold ambient glow while keeping the mosaic tastefully visible.
 */
export function HeroMosaicVideoBackdrop() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    setIsMobileViewport(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const activePosterSrc = isMobileViewport ? heroPosterMobileUrl : heroPosterDesktopUrl;
  const activeVideoSrc = isMobileViewport ? heroVideoMobileUrl : heroVideoDesktopUrl;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Guarantee muted inline attributes for strict Chrome / iOS Safari autoplay engines
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const attemptPlay = () => {
      if (!video) return;
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Fallback: if mobile browser is in Data Saver / Low Power Mode, play on first touch
          });
        }
      }
    };

    attemptPlay();

    const handleCanPlay = () => {
      attemptPlay();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        attemptPlay();
      }
    };

    const handleFirstInteraction = () => {
      attemptPlay();
    };

    video.addEventListener('loadeddata', handleCanPlay);
    video.addEventListener('canplay', handleCanPlay);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true, once: true });

    return () => {
      video.removeEventListener('loadeddata', handleCanPlay);
      video.removeEventListener('canplay', handleCanPlay);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [activeVideoSrc]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#07090d]">
      {/* Layer 1: Instant 0ms Frame-0 WebP Backdrop (Portrait 3x6 grid on mobile, 16:9 6x3 grid on desktop) */}
      <picture>
        <source srcSet={heroPosterMobileUrl} media="(max-width: 768px)" type="image/webp" />
        <source srcSet={heroPosterDesktopUrl} media="(min-width: 769px)" type="image/webp" />
        <img
          src={activePosterSrc}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="sync"
          className="absolute inset-0 h-full w-full scale-[1.01] object-cover object-center"
        />
      </picture>

      {/* Layer 2: Fast-Start Bundled Video Stream (550KB portrait multi-tile on mobile, HD widescreen on desktop) */}
      <video
        key={activeVideoSrc}
        ref={videoRef}
        src={activeVideoSrc}
        poster={activePosterSrc}
        preload="auto"
        autoPlay
        loop
        muted
        playsInline
        // @ts-expect-error fetchpriority is supported in modern Chrome
        fetchpriority="high"
        className="relative h-full w-full scale-[1.01] object-cover object-center opacity-100"
      >
        <source
          src={heroVideoMobileUrl}
          type="video/mp4"
          media="(max-width: 768px)"
        />
        <source
          src={heroVideoDesktopUrl}
          type="video/mp4"
        />
        <source
          src="./assets/aistudio/hero-video-mobile.mp4"
          type="video/mp4"
          media="(max-width: 768px)"
        />
        <source
          src="./assets/aistudio/hero-video-fast.mp4"
          type="video/mp4"
        />
        <source
          src="./assets/aistudio/hero-video_3a894603.mp4"
          type="video/mp4"
        />
      </video>

      {/* Layer 3: Signature AdVibe Dark Cinema Vignette Stack — moody obsidian depth + crisp text legibility + visible mosaic */}
      <div className="absolute inset-0 bg-[#07090d]/42" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_62%_56%_at_50%_46%,rgba(7,9,13,0.78)_0%,rgba(7,9,13,0.48)_58%,rgba(7,9,13,0.68)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_38%_at_50%_42%,rgba(245,165,36,0.15)_0%,transparent_72%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#07090d]/90 via-[#07090d]/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07090d] via-[#07090d]/75 to-transparent" />
    </div>
  );
}
