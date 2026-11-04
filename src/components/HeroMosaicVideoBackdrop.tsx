import { useEffect, useRef, useState } from 'react';

/**
 * Instant-booting full-bleed mosaic video backdrop for commercial hero sections.
 * - Paints a ~35KB Frame-0 WebP poster at 0ms (zero black flash, no baked-in reference screenshot text)
 * - Serves an ~850KB fast-start mobile MP4 on viewports <= 768px and a fast-start HD MP4 on desktop
 * - Enforces mobile autoplay (muted + defaultMuted + playsInline) with Low-Power/visibility recovery
 */
export function HeroMosaicVideoBackdrop() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Guarantee muted inline attributes for strict iOS Safari & Android Chrome autoplay engines
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const attemptPlay = () => {
      if (!video) return;
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setVideoReady(true);
            })
            .catch(() => {
              // Fallback: if mobile browser is in Low Power Mode, play on first touch/scroll
            });
        }
      } else {
        setVideoReady(true);
      }
    };

    // If already buffered enough in cache, mark ready immediately
    if (video.readyState >= 2) {
      setVideoReady(true);
    }

    attemptPlay();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        attemptPlay();
      }
    };

    const handleFirstInteraction = () => {
      attemptPlay();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true, once: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#07090d]">
      {/* Layer 1: Instant 0ms Frame-0 WebP Backdrop (matches frame 1 of the video pixel-for-pixel) */}
      <img
        src="/assets/aistudio/hero-poster.webp"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="sync"
        className="absolute inset-0 h-full w-full scale-[1.01] object-cover"
      />

      {/* Layer 2: Fast-Start Responsive Video Stream (Mobile 960p vs Desktop 1440p) */}
      <video
        ref={videoRef}
        poster="/assets/aistudio/hero-poster.webp"
        preload="auto"
        autoPlay
        loop
        muted
        playsInline
        // @ts-expect-error fetchpriority is supported in modern mobile browsers
        fetchpriority="high"
        onLoadedData={() => setVideoReady(true)}
        onCanPlay={() => setVideoReady(true)}
        onPlaying={() => setVideoReady(true)}
        className={`relative h-full w-full scale-[1.01] object-cover transition-opacity duration-300 ${
          videoReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source
          src="/assets/aistudio/hero-video-mobile.mp4"
          type="video/mp4"
          media="(max-width: 768px)"
        />
        <source
          src="/assets/aistudio/hero-video-fast.mp4"
          type="video/mp4"
        />
        <source
          src="/assets/aistudio/hero-video_3a894603.mp4"
          type="video/mp4"
        />
      </video>

      {/* Layer 3: Multi-layered brand-tuned cinema vignette (retains peripheral mosaic vibrancy + 100% text contrast) */}
      <div className="absolute inset-0 bg-[#07090d]/55" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_62%_58%_at_50%_46%,rgba(7,9,13,0.88)_0%,rgba(7,9,13,0.62)_56%,rgba(7,9,13,0.84)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_38%_at_50%_42%,rgba(245,165,36,0.16)_0%,transparent_72%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#07090d]/90 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07090d] via-[#07090d]/85 to-transparent" />
    </div>
  );
}
