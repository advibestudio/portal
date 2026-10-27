import React from 'react';
import { Briefcase, Film, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function TrainingSelector() {
  return (
    <div className="min-h-dvh bg-[#faf9f4] text-[#111412] antialiased">
      {/* Top Header */}
      <header className="border-b border-[#111412]/10 bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="#/" className="flex items-center gap-2 text-inherit no-underline">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#111412] text-white">
              <i style={{ width: 0, height: 0, borderLeft: '9px solid #f5a524', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', marginLeft: '2px' }} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">AdVibe Studios</span>
          </a>
          <span className="rounded-full border border-[#111412]/15 bg-white px-3 py-1 font-mono text-xs font-semibold text-[#111412]/70">
            Intensive Training Portal
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#f5a524]/40 bg-[#f5a524]/10 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#b87508]">
          <Sparkles className="h-3.5 w-3.5" />
          The AdVibe AI Cinematography Intensive
        </div>

        {/* Heading */}
        <h1 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-[#111412] sm:text-5xl">
          Choose Your Path To AI Video Mastery.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-[#111412]/65 sm:text-lg">
          Both tracks cover our proven 6-session AI cinematography curriculum, but are tailored to your specific commercial or creative goals.
        </p>

        {/* Two Options Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2 sm:gap-8">
          {/* Card 1: Business Owner */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-[#111412]/15 bg-white p-7 shadow-xl shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-[#f5a524] hover:shadow-2xl">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111412] text-[#f5a524]">
                <Briefcase className="h-6 w-6" />
              </div>
              <span className="inline-block rounded-full bg-[#f5a524]/15 px-3 py-1 font-mono text-[11px] font-bold text-[#b87508]">
                TRACK 01 · FOR BRANDS & STORES
              </span>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#111412] group-hover:text-[#b87508]">
                I'm a Business Owner
              </h2>
              <p className="text-sm leading-relaxed text-[#111412]/70">
                I want to learn how to create high-converting promotional video ads and product reels for my business without depending on expensive production crews or waiting weeks for edits.
              </p>

              <div className="space-y-2 pt-2 border-t border-[#111412]/10">
                <div className="flex items-center gap-2 text-xs text-[#111412]/80">
                  <CheckCircle2 className="h-4 w-4 text-[#f5a524]" />
                  <span>Product motion ads & e-commerce showcases</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#111412]/80">
                  <CheckCircle2 className="h-4 w-4 text-[#f5a524]" />
                  <span>UGC & AI influencer customer acquisition</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#111412]/80">
                  <CheckCircle2 className="h-4 w-4 text-[#f5a524]" />
                  <span>Tested direct-response ad hooks & scripts</span>
                </div>
              </div>
            </div>

            <a
              href="#/training/business"
              className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-[#111412] py-3.5 px-6 font-display text-sm font-bold uppercase tracking-wider text-white transition group-hover:bg-[#f5a524] group-hover:text-black"
            >
              <span>Continue As Business Owner</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Card 2: Creator / Filmmaker */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-[#111412]/15 bg-white p-7 shadow-xl shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-[#f5a524] hover:shadow-2xl">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111412] text-[#f5a524]">
                <Film className="h-6 w-6" />
              </div>
              <span className="inline-block rounded-full bg-[#f5a524]/15 px-3 py-1 font-mono text-[11px] font-bold text-[#b87508]">
                TRACK 02 · FOR DIRECTORS & CREATORS
              </span>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#111412] group-hover:text-[#b87508]">
                I'm a Creator
              </h2>
              <p className="text-sm leading-relaxed text-[#111412]/70">
                I want to master AI cinematography, direct cinematic short films and commercials, maintain character consistency, and build a world-class creative portfolio.
              </p>

              <div className="space-y-2 pt-2 border-t border-[#111412]/10">
                <div className="flex items-center gap-2 text-xs text-[#111412]/80">
                  <CheckCircle2 className="h-4 w-4 text-[#f5a524]" />
                  <span>Consistent character faces, voices & worlds</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#111412]/80">
                  <CheckCircle2 className="h-4 w-4 text-[#f5a524]" />
                  <span>Directing cinematic short films & commercials</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#111412]/80">
                  <CheckCircle2 className="h-4 w-4 text-[#f5a524]" />
                  <span>Freelance client workflows & AdVibe agency priority</span>
                </div>
              </div>
            </div>

            <a
              href="#/training/creators"
              className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-[#111412] py-3.5 px-6 font-display text-sm font-bold uppercase tracking-wider text-white transition group-hover:bg-[#f5a524] group-hover:text-black"
            >
              <span>Continue As Creator</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Footer Guarantee Note */}
        <div className="mt-12 inline-flex items-center gap-2 text-xs text-[#111412]/50">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Founding Cohort Limited to 100 Students · 6 Live Sessions · Lifetime Community</span>
        </div>
      </main>
    </div>
  );
}
