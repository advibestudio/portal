import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { buildEvents, fetchApiHolidays, yearsNeeded, type ApiHoliday, type CalEvent } from '@/lib/events';

/**
 * Upcoming events for the visitor's country. Shows manual + built-in dates INSTANTLY, then
 * quietly merges in the live calendar-API holidays a moment later (after the page has settled,
 * so the extra request never slows the first load).
 */
export function useEvents(): CalEvent[] {
  const { content } = useStore();
  const { country } = useCountry();
  const s = content.events;
  const [api, setApi] = useState<{ key: string; list: ApiHoliday[] }>({ key: '', list: [] });
  const key = `${country.code}|${s.windowDays}`;

  useEffect(() => {
    if (!s.auto) return;
    let cancelled = false;
    const run = async () => {
      const results = await Promise.all(yearsNeeded(s.windowDays).map((y) => fetchApiHolidays(country.code, y)));
      if (!cancelled) setApi({ key, list: results.flatMap((r) => r.list) });
    };
    const t = window.setTimeout(run, 2500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [country.code, s.auto, s.windowDays, key]);

  return useMemo(
    () => buildEvents({ country, campaigns: content.campaigns, settings: s, api: api.key === key ? api.list : [] }),
    [country, content.campaigns, s, api, key],
  );
}
