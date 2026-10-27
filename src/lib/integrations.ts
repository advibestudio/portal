import type { Lead } from '@/content/types';
import { getParam } from '@/lib/money';

/**
 * MAKE.COM CONNECTION
 * -------------------
 * Every time someone submits the order form we send their details to a Make
 * "Custom webhook". Make then adds a row to Google Sheets and (if the person
 * gave an email) adds them to SendFox. See README.md, Part 6.
 *
 * The webhook address comes from VITE_MAKE_WEBHOOK_URL (in `.env` / GitHub Secrets).
 * If it's empty, nothing is sent (and nothing breaks).
 */
const WEBHOOK = (import.meta.env.VITE_MAKE_WEBHOOK_URL as string | undefined)?.trim();

export const makeConfigured = Boolean(WEBHOOK);

export function sendLeadToMake(lead: Lead, countryName = ''): void {
  if (!WEBHOOK) return;
  const [first, ...rest] = lead.name.trim().split(/\s+/);

  // Flat key/value pairs. Make turns each one into a field you can map.
  const fields: Record<string, string> = {
    ref: lead.ref,
    submitted_at: new Date().toISOString(),
    name: lead.name,
    first_name: first ?? '',
    last_name: rest.join(' '),
    business: lead.business,
    whatsapp: lead.whatsapp,
    email: lead.email,
    package_id: lead.offerId,
    package_name: lead.offerName,
    country: lead.country,
    country_name: countryName,
    currency: lead.currency,
    price: String(lead.price),
    source: lead.source,
    show_public: lead.showPublic ? 'yes' : 'no',
    industry: lead.industry,
    product: lead.product,
    event: lead.event,
    notes: lead.notes,
    utm_source: getParam('utm_source') ?? '',
    utm_medium: getParam('utm_medium') ?? '',
    utm_campaign: getParam('utm_campaign') ?? '',
    page_url: window.location.href.split('#')[0],
  };

  // Why this odd-looking request: a plain form-style POST in "no-cors" mode is
  // allowed by every browser without special permission from Make's servers.
  // The trade-off is that we can't read Make's reply — so this is "fire and forget".
  try {
    void fetch(WEBHOOK, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    }).catch(() => { /* never block the customer because of an automation hiccup */ });
  } catch { /* ignore */ }
}
