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
  X,
} from 'lucide-react';
import { useStore, waLink, ytThumb } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { waNumberFor } from '@/lib/money';
import { useTheme } from '@/lib/theme';
import type { PortfolioItem } from '@/content/types';
import { Lightbox } from '@/components/shared';
import { AppQuickSwitcher, ThemeToggleButton } from '@/components/UnifiedAppNav';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
  const [formatFilter, setFormatFilter] = useState<'all' | 'vertical' | 'horizontal'>('all');
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
      const matchesFormat =
        formatFilter === 'all' ||
        (formatFilter === 'vertical' && v.orientation === 'vertical') ||
        (formatFilter === 'horizontal' && v.orientation !== 'vertical');
      const matchesSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.client.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        (v.result && v.result.toLowerCase().includes(q));
      return matchesCat && matchesFormat && matchesSearch;
    });
  }, [allVideos, activeCategory, formatFilter, searchQuery]);

  const buildShareUrl = (videoId?: string) => {
    if (typeof window === 'undefined') return '#/our-work';
    const base = `${window.location.origin}${window.location.pathname}`;
    return videoId ? `${base}#/our-work?v=${encodeURIComponent(videoId)}` : `${base}#/our-work`;
  };

  const copyTextToClipboard = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2400);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2400);
    }
  };

  const handleCopyLink = (key: string, videoId?: string) => {
    const url = buildShareUrl(videoId);
    void copyTextToClipboard(key, url);
  };

  const handleCopyAllLinksBundle = () => {
    const masterUrl = buildShareUrl();
    const lines = [
      `${content.brand.name} — Official View-Only Portfolio & Screening Room`,
      `Watch All Videos: ${masterUrl}`,
      '',
      ...allVideos.map(
        (v, idx) =>
          `${String(idx + 1).padStart(2, '0')}. ${v.title} (${v.client} · ${v.category})\n   Watch: ${buildShareUrl(v.id)}`
      ),
    ];
    void copyTextToClipboard('bundle-all', lines.join('\n'));
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

  // Explicit theme palette classes so both White Mode and Dark Mode have 100% WCAG AAA contrast
  const pageBg = isDark ? 'bg-[#0a0d12] text-[#f5f5f0]' : 'bg-[#faf9f5] text-[#111412]';
  const headerBg = isDark
    ? 'border-white/12 bg-[#0a0d12]/92 text-[#f5f5f0]'
    : 'border-[#111412]/10 bg-[#faf9f5]/92 text-[#111412]';
  const cardBg = isDark
    ? 'border-white/14 bg-[#131822] text-[#f5f5f0] shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)]'
    : 'border-[#111412]/12 bg-white text-[#111412] shadow-[0_20px_48px_-28px_rgba(17,20,18,0.14)]';
  const subtleSurface = isDark
    ? 'border-white/12 bg-white/[0.04] text-[#f5f5f0]'
    : 'border-[#111412]/12 bg-[#f3f4ef] text-[#111412]';
  const textPrimary = isDark ? 'text-white' : 'text-[#111412]';
  const textSecondary = isDark ? 'text-white/78' : 'text-[#2a302b]';
  const textMuted = isDark ? 'text-white/60' : 'text-[#525b53]';
  const accentText = isDark ? 'text-[#f5a524]' : 'text-[#a86400]';
  const dividerBorder = isDark ? 'border-white/12' : 'border-[#111412]/10';
  const secondaryBtn = isDark
    ? 'border-white/18 bg-white/[0.06] text-white hover:border-[#f5a524] hover:bg-white/[0.12]'
    : 'border-[#111412]/15 bg-white text-[#111412] hover:border-[#111412]/40 hover:bg-[#f3f4ef]';

  return (
    <div
      className={`theme-managed min-h-dvh select-none transition-colors duration-200 ${pageBg}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Top Studio Navigation Bar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${headerBg}`}>
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-2.5 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <a
              href="#/"
              className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold no-underline transition ${secondaryBtn}`}
            >
              <ArrowLeft className={`h-4 w-4 ${isDark ? 'text-[#f5a524]' : 'text-[#111412]'}`} />
              <span>Main Site</span>
            </a>

            <div className="hidden items-center gap-2.5 md:flex min-w-0">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#111412] text-[#f5a524]">
                <Play className="h-4 w-4 fill-current" />
              </span>
              <div className="min-w-0">
                <span className={`block truncate font-display text-sm font-extrabold tracking-tight ${textPrimary}`}>
                  {content.brand.name}
                </span>
                <span className={`block truncate text-[11px] ${textMuted}`}>
                  Official Portfolio &amp; Screening Room · View-Only
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick App Switcher */}
            <AppQuickSwitcher label="Navigate" compact />

            {/* White Mode / Dark Mode Toggle */}
            <ThemeToggleButton />

            {/* Share All Work Link */}
            <button
              type="button"
              onClick={() => handleCopyLink('page-header')}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${secondaryBtn}`}
            >
              {copiedKey === 'page-header' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className={`h-3.5 w-3.5 ${isDark ? 'text-[#f5a524]' : 'text-[#a86400]'}`} />
                  <span className="hidden sm:inline">Share Page Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStrategyOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#f5a524] px-4 py-2 font-display text-xs font-extrabold text-[#111412] transition hover:brightness-105"
            >
              <span>Book Strategy Call</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 pt-8 pb-24 sm:px-6 sm:pt-12">
        {/* Hero Header + View-Only Notice + Quick Share Toolbar */}
        <div className={`mb-10 flex flex-col justify-between gap-6 border-b pb-8 lg:flex-row lg:items-end ${dividerBorder}`}>
          <div className="max-w-2xl">
            <div className={`mb-3 flex flex-wrap items-center gap-2 text-xs font-bold ${accentText}`}>
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Official Portfolio &amp; Master Reel Directory</span>
              <span aria-hidden="true" className={textMuted}>·</span>
              <span className={textMuted}>View-Only Streaming (Downloads Disabled)</span>
            </div>
            <h1
              className={`font-display text-3xl font-extrabold tracking-tight sm:text-5xl ${textPrimary}`}
              style={{ textWrap: 'balance', lineHeight: 1.06 }}
            >
              Every {content.brand.name} Video, Ready to Watch.
            </h1>
            <p className={`mt-3.5 text-base leading-relaxed sm:text-lg ${textSecondary}`}>
              Click any video in the directory or gallery below to watch immediately in high definition, or copy its direct view-only link to share with a client or teammate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleCopyLink('hero-page-link')}
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${secondaryBtn}`}
            >
              {copiedKey === 'hero-page-link' ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>
                    Master Page Link Copied
                  </span>
                </>
              ) : (
                <>
                  <Copy className={`h-4 w-4 ${isDark ? 'text-[#f5a524]' : 'text-[#a86400]'}`} />
                  <span>Copy Master Showcase Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyAllLinksBundle}
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${secondaryBtn}`}
            >
              {copiedKey === 'bundle-all' ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>
                    All {allVideos.length} Video Links Copied
                  </span>
                </>
              ) : (
                <>
                  <Share2 className={`h-4 w-4 ${isDark ? 'text-[#f5a524]' : 'text-[#a86400]'}`} />
                  <span>Copy All {allVideos.length} Links List</span>
                </>
              )}
            </button>
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
            <div className={`flex flex-col justify-between rounded-3xl border p-4 sm:p-6 lg:col-span-7 ${cardBg}`}>
              {/* Top Stage Bar */}
              <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${dividerBorder}`}>
                <div className="min-w-0 flex-1">
                  <div className={`flex flex-wrap items-center gap-2 text-xs ${textMuted}`}>
                    <span className={`font-mono font-extrabold tabular-nums ${accentText}`}>
                      REEL {String(activeIndex + 1).padStart(2, '0')} / {String(allVideos.length).padStart(2, '0')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={`font-semibold ${textSecondary}`}>{activeVideo.client}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeVideo.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeVideo.orientation === 'vertical' ? '9:16 Vertical' : '16:9 Widescreen'}</span>
                  </div>
                  <h2 className={`mt-1 truncate font-display text-lg font-extrabold sm:text-xl ${textPrimary}`}>
                    {activeVideo.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevReel}
                    aria-label="Previous video"
                    className={`inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-bold transition ${secondaryBtn}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextReel}
                    aria-label="Next video"
                    className={`inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-bold transition ${secondaryBtn}`}
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxItem(activeVideo)}
                    title="Expand in Theater Lightbox"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#f5a524] px-3.5 text-xs font-extrabold text-[#111412] transition hover:brightness-105"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </button>
                </div>
              </div>

              {/* View-Only Cinema Video Frame (Always dark theater backdrop for crisp video contrast) */}
              <div className="keep-dark relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-[#07090d] p-3 sm:p-5">
                <div
                  className="relative w-full overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/15"
                  style={{
                    aspectRatio: activeVideo.orientation === 'vertical' ? '9 / 16' : '16 / 9',
                    maxWidth: activeVideo.orientation === 'vertical' ? 340 : '100%',
                    maxHeight: '66dvh',
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />

                      {/* View-only top watermark */}
                      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white/90">
                        <span className="rounded-md bg-black/70 px-2.5 py-1 backdrop-blur-md">
                          {content.brand.name} · View-Only
                        </span>
                        <span className="rounded-md bg-black/70 px-2.5 py-1 backdrop-blur-md">
                          {activeVideo.orientation === 'vertical' ? '9:16' : '16:9'}
                        </span>
                      </div>

                      {/* Center Play Trigger */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                        <span className="grid h-16 w-16 place-items-center rounded-full bg-[#f5a524] text-[#111412] shadow-[0_0_40px_rgba(245,165,36,0.65)] transition duration-200 group-hover:scale-110">
                          <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                        </span>
                        <span className="rounded-xl bg-black/80 px-4 py-1.5 font-display text-xs font-bold text-white backdrop-blur-md">
                          Tap to Stream Reel #{activeIndex + 1}
                        </span>
                      </div>

                      {/* Bottom info inside frame */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                        <p className="font-display text-base font-bold text-white">{activeVideo.title}</p>
                        <p className="mt-0.5 text-xs text-white/75">
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
                          <div className="relative z-10 flex flex-col items-center gap-2 rounded-2xl bg-black/85 px-5 py-3 text-xs font-bold text-[#f5a524]">
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
                          bg-gradient-to-b from-black/85 via-black/40 to-transparent px-3.5 select-none
                        "
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        <span className="font-mono text-[10px] font-semibold tracking-wider text-white/85 uppercase">
                          {content.brand.name} · Protected View-Only Stream
                        </span>
                        <span className="font-mono text-[10px] text-white/70">No Download</span>
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
              <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${dividerBorder}`}>
                <div className={`flex items-center gap-2 text-xs font-medium ${textSecondary}`}>
                  <Film className={`h-4 w-4 shrink-0 ${accentText}`} />
                  <span>{activeVideo.result || `${activeVideo.client} · ${activeVideo.category}`}</span>
                  <span aria-hidden="true" className={textMuted}>·</span>
                  <span className={`inline-flex items-center gap-1 ${textMuted}`}>
                    <Lock className="h-3 w-3" />
                    <span>View-Only Master</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(`stage-${activeVideo.id}`, activeVideo.id)}
                    className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition ${secondaryBtn}`}
                  >
                    {copiedKey === `stage-${activeVideo.id}` ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>
                          Direct Watch Link Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Link to This Video</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Complete Directory of Watch Links to All Work */}
            <div className={`flex flex-col justify-between rounded-3xl border p-5 sm:p-6 lg:col-span-5 ${cardBg}`}>
              <div>
                <div className={`flex items-center justify-between gap-2 border-b pb-4 ${dividerBorder}`}>
                  <div>
                    <span className={`font-mono text-[11px] font-bold tracking-wider uppercase ${accentText}`}>
                      Master Watch Directory
                    </span>
                    <h3 className={`mt-0.5 font-display text-lg font-extrabold ${textPrimary}`}>
                      Direct Links to All Videos ({allVideos.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink('directory-all')}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${secondaryBtn}`}
                  >
                    {copiedKey === 'directory-all' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Page Link</span>
                      </>
                    )}
                  </button>
                </div>

                <p className={`mt-3 text-xs leading-relaxed ${textSecondary}`}>
                  Select any reel below to play it in the screening player, or click the copy icon to share a direct view-only link to that video.
                </p>

                {/* Scrollable Watch Links List */}
                <div className="mt-4 max-h-[480px] space-y-2.5 overflow-y-auto pr-1">
                  {allVideos.map((item, idx) => {
                    const isCurrent = activeVideo?.id === item.id;
                    const copyId = `dir-${item.id}`;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-2.5 rounded-2xl border p-2.5 transition ${
                          isCurrent
                            ? isDark
                              ? 'border-[#f5a524] bg-[#f5a524]/15'
                              : 'border-[#f5a524] bg-[#fff8e6]'
                            : isDark
                              ? 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                              : 'border-[#111412]/10 bg-[#fafaf6] hover:border-[#111412]/25 hover:bg-[#f3f4ef]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectVideo(item, false)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-black ring-1 ring-black/10">
                            <img
                              src={ytThumb(item.youtubeId)}
                              alt=""
                              draggable={false}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute inset-0 grid place-items-center bg-black/35">
                              <Play
                                className={`h-3.5 w-3.5 fill-current ${
                                  isCurrent ? 'text-[#f5a524]' : 'text-white'
                                }`}
                              />
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className={`flex items-center gap-1.5 text-[11px] ${textMuted}`}>
                              <span className={`font-mono font-extrabold tabular-nums ${accentText}`}>
                                #{String(idx + 1).padStart(2, '0')}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate font-medium">{item.category}</span>
                            </div>
                            <p className={`truncate font-display text-sm font-bold ${textPrimary}`}>
                              {item.title}
                            </p>
                            <p className={`truncate text-[11px] ${textSecondary}`}>
                              {item.client}
                              {item.result ? ` · ${item.result}` : ''}
                            </p>
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectVideo(item, false)}
                            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
                              isCurrent
                                ? 'bg-[#f5a524] text-[#111412]'
                                : isDark
                                  ? 'bg-white/10 text-white hover:bg-white/20'
                                  : 'bg-[#111412] text-white hover:bg-[#2a302b]'
                            }`}
                          >
                            {isCurrent && autoPlayStage ? 'Playing' : 'Watch'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(copyId, item.id)}
                            title="Copy view-only watch link"
                            aria-label={`Copy watch link for ${item.title}`}
                            className={`grid h-9 w-9 place-items-center rounded-xl border transition ${secondaryBtn}`}
                          >
                            {copiedKey === copyId ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
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
              <div className={`mt-5 flex items-center justify-between gap-2 border-t pt-4 text-xs ${dividerBorder} ${textMuted}`}>
                <span>View-only streaming active · Right-click &amp; downloads disabled</span>
                <span className="font-mono font-bold tabular-nums">{allVideos.length} Reels</span>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: COMPLETE VISUAL GALLERY OF ALL VIDEOS */}
        <section aria-label="All Studio Videos Visual Grid">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <span className={`font-mono text-xs font-bold tracking-wider uppercase ${accentText}`}>
                Complete Video Library
              </span>
              <h2 className={`mt-1 font-display text-2xl font-extrabold sm:text-3xl ${textPrimary}`}>
                Browse &amp; Watch All Studio Reels ({filteredVideos.length})
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Format Segmented Filter */}
              <div
                className={`inline-flex items-center gap-1 rounded-xl border p-1 ${subtleSurface}`}
                role="group"
                aria-label="Filter by video orientation"
              >
                {(
                  [
                    { id: 'all', label: 'All Formats' },
                    { id: 'vertical', label: '9:16 Vertical' },
                    { id: 'horizontal', label: '16:9 Widescreen' },
                  ] as const
                ).map((fmt) => {
                  const active = formatFilter === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setFormatFilter(fmt.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? 'bg-[#f5a524] text-[#111412] shadow-xs'
                          : isDark
                            ? 'text-white/70 hover:text-white'
                            : 'text-[#525b53] hover:text-[#111412]'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-72">
                <Search
                  className={`pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 ${textMuted}`}
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, client, or style…"
                  className={`min-h-[42px] w-full rounded-xl border py-2 pr-9 pl-10 text-sm transition focus:border-[#f5a524] focus:outline-none ${
                    isDark
                      ? 'border-white/15 bg-[#131822] text-white placeholder:text-white/45'
                      : 'border-[#111412]/15 bg-white text-[#111412] placeholder:text-[#525b53]/70'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className={`absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 ${textMuted}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
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
                      ? 'border-[#f5a524] bg-[#f5a524] text-[#111412] shadow-xs'
                      : secondaryBtn
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Video Cards Grid */}
          {filteredVideos.length === 0 ? (
            <div className={`rounded-3xl border p-12 text-center ${cardBg}`}>
              <p className={`font-display text-lg font-bold ${textPrimary}`}>No videos match your filter</p>
              <p className={`mt-1 text-sm ${textSecondary}`}>
                Try clearing your search or selecting "All" categories and formats.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('All');
                  setFormatFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 rounded-xl bg-[#f5a524] px-4 py-2.5 text-xs font-extrabold text-[#111412]"
              >
                Reset All Filters
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
                    className={`group flex flex-col justify-between overflow-hidden rounded-3xl border transition duration-300 ${
                      isPlayingOnStage
                        ? isDark
                          ? 'border-[#f5a524] bg-[#131822] shadow-[0_18px_42px_-15px_rgba(245,165,36,0.35)]'
                          : 'border-[#f5a524] bg-white shadow-[0_18px_42px_-15px_rgba(245,165,36,0.35)]'
                        : `${cardBg} hover:-translate-y-1`
                    }`}
                  >
                    {/* Clickable Thumbnail */}
                    <div className="keep-dark relative aspect-[9/13] w-full overflow-hidden bg-black">
                      <img
                        src={ytThumb(item.youtubeId)}
                        alt={item.title}
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35" />

                      {/* Top index & View-only label */}
                      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white">
                        <span className="rounded-md bg-black/75 px-2.5 py-0.5 font-bold text-[#f5a524] backdrop-blur-md tabular-nums">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="rounded-md bg-black/75 px-2.5 py-0.5 text-white/90 backdrop-blur-md">
                          {item.orientation === 'vertical' ? '9:16' : '16:9'} · View-Only
                        </span>
                      </div>

                      {/* Center Play Button Overlay */}
                      <button
                        type="button"
                        onClick={() => setLightboxItem(item)}
                        aria-label={`Watch ${item.title} in fullscreen`}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 focus:outline-none"
                      >
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-[#f5a524] text-[#111412] shadow-xl transition duration-200 group-hover:scale-110">
                          <Play className="h-6 w-6 translate-x-0.5 fill-current" />
                        </span>
                        <span className="rounded-lg bg-black/80 px-3 py-1 font-display text-[11px] font-bold text-white backdrop-blur-md">
                          Watch Fullscreen
                        </span>
                      </button>
                    </div>

                    {/* Card Details + Watch & Link Actions */}
                    <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                      <div>
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${textMuted}`}>
                          <span className={`font-semibold ${textSecondary}`}>{item.client}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.category}</span>
                        </div>
                        <h3 className={`mt-1.5 font-display text-base font-extrabold leading-snug ${textPrimary}`}>
                          {item.title}
                        </h3>
                        {item.result && (
                          <p className={`mt-1 text-xs leading-relaxed ${textSecondary}`}>{item.result}</p>
                        )}
                      </div>

                      <div className={`mt-4 flex items-center gap-2 border-t pt-3.5 ${dividerBorder}`}>
                        <button
                          type="button"
                          onClick={() => handleSelectVideo(item, true)}
                          className={`inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-extrabold transition ${
                            isPlayingOnStage
                              ? 'bg-[#f5a524] text-[#111412]'
                              : isDark
                                ? 'bg-[#f5a524] text-[#111412] hover:brightness-105'
                                : 'bg-[#111412] text-white hover:bg-[#2a302b]'
                          }`}
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>{isPlayingOnStage ? 'Playing Above' : 'Play on Stage'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(cardCopyKey, item.id)}
                          title="Copy direct watch link to this video"
                          className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${secondaryBtn}`}
                        >
                          {copiedKey === cardCopyKey ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>Copied</span>
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
        <section
          className={`mt-20 rounded-3xl border p-8 text-center sm:p-12 ${
            isDark
              ? 'border-white/14 bg-gradient-to-br from-[#151b26] to-[#0e1219]'
              : 'border-[#111412]/12 bg-gradient-to-br from-[#fff5eb] to-[#fff9e6]'
          }`}
        >
          <span className={`font-mono text-xs font-bold tracking-wider uppercase ${accentText}`}>
            Ready to Launch Your Campaign?
          </span>
          <h2
            className={`mx-auto mt-2 max-w-2xl font-display text-2xl font-extrabold sm:text-4xl ${textPrimary}`}
            style={{ textWrap: 'balance' }}
          >
            Want Scroll-Stopping AI Video Ads Like These for Your Business?
          </h2>
          <p className={`mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base ${textSecondary}`}>
            Whether you need a single high-converting video ad, a 5-video testing pack, a 15-video monthly retainer, or an episodic brand mini-series, our studio handles script to screen in days.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => setStrategyOpen(true)}
              className="inline-flex min-h-[48px] items-center gap-2.5 rounded-2xl bg-[#f5a524] px-6 py-3 font-display text-sm font-extrabold text-[#111412] transition hover:brightness-105"
            >
              <span>Book a Free Strategy Session</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex min-h-[48px] items-center gap-2 rounded-2xl border px-6 py-3 font-display text-sm font-bold no-underline transition ${secondaryBtn}`}
            >
              <MessageCircle className="h-4 w-4 text-emerald-500" />
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
