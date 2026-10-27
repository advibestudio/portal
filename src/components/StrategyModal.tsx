import { useEffect, useMemo, useState } from 'react';
import { X, ArrowRight, CheckCircle2, MessageCircle, Calendar, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';
import { useStore, waLink } from '@/lib/store';
import { fmtMoney, getParam, waNumberFor } from '@/lib/money';
import { useCountry } from '@/lib/country';
import { track } from '@/lib/tracking';
import type { Lead } from '@/content/types';

interface StrategyModalProps {
  onClose: () => void;
  offerId?: string;
  offerTitle?: string;
  configuredPrice?: number;
  configuredQty?: number;
  bookingUrl?: string;
}

/**
 * STRATEGY SESSION & COMMERCIAL OFFER LEAD MODAL
 * -----------------------------------------------
 * Captures lead details securely first, then displays options to:
 * 1. Book a Strategy Call directly on the configured scheduling calendar
 * 2. Continue on WhatsApp with pre-filled message using configured price & quantity.
 */
export function StrategyModal({
  onClose,
  offerId = 'strategy',
  offerTitle,
  configuredPrice,
  configuredQty = 15,
  bookingUrl,
}: StrategyModalProps) {
  const { content, addLead } = useStore();
  const { country, countries, setCountry } = useCountry();

  const isCommercial = offerId === 'monthly-content' || offerId === 'promotional-mini-series';
  const effectiveOfferName = offerTitle || (
    offerId === 'monthly-content'
      ? 'Monthly AI Video Content Retainer'
      : offerId === 'promotional-mini-series'
      ? 'AI Promotional Mini Series'
      : 'Free Strategy Session'
  );

  const priceValue = configuredPrice !== undefined ? configuredPrice : (isCommercial ? 200000 : 0);
  const formattedPrice = fmtMoney(priceValue, country);

  const [f, setF] = useState({
    name: '',
    whatsapp: '',
    email: '',
    business: '',
    product: '',
    goal: '',
    consent: true,
    honey: '',
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Lead | null>(null);

  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
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
  }, [onClose]);

  const submit = async () => {
    if (sending) return;
    const e: string[] = [];
    if (f.name.trim().length < 2) e.push('Please enter your full name.');
    if (f.whatsapp.replace(/[^\d]/g, '').length < 7) {
      e.push('Please enter a valid WhatsApp number with country code.');
    }
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) {
      e.push('That email address looks incomplete.');
    }
    if (f.business.trim().length < 2) {
      e.push('Please enter your business or brand name.');
    }
    if (!f.consent) {
      e.push('Please confirm you agree to be contacted regarding this request.');
    }

    setErrors(e);
    if (e.length) return;
    if (f.honey) {
      onClose();
      return;
    } // spam-bot trap

    setSending(true);
    try {
      const notesContent = [
        f.product ? `Sells/Promoting: ${f.product}` : '',
        f.goal ? `Content Goal: ${f.goal}` : '',
        `Configured Price: ${formattedPrice}/mo`,
        `Quantity: ${configuredQty} videos/mo`,
      ].filter(Boolean).join(' · ');

      const lead = await addLead(
        {
          name: f.name.trim(),
          business: f.business.trim(),
          whatsapp: f.whatsapp.trim(),
          email: f.email.trim(),
          offerId: offerId,
          offerName: effectiveOfferName,
          price: priceValue,
          industry: '',
          product: f.product.trim() || f.goal.trim() || effectiveOfferName,
          event: 'None',
          notes: notesContent,
          utmSource: getParam('utm_source'),
          country: country.code,
          currency: country.currency,
          source: offerId,
          showPublic: false,
        },
        country.name
      );
      setDone(lead);
    } finally {
      setSending(false);
    }
  };

  // Phase 10 URL-encoded WhatsApp message formatting
  const waMsg = useMemo(() => {
    if (!done) return '';
    const goalText = f.goal.trim() || f.product.trim() || 'consistent high-converting video content';

    if (isCommercial) {
      return `Hello AdVibe Studios. My name is ${done.name}, and I represent ${done.business}. I'm interested in your ${effectiveOfferName} package at ${formattedPrice} per month, which includes ${configuredQty} videos monthly. My main goal is ${goalText}. I'd like to discuss how this could work for my business. (Ref: ${done.ref})`;
    }

    return `Hi ${content.settings.whatsappDisplay}, I'm ${done.name} from ${done.business} (${country.name}). I just submitted a strategy request for: ${done.product}. Ref: ${done.ref}.`;
  }, [done, f.goal, f.product, isCommercial, effectiveOfferName, formattedPrice, configuredQty, content.settings.whatsappDisplay, country.name]);

  const targetBookingUrl = bookingUrl || content.settings.bookingUrl || 'https://cal.com/advibe-studio/strategy-call';

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Strategy session booking">
      <div className="modal anim-slide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <div>
            <p className="modal-kicker">
              {done ? 'Request Confirmed' : isCommercial ? effectiveOfferName : 'Free Strategy Session'}
            </p>
            {!done && (
              <p className="modal-title">
                {isCommercial
                  ? 'Let’s discuss your 15-video monthly production plan.'
                  : 'Tell us a little, then chat with our team.'}
              </p>
            )}
          </div>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="form-stack" style={{ gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <CheckCircle2 size={44} style={{ color: 'rgb(var(--accent))', flex: 'none' }} />
              <div>
                <p className="modal-title">Thanks {done.name.split(' ')[0]} — details received!</p>
                <p style={{ color: 'rgb(var(--muted))', fontSize: 14 }}>
                  Reference code: <strong style={{ color: 'rgb(var(--ink))' }}>{done.ref}</strong> · {done.business}
                </p>
              </div>
            </div>

            <div className="card-soft" style={{ background: '#fff' }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'rgb(var(--ink))' }}>
                Next Step: Select your preferred way to connect
              </p>
              <p style={{ color: 'rgb(var(--ink-2))', fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>
                You can instantly pick a convenient strategy call slot on our calendar, or chat directly with our creative directing team on WhatsApp right now.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {/* Primary: Calendar Booking */}
              <a
                className="btn-studio"
                style={{ justifyContent: 'center', padding: '0 24px' }}
                href={targetBookingUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => track('Contact', { type: 'booking_link', offer: effectiveOfferName })}
              >
                <Calendar size={18} />
                <span>Book Strategy Call on Calendar</span>
                <ExternalLink size={15} style={{ opacity: 0.6 }} />
              </a>

              {/* Direct: WhatsApp */}
              <a
                className="btn-studio is-brand"
                style={{ justifyContent: 'center', padding: '0 24px' }}
                href={waLink(waNumberFor(content.settings.whatsappNumber, country), waMsg)}
                target="_blank"
                rel="noreferrer"
                onClick={() => track('Contact', { type: 'whatsapp_handoff', offer: effectiveOfferName })}
              >
                <MessageCircle size={20} />
                <span>Continue on WhatsApp</span>
              </a>
            </div>

            <p style={{ textAlign: 'center', fontSize: 12.5, color: 'rgb(var(--muted))' }}>
              Your details and reference code are pre-typed into the WhatsApp message.
            </p>
          </div>
        ) : (
          <>
            <div className="form-stack">
              <label className="field-label" htmlFor="s-country">Country & Currency</label>
              <select
                id="s-country"
                className="field"
                value={country.code}
                onChange={(e) => setCountry(e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.currency})
                  </option>
                ))}
              </select>

              {isCommercial && (
                <div
                  className="card-soft"
                  style={{
                    background: '#f8f8f6',
                    padding: '10px 14px',
                    fontSize: 13,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'rgb(var(--ink))' }}>{effectiveOfferName}</span>
                  <span style={{ fontWeight: 800, color: '#9e6203' }}>
                    {formattedPrice}/mo · {configuredQty} videos
                  </span>
                </div>
              )}

              <input
                className="field"
                placeholder="Full name *"
                value={f.name}
                onChange={(e) => set('name', e.target.value)}
                autoComplete="name"
              />

              <input
                className="field"
                placeholder="WhatsApp number (with country code) *"
                value={f.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />

              <input
                className="field"
                placeholder="Business or brand name *"
                value={f.business}
                onChange={(e) => set('business', e.target.value)}
                autoComplete="organization"
              />

              <input
                className="field"
                placeholder={isCommercial ? "What products/services do you offer?" : "What do you want to promote? *"}
                value={f.product}
                onChange={(e) => set('product', e.target.value)}
              />

              <input
                className="field"
                placeholder="Main video content goal or challenge"
                value={f.goal}
                onChange={(e) => set('goal', e.target.value)}
              />

              <input
                className="field"
                placeholder="Email address (optional)"
                value={f.email}
                onChange={(e) => set('email', e.target.value)}
                inputMode="email"
                autoComplete="email"
              />

              <label className="check-row" style={{ marginTop: 2 }}>
                <input
                  type="checkbox"
                  checked={f.consent}
                  onChange={(e) => set('consent', e.target.checked)}
                />
                <span style={{ fontSize: 12.5, color: 'rgb(var(--ink-2))' }}>
                  I agree to be contacted via WhatsApp/email by AdVibe Studios regarding this request.
                </span>
              </label>

              <input
                style={{ position: 'absolute', left: '-9999px' }}
                tabIndex={-1}
                autoComplete="off"
                value={f.honey}
                onChange={(e) => set('honey', e.target.value)}
                aria-hidden="true"
                name="website"
              />
            </div>

            {errors.length > 0 && (
              <div className="err-box">
                {errors.map((e) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button onClick={submit} disabled={sending} className="btn-studio">
                <span>{sending ? 'Submitting…' : 'Proceed to Schedule & WhatsApp'}</span>
                <span className="btn-arrow" aria-hidden="true">
                  {sending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ArrowRight size={18} strokeWidth={2.4} />
                  )}
                </span>
              </button>
            </div>

            <p style={{ marginTop: 12, textAlign: 'center', fontSize: 12.5, color: 'rgb(var(--muted))' }}>
              Free consultation · No obligation · All scripts & briefs approved before production
            </p>
          </>
        )}
      </div>
    </div>
  );
}
