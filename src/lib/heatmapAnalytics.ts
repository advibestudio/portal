import { useEffect } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { canUseFirestoreQuota, recordFirestoreQuotaOp } from '@/lib/firestoreSheetsBackupService';

export interface SectionHeatmapRecord {
  id: string;
  page: string;
  sectionId: string;
  label: string;
  views: number;
  totalDwellSeconds: number;
  clicks: number;
  updatedAt: string;
}

const HEATMAP_STORAGE_KEY = 'advibe.section.heatmap.v1';
const PAGEVIEWS_STORAGE_KEY = 'advibe.pageviews.summary.v1';

export interface PageViewSummary {
  page: string;
  label: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPageSec: number;
  lastVisitedAt: string;
}

const LEGACY_SEED_HEATMAP_IDS = new Set([
  'home_hero',
  'home_work',
  'home_clients',
  'home_pricing',
  'home_services',
  'home_process',
  'home_faq',
  'miniseries_hero',
  'miniseries_formats',
  'miniseries_offer',
  'retainer_deliverables',
]);

const DEFAULT_HEATMAP_SECTIONS: SectionHeatmapRecord[] = [];
const DEFAULT_PAGEVIEWS: PageViewSummary[] = [];

export function loadHeatmapRecords(): SectionHeatmapRecord[] {
  try {
    const raw = localStorage.getItem(HEATMAP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SectionHeatmapRecord[];
    return Array.isArray(parsed)
      ? parsed.filter((r) => r && !LEGACY_SEED_HEATMAP_IDS.has(r.id))
      : [];
  } catch {
    return [];
  }
}

export function loadPageViewSummaries(): PageViewSummary[] {
  try {
    const raw = localStorage.getItem(PAGEVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PageViewSummary[];
    if (!Array.isArray(parsed)) return [];
    // Filter out legacy seeded fake totals (e.g. 428, 196, 164, 138, 84)
    return parsed.filter(
      (p) =>
        !(
          (p.page === 'Homepage' && p.views >= 428) ||
          (p.page === 'AI Mini-Series' && p.views >= 196) ||
          (p.page === 'Monthly Retainer' && p.views >= 164) ||
          (p.page === 'Training' && p.views >= 138) ||
          (p.page === 'Client Portal' && p.views >= 84)
        ),
    );
  } catch {
    return [];
  }
}

export async function clearAllHeatmapAndPageviews(): Promise<void> {
  try {
    localStorage.setItem(HEATMAP_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(PAGEVIEWS_STORAGE_KEY, JSON.stringify([]));
  } catch {
    // ignore
  }
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'section_heatmap'));
    await Promise.all(
      snap.docs.map((d) => deleteDoc(doc(db, 'section_heatmap', d.id)).catch(() => {})),
    );
  } catch {
    // ignore
  }
}

export function recordPageView(pageName: string, label: string) {
  try {
    const list = loadPageViewSummaries();
    const visitorKey = `advibe.visited.${pageName}`;
    const isNewVisitor = !sessionStorage.getItem(visitorKey);
    sessionStorage.setItem(visitorKey, '1');

    const idx = list.findIndex((p) => p.page === pageName);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        views: list[idx].views + 1,
        uniqueVisitors: list[idx].uniqueVisitors + (isNewVisitor ? 1 : 0),
        lastVisitedAt: new Date().toISOString(),
      };
    } else {
      list.push({
        page: pageName,
        label,
        views: 1,
        uniqueVisitors: 1,
        avgTimeOnPageSec: 45,
        lastVisitedAt: new Date().toISOString(),
      });
    }
    localStorage.setItem(PAGEVIEWS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

export function recordSectionEngagement(
  id: string,
  page: string,
  sectionId: string,
  label: string,
  dwellSecondsDelta: number,
  clicksDelta = 0,
  viewsDelta = 0,
) {
  try {
    const list = loadHeatmapRecords();
    const idx = list.findIndex((r) => r.id === id);
    let updated: SectionHeatmapRecord;
    if (idx >= 0) {
      updated = {
        ...list[idx],
        views: list[idx].views + viewsDelta,
        totalDwellSeconds: Math.round(list[idx].totalDwellSeconds + dwellSecondsDelta),
        clicks: list[idx].clicks + clicksDelta,
        updatedAt: new Date().toISOString(),
      };
      list[idx] = updated;
    } else {
      updated = {
        id,
        page,
        sectionId,
        label,
        views: Math.max(1, viewsDelta),
        totalDwellSeconds: Math.max(1, Math.round(dwellSecondsDelta)),
        clicks: clicksDelta,
        updatedAt: new Date().toISOString(),
      };
      list.push(updated);
    }
    localStorage.setItem(HEATMAP_STORAGE_KEY, JSON.stringify(list));

    // Sync to Firestore when dwell time is meaningful (>= 5s) and within quota
    if (dwellSecondsDelta >= 5 && canUseFirestoreQuota('writes', 1)) {
      recordFirestoreQuotaOp('writes', 1);
      void setDoc(doc(db, 'section_heatmap', updated.id), updated, { merge: true }).catch(() => {});
    }
  } catch {
    // ignore
  }
}

export type TrafficSourceBucketId = 'search' | 'social' | 'ads_referrals' | 'direct';

export interface TrafficSourceCounter {
  id: TrafficSourceBucketId;
  label: string;
  subtitle: string;
  visits: number;
  uniqueSessions: number;
  updatedAt: string;
}

const TRAFFIC_SOURCES_STORAGE_KEY = 'advibe.traffic.sources.v1';
const TRAFFIC_SESSION_RECORDED_KEY = 'advibe.traffic.session.recorded.v1';

const DEFAULT_TRAFFIC_SOURCES: TrafficSourceCounter[] = [
  {
    id: 'search',
    label: 'Google & Search',
    subtitle: 'Google, Bing, DuckDuckGo & organic search queries',
    visits: 0,
    uniqueSessions: 0,
    updatedAt: '',
  },
  {
    id: 'social',
    label: 'Social & WhatsApp',
    subtitle: 'Instagram, Facebook, TikTok, YouTube, LinkedIn & WhatsApp',
    visits: 0,
    uniqueSessions: 0,
    updatedAt: '',
  },
  {
    id: 'ads_referrals',
    label: 'Paid Ads & Referrals',
    subtitle: 'Google Ads, Meta/TikTok Ads & Affiliate referral links',
    visits: 0,
    uniqueSessions: 0,
    updatedAt: '',
  },
  {
    id: 'direct',
    label: 'Direct Visits',
    subtitle: 'Typed URL, bookmarks & direct GitHub domain visits',
    visits: 0,
    uniqueSessions: 0,
    updatedAt: '',
  },
];

export function loadTrafficSourceSummary(): TrafficSourceCounter[] {
  try {
    const raw = localStorage.getItem(TRAFFIC_SOURCES_STORAGE_KEY);
    if (!raw) return DEFAULT_TRAFFIC_SOURCES.map((d) => ({ ...d }));
    const parsed = JSON.parse(raw) as TrafficSourceCounter[];
    if (!Array.isArray(parsed)) return DEFAULT_TRAFFIC_SOURCES.map((d) => ({ ...d }));
    return DEFAULT_TRAFFIC_SOURCES.map((def) => {
      const found = parsed.find((p) => p && p.id === def.id);
      return found
        ? {
            ...def,
            visits: Math.max(0, Number(found.visits) || 0),
            uniqueSessions: Math.max(0, Number(found.uniqueSessions) || 0),
            updatedAt: found.updatedAt || '',
          }
        : { ...def };
    });
  } catch {
    return DEFAULT_TRAFFIC_SOURCES.map((d) => ({ ...d }));
  }
}

export function classifyCurrentTrafficSource(): TrafficSourceBucketId {
  if (typeof window === 'undefined') return 'direct';
  try {
    const searchParams = new URLSearchParams(window.location.search || '');
    const hashQueryIdx = (window.location.hash || '').indexOf('?');
    const hashParams =
      hashQueryIdx >= 0
        ? new URLSearchParams(window.location.hash.slice(hashQueryIdx + 1))
        : new URLSearchParams();

    const getParam = (k: string) =>
      (searchParams.get(k) || hashParams.get(k) || '').toLowerCase().trim();

    const gclid = getParam('gclid');
    const fbclid = getParam('fbclid');
    const ttclid = getParam('ttclid');
    const msclkid = getParam('msclkid');
    const refCode = getParam('ref') || getParam('affiliate') || getParam('partner');
    const utmSource = getParam('utm_source');
    const utmMedium = getParam('utm_medium');

    // 1. Check Paid Ads or Affiliate Referral first
    if (
      gclid ||
      fbclid ||
      ttclid ||
      msclkid ||
      refCode ||
      ['cpc', 'ppc', 'paid', 'ads', 'ad', 'display', 'retargeting', 'affiliate', 'referral'].includes(
        utmMedium,
      )
    ) {
      return 'ads_referrals';
    }

    // 2. Check explicit UTM Source if present
    if (
      ['google', 'bing', 'duckduckgo', 'yahoo', 'baidu', 'yandex', 'search', 'organic'].some(
        (s) => utmSource.includes(s) || utmMedium.includes(s),
      )
    ) {
      return 'search';
    }

    if (
      [
        'instagram',
        'ig',
        'facebook',
        'fb',
        'tiktok',
        'whatsapp',
        'wa',
        'youtube',
        'yt',
        'twitter',
        'x.com',
        'linkedin',
        'social',
      ].some((s) => utmSource.includes(s) || utmMedium.includes(s))
    ) {
      return 'social';
    }

    // 3. Inspect document.referrer
    const ref = (document.referrer || '').toLowerCase();
    if (!ref) return 'direct';

    try {
      const refUrl = new URL(ref);
      if (refUrl.hostname === window.location.hostname) {
        return 'direct';
      }
      const host = refUrl.hostname;
      if (
        host.includes('google.') ||
        host.includes('bing.com') ||
        host.includes('duckduckgo.com') ||
        host.includes('search.yahoo.') ||
        host.includes('yandex.') ||
        host.includes('baidu.com')
      ) {
        return 'search';
      }
      if (
        host.includes('instagram.com') ||
        host.includes('facebook.com') ||
        host.includes('fb.com') ||
        host.includes('t.co') ||
        host.includes('twitter.com') ||
        host.includes('x.com') ||
        host.includes('tiktok.com') ||
        host.includes('youtube.com') ||
        host.includes('youtu.be') ||
        host.includes('linkedin.com') ||
        host.includes('wa.me') ||
        host.includes('whatsapp.com')
      ) {
        return 'social';
      }
      // External website referral
      return 'ads_referrals';
    } catch {
      return 'direct';
    }
  } catch {
    return 'direct';
  }
}

export function recordArrivalTrafficSource() {
  if (typeof window === 'undefined') return;
  try {
    const alreadyRecordedSession = sessionStorage.getItem(TRAFFIC_SESSION_RECORDED_KEY);
    const bucketId = (alreadyRecordedSession as TrafficSourceBucketId) || classifyCurrentTrafficSource();
    const isNewSession = !alreadyRecordedSession;

    if (isNewSession) {
      sessionStorage.setItem(TRAFFIC_SESSION_RECORDED_KEY, bucketId);
    } else {
      // Only count 1 arrival per browser session so internal route changes don't inflate source counts
      return;
    }

    const list = loadTrafficSourceSummary();
    const idx = list.findIndex((item) => item.id === bucketId);
    if (idx < 0) return;

    const updatedItem: TrafficSourceCounter = {
      ...list[idx],
      visits: list[idx].visits + 1,
      uniqueSessions: list[idx].uniqueSessions + 1,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updatedItem;
    localStorage.setItem(TRAFFIC_SOURCES_STORAGE_KEY, JSON.stringify(list));

    // Sync to Firestore section_heatmap using a compliant SectionHeatmapRecord shape
    if (canUseFirestoreQuota('writes', 1)) {
      recordFirestoreQuotaOp('writes', 1);
      const docId = `traffic_source_${bucketId}`;
      const record: SectionHeatmapRecord = {
        id: docId,
        page: 'TrafficSources',
        sectionId: bucketId,
        label: updatedItem.label,
        views: updatedItem.visits,
        totalDwellSeconds: updatedItem.uniqueSessions,
        clicks: 0,
        updatedAt: updatedItem.updatedAt,
      };
      void setDoc(doc(db, 'section_heatmap', docId), record, { merge: true }).catch(() => {});
    }
  } catch {
    // ignore storage errors
  }
}

export async function fetchFirestoreTrafficSources(): Promise<TrafficSourceCounter[]> {
  const local = loadTrafficSourceSummary();
  if (!canUseFirestoreQuota('reads', 1)) return local;
  try {
    recordFirestoreQuotaOp('reads', 1);
    const snap = await getDocs(collection(db, 'section_heatmap'));
    if (snap.empty) return local;

    const merged = local.map((item) => ({ ...item }));
    snap.docs.forEach((d) => {
      const data = d.data() as SectionHeatmapRecord;
      if (data && data.page === 'TrafficSources' && data.sectionId) {
        const target = merged.find((m) => m.id === data.sectionId);
        if (target && data.views >= target.visits) {
          target.visits = data.views;
          target.uniqueSessions = Math.max(target.uniqueSessions, data.totalDwellSeconds || data.views);
          target.updatedAt = data.updatedAt || target.updatedAt;
        }
      }
    });

    localStorage.setItem(TRAFFIC_SOURCES_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return local;
  }
}

export async function resetAllTrafficSources(): Promise<TrafficSourceCounter[]> {
  const fresh = DEFAULT_TRAFFIC_SOURCES.map((d) => ({ ...d, updatedAt: new Date().toISOString() }));
  try {
    localStorage.setItem(TRAFFIC_SOURCES_STORAGE_KEY, JSON.stringify(fresh));
    sessionStorage.removeItem(TRAFFIC_SESSION_RECORDED_KEY);
  } catch {
    // ignore
  }
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await Promise.all(
      DEFAULT_TRAFFIC_SOURCES.map((item) =>
        deleteDoc(doc(db, 'section_heatmap', `traffic_source_${item.id}`)).catch(() => {}),
      ),
    );
  } catch {
    // ignore
  }
  return fresh;
}

export async function fetchFirestoreHeatmapRecords(): Promise<SectionHeatmapRecord[]> {
  const local = loadHeatmapRecords();
  if (!canUseFirestoreQuota('reads', 1)) return local;
  try {
    recordFirestoreQuotaOp('reads', 1);
    const snap = await getDocs(collection(db, 'section_heatmap'));
    if (snap.empty) return local;
    const map = new Map<string, SectionHeatmapRecord>();
    local.forEach((item) => map.set(item.id, item));
    snap.docs.forEach((d) => {
      const data = d.data() as SectionHeatmapRecord;
      if (data && data.id && data.page !== 'TrafficSources') {
        const existing = map.get(data.id);
        if (!existing || data.totalDwellSeconds >= existing.totalDwellSeconds) {
          map.set(data.id, data);
        }
      }
    });
    const merged = Array.from(map.values());
    localStorage.setItem(HEATMAP_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return local;
  }
}

/**
 * React hook that automatically tracks visitor arrival source, page views, and section dwell-time heatmaps
 * across public pages using IntersectionObserver.
 */
export function usePageHeatmapTracker(route: string) {
  useEffect(() => {
    if (route.startsWith('/admin') || route.startsWith('/client-admin')) return;

    // Record visitor arrival source once per session (Google/Search, Social/WhatsApp, Paid Ads/Referrals, Direct)
    recordArrivalTrafficSource();

    const pageInfo =
      route.startsWith('/promotional-mini-series')
        ? { page: 'AI Mini-Series', label: 'AI Promotional Mini-Series (#/promotional-mini-series)' }
        : route.startsWith('/monthly-content')
          ? { page: 'Monthly Retainer', label: 'Monthly Content Retainer (#/monthly-content)' }
          : route.startsWith('/training')
            ? { page: 'Training', label: 'AI Filmmaking Academy (#/training)' }
            : route.startsWith('/portal')
              ? { page: 'Client Portal', label: 'Customer Project WebApp (#/portal)' }
              : { page: 'Homepage', label: 'Main Studio Funnel (/)' };

    recordPageView(pageInfo.page, pageInfo.label);

    const activeStarts = new Map<string, { startMs: number; sectionId: string; label: string; countedView: boolean }>();

    const timer = window.setTimeout(() => {
      const sections = Array.from(document.querySelectorAll('section, header.hero'));
      if (!sections.length || !('IntersectionObserver' in window)) return;

      const getMeta = (el: Element, idx: number) => {
        const rawId = el.id || `sec-${idx + 1}`;
        const heading = el.querySelector('h1, h2, h3')?.textContent?.trim().slice(0, 68);
        const label = heading || `Section ${idx + 1} (${rawId})`;
        const recordId = `${pageInfo.page.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${rawId.replace(/[^a-z0-9]/gi, '_')}`;
        return { recordId, sectionId: rawId, label };
      };

      const io = new IntersectionObserver(
        (entries) => {
          const now = performance.now();
          entries.forEach((entry) => {
            const idx = sections.indexOf(entry.target as HTMLElement);
            const { recordId, sectionId, label } = getMeta(entry.target, Math.max(0, idx));
            if (entry.isIntersecting) {
              const prev = activeStarts.get(recordId);
              activeStarts.set(recordId, {
                startMs: now,
                sectionId,
                label,
                countedView: prev?.countedView || false,
              });
            } else {
              const active = activeStarts.get(recordId);
              if (active) {
                const elapsedSec = (now - active.startMs) / 1000;
                if (elapsedSec >= 1) {
                  recordSectionEngagement(
                    recordId,
                    pageInfo.page,
                    active.sectionId,
                    active.label,
                    elapsedSec,
                    0,
                    active.countedView ? 0 : 1,
                  );
                }
                activeStarts.delete(recordId);
              }
            }
          });
        },
        { threshold: 0.35 },
      );

      sections.forEach((sec) => io.observe(sec));

      const onClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        const sec = target?.closest('section');
        if (!sec) return;
        const idx = sections.indexOf(sec as HTMLElement);
        const { recordId, sectionId, label } = getMeta(sec, Math.max(0, idx));
        recordSectionEngagement(recordId, pageInfo.page, sectionId, label, 0, 1, 0);
      };

      document.addEventListener('click', onClick, { passive: true });

      return () => {
        io.disconnect();
        document.removeEventListener('click', onClick);
      };
    }, 600);

    return () => {
      clearTimeout(timer);
      const now = performance.now();
      activeStarts.forEach((active, recordId) => {
        const elapsedSec = (now - active.startMs) / 1000;
        if (elapsedSec >= 1) {
          recordSectionEngagement(
            recordId,
            pageInfo.page,
            active.sectionId,
            active.label,
            elapsedSec,
            0,
            active.countedView ? 0 : 1,
          );
        }
      });
      activeStarts.clear();
    };
  }, [route]);
}
