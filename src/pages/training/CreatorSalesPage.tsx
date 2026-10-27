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
import {
  Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Flame,
  Film, Camera, Clapperboard, Layers, Award, Briefcase, ChevronDown
} from 'lucide-react';

export default function CreatorSalesPage() {
  const { activeCohort, content, confirmedPaidCount, cohortDisplayStatus } = useStore();
  const { country, setCountry } = useCountry();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const items = content.portfolio.filter((p) => p.visible).sort((a, b) => a.order - b.order);

  const priceObj = activeCohort?.prices?.[country?.code] || activeCohort?.prices?.NG || { founding: 19997, regular: 29997 };
  const foundingFormatted = fmtMoney(priceObj.founding, { symbol: country.symbol });
  const regularFormatted = fmtMoney(priceObj.regular, { symbol: country.symbol });

  const sessions = activeCohort?.sessions || [];
  const pillars = activeCohort?.pillars || [];
  const instructors = activeCohort?.instructors || [];
  const bonuses = activeCohort?.bonuses || [];
  const faqs = activeCohort?.faqs || [];

  const cap = activeCohort?.seatCapacity || 100;
  const seatsLeft = Math.max(0, cap - confirmedPaidCount);

  return (
    <div className="min-h-dvh bg-[#faf9f4] text-[#111412] antialiased selection:bg-[#f5a524] selection:text-black">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#111412] text-white px-4 py-2.5 text-center text-xs font-mono tracking-wide border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded bg-[#f5a524] px-1.5 py-0.5 text-[10px] font-bold text-black uppercase">
            Founding Creator Cohort
          </span>
          <span className="text-white/80">
            Limited to {cap} creators & filmmakers · <strong>{confirmedPaidCount}/{cap}</strong> seats filled.
          </span>
          <span className="text-[#f5a524] font-bold">
            Be part of Cohort 1.
          </span>
        </div>
      </div>

      {/* 2. NAVIGATION */}
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
                AI Cinematography
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
              <span>Join Cohort</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-28">
        {/* 3. HERO SECTION */}
        <section className="relative px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 overflow-hidden text-center">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f5a524]/50 bg-[#f5a524]/10 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#9e6203]">
              <Sparkles className="h-3.5 w-3.5 text-[#b87508]" />
              The 2-Week AI Cinematography Intensive
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#111412] sm:text-5xl md:text-6xl leading-[1.08]">
              Master AI Cinematography, Direct Commercial Ads & Short Films, and <span className="underline decoration-[#f5a524] decoration-4 underline-offset-4">Build an Elite Portfolio</span> in 14 Days.
            </h1>

            <p className="mx-auto max-w-2xl text-base text-[#111412]/70 sm:text-xl leading-relaxed">
              Go from prompt confusion to directing professional-grade visual campaigns with live guidance from a performance marketer and an award-winning storyteller.
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
                <p className="mt-0.5 text-[10px] text-[#111412]/45">100 max capacity</p>
              </div>
            </div>

            {/* Hero CTA */}
            <div className="pt-2 flex flex-col items-center gap-3">
              <button
                onClick={() => setRegisterOpen(true)}
                className="flex min-h-[56px] w-full max-w-md items-center justify-center gap-3 rounded-2xl bg-[#111412] px-8 font-display text-base font-bold uppercase tracking-wider text-white shadow-xl shadow-black/15 transition hover:bg-[#f5a524] hover:text-black active:scale-95 sm:text-lg"
              >
                <span>🚀 Join The Founding Creator Cohort</span>
                <ArrowRight className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-4 text-xs text-[#111412]/50 flex-wrap justify-center font-mono">
                <span>✓ Direct 60-90s Capstone Film</span>
                <span>✓ AdVibe Creators Showcase Feature</span>
                <span>✓ Capstone Certificate</span>
                <span>✓ Lifetime Community</span>
              </div>
            </div>

            {/* Countdown */}
            <div className="pt-4">
              <UrgencyCountdown deadline={activeCohort.enrollmentDeadline} label="Cohort Closes In:" />
            </div>
          </div>
        </section>

        {/* 4. MOVING 3D VIDEO WALL (BRAND IDENTITY COMPONENT) */}
        <section className="relative -mt-4 py-8 overflow-hidden bg-[#071018] text-white">
          <div className="mx-auto max-w-5xl px-4 text-center mb-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              CINEMATIC VISUAL SHOWCASE
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl mt-1 text-white">
              From Random Stills to Intentional Direction
            </h2>
            <p className="text-xs text-white/50 max-w-lg mx-auto mt-1">
              Learn how commercial creators control camera movement, lighting physics, and visual rhythm.
            </p>
          </div>

          <div className="relative py-4">
            <Wall items={items} onPlay={() => {}} />
          </div>
        </section>

        {/* 5. THE CREATOR'S REAL STRUGGLE */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
              WHY PROMPTING IS NOT DIRECTING
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
              Tired of Generating Random, Disconnected AI Clips?
            </h2>
            <p className="mt-3 text-sm text-[#111412]/65 sm:text-base leading-relaxed">
              Anyone can type a lucky prompt into an AI tool and get a pretty single picture. But when you try to create a real 30-second commercial or narrative film, everything falls apart.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'The Character Morphing Trap',
                desc: 'Your character has blue eyes in shot 1, brown hair in shot 2, and completely different facial bone structure in shot 3. Random generation cannot build a consistent brand or story.',
                icon: Layers,
              },
              {
                title: 'Uncontrollable Motion Physics',
                desc: 'You hit generate and the limbs melt, the camera spins wildly out of control, or the motion looks like slow-motion gelatin instead of intentional cinematography.',
                icon: Camera,
              },
              {
                title: 'No Narrative Arc or Hook',
                desc: 'You have a 4-second clip of a neon cyberpunk street, but you have no story, no emotional hook, no tension, and no reason for anyone to keep watching.',
                icon: Film,
              },
              {
                title: 'Audio That Feels Artificial',
                desc: 'Unnatural, robotic voices and disjointed background music that makes your project look like a low-effort experiment instead of a studio production.',
                icon: Clapperboard,
              },
              {
                title: 'No Real Portfolio To Show Clients',
                desc: 'Clients do not pay for single screenshots. They pay for finished commercials, consistent product showcases, and campaign assets ready for Meta and TikTok.',
                icon: Briefcase,
              },
              {
                title: 'Endless Tool Fatigue',
                desc: 'A new AI tool launches every 48 hours. Without a rock-solid production foundation, you waste months jumping from platform to platform without mastering anything.',
                icon: Sparkles,
              },
            ].map((p, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#111412]/10 bg-white p-6 shadow-sm hover:border-[#f5a524]/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-[#b87508] mb-4">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold text-[#111412]">{p.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#111412]/60 sm:text-sm">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Core Shift */}
          <div className="mt-12 rounded-3xl border border-[#f5a524]/40 bg-[#121415] text-white p-8 sm:p-10 shadow-2xl text-center max-w-3xl mx-auto">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              THE TRANSFORMATION
            </span>
            <h3 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              From Prompt Collector to Certified AI Director
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/70 sm:text-base">
              Learn how to write character bibles, control camera motion vectors, design layered foley audio, and produce complete commercial assets that brands and audiences respect.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setRegisterOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#f5a524] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-black hover:brightness-110"
              >
                Enroll In The Founding Cohort →
              </button>
            </div>
          </div>
        </section>

        {/* 6. THE 6 LIVE SESSIONS (EXPANDABLE CURRICULUM UI) */}
        <section id="curriculum" className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
              THE 2-WEEK CURRICULUM
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
              6 Intensive Live Directing Sessions
            </h2>
            <p className="mt-3 text-sm text-[#111412]/65 sm:text-base">
              Hands-on instruction from setting up your camera vectors to locking character faces, screenwriting, and exporting your final film.
            </p>
          </div>

          <CurriculumAccordion sessions={sessions} track="creators" />
        </section>

        {/* 7. 5 COMPETENCY PILLARS */}
        <section className="py-16 bg-[#071018] text-white px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                THE 5-PILLAR ARCHITECTURE
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
                The Full Creative Roadmap
              </h2>
              <p className="mt-2 text-xs text-white/55 sm:text-sm">
                A structured foundation covering Creation, Cinematography, Sound, Commercial UGC, and Scale.
              </p>
            </div>

            <PillarsGrid pillars={pillars} />
          </div>
        </section>

        {/* 8. MEET YOUR INSTRUCTORS */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
              THE ADVIBE METHOD
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
              Two Instructors. Two Complementary Perspectives.
            </h2>
            <p className="mt-3 text-sm text-[#111412]/65 sm:text-base">
              The Mind of a Marketer + The Heart of a Storyteller + The Tools of an AI Filmmaker.
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

        {/* 9. THE 3 CAPSTONE TRACKS */}
        <section className="py-16 bg-[#f3f4f5] border-y border-[#111412]/10 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
                CHOOSE YOUR GRADUATION CAPSTONE
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-[#111412]">
                3 Capstone Tracks for Your Portfolio
              </h2>
              <p className="mt-2 text-xs text-[#111412]/60 sm:text-sm">
                Every student graduates with a verified, instructor-reviewed 60–90 second production in their chosen specialization.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#111412]/10 bg-white p-6 shadow-sm">
                <span className="font-mono text-xs font-bold text-[#b87508]">TRACK A</span>
                <h3 className="mt-2 font-display text-lg font-bold text-[#111412]">Commercial Advertising</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#111412]/65">
                  Direct a 60–90 second commercial product campaign with 3D product motion, hook variations, and direct-response call to action.
                </p>
              </div>

              <div className="rounded-2xl border border-[#111412]/10 bg-white p-6 shadow-sm">
                <span className="font-mono text-xs font-bold text-[#b87508]">TRACK B</span>
                <h3 className="mt-2 font-display text-lg font-bold text-[#111412]">Creator / Influencer</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#111412]/65">
                  Build an AI influencer persona with consistent facial seeds, custom voice, and a 3-part UGC content series.
                </p>
              </div>

              <div className="rounded-2xl border border-[#111412]/10 bg-white p-6 shadow-sm">
                <span className="font-mono text-xs font-bold text-[#b87508]">TRACK C</span>
                <h3 className="mt-2 font-display text-lg font-bold text-[#111412]">Narrative Short Film</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#111412]/65">
                  Direct a cinematic 60–90 second dramatic short film with story arc, dialogue, consistent characters, and full foley sound design.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 10. ADVIBE SHOWCASE & AGENCY OPPORTUNITIES */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <div className="rounded-3xl border border-[#f5a524]/40 bg-[#121415] text-white p-8 sm:p-12 shadow-2xl">
            <Award className="mx-auto h-12 w-12 text-[#f5a524]" />
            <span className="mt-3 inline-block font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              FOUNDING COHORT PRIVILEGE
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
              The AdVibe Creator Showcase & Internal Priority
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-white/70 sm:text-base">
              Students who successfully pass their capstone can have their work featured in the AdVibe Creators Showcase on our platform. Top-performing graduates will be among the first contacted when AdVibe Studios opens internal freelance, creative production, and client contract roles.
            </p>
            <p className="mt-4 text-[11px] font-mono text-white/40">
              * Opportunities are merit-based and tied to capstone quality standards. No automatic income guarantees.
            </p>
          </div>
        </section>

        {/* 11. BONUSES STACK */}
        <section className="py-16 bg-[#111416] text-white px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                FOUNDING COHORT VALUE STACK
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
                6 Production Resources & Mini-Courses
              </h2>
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

        {/* 12. PRICING STACK */}
        <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
            LOCKED FOUNDING CREATOR PRICING
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl text-[#111412]">
            Join The Founding Creator Cohort
          </h2>
          <p className="mt-3 text-sm text-[#111412]/65 max-w-lg mx-auto">
            Build your portfolio, direct your capstone film, and master the tools of the future with 2 experienced mentors.
          </p>

          <div className="mt-10 mx-auto max-w-lg rounded-3xl border-2 border-[#f5a524] bg-white p-8 sm:p-10 shadow-2xl text-left relative">
            <div className="absolute -top-3.5 right-6 rounded-full bg-[#f5a524] px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-black">
              Founding Creator Rate
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
                ✓ Founding Cohort Advantage — regular price will be {regularFormatted} for future cohorts
              </p>
            </div>

            <div className="mt-6 space-y-3 pt-6 border-t border-[#111412]/10">
              {[
                '6 Live 2.5-Hour AI Cinematography Sessions',
                'Full Lifetime HD Session Recordings (Watch anytime)',
                'Lifetime Private AdVibe AI Creator WhatsApp Community',
                'Hands-on Practical Assignments & Instructor Critiques',
                'BONUS #1: Storytelling & AI Narrative Refinement System',
                'BONUS #2: AI Marketing Image Creation for Commercial Campaigns',
                'BONUS #3: Free Mobile Video Editing Masterclass',
                'Final Capstone Project & Certificate of Completion',
                'AdVibe Creators Showcase Feature Eligibility',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#111412]/80 sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#f5a524] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

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

        {/* 13. FAQ */}
        <section className="py-16 bg-[#f3f4f5] border-t border-[#111412]/10 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
                COMMON QUESTIONS
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

      {/* 14. STICKY MOBILE/DESKTOP BAR */}
      <StickyTrainingBar
        cohort={activeCohort}
        activeCountry={country}
        paidCount={confirmedPaidCount}
        onOpenRegister={() => setRegisterOpen(true)}
      />

      {/* 15. REGISTRATION FUNNEL MODAL */}
      <RegistrationModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        cohort={activeCohort}
        initialTrack="creators"
        activeCountry={country}
      />
    </div>
  );
}
