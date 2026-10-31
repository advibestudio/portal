import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { fmtMoney, waLink, waNumberFor } from '@/lib/money';
import { track } from '@/lib/tracking';
import { Wall } from '@/components/Wall';
import { StrategyModal } from '@/components/StrategyModal';
import { CirclesFundMePreviewModal } from '@/components/CirclesFundMePreviewModal';
import LivePopups from '@/components/LivePopups';
import { Lightbox } from '@/components/shared';
import { defaultCommercialOffers } from '@/content/commercialOffers';
import type { PortfolioItem } from '@/content/types';
import { captureReferralFromUrl } from '@/lib/referral';
import { captureInitialChannel } from '@/lib/quizEngine';
import {
  Film, Sparkles, ArrowRight, MessageCircle, CheckCircle2, ShieldCheck,
  ChevronDown, Clapperboard, Layers, Play, Video, Eye, Tv, Award,
  Check, FileText, Clock, Users, Zap, TrendingUp, Compass, FolderCheck,
  Smartphone, Share2, HelpCircle, Flame, ArrowUpRight
} from 'lucide-react';
import { CameraViewfinder } from '@/components/animations/CameraViewfinder';
import { ClapperboardGraphic } from '@/components/animations/ClapperboardGraphic';
import { AnimatedStoryGraphic } from '@/components/animations/AnimatedStoryGraphic';
import { SoundWaveVisualizer } from '@/components/animations/SoundWaveVisualizer';
import { RetentionCurveGraph } from '@/components/animations/RetentionCurveGraph';
import { StoryConceptBadge } from '@/components/animations/StoryConceptIcons';
import { RippleButton, RippleAnchor } from '@/components/ui/TactileRipple';

export default function MiniSeriesPage() {
  const { content } = useStore();
  const { country, setCountry } = useCountry();
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeStoryFormat, setActiveStoryFormat] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    captureInitialChannel();
    captureReferralFromUrl(content.affiliates, content.referralSettings);
  }, [content.affiliates, content.referralSettings]);

  const offerData = content.commercialOffers?.['promotional-mini-series'] || defaultCommercialOffers['promotional-mini-series'];

  const basePrice = offerData.pricesByCountry?.[country.code] ?? offerData.price ?? 300000;
  const formattedPrice = fmtMoney(basePrice, country);
  const videoQty = offerData.monthlyVideoQuantity || 15;
  const unitPrice = Math.round(basePrice / videoQty);
  const formattedUnitPrice = fmtMoney(unitPrice, country);

  const items = content.portfolio.filter((p) => p.visible).sort((a, b) => a.order - b.order);
  const vslYoutubeId = offerData.hero.vslYoutubeId?.trim() || '';
  const featuredTrailer: PortfolioItem = vslYoutubeId
    ? {
        id: 'mini-series-vsl',
        title: 'AdVibe Cinematic Branded Series',
        client: 'AdVibe Studios',
        category: 'Brand Films',
        youtubeId: vslYoutubeId,
        orientation: 'vertical',
        featured: true,
        visible: true,
        order: 0,
      }
    : (items[0] || {
        id: 'cfm-1',
        title: 'CirclesFundMe Campaign Reel 01',
        client: 'CirclesFundMe',
        category: 'Service Ads',
        youtubeId: 'YSTvgHJ9vRU',
        orientation: 'vertical' as const,
        featured: true,
        visible: true,
        order: 1,
      });

  const storyFormats = [
    {
      id: 'relatable',
      title: 'Relatable Everyday Stories',
      genre: 'Top-of-Funnel Resonance · Universal Emotion',
      subtitle: 'Real human friction points your customers instantly recognise, dramatised with humour, wit, and high cinematic craft.',
      example: 'A customer struggling with chaotic daily routines before discovering an effortless, joyful alternative.',
      youtubeId: items[0]?.youtubeId || 'YSTvgHJ9vRU',
    },
    {
      id: 'comedy',
      title: 'Comedy & Unexpected Plot Twists',
      genre: 'Scroll-Stopping Hook · High Virality',
      subtitle: 'Fast-paced, suspenseful situations that subvert audience expectations and make viewers curious about what happens next.',
      example: 'A high-stakes boardroom confrontation that gets playfully derailed by an unexpected product reveal.',
      youtubeId: items[1]?.youtubeId || 'NuUviJm2DLo',
    },
    {
      id: 'characters',
      title: 'Recurring Original Characters',
      genre: 'Brand Equity Builder · Loyal Following',
      subtitle: 'Familiar, charismatic personalities whose ongoing adventures turn your commercial feed into an anticipated television show.',
      example: 'An eccentric founder or lovable protagonist whose hilarious misadventures feature your brand as their loyal ally.',
      youtubeId: items[2]?.youtubeId || 'XUn7L2s-Bqk',
    },
    {
      id: 'product-led',
      title: 'Product-Led Storytelling',
      genre: 'Seamless Integration · Organic Context',
      subtitle: 'Stories that demonstrate the true relevance and craft of your offering without ever sounding like an invasive sales pitch.',
      example: 'Your product woven into the narrative climax as the natural solution that resolves the story tension.',
      youtubeId: items[3]?.youtubeId || 'QsqKNOo1uDQ',
    },
    {
      id: 'mini-series',
      title: 'Connected Episodic Arcs',
      genre: 'Episodic Retention · Binge-Worthy Series',
      subtitle: 'A multi-part cliffhanger sequence released on schedule that trains your social audience to wait eagerly for the next episode.',
      example: 'A 5-part suspense arc where each episode uncovers another layer of your brand world and leaves audiences debating.',
      youtubeId: items[4]?.youtubeId || 'JecWfFOuUp0',
    },
  ];

  return (
    <div className="min-h-dvh bg-[#fafaf6] text-[#111412] antialiased selection:bg-[#f5a524] selection:text-black">
      {/* =====================================================================
          1. TOP ANNOUNCEMENT TICKER (Editorial Studio Grade)
      ====================================================================== */}
      <div className="bg-[#0b0e12] text-white/90 px-4 py-2 text-center text-xs font-mono tracking-wide border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#f5a524] uppercase tracking-wider text-[11px]">
              <Clapperboard className="h-3 w-3 text-[#f5a524]" />
              <span>STUDIO SERVICE</span>
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/80">
              AI Promotional Mini-Series · <strong className="text-white">{videoQty} Videos Monthly</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#f5a524] font-bold">
              {formattedPrice}/month
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/60 text-[11px]">
              ~{formattedUnitPrice} / video
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. STICKY BRAND HEADER
      ====================================================================== */}
      <header className="sticky top-0 z-40 border-b border-[#111412]/10 bg-[#fafaf6]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#/" className="flex items-center gap-2.5 text-inherit no-underline group">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#111412] text-[#f5a524] shadow-sm transition group-hover:scale-105">
              <Film className="h-4 w-4" />
            </span>
            <div className="flex flex-col text-left">
              <span className="font-display text-base font-extrabold tracking-tight sm:text-lg text-[#111412] leading-tight">
                {content.brand.name}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#a06200] font-bold">
                Promotional Mini-Series
              </span>
            </div>
          </a>

          {/* Quick country switcher & crisp CTA */}
          <div className="flex items-center gap-2.5">
            <select
              value={country.code}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-full border border-[#111412]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#111412] shadow-sm focus:border-[#f5a524] focus:outline-none cursor-pointer"
              aria-label="Select country currency"
            >
              {content.countries.map((c) => (
                <option key={c.code} value={c.code} className="bg-white text-[#111412]">
                  {c.flag} {c.currency}
                </option>
              ))}
            </select>

            <RippleButton
              onClick={() => setStrategyOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#111412] px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#f5a524] hover:text-black"
            >
              <span>Book Strategy Call</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </RippleButton>
          </div>
        </div>
      </header>

      <main>
        {/* =====================================================================
            CHAPTER 1 — HERO: THE ATTENTION PARADOX & CINEMA TRAILER
            Refined with clean split hierarchy, two-tone typography, and 2.39:1 player
        ====================================================================== */}
        <section className="relative bg-[#0b0e12] text-white pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 overflow-hidden">
          {/* Subtle warm golden cinema glow behind player */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(245,165,36,0.16)_0%,transparent_70%)] pointer-events-none blur-3xl" />

          <div className="mx-auto max-w-5xl text-center space-y-7 relative z-10">
            {/* Clean Typographic Film Kicker (Anti-Pill) */}
            <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              <Clapperboard className="h-3.5 w-3.5 text-[#f5a524]" />
              <span>CHAPTER 1</span>
              <span className="text-white/40">·</span>
              <span>THE ATTENTION PARADOX</span>
              <span className="text-white/40">·</span>
              <span>15 EPISODES / MONTH</span>
            </div>

            {/* Dominant Editorial H1 */}
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight text-white leading-[1.05] max-w-4xl mx-auto text-balance">
              YOUR CUSTOMERS ARE TIRED OF YOUR BORING{' '}
              <span className="font-serif italic font-normal text-[#f5a524] lowercase tracking-normal">
                “buy now”
              </span>{' '}
              MESSAGES.
            </h1>


            {/* Watch First Narrative Pivot Banner & Top VSL Player (Hidden until dedicated VSL link is provided) */}
            {vslYoutubeId && (
              <>
                <div className="pt-3 max-w-3xl mx-auto">
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5 backdrop-blur-md shadow-lg text-left sm:text-center space-y-2">
                    <div className="flex items-center justify-start sm:justify-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                      <Play className="h-3 w-3 fill-[#f5a524] text-[#f5a524]" />
                      <span>WATCH THIS FIRST · 2-MINUTE CINEMA TRAILER</span>
                    </div>
                    <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white leading-snug text-balance">
                      Here is how to get their attention:
                      <span className="block font-sans text-sm sm:text-base text-white/80 font-normal mt-1 leading-relaxed">
                        Turn them into brand ambassadors who share your videos, and make them choose you over your competitors with stories that keep them engaged, build a connection, and drive conversions.
                      </span>
                    </h2>
                  </div>
                </div>

                {/* VSL CINEMA LETTERBOX PLAYER CONTAINER */}
                <div className="relative mx-auto mt-6 max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-black shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9),0_0_35px_rgba(245,165,36,0.25)] group">
                  <div className="relative aspect-video sm:aspect-[2.39/1] w-full overflow-hidden flex items-center justify-center">
                    <img
                      src={`https://img.youtube.com/vi/${featuredTrailer.youtubeId}/maxresdefault.jpg`}
                      alt="AI Promotional Mini Series Cinema Trailer"
                      className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${featuredTrailer.youtubeId}/hqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/60" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)]" />

                    {/* 4K Camera Viewfinder HUD Recording Overlay */}
                    <CameraViewfinder
                      active
                      resolution="4K UHD"
                      fps={60}
                      label="ORIGINAL SERIES DIRECTING REEL"
                    />

                    {/* Center Glowing Play Button */}
                    <button
                      onClick={() => setPlayingVideo(featuredTrailer)}
                      className="relative z-10 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#f5a524] text-black shadow-2xl shadow-[#f5a524]/60 transition-transform duration-300 hover:scale-110 active:scale-95 group/btn"
                      aria-label="Play Mini Series Trailer"
                    >
                      <Play className="h-7 w-7 sm:h-9 sm:w-9 translate-x-0.5 fill-black text-black" />
                    </button>

                    {/* Bottom Trailer Metadata */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-left">
                      <div>
                        <p className="font-display text-sm sm:text-base font-bold text-white leading-tight">
                          {featuredTrailer.title}
                        </p>
                        <p className="text-xs text-[#f5a524] font-mono mt-0.5">
                          Tap to experience our episodic film directing reel
                        </p>
                      </div>
                      <span className="rounded-lg bg-black/75 px-3 py-1.5 font-mono text-xs text-white/90 border border-white/15 hover:border-[#f5a524] transition">
                        WATCH TRAILER
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Hero CTAs */}
            <div className="pt-6 flex flex-col items-center gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
                <RippleButton
                  onClick={() => setStrategyOpen(true)}
                  className="flex min-h-[54px] w-full flex-1 items-center justify-center gap-2 rounded-full bg-[#f5a524] px-7 font-display text-sm font-bold uppercase tracking-wider text-black shadow-xl shadow-[#f5a524]/25 transition hover:brightness-110"
                >
                  <span>Book Your Free Strategy Call</span>
                  <ArrowRight className="h-4 w-4" />
                </RippleButton>

                <RippleAnchor
                  href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I read the AI Promotional Mini-Series page and want to chat on WhatsApp.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('Contact')}
                  className="flex min-h-[54px] w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 font-display text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>Chat on WhatsApp</span>
                </RippleAnchor>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-white/50 pt-2">
                <span>{formattedPrice} / month</span>
                <span>·</span>
                <span>15 Custom AI Videos (Up to 2 Mins Each)</span>
                <span>·</span>
                <span>Full Asset Ownership</span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            CHAPTER 2 — EVERYONE IS COMPETING FOR ATTENTION
            Editorial layout with visual comparison matrix
        ====================================================================== */}
        <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto text-left">
          <div className="space-y-8">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#a06200]">
              <span>CHAPTER 2</span>
              <span className="text-[#111412]/30">·</span>
              <span>THE FEED OVERLOAD</span>
            </div>

            <div className="space-y-6 text-base sm:text-lg text-[#2a302b] leading-relaxed">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-[#111412] leading-tight">
                BUT THERE'S A PROBLEM:{' '}
                <span className="font-serif italic font-normal text-[#a06200] lowercase tracking-normal">
                  the feed has gone numb.
                </span>
              </h2>

              {/* The Emphasized Visual Pause / Quotation */}
              <div className="my-8 rounded-3xl border border-[#111412]/10 bg-[#f3f4ef] p-6 sm:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-2 bg-[#f5a524]" />
                <blockquote className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-[#111412] leading-snug">
                  “Everyone is advertising. Everyone wants attention. And customers are becoming increasingly selective about what deserves theirs.”
                </blockquote>
                <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-wider text-[#586159]">
                  — The Modern Digital Audience Dilemma
                </p>
              </div>

              <p>
                Your competitors are posting product pictures, running promotions, announcing discounts, and telling people to buy. You're doing the same thing, hoping that your next post will finally bring the attention and sales your business deserves.
              </p>

              {/* Side-by-Side Reality Check Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
                <div className="rounded-2xl border border-red-200/80 bg-red-50/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-red-700">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span>The Repetitive Ad Trap</span>
                  </div>
                  <ul className="space-y-2 text-sm text-red-950/80">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">✕</span>
                      <span>Constant "Buy Now" demands that feel intrusive</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">✕</span>
                      <span>Sub-second dwell time before the viewer swipes away</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">✕</span>
                      <span>Zero organic shares or conversation generated</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>The Episodic Mini-Series</span>
                  </div>
                  <ul className="space-y-2 text-sm text-emerald-950/80">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Entertaining stories that people actually want to watch</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Builds character familiarity and brand recall over time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Viewers share with friends because it is genuinely fun</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Dynamic Retention Curve SVG Story Visualizer */}
              <RetentionCurveGraph className="my-8" />

              <p>
                In a crowded social media space, simply showing people what you sell isn't always enough. You need to give them a reason to stop scrolling, take an interest in your brand, and remember you when they're ready to buy.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================================
            CHAPTER 3 — THE INFLUENCER ECONOMY
            Clean visual comparison: Rented Audience vs Owned Storytelling
        ====================================================================== */}
        <section className="py-20 px-4 sm:px-6 bg-[#f3f4ef] border-y border-[#111412]/10">
          <div className="max-w-4xl mx-auto text-left space-y-8">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#a06200]">
              <span>CHAPTER 3</span>
              <span className="text-[#111412]/30">·</span>
              <span>THE INFLUENCER EQUATION</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-[#111412] leading-tight">
              WHEN ATTENTION BECOMES THE REAL CURRENCY, BRANDS TURN TO INFLUENCERS.
            </h2>

            <div className="space-y-6 text-base sm:text-lg text-[#2a302b] leading-relaxed">
              <p>You've probably seen it happen.</p>
              <p>
                Brands pay influencers and creators to feature their products in promotional videos, hoping to tap into their audiences, build credibility, and generate sales.
              </p>
              <p>
                And it makes sense. Creator-led content can deliver meaningful commercial results. But accessing that influence can come at a steep and unpredictable price.
              </p>

              {/* Influencer Reality Breakdown */}
              <div className="rounded-3xl border border-[#111412]/10 bg-white p-6 sm:p-8 space-y-4 shadow-sm">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#a06200] block">
                  THE FINANCIAL EQUATION OF RENTED INFLUENCE
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 font-mono text-xs">
                  <div className="rounded-2xl bg-[#fafaf6] p-4 border border-[#111412]/10 space-y-1">
                    <span className="font-bold text-[#111412] text-sm block">High One-Off Costs</span>
                    <span className="text-[#586159]">₦500k – ₦3M+ per single post depending on creator size</span>
                  </div>
                  <div className="rounded-2xl bg-[#fafaf6] p-4 border border-[#111412]/10 space-y-1">
                    <span className="font-bold text-[#111412] text-sm block">Fleeting 24h Lifespan</span>
                    <span className="text-[#586159]">Posts disappear into algorithmic history within days</span>
                  </div>
                  <div className="rounded-2xl bg-[#fafaf6] p-4 border border-[#111412]/10 space-y-1">
                    <span className="font-bold text-[#111412] text-sm block">Restricted Usage Rights</span>
                    <span className="text-[#586159]">Strict licensing fees required to reuse content for ads</span>
                  </div>
                </div>
              </div>

              <p>
                For many businesses, the challenge is clear: how do you consistently create content that captures attention without constantly stretching your marketing budget?
              </p>

              {/* The Pivotal Breakthrough Question */}
              <div className="mt-8 rounded-3xl bg-[#111412] text-white p-6 sm:p-10 shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-[#f5a524]/20 blur-2xl pointer-events-none" />
                <span className="font-mono text-xs uppercase tracking-widest text-[#f5a524] font-bold block mb-3">
                  THE TRANSFORMATIVE QUESTION
                </span>
                <p className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug">
                  What if your brand could become the reason people stop scrolling, instead of always paying someone else to get them to look?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            CHAPTER 4 — THE BREAKTHROUGH: AI-POWERED STORYTELLING
        ====================================================================== */}
        <section className="py-20 px-4 sm:px-6 bg-[#0b0e12] text-white overflow-hidden relative">
          <div className="max-w-4xl mx-auto text-left space-y-8 relative z-10">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              <span>CHAPTER 4</span>
              <span className="text-white/40">·</span>
              <span>THE PRODUCTION SHIFT</span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-white leading-tight">
              INTRODUCING A NEW WAY TO TELL YOUR BRAND'S STORY.
            </h2>

            {/* Two-Tone Subhead */}
            <div className="space-y-3">
              <p className="font-display text-xl sm:text-2xl font-bold text-[#f5a524]">
                The real opportunity isn't simply making videos with artificial intelligence.
              </p>
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                It's using that technology to tell stories people actually want to watch.
              </p>
            </div>

            <div className="space-y-6 text-base sm:text-lg text-white/85 leading-relaxed pt-2">
              <p>
                AI-powered video production is opening up exciting new possibilities for businesses. Brands can now explore imaginative scenes, compelling characters, cinematic visuals, entertaining situations, and story-driven campaigns that would traditionally require massive film crews and Hollywood budgets.
              </p>
              <p>
                Imagine replacing another ordinary product advertisement with a funny, relatable, suspenseful, or emotionally engaging story. A story that draws people in before revealing the message behind it. A story that makes your product part of an experience rather than just another sales pitch.
              </p>

              {/* High-Energy Audio Stem & Voice Frequency Visualizer */}
              <SoundWaveVisualizer
                label="STUDIO AUDIO STEMS &amp; DIALOGUE MASTERING · 48KHZ 24-BIT"
                bars={32}
                height={48}
                className="my-6 border-[#f5a524]/20"
              />

              {/* 3 Pillars of AI Brand Stories */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8 font-sans">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5 space-y-2">
                  <span className="font-mono text-xs font-bold uppercase text-[#f5a524] block">01 · EARNED ATTENTION</span>
                  <p className="text-sm text-white/90">
                    Instead of constantly interrupting people to sell to them, you create something that earns their genuine attention.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5 space-y-2">
                  <span className="font-mono text-xs font-bold uppercase text-[#f5a524] block">02 · BINGEABLE HOOKS</span>
                  <p className="text-sm text-white/90">
                    Instead of every post feeling like another advertisement, you give your audience a reason to come back for the next episode.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5 space-y-2">
                  <span className="font-mono text-xs font-bold uppercase text-[#f5a524] block">03 · ORGANIC ADVOCACY</span>
                  <p className="text-sm text-white/90">
                    When people enjoy what you create, they share it with friends and proudly associate with your brand identity.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-[#f5a524]/40 bg-[#f5a524]/10 text-lg font-bold text-white shadow-lg">
                Your content can become more than a sales tool. It can become part of your brand identity.
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            CHAPTER 5 — TYPES OF STORIES YOUR BRAND CAN TELL
            Studio Production Storyboard Format with Film Tags
        ====================================================================== */}
        <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto text-left">
          <div className="space-y-8">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#a06200]">
              <span>CHAPTER 5</span>
              <span className="text-[#111412]/30">·</span>
              <span>TYPES OF STORIES YOUR BRAND CAN TELL</span>
              <span className="text-[#111412]/30">·</span>
              <span>5 CORE CONCEPTS</span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-[#111412] leading-tight">
              TURN YOUR BRAND INTO A STORY PEOPLE WANT TO FOLLOW.
            </h2>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-3xl border border-[#111412]/10 bg-[#f3f4ef] p-6 sm:p-8">
              <div className="space-y-3 max-w-xl">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#a06200] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#f5a524] animate-pulse" />
                  INTERACTIVE PRODUCTION SLATE &amp; VIEWFINDER
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#111412]">
                  Tap the clapperboard to clap into action
                </h3>
                <p className="text-sm text-[#586159] leading-relaxed">
                  Tap the clapperboard on your phone to trigger the scene snap and cycle through our storytelling formats, or switch to the 4K viewfinder to test optical focus-pulling.
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs font-mono text-[#a06200]">
                  <span className="font-bold">Active Story Concept: 0{activeStoryFormat + 1} — {storyFormats[activeStoryFormat].title}</span>
                </div>
              </div>

              <div className="shrink-0 mx-auto md:mx-0 w-full max-w-[280px] sm:max-w-[340px]">
                <AnimatedStoryGraphic
                  type="combo"
                  scene={`0${activeStoryFormat + 1}`}
                  take="01"
                  roll={`ARC${activeStoryFormat + 1}`}
                  title={storyFormats[activeStoryFormat].title.slice(0, 18).toUpperCase()}
                  resolution="4K UHD"
                  fps={60}
                  focalLength="35mm"
                  aperture="f/1.8"
                  focusDistance="1.8m"
                  interactive
                  autoSnapOnInView
                  onAction={() => {
                    setActiveStoryFormat((prev) => (prev + 1) % storyFormats.length);
                  }}
                  onFocusChange={() => {
                    setActiveStoryFormat((prev) => (prev + 1) % storyFormats.length);
                  }}
                />
              </div>
            </div>

            {/* Storyboard Format Cards with Scroll-Triggered Animated SVG Icons */}
            <div className="space-y-6 pt-4">
              {storyFormats.map((fmt, idx) => (
                <div
                  key={fmt.id}
                  className="group rounded-3xl border border-[#111412]/10 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#111412]/10 pb-5">
                    <div className="flex items-center gap-4">
                      {/* Animated SVG Icon (Sound waves, clapperboards, cinema reels, lens focus, film strip) triggering on scroll into view */}
                      <StoryConceptBadge type={fmt.id} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#a06200]">
                            FORMAT 0{idx + 1}
                          </span>
                          <span className="text-[#111412]/20">·</span>
                          <span className="font-mono text-[11px] font-semibold text-[#586159] uppercase tracking-wider">
                            {fmt.id === 'relatable' && 'Acoustic Sound Waves & Resonance'}
                            {fmt.id === 'comedy' && 'Clapperboard Scene Action'}
                            {fmt.id === 'characters' && 'Spotlight & Cinema Reel'}
                            {fmt.id === 'product-led' && 'Precision Lens Aperture Lock'}
                            {fmt.id === 'mini-series' && 'Episodic Film Strip & Arc'}
                          </span>
                        </div>
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-[#111412] mt-0.5">
                          {fmt.title}
                        </h3>
                      </div>
                    </div>
                    {/* Clean unboxed genre metadata */}
                    <span className="font-mono text-xs font-bold text-[#a06200] tracking-wider uppercase sm:text-right">
                      {fmt.genre}
                    </span>
                  </div>

                  <p className="text-base sm:text-lg text-[#2a302b] leading-relaxed">
                    {fmt.subtitle}
                  </p>

                  <div className="rounded-2xl bg-[#f3f4ef] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="font-mono font-bold uppercase tracking-wider text-[#a06200] block">
                        CONCEPT DEMONSTRATION &amp; LOGLINE
                      </span>
                      <p className="text-[#2a302b] font-medium text-sm">{fmt.example}</p>
                    </div>
                    <button
                      onClick={() => setPlayingVideo(items[idx % items.length] || featuredTrailer)}
                      className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#111412] px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-[#f5a524] hover:text-black transition active:scale-95 shadow-sm"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Watch Concept</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 text-base sm:text-lg text-[#2a302b] leading-relaxed pt-4">
              <p>
                The goal is to create a recognisable content experience around your brand, giving people more reasons to notice you, remember you, and engage with what you offer.
              </p>
              <p>
                And because the stories are developed around your business, your products don't have to compete for attention in somebody else's content. They can become part of the story itself.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SIGNATURE 3D CYLINDRICAL VIDEO WALL (CORE BRAND ASSET PRESERVED)
        ====================================================================== */}
        <section className="py-20 bg-[#0b0e12] text-white border-y border-white/10 overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 text-center mb-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              PRODUCTION PORTFOLIO SHOWCASE
            </span>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold uppercase text-white mt-1">
              Explore Our Visual World
            </h2>
            <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto mt-2">
              Drag horizontally to spin the 3D studio reel · Tap any video to inspect the full-screen master
            </p>
          </div>

          <div className="py-2">
            <Wall items={items} onPlay={(item) => setPlayingVideo(item)} />
          </div>
        </section>

        {/* =====================================================================
            CHAPTER 6 — ORGANIC DISCOVERY AND AUDIENCE ENGAGEMENT
        ====================================================================== */}
        <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto text-left">
          <div className="space-y-8">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#a06200]">
              <span>CHAPTER 6</span>
              <span className="text-[#111412]/30">·</span>
              <span>ORGANIC COMPOUNDING</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-[#111412] leading-tight">
              BUILD YOUR PRESENCE WITHOUT DEPENDING ENTIRELY ON PAID PROMOTIONS.
            </h2>

            <div className="space-y-5 text-base sm:text-lg text-[#2a302b] leading-relaxed">
              <p>
                One of the biggest opportunities social media offers is the ability to publish content and potentially reach people organically, without paying the platform to distribute every video.
              </p>
              <p>
                Compelling, shareable content gives your brand more opportunities to be discovered through recommendations, conversations, reposts, and audience engagement.
              </p>
              <p>
                Of course, no production studio can guarantee that every video will go viral or that organic reach will replace every paid campaign. But investing in creative content gives your business more material to publish, test, learn from, and build upon.
              </p>

              {/* Distinctive Editorial Pull Quote */}
              <div className="my-8 rounded-3xl border border-[#111412]/15 bg-white p-6 sm:p-10 shadow-sm text-center">
                <p className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-[#111412] leading-snug">
                  “Don't just pay for attention. Create content that gives people a reason to give you their attention.”
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            CHAPTER 7 — OWNERSHIP OF CREATIVE ASSETS
        ====================================================================== */}
        <section className="py-20 px-4 sm:px-6 bg-[#f3f4ef] border-y border-[#111412]/10">
          <div className="max-w-4xl mx-auto text-left space-y-8">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#a06200]">
              <span>CHAPTER 7</span>
              <span className="text-[#111412]/30">·</span>
              <span>PERMANENT BRAND ASSETS</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-[#111412] leading-tight">
              AND THE BEST PART? YOU OWN YOUR BRAND'S CREATIVE ASSETS.
            </h2>

            <div className="space-y-6 text-base sm:text-lg text-[#2a302b] leading-relaxed">
              <p>
                We believe the content created for your brand should help you build lasting equity.
              </p>
              <p>
                Under our agreed ownership terms, you receive ownership of the commissioned deliverables and project-specific assets covered by your agreement, including finished videos, screenplays, and agreed creative materials.
              </p>

              {/* Asset Library Visualization Box */}
              <div className="rounded-3xl border border-[#111412]/10 bg-white p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <FolderCheck className="h-6 w-6 text-[#a06200]" />
                  <h3 className="font-display text-lg font-bold text-[#111412]">
                    Your Branded Marketing Asset Library
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="rounded-2xl border border-[#111412]/10 bg-[#fafaf6] p-4 space-y-1">
                    <span className="font-bold text-[#111412] block">15 Master Videos (Up to 2m Each)</span>
                    <span className="text-[#586159]">Rendered in native 4K UHD with clean audio stems</span>
                  </div>
                  <div className="rounded-2xl border border-[#111412]/10 bg-[#fafaf6] p-4 space-y-1">
                    <span className="font-bold text-[#111412] block">Original Screenplays</span>
                    <span className="text-[#586159]">Complete narrative scripts &amp; hook variations</span>
                  </div>
                  <div className="rounded-2xl border border-[#111412]/10 bg-[#fafaf6] p-4 space-y-1">
                    <span className="font-bold text-[#111412] block">World Bible</span>
                    <span className="text-[#586159]">Character personas and ongoing storyline continuity</span>
                  </div>
                </div>
              </div>

              <p className="text-sm font-mono text-[#586159]">
                Ownership remains subject to the agreement and any applicable third-party licensing restrictions.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================================
            CHAPTER 8 — THE MASTER PRODUCTION AGREEMENT & OFFER
        ====================================================================== */}
        <section className="py-20 px-4 sm:px-6 bg-[#0b0e12] text-white">
          <div className="max-w-4xl mx-auto text-left space-y-8">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              <span>CHAPTER 8</span>
              <span className="text-white/40">·</span>
              <span>THE PRODUCTION AGREEMENT</span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
              AN ENTIRE CREATIVE TEAM. FOR THE COST OF ONE PERSON'S MONTHLY SALARY.
            </h2>

            <div className="space-y-5 text-base sm:text-lg text-white/85 leading-relaxed">
              <p>
                Building an in-house media department can mean recruiting creative talent, managing production, coordinating editing, and investing in tools and compute resources to keep content flowing.
              </p>
              <p>
                For <strong className="text-[#f5a524]">{formattedPrice} per month</strong>, our AI Promotional Mini-Series package gives you access to a dedicated creative production service delivering 15 videos every month.
              </p>
            </div>

            {/* THE MASTER DELIVERABLES CARD */}
            <div className="rounded-3xl border border-[#f5a524]/40 bg-gradient-to-br from-[#14181f] to-[#0c0e12] p-8 sm:p-12 shadow-2xl space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                    OFFICIAL MONTHLY DELIVERABLES
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
                    YOUR MONTHLY PACKAGE INCLUDES:
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <div className="font-display text-4xl sm:text-5xl font-extrabold text-[#f5a524]">
                    {formattedPrice}
                  </div>
                  <span className="font-mono text-xs text-white/60">
                    per month · ~{formattedUnitPrice} / video
                  </span>
                </div>
              </div>

              {/* Exact Inclusions Checklist */}
              <ul className="space-y-4 text-sm sm:text-base text-white/90">
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f5a524] text-black mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>15 AI-powered videos per month (up to 2 minutes maximum duration per episode).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f5a524] text-black mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>Original story concepts developed around your brand.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f5a524] text-black mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>Creative ideation and scripting.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f5a524] text-black mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>AI-assisted video production and professional editing.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f5a524] text-black mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>A script and concise creative brief for your review before production.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f5a524] text-black mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>One consolidated revision round per video, with corrections to our own production errors handled separately.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f5a524] text-black mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>Ownership of the commissioned deliverables and project-specific assets covered by your agreement.</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <p className="font-display text-lg sm:text-xl font-bold text-white">
                  All for {formattedPrice} per month.
                </p>
                <p className="font-mono text-xs sm:text-sm text-[#f5a524]">
                  That's a complete monthly content-production service for approximately {formattedUnitPrice} per video.
                </p>
              </div>

              {/* Direct CTAs inside offer */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <RippleButton
                  onClick={() => setStrategyOpen(true)}
                  className="flex min-h-[54px] w-full flex-1 items-center justify-center gap-2 rounded-full bg-[#f5a524] px-8 font-display text-sm font-bold uppercase tracking-wider text-black shadow-xl shadow-[#f5a524]/25 transition hover:brightness-110"
                >
                  <span>Book Your Free Strategy Call</span>
                  <ArrowRight className="h-4 w-4" />
                </RippleButton>
                <RippleAnchor
                  href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I want to start the AI Promotional Mini Series package for ${formattedPrice}/mo.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('Contact')}
                  className="flex min-h-[54px] w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 font-display text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>Chat on WhatsApp</span>
                </RippleAnchor>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            CHAPTER 9 — FINAL INVITATION
        ====================================================================== */}
        <section className="py-24 px-4 sm:px-6 bg-[#fafaf6] text-[#111412] text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#a06200]">
              <span>CHAPTER 9</span>
              <span className="text-[#111412]/30">·</span>
              <span>THE INVITATION</span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-[#111412] leading-[1.08]">
              YOUR BRAND HAS MORE STORIES TO TELL.{' '}
              <span className="font-serif italic font-normal text-[#a06200] lowercase tracking-normal">
                let's bring them to life.
              </span>
            </h2>

            <div className="space-y-5 text-base sm:text-lg text-[#2a302b] leading-relaxed max-w-2xl mx-auto">
              <p>
                Your customers don't need another business constantly telling them to buy. Give them something interesting to watch. Give them characters they can recognise, situations they can relate to, and stories that make them curious about your brand.
              </p>
              <p>
                Let your content do more than announce your products. Let it introduce your brand's personality, create memorable experiences, and give your audience more reasons to engage with you.
              </p>
              <p className="font-display text-xl sm:text-2xl font-bold text-[#111412] pt-2">
                Let's create the kind of content that makes people stop scrolling.
              </p>
            </div>

            {/* Closing Dual CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <RippleButton
                onClick={() => setStrategyOpen(true)}
                className="flex min-h-[54px] w-full flex-1 items-center justify-center gap-2 rounded-full bg-[#111412] px-8 font-display text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-black/20 transition hover:bg-[#f5a524] hover:text-black"
              >
                <span>BOOK YOUR FREE STRATEGY CALL</span>
                <ArrowRight className="h-4 w-4" />
              </RippleButton>

              <RippleAnchor
                href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I read the complete Mini-Series story and want to chat on WhatsApp.`)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('Contact')}
                className="flex min-h-[54px] w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-[#111412]/20 bg-white px-6 font-display text-sm font-bold uppercase tracking-wider text-[#111412] shadow-sm transition hover:bg-black/5"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>CHAT ON WHATSAPP</span>
              </RippleAnchor>
            </div>
          </div>
        </section>

        {/* CIRCLESFUNDME PROOF FOOTNOTE */}
        <section className="px-4 py-8 max-w-4xl mx-auto border-t border-[#111412]/10 mb-12">
          <div className="rounded-2xl border border-[#111412]/10 bg-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#111412] text-white font-extrabold text-sm font-display">
                CFM
              </div>
              <div>
                <p className="font-display text-sm font-bold text-[#111412]">
                  See Our Video Work for CirclesFundMe
                </p>
                <p className="text-xs text-[#586159]">
                  Episodic storytelling produced for a high-growth fintech platform.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPreviewOpen(true)}
              className="w-full sm:w-auto shrink-0 rounded-full bg-[#f3f4ef] px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-[#111412] hover:bg-[#111412] hover:text-white transition"
            >
              Watch Case Reel
            </button>
          </div>
        </section>
      </main>

      {/* =====================================================================
          MOBILE STICKY BOTTOM BAR
      ====================================================================== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#111412]/10 bg-[#fafaf6]/95 px-4 py-3 backdrop-blur-md sm:hidden flex items-center justify-between gap-3 shadow-lg">
        <RippleButton
          onClick={() => setStrategyOpen(true)}
          className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full bg-[#111412] font-display text-xs font-bold uppercase tracking-wider text-white shadow-md"
        >
          <span>Book Strategy Call</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </RippleButton>

        <RippleAnchor
          href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I want to ask about the AI Promotional Mini Series.`)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('Contact')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#111412]/15 bg-white text-emerald-600 shadow-sm"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </RippleAnchor>
      </div>

      {/* MODALS */}
      {strategyOpen && (
        <StrategyModal
          onClose={() => setStrategyOpen(false)}
          offerId="promotional-mini-series"
          offerTitle={offerData.name}
          configuredPrice={basePrice}
          configuredQty={videoQty}
          bookingUrl={offerData.bookingUrlOverride || content.settings.bookingUrl}
        />
      )}

      {previewOpen && (
        <CirclesFundMePreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {playingVideo && (
        <Lightbox
          item={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />
      )}

      <LivePopups paused={strategyOpen || previewOpen || Boolean(playingVideo)} />
    </div>
  );
}
