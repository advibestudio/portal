import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  SiteContent,
  Lead,
  Project,
  AuditEntry,
  SessionUser,
  TrainingCohort,
  TrainingStudent,
  AdminAccount,
  BusinessAssessment,
} from '@/content/types';
import { defaultContent, defaultCountries, seedLeads, seedProjects } from '@/content/defaultContent';
import { defaultCohort, sampleStudents } from '@/content/defaultTraining';
import { sendLeadToMake } from '@/lib/integrations';
import { track } from '@/lib/tracking';
import { mergeSalesPages } from '@/lib/sales';
import {
  auth,
  db,
  googleProvider,
  isFirebaseConfigured,
  trackFirestoreRead,
  trackFirestoreWrite,
  trackLocalCacheHit,
} from '@/firebase';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import {
  loadAssessments,
  saveAssessments,
  syncLeadToGoogleSheets,
  syncStudentToGoogleSheets,
  syncAllRecordsToGoogleSheets,
} from '@/lib/googleSheetsSync';
import {
  triggerImmediateSheetsBackup,
  runFirestoreToSheetsAutoBackupCycle,
  getAutoBackupDaemonState,
} from '@/lib/firestoreSheetsBackupService';

/* ==========================================================================
   THE STORE — Firebase Firestore + Google Sheets Hand-in-Hand + Local Cache
   ========================================================================== */

const LS = {
  content: 'advibe.content.v1',
  leads: 'advibe.leads.v1',
  projects: 'advibe.projects.v1',
  audit: 'advibe.audit.v1',
  session: 'advibe.session.v1',
  contentCache: 'advibe.content.cache.v1',
  contentSyncAt: 'advibe.content.sync_at.v1',
  cohorts: 'advibe.training.cohorts.v1',
  activeCohortId: 'advibe.training.activeCohort.v1',
  students: 'advibe.training.students.v1',
  admins: 'advibe.admins.v1',
};

const PRIMARY_OWNER_EMAIL = 'shittu.cfm@gmail.com';
const CONTENT_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes local cache TTL to protect Firebase free tier

export const DEFAULT_ADMINS: AdminAccount[] = [
  {
    id: PRIMARY_OWNER_EMAIL,
    email: PRIMARY_OWNER_EMAIL,
    name: 'Shittu (Primary Super Admin)',
    role: 'owner',
    backupPassword: 'advibe-owner-2026',
    addedBy: 'System Bootstrap',
    createdAt: '2026-01-01T00:00:00.000Z',
    active: true,
    isPrimaryOwner: true,
  },
  {
    id: 'owner@advibestudio.com',
    email: 'owner@advibestudio.com',
    name: 'AdVibe Backup Super Admin',
    role: 'owner',
    backupPassword: 'advibe-owner-2026',
    addedBy: PRIMARY_OWNER_EMAIL,
    createdAt: '2026-01-01T00:00:00.000Z',
    active: true,
  },
  {
    id: 'ops@advibestudio.com',
    email: 'ops@advibestudio.com',
    name: 'AdVibe Regular Admin (Ops)',
    role: 'ops',
    backupPassword: 'advibe-ops-2026',
    addedBy: PRIMARY_OWNER_EMAIL,
    createdAt: '2026-01-01T00:00:00.000Z',
    active: true,
  },
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
}

/** Recursively removes undefined values so Firestore setDoc never rejects optional fields */
function stripUndefined<T>(val: T): T {
  if (Array.isArray(val)) {
    return val.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (val !== null && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return val;
}

function normalizeAdminsList(list: AdminAccount[] | null | undefined): AdminAccount[] {
  const base = Array.isArray(list) && list.length > 0 ? [...list] : [...DEFAULT_ADMINS];
  const hasPrimary = base.some((a) => a.email.toLowerCase() === PRIMARY_OWNER_EMAIL);
  if (!hasPrimary) {
    base.unshift(DEFAULT_ADMINS[0]);
  } else {
    for (let i = 0; i < base.length; i++) {
      if (base[i].email.toLowerCase() === PRIMARY_OWNER_EMAIL) {
        base[i] = {
          ...base[i],
          id: PRIMARY_OWNER_EMAIL,
          email: PRIMARY_OWNER_EMAIL,
          role: 'owner',
          active: true,
          isPrimaryOwner: true,
          backupPassword: base[i].backupPassword || 'advibe-owner-2026',
        };
      }
    }
  }
  return base;
}

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
      questions:
        Array.isArray(c.quizConfig?.questions) && c.quizConfig!.questions.length > 0
          ? c.quizConfig!.questions
          : defaultContent.quizConfig!.questions,
    },
  } as SiteContent;

  if (!merged.settings.bookingUrl) {
    merged.settings.bookingUrl = defaultContent.settings.bookingUrl;
  }

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
      k.code === 'NG' ? { ...k, prices: { ...k.prices, ...ngPrices } } : { ...k, prices: { ...k.prices } }
    );
    const have = new Set((c.campaigns ?? []).map((x) => x.id));
    const defById = Object.fromEntries(defaultContent.campaigns.map((x) => [x.id, x]));
    merged.campaigns = [
      ...(c.campaigns ?? []).map((x) =>
        x.countries === undefined && defById[x.id]?.countries ? { ...x, countries: defById[x.id].countries } : x
      ),
      ...defaultContent.campaigns.filter((x) => !have.has(x.id)),
    ];
  }

  const defOfferMap = new Map(defaultContent.offers.map((o) => [o.id, o]));
  const filteredOffers = (merged.offers || [])
    .filter((o) => o.id !== 'monthly-studio' && o.goal !== 'monthly' && o.id !== 'single-30' && o.id !== 'single-60')
    .map((o) => {
      const def = defOfferMap.get(o.id);
      if (!def) return o;
      if (
        (o.id === 'bundle-5' || o.id === 'bundle-10') &&
        (o.duration === '30 seconds' || o.description?.includes('30-second'))
      ) {
        return {
          ...o,
          duration: def.duration,
          unitNote: def.unitNote,
          description: def.description,
          features: def.features,
          included: def.included,
        };
      }
      return o;
    });

  if (!filteredOffers.some((o) => o.id === 'single-video')) {
    const singleDef = defOfferMap.get('single-video');
    if (singleDef) {
      filteredOffers.unshift({ ...singleDef });
    }
  }
  merged.offers = filteredOffers.map((o, idx) => ({ ...o, order: idx + 1 }));

  if (merged.pricing?.goals) {
    merged.pricing = {
      ...merged.pricing,
      goals: merged.pricing.goals.filter((g) => g.id !== 'monthly'),
    };
  }
  if (merged.referralSettings?.eligibleServices) {
    const nextEligible = merged.referralSettings.eligibleServices.filter(
      (id) => id !== 'monthly-studio' && id !== 'single-30' && id !== 'single-60'
    );
    if (!nextEligible.includes('single-video')) {
      nextEligible.push('single-video');
    }
    merged.referralSettings = {
      ...merged.referralSettings,
      eligibleServices: nextEligible,
    };
  }

  const LEGACY_PLACEHOLDER_YT_IDS = new Set([
    'aqz-KE-bpKQ',
    'eRsGyueVLvQ',
    'jfKfPfyJRdk',
    'dQw4w9WgXcQ',
    '60ItHLz5WEA',
    '9bZkp7q19f0',
    'kJQP7kiw5Fk',
  ]);

  // Purge any legacy placeholder videos from portfolio and ensure all 9 CirclesFundMe vertical videos are present
  const customPortfolio = (merged.portfolio || []).filter(
    (p) => p.youtubeId && !LEGACY_PLACEHOLDER_YT_IDS.has(p.youtubeId) && !defaultContent.portfolio.some((def) => def.youtubeId === p.youtubeId)
  );
  merged.portfolio = [
    ...defaultContent.portfolio,
    ...customPortfolio.map((p, idx) => ({
      ...p,
      order: defaultContent.portfolio.length + idx + 1,
    })),
  ];

  // Update categories if still on legacy default list
  if (
    !Array.isArray(merged.categories) ||
    merged.categories.includes('UGC') ||
    merged.categories.includes('Real Estate')
  ) {
    merged.categories = [...defaultContent.categories];
  }

  if (merged.commercialOffers?.['monthly-content']) {
    const mc = merged.commercialOffers['monthly-content'];
    const defMc = defaultContent.commercialOffers?.['monthly-content'];
    const ngPrice = mc.pricesByCountry?.NG === 200000 ? 250000 : (mc.pricesByCountry?.NG ?? 250000);
    const cleanedFeaturedIds = (mc.circlesFundMeProof?.featuredVideoIds || []).filter(
      (id) => id && !LEGACY_PLACEHOLDER_YT_IDS.has(id)
    );
    merged.commercialOffers['monthly-content'] = {
      ...mc,
      price: mc.price === 200000 ? 250000 : mc.price,
      pricesByCountry: {
        ...(defMc?.pricesByCountry || {}),
        ...(mc.pricesByCountry || {}),
        NG: ngPrice,
      },
      hero: {
        ...(defMc?.hero || mc.hero),
        ...mc.hero,
        vslYoutubeId:
          mc.hero?.vslYoutubeId && !LEGACY_PLACEHOLDER_YT_IDS.has(mc.hero.vslYoutubeId)
            ? mc.hero.vslYoutubeId
            : '',
      },
      circlesFundMeProof: {
        ...(defMc?.circlesFundMeProof || mc.circlesFundMeProof),
        ...(mc.circlesFundMeProof || {}),
        featuredVideoIds:
          cleanedFeaturedIds.length > 0
            ? cleanedFeaturedIds
            : (defMc?.circlesFundMeProof?.featuredVideoIds || []),
      },
      offerSummary: defMc?.offerSummary
        ? {
            ...mc.offerSummary,
            inclusions: defMc.offerSummary.inclusions,
          }
        : mc.offerSummary,
      faqs: defMc?.faqs || mc.faqs,
    };
  }
  if (merged.commercialOffers?.['promotional-mini-series']) {
    const ms = merged.commercialOffers['promotional-mini-series'];
    const defMs = defaultContent.commercialOffers?.['promotional-mini-series'];
    const ngPrice =
      ms.pricesByCountry?.NG === 200000 || ms.pricesByCountry?.NG === 150000
        ? 300000
        : (ms.pricesByCountry?.NG ?? 300000);
    const cleanedFeaturedIds = (ms.circlesFundMeProof?.featuredVideoIds || []).filter(
      (id) => id && !LEGACY_PLACEHOLDER_YT_IDS.has(id)
    );
    merged.commercialOffers['promotional-mini-series'] = {
      ...ms,
      price: ms.price === 200000 || ms.price === 150000 ? 300000 : ms.price,
      pricesByCountry: {
        ...(defMs?.pricesByCountry || {}),
        ...(ms.pricesByCountry || {}),
        NG: ngPrice,
      },
      hero: {
        ...(defMs?.hero || ms.hero),
        ...ms.hero,
        vslYoutubeId:
          ms.hero?.vslYoutubeId && !LEGACY_PLACEHOLDER_YT_IDS.has(ms.hero.vslYoutubeId)
            ? ms.hero.vslYoutubeId
            : '',
      },
      circlesFundMeProof: {
        ...(defMs?.circlesFundMeProof || ms.circlesFundMeProof),
        ...(ms.circlesFundMeProof || {}),
        featuredVideoIds:
          cleanedFeaturedIds.length > 0
            ? cleanedFeaturedIds
            : (defMs?.circlesFundMeProof?.featuredVideoIds || []),
      },
      whatWeCreate: defMs?.whatWeCreate
        ? {
            ...ms.whatWeCreate,
            categories: defMs.whatWeCreate.categories,
          }
        : ms.whatWeCreate,
      offerSummary: defMs?.offerSummary
        ? {
            ...ms.offerSummary,
            inclusions: defMs.offerSummary.inclusions,
          }
        : ms.offerSummary,
      faqs: defMs?.faqs || ms.faqs,
    };
  }

  merged.countries = merged.countries.map((k) => {
    const def = defaultCountries.find((x) => x.code === k.code);
    const cleanedPrices = { ...k.prices };
    delete cleanedPrices['monthly-studio'];
    const fallbackSinglePrice =
      def?.prices['single-video'] ??
      cleanedPrices['single-60'] ??
      (k.code === 'NG' ? 35000 : undefined);
    if (!cleanedPrices['single-video'] && fallbackSinglePrice) {
      cleanedPrices['single-video'] = fallbackSinglePrice;
    }
    if (k.code === 'NG' && cleanedPrices['single-video'] === 25000) {
      cleanedPrices['single-video'] = 35000;
    }
    delete cleanedPrices['single-30'];
    delete cleanedPrices['single-60'];
    return {
      ...k,
      prices: cleanedPrices,
      tradLow: typeof k.tradLow === 'number' ? k.tradLow : def?.tradLow ?? 0,
      tradHigh: typeof k.tradHigh === 'number' ? k.tradHigh : def?.tradHigh ?? 0,
    };
  });

  if (Array.isArray(merged.testimonials) && merged.testimonials.length > 0) {
    const defMap = new Map(defaultContent.testimonials.map((t) => [t.id, t]));
    const existingIds = new Set(merged.testimonials.map((t) => t.id));
    merged.testimonials = [
      ...merged.testimonials.map((t) => {
        const def = defMap.get(t.id);
        if (!def) return t;
        const isLegacyShortName = t.name === 'Chiamaka E.' || t.name === 'Ibrahim M.' || t.name === 'Funke A.';
        const isLegacyShortQuote = t.quote && t.quote.length < 110;
        const isLegacy60sLabel = t.packageUsed === 'Single 60s Explainer Video';
        const isLegacyJargon =
          Boolean(t.roiMultiplier && (t.roiMultiplier.includes('ROAS') || t.roiMultiplier.includes('ROI'))) ||
          Boolean(
            t.roiHeadline &&
              (t.roiHeadline.includes('ROAS') ||
                t.roiHeadline.includes('Messaging Conversations') ||
                t.roiHeadline.includes('Order Volume') ||
                t.roiHeadline.includes('Closed Bookings'))
          ) ||
          Boolean(
            t.beforeSummary &&
              (t.beforeSummary.includes('ROAS') ||
                t.beforeSummary.includes('walkthroughs') ||
                t.beforeSummary.includes('drop-off') ||
                t.beforeSummary.includes('script discipline'))
          );

        if (isLegacyJargon || isLegacyShortName || isLegacyShortQuote || isLegacy60sLabel) {
          return {
            ...def,
            visible: typeof t.visible === 'boolean' ? t.visible : def.visible,
            featured: typeof t.featured === 'boolean' ? t.featured : def.featured,
          };
        }

        return {
          ...def,
          ...t,
          role: t.role || def.role,
          packageUsed: t.packageUsed || def.packageUsed,
          roiHeadline: t.roiHeadline || def.roiHeadline,
          roiMultiplier: t.roiMultiplier || def.roiMultiplier,
          timeframe: t.timeframe || def.timeframe,
          beforeSummary: t.beforeSummary || def.beforeSummary,
          afterSummary: t.afterSummary || def.afterSummary,
          metricComparisons: t.metricComparisons?.length ? t.metricComparisons : def.metricComparisons,
          highlightStats: t.highlightStats?.length ? t.highlightStats : def.highlightStats,
        };
      }),
      ...defaultContent.testimonials.filter((t) => !existingIds.has(t.id)),
    ];
  } else {
    merged.testimonials = defaultContent.testimonials;
  }

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
    instructors:
      Array.isArray(c.instructors) && c.instructors.length > 0 ? c.instructors : defaultCohort.instructors,
    proofItems: Array.isArray(c.proofItems) && c.proofItems.length > 0 ? c.proofItems : defaultCohort.proofItems,
    faqs: Array.isArray(c.faqs) && c.faqs.length > 0 ? c.faqs : defaultCohort.faqs,
    prices: {
      ...defaultCohort.prices,
      ...(c.prices || {}),
    },
  };
}

type NewLead = Omit<Lead, 'id' | 'ref' | 'date' | 'status' | 'paymentStatus'>;
type ManualLead = Omit<Lead, 'id' | 'ref' | 'date'>;

interface Store {
  mode: 'live' | 'demo';
  ready: boolean;
  staffReady: boolean;
  initStaff: () => void;
  syncError: string;
  clearSyncError: () => void;
  content: SiteContent;
  saveContent: (next: SiteContent, actor?: string, action?: string) => Promise<string | null>;
  resetContent: () => Promise<string | null>;
  leads: Lead[];
  addLead: (lead: NewLead, countryName?: string) => Promise<Lead>;
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
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => void;
  refresh: () => void;

  /* Super Admin & Regular Admin Team Management */
  admins: AdminAccount[];
  addOrUpdateAdmin: (input: {
    email: string;
    name: string;
    role: 'owner' | 'ops';
    backupPassword?: string;
    active?: boolean;
  }) => Promise<string | null>;
  removeAdmin: (email: string) => Promise<string | null>;

  /* Firebase Free-Tier Quota Saver & Google Sheets Sync */
  pruneSyncedRecordsFromFirestore: () => Promise<{ leadsPruned: number; assessmentsPruned: number; message: string }>;

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
    withDefaults(load(LS.content, load(LS.contentCache, null)))
  );
  const [leads, setLeads] = useState<Lead[]>(() => load(LS.leads, seedLeads));
  const [projects, setProjects] = useState<Project[]>(() => load(LS.projects, seedProjects));
  const [audit, setAudit] = useState<AuditEntry[]>(() => load(LS.audit, []));
  const [session, setSession] = useState<SessionUser | null>(() => load(LS.session, null));
  const [admins, setAdmins] = useState<AdminAccount[]>(() =>
    normalizeAdminsList(load<AdminAccount[]>(LS.admins, DEFAULT_ADMINS))
  );
  const [cohorts, setCohorts] = useState<TrainingCohort[]>(() => {
    const raw = load<TrainingCohort[]>(LS.cohorts, [defaultCohort]);
    if (!Array.isArray(raw) || raw.length === 0) return [defaultCohort];
    return raw.map((c) => withCohortDefaults(c));
  });
  const [activeCohortId, setActiveCohortId] = useState<string>(() => load(LS.activeCohortId, defaultCohort.id));
  const [students, setStudents] = useState<TrainingStudent[]>(() => load(LS.students, sampleStudents));
  const [ready, setReady] = useState(true);
  const [staffReady, setStaffReady] = useState(true);
  const staffStarted = useRef(false);
  const [syncError, setSyncError] = useState('');
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const adminsRef = useRef(admins);
  adminsRef.current = admins;

  /* ----- Always keep localStorage cache updated for 0ms reads & free-tier protection ----- */
  useEffect(() => {
    save(LS.content, content);
    save(LS.contentCache, content);
  }, [content]);
  useEffect(() => {
    save(LS.leads, leads);
  }, [leads]);
  useEffect(() => {
    save(LS.projects, projects);
  }, [projects]);
  useEffect(() => {
    save(LS.audit, audit);
  }, [audit]);
  useEffect(() => {
    save(LS.session, session);
  }, [session]);
  useEffect(() => {
    save(LS.admins, admins);
  }, [admins]);
  useEffect(() => {
    save(LS.cohorts, cohorts);
  }, [cohorts]);
  useEffect(() => {
    save(LS.activeCohortId, activeCohortId);
  }, [activeCohortId]);
  useEffect(() => {
    save(LS.students, students);
  }, [students]);

  /* ----- Public boot: Load consolidated site_content from Firestore ONLY if cache TTL expired ----- */
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let cancelled = false;
    const lastSyncAt = Number(localStorage.getItem(LS.contentSyncAt) || 0);
    const cacheFresh = Date.now() - lastSyncAt < CONTENT_CACHE_TTL_MS && Boolean(localStorage.getItem(LS.content));

    if (cacheFresh) {
      trackLocalCacheHit(1);
      setReady(true);
      return;
    }

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'site_content', 'main'));
        trackFirestoreRead(1);
        if (!cancelled && snap.exists()) {
          const data = snap.data();
          if (data?.content) {
            const merged = withDefaults(data.content as Partial<SiteContent>);
            setContent(merged);
            save(LS.content, merged);
            save(LS.contentCache, merged);
          }
          if (typeof data?.activeCohortId === 'string') {
            setActiveCohortId(data.activeCohortId);
          }
        }
        localStorage.setItem(LS.contentSyncAt, String(Date.now()));
      } catch (err) {
        console.warn('Using cached website content:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ----- Refresh all collections from Firestore (when Admin is signed in) ----- */
  const refresh = useCallback(async () => {
    if (!isFirebaseConfigured) return;

    try {
      // 1. Always refresh public site_content & cohorts
      const contentSnap = await getDoc(doc(db, 'site_content', 'main'));
      trackFirestoreRead(1);
      if (contentSnap.exists()) {
        const d = contentSnap.data();
        if (d?.content) {
          setContent(withDefaults(d.content as Partial<SiteContent>));
        }
      }

      const cohortsSnap = await getDocs(collection(db, 'cohorts'));
      trackFirestoreRead(Math.max(1, cohortsSnap.size));
      if (!cohortsSnap.empty) {
        const loadedCohorts = cohortsSnap.docs.map((d) => withCohortDefaults(d.data() as TrainingCohort));
        setCohorts(loadedCohorts);
      }

      // 2. If authenticated with Firebase Auth, pull admin collections
      if (!auth.currentUser) return;

      const [leadsSnap, projectsSnap, studentsSnap, adminsSnap, auditSnap, assessmentsSnap] = await Promise.all([
        getDocs(query(collection(db, 'leads'), limit(500))),
        getDocs(query(collection(db, 'projects'), limit(200))),
        getDocs(query(collection(db, 'students'), limit(500))),
        getDocs(query(collection(db, 'admins'), limit(100))),
        getDocs(query(collection(db, 'audit_log'), orderBy('at', 'desc'), limit(100))),
        getDocs(query(collection(db, 'assessments'), limit(500))),
      ]);

      trackFirestoreRead(
        Math.max(1, leadsSnap.size) +
          Math.max(1, projectsSnap.size) +
          Math.max(1, studentsSnap.size) +
          Math.max(1, adminsSnap.size) +
          Math.max(1, auditSnap.size) +
          Math.max(1, assessmentsSnap.size)
      );

      if (!leadsSnap.empty) {
        const remoteLeads = leadsSnap.docs.map((d) => d.data() as Lead);
        setLeads((prev) => {
          const map = new Map<string, Lead>();
          prev.forEach((l) => map.set(l.id, l));
          remoteLeads.forEach((l) => map.set(l.id, l));
          return Array.from(map.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        });
      }

      if (!projectsSnap.empty) {
        const remoteProjects = projectsSnap.docs.map((d) => d.data() as Project);
        setProjects((prev) => {
          const map = new Map<string, Project>();
          prev.forEach((p) => map.set(p.id, p));
          remoteProjects.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
      }

      if (!studentsSnap.empty) {
        const remoteStudents = studentsSnap.docs.map((d) => d.data() as TrainingStudent);
        setStudents((prev) => {
          const map = new Map<string, TrainingStudent>();
          prev.forEach((s) => map.set(s.id, s));
          remoteStudents.forEach((s) => map.set(s.id, s));
          return Array.from(map.values());
        });
      }

      if (!adminsSnap.empty) {
        const remoteAdmins = adminsSnap.docs.map((d) => d.data() as AdminAccount);
        setAdmins((prev) => {
          const map = new Map<string, AdminAccount>();
          prev.forEach((a) => map.set(a.email.toLowerCase(), a));
          remoteAdmins.forEach((a) => map.set(a.email.toLowerCase(), a));
          return normalizeAdminsList(Array.from(map.values()));
        });
      }

      if (!auditSnap.empty) {
        const remoteAudit = auditSnap.docs.map((d) => d.data() as AuditEntry);
        setAudit(remoteAudit);
      }

      if (!assessmentsSnap.empty) {
        const remoteAssessments = assessmentsSnap.docs.map((d) => d.data() as BusinessAssessment);
        const localAssessments = loadAssessments();
        const map = new Map<string, BusinessAssessment>();
        localAssessments.forEach((a) => map.set(a.assessmentId, a));
        remoteAssessments.forEach((a) => map.set(a.assessmentId, a));
        saveAssessments(
          Array.from(map.values()).sort((a, b) =>
            (b.timestampSubmitted || '').localeCompare(a.timestampSubmitted || '')
          )
        );
      }
    } catch (err) {
      console.warn('Firestore refresh warning:', err);
    }
  }, []);

  /* ----- Initialize Staff Auth Listener ----- */
  const initStaff = useCallback(() => {
    if (staffStarted.current) return;
    staffStarted.current = true;
    if (!isFirebaseConfigured) {
      setStaffReady(true);
      return;
    }

    onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser || !fbUser.email) {
        setStaffReady(true);
        return;
      }

      const mail = fbUser.email.trim().toLowerCase();
      try {
        // Check if primary bootstrapped owner or in /admins/{email}
        let matchedAdmin = adminsRef.current.find(
          (a) => a.email.toLowerCase() === mail && a.active
        );

        try {
          const adminDoc = await getDoc(doc(db, 'admins', mail));
          trackFirestoreRead(1);
          if (adminDoc.exists()) {
            const remoteData = adminDoc.data() as AdminAccount;
            if (remoteData.active) {
              matchedAdmin = remoteData;
            }
          } else if (mail === PRIMARY_OWNER_EMAIL) {
            // Auto-bootstrap primary owner document in Firestore
            const ownerDoc: AdminAccount = {
              id: PRIMARY_OWNER_EMAIL,
              email: PRIMARY_OWNER_EMAIL,
              name: fbUser.displayName || 'Shittu (Primary Super Admin)',
              role: 'owner',
              backupPassword: 'advibe-owner-2026',
              addedBy: 'System Bootstrap',
              createdAt: new Date().toISOString(),
              active: true,
              isPrimaryOwner: true,
            };
            await setDoc(doc(db, 'admins', PRIMARY_OWNER_EMAIL), stripUndefined(ownerDoc), { merge: true });
            trackFirestoreWrite(1);
            matchedAdmin = ownerDoc;
          }
        } catch {
          // Fallback to local admins list if offline
        }

        if (mail === PRIMARY_OWNER_EMAIL && !matchedAdmin) {
          matchedAdmin = DEFAULT_ADMINS[0];
        }

        if (matchedAdmin && matchedAdmin.active) {
          setSession({
            email: mail,
            name: fbUser.displayName || matchedAdmin.name,
            role: mail === PRIMARY_OWNER_EMAIL ? 'owner' : matchedAdmin.role,
            authMethod: 'google',
            photoURL: fbUser.photoURL || undefined,
          });
          void refresh();
        }
      } finally {
        setStaffReady(true);
      }
    });
  }, [refresh]);

  /* ----- Audit Log ----- */
  const log = useCallback((user: string, action: string) => {
    const entry: AuditEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      user,
      action,
    };
    setAudit((a) => [entry, ...a].slice(0, 100));
    if (isFirebaseConfigured && auth.currentUser) {
      void setDoc(doc(db, 'audit_log', entry.id), entry)
        .then(() => trackFirestoreWrite(1))
        .catch(() => {});
    }
  }, []);

  /* ----- Save Website Content (Consolidated single doc to protect Firebase free tier) ----- */
  const saveContent = useCallback(
    async (next: SiteContent, actor?: string, action?: string) => {
      setContent(next);
      save(LS.content, next);
      save(LS.contentCache, next);
      localStorage.setItem(LS.contentSyncAt, String(Date.now()));

      if (isFirebaseConfigured && auth.currentUser) {
        try {
          await setDoc(
            doc(db, 'site_content', 'main'),
            stripUndefined({
              id: 'main',
              content: next,
              activeCohortId,
              updatedBy: actor ?? sessionRef.current?.email ?? 'Admin',
              updatedAt: new Date().toISOString(),
            }),
            { merge: true }
          );
          trackFirestoreWrite(1);
        } catch (err) {
          console.warn('Saved locally; Firestore content sync will complete on next Google Sign-In:', err);
        }
      }

      if (actor) log(actor, action ?? 'Updated website content');
      return null;
    },
    [activeCohortId, log]
  );

  const resetContent = useCallback(() => saveContent(defaultContent, 'Admin', 'Reset website content to defaults'), [saveContent]);

  /* ----- Client Leads, Strategy Bookings & Referrals (Firestore + Google Sheets Dual Sync) ----- */
  const addLead: Store['addLead'] = useCallback(async (input, countryName) => {
    const ref = `AV-${Date.now().toString(36).slice(-4).toUpperCase()}${Math.floor(10 + Math.random() * 89)}`;
    const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const full: Lead = {
      ...input,
      id,
      ref,
      date: new Date().toISOString().slice(0, 10),
      status: 'New',
      paymentStatus: 'Unpaid',
      sheetsSynced: false,
    };

    setLeads((ls) => [full, ...ls]);

    // 1. Save to Firebase Firestore (/leads/{id})
    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'leads', id), stripUndefined(full));
        trackFirestoreWrite(1);
      } catch (err) {
        console.warn('Lead saved locally; Firestore write warning:', err);
      }
    }

    // 2. Automatically enqueue & back up newly submitted Firestore record to Google Sheets
    triggerImmediateSheetsBackup({ collection: 'leads', record: full })
      .then((res) => {
        if (res.synced && res.syncedAt) {
          setLeads((ls) =>
            ls.map((l) => (l.id === id ? { ...l, sheetsSynced: true, sheetsSyncedAt: res.syncedAt } : l))
          );
        }
      })
      .catch(() => {});

    // 3. Send to Make webhook & Meta Pixel if configured
    sendLeadToMake(full, countryName);
    track('Lead', {
      ...(full.price > 0 ? { value: full.price, currency: full.currency } : {}),
      content_name: full.offerName,
      content_category: full.source === 'strategy' ? 'strategy' : 'order',
    });

    return full;
  }, []);

  const updateLead = useCallback(
    (id: string, patch: Partial<Lead>, actor?: string) => {
      setLeads((ls) => {
        const next = ls.map((l) => (l.id === id ? { ...l, ...patch, sheetsSynced: false } : l));
        const updatedLead = next.find((l) => l.id === id);
        if (updatedLead) {
          if (isFirebaseConfigured) {
            void setDoc(doc(db, 'leads', id), stripUndefined(updatedLead), { merge: true })
              .then(() => trackFirestoreWrite(1))
              .catch(() => {});
          }
          // Automatically back up updated Firestore lead to Google Sheets
          void triggerImmediateSheetsBackup({ collection: 'leads', record: updatedLead }).then((res) => {
            if (res.synced && res.syncedAt) {
              setLeads((curr) =>
                curr.map((l) => (l.id === id ? { ...l, sheetsSynced: true, sheetsSyncedAt: res.syncedAt } : l))
              );
            }
          });
        }
        return next;
      });
      if (actor) {
        log(
          actor,
          `Updated lead ${
            patch.status ? `status → ${patch.status}` : patch.paymentStatus ? `payment → ${patch.paymentStatus}` : ''
          } (${id.slice(0, 8)})`
        );
      }
    },
    [log]
  );

  const deleteLead = useCallback((id: string) => {
    setLeads((ls) => ls.filter((l) => l.id !== id));
    if (isFirebaseConfigured && auth.currentUser) {
      void deleteDoc(doc(db, 'leads', id))
        .then(() => trackFirestoreWrite(1))
        .catch(() => {});
    }
  }, []);

  const addManualLead: Store['addManualLead'] = useCallback(
    async (input, opts) => {
      const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const full: Lead = {
        ...input,
        id,
        ref: `AV-${++demoRef}`,
        date: new Date().toISOString().slice(0, 10),
        sheetsSynced: false,
      };
      setLeads((ls) => [full, ...ls]);

      if (isFirebaseConfigured) {
        try {
          await setDoc(doc(db, 'leads', id), stripUndefined(full));
          trackFirestoreWrite(1);
        } catch {
          /* ignore */
        }
      }
      void triggerImmediateSheetsBackup({ collection: 'leads', record: full }).then((res) => {
        if (res.synced && res.syncedAt) {
          setLeads((curr) =>
            curr.map((l) => (l.id === id ? { ...l, sheetsSynced: true, sheetsSyncedAt: res.syncedAt } : l))
          );
        }
      });
      if (opts.sendToMake) sendLeadToMake(full, opts.countryName);
      log(sessionRef.current?.name ?? 'Team', `Added a manual order ${full.ref} (${full.source})`);
      return null;
    },
    [log]
  );

  /* ----- Production Projects ----- */
  const updateProject = useCallback(
    (id: string, patch: Partial<Project>, actor?: string) => {
      setProjects((ps) => {
        const next = ps.map((p) => (p.id === id ? { ...p, ...patch } : p));
        const updated = next.find((p) => p.id === id);
        if (updated && isFirebaseConfigured && auth.currentUser) {
          void setDoc(doc(db, 'projects', id), stripUndefined(updated), { merge: true })
            .then(() => trackFirestoreWrite(1))
            .catch(() => {});
        }
        return next;
      });
      if (actor) log(actor, `Updated project ${id.slice(0, 8)}`);
    },
    [log]
  );

  const addProject: Store['addProject'] = useCallback((p) => {
    const id = `prj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const full: Project = { ...p, id, ref: `PRJ-${++demoRef}` };
    setProjects((ps) => [full, ...ps]);
    if (isFirebaseConfigured && auth.currentUser) {
      void setDoc(doc(db, 'projects', id), stripUndefined(full))
        .then(() => trackFirestoreWrite(1))
        .catch(() => {});
    }
  }, []);

  /* ----- Admin Sign-In: Google Sign-In (Primary) + Backup Password ----- */
  const signInWithGoogle = useCallback(async (): Promise<string | null> => {
    if (!isFirebaseConfigured) {
      return 'Firebase is not configured yet.';
    }
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const mail = (fbUser.email || '').trim().toLowerCase();
      if (!mail) {
        await fbSignOut(auth);
        return 'Could not read email address from Google account.';
      }

      // Check Firestore /admins/{mail} or local admins list
      let matchedAdmin = adminsRef.current.find((a) => a.email.toLowerCase() === mail && a.active);
      try {
        const snap = await getDoc(doc(db, 'admins', mail));
        trackFirestoreRead(1);
        if (snap.exists()) {
          const data = snap.data() as AdminAccount;
          if (data.active) {
            matchedAdmin = data;
          }
        }
      } catch {
        /* fallback to local list */
      }

      // Always allow bootstrapped primary owner shittu.cfm@gmail.com
      if (mail === PRIMARY_OWNER_EMAIL) {
        const ownerRecord: AdminAccount = {
          id: PRIMARY_OWNER_EMAIL,
          email: PRIMARY_OWNER_EMAIL,
          name: fbUser.displayName || matchedAdmin?.name || 'Shittu (Primary Super Admin)',
          role: 'owner',
          backupPassword: matchedAdmin?.backupPassword || 'advibe-owner-2026',
          addedBy: 'System Bootstrap',
          createdAt: matchedAdmin?.createdAt || new Date().toISOString(),
          active: true,
          isPrimaryOwner: true,
        };
        try {
          await setDoc(doc(db, 'admins', PRIMARY_OWNER_EMAIL), stripUndefined(ownerRecord), { merge: true });
          trackFirestoreWrite(1);
        } catch {
          /* ignore */
        }
        matchedAdmin = ownerRecord;
      }

      if (!matchedAdmin || !matchedAdmin.active) {
        await fbSignOut(auth);
        return `Access denied for "${mail}". Sign in with an authorized admin Gmail (such as ${PRIMARY_OWNER_EMAIL}), or sign in with your backup password first and add "${mail}" as a Super Admin or Regular Admin in Team & Access.`;
      }

      const nextSession: SessionUser = {
        email: mail,
        name: fbUser.displayName || matchedAdmin.name,
        role: mail === PRIMARY_OWNER_EMAIL ? 'owner' : matchedAdmin.role,
        authMethod: 'google',
        photoURL: fbUser.photoURL || undefined,
      };
      setSession(nextSession);
      log(nextSession.name, `Signed in with Google (${mail})`);
      void refresh();
      return null;
    } catch (err: any) {
      const code = String(err?.code || '');
      if (code.includes('popup-closed-by-user')) {
        return 'Google sign-in popup was closed before finishing.';
      }
      if (code.includes('unauthorized-domain')) {
        return 'This preview domain is not yet authorized for Google popup sign-in, or popup was blocked. Please use your Backup Admin Password below.';
      }
      return err?.message || 'Google sign-in failed. You can also use your Backup Admin Password below.';
    }
  }, [log, refresh]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const mail = email.trim().toLowerCase();
      const pass = password.trim();

      // Check managed admins list (includes shittu.cfm@gmail.com + any new Super/Regular Admins + default accounts)
      const matched = adminsRef.current.find(
        (a) => a.email.toLowerCase() === mail && a.active && a.backupPassword === pass
      );

      if (matched) {
        const nextSession: SessionUser = {
          email: matched.email.toLowerCase(),
          name: matched.name,
          role: matched.email.toLowerCase() === PRIMARY_OWNER_EMAIL ? 'owner' : matched.role,
          authMethod: 'password',
        };
        setSession(nextSession);
        log(nextSession.name, `Signed in with backup password (${mail})`);
        void refresh();
        return null;
      }

      // Also check legacy DEMO_USERS fallback
      const { DEMO_USERS } = await import('@/content/demoUsers');
      const u = DEMO_USERS.find((x) => x.email.toLowerCase() === mail && x.password === pass);
      if (!u) {
        return 'Incorrect email or backup password. Sign in with Google above or check your credentials.';
      }
      setSession({ email: u.email, name: u.name, role: u.role, authMethod: 'password' });
      log(u.name, 'Signed in with backup password');
      return null;
    },
    [log, refresh]
  );

  const signOut = useCallback(() => {
    setSession(null);
    if (isFirebaseConfigured && auth.currentUser) {
      void fbSignOut(auth);
    }
  }, []);

  /* ----- Super Admin & Regular Admin Team Management ----- */
  const addOrUpdateAdmin: Store['addOrUpdateAdmin'] = useCallback(
    async (input) => {
      if (sessionRef.current?.role !== 'owner') {
        return 'Only a Super Admin (Owner) can add or modify admin accounts.';
      }
      const cleanEmail = input.email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return 'Please enter a valid Gmail or email address.';
      }
      const cleanName = input.name.trim() || cleanEmail.split('@')[0];
      const existing = adminsRef.current.find((a) => a.email.toLowerCase() === cleanEmail);

      // Protect primary owner from being downgraded or deactivated
      const finalRole: 'owner' | 'ops' = cleanEmail === PRIMARY_OWNER_EMAIL ? 'owner' : input.role;
      const finalActive = cleanEmail === PRIMARY_OWNER_EMAIL ? true : (input.active ?? true);

      const record: AdminAccount = {
        id: cleanEmail,
        email: cleanEmail,
        name: cleanName,
        role: finalRole,
        backupPassword:
          input.backupPassword !== undefined && input.backupPassword.trim() !== ''
            ? input.backupPassword.trim()
            : existing?.backupPassword || 'advibe-admin-2026',
        addedBy: sessionRef.current?.email || PRIMARY_OWNER_EMAIL,
        createdAt: existing?.createdAt || new Date().toISOString(),
        active: finalActive,
        isPrimaryOwner: cleanEmail === PRIMARY_OWNER_EMAIL,
      };

      setAdmins((prev) => {
        const filtered = prev.filter((a) => a.email.toLowerCase() !== cleanEmail);
        return normalizeAdminsList([record, ...filtered]);
      });

      if (isFirebaseConfigured && auth.currentUser) {
        try {
          await setDoc(doc(db, 'admins', cleanEmail), stripUndefined(record), { merge: true });
          trackFirestoreWrite(1);
        } catch (err) {
          console.warn('Admin saved locally; sign in with Google as Super Admin to sync to cloud:', err);
        }
      }

      log(
        sessionRef.current?.name || 'Super Admin',
        `${existing ? 'Updated' : 'Added'} ${finalRole === 'owner' ? 'Super Admin' : 'Regular Admin'}: ${cleanEmail}`
      );
      return null;
    },
    [log]
  );

  const removeAdmin: Store['removeAdmin'] = useCallback(
    async (email) => {
      if (sessionRef.current?.role !== 'owner') {
        return 'Only a Super Admin (Owner) can remove admin accounts.';
      }
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail === PRIMARY_OWNER_EMAIL) {
        return 'The primary owner account (shittu.cfm@gmail.com) cannot be removed.';
      }

      setAdmins((prev) => normalizeAdminsList(prev.filter((a) => a.email.toLowerCase() !== cleanEmail)));

      if (isFirebaseConfigured && auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'admins', cleanEmail));
          trackFirestoreWrite(1);
        } catch (err) {
          console.warn('Could not delete admin doc from Firestore:', err);
        }
      }

      log(sessionRef.current?.name || 'Super Admin', `Removed admin access for ${cleanEmail}`);
      return null;
    },
    [log]
  );

  /* ----- Firebase Free-Tier Quota Saver: Prune already-synced rows from Firestore ----- */
  const pruneSyncedRecordsFromFirestore: Store['pruneSyncedRecordsFromFirestore'] = useCallback(async () => {
    // 1. First push everything to Google Sheets so nothing is ever lost
    const syncRes = await syncAllRecordsToGoogleSheets({
      leads,
      students,
      assessments: loadAssessments(),
    });

    if (!syncRes.ok) {
      return {
        leadsPruned: 0,
        assessmentsPruned: 0,
        message: syncRes.message,
      };
    }

    if (!isFirebaseConfigured || !auth.currentUser) {
      return {
        leadsPruned: 0,
        assessmentsPruned: 0,
        message: `${syncRes.message} Sign in with Google as a Super Admin to prune archived cloud documents from Firestore.`,
      };
    }

    // Prune closed/won/lost leads & synced assessments older than 14 days from Firestore (keeping them in Google Sheets & local archive)
    const cutoffMs = Date.now() - 14 * 24 * 3600 * 1000;
    let leadsPruned = 0;
    let assessmentsPruned = 0;

    for (const l of leads) {
      const leadTime = Date.parse(l.date || '');
      if (!Number.isNaN(leadTime) && leadTime < cutoffMs && (l.status === 'Won' || l.status === 'Lost')) {
        try {
          await deleteDoc(doc(db, 'leads', l.id));
          trackFirestoreWrite(1);
          leadsPruned++;
        } catch {
          /* ignore */
        }
      }
    }

    for (const a of loadAssessments()) {
      const aTime = Date.parse(a.timestampSubmitted || '');
      if (!Number.isNaN(aTime) && aTime < cutoffMs && a.syncStatus === 'synced') {
        try {
          await deleteDoc(doc(db, 'assessments', a.assessmentId));
          trackFirestoreWrite(1);
          assessmentsPruned++;
        } catch {
          /* ignore */
        }
      }
    }

    return {
      leadsPruned,
      assessmentsPruned,
      message: `All records backed up to Google Sheets. Pruned ${leadsPruned} archived leads and ${assessmentsPruned} old assessments from Firestore to keep your Firebase Free Tier clean.`,
    };
  }, [leads, students]);

  /* ----- Training Cohorts & Students (Firestore + Google Sheets Dual Sync) ----- */
  const activeCohort = useMemo(() => {
    const found = cohorts.find((c) => c.id === activeCohortId) || cohorts[0] || defaultCohort;
    return withCohortDefaults(found);
  }, [cohorts, activeCohortId]);

  const confirmedPaidCount = useMemo(() => {
    return students.filter((s) => s.cohortId === activeCohort.id && (s.status === 'paid' || s.status === 'confirmed'))
      .length;
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

  const registerStudent = useCallback(
    async (input: Omit<TrainingStudent, 'id' | 'ref' | 'date' | 'status'>): Promise<TrainingStudent> => {
      const id = `stu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newStudent: TrainingStudent = {
        ...input,
        id,
        ref: `ADV-TRN-${100 + students.length + 1}`,
        date: new Date().toISOString().slice(0, 10),
        status: 'registered',
        sheetsSynced: false,
      };
      setStudents((prev) => [newStudent, ...prev]);

      // 1. Save to Firebase Firestore (/students/{id})
      if (isFirebaseConfigured) {
        try {
          await setDoc(doc(db, 'students', id), stripUndefined(newStudent));
          trackFirestoreWrite(1);
        } catch (err) {
          console.warn('Student saved locally; Firestore write warning:', err);
        }
      }

      // 2. Automatically enqueue & back up newly submitted Firestore student to Google Sheets
      triggerImmediateSheetsBackup({ collection: 'students', record: newStudent })
        .then((res) => {
          if (res.synced && res.syncedAt) {
            setStudents((prev) =>
              prev.map((s) => (s.id === id ? { ...s, sheetsSynced: true, sheetsSyncedAt: res.syncedAt } : s))
            );
          }
        })
        .catch(() => {});

      log('System', `New student registration: ${newStudent.name} (${newStudent.track} track, ${newStudent.country})`);
      return newStudent;
    },
    [students.length, log]
  );

  const markStudentPaid = useCallback(
    (studentId: string, notes?: string) => {
      setStudents((prev) => {
        const next = prev.map((s) =>
          s.id === studentId ? { ...s, status: 'paid' as const, notes: notes ?? s.notes, sheetsSynced: false } : s
        );
        const updated = next.find((s) => s.id === studentId);
        if (updated) {
          if (isFirebaseConfigured && auth.currentUser) {
            void setDoc(doc(db, 'students', studentId), stripUndefined(updated), { merge: true })
              .then(() => trackFirestoreWrite(1))
              .catch(() => {});
          }
          void triggerImmediateSheetsBackup({ collection: 'students', record: updated }).then((res) => {
            if (res.synced && res.syncedAt) {
              setStudents((curr) =>
                curr.map((s) =>
                  s.id === studentId ? { ...s, sheetsSynced: true, sheetsSyncedAt: res.syncedAt } : s
                )
              );
            }
          });
        }
        return next;
      });
      log(sessionRef.current?.name ?? 'Admin', `Confirmed payment for student ${studentId}`);
    },
    [log]
  );

  const updateStudent = useCallback(
    (studentId: string, patch: Partial<TrainingStudent>) => {
      setStudents((prev) => {
        const next = prev.map((s) => (s.id === studentId ? { ...s, ...patch, sheetsSynced: false } : s));
        const updated = next.find((s) => s.id === studentId);
        if (updated) {
          if (isFirebaseConfigured && auth.currentUser) {
            void setDoc(doc(db, 'students', studentId), stripUndefined(updated), { merge: true })
              .then(() => trackFirestoreWrite(1))
              .catch(() => {});
          }
          void triggerImmediateSheetsBackup({ collection: 'students', record: updated }).then((res) => {
            if (res.synced && res.syncedAt) {
              setStudents((curr) =>
                curr.map((s) =>
                  s.id === studentId ? { ...s, sheetsSynced: true, sheetsSyncedAt: res.syncedAt } : s
                )
              );
            }
          });
        }
        return next;
      });
      log(sessionRef.current?.name ?? 'Admin', `Updated student ${studentId}`);
    },
    [log]
  );

  /* ----- Background Auto-Backup Daemon (Firestore -> Google Sheets Redundancy) ----- */
  const leadsRef = useRef(leads);
  leadsRef.current = leads;
  const studentsRef = useRef(students);
  studentsRef.current = students;

  useEffect(() => {
    const runDaemon = () => {
      const daemonState = getAutoBackupDaemonState();
      if (!daemonState.enabled) return;
      void runFirestoreToSheetsAutoBackupCycle({
        leads: leadsRef.current,
        students: studentsRef.current,
        onLeadSynced: (leadId, syncedAt) => {
          setLeads((curr) =>
            curr.map((l) => (l.id === leadId ? { ...l, sheetsSynced: true, sheetsSyncedAt: syncedAt } : l))
          );
        },
        onStudentSynced: (studentId, syncedAt) => {
          setStudents((curr) =>
            curr.map((s) => (s.id === studentId ? { ...s, sheetsSynced: true, sheetsSyncedAt: syncedAt } : s))
          );
        },
      });
    };

    window.addEventListener('online', runDaemon);
    const timer = window.setInterval(runDaemon, 45000);
    return () => {
      window.removeEventListener('online', runDaemon);
      window.clearInterval(timer);
    };
  }, []);

  const deleteStudent = useCallback(
    (studentId: string) => {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      if (isFirebaseConfigured && auth.currentUser) {
        void deleteDoc(doc(db, 'students', studentId))
          .then(() => trackFirestoreWrite(1))
          .catch(() => {});
      }
      log(sessionRef.current?.name ?? 'Admin', `Removed student record ${studentId}`);
    },
    [log]
  );

  const updateCohort = useCallback(
    (cohortId: string, patch: Partial<TrainingCohort>) => {
      setCohorts((prev) => {
        const next = prev.map((c) => (c.id === cohortId ? { ...c, ...patch } : c));
        const updated = next.find((c) => c.id === cohortId);
        if (updated && isFirebaseConfigured && auth.currentUser) {
          void setDoc(doc(db, 'cohorts', cohortId), stripUndefined(updated), { merge: true })
            .then(() => trackFirestoreWrite(1))
            .catch(() => {});
        }
        return next;
      });
      log(sessionRef.current?.name ?? 'Admin', `Updated cohort settings for ${cohortId}`);
    },
    [log]
  );

  const startNextCohort = useCallback(
    (settings?: { startDate: string; endDate: string; deadline: string; prices?: any }) => {
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
      if (isFirebaseConfigured && auth.currentUser) {
        void setDoc(doc(db, 'cohorts', newCohort.id), stripUndefined(newCohort))
          .then(() => trackFirestoreWrite(1))
          .catch(() => {});
      }
      log(sessionRef.current?.name ?? 'Admin', `Started Next Cohort: Cohort ${nextNum}`);
      return newCohort;
    },
    [cohorts, activeCohort, log]
  );

  const duplicateCohort = useCallback(
    (cohortId: string) => {
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
      if (isFirebaseConfigured && auth.currentUser) {
        void setDoc(doc(db, 'cohorts', cloned.id), stripUndefined(cloned))
          .then(() => trackFirestoreWrite(1))
          .catch(() => {});
      }
      log(sessionRef.current?.name ?? 'Admin', `Duplicated cohort ${src.name}`);
      return cloned;
    },
    [cohorts, activeCohort, log]
  );

  const switchActiveCohort = useCallback((cohortId: string) => {
    setActiveCohortId(cohortId);
    setCohorts((prev) => prev.map((c) => ({ ...c, isCurrent: c.id === cohortId })));
  }, []);

  const value = useMemo<Store>(
    () => ({
      mode: isFirebaseConfigured ? 'live' : 'demo',
      ready,
      staffReady,
      initStaff,
      syncError,
      clearSyncError: () => setSyncError(''),
      content,
      saveContent,
      resetContent,
      leads,
      addLead,
      addManualLead,
      updateLead,
      deleteLead,
      projects,
      updateProject,
      addProject,
      audit,
      log,
      session,
      signIn,
      signInWithGoogle,
      signOut,
      refresh: () => void refresh(),
      admins,
      addOrUpdateAdmin,
      removeAdmin,
      pruneSyncedRecordsFromFirestore,
      cohorts,
      activeCohortId,
      activeCohort,
      students,
      confirmedPaidCount,
      cohortDisplayStatus,
      registerStudent,
      markStudentPaid,
      updateStudent,
      deleteStudent,
      updateCohort,
      startNextCohort,
      duplicateCohort,
      switchActiveCohort,
    }),
    [
      ready,
      staffReady,
      initStaff,
      syncError,
      content,
      saveContent,
      resetContent,
      leads,
      addLead,
      addManualLead,
      updateLead,
      deleteLead,
      projects,
      updateProject,
      addProject,
      audit,
      log,
      session,
      signIn,
      signInWithGoogle,
      signOut,
      refresh,
      admins,
      addOrUpdateAdmin,
      removeAdmin,
      pruneSyncedRecordsFromFirestore,
      cohorts,
      activeCohortId,
      activeCohort,
      students,
      confirmedPaidCount,
      cohortDisplayStatus,
      registerStudent,
      markStudentPaid,
      updateStudent,
      deleteStudent,
      updateCohort,
      startNextCohort,
      duplicateCohort,
      switchActiveCohort,
    ]
  );

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
