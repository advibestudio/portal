import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { waLink } from '@/lib/money';
import { CheckCircle2, MessageSquare, ShieldCheck, ArrowRight, Calendar, Users } from 'lucide-react';

export default function TrainingThankYou() {
  const { activeCohort, content } = useStore();
  const [params, setParams] = useState({
    ref: '',
    name: '',
    email: '',
    track: 'business',
    amount: '',
  });

  useEffect(() => {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const q = new URLSearchParams(hash.slice(qIndex));
      setParams({
        ref: q.get('ref') || 'ADV-TRN',
        name: q.get('name') || 'Student',
        email: q.get('email') || '',
        track: q.get('track') || 'business',
        amount: q.get('amount') || '',
      });
    }
  }, []);

  const waNumber = activeCohort.whatsappContact || content.settings.whatsappNumber;
  const waMsg = `Hello AdVibe Studios! 👋\n\nI just completed my registration for *${activeCohort.name}*!\n\nName: ${params.name}\nEmail: ${params.email}\nRef: ${params.ref}\nTrack: ${params.track}\nAmount: ${params.amount}\n\nHere is my confirmation. Please verify and add me to the private student cohort group!`;

  const waUrl = waLink(waNumber, waMsg);

  return (
    <div className="min-h-dvh bg-[#faf9f4] text-[#111412] antialiased">
      {/* Header */}
      <header className="border-b border-[#111412]/10 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="#/" className="flex items-center gap-2 text-inherit no-underline">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#111412] text-white">
              <i style={{ width: 0, height: 0, borderLeft: '9px solid #f5a524', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', marginLeft: '2px' }} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">AdVibe Studios</span>
          </a>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-700">
            ✓ Registration Recorded
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-[#111412] sm:text-4xl">
          You're Almost In!
        </h1>
        <p className="mt-2 text-base text-[#111412]/70 sm:text-lg">
          We have recorded your registration for <strong className="text-[#111412]">{activeCohort.name}</strong>.
        </p>

        {/* Verification Step Box */}
        <div className="mt-8 rounded-3xl border border-[#f5a524]/40 bg-white p-6 shadow-xl sm:p-8 text-left">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#b87508]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f5a524] text-black">1</span>
            FINAL STEP: VERIFY ON WHATSAPP
          </div>
          <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-[#111412]">
            Send your proof of payment to our team
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#111412]/70 sm:text-sm">
            Because seats are limited to {activeCohort.seatCapacity || 100} students, our operations team manually verifies each transfer to assign your student ID and add you directly to the private WhatsApp cohort group.
          </p>

          {/* Student details card */}
          <div className="mt-5 rounded-2xl border border-[#111412]/10 bg-[#faf9f4] p-4 text-xs font-mono space-y-2">
            <div className="flex justify-between">
              <span className="text-[#111412]/50">Student Name:</span>
              <span className="font-bold text-[#111412]">{params.name || 'Student'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#111412]/50">Reference ID:</span>
              <span className="font-bold text-[#b87508]">{params.ref || 'ADV-TRN'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#111412]/50">Track:</span>
              <span className="font-bold text-[#111412] capitalize">{params.track}</span>
            </div>
            {params.amount && (
              <div className="flex justify-between border-t border-[#111412]/10 pt-2">
                <span className="text-[#111412]/50">Amount:</span>
                <span className="font-bold text-emerald-700">{params.amount}</span>
              </div>
            )}
          </div>

          {/* WhatsApp CTA Button */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-display text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
          >
            <MessageSquare className="h-5 w-5" />
            <span>Open WhatsApp to Confirm Seat</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Schedule & Information */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 text-left">
          <div className="rounded-2xl border border-[#111412]/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#111412]">
              <Calendar className="h-4 w-4 text-[#f5a524]" />
              <span>Training Schedule</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#111412]/60">
              Starts {activeCohort.startDate}. 6 live sessions (Tuesdays, Thursdays & Saturdays). High-definition recordings uploaded after every class.
            </p>
          </div>

          <div className="rounded-2xl border border-[#111412]/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#111412]">
              <Users className="h-4 w-4 text-[#f5a524]" />
              <span>Cohort Community</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#111412]/60">
              Once verified on WhatsApp, you receive your direct invite to the student cohort room and live Google Meet / Zoom links.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <a href="#/" className="text-xs font-medium text-[#111412]/50 hover:text-[#111412] underline">
            ← Back to AdVibe Studios Home
          </a>
        </div>
      </main>
    </div>
  );
}
