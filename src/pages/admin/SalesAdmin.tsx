import React, { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, RotateCcw, Video, Film, Sparkles, ExternalLink, HelpCircle } from 'lucide-react';
import type { SiteContent, SalesOffer, SalesFaq } from '@/content/types';
import { defaultSalesPages } from '@/content/salesDefaults';

type SetFn = (fn: (d: SiteContent) => void) => void;

const inputCls =
  'w-full min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/45 font-mono';
const boxCls = 'space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 text-left';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-white/40">{hint}</span>}
    </label>
  );
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[38px] shrink-0 rounded-full px-4 text-xs font-bold uppercase transition ${
        on ? 'bg-[#f5a524] text-black shadow-md' : 'border border-white/20 text-white/60 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export function SalesAdminTab({ draft, set }: { draft: SiteContent; set: SetFn }) {
  const [subTab, setSubTab] = useState<'offers' | 'home' | 'settings'>('offers');
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);

  // Guarantee salesPages exists
  const sp = draft.salesPages || defaultSalesPages;
  const currentOffer = sp.offers[activeOfferIndex] || sp.offers[0] || defaultSalesPages.offers[0];

  const updateOffer = (fn: (o: SalesOffer) => void) => {
    set((d) => {
      if (!d.salesPages) d.salesPages = structuredClone(defaultSalesPages);
      if (!d.salesPages.offers[activeOfferIndex]) {
        d.salesPages.offers[activeOfferIndex] = structuredClone(currentOffer);
      }
      fn(d.salesPages.offers[activeOfferIndex]);

      // Synchronize with commercialOffers for seamless dual compatibility
      if (d.commercialOffers && currentOffer) {
        const commOffer = d.commercialOffers[currentOffer.id as 'monthly-content' | 'promotional-mini-series'];
        if (commOffer) {
          commOffer.price = d.salesPages.offers[activeOfferIndex].price;
          commOffer.monthlyVideoQuantity = d.salesPages.offers[activeOfferIndex].quantity;
          commOffer.shortLabel = d.salesPages.offers[activeOfferIndex].shortLabel;
          commOffer.active = d.salesPages.offers[activeOfferIndex].active;
          commOffer.showOnHomepage = d.salesPages.offers[activeOfferIndex].showOnHome;
        }
      }
    });
  };

  const updateHome = (fn: (h: typeof defaultSalesPages.home) => void) => {
    set((d) => {
      if (!d.salesPages) d.salesPages = structuredClone(defaultSalesPages);
      fn(d.salesPages.home);
    });
  };

  const updateSettings = (fn: (s: typeof defaultSalesPages.settings) => void) => {
    set((d) => {
      if (!d.salesPages) d.salesPages = structuredClone(defaultSalesPages);
      fn(d.salesPages.settings);
    });
  };

  const resetAll = () => {
    if (window.confirm('Reset all Sales Pages & Offers content to original defaults?')) {
      set((d) => {
        d.salesPages = structuredClone(defaultSalesPages);
      });
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header & Sub-navigation */}
      <div className={boxCls}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              SALES PAGES & COMMERCIAL OFFERS
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Sales Pages &amp; Studio Plans
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Manage the 2 sales pages (Monthly Retainer &amp; Brand Miniseries), homepage Studio Plans cards, pricing, and booking links.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetAll}
              className="flex min-h-[40px] items-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to Defaults
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setSubTab('offers')}
            className={`min-h-[40px] rounded-full px-4 text-xs font-bold uppercase tracking-wider transition ${
              subTab === 'offers' ? 'bg-[#f5a524] text-black shadow-md' : 'border border-white/15 text-white/60 hover:text-white'
            }`}
          >
            Offer Pages ({sp.offers.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('home')}
            className={`min-h-[40px] rounded-full px-4 text-xs font-bold uppercase tracking-wider transition ${
              subTab === 'home' ? 'bg-[#f5a524] text-black shadow-md' : 'border border-white/15 text-white/60 hover:text-white'
            }`}
          >
            Homepage Studio Plans Block
          </button>
          <button
            type="button"
            onClick={() => setSubTab('settings')}
            className={`min-h-[40px] rounded-full px-4 text-xs font-bold uppercase tracking-wider transition ${
              subTab === 'settings' ? 'bg-[#f5a524] text-black shadow-md' : 'border border-white/15 text-white/60 hover:text-white'
            }`}
          >
            Shared Settings &amp; UI Text
          </button>
        </div>
      </div>

      {/* SUBTAB 1: OFFERS */}
      {subTab === 'offers' && (
        <div className="space-y-6">
          {/* Offer switcher pills */}
          <div className="flex gap-2 border-b border-white/10 pb-4 flex-wrap">
            {sp.offers.map((offer, idx) => (
              <button
                key={offer.id}
                type="button"
                onClick={() => setActiveOfferIndex(idx)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                  activeOfferIndex === idx
                    ? 'bg-[#f5a524] text-black shadow-md'
                    : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {offer.kind === 'miniseries' ? <Film className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                <span>{offer.shortLabel}</span>
                <span className="opacity-50 text-[10px]">({offer.slug})</span>
              </button>
            ))}
          </div>

          {currentOffer && (
            <div className="space-y-6">
              {/* Top controls: visibility, links */}
              <div className={boxCls}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold uppercase text-white">{currentOffer.name}</h3>
                    <p className="text-xs text-white/50 font-mono">Route: #/{currentOffer.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill on={currentOffer.active} onClick={() => updateOffer((o) => { o.active = !o.active; })}>
                      {currentOffer.active ? 'Offer Active' : 'Offer Disabled'}
                    </Pill>
                    <Pill on={currentOffer.showOnHome} onClick={() => updateOffer((o) => { o.showOnHome = !o.showOnHome; })}>
                      {currentOffer.showOnHome ? 'Shown on Homepage' : 'Hidden from Homepage'}
                    </Pill>
                    <a
                      href={`#/${currentOffer.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      <ExternalLink className="h-3 w-3" /> Preview Page
                    </a>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 pt-2">
                  <Field label="URL Slug" hint="Example: monthly-content or promotional-mini-series">
                    <input
                      className={inputCls}
                      value={currentOffer.slug}
                      onChange={(e) => updateOffer((o) => { o.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''); })}
                    />
                  </Field>
                  <Field label="Short Navigation Label">
                    <input
                      className={inputCls}
                      value={currentOffer.shortLabel}
                      onChange={(e) => updateOffer((o) => { o.shortLabel = e.target.value; })}
                    />
                  </Field>
                  <Field label="Offer Kind">
                    <select
                      className={inputCls}
                      value={currentOffer.kind}
                      onChange={(e) => updateOffer((o) => { o.kind = e.target.value as 'retainer' | 'miniseries'; })}
                    >
                      <option value="retainer" className="bg-neutral-900">Retainer (warm studio theme)</option>
                      <option value="miniseries" className="bg-neutral-900">Miniseries (dark cinematic theme)</option>
                    </select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Base Price (NGN)" hint="Single source of truth for base pricing">
                    <input
                      type="number"
                      className={inputCls}
                      value={currentOffer.price}
                      onChange={(e) => updateOffer((o) => { o.price = Number(e.target.value) || 0; })}
                    />
                  </Field>
                  <Field label="Monthly Video Quantity">
                    <input
                      type="number"
                      className={inputCls}
                      value={currentOffer.quantity}
                      onChange={(e) => updateOffer((o) => { o.quantity = Number(e.target.value) || 1; })}
                    />
                  </Field>
                  <Field label="Period Unit" hint="e.g. month or series">
                    <input
                      className={inputCls}
                      value={currentOffer.period}
                      onChange={(e) => updateOffer((o) => { o.period = e.target.value; })}
                    />
                  </Field>
                </div>

                {/* Country Price Overrides */}
                <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                    Country Price Overrides ({draft.countries.length} Markets)
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    {draft.countries.map((c) => (
                      <div key={c.code} className="space-y-1">
                        <span className="text-xs font-medium text-white/70">
                          {c.flag} {c.name} ({c.currency})
                        </span>
                        <input
                          type="number"
                          className={`${inputCls} !py-1.5`}
                          placeholder={String(currentOffer.price)}
                          value={currentOffer.countryPrices?.[c.code] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : Number(e.target.value);
                            updateOffer((o) => {
                              if (!o.countryPrices) o.countryPrices = {};
                              if (val === undefined) {
                                delete o.countryPrices[c.code];
                              } else {
                                o.countryPrices[c.code] = val;
                              }
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Homepage Card Blurb & CTA */}
              <div className={boxCls}>
                <h4 className="font-display text-lg font-bold uppercase text-white">Homepage Card Presentation</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Card Blurb" hint="Supports tokens: {price}, {quantity}, {period}">
                    <textarea
                      className={`${inputCls} min-h-[80px] resize-none`}
                      value={currentOffer.homeCard?.blurb || ''}
                      onChange={(e) => updateOffer((o) => { o.homeCard.blurb = e.target.value; })}
                    />
                  </Field>
                  <Field label="Card Button Text">
                    <input
                      className={inputCls}
                      value={currentOffer.homeCard?.cta || ''}
                      onChange={(e) => updateOffer((o) => { o.homeCard.cta = e.target.value; })}
                    />
                  </Field>
                </div>
              </div>

              {/* Hero Section Copy */}
              <div className={boxCls}>
                <h4 className="font-display text-lg font-bold uppercase text-white">Hero Section Copy</h4>
                <Field label="Eyebrow Kicker">
                  <input
                    className={inputCls}
                    value={currentOffer.hero?.eyebrow || ''}
                    onChange={(e) => updateOffer((o) => { if (o.hero) o.hero.eyebrow = e.target.value; })}
                  />
                </Field>
                <Field label="Main Headline">
                  <textarea
                    className={`${inputCls} min-h-[70px] resize-none`}
                    value={currentOffer.hero?.headline || ''}
                    onChange={(e) => updateOffer((o) => { if (o.hero) o.hero.headline = e.target.value; })}
                  />
                </Field>
                <Field label="Tagline / Summary Pill">
                  <input
                    className={inputCls}
                    value={currentOffer.hero?.tagline || ''}
                    onChange={(e) => updateOffer((o) => { if (o.hero) o.hero.tagline = e.target.value; })}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Primary Button Text">
                    <input
                      className={inputCls}
                      value={currentOffer.hero?.ctaPrimary || ''}
                      onChange={(e) => updateOffer((o) => { if (o.hero) o.hero.ctaPrimary = e.target.value; })}
                    />
                  </Field>
                  <Field label="Secondary Button Text">
                    <input
                      className={inputCls}
                      value={currentOffer.hero?.ctaSecondary || ''}
                      onChange={(e) => updateOffer((o) => { if (o.hero) o.hero.ctaSecondary = e.target.value; })}
                    />
                  </Field>
                </div>
              </div>

              {/* Offer Package & Inclusions */}
              <div className={boxCls}>
                <h4 className="font-display text-lg font-bold uppercase text-white">Offer Package Inclusions &amp; Fineprint</h4>
                <Field label="Inclusions (one per line)">
                  <textarea
                    className={`${inputCls} min-h-[120px] resize-none font-mono text-xs`}
                    value={(currentOffer.offer?.included || []).join('\n')}
                    onChange={(e) => updateOffer((o) => {
                      if (o.offer) o.offer.included = e.target.value.split('\n').filter(Boolean);
                    })}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Fineprint / Terms">
                    <input
                      className={inputCls}
                      value={currentOffer.offer?.fineprint || ''}
                      onChange={(e) => updateOffer((o) => { if (o.offer) o.offer.fineprint = e.target.value; })}
                    />
                  </Field>
                  <Field label="Booking / Calendar Override (Optional)">
                    <input
                      className={inputCls}
                      placeholder="Leave blank to use shared booking URL"
                      value={currentOffer.bookingUrl || ''}
                      onChange={(e) => updateOffer((o) => { o.bookingUrl = e.target.value; })}
                    />
                  </Field>
                </div>
              </div>

              {/* Offer FAQs */}
              <div className={boxCls}>
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-lg font-bold uppercase text-white">
                    Frequently Asked Questions ({(currentOffer.faqs || []).length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => updateOffer((o) => {
                      if (!o.faqs) o.faqs = [];
                      o.faqs.push({
                        id: `faq-${Date.now()}`,
                        q: 'New Question',
                        a: 'Answer explanation here.',
                        visible: true,
                      });
                    })}
                    className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-[#f5a524] hover:text-black transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add FAQ
                  </button>
                </div>
                <div className="space-y-3">
                  {(currentOffer.faqs || []).map((faq, fIdx) => (
                    <div key={faq.id || fIdx} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          className={`${inputCls} font-semibold`}
                          value={faq.q}
                          onChange={(e) => updateOffer((o) => { if (o.faqs) o.faqs[fIdx].q = e.target.value; })}
                        />
                        <button
                          type="button"
                          onClick={() => updateOffer((o) => { if (o.faqs) o.faqs[fIdx].visible = !o.faqs[fIdx].visible; })}
                          className="p-2 text-white/50 hover:text-white"
                        >
                          {faq.visible ? <Eye className="h-4 w-4 text-[#f5a524]" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateOffer((o) => { if (o.faqs) o.faqs.splice(fIdx, 1); })}
                          className="p-2 text-white/30 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea
                        className={`${inputCls} min-h-[60px] resize-none text-xs text-white/80`}
                        value={faq.a}
                        onChange={(e) => updateOffer((o) => { if (o.faqs) o.faqs[fIdx].a = e.target.value; })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: HOMEPAGE BLOCK */}
      {subTab === 'home' && (
        <div className="space-y-6">
          <div className={boxCls}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold uppercase text-white">Homepage "Studio Plans" Block</h3>
                <p className="text-xs text-white/50">Configure the 2-column showcase section that sits directly on the homepage.</p>
              </div>
              <Pill on={sp.home.enabled} onClick={() => updateHome((h) => { h.enabled = !h.enabled; })}>
                {sp.home.enabled ? 'Section Enabled' : 'Section Hidden'}
              </Pill>
            </div>

            <Field label="Eyebrow Tagline">
              <input
                className={inputCls}
                value={sp.home.eyebrow}
                onChange={(e) => updateHome((h) => { h.eyebrow = e.target.value; })}
              />
            </Field>

            <Field label="Heading (Supports *accent* words)">
              <input
                className={inputCls}
                value={sp.home.heading}
                onChange={(e) => updateHome((h) => { h.heading = e.target.value; })}
              />
            </Field>

            <Field label="Description Body">
              <textarea
                className={`${inputCls} min-h-[80px] resize-none`}
                value={sp.home.body}
                onChange={(e) => updateHome((h) => { h.body = e.target.value; })}
              />
            </Field>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SHARED SETTINGS & UI TEXT */}
      {subTab === 'settings' && (
        <div className="space-y-6">
          <div className={boxCls}>
            <h3 className="font-display text-xl font-bold uppercase text-white">Shared Lead &amp; Booking Settings</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shared Calendar / Booking Link (e.g. Calendly, Cal.com)">
                <input
                  className={inputCls}
                  placeholder="https://cal.com/your-brand/strategy"
                  value={sp.settings.bookingUrl}
                  onChange={(e) => updateSettings((s) => { s.bookingUrl = e.target.value; })}
                />
              </Field>

              <Field label="Base Pricing Country">
                <select
                  className={inputCls}
                  value={sp.settings.baseCountry}
                  onChange={(e) => updateSettings((s) => { s.baseCountry = e.target.value; })}
                >
                  {draft.countries.map((c) => (
                    <option key={c.code} value={c.code} className="bg-neutral-900">
                      {c.flag} {c.name} ({c.currency})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="WhatsApp Lead Message Template" hint="Tokens: {name}, {business}, {offer}, {ref}">
              <textarea
                className={`${inputCls} min-h-[70px] resize-none`}
                value={sp.settings.whatsappTemplate}
                onChange={(e) => updateSettings((s) => { s.whatsappTemplate = e.target.value; })}
              />
            </Field>

            <Field label="Consent Confirmation Text">
              <input
                className={inputCls}
                value={sp.settings.consentText}
                onChange={(e) => updateSettings((s) => { s.consentText = e.target.value; })}
              />
            </Field>

            <Field label="Public Live Activity Display Checkbox Text">
              <input
                className={inputCls}
                value={sp.settings.publicDisplayLabel}
                onChange={(e) => updateSettings((s) => { s.publicDisplayLabel = e.target.value; })}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
