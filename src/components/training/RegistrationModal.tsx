import React, { useState } from 'react';
import type { TrainingCohort, Country } from '@/content/types';
import { useStore } from '@/lib/store';
import { fmtMoney, waLink } from '@/lib/money';
import { track } from '@/lib/tracking';
import { X, CheckCircle2, ShieldCheck, ArrowRight, MessageSquare, Lock } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  cohort: TrainingCohort;
  initialTrack?: 'business' | 'creators';
  activeCountry: Country;
}

export function RegistrationModal({ open, onClose, cohort, initialTrack = 'business', activeCountry }: Props) {
  const { registerStudent, content } = useStore();
  const [step, setStep] = useState<1 | 2>(1);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(activeCountry.code);
  const [trackChoice, setTrackChoice] = useState<'business' | 'creators'>(initialTrack);
  const [businessName, setBusinessName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate'>('beginner');
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [registeredRef, setRegisteredRef] = useState('');

  if (!open) return null;

  const countryObj = content.countries.find((c) => c.code === selectedCountry) || activeCountry;
  const priceObj = cohort.prices[selectedCountry] || cohort.prices.NG || { founding: 19997, regular: 29997 };
  const foundingPriceFormatted = fmtMoney(priceObj.founding, { symbol: countryObj.symbol });
  const regularPriceFormatted = fmtMoney(priceObj.regular, { symbol: countryObj.symbol });

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim() || !email.trim()) return;

    setBusy(true);
    try {
      const student = await registerStudent({
        cohortId: cohort.id,
        name: name.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        country: selectedCountry,
        track: trackChoice,
        businessName: trackChoice === 'business' ? businessName.trim() : undefined,
        experienceLevel,
        goal: goal.trim() || (trackChoice === 'business' ? 'Create commercial video ads' : 'Master AI cinematography'),
        price: priceObj.founding,
        currency: countryObj.currency,
      });

      setRegisteredRef(student.ref);
      track('InitiateCheckout', { currency: countryObj.currency, value: priceObj.founding });
      setStep(2);
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleFinishToWhatsApp = () => {
    const waNumber = cohort.whatsappContact || content.settings.whatsappNumber;
    const msg = `Hello AdVibe Studios team! 👋\n\nI just registered for *${cohort.name}*!\n\nName: ${name}\nEmail: ${email}\nStudent Ref: ${registeredRef}\nTrack: ${trackChoice === 'business' ? 'Business Owner' : 'Creator / Filmmaker'}\nCountry: ${countryObj.name} (${foundingPriceFormatted})\n\nI have sent my payment / would like to complete my payment verification so I can be added to the live cohort group. Thank you!`;

    const url = waLink(waNumber, msg);
    window.location.hash = `#/training/thank-you?ref=${registeredRef}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&track=${trackChoice}&amount=${encodeURIComponent(foundingPriceFormatted)}`;
    onClose();
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#111416] p-6 text-white shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Close registration"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step Indicator */}
        <div className="mb-6 flex items-center gap-2">
          <span className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-[#f5a524]' : 'bg-white/10'}`} />
          <span className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-[#f5a524]' : 'bg-white/10'}`} />
        </div>

        {step === 1 ? (
          <div>
            <div className="space-y-1">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                STEP 1 OF 2 · ENROLLMENT DETAILS
              </span>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Reserve Your Founding Seat
              </h2>
              <p className="text-xs text-white/60 sm:text-sm">
                Cohort begins {cohort.startDate}. All sessions recorded with lifetime access.
              </p>
            </div>

            {/* Price Badge */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-[#f5a524]/30 bg-[#f5a524]/10 p-3 text-xs sm:text-sm">
              <div>
                <span className="font-semibold text-white/90">Founding Cohort:</span>
                <span className="ml-2 font-display text-base font-bold text-[#f5a524] sm:text-lg">
                  {foundingPriceFormatted}
                </span>
                <span className="ml-2 text-xs font-mono text-white/60">
                  (Future cohorts: {regularPriceFormatted})
                </span>
              </div>
              <span className="rounded-full bg-[#f5a524]/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#f5a524] self-start sm:self-auto">
                FOUNDING PRICE
              </span>
            </div>

            <form onSubmit={handleStep1Submit} className="mt-5 space-y-4">
              {/* Track Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5">
                  Choose Your Learning Track
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTrackChoice('business')}
                    className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                      trackChoice === 'business'
                        ? 'border-[#f5a524] bg-[#f5a524]/15 text-[#f5a524]'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                    }`}
                  >
                    🏢 Business Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackChoice('creators')}
                    className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                      trackChoice === 'creators'
                        ? 'border-[#f5a524] bg-[#f5a524]/15 text-[#f5a524]'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                    }`}
                  >
                    🎬 Creator / Filmmaker
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tunde Adeleke"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                />
              </div>

              {/* WhatsApp & Country */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +234 801 234 5678"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Your Country *
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#181d22] px-4 py-3 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                  >
                    {content.countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Email Address (for calendar & recordings) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. tunde@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                />
              </div>

              {/* Optional Field: Business Name or Creator Goal */}
              {trackChoice === 'business' ? (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Business / Brand Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lumina Fashion Store"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Your Main Goal (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Build an AI commercial portfolio, direct short films"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#f5a524] font-display text-sm font-bold uppercase tracking-wider text-black transition hover:brightness-110 disabled:opacity-50"
              >
                {busy ? (
                  'Saving Your Details…'
                ) : (
                  <>
                    Continue to Payment Options <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-white/50">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Policy: Full refund before cohort begins. 100% refund if AdVibe cancels.</span>
              </p>
            </form>
          </div>
        ) : (
          /* STEP 2: PAYMENT OPTIONS */
          <div>
            <div className="space-y-1">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                STEP 2 OF 2 · COMPLETE YOUR PAYMENT
              </span>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Confirm Your Place
              </h2>
              <p className="text-xs text-white/60 sm:text-sm">
                Student Ref: <strong className="font-mono text-[#f5a524]">{registeredRef}</strong>
              </p>
            </div>

            {/* Summary Box */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs space-y-2">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/60">Registered Student:</span>
                <span className="font-semibold text-white">{name}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/60">Training Program:</span>
                <span className="font-semibold text-white">{cohort.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/60">Track:</span>
                <span className="font-semibold text-[#f5a524] capitalize">{trackChoice}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold">
                <span className="text-white">Amount Due:</span>
                <span className="text-[#f5a524]">{foundingPriceFormatted}</span>
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="mt-5 rounded-2xl border border-[#f5a524]/20 bg-[#f5a524]/5 p-4 text-xs space-y-3">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#f5a524]">
                Payment Instructions for {countryObj.name}:
              </p>
              <div className="whitespace-pre-line text-white/80 leading-relaxed font-mono">
                {countryObj.paymentInstructions ||
                  'Bank Transfer / Online Card\nAccount: AdVibe Studios\nContact WhatsApp immediately after payment.'}
              </div>
              {cohort.paymentUrl ? (
                <div className="pt-2">
                  <a
                    href={cohort.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      window.location.hash = `#/training/thank-you?ref=${registeredRef}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&track=${trackChoice}&amount=${encodeURIComponent(foundingPriceFormatted)}`;
                      onClose();
                    }}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#f5a524] font-display text-sm font-bold uppercase tracking-wider text-black transition hover:brightness-110"
                  >
                    <span>Proceed to Online Checkout ({foundingPriceFormatted})</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <p className="mt-1.5 text-center text-[10px] text-white/50">
                    Secure card & mobile payment · Automatically redirects to WhatsApp verification
                  </p>
                </div>
              ) : null}
            </div>

            {/* WhatsApp Verification Option */}
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={handleFinishToWhatsApp}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 font-display text-xs font-bold uppercase tracking-wider text-black transition hover:bg-emerald-400"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Verify Payment via WhatsApp Directly</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-white/50 hover:text-white pt-1"
              >
                ← Back to edit registration details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
