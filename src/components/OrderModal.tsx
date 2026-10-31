import { useEffect, useMemo, useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, MessageCircle, Copy, Check, Loader2, Sparkles, Lock } from 'lucide-react';
import { useStore, waLink } from '@/lib/store';
import { fmtMoney, getParam, payTextFor, priceFor, unitNote, waNumberFor } from '@/lib/money';
import { useCountry } from '@/lib/country';
import { track } from '@/lib/tracking';
import type { Offer, Lead } from '@/content/types';
import { useReferralStore } from '@/lib/referralStore';
import { DiscountEligibilityModule } from '@/components/referral/DiscountEligibilityModule';
import {
  HOW_HEARD_OPTIONS,
  type StoredAttribution,
} from '@/lib/referral';

interface Props {
  offer: Offer | null;
  eventName?: string;
  onClose: () => void;
  onPickOffer: () => void;
}

const INDUSTRIES = ['Fashion', 'Food & Restaurant', 'Beauty & Skincare', 'Real Estate', 'Finance / Fintech', 'Electronics', 'Events', 'Education', 'Health & Fitness', 'Other'];

const Arrow = () => <span className="btn-arrow" aria-hidden="true"><ArrowRight size={18} strokeWidth={2.4} /></span>;

export function OrderModal({ offer, eventName, onClose, onPickOffer }: Props) {
  const { content, addLead, leads } = useStore();
  const { country, countries, setCountry } = useCountry();
  const rawPrice = offer ? priceFor(offer, country) : undefined;
  const unavailable = Boolean(offer) && rawPrice === undefined; // chosen country doesn't sell this package
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Lead | null>(null);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Referral attribution tracking from ReferralStore
  const {
    attribution,
    claimDiscount,
    setClaimDiscount,
    checkEligibility,
    discountPercent,
  } = useReferralStore();

  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    business: '',
    industry: INDUSTRIES[0],
    product: '',
    event: eventName ?? '',
    notes: '',
    howDidYouHear: attribution?.viaAffiliateLink ? 'Advibe Affiliate Partner Link' : '',
    manualReferralCode: '',
    honey: '',
  });

  const [showPublic, setShowPublic] = useState(true);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const steps = ['Contact', 'Business', 'Your need', 'Review'];

  // Discount eligibility check
  const eligibility = useMemo(() => {
    return checkEligibility({
      email: form.email,
      whatsapp: form.whatsapp,
      offerId: offer?.id,
      price: rawPrice ?? 0,
    });
  }, [checkEligibility, form.email, form.whatsapp, offer?.id, rawPrice]);

  const isDiscountApplied = Boolean(eligibility.isEligible && claimDiscount);
  const effectiveDiscountPercent = isDiscountApplied ? discountPercent : 0;
  const discountAmount = rawPrice && effectiveDiscountPercent > 0 ? Math.round(rawPrice * (effectiveDiscountPercent / 100)) : 0;
  const finalPrice = rawPrice !== undefined ? Math.max(0, rawPrice - discountAmount) : undefined;

  // Auto-sync howDidYouHear if attribution present
  useEffect(() => {
    if (attribution?.viaAffiliateLink && !form.howDidYouHear) {
      setForm((prev) => ({ ...prev, howDidYouHear: 'Advibe Affiliate Partner Link' }));
    }
  }, [attribution, form.howDidYouHear]);

  // Tell Meta the visitor started checkout (once, when the form opens with a package).
  useEffect(() => {
    if (offer && rawPrice !== undefined) track('InitiateCheckout', { value: rawPrice, currency: country.currency, content_name: offer.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const validate = (): boolean => {
    const e: string[] = [];
    if (step === 0) {
      if (unavailable) e.push(`That package isn't available in ${country.name}. Close this window and choose another package.`);
      if (form.name.trim().length < 2) e.push('Please enter your name.');
      if (form.whatsapp.replace(/[^\d]/g, '').length < 7) e.push('Please enter a valid WhatsApp number with country code.');
      if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.push('That email address looks incomplete.');
      if (!form.howDidYouHear || form.howDidYouHear === 'Select an option...') e.push('Please tell us how you heard about Advibe.');
    }
    if (step === 1) {
      if (form.business.trim().length < 2) e.push('Please enter your business name.');
      if (form.product.trim().length < 3) e.push('Tell us in one line what you sell.');
    }
    setErrors(e);
    return e.length === 0;
  };

  const submit = async () => {
    if (sending) return;
    if (form.honey) { onClose(); return; } // spam-bot trap: real people never see this field
    if (!offer || rawPrice === undefined) return;
    setSending(true);
    try {
      const utm = getParam('utm_source');
      const isDiscountApplied = Boolean(claimDiscount && eligibility.isEligible);

      const notesContent = [
        form.notes.trim(),
        `How heard: ${form.howDidYouHear}`,
        attribution ? `Referred by: ${attribution.code} (${attribution.affiliateName || 'Partner'}) [Affiliate Link]` : 'Direct',
        isDiscountApplied ? `Claimed ${effectiveDiscountPercent}% First-Time Referral Discount (Partner: ${attribution?.code})` : '',
      ].filter(Boolean).join(' · ');

      const lead = await addLead({
        name: form.name.trim(),
        business: form.business.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        offerId: offer.id,
        offerName: offer.name,
        price: finalPrice ?? rawPrice,
        industry: form.industry,
        product: form.product.trim(),
        event: form.event || 'None',
        notes: notesContent,
        utmSource: utm,
        country: country.code,
        currency: country.currency,
        source: 'website',
        showPublic,
        referralCode: attribution?.code,
        affiliateId: attribution?.affiliateId,
        referralSource: attribution?.viaAffiliateLink ? 'affiliate_link' : 'direct',
        discountClaimed: isDiscountApplied,
        discountPercent: isDiscountApplied ? effectiveDiscountPercent : undefined,
        discountAmount: isDiscountApplied ? discountAmount : undefined,
        howDidYouHear: form.howDidYouHear,
        isFirstTimeCustomer: true,
      }, country.name);
      setDone(lead);
    } finally {
      setSending(false);
    }
  };

  const waMsg = useMemo(() => {
    if (!done || !offer) return '';

    // If customer claimed 5% discount through referral link
    if (done.discountClaimed) {
      return `Hello Advibe!\n\nMy name is ${done.name}, and I represent ${done.business}.\n\nI have just submitted my order for ${done.offerName}.\n\nI came through an Advibe referral link and have successfully claimed my exclusive 5% first-time customer discount.\n\nMy booking reference is ${done.ref}.\n\nThank you!`;
    }

    return content.settings.whatsappMessage
      .replace('{name}', done.name).replace('{business}', done.business)
      .replace('{offer}', done.offerName).replace('{ref}', done.ref);
  }, [done, offer, content.settings.whatsappMessage]);

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Order form">
      <div className="modal anim-slide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <div>
            <p className="modal-kicker">{done ? 'Order received' : offer ? 'Your package' : 'Start your order'}</p>
            {!done && offer && (
              <p className="modal-title">
                {offer.name} <small>· {rawPrice !== undefined ? fmtMoney(rawPrice, country) : 'not sold here'} · {unitNote(offer, country)}</small>
              </p>
            )}
          </div>
          <button onClick={onClose} className="close-btn" aria-label="Close"><X size={20} /></button>
        </div>

        {done ? (
          <div className="form-stack" style={{ gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <CheckCircle2 size={44} style={{ color: 'rgb(var(--accent))', flex: 'none' }} />
              <div>
                <p className="modal-title">We've received your request.</p>
                <p style={{ color: 'rgb(var(--muted))', fontSize: 15 }}>Reference: <strong style={{ color: 'rgb(var(--ink))' }}>{done.ref}</strong></p>
              </div>
            </div>

            {done.discountClaimed && (
              <div
                style={{
                  background: 'rgba(245,165,36,0.12)',
                  border: '1.5px solid #f5a524',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Sparkles size={20} style={{ color: '#b87508', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 800, fontSize: 13, color: '#9e6203', margin: 0 }}>
                    5% Exclusive Referral Discount Applied!
                  </p>
                  <p style={{ fontSize: 12, color: 'rgb(var(--ink-2))', margin: '2px 0 0' }}>
                    Final total: <strong style={{ color: '#9e6203' }}>{fmtMoney(done.price, country)}</strong> (Saved {fmtMoney(done.discountAmount || 0, country)})
                  </p>
                </div>
              </div>
            )}

            <div className="card-soft">
              <p style={{ fontWeight: 700, marginBottom: 4 }}>Pay now</p>
              <p style={{ color: 'rgb(var(--ink-2))' }}>{payTextFor(content.settings.paymentInstructions, country)}</p>
              <button
                onClick={() => { navigator.clipboard?.writeText(done.ref); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="btn-back" style={{ minHeight: 44, marginTop: 14, fontSize: 14 }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />} Copy reference {done.ref}
              </button>
            </div>
            <a className="btn-studio is-brand" style={{ justifyContent: 'center', padding: '0 26px' }}
              href={waLink(waNumberFor(content.settings.whatsappNumber, country), waMsg)} target="_blank" rel="noreferrer" onClick={() => track('Contact')}>
              <MessageCircle size={20} /> <span>Continue on WhatsApp</span>
            </a>
            <p style={{ textAlign: 'center', fontSize: 13.5, color: 'rgb(var(--muted))' }}>Your order details are pre-filled in the message.</p>
          </div>
        ) : !offer ? (
          <div className="form-stack">
            <p style={{ color: 'rgb(var(--ink-2))' }}>Choose a package first — it takes 10 seconds.</p>
            <button onClick={onPickOffer} className="btn-studio"><span>View packages</span><Arrow /></button>
          </div>
        ) : (
          <>
            <div className="progress">
              {steps.map((s, i) => (
                <div key={s}><i className={i <= step ? 'on' : ''} /><p className={i === step ? 'cur' : ''}>{s}</p></div>
              ))}
            </div>

            <div key={step} className="form-stack anim-step">
                {step === 0 && (
                  <>
                    <label className="field-label" htmlFor="f-country">Country</label>
                    <select id="f-country" className="field" value={country.code} onChange={(e) => setCountry(e.target.value)}>
                      {countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.currency})</option>)}
                    </select>
                    {unavailable && <div className="err-box" style={{ marginTop: 0 }}>This package isn't sold in {country.name}. Close this window and pick another package, or choose a different country.</div>}
                    <input className="field" placeholder="Full name *" value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
                    <input className="field" placeholder="WhatsApp number (with country code) *" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} inputMode="tel" autoComplete="tel" />
                    <input className="field" placeholder="Email (optional — for updates & offers)" value={form.email} onChange={(e) => set('email', e.target.value)} inputMode="email" autoComplete="email" />

                    {/* COMPULSORY: "How did you hear about Advibe?" Question */}
                    <div>
                      <label className="field-label" htmlFor="f-how-heard" style={{ marginBottom: 4, display: 'block' }}>
                        How did you hear about Advibe? *
                      </label>
                      <select
                        id="f-how-heard"
                        className="field"
                        value={form.howDidYouHear}
                        onChange={(e) => set('howDidYouHear', e.target.value)}
                        style={{ fontWeight: form.howDidYouHear ? 600 : 400 }}
                      >
                        {HOW_HEARD_OPTIONS.map((opt) => (
                          <option key={opt} value={opt === 'Select an option...' ? '' : opt} disabled={opt === 'Select an option...'}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* REFERRAL ATTRIBUTION & BROAD PARTNER REFERRAL NOTIFICATION */}
                    <DiscountEligibilityModule
                      offerId={offer?.id}
                      offerTitle={offer?.name}
                      rawPrice={rawPrice}
                      customerEmail={form.email}
                      customerWhatsapp={form.whatsapp}
                    />

                    <label className="check-row">
                      <input type="checkbox" checked={showPublic} onChange={(e) => setShowPublic(e.target.checked)} />
                      <span>Show my first name and country in the “just started” notice on this site <small>(optional — tick off to stay private)</small></span>
                    </label>
                    <input style={{ position: 'absolute', left: '-9999px' }} tabIndex={-1} autoComplete="off" value={form.honey} onChange={(e) => set('honey', e.target.value)} aria-hidden="true" name="website" />
                  </>
                )}
                {step === 1 && (
                  <>
                    <input className="field" placeholder="Business name *" value={form.business} onChange={(e) => set('business', e.target.value)} autoComplete="organization" />
                    <select className="field" value={form.industry} onChange={(e) => set('industry', e.target.value)}>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <input className="field" placeholder="What do you sell? (one line) *" value={form.product} onChange={(e) => set('product', e.target.value)} />
                  </>
                )}
                {step === 2 && (
                  <>
                    <select className="field" value={form.event} onChange={(e) => set('event', e.target.value)}>
                      <option value="">No specific event / deadline</option>
                      {content.campaigns.filter((c) => c.active).map((c) => (
                        <option key={c.id} value={c.name}>{c.name} — {new Date(c.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    <textarea className="field" style={{ minHeight: 120, resize: 'none' }} placeholder="Notes: link to product photos (Drive / Instagram), preferred tone, target audience…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
                  </>
                )}
                {step === 3 && (
                  <div className="card-soft">
                    {/* Dedicated Discount Eligibility Module */}
                    <DiscountEligibilityModule
                      offerId={offer.id}
                      offerTitle={offer.name}
                      rawPrice={rawPrice}
                      customerEmail={form.email}
                      customerWhatsapp={form.whatsapp}
                      className="mb-4"
                    />

                    {[
                      ['Package', `${offer.name}`],
                      ['Price', rawPrice !== undefined ? (
                        discountAmount > 0 && finalPrice !== undefined ? (
                          <span>
                            <span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: 6 }}>{fmtMoney(rawPrice, country)}</span>
                            <span style={{ color: '#9e6203', fontWeight: 800 }}>{fmtMoney(finalPrice, country)} (-5%)</span>
                          </span>
                        ) : (
                          fmtMoney(rawPrice, country)
                        )
                      ) : '—'],
                      ['Country', `${country.flag} ${country.name}`],
                      ['Name', form.name], ['WhatsApp', form.whatsapp],
                      ...(form.email ? [['Email', form.email]] : []),
                      ['Business', `${form.business} (${form.industry})`],
                      ['Selling', form.product], ['Event', form.event || 'None'],
                    ].map(([k, v]) => <div key={k as string} className="row-kv"><span>{k}</span><span>{v}</span></div>)}
                    <p style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgb(var(--line))', fontSize: 13.5, color: 'rgb(var(--muted))' }}>
                      Includes {offer.included[0]?.toLowerCase()}. Full terms are confirmed before production starts.
                    </p>
                  </div>
                )}
            </div>

            {errors.length > 0 && <div className="err-box">{errors.map((e) => <p key={e}>{e}</p>)}</div>}

            <div className="modal-actions">
              {step > 0 && <button onClick={() => { setErrors([]); setStep(step - 1); }} className="btn-back"><ArrowLeft size={18} /> Back</button>}
              {step < 3 ? (
                <button onClick={() => validate() && setStep(step + 1)} className="btn-studio"><span>Continue</span><Arrow /></button>
              ) : (
                <button onClick={submit} disabled={sending} className="btn-studio">
                  <span>{sending ? 'Sending…' : claimDiscount && eligibility.isEligible ? 'Submit with 5% Discount' : 'Submit order'}</span>
                  <span className="btn-arrow" aria-hidden="true">{sending ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} strokeWidth={2.4} />}</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
