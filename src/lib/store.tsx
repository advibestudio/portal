import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { SiteContent, Lead, Project, AuditEntry, SessionUser, TrainingCohort, TrainingStudent } from '@/content/types';
import { defaultContent, defaultCountries, seedLeads, seedProjects } from '@/content/defaultContent';
import { defaultCohort, sampleStudents } from '@/content/defaultTraining';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isLive, getSupabase } from '@/lib/supabase';
import { fetchSiteContent, submitLeadRemote } from '@/lib/publicApi';
import { sendLeadToMake } from '@/lib/integrations';
import { track } from '@/lib/tracking';
import { mergeSalesPages } from '@/lib/sales';

/* ==========================================================================
   THE STORE — where all the site's data lives.

   LIVE mode (Supabase keys present):
     • Website text/prices/videos  -> table `site_content`   (everyone can read, staff can edit)
     • Leads                       -> table `leads`          (visitors can only SUBMIT, staff can read)
     • Projects, activity log      -> tables `projects`, `audit_log` (staff only)
     • Admin login                 -> Supabase Auth + table `profiles` (role: owner / ops)

   DEMO mode (no keys): everything is kept in this browser's localStorage so
   you can try the dashboard. Nothing is shared between devices.
   ========================================================================== */

const LS = {
  content: 'advibe.content.v1',
  leads: 'advibe.leads.v1',
  projects: 'advibe.projects.v1',
  audit: 'advibe.audit.v1',
  session: 'advibe.session.v1',
  contentCache: 'advibe.content.cache.v1',
  cohorts: 'advibe.training.cohorts.v1',
  activeCohortId: 'advibe.training.activeCohort.v1',
  students: 'advibe.training.students.v1',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
}

/**
 * Fill in anything missing from saved content, so sites saved BEFORE a feature existed keep working.
 * (e.g. content saved before "countries" existed gets the default countries, with your existing
 * Nigerian prices carried over.)
 */
function withDefaults(c: Partial<SiteContent> | null | undefined): SiteContent {
  if (!c) return defaultContent;
  const merged = {
    ...defaultContent,
    ...c,
    brand: { ...defaultContent.brand, ...c.brand },
    settings: { ...defaultContent.settings, ...c.settings },
    hero: { ...defaultContent.hero, ...c.hero },
    events: { ...defaultContent.events, ...c.events },
    sections: { ...defaultContent.sections, ...(c.sections ?? {}) },
    client: { ...defaultContent.client, ...(c.client ?? {}) },
    popups: { ...defaultContent.popups, ...(c.popups ?? {}) },
    aiCompare: { ...defaultContent.aiCompare, ...(c.aiCompare ?? {}) },
    commercialOffers: {
      ...defaultContent.commercialOffers,
      ...(c.commercialOffers ?? {}),
    },
    salesPages: mergeSalesPages(c.salesPages),
    referralSettings: {
      ...defaultContent.referralSettings,
      ...(c.referralSettings ?? {}),
    },
    affiliates: Array.isArray(c.affiliates) && c.affiliates.length > 0 ? c.affiliates : defaultContent.affiliates,
    quizConfig: {
      ...defaultContent.quizConfig,
      ...(c.quizConfig ?? {}),
      recommendation: {
        ...defaultContent.quizConfig!.recommendation,
        ...(c.quizConfig?.recommendation ?? {}),
      },
      questions: Array.isArray(c.quizConfig?.questions) && c.quizConfig!.questions.length > 0
        ? c.quizConfig!.questions
        : defaultContent.quizConfig!.questions,
    },
  } as SiteContent;

  if (!merged.settings.bookingUrl) {
    merged.settings.bookingUrl = defaultContent.settings.bookingUrl;
  }

  // Standardize primary & secondary CTAs to "Book a Free Strategy Session" and "Watch Our Work"
  if (
    merged.hero.primaryCta === 'Get my video ad' ||
    merged.hero.primaryCta === 'Book Free Strategy Session' ||
    merged.hero.primaryCta?.includes('Chat with our team on WhatsApp') ||
    (merged.hero.primaryCta?.length ?? 0) > 35
  ) {
    merged.hero.primaryCta = defaultContent.hero.primaryCta;
  }
  if (merged.hero.secondaryCta === 'See our work') {
    merged.hero.secondaryCta = defaultContent.hero.secondaryCta;
  }
  if (
    merged.finalCta?.primaryCta === 'Get my video ad' ||
    merged.finalCta?.primaryCta === 'Book Free Strategy Session' ||
    merged.finalCta?.primaryCta?.includes('Chat with our team on WhatsApp') ||
    (merged.finalCta?.primaryCta?.length ?? 0) > 35
  ) {
    merged.finalCta = { ...merged.finalCta, primaryCta: defaultContent.finalCta.primaryCta };
  }

  if (!c.countries?.length) {
    const ngPrices = Object.fromEntries((c.offers ?? []).map((o) => [o.id, o.price]));
    merged.countries = defaultCountries.map((k) =>
      k.code === 'NG' ? { ...k, prices: { ...k.prices, ...ngPrices } } : { ...k, prices: { ...k.prices } });
    // first time on this version: also bring in the country-specific starter events
    const have = new Set((c.campaigns ?? []).map((x) => x.id));
    const defById = Object.fromEntries(defaultContent.campaigns.map((x) => [x.id, x]));
    merged.campaigns = [
      ...(c.campaigns ?? []).map((x) => (x.countries === undefined && defById[x.id]?.countries ? { ...x, countries: defById[x.id].countries } : x)),
      ...defaultContent.campaigns.filter((x) => !have.has(x.id)),
    ];
  }
  // Remove legacy "Monthly Studio" offer & goal from cached localStorage state
  merged.offers = (merged.offers || []).filter((o) => o.id !== 'monthly-studio' && o.goal !== 'monthly');
  if (merged.pricing?.goals) {
    merged.pricing = {
      ...merged.pricing,
      goals: merged.pricing.goals.filter((g) => g.id !== 'monthly'),
    };
  }
  if (merged.referralSettings?.eligibleServices) {
    merged.referralSettings = {
      ...merged.referralSettings,
      eligibleServices: merged.referralSettings.eligibleServices.filter((id) => id !== 'monthly-studio'),
    };
  }

  // Migrate cached commercialOffers prices: Monthly Retainer -> ₦250,000, AI Mini-Series -> ₦300,000
  if (merged.commercialOffers?.['monthly-content']) {
    const mc = merged.commercialOffers['monthly-content'];
    const ngPrice = mc.pricesByCountry?.NG === 200000 ? 250000 : (mc.pricesByCountry?.NG ?? 250000);
    merged.commercialOffers['monthly-content'] = {
      ...mc,
      price: mc.price === 200000 ? 250000 : mc.price,
      pricesByCountry: {
        ...(defaultContent.commercialOffers?.['monthly-content']?.pricesByCountry || {}),
        ...(mc.pricesByCountry || {}),
        NG: ngPrice,
      },
    };
  }
  if (merged.commercialOffers?.['promotional-mini-series']) {
    const ms = merged.commercialOffers['promotional-mini-series'];
    const ngPrice = (ms.pricesByCountry?.NG === 200000 || ms.pricesByCountry?.NG === 150000)
      ? 300000
      : (ms.pricesByCountry?.NG ?? 300000);
    merged.commercialOffers['promotional-mini-series'] = {
      ...ms,
      price: (ms.price === 200000 || ms.price === 150000) ? 300000 : ms.price,
      pricesByCountry: {
        ...(defaultContent.commercialOffers?.['promotional-mini-series']?.pricesByCountry || {}),
        ...(ms.pricesByCountry || {}),
        NG: ngPrice,
      },
    };
  }

  // countries saved before the cost card existed get the starter "typical cost" estimates
  merged.countries = merged.countries.map((k) => {
    const def = defaultCountries.find((x) => x.code === k.code);
    const cleanedPrices = { ...k.prices };
    delete cleanedPrices['monthly-studio'];
    return {
      ...k,
      prices: cleanedPrices,
      tradLow: typeof k.tradLow === 'number' ? k.tradLow : def?.tradLow ?? 0,
      tradHigh: typeof k.tradHigh === 'number' ? k.tradHigh : def?.tradHigh ?? 0,
    };
  });
  merged.defaultCountry = c.defaultCountry || 'NG';
  return merged;
}

export function withCohortDefaults(c?: Partial<TrainingCohort> | null): TrainingCohort {
  if (!c) return defaultCohort;
  return {
    ...defaultCohort,
    ...c,
    sessions: Array.isArray(c.sessions) && c.sessions.length > 0 ? c.sessions : defaultCohort.sessions,
    pillars: Array.isArray(c.pillars) && c.pillars.length > 0 ? c.pillars : defaultCohort.pillars,
    bonuses: Array.isArray(c.bonuses) && c.bonuses.length > 0 ? c.bonuses : defaultCohort.bonuses,
    instructors: Array.isArray(c.instructors) && c.instructors.length > 0 ? c.instructors : defaultCohort.instructors,
    proofItems: Array.isArray(c.proofItems) && c.proofItems.length > 0 ? c.proofItems : defaultCohort.proofItems,
    faqs: Array.isArray(c.faqs) && c.faqs.length > 0 ? c.faqs : defaultCohort.faqs,
    prices: {
      ...defaultCohort.prices,
      ...(c.prices || {}),
    },
  };
}

/* ---------- database row <-> app object converters ---------- */
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const leadFromRow = (r: Row): Lead => ({
  id: r.id, ref: r.ref, date: String(r.created_at).slice(0, 10),
  name: r.name, business: r.business ?? '', whatsapp: r.whatsapp, email: r.email ?? '',
  offerId: r.offer_id ?? '', offerName: r.offer_name ?? '', price: Number(r.price ?? 0),
  industry: r.industry ?? '', product: r.product ?? '', event: r.event ?? 'None', notes: r.notes ?? '',
  status: r.status, paymentStatus: r.payment_status, utmSource: r.utm_source ?? undefined,
  country: r.country ?? 'NG', currency: r.currency ?? 'NGN', source: r.source ?? 'website', showPublic: Boolean(r.show_public),
  goal: r.goal ?? undefined, pageRoute: r.page_route ?? undefined,
  bookingClickedAt: r.booking_clicked_at ?? undefined, bookingConfirmedAt: r.booking_confirmed_at ?? undefined,
  referralCode: r.referral_code ?? undefined,
  affiliateId: r.affiliate_id ?? undefined,
  referralSource: r.referral_source ?? undefined,
  discountClaimed: r.discount_claimed !== undefined ? Boolean(r.discount_claimed) : undefined,
  discountPercent: r.discount_percent !== undefined ? Number(r.discount_percent) : undefined,
  discountAmount: r.discount_amount !== undefined ? Number(r.discount_amount) : undefined,
  howDidYouHear: r.how_did_you_hear ?? undefined,
  manualReferralCode: r.manual_referral_code ?? undefined,
  isFirstTimeCustomer: r.is_first_time_customer !== undefined ? Boolean(r.is_first_time_customer) : undefined,
});
const leadToRow = (l: Omit<Lead, 'id' | 'ref' | 'date'>): Row => ({
  name: l.name, business: l.business, whatsapp: l.whatsapp, email: l.email,
  offer_id: l.offerId, offer_name: l.offerName, price: l.price, industry: l.industry,
  product: l.product, event: l.event, notes: l.notes, status: l.status, payment_status: l.paymentStatus,
  utm_source: l.utmSource ?? null, country: l.country, currency: l.currency, source: l.source, show_public: l.showPublic,
  goal: l.goal ?? null, page_route: l.pageRoute ?? null,
  booking_clicked_at: l.bookingClickedAt ?? null, booking_confirmed_at: l.bookingConfirmedAt ?? null,
  referral_code: l.referralCode ?? null,
  affiliate_id: l.affiliateId ?? null,
  referral_source: l.referralSource ?? null,
  discount_claimed: l.discountClaimed ?? false,
  discount_percent: l.discountPercent ?? null,
  discount_amount: l.discountAmount ?? null,
  how_did_you_hear: l.howDidYouHear ?? null,
  manual_referral_code: l.manualReferralCode ?? null,
  is_first_time_customer: l.isFirstTimeCustomer ?? true,
});
const leadPatchToRow = (p: Partial<Lead>): Row => {
  const m: Row = {};
  if (p.status !== undefined) m.status = p.status;
  if (p.paymentStatus !== undefined) m.payment_status = p.paymentStatus;
  if (p.notes !== undefined) m.notes = p.notes;
  if (p.bookingConfirmedAt !== undefined) m.booking_confirmed_at = p.bookingConfirmedAt;
  return m;
};
const projectFromRow = (r: Row): Project => ({
  id: r.id, ref: r.ref, client: r.client, contact: r.contact ?? '', whatsapp: r.whatsapp ?? '',
  packageName: r.package_name ?? '', videosTotal: r.videos_total, videosDone: r.videos_done,
  status: r.status, payment: r.payment, startedUnpaid: r.started_unpaid,
  approvedBy: r.approved_by ?? undefined, deadline: String(r.deadline).slice(0, 10), assigned: r.assigned ?? '',
});
const projectToRow = (p: Partial<Project>): Row => {
  const m: Row = {};
  if (p.client !== undefined) m.client = p.client;
  if (p.contact !== undefined) m.contact = p.contact;
  if (p.whatsapp !== undefined) m.whatsapp = p.whatsapp;
  if (p.packageName !== undefined) m.package_name = p.packageName;
  if (p.videosTotal !== undefined) m.videos_total = p.videosTotal;
  if (p.videosDone !== undefined) m.videos_done = p.videosDone;
  if (p.status !== undefined) m.status = p.status;
  if (p.payment !== undefined) m.payment = p.payment;
  if (p.startedUnpaid !== undefined) m.started_unpaid = p.startedUnpaid;
  if (p.approvedBy !== undefined) m.approved_by = p.approvedBy;
  if (p.deadline !== undefined) m.deadline = p.deadline;
  if (p.assigned !== undefined) m.assigned = p.assigned;
  return m;
};

type NewLead = Omit<Lead, 'id' | 'ref' | 'date' | 'status' | 'paymentStatus'>;
type ManualLead = Omit<Lead, 'id' | 'ref' | 'date'>;

interface Store {
  mode: 'live' | 'demo';
  ready: boolean;
  /** false until the admin page has finished checking whether you are already signed in */
  staffReady: boolean;
  /** called by the admin page: loads the Supabase library and restores your login */
  initStaff: () => void;
  syncError: string;
  clearSyncError: () => void;
  content: SiteContent;
  /** Saves website content. Returns an error message, or null on success. */
  saveContent: (next: SiteContent, actor?: string, action?: string) => Promise<string | null>;
  resetContent: () => Promise<string | null>;
  leads: Lead[];
  addLead: (lead: NewLead, countryName?: string) => Promise<Lead>;
  /** Staff only: type in an order that came from outside the website (WhatsApp, a call, a referral…). */
  addManualLead: (lead: ManualLead, opts: { sendToMake: boolean; countryName?: string }) => Promise<string | null>;
  updateLead: (id: string, patch: Partial<Lead>, actor?: string) => void;
  deleteLead: (id: string) => void;
  projects: Project[];
  updateProject: (id: string, patch: Partial<Project>, actor?: string) => void;
  addProject: (p: Omit<Project, 'id' | 'ref'>) => void;
  audit: AuditEntry[];
  log: (user: string, action: string) => void;
  session: SessionUser | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
  refresh: () => void;

  /* Training Cohort & Student Management */
  cohorts: TrainingCohort[];
  activeCohortId: string;
  activeCohort: TrainingCohort;
  students: TrainingStudent[];
  confirmedPaidCount: number;
  cohortDisplayStatus: string;
  registerStudent: (input: Omit<TrainingStudent, 'id' | 'ref' | 'date' | 'status'>) => Promise<TrainingStudent>;
  markStudentPaid: (studentId: string, notes?: string) => void;
  updateStudent: (studentId: string, patch: Partial<TrainingStudent>) => void;
  deleteStudent: (studentId: string) => void;
  updateCohort: (cohortId: string, patch: Partial<TrainingCohort>) => void;
  startNextCohort: (settings?: { startDate: string; endDate: string; deadline: string; prices?: any }) => TrainingCohort;
  duplicateCohort: (cohortId: string) => TrainingCohort;
  switchActiveCohort: (cohortId: string) => void;
}

const Ctx = createContext<Store | null>(null);

let demoRef = Math.floor(1000 + Math.random() * 9000);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent>(() =>
    withDefaults(isLive ? load(LS.contentCache, null) : load(LS.content, null)),
  );
  const [leads, setLeads] = useState<Lead[]>(() => (isLive ? [] : load(LS.leads, seedLeads)));
  const [projects, setProjects] = useState<Project[]>(() => (isLive ? [] : load(LS.projects, seedProjects)));
  const [audit, setAudit] = useState<AuditEntry[]>(() => (isLive ? [] : load(LS.audit, [])));
  const [session, setSession] = useState<SessionUser | null>(() => (isLive ? null : load(LS.session, null)));
  const [cohorts, setCohorts] = useState<TrainingCohort[]>(() => {
    const raw = load<TrainingCohort[]>(LS.cohorts, [defaultCohort]);
    if (!Array.isArray(raw) || raw.length === 0) return [defaultCohort];
    return raw.map((c) => withCohortDefaults(c));
  });
  const [activeCohortId, setActiveCohortId] = useState<string>(() => load(LS.activeCohortId, defaultCohort.id));
  const [students, setStudents] = useState<TrainingStudent[]>(() => load(LS.students, sampleStudents));
  const [ready, setReady] = useState(!isLive);
  const [staffReady, setStaffReady] = useState(!isLive);
  const sbRef = useRef<SupabaseClient | null>(null);
  const staffStarted = useRef(false);
  const [syncError, setSyncError] = useState('');
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const fail = useCallback((what: string, err: unknown) => {
    const msg = (err as { message?: string })?.message ?? String(err);
    console.error(what, err);
    setSyncError(`${what}: ${msg}`);
  }, []);

  /* ----- demo mode: keep everything in localStorage ----- */
  useEffect(() => { if (!isLive) save(LS.content, content); }, [content]);
  useEffect(() => { if (!isLive) save(LS.leads, leads); }, [leads]);
  useEffect(() => { if (!isLive) save(LS.projects, projects); }, [projects]);
  useEffect(() => { if (!isLive) save(LS.audit, audit); }, [audit]);
  useEffect(() => { if (!isLive) save(LS.session, session); }, [session]);
  useEffect(() => { save(LS.cohorts, cohorts); }, [cohorts]);
  useEffect(() => { save(LS.activeCohortId, activeCohortId); }, [activeCohortId]);
  useEffect(() => { save(LS.students, students); }, [students]);

  /* ----- live mode: load public website content (never blocks the page) ----- */
  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    fetchSiteContent()
      .then((row) => {
        if (cancelled || !row) return;
        const merged = withDefaults(row as Partial<SiteContent>);
        setContent(merged);
        save(LS.contentCache, merged);
      })
      .catch((err) => { if (!cancelled) console.warn('Could not load website content, using saved copy', err); })
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  /* ----- live mode: staff data (only works when signed in) ----- */
  const refresh = useCallback(async () => {
    const sb = sbRef.current;
    if (!sb || !sessionRef.current) return;
    const [l, p, a] = await Promise.all([
      sb.from('leads').select('*').order('created_at', { ascending: false }).limit(1000),
      sb.from('projects').select('*').order('created_at', { ascending: false }).limit(500),
      sb.from('audit_log').select('*').order('at', { ascending: false }).limit(100),
    ]);
    if (l.error) fail('Could not load leads', l.error); else setLeads((l.data ?? []).map(leadFromRow));
    if (p.error) fail('Could not load projects', p.error); else setProjects((p.data ?? []).map(projectFromRow));
    if (!a.error) setAudit((a.data ?? []).map((r) => ({ id: r.id, at: r.at, user: r.user_name, action: r.action })));
  }, [fail]);

  const loadProfile = useCallback(async (sb: SupabaseClient, userId: string, email: string): Promise<SessionUser | null> => {
    const { data } = await sb.from('profiles').select('name, role').eq('id', userId).maybeSingle();
    if (!data) return null;
    return { email, name: data.name, role: data.role };
  }, []);

  // Called once by the admin page. Downloads the Supabase library and restores an existing login.
  const initStaff = useCallback(() => {
    if (!isLive || staffStarted.current) return;
    staffStarted.current = true;
    (async () => {
      try {
        const sb = await getSupabase();
        sbRef.current = sb;
        const { data } = await sb.auth.getSession();
        const u = data.session?.user;
        if (u) setSession(await loadProfile(sb, u.id, u.email ?? ''));
        sb.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') setSession(null); });
      } catch (err) {
        fail('Could not reach Supabase. Check your connection and the keys', err);
      } finally {
        setStaffReady(true);
      }
    })();
  }, [fail, loadProfile]);

  useEffect(() => { if (isLive && session) void refresh(); }, [session, refresh]);
  useEffect(() => {
    if (!isLive || !session) return;
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [session, refresh]);

  /* ----- audit log ----- */
  const log = useCallback((user: string, action: string) => {
    if (sbRef.current) {
      void sbRef.current.from('audit_log').insert({ user_name: user, action }).then(({ error }) => { if (error) console.warn('audit', error.message); });
    }
    setAudit((a) => [{ id: crypto.randomUUID(), at: new Date().toISOString(), user, action }, ...a].slice(0, 100));
  }, []);

  /* ----- website content ----- */
  const saveContent = useCallback(async (next: SiteContent, actor?: string, action?: string) => {
    if (isLive) {
      let sb: SupabaseClient;
      try { sb = await getSupabase(); } catch (e) { fail('Could not save website content', e); return (e as Error).message; }
      const { error } = await sb.from('site_content').upsert({ id: 1, content: next, updated_by: actor ?? null, updated_at: new Date().toISOString() });
      if (error) { fail('Could not save website content', error); return error.message; }
      save(LS.contentCache, next);
    }
    setContent(next);
    if (actor) log(actor, action ?? 'Updated website content');
    return null;
  }, [fail, log]);

  const resetContent = useCallback(() => saveContent(defaultContent), [saveContent]);

  /* ----- leads ----- */
  const addLead: Store['addLead'] = useCallback(async (input, countryName) => {
    let ref = '';
    if (isLive) {
      // A database function assigns the reference number and checks the price.
      try {
        ref = await submitLeadRemote({
          name: input.name, business: input.business, whatsapp: input.whatsapp, email: input.email,
          offerId: input.offerId, offerName: input.offerName, price: input.price,
          industry: input.industry, product: input.product, event: input.event,
          notes: input.notes, utmSource: input.utmSource ?? null,
          countryCode: input.country, currency: input.currency, showPublic: input.showPublic, source: input.source,
        });
      } catch (err) {
        console.error('submit_lead failed', err);
        // Never lose the customer: make up a reference; Make/Google Sheets will still get the lead.
        ref = `AV-W${Date.now().toString(36).slice(-5).toUpperCase()}`;
      }
    } else {
      ref = `AV-${++demoRef}`;
    }
    const full: Lead = {
      ...input, id: crypto.randomUUID(), ref, date: new Date().toISOString().slice(0, 10),
      status: 'New', paymentStatus: 'Unpaid',
    };
    if (!isLive) setLeads((ls) => [full, ...ls]);
    sendLeadToMake(full, countryName);
    // A strategy-session request has no price, so it is sent to Meta as a Lead WITHOUT a value (keeps your ad value data clean).
    track('Lead', {
      ...(full.price > 0 ? { value: full.price, currency: full.currency } : {}),
      content_name: full.offerName,
      content_category: full.source === 'strategy' ? 'strategy' : 'order',
    });
    return full;
  }, []);

  const updateLead = useCallback((id: string, patch: Partial<Lead>, actor?: string) => {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    if (sbRef.current) {
      void sbRef.current.from('leads').update(leadPatchToRow(patch)).eq('id', id).then(({ error }) => { if (error) fail('Could not update lead', error); });
    }
    if (actor) log(actor, `Updated lead ${patch.status ? `status → ${patch.status}` : patch.paymentStatus ? `payment → ${patch.paymentStatus}` : ''} (${id.slice(0, 6)})`);
  }, [fail, log]);

  const deleteLead = useCallback((id: string) => {
    setLeads((ls) => ls.filter((l) => l.id !== id));
    if (sbRef.current) void sbRef.current.from('leads').delete().eq('id', id).then(({ error }) => { if (error) fail('Could not delete lead', error); });
  }, [fail]);

  const addManualLead: Store['addManualLead'] = useCallback(async (input, opts) => {
    let full: Lead;
    if (isLive) {
      const sb = sbRef.current;
      if (!sb) return 'Not connected to the database yet — refresh the page and sign in again.';
      const { data, error } = await sb.from('leads').insert(leadToRow(input)).select().single();
      if (error || !data) { fail('Could not add the order', error); return error?.message ?? 'Could not add the order'; }
      full = leadFromRow(data);
    } else {
      full = { ...input, id: crypto.randomUUID(), ref: `AV-${++demoRef}`, date: new Date().toISOString().slice(0, 10) };
    }
    setLeads((ls) => [full, ...ls]);
    if (opts.sendToMake) sendLeadToMake(full, opts.countryName);
    log(sessionRef.current?.name ?? 'Team', `Added a manual order ${full.ref} (${full.source})`);
    return null;
  }, [fail, log]);

  /* ----- projects ----- */
  const updateProject = useCallback((id: string, patch: Partial<Project>, actor?: string) => {
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (sbRef.current) void sbRef.current.from('projects').update(projectToRow(patch)).eq('id', id).then(({ error }) => { if (error) fail('Could not update project', error); });
    if (actor) log(actor, `Updated project ${id.slice(0, 6)}`);
  }, [fail, log]);

  const addProject: Store['addProject'] = useCallback((p) => {
    if (sbRef.current) {
      void sbRef.current.from('projects').insert(projectToRow(p)).select().single().then(({ data, error }) => {
        if (error) fail('Could not create project', error);
        else if (data) setProjects((ps) => [projectFromRow(data), ...ps]);
      });
    } else {
      setProjects((ps) => [{ ...p, id: crypto.randomUUID(), ref: `PRJ-${++demoRef}` }, ...ps]);
    }
  }, [fail]);

  /* ----- sign in / out ----- */
  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const mail = email.trim().toLowerCase();
    if (isLive) {
      let sb: SupabaseClient;
      try { sb = await getSupabase(); sbRef.current = sb; } catch { return 'Could not reach the server. Check your internet connection and try again.'; }
      const { data, error } = await sb.auth.signInWithPassword({ email: mail, password });
      if (error || !data.user) return 'Incorrect email or password.';
      const prof = await loadProfile(sb, data.user.id, mail);
      if (!prof) {
        await sb.auth.signOut();
        return 'This account is not set up as team staff yet. See README.md, Part 4, step 6.';
      }
      setSession(prof);
      log(prof.name, 'Signed in');
      return null;
    }
    const { DEMO_USERS } = await import('@/content/demoUsers');
    const u = DEMO_USERS.find((x) => x.email === mail && x.password === password);
    if (!u) return 'Incorrect email or password. Try the demo accounts below.';
    setSession({ email: u.email, name: u.name, role: u.role });
    log(u.name, 'Signed in');
    return null;
  }, [loadProfile, log]);

  const signOut = useCallback(() => {
    setSession(null);
    if (sbRef.current) {
      void sbRef.current.auth.signOut();
      setLeads([]); setProjects([]); setAudit([]);
    }
  }, []);

  /* ----- training cohorts & students ----- */
  const activeCohort = useMemo(() => {
    const found = cohorts.find((c) => c.id === activeCohortId) || cohorts[0] || defaultCohort;
    return withCohortDefaults(found);
  }, [cohorts, activeCohortId]);

  const confirmedPaidCount = useMemo(() => {
    return students.filter((s) => s.cohortId === activeCohort.id && (s.status === 'paid' || s.status === 'confirmed')).length;
  }, [students, activeCohort.id]);

  const cohortDisplayStatus = useMemo(() => {
    const paid = confirmedPaidCount;
    const cap = activeCohort.seatCapacity || 100;
    const threshold = activeCohort.almostFullThreshold || 80;
    if (activeCohort.status === 'paused') return 'Paused';
    if (activeCohort.status === 'ended') return 'Ended';
    if (paid >= cap || activeCohort.status === 'full') return 'Cohort Full';
    if (paid >= cap - 10 || activeCohort.status === 'final_seats') return 'Final Seats';
    if (paid >= threshold || activeCohort.status === 'almost_full') return 'Almost Full';
    return 'Enrollment Open';
  }, [confirmedPaidCount, activeCohort]);

  const registerStudent = useCallback(async (input: Omit<TrainingStudent, 'id' | 'ref' | 'date' | 'status'>): Promise<TrainingStudent> => {
    const newStudent: TrainingStudent = {
      ...input,
      id: crypto.randomUUID(),
      ref: `ADV-TRN-${100 + students.length + 1}`,
      date: new Date().toISOString().slice(0, 10),
      status: 'registered',
    };
    setStudents((prev) => [newStudent, ...prev]);
    log('System', `New student registration: ${newStudent.name} (${newStudent.track} track, ${newStudent.country})`);
    return newStudent;
  }, [students.length, log]);

  const markStudentPaid = useCallback((studentId: string, notes?: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: 'paid' as const, notes: notes ?? s.notes } : s))
    );
    log(sessionRef.current?.name ?? 'Admin', `Confirmed payment for student ${studentId}`);
  }, [log]);

  const updateStudent = useCallback((studentId: string, patch: Partial<TrainingStudent>) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, ...patch } : s)));
    log(sessionRef.current?.name ?? 'Admin', `Updated student ${studentId}`);
  }, [log]);

  const deleteStudent = useCallback((studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    log(sessionRef.current?.name ?? 'Admin', `Removed student record ${studentId}`);
  }, [log]);

  const updateCohort = useCallback((cohortId: string, patch: Partial<TrainingCohort>) => {
    setCohorts((prev) => prev.map((c) => (c.id === cohortId ? { ...c, ...patch } : c)));
    log(sessionRef.current?.name ?? 'Admin', `Updated cohort settings for ${cohortId}`);
  }, [log]);

  const startNextCohort = useCallback((settings?: { startDate: string; endDate: string; deadline: string; prices?: any }) => {
    const nextNum = Math.max(...cohorts.map((c) => c.cohortNumber), 1) + 1;
    const newCohort: TrainingCohort = {
      ...activeCohort,
      id: `cohort-${nextNum}`,
      cohortNumber: nextNum,
      name: `The AdVibe AI Cinematography Intensive — Cohort ${nextNum}`,
      status: 'open',
      startDate: settings?.startDate || 'December 15, 2026',
      endDate: settings?.endDate || 'December 28, 2026',
      enrollmentDeadline: settings?.deadline || '2026-12-10T23:59:59',
      prices: settings?.prices || activeCohort.prices,
      isCurrent: true,
      createdAt: new Date().toISOString(),
    };
    setCohorts((prev) => [newCohort, ...prev.map((c) => ({ ...c, isCurrent: false }))]);
    setActiveCohortId(newCohort.id);
    log(sessionRef.current?.name ?? 'Admin', `Started Next Cohort: Cohort ${nextNum}`);
    return newCohort;
  }, [cohorts, activeCohort, log]);

  const duplicateCohort = useCallback((cohortId: string) => {
    const src = cohorts.find((c) => c.id === cohortId) || activeCohort;
    const nextNum = Math.max(...cohorts.map((c) => c.cohortNumber), 1) + 1;
    const cloned: TrainingCohort = {
      ...src,
      id: `cohort-${nextNum}`,
      cohortNumber: nextNum,
      name: `${src.name} (Copy)`,
      status: 'upcoming',
      isCurrent: false,
      createdAt: new Date().toISOString(),
    };
    setCohorts((prev) => [cloned, ...prev]);
    log(sessionRef.current?.name ?? 'Admin', `Duplicated cohort ${src.name}`);
    return cloned;
  }, [cohorts, activeCohort, log]);

  const switchActiveCohort = useCallback((cohortId: string) => {
    setActiveCohortId(cohortId);
    setCohorts((prev) => prev.map((c) => ({ ...c, isCurrent: c.id === cohortId })));
  }, []);

  const value = useMemo<Store>(() => ({
    mode: isLive ? 'live' : 'demo', ready, staffReady, initStaff, syncError, clearSyncError: () => setSyncError(''),
    content, saveContent, resetContent,
    leads, addLead, addManualLead, updateLead, deleteLead,
    projects, updateProject, addProject,
    audit, log, session, signIn, signOut, refresh: () => void refresh(),

    cohorts, activeCohortId, activeCohort, students, confirmedPaidCount, cohortDisplayStatus,
    registerStudent, markStudentPaid, updateStudent, deleteStudent,
    updateCohort, startNextCohort, duplicateCohort, switchActiveCohort,
  }), [ready, staffReady, initStaff, syncError, content, saveContent, resetContent, leads, addLead, addManualLead, updateLead, deleteLead, projects, updateProject, addProject, audit, log, session, signIn, signOut, refresh, cohorts, activeCohortId, activeCohort, students, confirmedPaidCount, cohortDisplayStatus, registerStudent, markStudentPaid, updateStudent, deleteStudent, updateCohort, startNextCohort, duplicateCohort, switchActiveCohort]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}

export const fmtNaira = (n: number) => '₦' + n.toLocaleString('en-NG');

export function waLink(number: string, message: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
}

export function ytThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function extractYouTubeId(url: string): string {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{6,})/);
  return m ? m[1] : url.trim();
}

export { fmtMoney } from '@/lib/money';
