import type { Country, Offer } from '@/content/types';

/** 25000 -> "₦25,000", 250 -> "GH₵250", 3500 -> "KSh 3,500", 79 -> "$79". */
export function fmtMoney(amount: number, c: Pick<Country, 'symbol'>): string {
  const n = Math.round(amount * 100) / 100;
  const s = n.toLocaleString('en-US', { maximumFractionDigits: n % 1 ? 2 : 0 });
  return /[A-Za-z]$/.test(c.symbol) ? `${c.symbol} ${s}` : `${c.symbol}${s}`;
}

/** The price of a package in one country. `undefined` means "not sold there" (the package is hidden). */
export function priceFor(offer: Offer, country: Country): number | undefined {
  const p = country.prices?.[offer.id];
  if (typeof p === 'number' && p > 0) return p;
  return country.code === 'NG' && offer.price > 0 ? offer.price : undefined;
}

/** "one video" for single videos, or "₦19,000 per video" worked out from the country's own price. */
export function unitNote(offer: Offer, country: Country): string {
  const price = priceFor(offer, country);
  if (!price || offer.quantity <= 1) return offer.unitNote;
  return `${offer.goal === 'monthly' ? '≈ ' : ''}${fmtMoney(Math.round(price / offer.quantity), country)} per video`;
}

/** Reads ?utm_source=… whether it sits before the # (normal) or after the country (#/gh?utm_source=…). */
export function getParam(name: string): string | undefined {
  const fromSearch = new URLSearchParams(window.location.search).get(name);
  if (fromSearch) return fromSearch;
  const h = window.location.hash;
  const q = h.indexOf('?');
  return (q >= 0 ? new URLSearchParams(h.slice(q + 1)).get(name) : null) ?? undefined;
}

/** The WhatsApp number to use for a country (its own, or the main one from Settings). */
export const waNumberFor = (mainNumber: string, c: Pick<Country, 'whatsappNumber'>) => (c.whatsappNumber || mainNumber).trim();
/** Payment instructions for a country (its own, or the main text from Settings). */
export const payTextFor = (mainText: string, c: Pick<Country, 'paymentInstructions'>) => (c.paymentInstructions || mainText).trim();

export function waLink(number: string, message: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
}

/** A picture/file path from Admin: full web addresses are used as-is; site paths like "clients/logo.webp" get the site's base path. */
export const assetUrl = (u: string) =>
  /^(https?:)?\/\//.test(u) ? u : `${import.meta.env.BASE_URL}${u.replace(/^\//, '')}`;

/** The lowest–highest price of ONE video with us in a country (from the single-video packages; falls back to price-per-video). */
export function ourRange(offers: Offer[], c: Country): { low: number; high: number } | null {
  const active = offers.filter((o) => o.active);
  const isNum = (x: number | undefined): x is number => typeof x === 'number' && x > 0;
  const singles = active.filter((o) => o.goal === 'one' && o.quantity <= 1).map((o) => priceFor(o, c)).filter(isNum);
  if (singles.length) return { low: Math.min(...singles), high: Math.max(...singles) };
  const per = active.map((o) => { const p = priceFor(o, c); return p ? Math.round(p / Math.max(1, o.quantity)) : undefined; }).filter(isNum);
  return per.length ? { low: Math.min(...per), high: Math.max(...per) } : null;
}
export const rangeText = (r: { low: number; high: number }, c: Pick<Country, 'symbol'>) =>
  r.low === r.high ? fmtMoney(r.low, c) : `${fmtMoney(r.low, c)}–${fmtMoney(r.high, c).replace(/^[^\d]+/, '')}`;

/** "United Kingdom" -> "the United Kingdom" (for use inside sentences). */
export const withThe = (name: string) => (/^United /.test(name) ? `the ${name}` : name);
