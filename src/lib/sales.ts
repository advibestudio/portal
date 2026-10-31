import type { Country, SalesOffer, SalesPages } from '@/content/types';
import { defaultSalesPages } from '@/content/salesDefaults';
import { fmtMoney } from '@/lib/money';

/**
 * Replaces tokens like {price}, {quantity}, {period}, {name}, {client}
 */
export function fillTokens(text: string, vars: Record<string, string | number>): string {
  if (!text) return '';
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return key in vars ? String(vars[key]) : match;
  });
}

/**
 * Builds token dictionary for an offer
 */
export function offerVars(
  offer: SalesOffer,
  price: { amount: number; text: string; currency: string },
  clientName = 'AdVibe Studios'
): Record<string, string | number> {
  const perVideo = offer.quantity > 0 ? Math.round(price.amount / offer.quantity) : price.amount;
  return {
    name: offer.name,
    shortLabel: offer.shortLabel,
    price: price.text,
    priceAmount: price.amount,
    currency: price.currency,
    period: offer.period,
    quantity: offer.quantity,
    perVideo: `${price.currency}${perVideo.toLocaleString('en-US')}`,
    client: clientName,
    brand: clientName,
  };
}

/**
 * Parses markdown-style *accented words* into an array for <em> styling
 */
export function parseAccent(text: string): { t: string; em: boolean }[] {
  if (!text) return [];
  const parts: { t: string; em: boolean }[] = [];
  const regex = /\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ t: text.substring(lastIndex, match.index), em: false });
    }
    parts.push({ t: match[1], em: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ t: text.substring(lastIndex), em: false });
  }

  return parts;
}

/**
 * Resolves price for an offer based on the visitor's current country
 */
export function salesPrice(
  offer: SalesOffer,
  country: Country,
  countries: Country[],
  baseCountryCode = 'NG'
): { amount: number; text: string; currency: string } {
  // Check direct override for this country code
  const directOverride = offer.countryPrices?.[country.code];
  if (typeof directOverride === 'number' && directOverride > 0) {
    return {
      amount: directOverride,
      text: fmtMoney(directOverride, country),
      currency: country.currency,
    };
  }

  // If visitor is in base country, return base price
  if (country.code === baseCountryCode || !offer.countryPrices) {
    return {
      amount: offer.price,
      text: fmtMoney(offer.price, country),
      currency: country.currency,
    };
  }

  // Fallback to base price in visitor's currency symbol or country format
  return {
    amount: offer.price,
    text: fmtMoney(offer.price, country),
    currency: country.currency,
  };
}

/**
 * Deep merge helper to ensure older saved content in localStorage or Supabase
 * retains all fields from defaultSalesPages
 */
export function mergeSalesPages(saved?: Partial<SalesPages> | null): SalesPages {
  if (!saved) return defaultSalesPages;

  return {
    home: {
      ...defaultSalesPages.home,
      ...(saved.home || {}),
    },
    settings: {
      ...defaultSalesPages.settings,
      ...(saved.settings || {}),
      labels: {
        ...defaultSalesPages.settings.labels,
        ...(saved.settings?.labels || {}),
      },
      uiText: {
        ...defaultSalesPages.settings.uiText,
        ...(saved.settings?.uiText || {}),
      },
    },
    proof: {
      videoIds: (() => {
        const legacyIds = new Set([
          'aqz-KE-bpKQ',
          'eRsGyueVLvQ',
          'jfKfPfyJRdk',
          'dQw4w9WgXcQ',
          '60ItHLz5WEA',
          '9bZkp7q19f0',
          'kJQP7kiw5Fk',
        ]);
        const cleaned = (saved.proof?.videoIds ?? []).filter((id) => id && !legacyIds.has(id));
        return cleaned.length > 0 ? cleaned : (defaultSalesPages.proof?.videoIds ?? []);
      })(),
      showLogo: saved.proof?.showLogo ?? defaultSalesPages.proof?.showLogo ?? true,
      emptyNote: saved.proof?.emptyNote ?? defaultSalesPages.proof?.emptyNote ?? '',
      modalTitle: saved.proof?.modalTitle ?? defaultSalesPages.proof?.modalTitle ?? '',
    },
    offers: defaultSalesPages.offers.map((defOffer) => {
      const found = saved.offers?.find((o) => o.id === defOffer.id || o.slug === defOffer.slug);
      if (!found) return defOffer;
      const mergedCountryPrices = {
        ...defOffer.countryPrices,
        ...(found.countryPrices || {}),
      };
      let nextPrice = found.price ?? defOffer.price;
      if (defOffer.id === 'monthly-content' && nextPrice === 200000) {
        nextPrice = 250000;
      }
      if (defOffer.id === 'monthly-content' && mergedCountryPrices.NG === 200000) {
        mergedCountryPrices.NG = 250000;
      }
      if (defOffer.id === 'promotional-mini-series' && (nextPrice === 200000 || nextPrice === 150000)) {
        nextPrice = 300000;
      }
      if (defOffer.id === 'promotional-mini-series' && (mergedCountryPrices.NG === 200000 || mergedCountryPrices.NG === 150000)) {
        mergedCountryPrices.NG = 300000;
      }
      return {
        ...defOffer,
        ...found,
        price: nextPrice,
        countryPrices: mergedCountryPrices,
        homeCard: {
          ...defOffer.homeCard,
          ...(found.homeCard || {}),
        },
        hero: {
          ...defOffer.hero,
          ...(found.hero || {}),
        },
        offer: {
          ...defOffer.offer,
          ...(found.offer || {}),
        },
      };
    }),
  };
}
