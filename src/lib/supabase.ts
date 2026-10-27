import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * SUPABASE CONNECTION
 * -------------------
 * The two values below come from the file `.env` (on your computer) or from
 * GitHub "Secrets" (when GitHub builds the site). See README.md, Part 4 and 5.
 *
 * - If BOTH are filled in  -> the site runs in LIVE mode (real database, real login).
 * - If either is empty     -> the site runs in DEMO mode (data stays in this browser only).
 *
 * SPEED NOTE: the big Supabase library is only downloaded when someone opens the
 * admin page. Normal visitors use the tiny functions in publicApi.ts instead,
 * so the public site stays light and fast on slow connections.
 *
 * The "anon" key is designed to be public — it is safe in a website. What
 * protects your data is the Row Level Security rules in supabase/schema.sql.
 * NEVER put the "service_role" key anywhere in this project.
 */
export const SUPABASE_URL = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '').trim().replace(/\/+$/, '');
export const SUPABASE_KEY = ((import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '').trim();

export const isLive = Boolean(SUPABASE_URL && SUPABASE_KEY);

let clientPromise: Promise<SupabaseClient> | null = null;

/** Downloads the full Supabase library the first time it's needed (admin only). */
export function getSupabase(): Promise<SupabaseClient> {
  if (!isLive) return Promise.reject(new Error('Supabase is not configured'));
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } }),
    );
  }
  return clientPromise;
}
