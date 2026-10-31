import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { fmtMoney, waLink, waNumberFor } from '@/lib/money';
import { track } from '@/lib/tracking';
import { Wall } from '@/components/Wall';
import { StrategyModal } from '@/components/StrategyModal';
import { CirclesFundMePreviewModal } from '@/components/CirclesFundMePreviewModal';
import { Lightbox } from '@/components/shared';
import LivePopups from '@/components/LivePopups';
import { defaultCommercialOffers } from '@/content/commercialOffers';
import type { PortfolioItem } from '@/content/types';
import { captureReferralFromUrl } from '@/lib/referral';
import { captureInitialChannel } from '@/lib/quizEngine';
import {
  Sparkles, ArrowRight, MessageCircle, CheckCircle2, ShieldCheck,
  ChevronDown, Video, FileText, Layers, Clock, Users, DollarSign,
  AlertCircle, Briefcase, Play, Calendar, ExternalLink, Check,
  Zap, Award, Film, Sliders, BarChart3, HelpCircle, Eye, RefreshCw,
  X, Volume2, Maximize2, Shield, ArrowUpRight, Calculator, CheckCircle
} from 'lucide-react';
import { CameraViewfinder } from '@/components/animations/CameraViewfinder';
import { SoundWaveVisualizer } from '@/components/animations/SoundWaveVisualizer';
import { ClapperboardGraphic } from '@/components/animations/ClapperboardGraphic';
import { AnimatedStoryGraphic } from '@/components/animations/AnimatedStoryGraphic';
import { TactileRipple, RippleButton, RippleAnchor } from '@/components/ui/TactileRipple';

export default function MonthlyRetainerPage() {
  const { content } = useStore();
  const { country, setCountry } = useCountry();
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<PortfolioItem | null>(null);
  const [priceHovered, setPriceHovered] = useState(false);
  const [activeSprintWeek, setActiveSprintWeek] = useState<number>(1);

  useEffect(() => {
    captureInitialChannel();
    captureReferralFromUrl(content.affiliates, content.referralSettings);
  }, [content.affiliates, content.referralSettings]);

  const offerData = content.commercialOffers?.['monthly-content'] || defaultCommercialOffers['monthly-content'];

  // Currency aware pricing
  const basePrice = offerData.pricesByCountry?.[country.code] ?? offerData.price ?? 250000;
  const formattedPrice = fmtMoney(basePrice, country);
  const videoQty = offerData.monthlyVideoQuantity || 15;
  const unitPrice = Math.round(basePrice / videoQty);
  const formattedUnitPrice = fmtMoney(unitPrice, country);

  // Traditional cost estimation for comparison
  const traditionalUnitPrice = unitPrice * 3.5;
  const formattedTraditionalUnitPrice = fmtMoney(traditionalUnitPrice, country);

  const items = content.portfolio.filter((p) => p.visible).sort((a, b) => a.order - b.order);
  const featuredVideo = items[0] || null;
  const secondaryVideo = items[1] || items[0] || null;
  const tertiaryVideo = items[2] || items[0] || null;

  const sprintWeeks = [
    {
      week: 1,
      title: 'Strategy & Hook Ideation',
      subtitle: 'Audit, angle discovery & script sprint',
      code: 'SPRINT_01',
      description: 'We audit your competitor landscape, diagnose customer drop-off points, and draft 15 scroll-stopping direct response scripts with high-retention 0-3 second hooks.',
      checkpoint: 'Checkpoint 1: 1-Page Creative Brief & Script Approval',
    },
    {
      week: 2,
      title: 'Studio Directing & Production',
      subtitle: 'Batch visual generation & scene composition',
      code: 'SPRINT_02',
      description: 'Our directing team batch-generates photorealistic cinematic scenes, studio lighting atmospheres, and bespoke brand-aligned environments without camera rental delays.',
      checkpoint: 'Checkpoint 2: Visual Tone & Character Cast Sign-Off',
    },
    {
      week: 3,
      title: 'Editorial, Motion & Sound Design',
      subtitle: 'Color grade, dynamic captions & audio mix',
      code: 'SPRINT_03',
      description: 'Pacing optimization, multi-track audio engineering with licensed commercial soundbeds, motion subtitles, and simultaneous 9:16 vertical and 16:9 widescreen master exports.',
      checkpoint: 'Checkpoint 3: First Cut Assembly Delivery',
    },
    {
      week: 4,
      title: 'Asset Handover & Performance Retro',
      subtitle: 'Multi-platform package & hook iteration',
      code: 'SPRINT_04',
      description: 'Full delivery of 15 commercial masters with organized naming hierarchies. We analyze the past month’s best-performing hooks and load next month’s creative calendar.',
      checkpoint: 'Delivery: 15 Master Exports + Cloud Drive Sync',
    },
  ];

  return (
    <div className="min-h-dvh bg-[#07090c] text-white antialiased selection:bg-[#f5a524] selection:text-black">
      {/* Subtle ambient cinema background glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(245,165,36,0.08)_0%,transparent_50%)] z-0" />
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px] z-0" />

      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="relative z-20 border-b border-white/10 bg-[#090c10] px-4 py-2.5 text-center text-xs font-mono tracking-wide">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#f5a524] px-2 py-0.5 text-[10px] font-extrabold text-black uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
            Dedicated Content Retainer
          </span>
          <span className="text-white/80">
            {offerData.hero.eyebrow} <span className="text-white/30">/</span> <strong>{videoQty} Direct-Response Ads Monthly</strong>
          </span>
          <span className="text-[#f5a524] font-bold">
            {formattedPrice}/mo
          </span>
          <span className="text-white/40 text-[11px] hidden sm:inline">
            · Studio Partnership
          </span>
        </div>
      </div>

      {/* 2. STICKY BRAND HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07090c]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <a href="#/" className="flex items-center gap-2.5 text-inherit no-underline group">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-[#f5a524] border border-white/10 shadow-sm transition group-hover:scale-105 group-hover:border-[#f5a524]/40">
              <Film className="h-4 w-4" />
            </span>
            <div className="flex flex-col text-left">
              <span className="font-display text-base font-extrabold tracking-tight sm:text-lg leading-tight text-white">
                {content.brand.name}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#f5a524] font-bold">
                Commercial Retainer
              </span>
            </div>
          </a>

          {/* Quick country switcher & Ripple CTA */}
          <div className="flex items-center gap-3">
            <select
              value={country.code}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm focus:border-[#f5a524] focus:outline-none cursor-pointer"
              aria-label="Select country currency"
            >
              {content.countries.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#111412] text-white">
                  {c.flag} {c.currency}
                </option>
              ))}
            </select>

            <RippleButton
              onClick={() => setStrategyOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-[#07090c] shadow transition hover:bg-[#f5a524] hover:text-black"
            >
              <span>{offerData.hero.primaryCta}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </RippleButton>
          </div>
        </div>
      </header>

      <main className="relative z-10 pb-28">
        {/* =====================================================================
            3. HERO: CINEMATIC DARK-MODE EDITORIAL HEADER
        ====================================================================== */}
        <section className="relative px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 overflow-hidden">
          <div className="mx-auto max-w-5xl space-y-8 text-center">
            {/* Film Production Kicker (Zero-Pill) */}
            <div className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524] border-b border-[#f5a524]/30 pb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#f5a524]" />
              <span>{offerData.hero.eyebrow}</span>
              <span className="text-white/30">·</span>
              <span>15 Commercial Deliverables Every 30 Days</span>
            </div>

            {/* Primary Bricolage Grotesque Headline */}
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight text-white leading-[1.04] max-w-4xl mx-auto text-balance">
              {offerData.hero.headline}
            </h1>

            {/* Two-Tone Refined Subheadline */}
            <p className="mx-auto max-w-2xl text-base text-white/70 sm:text-xl leading-relaxed">
              <span className="font-semibold text-white">Never let your ad pipeline run dry. </span>
              {offerData.hero.subheadline}
            </p>

            {/* =====================================================================
                INTERACTIVE UNIT ECONOMICS: HOVER REVEAL PRICE-PER-VIDEO COMPONENT
            ====================================================================== */}
            <div className="mx-auto max-w-xl">
              <div
                onMouseEnter={() => setPriceHovered(true)}
                onMouseLeave={() => setPriceHovered(false)}
                onClick={() => setPriceHovered(!priceHovered)}
                tabIndex={0}
                role="region"
                aria-label="Price per video interactive breakdown"
                className={`relative rounded-2xl border transition-all duration-300 p-5 sm:p-6 text-left cursor-pointer group select-none ${
                  priceHovered
                    ? 'border-[#f5a524] bg-white/[0.08] shadow-[0_0_35px_rgba(245,165,36,0.25)]'
                    : 'border-white/15 bg-white/[0.03] hover:border-[#f5a524]/60 hover:bg-white/[0.05]'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#f5a524] animate-ping" />
                    <span className="font-mono text-xs uppercase tracking-wider text-white/60">
                      Managed Studio Retainer
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-[#f5a524] flex items-center gap-1 group-hover:underline">
                    <Calculator className="h-3 w-3" />
                    {priceHovered ? 'Tap or click to lock' : 'Hover to reveal unit cost'}
                  </span>
                </div>

                {/* Pricing Core Display */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                        {formattedPrice}
                      </span>
                      <span className="font-mono text-sm text-white/50">/ month</span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-white/50">
                      Includes {videoQty} master direct-response videos (up to 1 min 30 secs each)
                    </p>
                  </div>

                  {/* The Interactive Reveal Pill/Box */}
                  <div className={`transition-all duration-300 ${priceHovered ? 'scale-105' : 'opacity-85'}`}>
                    <div className="rounded-xl border border-[#f5a524]/40 bg-[#f5a524]/10 px-4 py-2 text-right">
                      <span className="font-mono text-[10px] uppercase text-[#f5a524] block font-bold">
                        UNIT COST CALCULATION
                      </span>
                      <span className="font-display text-xl sm:text-2xl font-black text-[#f5a524]">
                        ~{formattedUnitPrice}
                      </span>
                      <span className="text-[11px] font-mono text-white/60 block">per finished commercial</span>
                    </div>
                  </div>
                </div>

                {/* Expanding Reveal Drawer (Shown on hover or tap) */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    priceHovered ? 'max-h-36 opacity-100 pt-4 mt-4 border-t border-white/10' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Retainer Package</span>
                      <span className="text-white font-semibold">{videoQty} Custom Videos</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Calculated Unit Cost</span>
                      <span className="text-[#f5a524] font-bold">{formattedUnitPrice} / video</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-white/40 block text-[10px] uppercase">Traditional Crew</span>
                      <span className="text-red-400 line-through">~{formattedTraditionalUnitPrice}+</span>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-emerald-400 font-mono">
                    ✓ Full scriptwriting, AI directing, sound mix & commercial rights included.
                  </p>
                </div>
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="pt-2 flex flex-col items-center gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
                <RippleButton
                  onClick={() => setStrategyOpen(true)}
                  className="flex min-h-[54px] w-full flex-1 items-center justify-center gap-2 rounded-xl bg-[#f5a524] px-7 font-display text-sm font-bold uppercase tracking-wider text-black shadow-xl shadow-[#f5a524]/20 transition hover:brightness-110"
                >
                  <span>Book Strategy Call</span>
                  <ArrowRight className="h-4 w-4" />
                </RippleButton>

                <RippleAnchor
                  href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I am interested in the Monthly Video Content Retainer for my business.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('Contact')}
                  className="flex min-h-[54px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 font-display text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </RippleAnchor>
              </div>

              <p className="text-xs text-white/50 font-mono max-w-md mt-1">
                {offerData.hero.contextNote}
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================================
            4. 3D CYLINDER VIDEO WALL THEATER
        ====================================================================== */}
        <section className="relative py-12 overflow-hidden bg-black/60 border-y border-white/10">
          <div className="mx-auto max-w-5xl px-4 text-center mb-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              PORTFOLIO THEATER
            </span>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl mt-1 text-white">
              Ads Directed & Produced by AdVibe Studios
            </h2>
            <p className="text-xs text-white/50 max-w-lg mx-auto mt-1">
              Drag or swipe to rotate the 3D showcase cylinder. Tap any video card to play full screen.
            </p>
          </div>

          <div className="relative py-2">
            <Wall items={items} onPlay={(item) => setPlayingVideo(item)} />
          </div>
        </section>

        {/* =====================================================================
            5. CINEMATIC GRID: ALTERNATING LARGE HERO MEDIA & CARD-FREE DELIVERABLES
        ====================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-3">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              THE MONTHLY DELIVERABLES SYSTEM
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
              EVERYTHING DELIVERED IN YOUR MONTHLY CONTENT RUN
            </h2>
            <p className="text-sm sm:text-base text-white/60">
              No bloated retainers for vague consulting. You get high-performing commercial assets built to arrest the scroll and generate pipeline every 30 days.
            </p>
          </div>

          {/* =====================================================================
              DELIVERABLE 01: DIRECT-RESPONSE COMMERCIALS (MEDIA LEFT, TEXT RIGHT)
          ====================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center py-12 border-b border-white/10">
            {/* Large Hero Media Placeholder 01 */}
            <div className="lg:col-span-7 relative group">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl shadow-black/80">
                {featuredVideo ? (
                  <img
                    src={`https://img.youtube.com/vi/${featuredVideo.youtubeId}/maxresdefault.jpg`}
                    alt="Direct-Response Video Deliverable"
                    className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${featuredVideo.youtubeId}/hqdefault.jpg`;
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-[#111418] flex items-center justify-center" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                {/* 4K Viewfinder HUD Overlay */}
                <CameraViewfinder
                  active
                  resolution="4K RAW"
                  fps={60}
                  label="DELIVERABLE 01 · 15 MASTER EDITS"
                />

                {/* Interactive Play Trigger */}
                {featuredVideo && (
                  <button
                    onClick={() => setPlayingVideo(featuredVideo)}
                    className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f5a524] text-black shadow-2xl transition-transform hover:scale-110 active:scale-95 z-20 cursor-pointer"
                    aria-label="Play sample direct-response commercial"
                  >
                    <Play className="h-7 w-7 translate-x-0.5 fill-black text-black" />
                  </button>
                )}

                {/* Footer Metadata in Viewport */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-white/80 z-20">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    15 Finished Master Cuts
                  </span>
                  <span className="text-[#f5a524]">4K UHD 60FPS</span>
                </div>
              </div>
            </div>

            {/* Offset Card-Free Typographic Block 01 */}
            <div className="lg:col-span-5 space-y-5 text-left">
              <div className="font-mono text-xs uppercase tracking-widest text-[#f5a524] flex items-center gap-2">
                <span>01 // DIRECT RESPONSE</span>
                <span className="text-white/30">·</span>
                <span>CORE ASSET</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white leading-tight">
                15 Finished Commercials Directed for Immediate Conversions
              </h3>

              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                We craft each video with scroll-stopping 0-3 second hooks engineered to arrest attention in congested feeds, followed by emotional pacing and explicit conversion calls-to-action.
              </p>

              <div className="pt-2 space-y-3 font-mono text-xs text-white/80">
                <div className="flex items-start gap-3 border-l-2 border-[#f5a524] pl-3 py-1">
                  <div>
                    <strong className="text-white block">Up to 1 Min 30 Secs Max Duration:</strong>
                    <span className="text-white/60">Each video can run up to 90 seconds, giving you room for both punchy hooks and deeper persuasion.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-l-2 border-[#f5a524] pl-3 py-1">
                  <div>
                    <strong className="text-white block">3 Distinct Hook Variations:</strong>
                    <span className="text-white/60">Every core script is delivered with testing angles to scale ad ROAS.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-l-2 border-[#f5a524] pl-3 py-1">
                  <div>
                    <strong className="text-white block">Photorealistic Production:</strong>
                    <span className="text-white/60">Cinematic visual direction, authentic human emotion, and no cheap stock.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              DELIVERABLE 02: DUAL FORMAT RATIOS (TEXT LEFT, MEDIA RIGHT)
          ====================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center py-16 border-b border-white/10">
            {/* Offset Card-Free Typographic Block 02 */}
            <div className="lg:col-span-5 space-y-5 text-left order-2 lg:order-1">
              <div className="font-mono text-xs uppercase tracking-widest text-[#f5a524] flex items-center gap-2">
                <span>02 // ASPECT RATIOS</span>
                <span className="text-white/30">·</span>
                <span>OMNICHANNEL</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white leading-tight">
                Dual 9:16 Vertical & 16:9 Widescreen Master Exports
              </h3>

              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                Never crop or stretch your ads. Every monthly asset is natively graded and formatted for vertical social platforms as well as widescreen website headers, YouTube Ads, and desktop sales pages.
              </p>

              <div className="pt-2 space-y-3 font-mono text-xs text-white/80">
                <div className="flex items-start gap-3 border-l-2 border-[#f5a524] pl-3 py-1">
                  <div>
                    <strong className="text-white block">9:16 Vertical Ratios:</strong>
                    <span className="text-white/60">Built for Instagram Reels, TikTok, YouTube Shorts, and Meta Stories.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-l-2 border-[#f5a524] pl-3 py-1">
                  <div>
                    <strong className="text-white block">16:9 Cinema Widescreen:</strong>
                    <span className="text-white/60">Optimized for YouTube In-Stream ads, sales page headers, and client portals.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Large Hero Media Placeholder 02 (Vertical & Split Showcase) */}
            <div className="lg:col-span-7 relative group order-1 lg:order-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/20 bg-[#0d1015] shadow-2xl shadow-black/80 flex items-center justify-center p-6">
                {/* Widescreen background backdrop */}
                {secondaryVideo && (
                  <img
                    src={`https://img.youtube.com/vi/${secondaryVideo.youtubeId}/maxresdefault.jpg`}
                    alt="Dual Aspect Ratio Demonstration"
                    className="absolute inset-0 h-full w-full object-cover opacity-30 blur-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${secondaryVideo.youtubeId}/hqdefault.jpg`;
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-6 max-w-md w-full justify-center">
                  {/* Vertical Phone Simulator */}
                  <div className="relative w-36 sm:w-44 aspect-[9/16] rounded-2xl border-2 border-white/30 bg-black overflow-hidden shadow-2xl">
                    {secondaryVideo && (
                      <img
                        src={`https://img.youtube.com/vi/${secondaryVideo.youtubeId}/maxresdefault.jpg`}
                        alt="9:16 Vertical Preview"
                        className="h-full w-full object-cover opacity-85"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${secondaryVideo.youtubeId}/hqdefault.jpg`;
                        }}
                      />
                    )}
                    <div className="absolute top-2 inset-x-0 mx-auto w-12 h-1 bg-white/40 rounded-full" />
                    <div className="absolute bottom-2 left-2 right-2 text-[9px] font-mono text-center bg-black/60 backdrop-blur-sm py-1 rounded text-[#f5a524]">
                      9:16 VERTICAL
                    </div>
                  </div>

                  {/* Horizontal Widescreen Simulator */}
                  <div className="relative flex-1 aspect-video rounded-xl border border-white/30 bg-black overflow-hidden shadow-xl hidden sm:block">
                    {tertiaryVideo && (
                      <img
                        src={`https://img.youtube.com/vi/${tertiaryVideo.youtubeId}/maxresdefault.jpg`}
                        alt="16:9 Widescreen Preview"
                        className="h-full w-full object-cover opacity-85"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${tertiaryVideo.youtubeId}/hqdefault.jpg`;
                        }}
                      />
                    )}
                    <div className="absolute bottom-2 left-2 right-2 text-[9px] font-mono text-center bg-black/60 backdrop-blur-sm py-1 rounded text-white">
                      16:9 WIDESCREEN
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 left-4 font-mono text-[11px] text-white/60">
                  MULTI-FORMAT PIPELINE
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              DELIVERABLE 03: SOUND & MASTERING (MEDIA LEFT, TEXT RIGHT)
          ====================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center py-16 border-b border-white/10">
            {/* Large Hero Media Placeholder 03: Live Equalizer Soundboard */}
            <div className="lg:col-span-7 relative group">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/20 bg-black/80 shadow-2xl shadow-black/80 p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-xs text-white/60">
                  <span className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-[#f5a524]" />
                    COMMERCIAL MASTER AUDIO SUITE
                  </span>
                  <span className="text-[#f5a524]">LUFS -14.0 TARGET</span>
                </div>

                {/* Animated Audio Equalizer Visualizer */}
                <div className="py-4">
                  <SoundWaveVisualizer
                    label="STUDIO RETINANCE · STEREO SFX & VOICE MASTER"
                    bars={38}
                    height={58}
                    className="border-white/10 bg-black/50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-white/50 pt-2 border-t border-white/10">
                  <div>VOICE TIMBRE: WARM / DIRECT</div>
                  <div>SFX FOLEY: SYNCHRONIZED</div>
                  <div>COMMERCIAL LICENSE: INCLUDED</div>
                </div>
              </div>
            </div>

            {/* Offset Card-Free Typographic Block 03 */}
            <div className="lg:col-span-5 space-y-5 text-left">
              <div className="font-mono text-xs uppercase tracking-widest text-[#f5a524] flex items-center gap-2">
                <span>03 // AUDIO ENGINEERING</span>
                <span className="text-white/30">·</span>
                <span>IMMERSION</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white leading-tight">
                Master Audio Design, Commercial Soundbeds & Dynamic Voice
              </h3>

              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                Over 60% of video engagement is dictated by audio fidelity. Every deliverable includes sound effects, tactile foley hits, commercial music licensing, and crystal-clear voiceovers with native accents.
              </p>

              <div className="pt-2 space-y-3 font-mono text-xs text-white/80">
                <div className="flex items-start gap-3 border-l-2 border-[#f5a524] pl-3 py-1">
                  <div>
                    <strong className="text-white block">Commercial Sound Licensing:</strong>
                    <span className="text-white/60">Zero copyright strikes or DMCA muted audio on Meta or YouTube.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-l-2 border-[#f5a524] pl-3 py-1">
                  <div>
                    <strong className="text-white block">Precision Foley Design:</strong>
                    <span className="text-white/60">Subtle risers, swooshes, and impact drops that trigger scroll pauses.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              DELIVERABLE 04: CHECKPOINTS & 1-PAGE BRIEF (TEXT LEFT, MEDIA RIGHT)
          ====================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center py-16">
            {/* Offset Card-Free Typographic Block 04 */}
            <div className="lg:col-span-5 space-y-5 text-left order-2 lg:order-1">
              <div className="font-mono text-xs uppercase tracking-widest text-[#f5a524] flex items-center gap-2">
                <span>04 // PRE-PRODUCTION</span>
                <span className="text-white/30">·</span>
                <span>CHECKPOINT CONTROL</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white leading-tight">
                The 1-Page Creative Brief & Checkpointed Approvals
              </h3>

              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                You never receive surprises. Before rendering begins, you receive our streamlined 1-page brief containing hook concepts, script lines, and lighting tone for your swift 48h sign-off.
              </p>

              <div className="pt-2 space-y-3 font-mono text-xs text-white/80">
                <div className="flex items-start gap-3 border-l-2 border-[#f5a524] pl-3 py-1">
                  <div>
                    <strong className="text-white block">Full Approval Authority:</strong>
                    <span className="text-white/60">Checkpoint 1 (Script & Brief) and Checkpoint 2 (First Cut) are signed off by you.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-l-2 border-[#f5a524] pl-3 py-1">
                  <div>
                    <strong className="text-white block">Unconditional Commercial Ownership:</strong>
                    <span className="text-white/60">All delivered masters and scripts belong entirely to your company.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Large Hero Media Placeholder 04: Interactive Clapperboard & Viewfinder Studio Graphic */}
            <div className="lg:col-span-7 relative group order-1 lg:order-2 flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl border border-white/20 bg-[#0c0f14] shadow-2xl p-6 flex flex-col justify-between text-left font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2 text-[#f5a524] font-bold text-xs uppercase">
                    <Film className="h-4 w-4" />
                    ADVIBE STUDIO PRE-PRODUCTION ENGINE
                  </div>
                  <span className="text-[10px] text-white/40">INTERACTIVE CHECKPOINT</span>
                </div>

                {/* Animated Story Graphic with GSAP/Framer Motion Clapperboard Snap and 4K Viewfinder */}
                <div className="py-2 flex justify-center">
                  <AnimatedStoryGraphic
                    type="combo"
                    title="ADVIBE RETAINER // 15 CUTS"
                    scene="01"
                    take="03"
                    roll="M01"
                    resolution="4K RAW"
                    fps={60}
                    interactive
                    autoSnapOnInView
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-400">
                  <span>✓ Interactive Slate & 4K Framing</span>
                  <span className="text-white/40">Tap To Clap Scene</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            6. THE 4-WEEK PRODUCTION LOOP (INTERACTIVE TIMELINE)
        ====================================================================== */}
        <section className="py-20 bg-[#0b0e13] border-y border-white/10 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-left">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                PREDICTABLE SPRINT CADENCE
              </span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold uppercase text-white">
                How Your 30-Day Content Production Runs
              </h2>
            </div>

            {/* Interactive Sprint Week Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {sprintWeeks.map((s) => {
                const isSelected = activeSprintWeek === s.week;
                return (
                  <button
                    key={s.week}
                    onClick={() => setActiveSprintWeek(s.week)}
                    className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#f5a524] bg-[#f5a524]/10 text-white shadow-[0_0_20px_rgba(245,165,36,0.2)]'
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-[#f5a524] mb-1">
                      {s.code}
                    </div>
                    <div className="font-display text-sm font-bold truncate text-white">
                      {s.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Sprint Detail Card */}
            {(() => {
              const current = sprintWeeks.find((w) => w.week === activeSprintWeek) || sprintWeeks[0];
              return (
                <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-7 sm:p-10 backdrop-blur-md grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-8 space-y-4">
                    <div className="font-mono text-xs text-[#f5a524] uppercase font-bold tracking-wider">
                      {current.subtitle}
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                      {current.title}
                    </h3>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                      {current.description}
                    </p>
                  </div>

                  <div className="md:col-span-4 rounded-2xl border border-[#f5a524]/30 bg-black/60 p-5 space-y-3">
                    <span className="font-mono text-[10px] text-white/40 uppercase block">Milestone Output:</span>
                    <p className="font-display text-base font-bold text-white">
                      {current.checkpoint}
                    </p>
                    <div className="pt-2 border-t border-white/10 text-xs font-mono text-[#f5a524]">
                      Turnaround: 48h Response SLA
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* =====================================================================
            7. VALUE COMPARISON: OVERLOADED SOLO HIRE VS DEDICATED STUDIO
        ====================================================================== */}
        {offerData.valueComparison && (
          <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-5xl mx-auto text-left">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                RESOURCE ARBITRAGE
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white">
                {offerData.valueComparison.heading}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Overloaded Hire Box */}
              <div className="rounded-3xl border border-red-500/30 bg-red-950/10 p-8 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-red-500/20">
                  <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-wider">
                    Single In-House Hire
                  </span>
                  <span className="font-mono text-xs text-red-500/80">High Risk & Burnout</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  The Solo Generalist
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-white/70">
                  <li className="flex items-start gap-2.5 text-red-300">
                    <X className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <span>Expected to script, film, direct, sound design, and edit alone</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-red-300">
                    <X className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <span>Creative fatigue and repetition sets in after just 6 to 8 weeks</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-red-300">
                    <X className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <span>Full salary + workstation rig + software licenses exceeds $6,000/mo</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-red-300">
                    <X className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <span>Sick leave or resignation leaves your acquisition funnel frozen</span>
                  </li>
                </ul>
              </div>

              {/* Dedicated Studio Retainer Box */}
              <div className="rounded-3xl border-2 border-[#f5a524] bg-white/[0.04] p-8 space-y-5 shadow-[0_0_40px_rgba(245,165,36,0.15)] relative">
                <div className="absolute -top-3.5 right-6 rounded-sm bg-[#f5a524] px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-wider text-black">
                  Recommended Model
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="font-mono text-xs font-bold text-[#f5a524] uppercase tracking-wider">
                    AdVibe Studio Retainer
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">Zero Payroll Headaches</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  Multidisciplinary Video Unit
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-white/85">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#f5a524]" />
                    <span>Specialized talent: Direct-response copywriter, visual director, and audio engineer</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#f5a524]" />
                    <span>15 finished, high-converting commercial exports delivered every single month</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#f5a524]" />
                    <span>Flat monthly retainer with zero equipment, insurance, or payroll taxes</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#f5a524]" />
                    <span>100% Client Checkpoints: Sign off on every script before production</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            8. CIRCLESFUNDME CASE PROOF
        ====================================================================== */}
        <section className="py-16 bg-[#090c10] border-y border-white/10 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto rounded-3xl border border-white/15 bg-white/[0.03] p-7 sm:p-10 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="rounded-sm bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 uppercase">
                  Verified Client Partner
                </span>
                <span className="font-mono text-[11px] text-white/40 uppercase tracking-wider">
                  CirclesFundMe Fintech
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                {offerData.circlesFundMeProof.heading}
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                {offerData.circlesFundMeProof.body}
              </p>
            </div>

            <RippleButton
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-display text-xs font-bold uppercase tracking-wider text-black shadow transition hover:bg-[#f5a524]"
            >
              <Play className="h-4 w-4 fill-black text-black" />
              <span>{offerData.circlesFundMeProof.ctaText}</span>
            </RippleButton>
          </div>
        </section>

        {/* =====================================================================
            9. INVESTMENT OFFER CARD WITH HOVER REVEAL PRICING
        ====================================================================== */}
        <section id="offer" className="py-20 sm:py-28 px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
            MONTHLY RETINANCE INVESTMENT
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-5xl text-white">
            {offerData.offerSummary.heading}
          </h2>

          <div className="mt-10 mx-auto max-w-lg rounded-3xl border-2 border-white/20 bg-white/[0.03] p-8 sm:p-10 shadow-2xl text-left relative backdrop-blur-md">
            <div className="absolute -top-3.5 right-6 rounded-sm bg-[#f5a524] px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-wider text-black shadow-sm">
              Dedicated Studio
            </div>

            <div>
              <span className="font-mono text-xs text-white/50 uppercase tracking-wider">
                {offerData.offerSummary.packageTitle}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold text-white sm:text-5xl">
                  {formattedPrice}
                </span>
                <span className="text-sm font-mono text-white/50">/ month</span>
              </div>

              {/* Price per video calculation badge with subtle interactive hover reveal */}
              <div
                onMouseEnter={() => setPriceHovered(true)}
                onMouseLeave={() => setPriceHovered(false)}
                onClick={() => setPriceHovered(!priceHovered)}
                tabIndex={0}
                role="button"
                aria-label="Toggle price per video breakdown"
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#f5a524]/40 bg-[#f5a524]/10 px-3 py-1.5 font-mono text-xs text-[#f5a524] cursor-pointer hover:bg-[#f5a524]/20 transition-colors"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>
                  {priceHovered
                    ? `Breakdown: ${formattedPrice} ÷ ${videoQty} videos = ~${formattedUnitPrice}/asset`
                    : `✓ ${videoQty} Videos (~${formattedUnitPrice} per video · hover to break down)`}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3 pt-6 border-t border-white/10">
              {offerData.offerSummary.inclusions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-white/80 sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#f5a524] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[11px] text-white/50 leading-relaxed border-t border-white/5 pt-3">
              {offerData.offerSummary.disclaimer}
            </p>

            <RippleButton
              onClick={() => setStrategyOpen(true)}
              className="mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#f5a524] font-display text-sm font-bold uppercase tracking-wider text-black shadow-xl transition hover:brightness-110"
            >
              <span>{offerData.offerSummary.primaryCta}</span>
              <ArrowRight className="h-4 w-4" />
            </RippleButton>
          </div>
        </section>

        {/* =====================================================================
            10. FREQUENTLY ASKED QUESTIONS
        ====================================================================== */}
        <section className="py-20 bg-[#090c10] border-t border-white/10 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                CLARITY & ASSURANCE
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold uppercase tracking-tight sm:text-4xl text-white">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {offerData.faqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden text-left"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-white sm:text-base cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#f5a524]' : 'text-white/40'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-5 pt-0 text-xs sm:text-sm leading-relaxed text-white/70 border-t border-white/5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            11. FINAL CALL TO ACTION
        ====================================================================== */}
        <section className="py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-5xl text-white">
            {offerData.finalCta.heading}
          </h2>

          <div className="space-y-2 text-sm sm:text-base text-white/70 max-w-xl mx-auto">
            {offerData.finalCta.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 justify-center max-w-md mx-auto">
            <RippleButton
              onClick={() => setStrategyOpen(true)}
              className="flex min-h-[54px] w-full sm:flex-1 items-center justify-center gap-2 rounded-2xl bg-[#f5a524] px-7 font-display text-sm font-bold uppercase tracking-wider text-black shadow-xl transition hover:brightness-110"
            >
              <span>{offerData.finalCta.primaryCta}</span>
              <ArrowRight className="h-4 w-4" />
            </RippleButton>

            <RippleAnchor
              href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I would like to discuss the Monthly Content Retainer for my brand.`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('Contact')}
              className="flex min-h-[54px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 font-display text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <span>{offerData.finalCta.secondaryCta}</span>
            </RippleAnchor>
          </div>

          <p className="text-xs text-white/40 font-mono">
            {offerData.finalCta.note}
          </p>
        </section>
      </main>

      {/* STICKY BOTTOM BAR FOR MOBILE WITH TACTILE RIPPLE */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#07090c]/95 backdrop-blur-md p-3 sm:hidden flex items-center justify-between gap-3 shadow-2xl">
        <div className="text-left">
          <p className="font-mono text-[10px] uppercase text-white/40 font-semibold">{offerData.shortLabel}</p>
          <p className="font-display text-base font-bold text-white leading-none mt-0.5">{formattedPrice}<span className="text-[10px] font-mono text-white/50">/mo</span></p>
        </div>

        <div className="flex items-center gap-2">
          <RippleAnchor
            href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I am interested in the Monthly Content Retainer.`)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('Contact')}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-emerald-400 shadow-sm"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </RippleAnchor>

          <RippleButton
            onClick={() => setStrategyOpen(true)}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#f5a524] px-4 font-display text-xs font-bold uppercase tracking-wider text-black shadow"
          >
            <span>Book Call</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </RippleButton>
        </div>
      </div>

      {/* STRATEGY CALL LEAD CAPTURE MODAL */}
      {strategyOpen && (
        <StrategyModal
          onClose={() => setStrategyOpen(false)}
          offerId="monthly-content"
          offerTitle={offerData.name}
          configuredPrice={basePrice}
          configuredQty={videoQty}
          bookingUrl={offerData.bookingUrlOverride || content.settings.bookingUrl}
        />
      )}

      {/* CIRCLESFUNDME PREVIEW MODAL */}
      <CirclesFundMePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      {/* VIDEO LIGHTBOX PLAYER */}
      {playingVideo && (
        <Lightbox
          item={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />
      )}

      {/* VERIFIED LIVE ACTIVITY POPUPS */}
      <LivePopups paused={strategyOpen || previewOpen || Boolean(playingVideo)} />
    </div>
  );
}
