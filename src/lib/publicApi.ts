import { SUPABASE_URL, SUPABASE_KEY } from '@/lib/supabase';

/**
 * TINY PUBLIC API
 * ---------------
 * What ordinary website visitors need from Supabase, done with plain `fetch`
 * (a few hundred bytes of code) instead of the full Supabase library.
 *   1. read the website content
 *   2. submit an order (through the safe `submit_lead` database function)
 */
function headers(): Record<string, string> {
  const h: Record<string, string> = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
  // Older-style keys are JWTs (start with "eyJ") and are also sent as a bearer token.
  if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SUPABASE_KEY}`;
  return h;
}

/** fetch that gives up after `ms` milliseconds, so a bad connection never hangs the page. */
async function timedFetch(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function fetchSiteContent(): Promise<unknown | null> {
  const res = await timedFetch(`${SUPABASE_URL}/rest/v1/site_content?id=eq.1&select=content`, { headers: headers() }, 10000);
  if (!res.ok) throw new Error(`Content request failed (${res.status})`);
  const rows = (await res.json()) as { content: unknown }[];
  return rows[0]?.content ?? null;
}

export async function submitLeadRemote(payload: Record<string, unknown>): Promise<string> {
  const res = await timedFetch(
    `${SUPABASE_URL}/rest/v1/rpc/submit_lead`,
    { method: 'POST', headers: headers(), body: JSON.stringify({ p: payload }) },
    15000,
  );
  if (!res.ok) throw new Error(`Order request failed (${res.status})`);
  return String(await res.json());
}

export interface RecentOrder { first_name: string; country: string; created_at: string }

/** Who recently started an order (first name + country only, and only people who agreed). */
export async function fetchRecentOrders(hours: number, limit = 10): Promise<RecentOrder[]> {
  const res = await timedFetch(
    `${SUPABASE_URL}/rest/v1/rpc/recent_orders`,
    { method: 'POST', headers: headers(), body: JSON.stringify({ lim: limit, hours }) },
    8000,
  );
  if (!res.ok) throw new Error(`Recent orders request failed (${res.status})`);
  return (await res.json()) as RecentOrder[];
}
