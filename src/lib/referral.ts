import type { AffiliatePartner, ReferralDiscountSettings, Lead } from '@/content/types';

export const ADVIBE_REFERRAL_STORAGE_KEY = 'advibe.referral.attribution.v2';
export const ADVIBE_AFFILIATES_STORAGE_KEY = 'advibe.affiliates.v2';
export const ADVIBE_REFERRAL_SETTINGS_STORAGE_KEY = 'advibe.referral.settings.v2';

export const DEFAULT_REFERRAL_SETTINGS: ReferralDiscountSettings = {
  enabled: true,
  discountPercent: 5,
  attributionWindowDays: 30,
  firstTimeOnly: true,
  eligibleServices: [
    'strategy',
    'monthly-content',
    'promotional-mini-series',
    'single-video',
    'bundle-5',
    'bundle-10',
  ],
  promotionExpiry: null,
  minPurchaseValue: 0,
};

export const DEFAULT_AFFILIATES: AffiliatePartner[] = [
  {
    id: 'aff-john',
    code: 'ADV-JOHN',
    name: 'John Adebayo',
    email: 'john.adebayo@partner.advibe.studio',
    whatsapp: '2348031234567',
    status: 'active',
    approved: true,
    commissionPercent: 10,
    createdAt: '2026-09-15',
    totalReferrals: 12,
    clicks: 142,
  },
  {
    id: 'aff-sarah',
    code: 'ADV-SARAH',
    name: 'Sarah Mensah',
    email: 'sarah.mensah@creator.advibe.studio',
    whatsapp: '233241234567',
    status: 'active',
    approved: true,
    commissionPercent: 10,
    createdAt: '2026-10-01',
    totalReferrals: 8,
    clicks: 88,
  },
  {
    id: 'aff-michael',
    code: 'ADV-MICHAEL',
    name: 'Michael Mwangi',
    email: 'michael.m@growthpartners.co',
    whatsapp: '254712345678',
    status: 'active',
    approved: true,
    commissionPercent: 10,
    createdAt: '2026-10-10',
    totalReferrals: 5,
    clicks: 54,
  },
  {
    id: 'aff-inactive',
    code: 'ADV-EXPIRED',
    name: 'Legacy Partner (Deactivated)',
    email: 'legacy@inactive.com',
    whatsapp: '2348099999999',
    status: 'deactivated',
    approved: false,
    commissionPercent: 10,
    createdAt: '2026-01-10',
    totalReferrals: 1,
    clicks: 6,
  },
];

export const HOW_HEARD_OPTIONS = [
  'Select an option...',
  'Advibe Affiliate Partner Link',
  'Google / Search Engine',
  'Social Media (Instagram, TikTok, YouTube, LinkedIn)',
  'WhatsApp / Direct Recommendation',
  'Friend or Referral',
  'Event / Conference / Webinar',
  'Other',
];

export interface StoredAttribution {
  code: string;
  affiliateId: string;
  affiliateName: string;
  capturedAt: number;
  sourceUrl: string;
  viaAffiliateLink: boolean;
}

export interface EligibilityResult {
  isEligible: boolean;
  reason?: string;
  affiliate?: AffiliatePartner;
  attribution?: StoredAttribution;
  discountPercent: number;
  isSelfReferral?: boolean;
}

/**
 * Normalizes phone numbers for duplicate/self-referral checking
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '').replace(/^0+/, '');
}

/**
 * Reads any referral code from the URL parameters or hash fragment.
 * Supports:
 * - https://advibe.com/book-strategy-session?ref=ADV-JOHN
 * - https://advibe.com/#/book-strategy-session?ref=ADV-JOHN
 * - https://advibe.com/?ref=ADV-JOHN
 * - https://advibe.com/?aff=ADV-JOHN
 */
export function extractReferralCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Search params: ?ref=... or ?aff=...
  const urlParams = new URLSearchParams(window.location.search);
  const searchRef = urlParams.get('ref') || urlParams.get('aff') || urlParams.get('affiliate');
  if (searchRef) return searchRef.trim().toUpperCase();

  // 2. Hash params: #/path?ref=...
  const hash = window.location.hash || '';
  const qIdx = hash.indexOf('?');
  if (qIdx >= 0) {
    const hashParams = new URLSearchParams(hash.slice(qIdx + 1));
    const hashRef = hashParams.get('ref') || hashParams.get('aff') || hashParams.get('affiliate');
    if (hashRef) return hashRef.trim().toUpperCase();
  }

  return null;
}

/**
 * Captures referral attribution from the URL on page load and preserves it
 * in localStorage according to the attribution window.
 * Only validates and grants link attribution if the affiliate is active and approved.
 */
export function captureReferralFromUrl(
  affiliates: AffiliatePartner[] = DEFAULT_AFFILIATES,
  settings: ReferralDiscountSettings = DEFAULT_REFERRAL_SETTINGS
): StoredAttribution | null {
  if (typeof window === 'undefined') return null;

  const urlCode = extractReferralCodeFromUrl();
  if (!urlCode) return null;

  const cleanCode = urlCode.toUpperCase();
  const affiliate = affiliates.find((a) => a.code.toUpperCase() === cleanCode);

  if (!affiliate || !affiliate.approved || affiliate.status !== 'active') {
    // If the affiliate link is invalid, expired or belongs to a deactivated affiliate,
    // do not store active link attribution (ensures discount is NOT displayed).
    console.warn(`[Referral] Referral code ${cleanCode} is invalid, deactivated, or unapproved.`);
    return null;
  }

  const attribution: StoredAttribution = {
    code: affiliate.code,
    affiliateId: affiliate.id,
    affiliateName: affiliate.name,
    capturedAt: Date.now(),
    sourceUrl: window.location.href,
    viaAffiliateLink: true, // Crucial distinction: came through direct partner URL
  };

  try {
    localStorage.setItem(ADVIBE_REFERRAL_STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // LocalStorage unavailable/quota
  }

  return attribution;
}

/**
 * Returns current valid attribution from storage within the attribution window.
 */
export function getActiveAttribution(
  affiliates: AffiliatePartner[] = DEFAULT_AFFILIATES,
  windowDays: number = DEFAULT_REFERRAL_SETTINGS.attributionWindowDays
): StoredAttribution | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(ADVIBE_REFERRAL_STORAGE_KEY);
    if (!raw) return null;

    const parsed: StoredAttribution = JSON.parse(raw);
    if (!parsed || !parsed.code || !parsed.viaAffiliateLink) return null;

    // Check attribution window expiry
    const ageMs = Date.now() - parsed.capturedAt;
    const maxAgeMs = (windowDays || 30) * 86400000;
    if (ageMs > maxAgeMs) {
      localStorage.removeItem(ADVIBE_REFERRAL_STORAGE_KEY);
      return null;
    }

    // Verify affiliate is still active and approved
    const affiliate = affiliates.find((a) => a.code.toUpperCase() === parsed.code.toUpperCase());
    if (!affiliate || !affiliate.approved || affiliate.status !== 'active') {
      localStorage.removeItem(ADVIBE_REFERRAL_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Comprehensive 5% discount eligibility evaluation
 * Rule: VALID AFFILIATE REFERRAL LINK + ELIGIBLE FIRST-TIME CUSTOMER + CUSTOMER OPTS IN = 5% DISCOUNT.
 *
 * Explicitly guards against:
 * - Visitors without affiliate referral links
 * - Manually entered codes (which do NOT qualify for the 5% discount)
 * - Self-referrals (affiliate using own code)
 * - Existing paid customers (first-time rule)
 * - Deactivated / expired affiliates
 * - Promotion expiry or disabled admin setting
 */
export function checkDiscountEligibility({
  email,
  whatsapp,
  offerId = 'strategy',
  price = 0,
  attribution,
  affiliates = DEFAULT_AFFILIATES,
  settings = DEFAULT_REFERRAL_SETTINGS,
  existingLeads = [],
}: {
  email?: string;
  whatsapp?: string;
  offerId?: string;
  price?: number;
  attribution: StoredAttribution | null;
  affiliates?: AffiliatePartner[];
  settings?: ReferralDiscountSettings;
  existingLeads?: Lead[];
}): EligibilityResult {
  const percent = settings.discountPercent || 5;

  // 1. Admin promotion active check
  if (!settings.enabled) {
    return { isEligible: false, reason: 'Referral discount promotion is currently paused.', discountPercent: percent };
  }

  // 2. Promotion expiry check
  if (settings.promotionExpiry) {
    const expiryTime = new Date(settings.promotionExpiry).getTime();
    if (Date.now() > expiryTime) {
      return { isEligible: false, reason: 'This promotional period has expired.', discountPercent: percent };
    }
  }

  // 3. Must have valid attribution from an affiliate referral link
  if (!attribution || !attribution.viaAffiliateLink) {
    return {
      isEligible: false,
      reason: 'The 5% discount is exclusively available to visitors arriving through a verified affiliate referral link.',
      discountPercent: percent,
    };
  }

  // 4. Validate affiliate in database
  const affiliate = affiliates.find((a) => a.code.toUpperCase() === attribution.code.toUpperCase());
  if (!affiliate || !affiliate.approved || affiliate.status !== 'active') {
    return {
      isEligible: false,
      reason: 'The referring partner account is inactive or not eligible.',
      discountPercent: percent,
    };
  }

  // 5. Prevent self-referrals (affiliate cannot refer themselves)
  if (email && affiliate.email && email.trim().toLowerCase() === affiliate.email.trim().toLowerCase()) {
    return {
      isEligible: false,
      reason: 'Self-referrals are not permitted. Affiliates cannot claim discounts on their own links.',
      affiliate,
      attribution,
      discountPercent: percent,
      isSelfReferral: true,
    };
  }

  if (whatsapp && affiliate.whatsapp) {
    const cleanUserPhone = normalizePhone(whatsapp);
    const cleanAffPhone = normalizePhone(affiliate.whatsapp);
    if (cleanUserPhone.length >= 7 && cleanUserPhone === cleanAffPhone) {
      return {
        isEligible: false,
        reason: 'Self-referrals are not permitted. Affiliates cannot claim discounts on their own links.',
        affiliate,
        attribution,
        discountPercent: percent,
        isSelfReferral: true,
      };
    }
  }

  // 6. Service eligibility check
  const isServiceEligible =
    offerId === 'strategy' ||
    !settings.eligibleServices?.length ||
    settings.eligibleServices.includes(offerId);

  if (!isServiceEligible) {
    return {
      isEligible: false,
      reason: 'This specific service is not included in the 5% referral discount promotion.',
      affiliate,
      attribution,
      discountPercent: percent,
    };
  }

  // 7. Minimum purchase value check (applicable if price > 0)
  if (price > 0 && settings.minPurchaseValue > 0 && price < settings.minPurchaseValue) {
    return {
      isEligible: false,
      reason: `A minimum purchase value of ${settings.minPurchaseValue} is required to apply the discount.`,
      affiliate,
      attribution,
      discountPercent: percent,
    };
  }

  // 8. First-time customer check
  if (settings.firstTimeOnly && existingLeads.length > 0) {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanWa = whatsapp ? normalizePhone(whatsapp) : '';

    const hasPriorPaidOrder = existingLeads.some((lead) => {
      const matchEmail = cleanEmail && lead.email && lead.email.trim().toLowerCase() === cleanEmail;
      const matchWa = cleanWa && lead.whatsapp && normalizePhone(lead.whatsapp) === cleanWa;
      const wasPaid = lead.paymentStatus === 'Paid' || lead.status === 'Won';
      return (matchEmail || matchWa) && wasPaid;
    });

    if (hasPriorPaidOrder) {
      return {
        isEligible: false,
        reason: 'This promotion is exclusively for first-time customers.',
        affiliate,
        attribution,
        discountPercent: percent,
      };
    }
  }

  return {
    isEligible: true,
    affiliate,
    attribution,
    discountPercent: percent,
  };
}

/**
 * Calculates net commission for affiliate:
 * "Calculate commission on the net eligible amount actually received after the customer's discount,
 * excluding applicable taxes and separately itemised pass-through expenses."
 */
export function calculateAffiliateCommission(
  originalPrice: number,
  discountPercent: number = 5,
  commissionPercent: number = 10,
  hasDiscount: boolean = true
): {
  discountAmount: number;
  netReceived: number;
  affiliateCommission: number;
} {
  const discountAmount = hasDiscount ? Math.round(originalPrice * (discountPercent / 100)) : 0;
  const netReceived = Math.max(0, originalPrice - discountAmount);
  const affiliateCommission = Math.round(netReceived * (commissionPercent / 100));

  return {
    discountAmount,
    netReceived,
    affiliateCommission,
  };
}
