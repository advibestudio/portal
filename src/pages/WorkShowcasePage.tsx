import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Film,
  LayoutGrid,
  List,
  Lock,
  Maximize2,
  Menu,
  MessageCircle,
  Play,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useStore, waLink, ytThumb } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { assetUrl, waNumberFor } from '@/lib/money';
import { useTheme } from '@/lib/theme';
import type { PortfolioItem } from '@/content/types';
import { Lightbox } from '@/components/shared';
import { AppQuickSwitcher, ThemeToggleButton } from '@/components/UnifiedAppNav';

const StrategyModal = lazy(() =>
  import('@/components/StrategyModal').then((m) => ({ default: m.StrategyModal }))
);

interface ShowcaseUrlParams {
  videoId: string | null;
  company: string | null;
}

function getShowcaseUrlParams(): ShowcaseUrlParams {
  if (typeof window === 'undefined') return { videoId: null, company: null };
  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  if (qIndex >= 0) {
    const params = new URLSearchParams(hash.slice(qIndex + 1));
    return {
      videoId: params.get('v') || params.get('video') || params.get('reel'),
      company: params.get('company') || params.get('client') || params.get('brand'),
    };
  }
  const searchParams = new URLSearchParams(window.location.search);
  return {
    videoId: searchParams.get('v') || searchParams.get('video') || searchParams.get('reel'),
    company: searchParams.get('company') || searchParams.get('client') || searchParams.get('brand'),
  };
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

  // Flagship segmented client (CirclesFundMe)
  const flagshipMatchKey = (content.client?.matchName || content.client?.name || 'CirclesFundMe')
    .trim()
    .toLowerCase();

  const circlesFundMeVideos = useMemo(
    () =>
      allVideos.filter((v) =>
        v.client.trim().toLowerCase().includes(flagshipMatchKey)
      ),
    [allVideos, flagshipMatchKey]
  );

  // Dynamic Company Directory across all portfolio works
  const companyDirectory = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        count: number;
        categories: Set<string>;
        verticalCount: number;
        horizontalCount: number;
        sampleThumb: string;
      }
    >();

    for (const v of allVideos) {
      const cleanName = v.client.trim() || 'AdVibe Studio';
      const existing = map.get(cleanName);
      if (existing) {
        existing.count += 1;
        existing.categories.add(v.category);
        if (v.orientation === 'vertical') existing.verticalCount += 1;
        else existing.horizontalCount += 1;
      } else {
        map.set(cleanName, {
          name: cleanName,
          count: 1,
          categories: new Set([v.category]),
          verticalCount: v.orientation === 'vertical' ? 1 : 0,
          horizontalCount: v.orientation === 'vertical' ? 0 : 1,
          sampleThumb: ytThumb(v.youtubeId),
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [allVideos]);

  const initialParams = useMemo(() => getShowcaseUrlParams(), []);

  const [selectedId, setSelectedId] = useState<string>(() => {
    const fromUrl = initialParams.videoId;
    if (fromUrl) {
      const found = allVideos.find((v) => v.id === fromUrl || v.youtubeId === fromUrl);
      if (found) return found.id;
    }
    if (initialParams.company) {
      const q = initialParams.company.trim().toLowerCase();
      const firstCompanyMatch = allVideos.find((v) => v.client.toLowerCase().includes(q));
      if (firstCompanyMatch) return firstCompanyMatch.id;
    }
    return allVideos[0]?.id || '';
  });

  // CirclesFundMe segment category filter
  const [cfmCategory, setCfmCategory] = useState<string>('All');

  // Company-Specific Search & Brand Selector state
  const [selectedCompany, setSelectedCompany] = useState<string>(() => {
    if (initialParams.company) {
      const q = initialParams.company.trim().toLowerCase();
      const matched = companyDirectory.find((c) => c.name.toLowerCase() === q || c.name.toLowerCase().includes(q));
      return matched ? matched.name : initialParams.company.trim();
    }
    return 'All';
  });
  const [companySearchQuery, setCompanySearchQuery] = useState<string>(() =>
    initialParams.company ? initialParams.company.trim() : ''
  );

  // General Work Depository state
  const [depositoryCategory, setDepositoryCategory] = useState<string>('All');
  const [depositoryFormat, setDepositoryFormat] = useState<'all' | 'vertical' | 'horizontal'>('all');
  const [depositoryQuery, setDepositoryQuery] = useState<string>('');
  const [depositoryViewMode, setDepositoryViewMode] = useState<'grid' | 'index'>('grid');

  // Stage & UI state
  const [autoPlayStage, setAutoPlayStage] = useState<boolean>(false);
  const [stageIframeLoaded, setStageIframeLoaded] = useState<boolean>(false);
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const [strategyOpen, setStrategyOpen] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [navScrolled, setNavScrolled] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [activeNavSection, setActiveNavSection] = useState<string>('screening-stage');

  // Track scroll for floating studio pill navbar elevation and active section
  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 20);
      const sections = ['screening-stage', 'circlesfundme', 'company-search', 'general-depository'];
      const scrollPos = window.scrollY + 180;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveNavSection(sections[i]);
          break;
        }
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sync URL query params `?v=...` and `?company=...` on hashchange
  useEffect(() => {
    const syncFromHash = () => {
      const { videoId, company } = getShowcaseUrlParams();
      if (videoId) {
        const match = allVideos.find((v) => v.id === videoId || v.youtubeId === videoId);
        if (match) {
          setSelectedId(match.id);
          setAutoPlayStage(true);
        }
      }
      if (company) {
        const q = company.trim().toLowerCase();
        const matched = companyDirectory.find(
          (c) => c.name.toLowerCase() === q || c.name.toLowerCase().includes(q)
        );
        const resolved = matched ? matched.name : company.trim();
        setSelectedCompany(resolved);
        setCompanySearchQuery(resolved);
      }
    };
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [allVideos, companyDirectory]);

  useEffect(() => {
    if (initialParams.company && !initialParams.videoId) {
      setTimeout(() => {
        document.getElementById('company-search')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [initialParams.company, initialParams.videoId]);

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

  // Categories for CirclesFundMe segment
  const cfmCategories = useMemo(() => {
    const set = new Set(circlesFundMeVideos.map((v) => v.category));
    return ['All', ...Array.from(set)];
  }, [circlesFundMeVideos]);

  const filteredCfmVideos = useMemo(() => {
    if (cfmCategory === 'All') return circlesFundMeVideos;
    return circlesFundMeVideos.filter((v) => v.category === cfmCategory);
  }, [circlesFundMeVideos, cfmCategory]);

  // Filtered Company Directory pills & Company-Specific Videos
  const matchingCompanies = useMemo(() => {
    const q = companySearchQuery.trim().toLowerCase();
    if (!q) return companyDirectory;
    return companyDirectory.filter((c) => c.name.toLowerCase().includes(q));
  }, [companyDirectory, companySearchQuery]);

  const companyFilteredVideos = useMemo(() => {
    const q = companySearchQuery.trim().toLowerCase();
    return allVideos.filter((v) => {
      const clientLower = v.client.trim().toLowerCase();
      const matchesSelectedPill =
        selectedCompany === 'All' || clientLower === selectedCompany.trim().toLowerCase();
      const matchesQuery =
        !q ||
        clientLower.includes(q) ||
        v.title.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        Boolean(v.result && v.result.toLowerCase().includes(q));
      return matchesSelectedPill && matchesQuery;
    });
  }, [allVideos, selectedCompany, companySearchQuery]);

  // Categories for General Depository
  const depositoryCategories = useMemo(() => {
    const present = new Set(allVideos.map((v) => v.category));
    const base = content.categories.filter((c) => c === 'All' || present.has(c));
    return base.length > 0 ? base : ['All'];
  }, [allVideos, content.categories]);

  const depositoryFilteredVideos = useMemo(() => {
    const q = depositoryQuery.trim().toLowerCase();
    return allVideos.filter((v) => {
      const matchesCat = depositoryCategory === 'All' || v.category === depositoryCategory;
      const matchesFormat =
        depositoryFormat === 'all' ||
        (depositoryFormat === 'vertical' && v.orientation === 'vertical') ||
        (depositoryFormat === 'horizontal' && v.orientation !== 'vertical');
      const matchesSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.client.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        Boolean(v.result && v.result.toLowerCase().includes(q));
      return matchesCat && matchesFormat && matchesSearch;
    });
  }, [allVideos, depositoryCategory, depositoryFormat, depositoryQuery]);

  const buildShareUrl = (opts?: { videoId?: string; company?: string }) => {
    if (typeof window === 'undefined') return '#/our-work';
    const base = `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams();
    if (opts?.company && opts.company !== 'All') {
      params.set('company', opts.company);
    }
    if (opts?.videoId) {
      params.set('v', opts.videoId);
    }
    const qs = params.toString();
    return qs ? `${base}#/our-work?${qs}` : `${base}#/our-work`;
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

  const handleCopyLink = (key: string, videoId?: string, company?: string) => {
    const url = buildShareUrl({ videoId, company });
    void copyTextToClipboard(key, url);
  };

  const handleCopyAllLinksBundle = (subset?: PortfolioItem[], label?: string, copyKey = 'bundle-all') => {
    const list = subset && subset.length > 0 ? subset : allVideos;
    const headerTitle = label
      ? `${content.brand.name} — ${label} Portfolio (${list.length} Videos)`
      : `${content.brand.name} — Official View-Only Portfolio & Screening Room (${list.length} Videos)`;
    const masterUrl = label && label !== 'All' ? buildShareUrl({ company: label }) : buildShareUrl();
    const lines = [
      headerTitle,
      `Watch Collection: ${masterUrl}`,
      '',
      ...list.map(
        (v, idx) =>
          `${String(idx + 1).padStart(2, '0')}. ${v.title} (${v.client} · ${v.category})\n   Watch: ${buildShareUrl({ videoId: v.id })}`
      ),
    ];
    void copyTextToClipboard(copyKey, lines.join('\n'));
  };

  const handleSelectVideo = (item: PortfolioItem, scrollToStage = true) => {
    setSelectedId(item.id);
    setAutoPlayStage(true);
    try {
      const params = new URLSearchParams();
      if (selectedCompany !== 'All') params.set('company', selectedCompany);
      params.set('v', item.id);
      window.history.replaceState(null, '', `#/our-work?${params.toString()}`);
    } catch {
      /* ignore */
    }
    if (scrollToStage) {
      document.getElementById('screening-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectCompanyFilter = (companyName: string, scrollToSection = false) => {
    setSelectedCompany(companyName);
    setCompanySearchQuery(companyName === 'All' ? '' : companyName);
    try {
      if (companyName === 'All') {
        window.history.replaceState(null, '', '#/our-work');
      } else {
        window.history.replaceState(
          null,
          '',
          `#/our-work?company=${encodeURIComponent(companyName)}`
        );
      }
    } catch {
      /* ignore */
    }
    if (scrollToSection) {
      document.getElementById('company-search')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToSection = (sectionId: string) => {
    setMobileNavOpen(false);
    setActiveNavSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // Explicit dual-theme high-contrast palette tokens
  const pageBg = isDark ? 'bg-[#080b10] text-[#f5f5f0]' : 'bg-[#faf9f5] text-[#111412]';
  const navPillSurface = isDark
    ? navScrolled
      ? 'border-white/16 bg-[#111620]/96 text-[#f5f5f0] shadow-[0_18px_42px_-16px_rgba(0,0,0,0.9)]'
      : 'border-white/14 bg-[#111620]/88 text-[#f5f5f0] shadow-[0_14px_34px_-16px_rgba(0,0,0,0.75)]'
    : navScrolled
      ? 'border-[#111412]/12 bg-white/95 text-[#111412] shadow-[0_18px_38px_-18px_rgba(17,20,18,0.22)]'
      : 'border-[#111412]/10 bg-white/85 text-[#111412] shadow-[0_12px_30px_-18px_rgba(17,20,18,0.16)]';
  const cardBg = isDark
    ? 'border-white/14 bg-[#121722] text-[#f5f5f0] shadow-[0_22px_50px_-24px_rgba(0,0,0,0.85)]'
    : 'border-[#111412]/12 bg-white text-[#111412] shadow-[0_20px_48px_-28px_rgba(17,20,18,0.14)]';
  const subtleSurface = isDark
    ? 'border-white/12 bg-white/[0.04] text-[#f5f5f0]'
    : 'border-[#111412]/12 bg-[#f3f4ef] text-[#111412]';
  const textPrimary = isDark ? 'text-white' : 'text-[#111412]';
  const textSecondary = isDark ? 'text-white/80' : 'text-[#2a302b]';
  const textMuted = isDark ? 'text-white/60' : 'text-[#525b53]';
  const accentText = isDark ? 'text-[#f5a524]' : 'text-[#a86400]';
  const emeraldAccent = isDark ? 'text-emerald-400' : 'text-emerald-700';
  const dividerBorder = isDark ? 'border-white/12' : 'border-[#111412]/10';
  const secondaryBtn = isDark
    ? 'border-white/18 bg-white/[0.06] text-white hover:border-[#f5a524] hover:bg-white/[0.12]'
    : 'border-[#111412]/15 bg-white text-[#111412] hover:border-[#111412]/40 hover:bg-[#f3f4ef]';

  const renderVideoCard = (item: PortfolioItem, idx: number, keyPrefix: string) => {
    const isPlayingOnStage = activeVideo?.id === item.id && autoPlayStage;
    const cardCopyKey = `${keyPrefix}-${item.id}`;
    return (
      <article
        key={`${keyPrefix}-${item.id}`}
        className={`group flex flex-col justify-between overflow-hidden rounded-3xl border transition duration-300 ${
          isPlayingOnStage
            ? isDark
              ? 'border-[#f5a524] bg-[#141a26] shadow-[0_18px_42px_-15px_rgba(245,165,36,0.35)]'
              : 'border-[#f5a524] bg-white shadow-[0_18px_42px_-15px_rgba(245,165,36,0.35)]'
            : `${cardBg} hover:-translate-y-1`
        }`}
      >
        {/* Protected View-Only Thumbnail */}
        <div className="keep-dark relative aspect-[9/13] w-full overflow-hidden bg-black">
          <img
            src={ytThumb(item.youtubeId)}
            alt={item.title}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

          {/* Top index & format metadata */}
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

          {/* Bottom client watermark on reel */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between text-[11px] text-white/85">
            <span className="truncate font-semibold">{item.client}</span>
            <span className="shrink-0 text-white/70">{item.category}</span>
          </div>
        </div>

        {/* Card Details + Watch & Link Actions */}
        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            <div className={`flex flex-wrap items-center gap-1.5 text-xs font-medium ${textMuted}`}>
              <button
                type="button"
                onClick={() => handleSelectCompanyFilter(item.client, true)}
                className={`font-bold underline-offset-2 hover:underline ${textSecondary}`}
                title={`View all ${item.client} videos`}
              >
                {item.client}
              </button>
              <span aria-hidden="true">·</span>
              <span>{item.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {item.orientation === 'vertical' ? '9:16' : '16:9'}
              </span>
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
              className={`inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-extrabold whitespace-nowrap transition ${
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
              className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
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
  };

  const navJumpItems = [
    { id: 'screening-stage', label: 'Screening Stage' },
    {
      id: 'circlesfundme',
      label: content.client?.name || 'CirclesFundMe',
      count: circlesFundMeVideos.length,
    },
    {
      id: 'company-search',
      label: 'By Company',
      count: companyDirectory.length,
    },
    {
      id: 'general-depository',
      label: 'General Depository',
      count: allVideos.length,
    },
  ];

  return (
    <div
      className={`theme-managed min-h-dvh select-none transition-colors duration-200 ${pageBg}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* SLEEK FLOATING STUDIO PILL NAVBAR */}
      <header className="pointer-events-none fixed inset-x-0 top-3 z-50 px-2.5 sm:px-4">
        <div
          className={`pointer-events-auto mx-auto flex max-w-[1240px] items-center justify-between gap-2 rounded-full border py-1.5 pr-2 pl-3 backdrop-blur-2xl transition-all duration-300 ${navPillSurface}`}
        >
          {/* Left Zone: Brand Emblem + Main Site Back Pill */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <a
              href="#/"
              className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap no-underline transition ${secondaryBtn}`}
              title="Back to AdVibe Studio Main Website"
            >
              <ArrowLeft className={`h-3.5 w-3.5 ${isDark ? 'text-[#f5a524]' : 'text-[#111412]'}`} />
              <span>Main Site</span>
            </a>

            <a
              href="#/our-work"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('screening-stage');
              }}
              className="flex min-w-0 items-center gap-2 no-underline"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#111412] text-[#f5a524] shadow-xs">
                <Play className="h-3.5 w-3.5 translate-x-0.25 fill-current" />
              </span>
              <div className="hidden min-w-0 sm:block">
                <span className={`block truncate font-display text-sm font-extrabold tracking-tight ${textPrimary}`}>
                  {content.brand.name}
                </span>
                <span className={`block truncate text-[10px] font-medium ${textMuted}`}>
                  Screening Room · View-Only
                </span>
              </div>
            </a>
          </div>

          {/* Center Zone: Section Jump Links inside Floating Pill */}
          <nav
            aria-label="Screening room sections"
            className={`hidden items-center gap-1 rounded-full border p-1 lg:flex ${
              isDark ? 'border-white/10 bg-white/[0.03]' : 'border-[#111412]/8 bg-[#f3f4ef]/80'
            }`}
          >
            {navJumpItems.map((item) => {
              const isActive = activeNavSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-[#f5a524] text-[#111412] shadow-xs'
                      : isDark
                        ? 'text-white/75 hover:bg-white/[0.08] hover:text-white'
                        : 'text-[#2a302b] hover:bg-black/[0.05] hover:text-[#111412]'
                  }`}
                >
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && (
                    <span
                      className={`font-mono text-[10px] font-extrabold tabular-nums ${
                        isActive
                          ? 'text-[#111412]/80'
                          : isDark
                            ? 'text-[#f5a524]'
                            : 'text-[#a86400]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Zone: Utilities + Studio Pill CTA */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden xl:block">
              <AppQuickSwitcher label="Pages" compact />
            </div>

            <ThemeToggleButton compact />

            <button
              type="button"
              onClick={() =>
                handleCopyLink(
                  'page-header',
                  undefined,
                  selectedCompany !== 'All' ? selectedCompany : undefined
                )
              }
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
              title="Copy shareable link to this screening room view"
            >
              {copiedKey === 'page-header' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>Copied</span>
                </>
              ) : (
                <>
                  <Share2 className={`h-3.5 w-3.5 ${isDark ? 'text-[#f5a524]' : 'text-[#a86400]'}`} />
                  <span className="hidden md:inline">Share</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStrategyOpen(true)}
              className={`hidden min-h-[40px] items-center gap-2 rounded-full py-1 pr-1.5 pl-4 font-display text-xs font-extrabold whitespace-nowrap transition sm:inline-flex ${
                isDark
                  ? 'bg-[#f5a524] text-[#111412] hover:brightness-105'
                  : 'bg-[#111412] text-white hover:bg-[#222723]'
              }`}
            >
              <span>Book Strategy Call</span>
              <span
                className={`grid h-7 w-7 place-items-center rounded-full ${
                  isDark ? 'bg-[#111412] text-white' : 'bg-[#f5a524] text-[#111412]'
                }`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle screening room navigation"
              aria-expanded={mobileNavOpen}
              className={`grid h-9 w-9 place-items-center rounded-full border lg:hidden ${secondaryBtn}`}
            >
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu inside Floating Header */}
        {mobileNavOpen && (
          <div
            className={`pointer-events-auto mx-auto mt-2 max-w-[1240px] rounded-3xl border p-4 backdrop-blur-2xl lg:hidden ${navPillSurface}`}
          >
            <div className="grid gap-1.5">
              {navJumpItems.map((item) => {
                const isActive = activeNavSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`flex min-h-[44px] w-full items-center justify-between rounded-2xl px-4 py-2.5 text-left font-display text-sm font-bold transition ${
                      isActive
                        ? 'bg-[#f5a524] text-[#111412]'
                        : isDark
                          ? 'text-white hover:bg-white/[0.08]'
                          : 'text-[#111412] hover:bg-black/[0.05]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {typeof item.count === 'number' && (
                      <span className="font-mono text-xs font-extrabold tabular-nums">
                        {item.count} Reels
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 ${dividerBorder}`}>
              <AppQuickSwitcher label="All Studio Pages" compact />
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  setStrategyOpen(true);
                }}
                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-full bg-[#f5a524] px-4 py-2 font-display text-xs font-extrabold text-[#111412]"
              >
                <span>Book Free Strategy Session</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1280px] px-4 pt-24 pb-24 sm:px-6 sm:pt-28">
        {/* HERO HEADER + QUICK NAVIGATION PILLS */}
        <div className={`mb-10 flex flex-col justify-between gap-6 border-b pb-8 lg:flex-row lg:items-end ${dividerBorder}`}>
          <div className="max-w-3xl">
            <div className={`mb-3 flex flex-wrap items-center gap-2 text-xs font-bold ${accentText}`}>
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Official Portfolio &amp; Client Screening Room</span>
              <span aria-hidden="true" className={textMuted}>·</span>
              <span className={textMuted}>View-Only Streaming (Downloads Disabled)</span>
            </div>
            <h1
              className={`font-display text-3xl font-extrabold tracking-tight sm:text-5xl ${textPrimary}`}
              style={{ textWrap: 'balance', lineHeight: 1.05 }}
            >
              Curated Brand Campaigns &amp; Master Work Depository.
            </h1>
            <p className={`mt-3.5 text-base leading-relaxed sm:text-lg ${textSecondary}`}>
              Explore our flagship <strong className={textPrimary}>{content.client?.name || 'CirclesFundMe'}</strong> campaign collection, search productions for a specific company, or browse the complete studio depository below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => scrollToSection('circlesfundme')}
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
            >
              <Award className={`h-4 w-4 ${isDark ? 'text-[#f5a524]' : 'text-[#a86400]'}`} />
              <span>{content.client?.name || 'CirclesFundMe'} Showcase ({circlesFundMeVideos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('company-search')}
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
            >
              <Building2 className={`h-4 w-4 ${isDark ? 'text-[#f5a524]' : 'text-[#a86400]'}`} />
              <span>Search by Company</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyAllLinksBundle()}
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
            >
              {copiedKey === 'bundle-all' ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>
                    All {allVideos.length} Links Copied
                  </span>
                </>
              ) : (
                <>
                  <Copy className={`h-4 w-4 ${isDark ? 'text-[#f5a524]' : 'text-[#a86400]'}`} />
                  <span>Copy All {allVideos.length} Links</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SECTION 1: CINEMA SCREENING STAGE + MASTER WATCH DIRECTORY */}
        {activeVideo && (
          <section
            id="screening-stage"
            aria-label="Studio Screening Stage and Watch Links"
            className="mb-20 scroll-mt-24 grid grid-cols-1 gap-6 lg:grid-cols-12"
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
                    <button
                      type="button"
                      onClick={() => handleSelectCompanyFilter(activeVideo.client, true)}
                      className={`font-bold underline-offset-2 hover:underline ${textSecondary}`}
                    >
                      {activeVideo.client}
                    </button>
                    <span aria-hidden="true">·</span>
                    <span>{activeVideo.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {activeVideo.orientation === 'vertical' ? '9:16 Vertical' : '16:9 Widescreen'}
                    </span>
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
                    className={`inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextReel}
                    aria-label="Next video"
                    className={`inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxItem(activeVideo)}
                    title="Expand in Theater Lightbox"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#f5a524] px-3.5 text-xs font-extrabold whitespace-nowrap text-[#111412] transition hover:brightness-105"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </button>
                </div>
              </div>

              {/* View-Only Cinema Video Frame */}
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

                      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white/90">
                        <span className="rounded-md bg-black/70 px-2.5 py-1 backdrop-blur-md">
                          {content.brand.name} · View-Only
                        </span>
                        <span className="rounded-md bg-black/70 px-2.5 py-1 backdrop-blur-md">
                          {activeVideo.orientation === 'vertical' ? '9:16' : '16:9'}
                        </span>
                      </div>

                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                        <span className="grid h-16 w-16 place-items-center rounded-full bg-[#f5a524] text-[#111412] shadow-[0_0_40px_rgba(245,165,36,0.65)] transition duration-200 group-hover:scale-110">
                          <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                        </span>
                        <span className="rounded-xl bg-black/80 px-4 py-1.5 font-display text-xs font-bold text-white backdrop-blur-md">
                          Tap to Stream Reel #{activeIndex + 1}
                        </span>
                      </div>

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
                      <div
                        className="absolute right-11 bottom-0 z-20 h-11 w-28 select-none"
                        onContextMenu={(e) => e.preventDefault()}
                        title="View-Only Protected Stream"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Bottom Stage Bar */}
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
                    className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
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

            {/* Right Column: Master Watch Queue */}
            <div className={`flex flex-col justify-between rounded-3xl border p-5 sm:p-6 lg:col-span-5 ${cardBg}`}>
              <div>
                <div className={`flex items-center justify-between gap-2 border-b pb-4 ${dividerBorder}`}>
                  <div>
                    <span className={`font-mono text-[11px] font-bold tracking-wider uppercase ${accentText}`}>
                      Active Screening Queue
                    </span>
                    <h3 className={`mt-0.5 font-display text-lg font-extrabold ${textPrimary}`}>
                      Quick-Play Directory ({allVideos.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink('directory-all')}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
                  >
                    {copiedKey === 'directory-all' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Room Link</span>
                      </>
                    )}
                  </button>
                </div>

                <p className={`mt-3 text-xs leading-relaxed ${textSecondary}`}>
                  Select any production below to stream immediately on the screening stage, or copy its direct view-only client link.
                </p>

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
                              <span className="truncate font-semibold">{item.client}</span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{item.category}</span>
                            </div>
                            <p className={`truncate font-display text-sm font-bold ${textPrimary}`}>
                              {item.title}
                            </p>
                            {item.result && (
                              <p className={`truncate text-[11px] ${textSecondary}`}>{item.result}</p>
                            )}
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectVideo(item, false)}
                            className={`rounded-xl px-3 py-2 text-xs font-extrabold whitespace-nowrap transition ${
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

              <div className={`mt-5 flex items-center justify-between gap-2 border-t pt-4 text-xs ${dividerBorder} ${textMuted}`}>
                <span>View-only streaming active · Right-click &amp; downloads disabled</span>
                <span className="font-mono font-bold tabular-nums">{allVideos.length} Reels</span>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: SEGMENTED CIRCLESFUNDME FEATURED BRAND COLLECTION */}
        {circlesFundMeVideos.length > 0 && (
          <section
            id="circlesfundme"
            aria-label={`${content.client?.name || 'CirclesFundMe'} Segmented Brand Collection`}
            className="mb-24 scroll-mt-24"
          >
            {/* Editorial Brand Monograph Header Card */}
            <div
              className={`relative overflow-hidden rounded-3xl border p-6 sm:p-10 ${
                isDark
                  ? 'border-emerald-500/25 bg-gradient-to-br from-[#0e2019] via-[#111722] to-[#0d1118] text-[#f5f5f0]'
                  : 'border-emerald-900/15 bg-gradient-to-br from-[#ecfdf5] via-white to-[#f7fee7] text-[#111412]'
              }`}
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-8">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {content.client?.mark && (
                      <img
                        src={assetUrl(content.client.mark)}
                        alt={content.client.name}
                        className="h-9 w-9 rounded-xl bg-white object-contain p-1 shadow-xs ring-1 ring-black/10"
                      />
                    )}
                    <span className={`font-mono text-xs font-extrabold tracking-wider uppercase ${emeraldAccent}`}>
                      Segmented Client Collection
                    </span>
                    <span aria-hidden="true" className={textMuted}>·</span>
                    <span className={`text-xs font-bold ${textSecondary}`}>
                      {content.client?.sector || 'Fintech'}
                    </span>
                    {content.client?.badge && (
                      <>
                        <span aria-hidden="true" className={textMuted}>·</span>
                        <span className={`text-xs font-bold ${accentText}`}>
                          {content.client.badge}
                        </span>
                      </>
                    )}
                  </div>

                  <h2
                    className={`mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-4xl ${textPrimary}`}
                    style={{ textWrap: 'balance' }}
                  >
                    {content.client?.name || 'CirclesFundMe'} — Official Campaign Reel Segment ({circlesFundMeVideos.length} Productions)
                  </h2>

                  <p className={`mt-3 max-w-2xl text-sm leading-relaxed sm:text-base ${textSecondary}`}>
                    {content.client?.body ||
                      'CirclesFundMe Digital Savings and Loans Cooperative Society Limited is one of our major repeat clients. Explore all commercial reels, story ads, and direct-response campaigns produced exclusively for CirclesFundMe below.'}
                  </p>

                  {/* Unboxed Typographic Impact Row */}
                  {content.client?.caseStudy?.metrics && content.client.caseStudy.metrics.length > 0 && (
                    <div className={`mt-6 grid grid-cols-2 gap-4 border-t pt-5 sm:grid-cols-4 ${dividerBorder}`}>
                      {content.client.caseStudy.metrics.map((m) => (
                        <div key={m.label}>
                          <p className={`font-display text-2xl font-extrabold tabular-nums sm:text-3xl ${textPrimary}`}>
                            {m.value}
                          </p>
                          <p className={`mt-0.5 text-xs leading-snug ${textMuted}`}>{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Segmented Actions & Shareable CirclesFundMe Portfolio Link */}
                <div
                  className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 lg:col-span-4 ${
                    isDark
                      ? 'border-white/12 bg-black/35'
                      : 'border-[#111412]/10 bg-white/90 shadow-sm'
                  }`}
                >
                  <div>
                    <span className={`font-mono text-[11px] font-bold tracking-wider uppercase ${emeraldAccent}`}>
                      Dedicated Brand Link
                    </span>
                    <h3 className={`mt-1 font-display text-base font-extrabold ${textPrimary}`}>
                      Share Only {content.client?.name || 'CirclesFundMe'} Works
                    </h3>
                    <p className={`mt-1 text-xs leading-relaxed ${textSecondary}`}>
                      Send a direct link that opens this showcase pre-filtered to all {circlesFundMeVideos.length}{' '}
                      {content.client?.name || 'CirclesFundMe'} productions.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectVideo(circlesFundMeVideos[0], true)}
                      className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#f5a524] px-4 py-2.5 font-display text-xs font-extrabold whitespace-nowrap text-[#111412] transition hover:brightness-105"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Play {content.client?.name || 'CirclesFundMe'} Reel #01</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopyLink(
                          'cfm-collection-link',
                          undefined,
                          content.client?.name || 'CirclesFundMe'
                        )
                      }
                      className={`inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
                    >
                      {copiedKey === 'cfm-collection-link' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>
                            {content.client?.name || 'CirclesFundMe'} Link Copied!
                          </span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Copy {content.client?.name || 'CirclesFundMe'} Portfolio Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopyAllLinksBundle(
                          circlesFundMeVideos,
                          content.client?.name || 'CirclesFundMe',
                          'cfm-bundle-links'
                        )
                      }
                      className={`inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
                    >
                      {copiedKey === 'cfm-bundle-links' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>
                            All {circlesFundMeVideos.length} Links Copied
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy All {circlesFundMeVideos.length} Reel Links</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CirclesFundMe Segment Sub-Filter Bar */}
            <div className="mt-6 mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className={`font-display text-sm font-extrabold ${textPrimary}`}>
                  Filter {content.client?.name || 'CirclesFundMe'} Reels by Format Style:
                </span>
              </div>

              <div
                className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1"
                role="tablist"
                aria-label="Filter CirclesFundMe videos by category"
              >
                {cfmCategories.map((cat) => {
                  const active = cfmCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setCfmCategory(cat)}
                      className={`min-h-[38px] shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                        active
                          ? 'border-[#f5a524] bg-[#f5a524] text-[#111412] shadow-xs'
                          : secondaryBtn
                      }`}
                    >
                      {cat === 'All' ? `All ${content.client?.name || 'CirclesFundMe'} (${circlesFundMeVideos.length})` : cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CirclesFundMe Segmented Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredCfmVideos.map((item, idx) => renderVideoCard(item, idx, 'cfm'))}
            </div>
          </section>
        )}

        {/* SECTION 3: COMPANY-SPECIFIC SEARCH & BRAND DIRECTORY */}
        <section
          id="company-search"
          aria-label="Company-Specific Portfolio Search and Brand Selector"
          className="mb-24 scroll-mt-24"
        >
          <div className={`rounded-3xl border p-6 sm:p-8 ${cardBg}`}>
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <div className={`flex items-center gap-2 font-mono text-xs font-bold tracking-wider uppercase ${accentText}`}>
                  <Building2 className="h-4 w-4" />
                  <span>Company-Specific Portfolio Search</span>
                </div>
                <h2 className={`mt-1.5 font-display text-2xl font-extrabold sm:text-3xl ${textPrimary}`}>
                  Find &amp; Share Work for a Specific Company
                </h2>
                <p className={`mt-2 text-sm leading-relaxed ${textSecondary}`}>
                  Search by company or brand name below, or select a client pill to isolate all productions created for that organization and generate a shareable client link.
                </p>
              </div>

              {/* Company Search Input + Reset */}
              <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center lg:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search
                    className={`pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 ${textMuted}`}
                  />
                  <input
                    type="search"
                    value={companySearchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompanySearchQuery(val);
                      if (!val.trim()) {
                        setSelectedCompany('All');
                      }
                    }}
                    placeholder="Search company name (e.g. CirclesFundMe)…"
                    className={`min-h-[44px] w-full rounded-full border py-2 pr-9 pl-10 text-sm transition focus:border-[#f5a524] focus:outline-none ${
                      isDark
                        ? 'border-white/15 bg-[#0a0d12] text-white placeholder:text-white/45'
                        : 'border-[#111412]/15 bg-[#faf9f5] text-[#111412] placeholder:text-[#525b53]/70'
                    }`}
                  />
                  {companySearchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSelectCompanyFilter('All')}
                      aria-label="Clear company search"
                      className={`absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 ${textMuted}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {selectedCompany !== 'All' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyLink(`company-share-${selectedCompany}`, undefined, selectedCompany)
                    }
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#f5a524] px-4 py-2 text-xs font-extrabold whitespace-nowrap text-[#111412] transition hover:brightness-105"
                  >
                    {copiedKey === `company-share-${selectedCompany}` ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>{selectedCompany} Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share {selectedCompany} Link</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Clickable Brand / Company Selector Pills */}
            <div className={`mt-6 border-t pt-5 ${dividerBorder}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className={`font-mono text-[11px] font-bold tracking-wider uppercase ${textMuted}`}>
                  Select Client Brand ({companyDirectory.length} {companyDirectory.length === 1 ? 'Company' : 'Companies'} Indexed)
                </span>
                {selectedCompany !== 'All' && (
                  <button
                    type="button"
                    onClick={() => handleSelectCompanyFilter('All')}
                    className={`text-xs font-bold underline ${accentText}`}
                  >
                    Show All Companies
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectCompanyFilter('All')}
                  className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition ${
                    selectedCompany === 'All' && !companySearchQuery
                      ? 'border-[#f5a524] bg-[#f5a524] text-[#111412] shadow-xs'
                      : secondaryBtn
                  }`}
                >
                  <span>All Companies</span>
                  <span className="font-mono text-[11px] font-extrabold tabular-nums opacity-80">
                    ({allVideos.length})
                  </span>
                </button>

                {matchingCompanies.map((comp) => {
                  const isSelected =
                    selectedCompany.toLowerCase() === comp.name.toLowerCase();
                  return (
                    <button
                      key={comp.name}
                      type="button"
                      onClick={() => handleSelectCompanyFilter(comp.name)}
                      className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition ${
                        isSelected
                          ? 'border-[#f5a524] bg-[#f5a524] text-[#111412] shadow-xs'
                          : secondaryBtn
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{comp.name}</span>
                      <span className="font-mono text-[11px] font-extrabold tabular-nums opacity-80">
                        ({comp.count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Company Results Summary Banner */}
            <div
              className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 ${subtleSurface}`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`font-bold ${textPrimary}`}>
                  {selectedCompany !== 'All'
                    ? `Showing ${companyFilteredVideos.length} Productions for ${selectedCompany}`
                    : companySearchQuery
                      ? `Showing ${companyFilteredVideos.length} Matches for "${companySearchQuery}"`
                      : `All ${allVideos.length} Productions Across ${companyDirectory.length} ${
                          companyDirectory.length === 1 ? 'Brand' : 'Brands'
                        }`}
                </span>
                <span aria-hidden="true" className={textMuted}>·</span>
                <span className={textMuted}>Click any company pill above to isolate its reels</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedCompany !== 'All' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyAllLinksBundle(
                        companyFilteredVideos,
                        selectedCompany,
                        `company-bundle-${selectedCompany}`
                      )
                    }
                    className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
                  >
                    {copiedKey === `company-bundle-${selectedCompany}` ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Copied {companyFilteredVideos.length} Links</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy All {selectedCompany} Links</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Company Filtered Videos Grid (Shown when a specific company or search is active) */}
            {(selectedCompany !== 'All' || companySearchQuery.trim() !== '') && (
              <div className="mt-6">
                {companyFilteredVideos.length === 0 ? (
                  <div className={`rounded-2xl border p-10 text-center ${subtleSurface}`}>
                    <p className={`font-display text-base font-bold ${textPrimary}`}>
                      No company productions match "{companySearchQuery || selectedCompany}"
                    </p>
                    <p className={`mt-1 text-xs ${textSecondary}`}>
                      Try selecting one of the verified client pills above or clearing the search box.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectCompanyFilter('All')}
                      className="mt-4 rounded-full bg-[#f5a524] px-4 py-2 text-xs font-extrabold text-[#111412]"
                    >
                      Reset Company Filter
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {companyFilteredVideos.map((item, idx) =>
                      renderVideoCard(item, idx, 'company')
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: GENERAL WORK DEPOSITORY (ALL WORKS) */}
        <section
          id="general-depository"
          aria-label="General Work Depository of All Studio Productions"
          className="scroll-mt-24"
        >
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className={`flex items-center gap-2 font-mono text-xs font-bold tracking-wider uppercase ${accentText}`}>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Master Archive &amp; General Work Depository</span>
              </div>
              <h2 className={`mt-1 font-display text-2xl font-extrabold sm:text-3xl ${textPrimary}`}>
                General Work Depository ({depositoryFilteredVideos.length} of {allVideos.length} Works)
              </h2>
              <p className={`mt-1.5 text-sm ${textSecondary}`}>
                The complete repository of all studio commercial ads, brand stories, and promotional reels across every client and category.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* View Mode Switcher: Visual Grid vs Executive Index Table */}
              <div
                className={`inline-flex items-center gap-1 rounded-full border p-1 ${subtleSurface}`}
                role="group"
                aria-label="Depository layout view"
              >
                <button
                  type="button"
                  onClick={() => setDepositoryViewMode('grid')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                    depositoryViewMode === 'grid'
                      ? 'bg-[#f5a524] text-[#111412] shadow-xs'
                      : isDark
                        ? 'text-white/70 hover:text-white'
                        : 'text-[#525b53] hover:text-[#111412]'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Gallery Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDepositoryViewMode('index')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                    depositoryViewMode === 'index'
                      ? 'bg-[#f5a524] text-[#111412] shadow-xs'
                      : isDark
                        ? 'text-white/70 hover:text-white'
                        : 'text-[#525b53] hover:text-[#111412]'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Index Ledger</span>
                </button>
              </div>

              {/* Format Segmented Filter */}
              <div
                className={`inline-flex items-center gap-1 rounded-full border p-1 ${subtleSurface}`}
                role="group"
                aria-label="Filter depository by video orientation"
              >
                {(
                  [
                    { id: 'all', label: 'All Formats' },
                    { id: 'vertical', label: '9:16 Vertical' },
                    { id: 'horizontal', label: '16:9 Widescreen' },
                  ] as const
                ).map((fmt) => {
                  const active = depositoryFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setDepositoryFormat(fmt.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
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

              {/* Depository Keyword Search Input */}
              <div className="relative w-full sm:w-64">
                <Search
                  className={`pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 ${textMuted}`}
                />
                <input
                  type="search"
                  value={depositoryQuery}
                  onChange={(e) => setDepositoryQuery(e.target.value)}
                  placeholder="Search depository…"
                  className={`min-h-[40px] w-full rounded-full border py-1.5 pr-8 pl-9 text-sm transition focus:border-[#f5a524] focus:outline-none ${
                    isDark
                      ? 'border-white/15 bg-[#121722] text-white placeholder:text-white/45'
                      : 'border-[#111412]/15 bg-white text-[#111412] placeholder:text-[#525b53]/70'
                  }`}
                />
                {depositoryQuery && (
                  <button
                    type="button"
                    onClick={() => setDepositoryQuery('')}
                    aria-label="Clear depository search"
                    className={`absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 ${textMuted}`}
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
            aria-label="Filter general depository by category"
          >
            {depositoryCategories.map((cat) => {
              const isSelected = depositoryCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setDepositoryCategory(cat)}
                  className={`min-h-[40px] shrink-0 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition ${
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

          {/* Depository Content: Grid View or Executive Index Ledger */}
          {depositoryFilteredVideos.length === 0 ? (
            <div className={`rounded-3xl border p-12 text-center ${cardBg}`}>
              <p className={`font-display text-lg font-bold ${textPrimary}`}>
                No videos in the depository match your filter
              </p>
              <p className={`mt-1 text-sm ${textSecondary}`}>
                Try clearing your search or selecting "All" categories and formats.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDepositoryCategory('All');
                  setDepositoryFormat('all');
                  setDepositoryQuery('');
                }}
                className="mt-4 rounded-full bg-[#f5a524] px-5 py-2.5 text-xs font-extrabold text-[#111412]"
              >
                Reset Depository Filters
              </button>
            </div>
          ) : depositoryViewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {depositoryFilteredVideos.map((item, idx) =>
                renderVideoCard(item, idx, 'depository')
              )}
            </div>
          ) : (
            <div className={`overflow-hidden rounded-3xl border ${cardBg}`}>
              <div className=" divide-y divide-white/10">
                {depositoryFilteredVideos.map((item, idx) => {
                  const isPlayingOnStage = activeVideo?.id === item.id && autoPlayStage;
                  const rowCopyKey = `ledger-${item.id}`;
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col justify-between gap-4 p-4 transition sm:flex-row sm:items-center sm:px-6 ${
                        isPlayingOnStage
                          ? isDark
                            ? 'bg-[#f5a524]/12'
                            : 'bg-[#fff8e6]'
                          : isDark
                            ? 'hover:bg-white/[0.03]'
                            : 'hover:bg-[#fafaf6]'
                      } ${idx > 0 ? `border-t ${dividerBorder}` : ''}`}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <span className={`font-mono text-xs font-extrabold tabular-nums ${accentText}`}>
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-black ring-1 ring-black/15">
                          <img
                            src={ytThumb(item.youtubeId)}
                            alt=""
                            draggable={false}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className={`flex flex-wrap items-center gap-1.5 text-xs ${textMuted}`}>
                            <button
                              type="button"
                              onClick={() => handleSelectCompanyFilter(item.client, true)}
                              className={`font-bold hover:underline ${textSecondary}`}
                            >
                              {item.client}
                            </button>
                            <span aria-hidden="true">·</span>
                            <span>{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              {item.orientation === 'vertical' ? '9:16 Vertical' : '16:9 Widescreen'}
                            </span>
                          </div>
                          <h3 className={`truncate font-display text-base font-extrabold ${textPrimary}`}>
                            {item.title}
                          </h3>
                          {item.result && (
                            <p className={`truncate text-xs ${textSecondary}`}>{item.result}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectVideo(item, true)}
                          className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-4 text-xs font-extrabold whitespace-nowrap transition ${
                            isPlayingOnStage
                              ? 'bg-[#f5a524] text-[#111412]'
                              : isDark
                                ? 'bg-[#f5a524] text-[#111412]'
                                : 'bg-[#111412] text-white'
                          }`}
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>{isPlayingOnStage ? 'Playing on Stage' : 'Play on Stage'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setLightboxItem(item)}
                          className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                          <span>Fullscreen</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(rowCopyKey, item.id)}
                          className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold whitespace-nowrap transition ${secondaryBtn}`}
                        >
                          {copiedKey === rowCopyKey ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* CLOSING CTA BANNER */}
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
              className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-[#f5a524] px-6 py-3 font-display text-sm font-extrabold text-[#111412] transition hover:brightness-105"
            >
              <span>Book a Free Strategy Session</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex min-h-[48px] items-center gap-2 rounded-full border px-6 py-3 font-display text-sm font-bold no-underline transition ${secondaryBtn}`}
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
