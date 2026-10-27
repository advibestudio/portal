import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Country } from '@/content/types';
import { useStore } from '@/lib/store';
import { activatePixel } from '@/lib/tracking';

/**
 * WHICH COUNTRY IS THE VISITOR LOOKING AT?
 * ----------------------------------------
 * Decided in this order:
 *   1. the link they came from:      https://yoursite/#/gh      (or ?country=gh)
 *   2. the country they picked last time on this device
 *   3. your "default country" in Admin
 * Prices, currency, payment details, events and the Meta Pixel all follow this one choice.
 */
interface Ctx { country: Country; countries: Country[]; setCountry: (code: string) => void }
const CountryCtx = createContext<Ctx | null>(null);
const LS_KEY = 'advibe.country.v1';

function slugFromUrl(): string | null {
  const m = window.location.hash.match(/^#\/([a-z]{2})(?:[/?]|$)/i);
  if (m) return m[1].toLowerCase();
  const q = new URLSearchParams(window.location.search).get('country');
  return q ? q.toLowerCase() : null;
}

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const { content } = useStore();
  const countries = useMemo(() => {
    const act = content.countries.filter((c) => c.active);
    return act.length ? act : content.countries.slice(0, 1); // never end up with zero countries
  }, [content.countries]);

  const match = useCallback((v: string | null) => (v ? countries.find((c) => c.slug === v || c.code.toLowerCase() === v) : undefined), [countries]);

  // True once the country came from a link or a choice (not just the default) — only then is it remembered.
  const explicit = useRef(false);
  const [code, setCode] = useState<string>(() => {
    const fromUrl = slugFromUrl();
    if (fromUrl) { explicit.current = true; return fromUrl; }
    try { return localStorage.getItem(LS_KEY) ?? ''; } catch { return ''; }
  });

  // Follow the link if it changes (e.g. someone pastes a different country link).
  useEffect(() => {
    const on = () => { const s = slugFromUrl(); if (s) { explicit.current = true; setCode(s); } };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const country = match(code.toLowerCase()) ?? match(content.defaultCountry.toLowerCase()) ?? countries[0];

  const setCountry = useCallback((c: string) => {
    const target = match(c.toLowerCase());
    if (!target) return;
    explicit.current = true;
    setCode(target.code);
    try { localStorage.setItem(LS_KEY, target.code); } catch { /* ignore */ }
    // Put the country in the address bar so the page can be shared/bookmarked. No jump, no reload.
    try { history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/${target.slug}`); } catch { /* ignore */ }
  }, [match]);

  // Remember a country that came from an ad link, so it survives moving to other pages (e.g. #/ai-video) and back.
  useEffect(() => {
    if (!explicit.current) return;
    try { localStorage.setItem(LS_KEY, country.code); } catch { /* ignore */ }
  }, [country.code]);

  // Meta Pixel follows the country (a country can have its own pixel; otherwise the main one is used).
  useEffect(() => {
    activatePixel(country.pixelId || content.settings.pixelId, country.code);
  }, [country.pixelId, country.code, content.settings.pixelId]);

  const value = useMemo(() => ({ country, countries, setCountry }), [country, countries, setCountry]);
  return <CountryCtx.Provider value={value}>{children}</CountryCtx.Provider>;
}

export function useCountry() {
  const c = useContext(CountryCtx);
  if (!c) throw new Error('useCountry outside CountryProvider');
  return c;
}
