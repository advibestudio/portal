import { useState } from 'react';
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
import {
  Film, Sparkles, ArrowRight, MessageCircle, CheckCircle2, ShieldCheck,
  ChevronDown, Clapperboard, Layers, Play, Video, Eye, Tv, Award,
  Check, FileText, Clock
} from 'lucide-react';

export default function MiniSeriesPage() {
  const { content } = useStore();
  const { country, setCountry } = useCountry();
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [activeEpisode, setActiveEpisode] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<PortfolioItem | null>(null);

  const offerData = content.commercialOffers?.['promotional-mini-series'] || defaultCommercialOffers['promotional-mini-series'];

  const basePrice = offerData.pricesByCountry?.[country.code] ?? offerData.price ?? 200000;
  const formattedPrice = fmtMoney(basePrice, country);
  const videoQty = offerData.monthlyVideoQuantity || 15;

  const items = content.portfolio.filter((p) => p.visible).sort((a, b) => a.order - b.order);
  const featuredTrailer = items[0] || {
    id: 'trailer',
    title: 'AdVibe Cinematic Branded Series',
    client: 'AdVibe Studios',
    category: 'Brand Film',
    youtubeId: 'dQw4w9WgXcQ',
    orientation: 'horizontal' as const,
    featured: true,
    visible: true,
    order: 1,
  };

  const episodes = [
    {
      num: 'EP 01',
      title: 'The Uncomfortable Tension',
      tagline: 'Hooking the audience with familiar cultural frustration',
      summary: 'Introduces your relatable main character facing the exact problem your target customer struggles with. Zero overt selling—pure emotional resonance that sparks conversation and shares.',
      focus: 'Top-of-funnel reach & virality',
    },
    {
      num: 'EP 02',
      title: 'The Turning Point',
      tagline: 'Your brand naturally enters the story-world',
      summary: 'The protagonist encounters the solution without a clunky sales pitch. The brand product/service is integrated as an organic catalyst in their daily life.',
      focus: 'Consideration & authority building',
    },
    {
      num: 'EP 03',
      title: 'The Satisfying Payoff',
      tagline: 'Closing the narrative loop with undeniable proof',
      summary: 'The transformation is realized. The storyline reaches an engaging climax, driving comments, saves, and immediate direct orders with a compelling closing frame.',
      focus: 'High-converting direct response',
    },
  ];

  return (
    <div className="min-h-dvh bg-[#090b0e] text-[#f4f2ec] antialiased selection:bg-[#f5a524] selection:text-black">
      {/* 1. TOP ANNOUNCEMENT TICKER */}
      <div className="bg-[#05070a] text-white/90 px-4 py-2 text-center text-xs font-mono tracking-wide border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded bg-[#f5a524] px-1.5 py-0.5 text-[10px] font-bold text-black uppercase">
            VSL SHOWCASE
          </span>
          <span className="text-white/80">
            {offerData.hero.eyebrow} · <strong>{videoQty} Videos Monthly</strong>
          </span>
          <span className="text-[#f5a524] font-bold">
            {formattedPrice}/mo
          </span>
        </div>
      </div>

      {/* 2. HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090b0e]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#/" className="flex items-center gap-2.5 text-inherit no-underline">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5a524] text-black shadow-sm">
              <Film className="h-4 w-4" />
            </span>
            <div className="flex flex-col text-left">
              <span className="font-display text-base font-extrabold tracking-tight sm:text-lg text-white leading-tight">
                {content.brand.name}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#f5a524]">
                Promotional Mini Series
              </span>
            </div>
          </a>

          {/* Quick country switcher & crisp CTA */}
          <div className="flex items-center gap-2.5">
            <select
              value={country.code}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs font-semibold text-white shadow-sm focus:border-[#f5a524] focus:outline-none"
              aria-label="Select country currency"
            >
              {content.countries.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#121518] text-white">
                  {c.flag} {c.currency}
                </option>
              ))}
            </select>

            <button
              onClick={() => setStrategyOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#f5a524] px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-black shadow transition hover:brightness-110 active:scale-95"
            >
              <span>Book Strategy</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-28">
        {/* 3. VSL HERO SECTION — CINEMATIC PLAYER FIRST */}
        <section className="relative px-4 pt-8 pb-12 sm:px-6 sm:pt-14 sm:pb-16 overflow-hidden text-center">
          <div className="mx-auto max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f5a524]/40 bg-[#f5a524]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
              <Clapperboard className="h-3.5 w-3.5 text-[#f5a524]" />
              <span>{offerData.hero.eyebrow}</span>
            </div>

            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl leading-[1.12] text-balance">
              {offerData.hero.headline}
            </h1>

            <p className="mx-auto max-w-2xl text-sm text-white/75 sm:text-base leading-relaxed">
              {offerData.tagline || 'Create connected, episodic branded video content with recurring characters that audiences look forward to watching.'}
            </p>

            {/* VSL CINEMA LETTERBOX PLAYER CONTAINER (2.39:1) */}
            <div className="relative mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-black shadow-2xl shadow-black/80 group">
              <div className="relative aspect-video sm:aspect-[2.39/1] w-full overflow-hidden flex items-center justify-center">
                {/* Cinema poster background with anamorphic glow */}
                <img
                  src={`https://img.youtube.com/vi/${featuredTrailer.youtubeId}/maxresdefault.jpg`}
                  alt="AI Promotional Mini Series Trailer"
                  className="absolute inset-0 h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to hqdefault if maxres not available
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${featuredTrailer.youtubeId}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/60" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />

                {/* Top Cinema Status Indicator */}
                <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-white/80">
                  <span className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 border border-white/15">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span>ORIGINAL SERIES CONCEPT</span>
                  </span>
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 border border-white/15">
                    15 VIDEOS / MO · 4K UHD
                  </span>
                </div>

                {/* Big Center Glowing Play Button */}
                <button
                  onClick={() => setPlayingVideo(featuredTrailer)}
                  className="relative z-10 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#f5a524] text-black shadow-2xl shadow-[#f5a524]/60 transition-transform duration-300 hover:scale-110 active:scale-95 group/btn"
                  aria-label="Play Mini Series Trailer"
                >
                  <Play className="h-7 w-7 sm:h-9 sm:w-9 translate-x-0.5 fill-black text-black" />
                </button>

                {/* Bottom Trailer Metadata */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-left">
                  <div>
                    <p className="font-display text-sm sm:text-base font-bold text-white leading-tight">
                      {featuredTrailer.title}
                    </p>
                    <p className="text-[11px] text-[#f5a524] font-mono">
                      Tap to watch full production reel
                    </p>
                  </div>
                  <span className="rounded-lg bg-black/70 px-2 py-1 font-mono text-xs text-white/70 border border-white/15">
                    3:45
                  </span>
                </div>
              </div>
            </div>

            {/* PUNCHY CTA STRIP BELOW VSL PLAYER */}
            <div className="pt-4 flex flex-col items-center gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
                <button
                  onClick={() => setStrategyOpen(true)}
                  className="flex min-h-[50px] w-full flex-1 items-center justify-center gap-2 rounded-xl bg-[#f5a524] px-6 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-black shadow-xl shadow-[#f5a524]/20 transition hover:brightness-110 active:scale-95"
                >
                  <span>Book Free Strategy Call</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <a
                  href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I watched the mini-series preview and want to discuss creating an episodic series for my brand.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('Contact')}
                  className="flex min-h-[50px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-white/10 active:scale-95"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-white/50 pt-1">
                <span>{formattedPrice} / month</span>
                <span>·</span>
                <span>{videoQty} Videos</span>
                <span>·</span>
                <span>Full Commercial Rights</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. INTERACTIVE EPISODE ARCHITECTURE STRIP */}
        <section className="px-4 py-8 max-w-4xl mx-auto text-left">
          <div className="rounded-3xl border border-white/15 bg-[#10141a] p-5 sm:p-7 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                  EPISODIC STORY ARC
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  How We Structure Your 15 Monthly Videos
                </h3>
              </div>
              <span className="text-xs text-white/50 font-mono">Tap an episode to view focus</span>
            </div>

            {/* Episode Chips Selector */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {episodes.map((ep, idx) => (
                <button
                  key={ep.num}
                  onClick={() => setActiveEpisode(idx)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    activeEpisode === idx
                      ? 'border-[#f5a524] bg-[#f5a524]/15 shadow-md shadow-[#f5a524]/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className={`block font-mono text-xs font-bold ${activeEpisode === idx ? 'text-[#f5a524]' : 'text-white/50'}`}>
                    {ep.num}
                  </span>
                  <span className="block font-display text-xs sm:text-sm font-bold text-white truncate mt-1">
                    {ep.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Episode Highlight Card */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start justify-between">
              <div className="space-y-1.5 flex-1">
                <span className="inline-block rounded-full bg-[#f5a524]/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#f5a524] uppercase">
                  {episodes[activeEpisode].focus}
                </span>
                <h4 className="font-display text-base sm:text-lg font-bold text-white">
                  {episodes[activeEpisode].tagline}
                </h4>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  {episodes[activeEpisode].summary}
                </p>
              </div>

              <button
                onClick={() => setStrategyOpen(true)}
                className="shrink-0 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-[#f5a524] hover:text-black transition"
              >
                Plan this arc →
              </button>
            </div>
          </div>
        </section>

        {/* 5. DECLUTTERED: WHY MINI-SERIES OUTPERFORMS STANDARD ADS */}
        <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto text-left">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              THE COMPETITIVE EDGE
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl text-white">
              Why Audiences Binge Stories Instead of Skipping Ads
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#12161f] p-5 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5a524]/20 text-[#f5a524]">
                <Tv className="h-4 w-4" />
              </div>
              <h3 className="font-display text-base font-bold text-white">Episodic Hook</h3>
              <p className="text-xs text-white/65 leading-relaxed">
                When content has continuity, viewers watch till the end and comment asking for the next episode rather than hitting "Skip Ad".
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#12161f] p-5 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5a524]/20 text-[#f5a524]">
                <Award className="h-4 w-4" />
              </div>
              <h3 className="font-display text-base font-bold text-white">Character Familiarity</h3>
              <p className="text-xs text-white/65 leading-relaxed">
                Recurring protagonists and consistent worlds build recognizable brand equity 3x faster than disconnected one-off promotional graphics.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#12161f] p-5 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5a524]/20 text-[#f5a524]">
                <Clapperboard className="h-4 w-4" />
              </div>
              <h3 className="font-display text-base font-bold text-white">Zero Crew Overhead</h3>
              <p className="text-xs text-white/65 leading-relaxed">
                High-end film environments and cinematic lighting direction without booking sound stages, paying actor day-rates, or renting anamorphic lenses.
              </p>
            </div>
          </div>
        </section>

        {/* 6. SIGNATURE 3D CYLINDER VIDEO WALL */}
        <section className="relative py-8 overflow-hidden bg-black text-white border-y border-white/10">
          <div className="mx-auto max-w-5xl px-4 text-center mb-5">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              PRODUCTION SHOWCASE
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl mt-1 text-white">
              Explore Our Visual World
            </h2>
            <p className="text-xs text-white/50 max-w-md mx-auto mt-1">
              Drag to spin · Tap any video to play in full screen
            </p>
          </div>

          <div className="relative py-2">
            <Wall items={items} onPlay={(item) => setPlayingVideo(item)} />
          </div>
        </section>

        {/* 7. ONE-PAGE CREATIVE BRIEF CHECKPOINT (DECLUTTERED) */}
        <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto text-left">
          <div className="rounded-3xl border border-white/15 bg-[#12161f] p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                QUALITY ASSURANCE CHECKPOINT
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                1 Revision Round Included
              </span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
              The 1-Page Creative Brief Before Any Video Is Rendered
            </h3>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              We never produce blindly. Every episode begins with a clear 1-page alignment brief detailing the character persona, story hook, visual atmosphere, and direct-response call to action for your approval.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <span className="text-white/50 block text-[10px]">STEP 1</span>
                <span className="font-bold text-white">Concept Alignment</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <span className="text-white/50 block text-[10px]">STEP 2</span>
                <span className="font-bold text-white">Script &amp; Characters</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <span className="text-white/50 block text-[10px]">STEP 3</span>
                <span className="font-bold text-white">AI Cinematography</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <span className="text-white/50 block text-[10px]">STEP 4</span>
                <span className="font-bold text-[#f5a524]">Final Master &amp; Ads</span>
              </div>
            </div>
          </div>
        </section>

        {/* 8. CIRCLESFUNDME PROOF BANNER */}
        <section className="px-4 py-6 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-black font-extrabold text-sm font-display">
                CFM
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white">
                  See Our Video Work for CirclesFundMe
                </p>
                <p className="text-xs text-white/60">
                  Episodic storytelling produced for a high-growth fintech platform.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPreviewOpen(true)}
              className="w-full sm:w-auto shrink-0 rounded-xl bg-white/10 px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition"
            >
              Watch Case Reel
            </button>
          </div>
        </section>

        {/* 9. FAQ ACCORDION (STREAMLINED) */}
        <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto text-left">
          <div className="text-center mb-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              CLEAR ANSWERS
            </span>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-2.5">
            {offerData.faqs.slice(0, 4).map((f) => {
              const isOpen = openFaq === f.id;
              return (
                <div
                  key={f.id}
                  className="rounded-2xl border border-white/10 bg-[#10141a] transition-all overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : f.id)}
                    className="flex w-full items-center justify-between p-4 text-left font-display text-sm font-bold text-white"
                  >
                    <span>{f.q}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#f5a524]' : 'text-white/40'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-white/70 leading-relaxed border-t border-white/5">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 10. FINAL BOTTOM CTA BANNER (CRISP & PUNCHY) */}
        <section className="px-4 py-12 max-w-4xl mx-auto text-center">
          <div className="rounded-3xl border border-[#f5a524]/30 bg-gradient-to-br from-[#181d24] to-[#0c0e12] p-8 sm:p-12 shadow-2xl space-y-5">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              READY TO BUILD YOUR STORY-WORLD?
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white">
              Let's Discuss Your Brand's Mini-Series
            </h2>
            <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto leading-relaxed">
              Book a free strategy session. We'll explore characters, episode hooks, and how 15 monthly videos will drive sales for your business.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() => setStrategyOpen(true)}
                className="flex min-h-[50px] w-full flex-1 items-center justify-center gap-2 rounded-xl bg-[#f5a524] px-6 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-black shadow-lg shadow-[#f5a524]/20 transition hover:brightness-110 active:scale-95"
              >
                <span>Book Free Strategy Call</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I'd like to book a strategy session for an AI Promotional Mini Series.`)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('Contact')}
                className="flex min-h-[50px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-white/10 active:scale-95"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 11. MOBILE STICKY BOTTOM BAR (CRISP TOUCH TARGETS) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#090b0e]/95 px-4 py-3 backdrop-blur-md sm:hidden flex items-center justify-between gap-3">
        <button
          onClick={() => setStrategyOpen(true)}
          className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#f5a524] font-display text-xs font-bold uppercase tracking-wider text-black shadow-md shadow-[#f5a524]/20 active:scale-95"
        >
          <span>Book Strategy Call</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        <a
          href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I want to ask about the AI Promotional Mini Series.`)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('Contact')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/5 text-emerald-400 active:scale-95"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
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
