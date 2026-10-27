import React, { useEffect } from 'react';
import { X, CheckCircle2, TrendingUp, Sparkles, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { useStore } from '@/lib/store';
import { assetUrl } from '@/lib/money';

interface Props {
  open: boolean;
  onClose: () => void;
  onAction?: () => void;
}

export function CaseStudyModal({ open, onClose, onAction }: Props) {
  const { content } = useStore();
  const client = content.client;
  const cs = client.caseStudy;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !cs) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${client.name} Case Study`}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-3xl border border-[#111412]/15 bg-[#faf9f4] p-6 text-[#111412] shadow-2xl sm:p-10 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-[#111412]/15 bg-white text-[#111412]/70 transition hover:bg-[#111412] hover:text-white"
          aria-label="Close case study"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Client Header Lockup */}
        <div className="flex items-center gap-3.5 mb-6">
          {client.mark && (
            <img
              src={assetUrl(client.mark)}
              alt={client.name}
              className="h-12 w-12 rounded-xl object-cover border border-[#111412]/10"
            />
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-lg font-bold tracking-tight text-[#111412]">
                {client.name}
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 uppercase">
                {client.badge || 'Repeat Client'}
              </span>
              <span className="font-mono text-[10px] text-[#111412]/50 uppercase tracking-wider">
                {client.sector || 'Fintech'}
              </span>
            </div>
            <p className="text-[11px] text-[#111412]/60 font-mono">
              {client.legalName}
            </p>
          </div>
        </div>

        {/* Case Study Title */}
        <div className="border-b border-[#111412]/10 pb-6">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
            COMMERCIAL CASE STUDY & CAMPAIGN BREAKDOWN
          </span>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[#111412] sm:text-3xl leading-tight">
            {cs.title}
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-[#111412]/70 leading-relaxed">
            {cs.subtitle}
          </p>
        </div>

        {/* Quantified Metrics Grid */}
        <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cs.metrics.map((m, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#111412]/10 bg-white p-4 text-center shadow-sm"
            >
              <span className="block font-display text-2xl font-extrabold text-[#b87508] sm:text-3xl">
                {m.value}
              </span>
              <span className="mt-1 block text-[11px] font-mono uppercase tracking-wider text-[#111412]/60">
                {m.label}
              </span>
            </div>
          ))}
        </div>

        {/* Deep Dive Narrative Sections */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-[#111412]/80">
          {/* 1. Challenge */}
          <div className="rounded-2xl border border-[#111412]/10 bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-[#111412] mb-2 uppercase">
              <span className="grid h-6 w-6 place-items-center rounded bg-red-100 text-red-700 text-xs font-mono font-bold">1</span>
              The Business & Onboarding Challenge
            </h3>
            <p className="text-[#111412]/70 leading-relaxed">
              {cs.challenge}
            </p>
          </div>

          {/* 2. Approach */}
          <div className="rounded-2xl border border-[#111412]/10 bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-[#111412] mb-2 uppercase">
              <span className="grid h-6 w-6 place-items-center rounded bg-[#f5a524]/20 text-[#b87508] text-xs font-mono font-bold">2</span>
              The AdVibe AI Directing Approach
            </h3>
            <p className="text-[#111412]/70 leading-relaxed">
              {cs.approach}
            </p>
          </div>

          {/* 3. Production Process */}
          <div className="rounded-2xl border border-[#111412]/10 bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-[#111412] mb-3 uppercase">
              <span className="grid h-6 w-6 place-items-center rounded bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">3</span>
              Step-by-Step Campaign Production
            </h3>
            <div className="space-y-2.5">
              {cs.process.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#f5a524] shrink-0 mt-0.5" />
                  <span className="text-[#111412]/75">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Deliverables */}
          <div className="rounded-2xl border border-[#111412]/10 bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-[#111412] mb-3 uppercase">
              <span className="grid h-6 w-6 place-items-center rounded bg-purple-100 text-purple-800 text-xs font-mono font-bold">4</span>
              Commercial Campaign Deliverables
            </h3>
            <div className="space-y-2">
              {cs.deliverables.map((del, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <FileText className="h-4 w-4 text-[#b87508] shrink-0 mt-0.5" />
                  <span className="text-[#111412]/75">{del}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Key Learnings & Practical Takeaway */}
          <div className="rounded-2xl border-2 border-[#f5a524]/30 bg-[#f5a524]/10 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-[#9e6203] mb-2 uppercase">
              <Sparkles className="h-4 w-4 text-[#b87508]" />
              The Takeaway for Students & Business Owners
            </h3>
            <p className="text-[#111412]/80 leading-relaxed font-medium">
              {cs.learnings}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-[#111412]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#111412]/50 font-mono text-center sm:text-left">
            Active verified client collaboration · AdVibe Studios Proprietary Directing Pipeline
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-xl border border-[#111412]/20 px-5 py-3 font-display text-xs font-bold uppercase tracking-wider text-[#111412] hover:bg-black/5"
            >
              Close
            </button>
            <a
              href="#pricing"
              onClick={() => {
                onClose();
                if (onAction) onAction();
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#111412] px-6 py-3 font-display text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-[#f5a524] hover:text-black transition"
            >
              <span>{cs.ctaText || 'Learn This Workflow'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
