import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Film,
  Lock,
  Maximize2,
  MessageCircle,
  Play,
  Search,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { useStore, waLink, ytThumb } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { waNumberFor } from '@/lib/money';
import type { PortfolioItem } from '@/content/types';
import { Lightbox } from '@/components/shared';

const StrategyModal = lazy(() =>
  import('@/components/StrategyModal').then((m) => ({ default: m.StrategyModal }))
);

function getQueryVideoId(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  if (qIndex >= 0) {
    const params = new URLSearchParams(hash.slice(qIndex + 1));
    return params.get('v') || params.get('video') || params.get('reel');
  }
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('v') || searchParams.get('video') || searchParams.get('reel');
}

export default function WorkShowcasePage() {
  const { content } = useStore();
  const { country } = useCountry();

  const allVideos = useMemo(
    () =>
      content.portfolio
        .filter((p) => p.visible && p.youtubeId)
        .sort((a, b) => a.order - b.order),
    [content.portfolio]
  );

  const [selectedId, setSelectedId] = useState<string>(() => {
    const fromUrl = getQueryVideoId();
    if (fromUrl && allVideos.some((v) => v.id === fromUrl || v.youtubeId === fromUrl)) {
      const found = allVideos.find((v) => v.id === fromUrl || v.youtubeId === fromUrl);
      if (found) return found.id;
    }
    return allVideos[0]?.id || '';
  });

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoPlayStage, setAutoPlayStage] = useState<boolean>(false);
  const [stageIframeLoaded, setStageIframeLoaded] = useState<boolean>(false);
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const [strategyOpen, setStrategyOpen] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync URL query param `?v=...` on hashchange
  useEffect(() => {
    const syncFromHash = () => {
      const vId = getQueryVideoId();
      if (vId) {
        const match = allVideos.find((v) => v.id === vId || v.youtubeId === vId);
        if (match) {
          setSelectedId(match.id);
          setAutoPlayStage(true);
        }
      }
    };
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [allVideos]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Prevent keyboard save / view-source shortcuts on the view-only display page
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'u')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeVideo = useMemo(
    () => allVideos.find((v) => v.id === selectedId) || allVideos[0] || null,
    [allVideos, selectedId]
  );

  const activeIndex = useMemo(
    () => (activeVideo ? allVideos.findIndex((v) => v.id === activeVideo.id) : 0),
    [allVideos, activeVideo]
  );

  useEffect(() => {
    setStageIframeLoaded(false);
  }, [activeVideo?.id, autoPlayStage]);

  const categories = useMemo(() => {
    const present = new Set(allVideos.map((v) => v.category));
    const base = content.categories.filter((c) => c === 'All' || present.has(c));
    return base.length > 0 ? base : ['All'];
  }, [allVideos, content.categories]);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allVideos.filter((v) => {
      const matchesCat = activeCategory === 'All' || v.category === activeCategory;
      const matchesSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.client.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        (v.result && v.result.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [allVideos, activeCategory, searchQuery]);

  const buildShareUrl = (videoId?: string) => {
    if (typeof window === 'undefined') return '#/our-work';
    const base = `${window.location.origin}${window.location.pathname}`;
    return videoId ? `${base}#/our-work?v=${encodeURIComponent(videoId)}` : `${base}#/our-work`;
  };

  const handleCopyLink = async (key: string, videoId?: string) => {
    const url = buildShareUrl(videoId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2200);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2200);
    }
  };

  const handleSelectVideo = (item: PortfolioItem, scrollToStage = true) => {
    setSelectedId(item.id);
    setAutoPlayStage(true);
    try {
      window.history.replaceState(null, '', `#/our-work?v=${encodeURIComponent(item.id)}`);
    } catch {
      /* ignore */
    }
    if (scrollToStage) {
      document.getElementById('screening-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevReel = () => {
    if (allVideos.length <= 1) return;
    const prevIdx = (activeIndex - 1 + allVideos.length) % allVideos.length;
    handleSelectVideo(allVideos[prevIdx], false);
  };

  const handleNextReel = () => {
    if (allVideos.length <= 1) return;
    const nextIdx = (activeIndex + 1) % allVideos.length;
    handleSelectVideo(allVideos[nextIdx], false);
  };

  const whatsappHref = waLink(
    waNumberFor(content.settings.whatsappNumber, country),
    `Hi ${content.settings.whatsappDisplay}, I just watched your videos in the AdVibe Screening Room and would love to discuss a project.`
  );

  return (
    <div
      className="min-h-dvh bg-[#0a0c0f] text-[#f5f5f0] select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Top Studio Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0c0f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-5">
            <a
              href="#/"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-4 w-4 text-[#f5a524]" />
              <span>Back to Main Site</span>
            </a>

            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5a524] text-[#111412]">
                <Play className="h-4 w-4 fill-current" />
              </span>
              <div>
                <span className="block font-display text-sm font-bold tracking-tight text-white">
                  {content.brand.name}
                </span>
                <span className="block text-[11px] text-white/55">
                  Official Studio Screening Room · View-Only Access
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleCopyLink('page-header')}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-white transition hover:border-[#f5a524]/60 hover:bg-white/[0.1]"
            >
              {copiedKey === 'page-header' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Page Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-[#f5a524]" />
                  <span>Share All Work Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStrategyOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#f5a524] px-4 py-2 font-display text-xs font-extrabold text-[#111412] transition hover:brightness-110"
            >
              <span>Book a Strategy Call</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 pt-8 pb-24 sm:px-6 sm:pt-12">
        {/* Hero Header + View-Only Notice */}
        <div className="mb-8 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#f5a524]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Official Portfolio & Master Reel Directory</span>
              <span aria-hidden="true" className="text-white/30">·</span>
              <span className="text-white/65">View-Only Streaming (Downloads Disabled)</span>
            </div>
            <h1
              className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl"
              style={{ textWrap: 'balance' }}
            >
              Every AdVibe Studio Production, Ready to Watch.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-white/70 sm:text-lg">
              Select any campaign reel below or from the quick-link directory to stream immediately in high definition. All videos are protected studio masters presented for viewing only.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Lock className="h-3.5 w-3.5 text-[#f5a524]" />
              <span>{allVideos.length} Verified Studio Reels</span>
              <span aria-hidden="true">·</span>
              <span>Stream-Only Protection Active</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: CINEMA SCREENING STAGE + QUICK WATCH LINKS DIRECTORY */}
        {activeVideo && (
          <section
            id="screening-stage"
            aria-label="Studio Screening Stage and Watch Links"
            className="mb-16 scroll-mt-24 grid grid-cols-1 gap-6 lg:grid-cols-12"
          >
            {/* Left / Center: Protected View-Only Player Stage */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/12 bg-[#11151c] p-4 sm:p-6 lg:col-span-7">
              {/* Top Stage Bar */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-white/55">
                    <span className="font-mono font-bold text-[#f5a524] tabular-nums">
                      REEL {String(activeIndex + 1).padStart(2, '0')} / {String(allVideos.length).padStart(2, '0')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeVideo.client}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeVideo.category}</span>
                  </div>
                  <h2 className="mt-1 truncate font-display text-lg font-bold text-white sm:text-xl">
                    {activeVideo.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevReel}
                    aria-label="Previous video"
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextReel}
                    aria-label="Next video"
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxItem(activeVideo)}
                    title="Expand in Theater Lightbox"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#f5a524]/40 bg-[#f5a524]/15 px-3 text-xs font-bold text-[#f5a524] transition hover:bg-[#f5a524]/25"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Theater Mode</span>
                  </button>
                </div>
              </div>

              {/* View-Only Video Frame */}
              <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-black py-2">
                <div
                  className="relative w-full overflow-hidden rounded-xl bg-black shadow-2xl"
                  style={{
                    aspectRatio: activeVideo.orientation === 'vertical' ? '9 / 16' : '16 / 9',
                    maxWidth: activeVideo.orientation === 'vertical' ? 350 : '100%',
                    maxHeight: '68dvh',
                  }}
                >
                  {!autoPlayStage ? (
                    <button
                      type="button"
                      onClick={() => setAutoPlayStage(true)}
                      className="group relative block h-full w-full text-left focus:outline-none"
                      aria-label={`Play ${activeVideo.title}`}
                    >
                      <img
                        src={ytThumb(activeVideo.youtubeId)}
                        alt={activeVideo.title}
                        draggable={false}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/30" />

                      {/* View-only top watermark */}
                      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white/75">
                        <span className="rounded-md bg-black/65 px-2.5 py-1 backdrop-blur-md">
                          {content.brand.name} · View-Only
                        </span>
                        <span className="rounded-md bg-black/65 px-2.5 py-1 backdrop-blur-md">
                          {activeVideo.orientation === 'vertical' ? '9:16 Vertical' : '16:9 Widescreen'}
                        </span>
                      </div>

                      {/* Center Play Trigger */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                        <span className="grid h-16 w-16 place-items-center rounded-full bg-[#f5a524] text-[#111412] shadow-[0_0_40px_rgba(245,165,36,0.6)] transition duration-200 group-hover:scale-110">
                          <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                        </span>
                        <span className="rounded-xl bg-black/75 px-3.5 py-1.5 font-display text-xs font-bold text-white backdrop-blur-md">
                          Click to Watch Reel #{activeIndex + 1}
                        </span>
                      </div>

                      {/* Bottom info inside frame */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                        <p className="font-display text-base font-bold text-white">{activeVideo.title}</p>
                        <p className="mt-0.5 text-xs text-white/70">
                          {activeVideo.client}
                          {activeVideo.result ? ` · ${activeVideo.result}` : ''}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <>
                      {!stageIframeLoaded && (
                        <div className="absolute inset-0 z-10 grid place-items-center bg-black">
                          <img
                            src={ytThumb(activeVideo.youtubeId)}
                            alt=""
                            draggable={false}
                            className="absolute inset-0 h-full w-full object-cover opacity-40"
                          />
                          <div className="relative z-10 flex flex-col items-center gap-2 rounded-2xl bg-black/80 px-5 py-3 text-xs font-bold text-[#f5a524]">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f5a524]/30 border-t-[#f5a524]" />
                            <span>Loading Protected Stream…</span>
                          </div>
                        </div>
                      )}
                      <iframe
                        key={`${activeVideo.id}-${autoPlayStage}`}
                        src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`}
                        title={activeVideo.title}
                        allow="accelerometer; autoplay; encrypted-media; gyroscope"
                        allowFullScreen
                        onLoad={() => setStageIframeLoaded(true)}
                        className="relative z-10 h-full w-full border-0"
                      />
                      {/* Protective Shield Top Bar: Blocks clicking external title/share links while allowing full video playback */}
                      <div
                        className="
                          absolute top-0 left-0 right-0 z-20 flex h-14 items-center justify-between
                          bg-gradient-to-b from-black/80 via-black/35 to-transparent px-3.5 select-none
                        "
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        <span className="font-mono text-[10px] font-semibold tracking-wider text-white/75 uppercase">
                          {content.brand.name} · Protected View-Only Stream
                        </span>
                        <span className="font-mono text-[10px] text-white/60">No Download</span>
                      </div>
                      {/* Protective Shield Bottom-Right Logo Area: Blocks external site popout while keeping fullscreen & timeline controls accessible */}
                      <div
                        className="absolute right-11 bottom-0 z-20 h-11 w-28 select-none"
                        onContextMenu={(e) => e.preventDefault()}
                        title="View-Only Protected Stream"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Bottom Stage Bar: Direct Watch Link & Actions */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-white/65">
                  <Film className="h-4 w-4 text-[#f5a524]" />
                  <span>{activeVideo.result || `${activeVideo.client} Campaign Production`}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(`stage-${activeVideo.id}`, activeVideo.id)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 text-xs font-semibold text-white transition hover:border-[#f5a524] hover:text-[#f5a524]"
                  >
                    {copiedKey === `stage-${activeVideo.id}` ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Watch Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Watch Link for This Video</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Complete Directory of Watch Links to All Work */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/12 bg-[#11151c] p-5 sm:p-6 lg:col-span-5">
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <span className="font-mono text-[11px] font-bold tracking-wider text-[#f5a524] uppercase">
                      Master Watch Directory
                    </span>
                    <h3 className="mt-0.5 font-display text-lg font-bold text-white">
                      Direct Links to All Our Work ({allVideos.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink('directory-all')}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-xs font-semibold text-white/85 transition hover:border-[#f5a524] hover:text-[#f5a524]"
                  >
                    {copiedKey === 'directory-all' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Page Link</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-white/60">
                  Click any video link below to play it immediately in the screening player, or copy its view-only link to share with a client or teammate.
                </p>

                {/* Scrollable Watch Links List */}
                <div className="mt-4 max-h-[460px] space-y-2 overflow-y-auto pr-1">
                  {allVideos.map((item, idx) => {
                    const isCurrent = activeVideo?.id === item.id;
                    const copyId = `dir-${item.id}`;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-2.5 rounded-2xl border p-2.5 transition ${
                          isCurrent
                            ? 'border-[#f5a524] bg-[#f5a524]/12'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectVideo(item, false)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-black">
                            <img
                              src={ytThumb(item.youtubeId)}
                              alt=""
                              draggable={false}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute inset-0 grid place-items-center bg-black/40">
                              <Play
                                className={`h-3.5 w-3.5 fill-current ${
                                  isCurrent ? 'text-[#f5a524]' : 'text-white'
                                }`}
                              />
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-white/55">
                              <span className="font-mono font-bold text-[#f5a524] tabular-nums">
                                #{String(idx + 1).padStart(2, '0')}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{item.category}</span>
                            </div>
                            <p className="truncate font-display text-sm font-bold text-white">
                              {item.title}
                            </p>
                            <p className="truncate text-[11px] text-white/60">
                              {item.client}
                              {item.result ? ` · ${item.result}` : ''}
                            </p>
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectVideo(item, false)}
                            className={`rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                              isCurrent
                                ? 'bg-[#f5a524] text-[#111412]'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {isCurrent && autoPlayStage ? 'Playing' : 'Watch'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(copyId, item.id)}
                            title="Copy view-only watch link"
                            aria-label={`Copy watch link for ${item.title}`}
                            className="grid h-8 w-8 place-items-center rounded-xl border border-white/15 bg-white/[0.04] text-white/75 transition hover:border-[#f5a524] hover:text-[#f5a524]"
                          >
                            {copiedKey === copyId ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Protection Footer inside Directory */}
              <div className="mt-5 border-t border-white/10 pt-4 text-xs text-white/55">
                All links on this page open in view-only streaming mode. Right-click saving and file downloads are disabled.
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: COMPLETE VISUAL GALLERY OF ALL VIDEOS */}
        <section aria-label="All Studio Videos Visual Grid">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-xs font-bold tracking-wider text-[#f5a524] uppercase">
                Complete Video Library
              </span>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">
                Browse & Watch All Studio Reels ({filteredVideos.length})
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, client, or style…"
                className="min-h-[42px] w-full rounded-xl border border-white/15 bg-white/[0.04] py-2 pr-3.5 pl-10 text-sm text-white placeholder:text-white/40 focus:border-[#f5a524] focus:outline-none"
              />
            </div>
          </div>

          {/* Interactive Category Filter Controls */}
          <div
            className="no-scrollbar mb-8 flex items-center gap-2 overflow-x-auto pb-2"
            role="tablist"
            aria-label="Filter videos by category"
          >
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveCategory(cat)}
                  className={`min-h-[40px] shrink-0 rounded-xl border px-4 py-2 text-xs font-bold transition ${
                    isSelected
                      ? 'border-[#f5a524] bg-[#f5a524] text-[#111412]'
                      : 'border-white/15 bg-white/[0.04] text-white/75 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Video Cards Grid */}
          {filteredVideos.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
              <p className="font-display text-lg font-bold text-white">No videos match your filter</p>
              <p className="mt-1 text-sm text-white/60">
                Try clearing your search or selecting "All" categories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 rounded-xl bg-[#f5a524] px-4 py-2.5 text-xs font-bold text-[#111412]"
              >
                Show All Videos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredVideos.map((item, idx) => {
                const isPlayingOnStage = activeVideo?.id === item.id && autoPlayStage;
                const cardCopyKey = `card-${item.id}`;
                return (
                  <article
                    key={item.id}
                    className={`group flex flex-col justify-between overflow-hidden rounded-3xl border bg-[#11151c] transition duration-300 ${
                      isPlayingOnStage
                        ? 'border-[#f5a524] shadow-[0_16px_40px_-15px_rgba(245,165,36,0.3)]'
                        : 'border-white/12 hover:border-white/30'
                    }`}
                  >
                    {/* Clickable Thumbnail */}
                    <div className="relative aspect-[9/14] w-full overflow-hidden bg-black">
                      <img
                        src={ytThumb(item.youtubeId)}
                        alt={item.title}
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#11151c] via-black/20 to-black/30" />

                      {/* Top index & View-only label */}
                      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white/80">
                        <span className="rounded-md bg-black/70 px-2 py-0.5 font-bold text-[#f5a524] backdrop-blur-md tabular-nums">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="rounded-md bg-black/70 px-2 py-0.5 backdrop-blur-md">
                          View-Only
                        </span>
                      </div>

                      {/* Center Play Button Overlay */}
                      <button
                        type="button"
                        onClick={() => setLightboxItem(item)}
                        aria-label={`Watch ${item.title}`}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 focus:outline-none"
                      >
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-[#f5a524] text-[#111412] shadow-xl transition duration-200 group-hover:scale-110">
                          <Play className="h-6 w-6 translate-x-0.5 fill-current" />
                        </span>
                        <span className="rounded-lg bg-black/75 px-3 py-1 font-display text-[11px] font-bold text-white backdrop-blur-md">
                          Watch Fullscreen
                        </span>
                      </button>
                    </div>

                    {/* Card Details + Watch & Link Actions */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-white/55">
                          <span>{item.client}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.category}</span>
                        </div>
                        <h3 className="mt-1 font-display text-base font-bold text-white">
                          {item.title}
                        </h3>
                        {item.result && (
                          <p className="mt-1 text-xs text-white/65">{item.result}</p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
                        <button
                          type="button"
                          onClick={() => handleSelectVideo(item, true)}
                          className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#f5a524] px-3 text-xs font-extrabold text-[#111412] transition hover:brightness-110"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>{isPlayingOnStage ? 'Playing Above' : 'Play on Stage'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(cardCopyKey, item.id)}
                          title="Copy direct watch link to this video"
                          className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-xs font-semibold text-white/85 transition hover:border-[#f5a524] hover:text-[#f5a524]"
                        >
                          {copiedKey === cardCopyKey ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Copied</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Closing CTA Banner */}
        <section className="mt-20 rounded-3xl border border-white/12 bg-gradient-to-br from-[#141923] to-[#0d1016] p-8 text-center sm:p-12">
          <span className="font-mono text-xs font-bold tracking-wider text-[#f5a524] uppercase">
            Ready to Launch Your Campaign?
          </span>
          <h2
            className="mx-auto mt-2 max-w-2xl font-display text-2xl font-extrabold text-white sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            Want Scroll-Stopping AI Video Ads Like These for Your Business?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Whether you need a single high-converting video ad, a 5-video testing pack, a 15-video monthly retainer, or an episodic brand mini-series, our studio handles script to screen in days.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => setStrategyOpen(true)}
              className="inline-flex min-h-[48px] items-center gap-2.5 rounded-2xl bg-[#f5a524] px-6 py-3 font-display text-sm font-extrabold text-[#111412] transition hover:brightness-110"
            >
              <span>Book a Free Strategy Session</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.05] px-6 py-3 font-display text-sm font-bold text-white transition hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </section>
      </main>

      {/* Fullscreen View-Only Lightbox */}
      <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />

      {/* Strategy Session Modal */}
      {strategyOpen && (
        <Suspense fallback={null}>
          <StrategyModal
            onClose={() => setStrategyOpen(false)}
            offerId="strategy"
            offerTitle="Free Strategy Session (From Screening Room)"
          />
        </Suspense>
      )}
    </div>
  );
}
