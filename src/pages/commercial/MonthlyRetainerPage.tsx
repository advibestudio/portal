import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { fmtMoney, waLink, waNumberFor } from '@/lib/money';
import { track } from '@/lib/tracking';
import { Wall } from '@/components/Wall';
import { StrategyModal } from '@/components/StrategyModal';
import { CirclesFundMePreviewModal } from '@/components/CirclesFundMePreviewModal';
import LivePopups from '@/components/LivePopups';
import { defaultCommercialOffers } from '@/content/commercialOffers';
import {
  Sparkles, ArrowRight, MessageCircle, CheckCircle2, ShieldCheck,
  ChevronDown, Video, FileText, Layers, Clock, Users, DollarSign,
  AlertCircle, Briefcase, Play, Calendar, ExternalLink
} from 'lucide-react';

export default function MonthlyRetainerPage() {
  const { content } = useStore();
  const { country, setCountry } = useCountry();
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const offerData = content.commercialOffers?.['monthly-content'] || defaultCommercialOffers['monthly-content'];

  // Currency aware price
  const basePrice = offerData.pricesByCountry?.[country.code] ?? offerData.price ?? 200000;
  const formattedPrice = fmtMoney(basePrice, country);
  const videoQty = offerData.monthlyVideoQuantity || 15;

  const items = content.portfolio.filter((p) => p.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-dvh bg-[#faf9f4] text-[#111412] antialiased selection:bg-[#f5a524] selection:text-black">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#111412] text-white px-4 py-2.5 text-center text-xs font-mono tracking-wide border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded bg-[#f5a524] px-1.5 py-0.5 text-[10px] font-bold text-black uppercase">
            On-Demand Studio
          </span>
          <span className="text-white/80">
            {offerData.hero.eyebrow} · <strong>{videoQty} Videos Every Month</strong>
          </span>
          <span className="text-[#f5a524] font-bold">
            {formattedPrice}/mo
          </span>
        </div>
      </div>

      {/* 2. NAVIGATION BAR */}
      <header className="sticky top-0 z-30 border-b border-[#111412]/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <a href="#/" className="flex items-center gap-2.5 text-inherit no-underline">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#111412] text-white shadow-sm">
              <i style={{ width: 0, height: 0, borderLeft: '9px solid #f5a524', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', marginLeft: '2px' }} />
            </span>
            <div className="flex flex-col text-left">
              <span className="font-display text-base font-extrabold tracking-tight sm:text-lg leading-tight">
                {content.brand.name}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#111412]/50">
                Monthly Content Retainer
              </span>
            </div>
          </a>

          {/* Quick country switcher & CTA */}
          <div className="flex items-center gap-3">
            <select
              value={country.code}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-lg border border-[#111412]/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#111412] shadow-sm focus:border-[#f5a524] focus:outline-none"
              aria-label="Select country currency"
            >
              {content.countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.currency}
                </option>
              ))}
            </select>

            <button
              onClick={() => setStrategyOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#111412] px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-[#f5a524] hover:text-black"
            >
              <span>{offerData.hero.primaryCta}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-28">
        {/* 3. HERO SECTION */}
        <section className="relative px-4 pt-12 pb-14 sm:px-6 sm:pt-20 sm:pb-20 overflow-hidden text-center">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f5a524]/50 bg-[#f5a524]/10 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#9e6203]">
              <Sparkles className="h-3.5 w-3.5 text-[#b87508]" />
              {offerData.hero.eyebrow}
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#111412] sm:text-5xl md:text-6xl leading-[1.08] text-balance">
              {offerData.hero.headline}
            </h1>

            <p className="mx-auto max-w-2xl text-base text-[#111412]/70 sm:text-xl leading-relaxed whitespace-pre-line">
              {offerData.hero.subheadline}
            </p>

            {/* Offer Key Facts Box */}
            <div className="mx-auto max-w-md rounded-2xl border border-[#111412]/10 bg-white p-4 shadow-xl shadow-black/5 flex items-center justify-between gap-3 text-left">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#111412]/50">Managed Monthly Retainer</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-[#111412] sm:text-3xl">
                    {formattedPrice}
                  </span>
                  <span className="text-xs text-[#111412]/50 font-mono">/ month</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-800">
                  {videoQty} Videos / Mo
                </span>
                <p className="mt-0.5 text-[10px] text-[#111412]/45">One Studio Behind Your Brand</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col items-center gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
                <button
                  onClick={() => setStrategyOpen(true)}
                  className="flex min-h-[50px] w-full flex-1 items-center justify-center gap-2 rounded-xl bg-[#111412] px-6 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-black/10 transition hover:bg-[#f5a524] hover:text-black active:scale-95"
                >
                  <span>Book Strategy Call</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <a
                  href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I am interested in the Monthly Video Content Retainer for my business.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('Contact')}
                  className="flex min-h-[50px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#111412]/20 bg-white px-5 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111412] shadow-sm transition hover:bg-[#111412] hover:text-white active:scale-95"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <p className="text-xs text-[#111412]/50 font-mono max-w-md mt-1">
                {offerData.hero.contextNote}
              </p>
            </div>
          </div>
        </section>

        {/* 4. PRESERVED SIGNATURE 3D CYLINDER VIDEO WALL */}
        <section className="relative -mt-2 py-8 overflow-hidden bg-[#071018] text-white">
          <div className="mx-auto max-w-5xl px-4 text-center mb-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              COMMERCIAL PORTFOLIO
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl mt-1 text-white">
              Ads Directed and Produced by AdVibe Studios
            </h2>
            <p className="text-xs text-white/50 max-w-lg mx-auto mt-1">
              Drag, swipe, or use keyboard arrows to rotate the 3D cylinder. Tap any video to inspect.
            </p>
          </div>

          <div className="relative py-4">
            <Wall items={items} onPlay={() => {}} />
          </div>
        </section>

        {/* 5. PROBLEM — THE CONTENT CONSISTENCY TRAP */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-left">
          <div className="rounded-3xl border border-[#111412]/10 bg-white p-7 sm:p-12 shadow-sm space-y-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
              THE BOTTLENECK
            </span>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412] leading-tight">
              {offerData.problem.heading}
            </h2>

            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#111412]/75">
              {offerData.problem.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {offerData.problem.highlight && (
              <div className="rounded-2xl border-l-4 border-[#f5a524] bg-[#faf9f4] p-5 font-display text-base font-bold text-[#111412]">
                {offerData.problem.highlight}
              </div>
            )}
          </div>
        </section>

        {/* 6. AMPLIFY — THE COST OF INCONSISTENCY */}
        <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto text-left">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.03] p-7 sm:p-10 space-y-5">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-red-600">
              THE COMMERCIAL REALITY
            </span>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl text-[#111412] leading-tight">
              {offerData.amplify.heading}
            </h2>

            <div className="space-y-3.5 text-sm sm:text-base leading-relaxed text-[#111412]/75">
              {offerData.amplify.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {offerData.amplify.callout && (
              <p className="font-bold text-[#111412] pt-2 text-sm sm:text-base">
                {offerData.amplify.callout}
              </p>
            )}
          </div>
        </section>

        {/* 7. SOLUTION — AN ENTIRE STUDIO, NOT ONE OVERLOADED HIRE */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
              THE MANAGED ADVANTAGE
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
              {offerData.solution.heading}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#111412]/75 text-left">
              {offerData.solution.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="rounded-3xl border border-[#111412]/15 bg-white p-7 shadow-xl shadow-black/5 space-y-4 text-left">
              <h3 className="font-display text-lg font-bold text-[#111412]">
                What You Get Working With AdVibe Studios:
              </h3>
              <div className="space-y-3 text-xs sm:text-sm text-[#111412]/80">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#f5a524] shrink-0 mt-0.5" />
                  <span><strong>Creative Strategy & Ideation:</strong> Fresh concept angles planned monthly.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#f5a524] shrink-0 mt-0.5" />
                  <span><strong>Scriptwriting & Messaging:</strong> Direct-response hooks that arrest the scroll.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#f5a524] shrink-0 mt-0.5" />
                  <span><strong>AI Video Directing:</strong> Photorealistic scenes without cameras or studio booking.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#f5a524] shrink-0 mt-0.5" />
                  <span><strong>Post-Production & Editing:</strong> Multi-track sound, motion graphics, and captions.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#f5a524] shrink-0 mt-0.5" />
                  <span><strong>Checkpointed Approval:</strong> You approve the script & 1-page brief before production.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. VALUE COMPARISON — STUDIO VS ONE HIRE */}
        {offerData.valueComparison && (
          <section className="py-16 bg-[#121416] text-white px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-left space-y-6">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                  STUDIO VERSUS OVERLOADED EMPLOYEE
                </span>
                <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
                  {offerData.valueComparison.heading}
                </h2>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-white/75 leading-relaxed">
                {offerData.valueComparison.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 mt-6">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                  Your Monthly Package Includes:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  {offerData.valueComparison.includedList.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-white/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-white/90 pt-2 text-center">
                {offerData.valueComparison.conclusion}
              </p>
            </div>
          </section>
        )}

        {/* 9. WHAT WE CAN CREATE */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
              CONTENT VARIETY
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
              {offerData.whatWeCreate.heading}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#111412]/65">
              {offerData.whatWeCreate.intro}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
            {offerData.whatWeCreate.categories.map((cat, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#111412]/10 bg-white p-6 shadow-sm hover:border-[#f5a524]/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf9f4] text-[#b87508] mb-4 border border-[#111412]/5 font-mono font-bold text-xs">
                  0{i + 1}
                </div>
                <h3 className="font-display text-base font-bold text-[#111412]">{cat.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#111412]/65">{cat.desc}</p>
              </div>
            ))}
          </div>

          {offerData.whatWeCreate.conclusion && (
            <p className="mt-8 text-xs sm:text-sm text-[#111412]/60 text-center max-w-xl mx-auto">
              {offerData.whatWeCreate.conclusion}
            </p>
          )}
        </section>

        {/* 10. THE PROCESS & 1-PAGE CREATIVE BRIEF MOCKUP CHECKPOINT */}
        <section className="py-16 bg-[#faf9f4] border-y border-[#111412]/10 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
                STEP-BY-STEP WORKFLOW
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
                {offerData.process.heading}
              </h2>
              {offerData.process.intro && (
                <p className="mt-2 text-xs sm:text-sm text-[#111412]/65">
                  {offerData.process.intro}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Process Steps */}
              <div className="space-y-4 text-left">
                {offerData.process.steps.map((st) => (
                  <div
                    key={st.step}
                    className="rounded-2xl border border-[#111412]/10 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="grid h-6 w-6 place-items-center rounded bg-[#111412] text-white font-mono text-xs font-bold">
                        {st.step}
                      </span>
                      <h3 className="font-display text-sm font-bold text-[#111412]">
                        {st.title}
                      </h3>
                    </div>
                    <p className="text-xs leading-relaxed text-[#111412]/70 pl-8">
                      {st.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Illustrative One-Page Creative Brief Sample Card */}
              {offerData.process.briefMockupSample && (
                <div className="sticky top-24 rounded-3xl border-2 border-dashed border-[#b87508]/40 bg-white p-6 sm:p-7 shadow-xl shadow-black/5 text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-[#111412]/10 mb-4">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Sample Checkpoint Asset
                    </span>
                    <span className="text-[10px] font-mono text-[#111412]/40">Quick-to-Consume</span>
                  </div>

                  <h4 className="font-display text-base font-bold text-[#111412]">
                    {offerData.process.briefMockupSample.title}
                  </h4>
                  <p className="text-[11px] text-[#111412]/60 mt-0.5 mb-4">
                    Sent to you with the script before any production starts.
                  </p>

                  <div className="space-y-3 font-mono text-xs bg-[#faf9f4] p-4 rounded-xl border border-[#111412]/5">
                    <div>
                      <span className="text-[#111412]/45 block text-[10px] uppercase">Brand / Product:</span>
                      <span className="font-semibold text-[#111412]">{offerData.process.briefMockupSample.brand}</span>
                    </div>
                    <div>
                      <span className="text-[#111412]/45 block text-[10px] uppercase">Campaign Objective:</span>
                      <span className="text-[#111412]/80 text-[11px]">{offerData.process.briefMockupSample.objective}</span>
                    </div>
                    <div>
                      <span className="text-[#111412]/45 block text-[10px] uppercase">Hook Angle (0-3s):</span>
                      <span className="text-[#b87508] font-bold text-[11px]">"{offerData.process.briefMockupSample.hookAngle}"</span>
                    </div>
                    <div>
                      <span className="text-[#111412]/45 block text-[10px] uppercase">Visual & Lighting Direction:</span>
                      <span className="text-[#111412]/80 text-[11px]">{offerData.process.briefMockupSample.visualDirection}</span>
                    </div>
                    <div>
                      <span className="text-[#111412]/45 block text-[10px] uppercase">Audio & Voiceover:</span>
                      <span className="text-[#111412]/80 text-[11px]">{offerData.process.briefMockupSample.soundStyle}</span>
                    </div>
                    <div className="pt-2 border-t border-[#111412]/10 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-700 font-bold">✓ Client Approval Required</span>
                      <span className="text-[#111412]/50">Checkpoint 1</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 11. REVISION POLICY & OWNERSHIP */}
        <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {/* Revision Policy Card */}
            <div className="rounded-3xl border border-[#111412]/15 bg-white p-7 sm:p-8 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#b87508]">
                  REVISION POLICY
                </span>
                <h3 className="font-display text-xl font-bold text-[#111412]">
                  {offerData.revisionPolicy.heading}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-[#111412]/75">
                  {offerData.revisionPolicy.body}
                </p>
                <div className="space-y-2 pt-2">
                  {offerData.revisionPolicy.notes.map((note, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#111412]/70">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#f5a524] shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ownership Card */}
            <div className="rounded-3xl border border-[#111412]/15 bg-white p-7 sm:p-8 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">
                  ASSET OWNERSHIP
                </span>
                <h3 className="font-display text-xl font-bold text-[#111412]">
                  {offerData.ownership.heading}
                </h3>
                <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-[#111412]/75">
                  {offerData.ownership.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <p className="text-[11px] text-[#111412]/50 italic pt-2 border-t border-[#111412]/10">
                  {offerData.ownership.clarification}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 12. CIRCLESFUNDME PROOF OF WORK SECTION (PHASE 8) */}
        <section className="py-16 bg-[#f3f4f5] border-y border-[#111412]/10 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto rounded-3xl border border-[#111412]/15 bg-white p-7 sm:p-10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 font-mono text-[10px] font-bold text-emerald-800 uppercase">
                  Verified Client Partner
                </span>
                <span className="font-mono text-[11px] text-[#111412]/50 uppercase tracking-wider">
                  CirclesFundMe Fintech
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#111412] sm:text-2xl">
                {offerData.circlesFundMeProof.heading}
              </h3>
              <p className="text-xs sm:text-sm text-[#111412]/70 leading-relaxed">
                {offerData.circlesFundMeProof.body}
              </p>
            </div>

            <button
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#111412] px-6 py-3.5 font-display text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-[#f5a524] hover:text-black active:scale-95"
            >
              <Play className="h-4 w-4 fill-current text-[#f5a524]" />
              <span>{offerData.circlesFundMeProof.ctaText}</span>
            </button>
          </div>
        </section>

        {/* 13. THE OFFER CARD */}
        <section id="offer" className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
            MONTHLY RETINANCE INVESTMENT
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl text-[#111412]">
            {offerData.offerSummary.heading}
          </h2>

          <div className="mt-10 mx-auto max-w-lg rounded-3xl border-2 border-[#111412] bg-white p-8 sm:p-10 shadow-2xl text-left relative">
            <div className="absolute -top-3.5 right-6 rounded-full bg-[#f5a524] px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-black">
              Managed Studio
            </div>

            <div>
              <span className="font-mono text-xs text-[#111412]/50 uppercase tracking-wider">
                {offerData.offerSummary.packageTitle}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold text-[#111412] sm:text-5xl">
                  {formattedPrice}
                </span>
                <span className="text-sm font-mono text-[#111412]/60">/ month</span>
              </div>
              <p className="mt-1 font-mono text-xs text-[#b87508] font-bold">
                ✓ {videoQty} Videos Every Month
              </p>
            </div>

            <div className="mt-6 space-y-3 pt-6 border-t border-[#111412]/10">
              {offerData.offerSummary.inclusions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#111412]/80 sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#f5a524] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[11px] text-[#111412]/50 leading-relaxed border-t border-[#111412]/5 pt-3">
              {offerData.offerSummary.disclaimer}
            </p>

            <button
              onClick={() => setStrategyOpen(true)}
              className="mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#111412] font-display text-sm font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#f5a524] hover:text-black"
            >
              <span>{offerData.offerSummary.primaryCta}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* 14. FREQUENTLY ASKED QUESTIONS */}
        <section className="py-16 bg-[#f3f4f5] border-t border-[#111412]/10 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
                QUESTIONS & CLARITY
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {offerData.faqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-[#111412]/10 bg-white overflow-hidden shadow-sm text-left"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-[#111412] sm:text-base"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#f5a524]' : 'text-[#111412]/40'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-5 pt-0 text-xs sm:text-sm leading-relaxed text-[#111412]/70 border-t border-[#111412]/5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 15. FINAL CALL TO ACTION */}
        <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl text-[#111412]">
            {offerData.finalCta.heading}
          </h2>

          <div className="space-y-2 text-sm sm:text-base text-[#111412]/70 max-w-xl mx-auto">
            {offerData.finalCta.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 justify-center max-w-md mx-auto">
            <button
              onClick={() => setStrategyOpen(true)}
              className="flex min-h-[54px] w-full sm:flex-1 items-center justify-center gap-2 rounded-2xl bg-[#111412] px-6 font-display text-sm font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#f5a524] hover:text-black active:scale-95"
            >
              <span>{offerData.finalCta.primaryCta}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setStrategyOpen(true)}
              className="flex min-h-[54px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-[#111412]/20 bg-white px-6 font-display text-sm font-bold uppercase tracking-wider text-[#111412] shadow-sm transition hover:bg-[#111412] hover:text-white active:scale-95"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>{offerData.finalCta.secondaryCta}</span>
            </button>
          </div>

          <p className="text-xs text-[#111412]/50 font-mono">
            {offerData.finalCta.note}
          </p>
        </section>
      </main>

      {/* STICKY BOTTOM BAR FOR MOBILE */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#111412]/10 bg-white/95 backdrop-blur-md p-3 sm:hidden flex items-center justify-between gap-3">
        <div className="text-left">
          <p className="font-mono text-[10px] uppercase text-[#111412]/50">{offerData.shortLabel}</p>
          <p className="font-display text-base font-bold text-[#111412]">{formattedPrice}/mo</p>
        </div>
        <button
          onClick={() => setStrategyOpen(true)}
          className="flex min-h-[46px] items-center gap-2 rounded-xl bg-[#111412] px-5 font-display text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-[#f5a524] hover:text-black"
        >
          <span>Book Call</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
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

      {/* VERIFIED LIVE ACTIVITY POPUPS */}
      <LivePopups paused={strategyOpen || previewOpen} />
    </div>
  );
}
