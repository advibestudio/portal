/**
 * META (FACEBOOK) PIXEL
 * ---------------------
 * Put your Pixel ID in Admin → Website → Settings (one pixel for everything), and/or give a
 * country its own pixel in Countries & Prices. Events sent:
 *   PageView          – when the page (or a new country) loads
 *   ViewContent       – when the visitor reaches the packages
 *   InitiateCheckout  – when the order form opens
 *   Lead              – when the order is submitted (with value + currency)
 *   Contact           – when someone taps WhatsApp
 * Each event also carries the country, so you can split results by country in Meta.
 *
 * SPEED: the stub below records events instantly; the real Meta script downloads a few
 * seconds later so it never slows the first load. Events recorded before then are replayed.
 */
type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; push?: Fbq; version?: string };
declare global { interface Window { fbq?: Fbq; _fbq?: Fbq } }

const inited = new Set<string>();
const viewed = new Set<string>();
let current = '';
let currentCountry = '';
let scriptRequested = false;

function ensureStub() {
  if (window.fbq) return;
  const q: unknown[][] = [];
  const fbq: Fbq = (...args: unknown[]) => { q.push(args); };
  fbq.queue = q; fbq.loaded = true; fbq.push = fbq; fbq.version = '2.0'; // same shape as Meta's official snippet
  window.fbq = fbq; window._fbq = fbq;
}

function loadScriptSoon() {
  if (scriptRequested) return;
  scriptRequested = true;
  window.setTimeout(() => {
    const s = document.createElement('script');
    s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }, 3500);
}

/** Switch the active pixel (called whenever the visitor's country is known/changes). */
export function activatePixel(pixelId: string, countryCode: string) {
  const id = pixelId.trim();
  if (!/^\d{6,20}$/.test(id)) { current = ''; return; }
  ensureStub();
  if (!inited.has(id)) { inited.add(id); window.fbq!('init', id); }
  current = id;
  currentCountry = countryCode;
  const key = `${id}|${countryCode}`;
  if (!viewed.has(key)) {           // one PageView per pixel+country per visit
    viewed.add(key);
    window.fbq!('trackSingle', id, 'PageView');
  }
  loadScriptSoon();
}

export function track(event: 'Lead' | 'Contact' | 'ViewContent' | 'InitiateCheckout', data?: Record<string, unknown>) {
  if (!current) return;
  try { window.fbq?.('trackSingle', current, event, { country: currentCountry, ...data }); } catch { /* ignore */ }
}
