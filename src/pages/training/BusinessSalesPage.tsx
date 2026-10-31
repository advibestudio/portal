import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { fmtMoney } from '@/lib/money';
import { CurriculumAccordion } from '@/components/training/CurriculumAccordion';
import { PillarsGrid } from '@/components/training/PillarsGrid';
import { UrgencyCountdown } from '@/components/training/UrgencyCountdown';
import { StickyTrainingBar } from '@/components/training/StickyTrainingBar';
import { RegistrationModal } from '@/components/training/RegistrationModal';
import { Wall } from '@/components/Wall';
import { CaseStudyModal } from '@/components/CaseStudyModal';
import { Lightbox } from '@/components/shared';
import type { PortfolioItem } from '@/content/types';
import {
  Sparkles, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Flame,
  DollarSign, Clock, Users, Video, Zap, Award, Gift, ChevronDown,
  Building2, MessageSquare, Play, HelpCircle, FileText
} from 'lucide-react';

export default function BusinessSalesPage() {
  const { activeCohort, content, confirmedPaidCount, cohortDisplayStatus } = useStore();
  const { country, setCountry } = useCountry();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [caseStudyOpen, setCaseStudyOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<PortfolioItem | null>(null);

  const items = content.portfolio.filter((p) => p.visible).sort((a, b) => a.order - b.order);

  const priceObj = activeCohort?.prices?.[country?.code] || activeCohort?.prices?.NG || { founding: 19997, regular: 29997 };
  const foundingFormatted = fmtMoney(priceObj.founding, { symbol: country.symbol });
  const regularFormatted = fmtMoney(priceObj.regular, { symbol: country.symbol });

  const proofItems = activeCohort?.proofItems || [];
  const sessions = activeCohort?.sessions || [];
  const pillars = activeCohort?.pillars || [];
  const instructors = activeCohort?.instructors || [];
  const bonuses = activeCohort?.bonuses || [];
  const faqs = activeCohort?.faqs || [];

  const cap = activeCohort?.seatCapacity || 100;
  const seatsLeft = Math.max(0, cap - confirmedPaidCount);

  return (
    <div className="min-h-dvh bg-[#faf9f4] text-[#111412] antialiased selection:bg-[#f5a524] selection:text-black">
      {/* 1. TOP ANNOUNCEMENT URGENCY BAR */}
      <div className="bg-[#111412] text-white px-4 py-2.5 text-center text-xs font-mono tracking-wide border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded bg-[#f5a524] px-1.5 py-0.5 text-[10px] font-bold text-black uppercase">
            Founding Cohort
          </span>
          <span className="text-white/80">
            Strictly limited to {cap} business owners · <strong>{confirmedPaidCount}/{cap}</strong> seats filled.
          </span>
          <span className="text-[#f5a524] font-bold">
            Enrollment closes soon.
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
            <div className="flex flex-col">
              <span className="font-display text-base font-extrabold tracking-tight sm:text-lg leading-tight">
                AdVibe Studios
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#111412]/50">
                AI Media & Training
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
              onClick={() => setRegisterOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#111412] px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-[#f5a524] hover:text-black"
            >
              <span>Secure Seat</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-28">
        {/* 3. HERO SECTION */}
        <section className="relative px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 overflow-hidden text-center">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f5a524]/50 bg-[#f5a524]/10 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#9e6203]">
              <Sparkles className="h-3.5 w-3.5 text-[#b87508]" />
              The 2-Week Intensive For Business Owners
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#111412] sm:text-5xl md:text-6xl leading-[1.08]">
              Create High-Converting Promotional Videos for Your Business With AI — <span className="underline decoration-[#f5a524] decoration-4 underline-offset-4">In Just 2 Weeks</span>.
            </h1>

            {/* Subheadline */}
            <p className="mx-auto max-w-2xl text-base text-[#111412]/70 sm:text-xl leading-relaxed">
              Without spending millions on camera crews, hiring expensive actors, waiting weeks for video editors, or struggling with what to post. Direct professional-grade commercial video ads from your smartphone or laptop.
            </p>

            {/* Price & Scarcity Banner */}
            <div className="mx-auto max-w-md rounded-2xl border border-[#111412]/10 bg-white p-4 shadow-xl shadow-black/5 flex items-center justify-between gap-3 text-left">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#111412]/50">Founding Cohort Rate</p>
                <div className="flex flex-col">
                  <span className="font-display text-2xl font-bold text-[#111412] sm:text-3xl">
                    {foundingFormatted}
                  </span>
                  <span className="text-[11px] font-mono text-[#111412]/60">
                    Future cohorts: {regularFormatted}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-full bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-bold text-amber-700">
                  🔥 {seatsLeft} Seats Left
                </span>
                <p className="mt-0.5 text-[10px] text-[#111412]/45">Limited to {cap} students</p>
              </div>
            </div>

            {/* Hero CTA */}
            <div className="pt-2 flex flex-col items-center gap-3">
              <button
                onClick={() => setRegisterOpen(true)}
                className="flex min-h-[56px] w-full max-w-md items-center justify-center gap-3 rounded-2xl bg-[#111412] px-8 font-display text-base font-bold uppercase tracking-wider text-white shadow-xl shadow-black/15 transition hover:bg-[#f5a524] hover:text-black active:scale-95 sm:text-lg"
              >
                <span>🚀 Secure My Founding Seat</span>
                <ArrowRight className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-4 text-xs text-[#111412]/50 flex-wrap justify-center font-mono">
                <span>✓ 6 Live Sessions</span>
                <span>✓ HD Lifetime Recordings</span>
                <span>✓ WhatsApp Community</span>
                <span>✓ Pre-Cohort 100% Refund Policy</span>
              </div>
            </div>

            {/* Countdown */}
            <div className="pt-4">
              <UrgencyCountdown deadline={activeCohort.enrollmentDeadline} label="Founding Cohort Closes In:" />
            </div>
          </div>
        </section>

        {/* 4. MOVING 3D VIDEO WALL (BRAND IDENTITY COMPONENT) */}
        <section className="relative -mt-4 py-8 overflow-hidden bg-[#071018] text-white">
          <div className="mx-auto max-w-5xl px-4 text-center mb-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              WHAT IS POSSIBLE IN 2 WEEKS
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl mt-1 text-white">
              The Kind of Commercial Work You Will Learn To Direct
            </h2>
            <p className="text-xs text-white/50 max-w-lg mx-auto mt-1">
              Photorealistic product drops, UGC testimonials, and cinematic brand narratives created entirely with AI.
            </p>
          </div>

          <div className="relative py-4">
            <Wall items={items} onPlay={(item) => setPlayingVideo(item)} />
          </div>
        </section>

        {/* 5. THE BUSINESS OWNER'S PAIN POINTS */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
              THE CONTENT BOTTLENECK
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
              Why Most Businesses Are Starving for Video Ads
            </h2>
            <p className="mt-3 text-sm text-[#111412]/65 sm:text-base leading-relaxed">
              In 2026, TikTok, Instagram Reels, Meta Ads, and WhatsApp Status demand fresh video weekly. But traditional video production is built to break your budget.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Astronomical Studio & Crew Costs',
                desc: 'Renting a physical camera package, lighting rigs, audio engineers, and studio spaces costs hundreds of thousands of Naira (or thousands of dollars) for just one single 30-second ad.',
                icon: DollarSign,
              },
              {
                title: '3 to 4 Weeks of Crippling Delays',
                desc: 'By the time you write a script, hire crew, shoot on location, and wait for video editors to deliver revision 1, the sale season or holiday promo is already over.',
                icon: Clock,
              },
              {
                title: 'Model & Actor Casting Friction',
                desc: 'Finding dependable actors who look right for your audience, show up on time, and deliver convincing lines is a perpetual headache for small and growing brands.',
                icon: Users,
              },
              {
                title: 'Inability to Test Creative Variations',
                desc: 'Top advertisers test 5 to 10 hook variations per week. If every video costs a fortune to shoot, you are forced to bet your entire ad budget on a single creative guess.',
                icon: Zap,
              },
              {
                title: 'Camera Shyness & Lack of Ideas',
                desc: 'Many business owners hate standing in front of a camera themselves, and end up posting static product photos that social media algorithms immediately bury.',
                icon: Video,
              },
              {
                title: 'Total Dependence on Freelancers',
                desc: 'Every single time you have a new discount, a new stock arrival, or a campaign idea, you have to beg, pay, and wait for outside designers and editors.',
                icon: XCircle,
              },
            ].map((p, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#111412]/10 bg-white p-6 shadow-sm hover:border-[#f5a524]/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 mb-4">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold text-[#111412]">{p.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#111412]/60 sm:text-sm">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Transformation Bridge */}
          <div className="mt-14 rounded-3xl border border-[#f5a524]/40 bg-[#121415] text-white p-7 sm:p-10 shadow-2xl text-center max-w-4xl mx-auto">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              THE NEW PRODUCTION REALITY
            </span>
            <h3 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Traditional Production vs. The AdVibe AI Workflow
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-white/70 sm:text-sm max-w-2xl mx-auto">
              Compare what it takes to get one promotional video into market today versus directing your own campaigns with our 2-week system.
            </p>

            <div className="mt-8 overflow-x-auto text-left">
              <table className="w-full min-w-[540px] text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-mono uppercase tracking-wider text-white/50">
                    <th className="pb-3 text-left">Production Factor</th>
                    <th className="pb-3 text-left text-red-400">Traditional Agency Shoot</th>
                    <th className="pb-3 text-left text-[#f5a524]">AdVibe AI Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 font-semibold text-white">Studio & Camera Crew</td>
                    <td className="py-3 text-white/60">₦500,000 – ₦2,000,000+ per shoot</td>
                    <td className="py-3 font-bold text-emerald-400">₦0 (Direct from your laptop or phone)</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-white">Models & Presenters</td>
                    <td className="py-3 text-white/60">Casting fees, call sheets, no-shows</td>
                    <td className="py-3 font-bold text-emerald-400">Custom photorealistic AI presenters</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-white">Turnaround Time</td>
                    <td className="py-3 text-white/60">3 to 4 weeks of editing revisions</td>
                    <td className="py-3 font-bold text-emerald-400">48-hour rapid deployment</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-white">Ad Hook Variations</td>
                    <td className="py-3 text-white/60">Pay for each new shoot & edit</td>
                    <td className="py-3 font-bold text-emerald-400">Batch 5–10 hooks in one afternoon</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-white">Your Independence</td>
                    <td className="py-3 text-white/60">Permanently dependent on freelancers</td>
                    <td className="py-3 font-bold text-emerald-400">Repeatable asset machine for your brand</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setRegisterOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#f5a524] px-8 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-black shadow-lg shadow-[#f5a524]/20 hover:brightness-110 active:scale-95 transition"
              >
                <span>Master The 48-Hour Workflow In 2 Weeks</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* 6. REAL PROOF & VERIFIED PARTNERSHIP */}
        <section className="py-16 bg-[#f3f4f5] border-y border-[#111412]/10 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
                REAL-WORLD COMMERCIAL RESULTS
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
                We Don't Teach AI in Theory. We Deploy It for Real Businesses.
              </h2>
              <p className="mt-3 text-sm text-[#111412]/65">
                Our founders actively direct commercial advertising campaigns for growing fintechs and consumer brands.
              </p>
            </div>

            {/* Proof Grid */}
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {proofItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#111412]/10 bg-white p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#b87508]">
                      {item.client}
                    </span>
                    <h3 className="mt-1 font-display text-xl font-bold text-[#111412]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#111412]/60">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111412]/10 flex items-center justify-between">
                    <span className="font-display text-base font-extrabold text-[#111412]">
                      {item.metric}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      ✓ Verified Campaign
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Featured CirclesFundMe Spotlight Card & Case Study Trigger */}
            <div className="mt-8 rounded-3xl border border-[#111412]/15 bg-white p-7 sm:p-9 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 text-left">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-0.5 font-mono text-[10px] font-bold text-emerald-800 uppercase">
                    Active Client Partnership
                  </span>
                  <span className="font-mono text-[11px] text-[#111412]/50 uppercase tracking-wider">
                    Fintech Growth Campaign
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#111412] sm:text-2xl">
                  {content.client.name}: 1,000+ Customer Care Conversations Generated
                </h3>
                <p className="text-xs sm:text-sm text-[#111412]/70 leading-relaxed">
                  How AdVibe Studios developed an AI commercial directing pipeline to scale user onboarding toward 10,000+ registered members without camera crews or studio rental.
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setCaseStudyOpen(true)}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#111412] px-6 py-3.5 font-display text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-[#f5a524] hover:text-black active:scale-95"
                >
                  <FileText className="h-4 w-4 text-[#f5a524]" />
                  <span>Explore The Case Study</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 7. THE 6 LIVE SESSIONS (EXPANDABLE CURRICULUM UI MATCHING REFERENCE 1) */}
        <section id="curriculum" className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
              THE 2-WEEK ROADMAP
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
              6 Intensive Live Sessions. Zero Fluff.
            </h2>
            <p className="mt-3 text-sm text-[#111412]/65 sm:text-base">
              Each live session lasts 2.5 hours with practical step-by-step demonstrations, live student interaction, and a concrete creation assignment.
            </p>
          </div>

          <CurriculumAccordion sessions={sessions} track="business" />

          {/* Dedicated Agency Callout under Curriculum */}
          <div className="mt-12 rounded-3xl border border-[#111412]/15 bg-white p-7 sm:p-9 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-black/5">
            <div className="space-y-1.5 text-left">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#b87508]">
                TOO BUSY TO DIRECT COMMERCIAL VIDEOS YOURSELF?
              </span>
              <h3 className="font-display text-xl font-bold text-[#111412] sm:text-2xl">
                Let AdVibe Studios Produce Your Video Campaigns For You.
              </h3>
              <p className="text-xs sm:text-sm text-[#111412]/70 max-w-lg leading-relaxed">
                If you prefer done-for-you production, our agency team scripts, directs, and delivers high-converting AI commercial video ads in just 5 working days with revisions included.
              </p>
            </div>
            <a
              href="#/"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#111412] px-6 py-3.5 font-display text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-[#f5a524] hover:text-black"
            >
              <span>Explore Agency Packages</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* 8. 5 COMPETENCY PILLARS (MATCHING REFERENCE 2) */}
        <section className="py-16 bg-[#071018] text-white px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                THE MASTERY FRAMEWORK
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
                5 Core Pillars You Will Master
              </h2>
              <p className="mt-2 text-xs text-white/55 sm:text-sm">
                Beyond the live classes, this is the foundational production system you take into your business forever.
              </p>
            </div>

            <PillarsGrid pillars={pillars} />
          </div>
        </section>

        {/* 9. WHY THIS IS BETTER THAN ANOTHER AI COURSE & PAST BUYERS */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
              WHY THIS IS DIFFERENT
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
              Why This Is Not Another Prerecorded Video Course
            </h2>
            <p className="mt-3 text-sm text-[#111412]/65 sm:text-base leading-relaxed">
              Most courses dump 40 hours of disconnected screen recordings on you and leave you to figure it out alone. Here is why our 2-week intensive is fundamentally structured for real commercial execution.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-[#111412]/15 bg-white shadow-xl shadow-black/5">
            <table className="w-full min-w-[620px] text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#111412]/10 bg-[#faf9f4] text-[11px] font-mono uppercase tracking-wider text-[#111412]/60">
                  <th className="p-4 sm:p-5">Learning Dimension</th>
                  <th className="p-4 sm:p-5 text-red-600">Typical Self-Paced Course</th>
                  <th className="p-4 sm:p-5 text-[#b87508] bg-[#f5a524]/10">The AdVibe Intensive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111412]/5">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#111412]">Training Format</td>
                  <td className="p-4 sm:p-5 text-[#111412]/60">Prerecorded videos (often outdated in weeks)</td>
                  <td className="p-4 sm:p-5 font-bold text-[#111412] bg-[#f5a524]/5">6 live 2.5h intensive sessions + lifetime HD replays</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#111412]">Practice & Output</td>
                  <td className="p-4 sm:p-5 text-[#111412]/60">Passive watching without structured exercises</td>
                  <td className="p-4 sm:p-5 font-bold text-[#111412] bg-[#f5a524]/5">Hands-on practical creation after every single session</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#111412]">Instructor Guidance</td>
                  <td className="p-4 sm:p-5 text-[#111412]/60">No direct review or feedback on your files</td>
                  <td className="p-4 sm:p-5 font-bold text-[#111412] bg-[#f5a524]/5">Hands-on critiques from working agency founders</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#111412]">Commercial Context</td>
                  <td className="p-4 sm:p-5 text-[#111412]/60">Theoretical tutorials taught by prompt hobbyists</td>
                  <td className="p-4 sm:p-5 font-bold text-[#111412] bg-[#f5a524]/5">Grounded in real agency campaigns (e.g. CirclesFundMe)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#111412]">Storytelling & Refinement</td>
                  <td className="p-4 sm:p-5 text-[#111412]/60">Generating random clips that fail to sell</td>
                  <td className="p-4 sm:p-5 font-bold text-[#111412] bg-[#f5a524]/5">Complete 3-act storytelling bibles & conversion hooks</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Special Address to People Who Already Bought an AI Course */}
          <div className="mt-10 rounded-3xl border border-[#111412]/15 bg-[#121416] text-white p-7 sm:p-10 shadow-2xl">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              TO PREVIOUS COURSE BUYERS
            </span>
            <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
              Already Bought an AI Video Course in the Past?
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-white/70 leading-relaxed max-w-2xl">
              Maybe you completed dozens of tutorial modules, learned which buttons to click, and still couldn’t produce a finished commercial that actually looks professional and sells. That is not your fault. Knowing tool buttons is not creative direction.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-white/70 leading-relaxed max-w-2xl">
              Commercial video requires <em>lighting physics, camera vectors, emotional narrative arcs, and audio layering</em>. In this 2-week intensive, we don’t leave you alone with video files—we guide your hands through the complete director’s pipeline.
            </p>
          </div>
        </section>

        {/* 10. MEET YOUR TWO INSTRUCTORS */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
              THE ADVIBE METHOD
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
              Two Instructors. Two Superpowers. One System.
            </h2>
            <p className="mt-3 text-sm text-[#111412]/65 sm:text-base">
              Marketing science that converts customer demand + Narrative storytelling that captures human attention.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {instructors.map((inst) => (
              <div
                key={inst.id}
                className="rounded-3xl border border-[#111412]/15 bg-white p-7 shadow-xl shadow-black/5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={inst.image}
                      alt={inst.name}
                      className="h-16 w-16 rounded-2xl object-cover border border-[#111412]/10"
                    />
                    <div>
                      <h3 className="font-display text-xl font-bold text-[#111412]">{inst.name}</h3>
                      <p className="font-mono text-xs font-semibold text-[#b87508]">{inst.role}</p>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-[#111412]/80 leading-relaxed border-l-2 border-[#f5a524] pl-3 italic">
                    "{inst.philosophy}"
                  </p>

                  <div className="space-y-2 text-xs leading-relaxed text-[#111412]/65">
                    {inst.bio.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#111412]/10 space-y-1.5">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#111412]/50">
                      Key Proof & Credentials:
                    </p>
                    {inst.keyWins.map((win, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#111412]/80">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#f5a524] shrink-0" />
                        <span>{win}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 10. BONUSES STACK */}
        <section className="py-16 bg-[#111416] text-white px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                INCLUDED WITH YOUR ENROLLMENT
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
                3 Core Production Assets & Masterclasses
              </h2>
              <p className="mt-2 text-xs text-white/55 sm:text-sm">
                No fake monetary valuations. Real creative assets: from storytelling bibles and commercial product imagery to mobile video editing.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bonuses.map((bonus) => (
                <div
                  key={bonus.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between hover:border-[#f5a524]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#f5a524]">{bonus.number}</span>
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/60">
                        {bonus.badge}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-base font-bold text-white">{bonus.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/60">{bonus.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Included in Founding Enrollment</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 11. CAPSTONE CERTIFICATION */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <div className="rounded-3xl border border-[#111412]/15 bg-white p-8 sm:p-12 shadow-xl shadow-black/5">
            <Award className="mx-auto h-12 w-12 text-[#f5a524]" />
            <span className="mt-3 inline-block font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
              OFFICIAL CERTIFICATE OF COMPLETION
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
              AdVibe AI Cinematography Capstone
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-[#111412]/65 sm:text-base">
              To earn your certificate, you must submit a completed 60–90 second commercial video for your own business or brand. Once reviewed and approved by Enoch and Esther, you receive the verified AdVibe Founding Creator credential and portfolio feature eligibility.
            </p>
          </div>
        </section>

        {/* 12. FIRST-WEEK VIDEO CREATION GUARANTEE */}
        <section className="py-16 bg-[#faf9f4] border-t border-[#111412]/10 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="rounded-3xl border-2 border-[#f5a524] bg-white p-8 sm:p-12 shadow-xl shadow-black/5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5a524]/15 text-[#b87508] mb-4">
                <ShieldCheck className="h-9 w-9" />
              </div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
                RISK-FREE 100% REVERSAL
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
                Our First-Week Video Creation Guarantee
              </h2>
              <p className="mt-4 mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed text-[#111412]/75">
                Attend the live sessions of Week 1 (or review the HD recordings) and follow the simple practical frameworks. If by the end of the first week you cannot create a commercial video ad for your business or brand, simply send a message on WhatsApp or email within 24 hours of Session 2 (before Session 3 begins).
              </p>
              <p className="mt-2.5 mx-auto max-w-xl text-xs sm:text-sm font-bold text-emerald-800">
                ✓ We will refund 100% of your enrollment fee immediately. No hassle, no friction, and no awkward questions.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-[#111412]/60 font-mono">
                <span>✓ Attend Week 1 risk-free</span>
                <span>✓ 24h post-Session 2 refund window</span>
                <span>✓ Direct bank reversal</span>
              </div>
            </div>
          </div>
        </section>

        {/* 13. "OR LET ADVIBE PRODUCE IT FOR YOU" ALTERNATIVE (NEAR FOOTER) */}
        <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="rounded-3xl border border-[#111412]/10 bg-[#faf9f4] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
            <div className="space-y-1 text-left">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#b87508]">
                TOO BUSY TO LEARN AI VIDEO YOURSELF?
              </span>
              <h3 className="font-display text-xl font-bold text-[#111412]">
                Let AdVibe Studios Produce Your Commercials For You.
              </h3>
              <p className="text-xs text-[#111412]/65 max-w-md">
                Our agency team delivers high-converting AI video ads with 5-day delivery and complete script-to-screen production.
              </p>
            </div>
            <a
              href="#/"
              className="shrink-0 rounded-xl border border-[#111412] px-5 py-3 font-display text-xs font-bold uppercase tracking-wider text-[#111412] hover:bg-[#111412] hover:text-white transition"
            >
              Explore Agency Packages →
            </a>
          </div>
        </section>

        {/* 13. PRICING & ENROLLMENT OFFER STACK */}
        <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
            SIMPLE, TRANSPARENT FOUNDING PRICING
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl text-[#111412]">
            Join The Founding Cohort
          </h2>
          <p className="mt-3 text-sm text-[#111412]/65 max-w-lg mx-auto">
            Get the full 2-week intensive, 6 live sessions, all 6 bonus libraries, lifetime recordings, and community access for one accessible price.
          </p>

          {/* Pricing Card */}
          <div className="mt-10 mx-auto max-w-lg rounded-3xl border-2 border-[#f5a524] bg-white p-8 sm:p-10 shadow-2xl text-left relative">
            <div className="absolute -top-3.5 right-6 rounded-full bg-[#f5a524] px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-black">
              Founding Member Rate
            </div>

            <div>
              <span className="font-mono text-xs text-[#111412]/50 uppercase tracking-wider">Total Investment</span>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-display text-4xl font-extrabold text-[#111412] sm:text-5xl">
                  {foundingFormatted}
                </span>
                <span className="text-sm text-[#111412]/60 font-mono">
                  (Future cohorts: {regularFormatted})
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-amber-800 font-semibold">
                ✓ Founding Cohort Advantage — price moves to {regularFormatted} for Cohort 2
              </p>
            </div>

            {/* Inclusions */}
            <div className="mt-6 space-y-3 pt-6 border-t border-[#111412]/10">
              {[
                '6 Live 2.5-Hour AI Cinematography Sessions',
                'Full Lifetime HD Session Recordings (Rewatch anytime)',
                'Lifetime Private AdVibe AI Creator WhatsApp Community',
                'Weekly Practical Assignments with Instructor Critiques',
                'BONUS #1: Storytelling & AI Narrative Refinement System',
                'BONUS #2: AI Marketing Image Creation for Product Campaigns',
                'BONUS #3: Free Mobile Video Editing Masterclass',
                'Official AdVibe Certificate of Completion',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#111412]/80 sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#f5a524] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={() => setRegisterOpen(true)}
              className="mt-8 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#111412] font-display text-base font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#f5a524] hover:text-black"
            >
              <span>🚀 Secure My Founding Seat Now</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-[#111412]/50">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Policy: Refunds are available before the cohort begins. 100% refund if AdVibe cancels the cohort.</span>
            </div>
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
              {faqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-[#111412]/10 bg-white overflow-hidden shadow-sm"
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
      </main>

      {/* 15. STICKY MOBILE/DESKTOP CONVERSION BAR */}
      <StickyTrainingBar
        cohort={activeCohort}
        activeCountry={country}
        paidCount={confirmedPaidCount}
        onOpenRegister={() => setRegisterOpen(true)}
      />

      {/* 16. REGISTRATION FUNNEL MODAL */}
      <RegistrationModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        cohort={activeCohort}
        initialTrack="business"
        activeCountry={country}
      />

      {/* 17. CIRCLESFUNDME CASE STUDY MODAL */}
      <CaseStudyModal
        open={caseStudyOpen}
        onClose={() => setCaseStudyOpen(false)}
        onAction={() => setRegisterOpen(true)}
      />

      {playingVideo && (
        <Lightbox item={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </div>
  );
}
