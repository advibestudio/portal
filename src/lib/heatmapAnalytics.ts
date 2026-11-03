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
      if (data && data.id) {
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
 * React hook that automatically tracks page views and section dwell-time heatmaps
 * across public pages using IntersectionObserver.
 */
export function usePageHeatmapTracker(route: string) {
  useEffect(() => {
    if (route.startsWith('/admin')) return;

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
