import type { Campaign, Country, SiteContent } from '@/content/types';

/**
 * THE EVENTS ENGINE
 * -----------------
 * Builds the "upcoming events" list from THREE sources, merged and de-duplicated:
 *   1. manual   – campaigns you typed in Admin (always win: they carry your own wording)
 *   2. api      – public holidays from the free Nager.Date calendar API (updates itself every year)
 *   3. builtin  – a calculator for shopping dates (Black Friday, Cyber Monday, Christmas, Valentine's,
 *                 Easter, Mother's/Father's Day, national days). Works with no internet at all, so the
 *                 section is never empty even if the calendar API is down or blocked.
 *
 * Nager.Date: https://date.nager.at  — free, no key. Answers are cached on the visitor's device for
 * 7 days, so the API is called at most a couple of times a week per visitor.
 */
export interface CalEvent {
  id: string;
  name: string;
  date: string;     // YYYY-MM-DD
  orderBy: string;  // YYYY-MM-DD
  source: 'manual' | 'api' | 'builtin';
}
export interface ApiHoliday { date: string; name: string; localName?: string; global?: boolean; types?: string[] }

/* ---------- date helpers (all plain YYYY-MM-DD strings, no time-zone surprises) ---------- */
const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const fromYmd = (s: string) => new Date(`${s}T00:00:00Z`);
const toYmd = (dt: Date) => ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
export const addDays = (s: string, n: number) => { const dt = fromYmd(s); dt.setUTCDate(dt.getUTCDate() + n); return toYmd(dt); };
export const todayYmd = () => { const n = new Date(); return ymd(n.getFullYear(), n.getMonth() + 1, n.getDate()); };
export const daysBetween = (a: string, b: string) => Math.round((fromYmd(b).getTime() - fromYmd(a).getTime()) / 86400000);

/** nth weekday of a month. weekday: 0=Sun … 6=Sat. month: 1–12. */
function nthWeekday(year: number, month: number, weekday: number, n: number): string {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return ymd(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
}
/** Western Easter Sunday (standard "Anonymous Gregorian" algorithm). */
function easter(year: number): string {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return ymd(year, month, day);
}

/* ---------- built-in calculator ---------- */
function builtinFor(year: number, code: string): { name: string; date: string }[] {
  const thanks = nthWeekday(year, 11, 4, 4);
  const list: { name: string; date: string }[] = [
    { name: 'Black Friday', date: addDays(thanks, 1) },
    { name: 'Cyber Monday', date: addDays(thanks, 4) },
    { name: "Valentine's Day", date: ymd(year, 2, 14) },
    { name: "Father's Day", date: nthWeekday(year, 6, 0, 3) },
    { name: "Mother's Day", date: code === 'UK' ? addDays(easter(year), -21) : nthWeekday(year, 5, 0, 2) },
    { name: 'Easter', date: easter(year) },
    { name: 'Christmas Day', date: ymd(year, 12, 25) },
    { name: "New Year's Day", date: ymd(year, 1, 1) },
  ];
  if (code !== 'US') list.push({ name: 'Boxing Day', date: ymd(year, 12, 26) });
  if (code === 'US') list.push({ name: 'Thanksgiving', date: thanks }, { name: 'Independence Day (4th of July)', date: ymd(year, 7, 4) });
  if (code === 'NG') list.push({ name: 'Independence Day', date: ymd(year, 10, 1) }, { name: 'Democracy Day', date: ymd(year, 6, 12) });
  if (code === 'GH') list.push({ name: 'Independence Day', date: ymd(year, 3, 6) }, { name: 'Republic Day', date: ymd(year, 7, 1) });
  if (code === 'KE') list.push({ name: 'Jamhuri Day', date: ymd(year, 12, 12) }, { name: 'Madaraka Day', date: ymd(year, 6, 1) }, { name: 'Mashujaa Day', date: ymd(year, 10, 20) });
  return list;
}

/* ---------- Nager.Date (free public-holiday API) with a 7-day device cache ---------- */
const API = 'https://date.nager.at/api/v3/PublicHolidays';
const TTL = 7 * 86400000;
const apiCode = (code: string) => (code === 'UK' ? 'GB' : code);
const inflight = new Map<string, Promise<ApiResult>>();

export interface ApiResult { ok: boolean; list: ApiHoliday[]; fromCache: boolean; error?: string }

export function fetchApiHolidays(countryCode: string, year: number, force = false): Promise<ApiResult> {
  const key = `${countryCode}|${year}`;
  const lsKey = `advibe.cal.v1.${key}`;
  let cached: { t: number; list: ApiHoliday[] } | null = null;
  try { cached = JSON.parse(localStorage.getItem(lsKey) || 'null'); } catch { /* ignore */ }
  if (!force && cached && Date.now() - cached.t < TTL) return Promise.resolve({ ok: true, list: cached.list, fromCache: true });
  if (!force && inflight.has(key)) return inflight.get(key)!;

  const p = (async (): Promise<ApiResult> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    try {
      const res = await fetch(`${API}/${year}/${apiCode(countryCode)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`Calendar API answered ${res.status}`);
      const raw = (await res.json()) as ApiHoliday[];
      const list = raw
        .filter((h) => h.global !== false && (!h.types || h.types.includes('Public')))
        .map((h) => ({ date: h.date, name: h.name, localName: h.localName }));
      try { localStorage.setItem(lsKey, JSON.stringify({ t: Date.now(), list })); } catch { /* ignore */ }
      return { ok: true, list, fromCache: false };
    } catch (e) {
      // Out of date is better than nothing: use an old copy if we have one.
      if (cached) return { ok: true, list: cached.list, fromCache: true, error: (e as Error).message };
      return { ok: false, list: [], fromCache: false, error: (e as Error).name === 'AbortError' ? 'The calendar API took too long to answer' : (e as Error).message };
    } finally {
      clearTimeout(timer);
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

/* ---------- merge everything ---------- */
const STOP = new Set(['day', 'days', 'and', 'the', 'week', 'sales', 'sale', 'season', 'festive', 'new', 'national']);
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
function sameEvent(a: CalEvent, b: CalEvent): boolean {
  if (a.date === b.date) return true;
  if (Math.abs(daysBetween(a.date, b.date)) > 7) return false;
  const ta = new Set(tokens(a.name));
  return tokens(b.name).some((w) => ta.has(w));
}
const PRIORITY = { manual: 3, api: 2, builtin: 1 } as const;

export function buildEvents(opts: {
  country: Country;
  campaigns: Campaign[];
  settings: SiteContent['events'];
  api: ApiHoliday[];
  today?: string;
}): CalEvent[] {
  const { country, campaigns, settings: s } = opts;
  const today = opts.today ?? todayYmd();
  const end = addDays(today, Math.max(14, s.windowDays || 150));
  const years = Array.from(new Set([Number(today.slice(0, 4)), Number(end.slice(0, 4))]));
  const lead = Math.max(0, s.leadDays ?? 10);
  const hide = (s.hide || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);

  const all: CalEvent[] = [];
  for (const c of campaigns) {
    if (!c.active) continue;
    if (c.countries?.length && !c.countries.includes(country.code)) continue;
    all.push({ id: `m-${c.id}`, name: c.name, date: c.eventDate, orderBy: c.orderBy || addDays(c.eventDate, -lead), source: 'manual' });
  }
  if (s.auto) for (const h of opts.api) all.push({ id: `a-${h.date}-${h.name}`, name: h.name, date: h.date, orderBy: addDays(h.date, -lead), source: 'api' });
  if (s.builtin) for (const y of years) for (const b of builtinFor(y, country.code)) all.push({ id: `b-${b.date}-${b.name}`, name: b.name, date: b.date, orderBy: addDays(b.date, -lead), source: 'builtin' });

  // keep upcoming, inside the window, and not hidden
  const upcoming = all
    .filter((e) => e.date >= today && e.date <= end)
    .filter((e) => !hide.some((w) => e.name.toLowerCase().includes(w)));

  // de-duplicate: the highest-priority source wins
  upcoming.sort((a, b) => PRIORITY[b.source] - PRIORITY[a.source] || a.date.localeCompare(b.date));
  const kept: CalEvent[] = [];
  for (const e of upcoming) if (!kept.some((k) => sameEvent(k, e))) kept.push(e);

  kept.sort((a, b) => a.date.localeCompare(b.date));
  return kept.slice(0, Math.max(1, s.maxItems || 6));
}

export const yearsNeeded = (windowDays: number, today = todayYmd()) => {
  const end = addDays(today, Math.max(14, windowDays || 150));
  return Array.from(new Set([Number(today.slice(0, 4)), Number(end.slice(0, 4))]));
};

export const fmtEventDate = (s: string, withYear = false) =>
  fromYmd(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' });
