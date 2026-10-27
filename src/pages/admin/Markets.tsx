import React, { useState } from 'react';
import { Copy, ExternalLink, Lock, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { Country, SectionKey, SiteContent } from '@/content/types';
import { defaultCountries } from '@/content/defaultContent';
import { assetUrl, fmtMoney } from '@/lib/money';
import { useStore } from '@/lib/store';
import { buildEvents, fetchApiHolidays, fmtEventDate, yearsNeeded, type CalEvent } from '@/lib/events';

/* Admin screens for: Countries & Prices · Sections · Client · Events calendar.
   Each receives the draft content and a `set` function (same pattern as the other tabs). */

type SetFn = (fn: (d: SiteContent) => void) => void;
const inputCls = 'w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50 font-mono';
const box = 'space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6';
const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label className="block"><span className={labelCls}>{label}</span>{children}{hint && <span className="mt-1 block text-xs text-white/40">{hint}</span>}</label>
);
const Pill = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold uppercase active:scale-[0.98] transition ${on ? 'bg-[#f5a524] text-black shadow-md' : 'border border-white/20 text-white/60 hover:text-white'}`}>{children}</button>
);

/** Chips to choose which countries something applies to. Empty selection = every country. */
export function CountryChips({ countries, value, onChange }: { countries: Country[]; value: string[]; onChange: (v: string[]) => void }) {
  const all = value.length === 0;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-widest text-white/45">Show in</span>
      <button type="button" onClick={() => onChange([])} className={`min-h-[36px] rounded-full border px-3 text-xs font-semibold ${all ? 'border-[#f5a524] text-[#f5a524]' : 'border-white/15 text-white/60'}`}>All countries</button>
      {countries.map((c) => {
        const on = value.includes(c.code);
        return (
          <button type="button" key={c.code} onClick={() => onChange(on ? value.filter((x) => x !== c.code) : [...value, c.code])}
            className={`min-h-[36px] rounded-full border px-3 text-xs font-semibold ${on ? 'border-[#f5a524] bg-[#f5a524]/15 text-[#f5a524]' : 'border-white/15 text-white/60'}`}>{c.flag} {c.code}</button>
        );
      })}
    </div>
  );
}

/* ====================================================================== */
/* COUNTRIES & PRICES                                                      */
/* ====================================================================== */
export function CountriesTab({ draft, set }: { draft: SiteContent; set: SetFn }) {
  const [copied, setCopied] = useState('');
  const base = window.location.href.split('#')[0].split('?')[0];
  const copy = (txt: string, key: string) => { void navigator.clipboard?.writeText(txt); setCopied(key); setTimeout(() => setCopied(''), 1500); };
  const isStarter = (c: Country) => {
    const d = defaultCountries.find((x) => x.code === c.code);
    return c.code !== 'NG' && d && JSON.stringify(d.prices) === JSON.stringify(c.prices);
  };

  return (
    <div className="space-y-6">
      {/* ad links */}
      <div className={box}>
        <div>
          <p className="font-display text-lg uppercase text-white">Ad links — one page, one link per country</p>
          <p className="mt-1 text-sm text-white/50">Use these as the destination in your ads. Each link opens the same website already set to that country's prices, currency, events and payment details.
            Add your tracking as usual, e.g. <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">?utm_source=facebook&amp;utm_campaign=ghana-nov</code> <em>before</em> the <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">#</code>.</p>
        </div>
        <div className="space-y-2">
          {draft.countries.map((c) => (
            <div key={c.code} className={`flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-3 ${c.active ? '' : 'opacity-40'}`}>
              <span className="w-28 shrink-0 text-sm font-semibold text-white">{c.flag} {c.name}</span>
              <code className="min-w-0 flex-1 break-all text-xs text-[#f5a524]">{base}#/{c.slug}</code>
              <button type="button" onClick={() => copy(`${base}#/${c.slug}`, c.code)} className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-semibold text-white/80 hover:bg-white/10"><Copy className="h-3.5 w-3.5" /> {copied === c.code ? 'Copied ✓' : 'Copy'}</button>
              <a href={`${base}#/${c.slug}`} target="_blank" rel="noreferrer" className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-semibold text-white/80 hover:bg-white/10"><ExternalLink className="h-3.5 w-3.5" /> Open</a>
            </div>
          ))}
        </div>
        <Field label="Default country" hint="Shown to people who arrive on the plain link with no country (and haven't picked one before).">
          <select className={inputCls} value={draft.defaultCountry} onChange={(e) => set((d) => { d.defaultCountry = e.target.value; })}>
            {draft.countries.map((c) => <option key={c.code} value={c.code} className="bg-neutral-900">{c.flag} {c.name}</option>)}
          </select>
        </Field>
      </div>

      {/* price grid */}
      <div className={box}>
        <div>
          <p className="font-display text-lg uppercase text-white">Prices by country</p>
          <p className="mt-1 text-sm text-white/50">Type the price in each country's own currency. <strong className="text-white/70">Leave a box empty (or 0) to hide that package in that country.</strong></p>
        </div>
        {draft.countries.some(isStarter) && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            ⚠ The columns marked <strong>starter prices</strong> are placeholders I filled in so the site works on day one. Review them before running ads in that country.
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-white/45">
                <th className="pb-1 pr-3 font-bold">Package</th>
                {draft.countries.map((c) => (
                  <th key={c.code} className={`pb-1 pr-2 font-bold ${c.active ? '' : 'opacity-40'}`}>
                    {c.flag} {c.code} <span className="text-white/30">({c.symbol})</span>
                    {isStarter(c) && <span className="mt-0.5 block text-[10px] normal-case tracking-normal text-amber-300">starter prices</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {draft.offers.map((o, oi) => (
                <tr key={o.id}>
                  <td className="pr-3 align-middle"><p className="font-semibold text-white">{o.name}</p><p className="text-xs text-white/40">{o.goal === 'monthly' ? 'per month' : o.quantity > 1 ? `${o.quantity} videos` : 'one video'}</p></td>
                  {draft.countries.map((c, ci) => (
                    <td key={c.code} className="pr-2 align-middle">
                      <input type="number" min={0} inputMode="decimal" aria-label={`${o.name} price in ${c.currency}`} className={`${inputCls} !px-3 !py-2.5`}
                        value={c.prices[o.id] ?? ''} placeholder="hidden"
                        onChange={(e) => set((d) => {
                          const v = e.target.value === '' ? undefined : Number(e.target.value);
                          if (v === undefined || !(v > 0)) delete d.countries[ci].prices[o.id]; else d.countries[ci].prices[o.id] = v;
                          if (d.countries[ci].code === 'NG') d.offers[oi].price = v && v > 0 ? v : 0; // keeps the old single-price field in step
                        })} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* each country's details */}
      {draft.countries.map((c, i) => (
        <div key={c.code} className={box}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-lg uppercase text-white">{c.flag} {c.name} <span className="font-mono text-xs normal-case text-white/35">{c.code} · {c.currency}</span></p>
            <div className="flex items-center gap-2">
              <Pill on={c.active} onClick={() => set((d) => { d.countries[i].active = !d.countries[i].active; })}>{c.active ? 'Selling here' : 'Switched off'}</Pill>
              {draft.countries.length > 1 && c.code !== draft.defaultCountry && (
                <button type="button" onClick={() => { if (window.confirm(`Remove ${c.name} completely? (To just pause it, use the switch instead.)`)) set((d) => { d.countries.splice(i, 1); }); }}
                  className="grid h-10 w-10 place-items-center rounded-lg text-white/35 hover:text-red-300" aria-label={`Remove ${c.name}`}><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Name"><input className={inputCls} value={c.name} onChange={(e) => set((d) => { d.countries[i].name = e.target.value; })} /></Field>
            <Field label="Flag"><input className={inputCls} value={c.flag} onChange={(e) => set((d) => { d.countries[i].flag = e.target.value; })} /></Field>
            <Field label="Currency code"><input className={inputCls} value={c.currency} maxLength={4} onChange={(e) => set((d) => { d.countries[i].currency = e.target.value.toUpperCase(); })} /></Field>
            <Field label="Symbol"><input className={inputCls} value={c.symbol} maxLength={5} onChange={(e) => set((d) => { d.countries[i].symbol = e.target.value; })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="WhatsApp number for this country" hint="Digits only with country code. Empty = use the main number in Settings."><input className={inputCls} value={c.whatsappNumber} placeholder="Same as main" onChange={(e) => set((d) => { d.countries[i].whatsappNumber = e.target.value.replace(/[^\d]/g, ''); })} /></Field>
            <Field label="Meta Pixel ID for this country" hint="Optional. Empty = use the main Pixel in Settings."><input className={inputCls} value={c.pixelId} placeholder="Same as main" inputMode="numeric" onChange={(e) => set((d) => { d.countries[i].pixelId = e.target.value.replace(/[^\d]/g, ''); })} /></Field>
          </div>
          <Field label="How this country pays (shown right after they order)" hint="Empty = use the main payment text in Settings.">
            <textarea className={`${inputCls} min-h-[80px] resize-none`} value={c.paymentInstructions} placeholder="Same as main" onChange={(e) => set((d) => { d.countries[i].paymentInstructions = e.target.value; })} />
          </Field>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className={labelCls}>Typical cost of ONE traditionally-made video ad in {c.name} <span className="normal-case tracking-normal text-white/30">({c.currency})</span></p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="From"><input type="number" min={0} className={inputCls} value={c.tradLow || ''} placeholder="0" onChange={(e) => set((d) => { d.countries[i].tradLow = Math.max(0, Number(e.target.value) || 0); })} /></Field>
              <Field label="To"><input type="number" min={0} className={inputCls} value={c.tradHigh || ''} placeholder="0" onChange={(e) => set((d) => { d.countries[i].tradHigh = Math.max(0, Number(e.target.value) || 0); })} /></Field>
            </div>
            <p className="mt-2 text-xs text-white/40">Used by the cost-comparison card and the “AI video ads” page. <strong className="text-amber-300/90">The starter numbers are rough estimates I filled in — replace them with figures you can stand behind.</strong> Leave 0 to hide the comparison in this country.</p>
          </div>
          <p className="text-xs text-white/40">Preview: Single 30s Video would show as <strong className="text-white/70">{c.prices['single-30'] ? fmtMoney(c.prices['single-30'], c) : 'hidden'}</strong></p>
        </div>
      ))}

      <button type="button" onClick={() => set((d) => {
        const n = d.countries.length + 1;
        d.countries.push({ code: `C${n}`, slug: `c${n}`, name: 'New country', flag: '🏳️', currency: 'USD', symbol: '$', active: false, prices: {}, whatsappNumber: '', paymentInstructions: '', pixelId: '', tradLow: 0, tradHigh: 0 });
      })} className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 text-sm font-semibold text-white/60 transition hover:border-[#f5a524] hover:text-[#f5a524]">
        <Plus className="h-4 w-4" /> Add another country
      </button>
      <p className="text-xs text-white/40">Adding a country: give it a 2-letter code (e.g. ZA) and a short link name; then fill in its prices above and switch it on. For the events calendar to work, use the real 2-letter country code (UK is handled for you).</p>
    </div>
  );
}

/* ====================================================================== */
/* SECTIONS (on/off switches)                                              */
/* ====================================================================== */
const SECTION_INFO: { key: SectionKey; title: string; desc: string }[] = [
  { key: 'wall', title: 'Spinning video wall (top of page)', desc: 'The 3D wall of your videos under the headline.' },
  { key: 'proof', title: 'Trust strip', desc: 'The scrolling list of what you make, plus your three headline numbers.' },
  { key: 'showcase', title: 'Work gallery', desc: '"Ads we\'ve made" — the filterable row of videos. (Also hides the Work link and "See our work" button.)' },
  { key: 'clients', title: 'Client spotlight', desc: 'The "trusted by" badge under the hero buttons and the featured-client section.' },
  { key: 'problem', title: 'The problem section', desc: '"People don\'t read everything. They scroll."' },
  { key: 'services', title: 'Services', desc: 'The coloured tiles listing every kind of ad.' },
  { key: 'aiCompare', title: 'Cost-comparison card + page link', desc: 'The "What AI replaces · typical costs" card under the packages and its link to the full "AI video ads" page.' },
  { key: 'events', title: 'Upcoming events / sales seasons', desc: 'The calendar-powered "Got something coming up?" block.' },
  { key: 'whyUs', title: 'Why businesses choose us', desc: 'The "no camera crew" statement and chips.' },
  { key: 'process', title: 'How it works', desc: 'The step-by-step process. (Also hides its menu link.)' },
  { key: 'testimonials', title: 'Testimonials', desc: 'Customer quotes.' },
  { key: 'faq', title: 'FAQs', desc: 'The questions and answers. (Also hides its menu link.)' },
  { key: 'finalCta', title: 'Final call-to-action', desc: 'The big closing block near the bottom.' },
  { key: 'liveToasts', title: '"Just started" pop-ups', desc: 'Small notices showing real people who just began an order, with their country.' },
];

export function SectionsTab({ draft, set }: { draft: SiteContent; set: SetFn }) {
  const p = draft.popups;
  const num = (v: string, min: number, fallback: number) => Math.max(min, Number(v) || fallback);
  return (
    <div className="space-y-6">
      <div className={box}>
        <div>
          <p className="font-display text-lg uppercase text-white">Switch parts of the page on or off</p>
          <p className="mt-1 text-sm text-white/50">Switched-off sections disappear from the public page (and from the menu). Nothing is deleted — switch it back on any time. Remember to <strong className="text-white/70">Save changes</strong>.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-3 opacity-70">
            <div><p className="text-sm font-semibold text-white">Headline & buttons (top of page)</p><p className="text-xs text-white/40">Always on.</p></div>
            <span className="flex items-center gap-1.5 text-xs text-white/50"><Lock className="h-3.5 w-3.5" /> Always on</span>
          </div>
          {SECTION_INFO.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="min-w-0"><p className="text-sm font-semibold text-white">{s.title}</p><p className="text-xs text-white/45">{s.desc}</p></div>
              <Pill on={draft.sections[s.key]} onClick={() => set((d) => { d.sections[s.key] = !d.sections[s.key]; })}>{draft.sections[s.key] ? 'On' : 'Off'}</Pill>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-3 opacity-70">
            <div><p className="text-sm font-semibold text-white">Packages & prices</p><p className="text-xs text-white/40">Always on — this is how people order. To stop selling in one country, switch that country off under Countries &amp; Prices.</p></div>
            <span className="flex items-center gap-1.5 text-xs text-white/50"><Lock className="h-3.5 w-3.5" /> Always on</span>
          </div>
        </div>
      </div>

      <div className={box}>
        <p className="font-display text-lg uppercase text-white">"Just started" pop-ups — settings</p>
        <p className="text-sm text-white/50">These show <strong className="text-white/70">real</strong> orders only: first name + country, for customers who left the "show my first name and country" box ticked. Orders you type in manually never appear. If nobody has ordered recently, nothing shows.</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="First one after (sec)"><input type="number" min={2} className={inputCls} value={p.delaySeconds} onChange={(e) => set((d) => { d.popups.delaySeconds = num(e.target.value, 2, 8); })} /></Field>
          <Field label="Gap between (sec)"><input type="number" min={5} className={inputCls} value={p.gapSeconds} onChange={(e) => set((d) => { d.popups.gapSeconds = num(e.target.value, 5, 16); })} /></Field>
          <Field label="Max per visit"><input type="number" min={1} className={inputCls} value={p.maxPerVisit} onChange={(e) => set((d) => { d.popups.maxPerVisit = num(e.target.value, 1, 6); })} /></Field>
          <Field label="Orders from last (hours)"><input type="number" min={1} className={inputCls} value={p.withinHours} onChange={(e) => set((d) => { d.popups.withinHours = num(e.target.value, 1, 72); })} /></Field>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* CLIENT SPOTLIGHT                                                        */
/* ====================================================================== */
export function ClientTab({ draft, set }: { draft: SiteContent; set: SetFn }) {
  const k = draft.client;
  return (
    <div className={box}>
      <div>
        <p className="font-display text-lg uppercase text-white">Featured client (builds trust)</p>
        <p className="mt-1 text-sm text-white/50">Shows a "Trusted by …" badge under the hero buttons and a full spotlight section. Switch it off under <strong className="text-white/70">Sections → Client spotlight</strong>. Only say things that are true.</p>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 bg-black/20 p-3">
        {k.logo && <img src={assetUrl(k.logo)} alt="" className="h-16 w-16 rounded-xl object-cover" />}
        {k.mark && <img src={assetUrl(k.mark)} alt="" className="h-10 w-10 rounded-full object-cover" />}
        <p className="text-xs text-white/45">Logo images are files in the website's <code className="rounded bg-white/10 px-1">public/clients</code> folder (e.g. <code className="rounded bg-white/10 px-1">clients/circlesfundme.webp</code>) or any full web address (https://…).</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Short name"><input className={inputCls} value={k.name} onChange={(e) => set((d) => { d.client.name = e.target.value; })} /></Field>
        <Field label="Full registered name"><input className={inputCls} value={k.legalName} onChange={(e) => set((d) => { d.client.legalName = e.target.value; })} /></Field>
        <Field label="Sector"><input className={inputCls} value={k.sector} onChange={(e) => set((d) => { d.client.sector = e.target.value; })} /></Field>
        <Field label="Badge text"><input className={inputCls} value={k.badge} onChange={(e) => set((d) => { d.client.badge = e.target.value; })} placeholder="Repeat client" /></Field>
        <Field label="Full logo (file path or web address)"><input className={inputCls} value={k.logo} onChange={(e) => set((d) => { d.client.logo = e.target.value; })} /></Field>
        <Field label="Small round icon (file path or web address)"><input className={inputCls} value={k.mark} onChange={(e) => set((d) => { d.client.mark = e.target.value; })} /></Field>
      </div>
      <Field label="Heading"><input className={inputCls} value={k.heading} onChange={(e) => set((d) => { d.client.heading = e.target.value; })} /></Field>
      <Field label="Paragraph"><textarea className={`${inputCls} min-h-[100px] resize-none`} value={k.body} onChange={(e) => set((d) => { d.client.body = e.target.value; })} /></Field>
      <Field label="Tick-list (one per line)"><textarea className={`${inputCls} min-h-[80px] resize-none`} value={k.points.join('\n')} onChange={(e) => set((d) => { d.client.points = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean); })} /></Field>
      <Field label="Show their videos here" hint={`Any video in Portfolio whose "Client" field contains this text appears inside the spotlight (up to 3). Currently: "${k.matchName}".`}>
        <input className={inputCls} value={k.matchName} onChange={(e) => set((d) => { d.client.matchName = e.target.value; })} />
      </Field>

      {/* Clickable Case Study CMS */}
      <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
        <div>
          <p className="font-display text-base uppercase text-[#f5a524]">CirclesFundMe Commercial Case Study (Clickable Modal)</p>
          <p className="mt-1 text-xs text-white/50">Edit the comprehensive narrative shown when visitors click "Explore The Case Study".</p>
        </div>

        <Field label="Case Study Title">
          <input className={inputCls} value={k.caseStudy?.title ?? ''} onChange={(e) => set((d) => {
            if (!d.client.caseStudy) d.client.caseStudy = { title: '', subtitle: '', challenge: '', approach: '', process: [], deliverables: [], metrics: [], learnings: '' };
            d.client.caseStudy.title = e.target.value;
          })} />
        </Field>

        <Field label="Subtitle / One-Line Summary">
          <input className={inputCls} value={k.caseStudy?.subtitle ?? ''} onChange={(e) => set((d) => {
            if (!d.client.caseStudy) d.client.caseStudy = { title: '', subtitle: '', challenge: '', approach: '', process: [], deliverables: [], metrics: [], learnings: '' };
            d.client.caseStudy.subtitle = e.target.value;
          })} />
        </Field>

        <Field label="The Business Challenge">
          <textarea className={`${inputCls} min-h-[80px] resize-none`} value={k.caseStudy?.challenge ?? ''} onChange={(e) => set((d) => {
            if (!d.client.caseStudy) d.client.caseStudy = { title: '', subtitle: '', challenge: '', approach: '', process: [], deliverables: [], metrics: [], learnings: '' };
            d.client.caseStudy.challenge = e.target.value;
          })} />
        </Field>

        <Field label="The AdVibe AI Approach">
          <textarea className={`${inputCls} min-h-[80px] resize-none`} value={k.caseStudy?.approach ?? ''} onChange={(e) => set((d) => {
            if (!d.client.caseStudy) d.client.caseStudy = { title: '', subtitle: '', challenge: '', approach: '', process: [], deliverables: [], metrics: [], learnings: '' };
            d.client.caseStudy.approach = e.target.value;
          })} />
        </Field>

        <Field label="Production Process (one per line)">
          <textarea className={`${inputCls} min-h-[90px] resize-none font-mono text-xs`} value={(k.caseStudy?.process ?? []).join('\n')} onChange={(e) => set((d) => {
            if (!d.client.caseStudy) d.client.caseStudy = { title: '', subtitle: '', challenge: '', approach: '', process: [], deliverables: [], metrics: [], learnings: '' };
            d.client.caseStudy.process = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean);
          })} />
        </Field>

        <Field label="Campaign Deliverables (one per line)">
          <textarea className={`${inputCls} min-h-[80px] resize-none font-mono text-xs`} value={(k.caseStudy?.deliverables ?? []).join('\n')} onChange={(e) => set((d) => {
            if (!d.client.caseStudy) d.client.caseStudy = { title: '', subtitle: '', challenge: '', approach: '', process: [], deliverables: [], metrics: [], learnings: '' };
            d.client.caseStudy.deliverables = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean);
          })} />
        </Field>

        <Field label="Key Learnings & Student Takeaways">
          <textarea className={`${inputCls} min-h-[80px] resize-none`} value={k.caseStudy?.learnings ?? ''} onChange={(e) => set((d) => {
            if (!d.client.caseStudy) d.client.caseStudy = { title: '', subtitle: '', challenge: '', approach: '', process: [], deliverables: [], metrics: [], learnings: '' };
            d.client.caseStudy.learnings = e.target.value;
          })} />
        </Field>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* EVENTS CALENDAR                                                         */
/* ====================================================================== */
export function EventsTab({ draft, set }: { draft: SiteContent; set: SetFn }) {
  const e = draft.events;
  const [code, setCode] = useState(draft.countries[0]?.code ?? 'NG');
  const [state, setState] = useState<{ busy: boolean; ok?: boolean; msg?: string; list?: CalEvent[] }>({ busy: false });
  const num = (v: string, min: number, fb: number) => Math.max(min, Number(v) || fb);

  const check = async () => {
    const country = draft.countries.find((c) => c.code === code);
    if (!country) return;
    setState({ busy: true });
    const results = await Promise.all(yearsNeeded(e.windowDays).map((y) => fetchApiHolidays(country.code, y, true)));
    const ok = results.every((r) => r.ok);
    const api = results.flatMap((r) => r.list);
    const list = buildEvents({ country, campaigns: draft.campaigns, settings: { ...e, auto: true }, api });
    setState({
      busy: false, ok, list,
      msg: ok
        ? `✓ The calendar service answered: ${api.length} public holidays found for ${country.name}.`
        : `✗ The calendar service could not be reached (${results.find((r) => !r.ok)?.error ?? 'unknown reason'}). The website will quietly use the built-in dates instead — nothing breaks.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className={box}>
        <div>
          <p className="font-display text-lg uppercase text-white">Upcoming events — calendar connection</p>
          <p className="mt-1 text-sm text-white/50">The "Got something coming up?" section fills itself for each visitor's country from three sources: <strong className="text-white/70">your own events</strong> (Campaigns tab), <strong className="text-white/70">a free public-holiday calendar</strong> (Nager.Date — updates itself every year, no key needed), and <strong className="text-white/70">built-in shopping dates</strong> (Black Friday, Cyber Monday, Christmas, Valentine's, Easter, Mother's &amp; Father's Day…).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill on={e.auto} onClick={() => set((d) => { d.events.auto = !d.events.auto; })}>Live calendar: {e.auto ? 'On' : 'Off'}</Pill>
          <Pill on={e.builtin} onClick={() => set((d) => { d.events.builtin = !d.events.builtin; })}>Built-in dates: {e.builtin ? 'On' : 'Off'}</Pill>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="How many events to show"><input type="number" min={1} max={12} className={inputCls} value={e.maxItems} onChange={(ev) => set((d) => { d.events.maxItems = num(ev.target.value, 1, 6); })} /></Field>
          <Field label="Look ahead (days)" hint="150 ≈ 5 months, so year-end events show from around October."><input type="number" min={14} className={inputCls} value={e.windowDays} onChange={(ev) => set((d) => { d.events.windowDays = num(ev.target.value, 14, 150); })} /></Field>
          <Field label={'"Order by" = event minus (days)'}><input type="number" min={0} className={inputCls} value={e.leadDays} onChange={(ev) => set((d) => { d.events.leadDays = num(ev.target.value, 0, 10); })} /></Field>
        </div>
        <Field label="Hide events containing these words" hint="Comma-separated, e.g.  workers, observed, boxing"><input className={inputCls} value={e.hide} onChange={(ev) => set((d) => { d.events.hide = ev.target.value; })} placeholder="e.g. workers, observed" /></Field>
      </div>

      <div className={box}>
        <p className="font-display text-lg uppercase text-white">Words on the section</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Heading"><input className={inputCls} value={e.heading} onChange={(ev) => set((d) => { d.events.heading = ev.target.value; })} /></Field>
          <Field label="Sub-heading"><input className={inputCls} value={e.subheading} onChange={(ev) => set((d) => { d.events.subheading = ev.target.value; })} /></Field>
        </div>
        <Field label="Paragraph"><textarea className={`${inputCls} min-h-[80px] resize-none`} value={e.body} onChange={(ev) => set((d) => { d.events.body = ev.target.value; })} /></Field>
        <Field label="Button text"><input className={inputCls} value={e.cta} onChange={(ev) => set((d) => { d.events.cta = ev.target.value; })} /></Field>
      </div>

      <div className={box}>
        <p className="font-display text-lg uppercase text-white">Check it works</p>
        <p className="text-sm text-white/50">Pick a country and press the button. This asks the calendar service right now and shows exactly what visitors in that country would see (using your current, even unsaved, settings).</p>
        <div className="flex flex-wrap items-center gap-2">
          <select className={`${inputCls} !w-auto`} value={code} onChange={(ev) => setCode(ev.target.value)}>
            {draft.countries.map((c) => <option key={c.code} value={c.code} className="bg-neutral-900">{c.flag} {c.name}</option>)}
          </select>
          <button type="button" onClick={check} disabled={state.busy} className="flex min-h-[44px] items-center gap-2 rounded-lg bg-[#f5a524] px-5 text-xs font-bold uppercase text-black hover:brightness-110 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${state.busy ? 'animate-spin' : ''}`} /> {state.busy ? 'Checking…' : 'Check calendar now'}
          </button>
        </div>
        {state.msg && <p className={`rounded-lg border p-3 text-sm ${state.ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/40 bg-amber-500/10 text-amber-200'}`}>{state.msg}</p>}
        {state.list && (
          <div className="space-y-1.5">
            {state.list.length === 0 && <p className="text-sm text-white/45">No events fall inside the look-ahead window.</p>}
            {state.list.map((ev) => (
              <div key={ev.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
                <span className="text-white"><strong>{ev.name}</strong> <span className="text-white/45">· {fmtEventDate(ev.date, true)} · order by {fmtEventDate(ev.orderBy)}</span></span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${ev.source === 'manual' ? 'bg-[#f5a524]/20 text-[#f5a524]' : ev.source === 'api' ? 'bg-sky-500/20 text-sky-300' : 'bg-white/10 text-white/55'}`}>
                  {ev.source === 'manual' ? 'your event' : ev.source === 'api' ? 'calendar' : 'built-in'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* COST CARD                                                               */
/* ====================================================================== */
export function CostCardTab({ draft, set }: { draft: SiteContent; set: SetFn }) {
  const k = draft.aiCompare;
  const base = window.location.href.split('#')[0].split('?')[0];
  return (
    <div className="space-y-6">
      <div className={box}>
        <div>
          <p className="font-display text-lg uppercase text-white">Cost-comparison card</p>
          <p className="mt-1 text-sm text-white/50">The small “What AI replaces · typical costs” card under your packages. It compares the <strong className="text-white/70">typical cost of one traditional video ad</strong> (set per country in <strong className="text-white/70">Countries &amp; Prices</strong>) with <strong className="text-white/70">your real prices</strong> for that country, and links to the full breakdown page.
            Switch it off under <strong className="text-white/70">Sections</strong>.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Card title"><input className={inputCls} value={k.title} onChange={(e) => set((d) => { d.aiCompare.title = e.target.value; })} /></Field>
          <Field label="Traditional row label"><input className={inputCls} value={k.tradLabel} onChange={(e) => set((d) => { d.aiCompare.tradLabel = e.target.value; })} /></Field>
          <Field label="Your row label"><input className={inputCls} value={k.aiLabel} onChange={(e) => set((d) => { d.aiCompare.aiLabel = e.target.value; })} /></Field>
        </div>
        <Field label="Paragraph under the bars"><textarea className={`${inputCls} min-h-[80px] resize-none`} value={k.body} onChange={(e) => set((d) => { d.aiCompare.body = e.target.value; })} /></Field>
        <Field label="Link wording"><input className={inputCls} value={k.linkText} onChange={(e) => set((d) => { d.aiCompare.linkText = e.target.value; })} /></Field>
      </div>
      <div className={box}>
        <p className="font-display text-lg uppercase text-white">The full page</p>
        <p className="text-sm text-white/50">The link opens a full page at <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-[#f5a524]">{base}#/ai-video</code>. It re-uses your services, process steps, packages, headline numbers and client from the other tabs. Its remaining wording is in the file <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">src/content/aiPage.ts</code> (see README, Part 14). You can also use that link directly in ads or messages.</p>
        <a href={`${base}#/ai-video`} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-semibold text-white/80 hover:bg-white/10"><ExternalLink className="h-4 w-4" /> Open the page</a>
      </div>
    </div>
  );
}

export function MarketsView() {
  const { content, saveContent } = useStore();
  const [draft, setDraft] = useState<SiteContent>(content);
  const [activeTab, setActiveTab] = useState<'countries' | 'cost' | 'sections'>('countries');
  const [saved, setSaved] = useState(false);

  const setFn = (fn: (d: SiteContent) => void) => {
    setDraft((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as SiteContent;
      fn(clone);
      return clone;
    });
  };

  const handleSave = async () => {
    await saveContent(draft, 'Admin', 'Updated markets & pricing');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
            Market Operations
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Countries & Regional Pricing
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="font-mono text-xs font-bold text-emerald-400">✓ Saved Changes!</span>}
          <button
            onClick={handleSave}
            className="rounded-xl bg-[#f5a524] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:brightness-110"
          >
            Save All Changes
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('countries')}
          className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition ${
            activeTab === 'countries' ? 'bg-[#f5a524] text-black' : 'bg-white/5 text-white/60 hover:text-white'
          }`}
        >
          Countries & Currencies
        </button>
        <button
          onClick={() => setActiveTab('cost')}
          className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition ${
            activeTab === 'cost' ? 'bg-[#f5a524] text-black' : 'bg-white/5 text-white/60 hover:text-white'
          }`}
        >
          Cost Compare Card
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition ${
            activeTab === 'sections' ? 'bg-[#f5a524] text-black' : 'bg-white/5 text-white/60 hover:text-white'
          }`}
        >
          Website Sections
        </button>
      </div>

      {activeTab === 'countries' && <CountriesTab draft={draft} set={setFn} />}
      {activeTab === 'cost' && <CostCardTab draft={draft} set={setFn} />}
      {activeTab === 'sections' && <SectionsTab draft={draft} set={setFn} />}
    </div>
  );
}

