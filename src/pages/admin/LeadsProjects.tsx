import { useMemo, useState } from 'react';
import { MessageCircle, Search, Trash2, ArrowRightCircle, Plus, X } from 'lucide-react';
import { useStore, waLink } from '@/lib/store';
import { fmtMoney, priceFor } from '@/lib/money';
import type { Lead, LeadStatus, ProjectStatus } from '@/content/types';

const LEAD_STATUSES: (LeadStatus | 'All')[] = ['All', 'New', 'Contacted', 'Qualified', 'Won', 'Lost'];
const PROJECT_STATUSES: ProjectStatus[] = ['Briefing', 'In production', 'Review', 'Revision', 'Delivered', 'Closed'];

const statusColor: Record<string, string> = {
  New: 'bg-[#f5a524]/15 text-[#f5a524]',
  Contacted: 'bg-sky-500/15 text-sky-300',
  Qualified: 'bg-emerald-500/15 text-emerald-300',
  Won: 'bg-emerald-500/25 text-emerald-200',
  Lost: 'bg-white/10 text-white/40',
};

export function LeadsView() {
  const { leads, updateLead, deleteLead, addProject, session, content } = useStore();
  const [filter, setFilter] = useState<(typeof LEAD_STATUSES)[number]>('All');
  const [cc, setCc] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [q, setQ] = useState('');
  const money = (l: Lead) => {
    const k = content.countries.find((x) => x.currency === l.currency);
    return fmtMoney(l.price, k ?? { symbol: `${l.currency} ` });
  };
  const flagOf = (code: string) => content.countries.find((x) => x.code === code)?.flag ?? '🌍';
  const list = useMemo(
    () => leads.filter((l) =>
      (filter === 'All' || l.status === filter) &&
      (cc === 'All' || l.country === cc) &&
      (q === '' || `${l.name} ${l.business} ${l.ref}`.toLowerCase().includes(q.toLowerCase()))),
    [leads, filter, cc, q],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">Leads</h1>
          <p className="mt-1 text-sm text-white/50">{leads.filter((l) => l.status === 'New').length} new · {leads.length} total. Website orders land here instantly — or add one yourself with <strong className="text-white/70">Add order</strong>.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads by name, brand, ref..."
              className="min-h-[48px] w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 text-base sm:text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none sm:w-64" />
          </div>
          <button onClick={() => setShowAdd(true)} className="flex min-h-[48px] items-center gap-2 rounded-xl bg-[#f5a524] px-5 font-display text-xs font-bold uppercase tracking-wide text-black hover:brightness-110 active:scale-[0.98] shadow-md">
            <Plus className="h-4 w-4" /> Add order
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
        {['All', ...content.countries.map((k) => k.code)].map((code) => (
          <button key={code} onClick={() => setCc(code)}
            className={`min-h-[44px] shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition active:scale-[0.98] ${cc === code ? 'border-white bg-white text-black shadow-md font-bold' : 'border-white/15 bg-white/5 text-white/60 hover:text-white'}`}>
            {code === 'All' ? 'All countries' : `${flagOf(code)} ${code}`}
          </button>
        ))}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
        {LEAD_STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`min-h-[44px] shrink-0 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] ${filter === s ? 'border-[#f5a524] bg-[#f5a524] text-black shadow-md' : 'border-white/15 bg-white/5 text-white/60 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/45">No leads here yet. Share your site link — submissions from the order form appear here.</p>
      )}

      <div className="space-y-3">
        {list.map((l) => (
          <div key={l.id} className="rounded-2xl border border-white/10 bg-[#121518] p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg uppercase text-white font-bold">{l.business} <span className="font-mono text-xs normal-case text-white/40">{l.ref}</span></p>
                <p className="text-sm text-white/60">{l.name} · {l.whatsapp}{l.email ? ` · ${l.email}` : ''}</p>
                <p className="mt-1 text-sm text-white/80">{l.offerName} — <span className="font-semibold text-[#f5a524]">{l.price > 0 ? money(l) : 'free session'}</span></p>
                <p className="mt-1 text-xs text-white/40">{flagOf(l.country)} {l.country}{l.industry ? ` · ${l.industry}` : ''}{l.product ? ` · selling: ${l.product}` : ''} · event: {l.event} · {l.date}{l.utmSource ? ` · via ${l.utmSource}` : ''}{l.source === 'strategy' ? ' · strategy-session request' : l.source !== 'website' ? ` · entered manually (${l.source})` : ''}</p>
                {l.notes && <p className="mt-2 rounded-xl bg-white/5 p-3 text-xs text-white/65">“{l.notes}”</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusColor[l.status]}`}>{l.status}</span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${l.paymentStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-300' : l.paymentStatus === 'Deposit' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/45'}`}>{l.paymentStatus}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
              <select value={l.status} onChange={(e) => updateLead(l.id, { status: e.target.value as LeadStatus }, session?.name)}
                className="min-h-[44px] rounded-xl border border-white/15 bg-[#181d22] px-3.5 text-xs font-semibold text-white focus:border-[#f5a524] focus:outline-none" aria-label="Lead status">
                {LEAD_STATUSES.slice(1).map((s) => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
              </select>
              <select value={l.paymentStatus} onChange={(e) => updateLead(l.id, { paymentStatus: e.target.value as Lead['paymentStatus'] }, session?.name)}
                className="min-h-[44px] rounded-xl border border-white/15 bg-[#181d22] px-3.5 text-xs font-semibold text-white focus:border-[#f5a524] focus:outline-none" aria-label="Payment status">
                {['Unpaid', 'Deposit', 'Paid'].map((s) => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
              </select>
              <a href={waLink(l.whatsapp, `Hi ${l.name}, this is ${content.settings.whatsappDisplay} about your order ${l.ref} (${l.offerName}).`)}
                target="_blank" rel="noreferrer"
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 active:scale-[0.98]">
                <MessageCircle className="h-4 w-4 text-[#f5a524]" /> WhatsApp
              </a>
              <button
                onClick={() => addProject({ client: l.business, contact: l.name, whatsapp: l.whatsapp, packageName: l.offerName, videosTotal: 1, videosDone: 0, status: 'Briefing', payment: l.paymentStatus, startedUnpaid: false, deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), assigned: session?.name ?? '' })}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 active:scale-[0.98]">
                <ArrowRightCircle className="h-3.5 w-3.5 text-[#f5a524]" /> Convert to project
              </button>
              <button onClick={() => deleteLead(l.id)} className="grid h-10 w-10 place-items-center rounded-lg text-white/35 transition hover:bg-red-500/10 hover:text-red-300" aria-label={`Delete lead ${l.business}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {showAdd && <ManualOrderModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

/* ---------- ADD AN ORDER BY HAND (WhatsApp, phone call, referral…) ---------- */
const SOURCES = ['WhatsApp', 'Instagram', 'Facebook', 'Phone call', 'Referral', 'In person', 'Other'];
const fieldCls = 'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none';

function ManualOrderModal({ onClose }: { onClose: () => void }) {
  const { content, addManualLead, session } = useStore();
  const countries = content.countries;
  const offers = content.offers.filter((o) => o.active);
  const [f, setF] = useState({
    name: '', whatsapp: '', business: '', email: '', country: content.defaultCountry || countries[0]?.code || 'NG',
    offerId: offers[0]?.id ?? 'custom', price: '', source: 'WhatsApp', status: 'New' as LeadStatus,
    paymentStatus: 'Unpaid' as Lead['paymentStatus'], notes: '', sendToMake: true,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const country = countries.find((c) => c.code === f.country) ?? countries[0];
  const offer = offers.find((o) => o.id === f.offerId);
  const suggested = offer && country ? priceFor(offer, country) : undefined;
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async () => {
    setErr('');
    if (f.name.trim().length < 2) return setErr('Please enter the customer\'s name.');
    if (f.whatsapp.replace(/[^\d]/g, '').length < 7) return setErr('Please enter a valid WhatsApp / phone number with country code.');
    const price = f.price === '' ? suggested ?? 0 : Number(f.price);
    if (!(price >= 0)) return setErr('Price must be a number.');
    setBusy(true);
    const e = await addManualLead(
      {
        name: f.name.trim(), business: f.business.trim() || f.name.trim(), whatsapp: f.whatsapp.trim(), email: f.email.trim(),
        offerId: offer?.id ?? 'custom', offerName: offer?.name ?? 'Custom order', price, industry: '', product: '', event: 'None',
        notes: f.notes.trim(), status: f.status, paymentStatus: f.paymentStatus, utmSource: undefined,
        country: country.code, currency: country.currency, source: f.source, showPublic: false,
      },
      { sendToMake: f.sendToMake, countryName: country.name },
    );
    setBusy(false);
    if (e) return setErr(e);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add an order">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-[#121214] p-6 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl uppercase text-white">Add an order</h2>
            <p className="text-xs text-white/45">For customers who ordered outside the website. Entered as {session?.name ?? 'you'}.</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white/10" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={fieldCls} placeholder="Customer name *" value={f.name} onChange={(e) => set('name', e.target.value)} />
            <input className={fieldCls} placeholder="WhatsApp / phone (with country code) *" inputMode="tel" value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            <input className={fieldCls} placeholder="Business name" value={f.business} onChange={(e) => set('business', e.target.value)} />
            <input className={fieldCls} placeholder="Email (optional)" inputMode="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select className={fieldCls} value={f.country} onChange={(e) => { set('country', e.target.value); set('price', ''); }} aria-label="Country">
              {countries.map((c) => <option key={c.code} value={c.code} className="bg-neutral-900">{c.flag} {c.name} ({c.currency})</option>)}
            </select>
            <select className={fieldCls} value={f.offerId} onChange={(e) => { set('offerId', e.target.value); set('price', ''); }} aria-label="Package">
              {offers.map((o) => <option key={o.id} value={o.id} className="bg-neutral-900">{o.name}</option>)}
              <option value="custom" className="bg-neutral-900">Custom / other</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <input className={fieldCls} type="number" min={0} placeholder={suggested !== undefined ? `Price (${country.currency}) — ${fmtMoney(suggested, country)}` : `Price (${country.currency})`} value={f.price} onChange={(e) => set('price', e.target.value)} aria-label={`Price in ${country.currency}`} />
              <p className="mt-1 text-[11px] text-white/35">{suggested !== undefined ? 'Leave empty to use the standard price shown.' : 'No standard price for this package here — type one.'}</p>
            </div>
            <select className={fieldCls} value={f.source} onChange={(e) => set('source', e.target.value)} aria-label="Where did this order come from?">
              {SOURCES.map((s) => <option key={s} value={s} className="bg-neutral-900">Came from: {s}</option>)}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select className={fieldCls} value={f.status} onChange={(e) => set('status', e.target.value as LeadStatus)} aria-label="Lead status">
              {LEAD_STATUSES.slice(1).map((s) => <option key={s} value={s} className="bg-neutral-900">Status: {s}</option>)}
            </select>
            <select className={fieldCls} value={f.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value as Lead['paymentStatus'])} aria-label="Payment status">
              {['Unpaid', 'Deposit', 'Paid'].map((s) => <option key={s} value={s} className="bg-neutral-900">Payment: {s}</option>)}
            </select>
          </div>
          <textarea className={`${fieldCls} min-h-[80px] resize-none`} placeholder="Notes (what they want, deadlines…)" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
          <label className="flex items-start gap-2.5 text-xs text-white/55">
            <input type="checkbox" checked={f.sendToMake} onChange={(e) => set('sendToMake', e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#f5a524]" />
            <span>Also send this order to Make (Google Sheets / SendFox) like website orders. Manual orders never appear in the public “just started” pop-ups.</span>
          </label>
        </div>
        {err && <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{err}</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="min-h-[48px] rounded-xl border border-white/15 px-5 text-sm font-semibold text-white/70 hover:bg-white/5">Cancel</button>
          <button onClick={submit} disabled={busy} className="min-h-[48px] flex-1 rounded-xl bg-[#f5a524] font-display text-sm uppercase tracking-wide text-black hover:brightness-110 disabled:opacity-60">{busy ? 'Saving…' : 'Save order'}</button>
        </div>
      </div>
    </div>
  );
}

export function ProjectsView() {
  const { projects, updateProject, session, content } = useStore();
  const [q, setQ] = useState('');
  const list = projects.filter((p) => q === '' || `${p.client} ${p.ref}`.toLowerCase().includes(q.toLowerCase()));
  const daysLeft = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">Clients & Projects</h1>
          <p className="mt-1 text-sm text-white/50">{projects.filter((p) => p.status !== 'Closed').length} active · deadlines, payments and revisions in one place.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects"
            className="min-h-[44px] w-full rounded-lg border border-white/15 bg-white/5 pl-9 pr-4 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none sm:w-56" />
        </div>
      </div>

      <div className="space-y-3">
        {list.map((p) => {
          const dl = daysLeft(p.deadline);
          const pct = Math.round((p.videosDone / Math.max(1, p.videosTotal)) * 100);
          return (
            <div key={p.id} className={`rounded-xl border p-5 ${p.startedUnpaid && p.payment !== 'Paid' ? 'border-amber-500/50 bg-amber-500/[0.06]' : dl < 0 && p.status !== 'Closed' ? 'border-red-500/40 bg-red-500/[0.05]' : 'border-white/10 bg-white/[0.03]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg uppercase text-white">{p.client} <span className="font-mono text-xs normal-case text-white/35">{p.ref}</span></p>
                  <p className="text-sm text-white/55">{p.packageName} · {p.contact} · assigned to {p.assigned}</p>
                </div>
                <div className="text-right">
                  <p className={`font-display text-lg ${dl < 0 && p.status !== 'Closed' ? 'text-red-300' : dl <= 2 ? 'text-amber-300' : 'text-white'}`}>
                    {p.status === 'Closed' ? 'Done' : dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : `${dl}d left`}
                  </p>
                  <p className="text-xs text-white/40">due {new Date(p.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/45"><span>{p.videosDone} of {p.videosTotal} videos</span><span>{pct}%</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#f5a524] transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {p.startedUnpaid && p.payment !== 'Paid' && (
                <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Started before payment — approved by {p.approvedBy}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
                <select value={p.status} onChange={(e) => updateProject(p.id, { status: e.target.value as ProjectStatus }, session?.name)}
                  className="min-h-[40px] rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white focus:border-[#f5a524] focus:outline-none" aria-label="Project status">
                  {PROJECT_STATUSES.map((s) => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                </select>
                <select value={p.payment} onChange={(e) => updateProject(p.id, { payment: e.target.value as typeof p.payment }, session?.name)}
                  className="min-h-[40px] rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white focus:border-[#f5a524] focus:outline-none" aria-label="Payment">
                  {['Unpaid', 'Deposit', 'Paid'].map((s) => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                </select>
                <label className="flex items-center gap-2 text-xs text-white/55">
                  Deadline
                  <input type="date" value={p.deadline} onChange={(e) => updateProject(p.id, { deadline: e.target.value }, session?.name)}
                    className="min-h-[40px] rounded-lg border border-white/15 bg-white/5 px-2 text-xs text-white [color-scheme:dark] focus:border-[#f5a524] focus:outline-none" />
                </label>
                <button onClick={() => updateProject(p.id, { videosDone: Math.min(p.videosTotal, p.videosDone + 1) }, session?.name)}
                  className="min-h-[40px] rounded-lg border border-white/15 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/10">
                  +1 video done
                </button>
                <a href={waLink(p.whatsapp, `Hi ${p.contact}, update from ${content.settings.whatsappDisplay} on ${p.ref}: status is now "${p.status}".`)}
                  target="_blank" rel="noreferrer"
                  className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/10">
                  <MessageCircle className="h-3.5 w-3.5 text-[#f5a524]" /> WhatsApp client
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
