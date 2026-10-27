import { SUPABASE_URL, SUPABASE_KEY, isLive, getSupabase } from '@/lib/supabase';
import type { TrainingCohort } from '@/content/types';
import { defaultCohort } from '@/content/defaultTraining';

function headers(): Record<string, string> {
  const h: Record<string, string> = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
  if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SUPABASE_KEY}`;
  return h;
}

async function timedFetch(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export interface PublicCohortData {
  id: string;
  number: number;
  name: string;
  slug: string;
  state: 'OPEN' | 'ALMOST_FULL' | 'FINAL_SEATS' | 'FULL' | 'PAUSED' | 'ENDED' | 'UPCOMING';
  paid: number;
  capacity: number;
  almost_full_at: number;
  remaining: number;
  prices: Record<string, { founding: number; regular: number }>;
  future_prices?: Record<string, { founding: number; regular: number }>;
  enrollment_closes_at?: string;
  starts_at?: string;
  ends_at?: string;
  schedule_days?: string;
  sessions?: any[];
  payment_url?: string;
  refund_text?: string;
}

/**
 * Fetch server-authoritative cohort state & real confirmed seat counts
 */
export async function fetchPublicCohort(slug = 'founding-cohort'): Promise<PublicCohortData | null> {
  if (!isLive) return null;
  try {
    const res = await timedFetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_cohort_public`,
      { method: 'POST', headers: headers(), body: JSON.stringify({ p_slug: slug }) },
      8000
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Could not fetch remote cohort data, using local store', err);
    return null;
  }
}

export interface RegistrationPayload {
  cohortId: string;
  name: string;
  whatsapp: string;
  email: string;
  country: string;
  audience: 'business' | 'creator';
  businessOrType?: string;
  experienceLevel?: string;
  goal?: string;
  consentPublicDisplay?: boolean;
  consentContact?: boolean;
  notes?: string;
  utm?: Record<string, any>;
  sourceRoute?: string;
}

export interface RegistrationResult {
  success: boolean;
  registration_id: string;
  ref: string;
  amount: number;
  currency: string;
  next_step: 'pay' | 'waitlist';
  error?: string;
}

/**
 * Submits training registration with server-side validation and idempotency
 */
export async function submitRegistrationRemote(
  payload: RegistrationPayload,
  idempotencyKey?: string
): Promise<RegistrationResult> {
  if (!isLive) {
    return {
      success: true,
      registration_id: crypto.randomUUID(),
      ref: `AV-TR-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: 19997,
      currency: 'NGN',
      next_step: 'pay',
    };
  }

  try {
    const res = await timedFetch(
      `${SUPABASE_URL}/rest/v1/rpc/submit_registration`,
      {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          payload,
          p_idempotency_key: idempotencyKey || null,
        }),
      },
      12000
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Registration failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('submit_registration RPC error', err);
    return {
      success: false,
      registration_id: '',
      ref: '',
      amount: 0,
      currency: 'NGN',
      next_step: 'pay',
      error: err?.message || 'Server connection error',
    };
  }
}

/**
 * Marks that the student clicked to initiate payment
 */
export async function markPaymentStartedRemote(regId: string): Promise<boolean> {
  if (!isLive || !regId) return false;
  try {
    const res = await timedFetch(
      `${SUPABASE_URL}/rest/v1/rpc/mark_payment_started`,
      {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ p_reg_id: regId }),
      },
      6000
    );
    return res.ok;
  } catch {
    return false;
  }
}

export interface RecentTrainingEnrollment {
  first_name: string;
  country: string;
  event_type: string;
  created_at: string;
}

/**
 * Fetches recent real, consented training enrollments for social proof
 */
export async function fetchRecentTrainingToasts(hours = 72, limit = 8): Promise<RecentTrainingEnrollment[]> {
  if (!isLive) return [];
  try {
    const res = await timedFetch(
      `${SUPABASE_URL}/rest/v1/rpc/recent_training_enrollments`,
      {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ lim: limit, hours }),
      },
      6000
    );
    if (!res.ok) return [];
    return (await res.json()) as RecentTrainingEnrollment[];
  } catch {
    return [];
  }
}

/* ---------- ADMIN-AUTHENTICATED ACTIONS ---------- */

export async function markStudentPaidRemote(
  regId: string,
  adminName: string,
  overrideCap = false
): Promise<{ success: boolean; total_paid?: number; capacity?: number; error?: string }> {
  if (!isLive) return { success: true };
  try {
    const sb = await getSupabase();
    const { data, error } = await sb.rpc('mark_paid', {
      p_reg_id: regId,
      p_marked_paid_by: adminName,
      p_override_cap: overrideCap,
    });
    if (error) return { success: false, error: error.message };
    return data;
  } catch (e: any) {
    return { success: false, error: e?.message || 'Error marking paid' };
  }
}

export async function markStudentRefundedRemote(
  regId: string,
  adminName: string
): Promise<{ success: boolean; error?: string }> {
  if (!isLive) return { success: true };
  try {
    const sb = await getSupabase();
    const { data, error } = await sb.rpc('mark_refunded', {
      p_reg_id: regId,
      p_admin: adminName,
    });
    if (error) return { success: false, error: error.message };
    return data;
  } catch (e: any) {
    return { success: false, error: e?.message || 'Error refunding' };
  }
}
