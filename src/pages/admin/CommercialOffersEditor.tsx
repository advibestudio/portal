import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Film, Video, ExternalLink, Globe } from 'lucide-react';
import type { CommercialOfferPage, SiteContent } from '@/content/types';
import { defaultCommercialOffers } from '@/content/commercialOffers';

type SetFn = (fn: (d: SiteContent) => void) => void;

const inputCls =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50 font-mono';
const boxCls = 'space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6';

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

export function CommercialOffersEditor({ draft, set }: { draft: SiteContent; set: SetFn }) {
  const [selectedOfferId, setSelectedOfferId] = useState<'monthly-content' | 'promotional-mini-series'>('monthly-content');

  // Ensure commercialOffers exists on draft
  const offers = draft.commercialOffers || defaultCommercialOffers;
  const currentOffer = offers[selectedOfferId] || defaultCommercialOffers[selectedOfferId];

  const updateOffer = (fn: (offer: CommercialOfferPage) => void) => {
    set((d) => {
      if (!d.commercialOffers) {
        d.commercialOffers = structuredClone(defaultCommercialOffers);
      }
      if (!d.commercialOffers[selectedOfferId]) {
        d.commercialOffers[selectedOfferId] = structuredClone(defaultCommercialOffers[selectedOfferId]);
      }
      fn(d.commercialOffers[selectedOfferId]);
    });
  };

  const currentRoute = selectedOfferId === 'monthly-content' ? '#/monthly-content' : '#/promotional-mini-series';

  return (
    <div className="space-y-6 text-left">
      {/* Header & Offer Chooser */}
      <div className={boxCls}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
              SALES PAGES & COMMERCIAL OFFERS CMS
            </span>
            <h2 className="mt-1 font-display text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">
              Edit Commercial Offer Pages
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-white/50">
              Edit all public-facing copy, prices, video quantities, 1-page brief mockups, revision limits, and ownership clauses without touching code.
            </p>
          </div>

          <a
            href={currentRoute}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#f5a524] hover:text-black transition shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View {currentOffer.shortLabel} Page</span>
          </a>
        </div>

        {/* Offer Selector Buttons */}
        <div className="flex gap-2 pt-2 border-t border-white/10 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedOfferId('monthly-content')}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              selectedOfferId === 'monthly-content'
                ? 'bg-[#f5a524] text-black shadow-lg shadow-[#f5a524]/20'
                : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Monthly Content Retainer</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOfferId('promotional-mini-series')}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              selectedOfferId === 'promotional-mini-series'
                ? 'bg-[#f5a524] text-black shadow-lg shadow-[#f5a524]/20'
                : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <Film className="h-4 w-4" />
            <span>AI Promotional Mini Series</span>
          </button>
        </div>
      </div>

      {/* 1. STATUS, PRICING & QUANTITY */}
      <div className={boxCls}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <p className="font-display text-base uppercase text-white">
            Core Package Settings ({currentOffer.shortLabel})
          </p>
          <div className="flex items-center gap-2">
            <Pill
              on={currentOffer.active}
              onClick={() => updateOffer((o) => { o.active = !o.active; })}
            >
              {currentOffer.active ? 'Offer Active' : 'Offer Paused'}
            </Pill>
            <Pill
              on={currentOffer.showOnHomepage}
              onClick={() => updateOffer((o) => { o.showOnHomepage = !o.showOnHomepage; })}
            >
              {currentOffer.showOnHomepage ? 'Show on Homepage' : 'Hidden on Home'}
            </Pill>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Full Offer Name">
            <input
              className={inputCls}
              value={currentOffer.name}
              onChange={(e) => updateOffer((o) => { o.name = e.target.value; })}
            />
          </Field>

          <Field label="Short Navigation Label">
            <input
              className={inputCls}
              value={currentOffer.shortLabel}
              onChange={(e) => updateOffer((o) => { o.shortLabel = e.target.value; })}
            />
          </Field>

          <Field label="Default Price (₦ NGN / mo)">
            <input
              type="number"
              className={inputCls}
              value={currentOffer.price}
              onChange={(e) => updateOffer((o) => { o.price = Math.max(0, Number(e.target.value) || 0); })}
            />
          </Field>

          <Field label="Monthly Video Quantity">
            <input
              type="number"
              className={inputCls}
              value={currentOffer.monthlyVideoQuantity}
              onChange={(e) => updateOffer((o) => { o.monthlyVideoQuantity = Math.max(1, Number(e.target.value) || 15); })}
            />
          </Field>
        </div>

        <Field label="Tagline / Short Hook">
          <input
            className={inputCls}
            value={currentOffer.tagline}
            onChange={(e) => updateOffer((o) => { o.tagline = e.target.value; })}
          />
        </Field>
      </div>

      {/* 2. HERO SECTION */}
      <div className={boxCls}>
        <p className="font-display text-base uppercase text-white">Hero Section Copy</p>
        <div className="space-y-4">
          <Field label="Eyebrow / Small Header">
            <input
              className={inputCls}
              value={currentOffer.hero.eyebrow}
              onChange={(e) => updateOffer((o) => { o.hero.eyebrow = e.target.value; })}
            />
          </Field>

          <Field label="Main Headline">
            <input
              className={inputCls}
              value={currentOffer.hero.headline}
              onChange={(e) => updateOffer((o) => { o.hero.headline = e.target.value; })}
            />
          </Field>

          <Field label="Subheadline / Supporting Narrative">
            <textarea
              className={`${inputCls} min-h-[90px] resize-none`}
              value={currentOffer.hero.subheadline}
              onChange={(e) => updateOffer((o) => { o.hero.subheadline = e.target.value; })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary CTA Label">
              <input
                className={inputCls}
                value={currentOffer.hero.primaryCta}
                onChange={(e) => updateOffer((o) => { o.hero.primaryCta = e.target.value; })}
              />
            </Field>

            <Field label="Secondary WhatsApp CTA Label">
              <input
                className={inputCls}
                value={currentOffer.hero.secondaryCta}
                onChange={(e) => updateOffer((o) => { o.hero.secondaryCta = e.target.value; })}
              />
            </Field>
          </div>

          <Field label="Context Note Below Button">
            <input
              className={inputCls}
              value={currentOffer.hero.contextNote}
              onChange={(e) => updateOffer((o) => { o.hero.contextNote = e.target.value; })}
            />
          </Field>

          <Field
            label="Top VSL YouTube Link or ID (Leave blank to hide VSL player box)"
            hint="When blank, the top VSL video box stays hidden on the page. Paste a YouTube link or 11-character ID when your VSL is ready."
          >
            <input
              className={inputCls}
              placeholder="e.g. https://www.youtube.com/watch?v=... (currently hidden)"
              value={currentOffer.hero.vslYoutubeId ?? ''}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const m = raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
                const id = m ? m[1] : raw;
                updateOffer((o) => { o.hero.vslYoutubeId = id; });
              }}
            />
          </Field>
        </div>
      </div>

      {/* 3. PROBLEM & AMPLIFY */}
      <div className={boxCls}>
        <p className="font-display text-base uppercase text-white">Problem & Amplification</p>
        <div className="space-y-4">
          <Field label="Problem Section Heading">
            <input
              className={inputCls}
              value={currentOffer.problem.heading}
              onChange={(e) => updateOffer((o) => { o.problem.heading = e.target.value; })}
            />
          </Field>

          <Field label="Problem Paragraphs (One per line)">
            <textarea
              className={`${inputCls} min-h-[100px] resize-none font-mono text-xs`}
              value={currentOffer.problem.paragraphs.join('\n\n')}
              onChange={(e) => updateOffer((o) => {
                o.problem.paragraphs = e.target.value.split('\n\n').map((p) => p.trim()).filter(Boolean);
              })}
            />
          </Field>

          <Field label="Problem Callout / Highlight Sentence">
            <input
              className={inputCls}
              value={currentOffer.problem.highlight ?? ''}
              onChange={(e) => updateOffer((o) => { o.problem.highlight = e.target.value; })}
            />
          </Field>

          <div className="pt-3 border-t border-white/10 space-y-4">
            <Field label="Amplify Heading">
              <input
                className={inputCls}
                value={currentOffer.amplify.heading}
                onChange={(e) => updateOffer((o) => { o.amplify.heading = e.target.value; })}
              />
            </Field>

            <Field label="Amplify Paragraphs (One per line)">
              <textarea
                className={`${inputCls} min-h-[90px] resize-none font-mono text-xs`}
                value={currentOffer.amplify.paragraphs.join('\n\n')}
                onChange={(e) => updateOffer((o) => {
                  o.amplify.paragraphs = e.target.value.split('\n\n').map((p) => p.trim()).filter(Boolean);
                })}
              />
            </Field>

            <Field label="Amplify Callout Sentence">
              <input
                className={inputCls}
                value={currentOffer.amplify.callout ?? ''}
                onChange={(e) => updateOffer((o) => { o.amplify.callout = e.target.value; })}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* 4. SOLUTION & VALUE COMPARISON */}
      <div className={boxCls}>
        <p className="font-display text-base uppercase text-white">Solution & Value Comparison</p>
        <div className="space-y-4">
          <Field label="Solution Heading">
            <input
              className={inputCls}
              value={currentOffer.solution.heading}
              onChange={(e) => updateOffer((o) => { o.solution.heading = e.target.value; })}
            />
          </Field>

          <Field label="Solution Narrative Paragraphs (One per line)">
            <textarea
              className={`${inputCls} min-h-[90px] resize-none font-mono text-xs`}
              value={currentOffer.solution.paragraphs.join('\n\n')}
              onChange={(e) => updateOffer((o) => {
                o.solution.paragraphs = e.target.value.split('\n\n').map((p) => p.trim()).filter(Boolean);
              })}
            />
          </Field>

          {currentOffer.valueComparison && (
            <div className="pt-3 border-t border-white/10 space-y-4">
              <Field label="Value Comparison Heading (Studio vs One Hire)">
                <input
                  className={inputCls}
                  value={currentOffer.valueComparison.heading}
                  onChange={(e) => updateOffer((o) => {
                    if (o.valueComparison) o.valueComparison.heading = e.target.value;
                  })}
                />
              </Field>

              <Field label="Value Comparison Inclusions (One per line)">
                <textarea
                  className={`${inputCls} min-h-[90px] resize-none font-mono text-xs`}
                  value={currentOffer.valueComparison.includedList.join('\n')}
                  onChange={(e) => updateOffer((o) => {
                    if (o.valueComparison) {
                      o.valueComparison.includedList = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean);
                    }
                  })}
                />
              </Field>

              <Field label="Value Comparison Conclusion Statement">
                <input
                  className={inputCls}
                  value={currentOffer.valueComparison.conclusion}
                  onChange={(e) => updateOffer((o) => {
                    if (o.valueComparison) o.valueComparison.conclusion = e.target.value;
                  })}
                />
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* 5. PROCESS & 1-PAGE BRIEF SAMPLE CHECKPOINT */}
      <div className={boxCls}>
        <p className="font-display text-base uppercase text-white">
          Production Process & One-Page Creative Brief
        </p>
        <div className="space-y-4">
          <Field label="Process Heading">
            <input
              className={inputCls}
              value={currentOffer.process.heading}
              onChange={(e) => updateOffer((o) => { o.process.heading = e.target.value; })}
            />
          </Field>

          <Field label="Process Intro">
            <input
              className={inputCls}
              value={currentOffer.process.intro ?? ''}
              onChange={(e) => updateOffer((o) => { o.process.intro = e.target.value; })}
            />
          </Field>

          {currentOffer.process.briefMockupSample && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
              <p className="font-mono text-xs font-bold text-[#f5a524] uppercase">
                One-Page Creative Brief Sample Checkpoint Mockup
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Sample Brand Name">
                  <input
                    className={inputCls}
                    value={currentOffer.process.briefMockupSample.brand}
                    onChange={(e) => updateOffer((o) => {
                      if (o.process.briefMockupSample) o.process.briefMockupSample.brand = e.target.value;
                    })}
                  />
                </Field>
                <Field label="Sample Hook Angle">
                  <input
                    className={inputCls}
                    value={currentOffer.process.briefMockupSample.hookAngle}
                    onChange={(e) => updateOffer((o) => {
                      if (o.process.briefMockupSample) o.process.briefMockupSample.hookAngle = e.target.value;
                    })}
                  />
                </Field>
              </div>
              <Field label="Sample Visual & Lighting Direction">
                <input
                  className={inputCls}
                  value={currentOffer.process.briefMockupSample.visualDirection}
                  onChange={(e) => updateOffer((o) => {
                    if (o.process.briefMockupSample) o.process.briefMockupSample.visualDirection = e.target.value;
                  })}
                />
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* 6. REVISION POLICY & OWNERSHIP CLAUSES */}
      <div className={boxCls}>
        <p className="font-display text-base uppercase text-white">Revision Policy & Asset Ownership</p>
        <div className="space-y-4">
          <Field label="Revision Policy Heading">
            <input
              className={inputCls}
              value={currentOffer.revisionPolicy.heading}
              onChange={(e) => updateOffer((o) => { o.revisionPolicy.heading = e.target.value; })}
            />
          </Field>

          <Field label="Revision Policy Explanatory Body">
            <textarea
              className={`${inputCls} min-h-[80px] resize-none`}
              value={currentOffer.revisionPolicy.body}
              onChange={(e) => updateOffer((o) => { o.revisionPolicy.body = e.target.value; })}
            />
          </Field>

          <div className="pt-3 border-t border-white/10 space-y-4">
            <Field label="Ownership Heading">
              <input
                className={inputCls}
                value={currentOffer.ownership.heading}
                onChange={(e) => updateOffer((o) => { o.ownership.heading = e.target.value; })}
              />
            </Field>

            <Field label="Ownership Paragraphs (One per line)">
              <textarea
                className={`${inputCls} min-h-[90px] resize-none font-mono text-xs`}
                value={currentOffer.ownership.paragraphs.join('\n\n')}
                onChange={(e) => updateOffer((o) => {
                  o.ownership.paragraphs = e.target.value.split('\n\n').map((p) => p.trim()).filter(Boolean);
                })}
              />
            </Field>

            <Field label="Ownership Scope & Third-Party Clarification">
              <input
                className={inputCls}
                value={currentOffer.ownership.clarification}
                onChange={(e) => updateOffer((o) => { o.ownership.clarification = e.target.value; })}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* 7. CIRCLESFUNDME PROOF OF WORK & VIDEO SELECTION */}
      <div className={boxCls}>
        <p className="font-display text-base uppercase text-white">CirclesFundMe Proof Section</p>
        <div className="space-y-4">
          <Field label="Heading">
            <input
              className={inputCls}
              value={currentOffer.circlesFundMeProof.heading}
              onChange={(e) => updateOffer((o) => { o.circlesFundMeProof.heading = e.target.value; })}
            />
          </Field>

          <Field label="Narrative Body">
            <textarea
              className={`${inputCls} min-h-[70px] resize-none`}
              value={currentOffer.circlesFundMeProof.body}
              onChange={(e) => updateOffer((o) => { o.circlesFundMeProof.body = e.target.value; })}
            />
          </Field>

          <Field label="CTA Button Label (Opens Video Lightbox)">
            <input
              className={inputCls}
              value={currentOffer.circlesFundMeProof.ctaText}
              onChange={(e) => updateOffer((o) => { o.circlesFundMeProof.ctaText = e.target.value; })}
            />
          </Field>
        </div>
      </div>

      {/* 8. OFFER CARD & INCLUSIONS */}
      <div className={boxCls}>
        <p className="font-display text-base uppercase text-white">Offer Card Summary</p>
        <div className="space-y-4">
          <Field label="Offer Summary Heading">
            <input
              className={inputCls}
              value={currentOffer.offerSummary.heading}
              onChange={(e) => updateOffer((o) => { o.offerSummary.heading = e.target.value; })}
            />
          </Field>

          <Field label="Package Title on Card">
            <input
              className={inputCls}
              value={currentOffer.offerSummary.packageTitle}
              onChange={(e) => updateOffer((o) => { o.offerSummary.packageTitle = e.target.value; })}
            />
          </Field>

          <Field label="Bullet Inclusions (One per line)">
            <textarea
              className={`${inputCls} min-h-[90px] resize-none font-mono text-xs`}
              value={currentOffer.offerSummary.inclusions.join('\n')}
              onChange={(e) => updateOffer((o) => {
                o.offerSummary.inclusions = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean);
              })}
            />
          </Field>

          <Field label="Terms Disclaimer Below Card">
            <input
              className={inputCls}
              value={currentOffer.offerSummary.disclaimer}
              onChange={(e) => updateOffer((o) => { o.offerSummary.disclaimer = e.target.value; })}
            />
          </Field>
        </div>
      </div>

      {/* 9. FAQS MANAGEMENT */}
      <div className={boxCls}>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <p className="font-display text-base uppercase text-white">
            Frequently Asked Questions ({currentOffer.faqs.length})
          </p>
          <button
            type="button"
            onClick={() => updateOffer((o) => {
              o.faqs.push({
                id: `faq-${Date.now()}`,
                q: 'New Question',
                a: 'Answer to the question.',
                visible: true,
              });
            })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#f5a524] hover:text-black transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add FAQ</span>
          </button>
        </div>

        <div className="space-y-3">
          {currentOffer.faqs.map((faq, idx) => (
            <div key={faq.id} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Field label={`Question ${idx + 1}`}>
                    <input
                      className={inputCls}
                      value={faq.q}
                      onChange={(e) => updateOffer((o) => { o.faqs[idx].q = e.target.value; })}
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => updateOffer((o) => { o.faqs.splice(idx, 1); })}
                  className="mt-6 grid h-9 w-9 place-items-center rounded-lg text-white/40 hover:bg-red-500/10 hover:text-red-300"
                  aria-label="Delete question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Field label="Answer">
                <textarea
                  className={`${inputCls} min-h-[70px] resize-none`}
                  value={faq.a}
                  onChange={(e) => updateOffer((o) => { o.faqs[idx].a = e.target.value; })}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>

      {/* 10. BOOKING URL OVERRIDE & SEO */}
      <div className={boxCls}>
        <p className="font-display text-base uppercase text-white">Booking URL & SEO Metadata</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Booking Scheduling URL Override"
            hint="Overrides the global strategy-call link for this specific offer page if provided."
          >
            <input
              className={inputCls}
              placeholder="e.g. https://cal.com/advibe-studio/strategy-call"
              value={currentOffer.bookingUrlOverride ?? ''}
              onChange={(e) => updateOffer((o) => { o.bookingUrlOverride = e.target.value || undefined; })}
            />
          </Field>

          <Field label="SEO Title Tag">
            <input
              className={inputCls}
              value={currentOffer.seo.title}
              onChange={(e) => updateOffer((o) => { o.seo.title = e.target.value; })}
            />
          </Field>
        </div>

        <Field label="SEO Meta Description">
          <textarea
            className={`${inputCls} min-h-[60px] resize-none`}
            value={currentOffer.seo.description}
            onChange={(e) => updateOffer((o) => { o.seo.description = e.target.value; })}
          />
        </Field>
      </div>
    </div>
  );
}
