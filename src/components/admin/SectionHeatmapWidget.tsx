import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Eye, Clock, MousePointerClick, RefreshCw, BarChart3, Layers } from 'lucide-react';
import {
  type PageViewSummary,
  type SectionHeatmapRecord,
  fetchFirestoreHeatmapRecords,
  loadHeatmapRecords,
  loadPageViewSummaries,
} from '@/lib/heatmapAnalytics';

export function SectionHeatmapWidget() {
  const [records, setRecords] = useState<SectionHeatmapRecord[]>(() => loadHeatmapRecords());
  const [pageViews, setPageViews] = useState<PageViewSummary[]>(() => loadPageViewSummaries());
  const [pageFilter, setPageFilter] = useState<string>('All');
  const [syncing, setSyncing] = useState(false);

  const handleRefresh = async () => {
    setSyncing(true);
    setPageViews(loadPageViewSummaries());
    const latest = await fetchFirestoreHeatmapRecords();
    setRecords(latest);
    setSyncing(false);
  };

  useEffect(() => {
    void handleRefresh();
  }, []);

  const pages = useMemo(() => {
    const set = new Set<string>(['All']);
    records.forEach((r) => set.add(r.page));
    return Array.from(set);
  }, [records]);

  const filteredRecords = useMemo(() => {
    const list = pageFilter === 'All' ? records : records.filter((r) => r.page === pageFilter);
    return [...list].sort((a, b) => {
      const avgA = a.views > 0 ? a.totalDwellSeconds / a.views : 0;
      const avgB = b.views > 0 ? b.totalDwellSeconds / b.views : 0;
      return avgB - avgA;
    });
  }, [records, pageFilter]);

  const maxAvgDwell = useMemo(() => {
    return Math.max(
      1,
      ...filteredRecords.map((r) => (r.views > 0 ? r.totalDwellSeconds / r.views : 0)),
    );
  }, [filteredRecords]);

  const totalSiteViews = useMemo(
    () => pageViews.reduce((acc, p) => acc + p.views, 0),
    [pageViews],
  );

  const topDwellSection = filteredRecords[0] || null;

  return (
    <div className="rounded-2xl border border-white/12 bg-[#121317] p-5 sm:p-6 space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
            <Flame className="h-4 w-4 text-[#f5a524]" />
            <span>PAGE VIEW & SECTION DWELL-TIME HEATMAP ANALYTICS</span>
          </div>
          <h3 className="font-display text-lg sm:text-xl font-extrabold text-white mt-1">
            Where Visitors Spend the Longest Amount of Time on Your Pages
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            Tracks visitor reach, average seconds spent viewing each section, and click intensity across your funnels.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 font-mono text-xs font-semibold text-white/80 hover:border-[#f5a524] hover:text-[#f5a524] transition self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>Refresh Heatmap</span>
        </button>
      </div>

      {/* Page-Level Traffic Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {pageViews.map((pv) => (
          <div
            key={pv.page}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-1.5"
          >
            <div className="flex items-center justify-between font-mono text-[11px] text-white/55">
              <span className="truncate font-bold text-white/85">{pv.page}</span>
              <Eye className="h-3.5 w-3.5 text-[#f5a524] shrink-0" />
            </div>
            <div className="font-display text-2xl font-extrabold text-white tabular-nums">
              {pv.views.toLocaleString()}{' '}
              <span className="text-xs font-normal text-white/50">views</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-white/50 tabular-nums">
              <span>{pv.uniqueVisitors} unique</span>
              <span className="text-emerald-400">~{pv.avgTimeOnPageSec}s avg</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Longest-Viewed Callout + Page Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-[#f5a524]/30 bg-[#f5a524]/10 p-4">
        <div className="space-y-0.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#f5a524]">
            #1 HIGHEST ATTENTION ZONE ({totalSiteViews.toLocaleString()} TOTAL PAGE VIEWS)
          </span>
          {topDwellSection && (
            <p className="font-display text-sm sm:text-base font-bold text-white">
              {topDwellSection.page} — {topDwellSection.label} (Avg{' '}
              <span className="text-[#f5a524] tabular-nums">
                {Math.round(topDwellSection.totalDwellSeconds / Math.max(1, topDwellSection.views))}s
              </span>{' '}
              per visitor)
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPageFilter(p)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition ${
                pageFilter === p
                  ? 'bg-[#f5a524] text-black'
                  : 'bg-black/40 text-white/70 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Thermal Section Dwell-Time Heatmap Bars */}
      <div className="space-y-3">
        {filteredRecords.map((rec, idx) => {
          const avgSec = Math.round(rec.totalDwellSeconds / Math.max(1, rec.views));
          const intensityPct = Math.min(100, Math.max(12, Math.round((avgSec / maxAvgDwell) * 100)));
          const heatTier =
            intensityPct >= 75
              ? {
                  badge: 'HOT ZONE · LONGEST DWELL',
                  barClass: 'from-red-500 via-orange-500 to-[#f5a524]',
                  textClass: 'text-orange-300',
                  borderClass: 'border-orange-500/35 bg-orange-500/[0.06]',
                }
              : intensityPct >= 45
                ? {
                    badge: 'WARM ZONE · ACTIVE READING',
                    barClass: 'from-[#f5a524] to-emerald-400',
                    textClass: 'text-[#f5a524]',
                    borderClass: 'border-white/10 bg-white/[0.03]',
                  }
                : {
                    badge: 'COOL ZONE · QUICK SKIM',
                    barClass: 'from-sky-500 to-cyan-400',
                    textClass: 'text-sky-300',
                    borderClass: 'border-white/10 bg-white/[0.02]',
                  };

          return (
            <div
              key={rec.id}
              className={`rounded-xl border p-4 space-y-2.5 transition ${heatTier.borderClass}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-white/45 tabular-nums">
                    #{idx + 1}
                  </span>
                  <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white/80">
                    {rec.page}
                  </span>
                  <h4 className="font-display text-sm font-bold text-white truncate">
                    {rec.label}
                  </h4>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs tabular-nums shrink-0">
                  <span className={`text-[10px] font-bold ${heatTier.textClass}`}>
                    {heatTier.badge}
                  </span>
                  <span className="flex items-center gap-1 text-white/75" title="Section Views">
                    <Eye className="h-3.5 w-3.5 text-white/45" />
                    {rec.views.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-white/75" title="Section Clicks">
                    <MousePointerClick className="h-3.5 w-3.5 text-white/45" />
                    {rec.clicks.toLocaleString()}
                  </span>
                  <span
                    className="flex items-center gap-1 font-extrabold text-white bg-black/50 px-2.5 py-1 rounded-lg border border-white/10"
                    title="Average time spent viewing this section"
                  >
                    <Clock className="h-3.5 w-3.5 text-[#f5a524]" />
                    {avgSec}s avg
                  </span>
                </div>
              </div>

              {/* Thermal Heat Bar */}
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/60">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${heatTier.barClass} transition-all duration-500`}
                  style={{ width: `${intensityPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
