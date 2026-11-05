import { useEffect } from 'react';

export interface RouteSeoMeta {
  title: string;
  description: string;
  keywords: string;
  canonicalHash?: string;
}

export const GOOGLE_VERIFICATION_STORAGE_KEY = 'advibe.google.verification.v1';

/**
 * Full-spectrum keyword clusters covering:
 * 0. Exact Brand Queries (advibe, advibe studio, advibe studios, advibe studios global)
 * 1. AI Video Generation Tools & Software (Done-For-You Alternative & Academy)
 * 2. AI Video Production Agency & Commercial Studio Services
 * 3. Performance, Social Media & Digital Marketing Agencies
 * 4. Geographic Markets (Nigeria, West Africa, Ghana, Kenya, USA, UK, Global)
 */
export const MASTER_SEO_KEYWORDS = [
  // Cluster 0: Exact Brand Variations & GitHub Domain
  'advibe',
  'advibe studio',
  'advibe studios',
  'advibe studios global',
  'advibestudios',
  'advibestudios.global',
  'advibestudio.github.io',
  // Cluster 1: AI Video Generation Tools & Software
  'AI video generator',
  'AI video generation tools',
  'text to video AI',
  'image to video AI',
  'AI video maker for business',
  'AI commercial video generator',
  'AI UGC video generator',
  'AI product video maker',
  'AI avatar and voiceover generator',
  'best AI video generation tool alternative',
  'done for you AI video generation',
  // Cluster 2: AI Video Production Agency & Studio
  'AI video production agency',
  'AI video production company',
  'AI video ads studio',
  'commercial video production agency',
  'explainer video production company',
  'product video production studio',
  'corporate and brand video agency',
  'AI promotional mini series production',
  'branded entertainment video studio',
  'animated and photorealistic AI video studio',
  // Cluster 3: Marketing & Advertising Agencies
  'video marketing agency',
  'social media video advertising agency',
  'Facebook and Instagram video ads agency',
  'TikTok video ads agency',
  'WhatsApp Status video ads agency',
  'YouTube video advertising agency',
  'performance marketing creative agency',
  'direct response video ad agency',
  'digital marketing agency video production',
  'e-commerce video ad creative agency',
  // Cluster 4: Regional & Global Search Intent
  'AI video agency in Nigeria',
  'video production company in Lagos',
  'marketing agency in Lagos Abuja Nigeria',
  'video production agency West Africa',
  'AI video agency Ghana Accra',
  'AI video production Kenya Nairobi',
  'affordable AI video production agency UK USA',
].join(', ');

const ROUTE_SEO_MAP: Record<string, RouteSeoMeta> = {
  '/': {
    title: 'AdVibe Studio (AdVibe Studios Global) — AI Video Production & Marketing Agency',
    description:
      'Official site of AdVibe, AdVibe Studios & AdVibe Studios Global. Done-for-you AI video generation, commercial video production, and performance marketing agency delivering in 5 days.',
    keywords: MASTER_SEO_KEYWORDS,
    canonicalHash: '',
  },
  '/monthly-content': {
    title: 'Monthly AI Video Content Retainer (15 Videos/Mo) — AdVibe Studios Global',
    description:
      'Replace expensive agency shoots and complex AI video generation tools. Get 15 custom AI marketing & product videos every month from AdVibe Studio (AdVibe Studios Global).',
    keywords: `monthly video production retainer, social media video marketing agency, 15 videos a month package, on-demand AI video studio, ${MASTER_SEO_KEYWORDS}`,
    canonicalHash: '#/monthly-content',
  },
  '/promotional-mini-series': {
    title: 'AI Promotional Mini-Series & Branded Entertainment — AdVibe Studios Global',
    description:
      'Turn viewers into brand fans with 15 episodic AI story videos every month by AdVibe Studio (AdVibe Studios Global). Original characters, cinematic storytelling, and full ownership.',
    keywords: `AI mini series production, branded entertainment agency, episodic video marketing, AI storytelling studio, AI filmmaking agency, ${MASTER_SEO_KEYWORDS}`,
    canonicalHash: '#/promotional-mini-series',
  },
  '/our-work': {
    title: 'Our Work & Commercial AI Video Portfolio — AdVibe Studios Global',
    description:
      'Watch real AI video commercials, fintech campaigns, product ads, UGC spots, and episodic brand stories produced by AdVibe Studio (AdVibe Studios Global) in 5 working days.',
    keywords: `AI video portfolio, AI commercial examples, CirclesFundMe video ads, product ad examples, UGC AI video samples, ${MASTER_SEO_KEYWORDS}`,
    canonicalHash: '#/our-work',
  },
  '/training': {
    title: 'AI Video Directing & Generation Training Academy — AdVibe Studios Global',
    description:
      'Master top AI video generation tools, commercial scripting, character continuity, and voice synthesis with AdVibe Studio (AdVibe Studios Global).',
    keywords: `learn AI video generation tools, AI video production course, AI filmmaking training Nigeria, how to make AI video ads, text to video AI course, ${MASTER_SEO_KEYWORDS}`,
    canonicalHash: '#/training',
  },
  '/training/business': {
    title: 'AI Video Generation Training for Business Owners — AdVibe Studios Global',
    description:
      'Learn how to use AI video generation tools to produce high-converting product and service ads in-house without hiring expensive camera crews.',
    keywords: `AI video training for business owners, in-house AI ad creation course, DIY AI video generator training, ${MASTER_SEO_KEYWORDS}`,
    canonicalHash: '#/training/business',
  },
  '/training/creator': {
    title: 'AI Video Production Course for Creators & Agencies — AdVibe Studios Global',
    description:
      'Master commercial AI video generation tools and launch your own high-income AI video production agency. Practical live cohort by AdVibe Studios Global.',
    keywords: `start an AI video agency course, AI video creator training, commercial AI video directing bootcamp, ${MASTER_SEO_KEYWORDS}`,
    canonicalHash: '#/training/creator',
  },
  '/ai-video-ads': {
    title: 'High-Converting AI Video Ads in 5 Working Days — AdVibe Studios Global',
    description:
      'Custom AI video ads for Facebook, Instagram, TikTok, YouTube & WhatsApp Status by AdVibe Studio. Scriptwriting, photorealistic AI visuals, voiceover, and paid media rights.',
    keywords: `fast AI video ads, 5 day video production agency, Facebook Instagram TikTok AI ads, WhatsApp video ads Nigeria, ${MASTER_SEO_KEYWORDS}`,
    canonicalHash: '#/ai-video-ads',
  },
  '/affiliate-portal': {
    title: 'Affiliate Partner Program (10% Commission) — AdVibe Studios Global',
    description:
      'Partner with AdVibe Studio (AdVibe Studios Global). Earn 10% commission on every referred AI video production or monthly retainer client while giving your network 5% off.',
    keywords: `AI video agency affiliate program, marketing agency referral partner, AdVibe Studio affiliates, ${MASTER_SEO_KEYWORDS}`,
    canonicalHash: '#/affiliate-portal',
  },
  '/client-portal': {
    title: 'Client Production Portal — AdVibe Studios Global',
    description:
      'Track your AdVibe Studio AI video production milestones, approve scripts and one-page creative briefs, review previews, and download HD masters.',
    keywords: 'AdVibe Studio client portal, AdVibe Studios Global client login, video production project tracker',
    canonicalHash: '#/client-portal',
  },
};

export function setOrCreateMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOrCreateCanonical(href: string) {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function applyGoogleSiteVerificationTag(rawToken?: string) {
  if (typeof document === 'undefined') return;
  const cleaned = (rawToken || '').trim().replace(/^.*content=["']([^"']+)["'].*$/i, '$1');
  if (!cleaned) return;
  setOrCreateMeta('name', 'google-site-verification', cleaned);
}

export function useRouteSeo(route: string, googleSiteVerification?: string) {
  useEffect(() => {
    const normalized = route.startsWith('/') ? route : `/${route}`;
    const matchedKey =
      Object.keys(ROUTE_SEO_MAP)
        .filter((k) => k !== '/')
        .find((k) => normalized.startsWith(k)) || '/';

    const meta = ROUTE_SEO_MAP[matchedKey] || ROUTE_SEO_MAP['/'];

    document.title = meta.title;
    setOrCreateMeta('name', 'description', meta.description);
    setOrCreateMeta('name', 'keywords', meta.keywords);
    setOrCreateMeta('property', 'og:title', meta.title);
    setOrCreateMeta('property', 'og:description', meta.description);
    setOrCreateMeta('name', 'twitter:title', meta.title);
    setOrCreateMeta('name', 'twitter:description', meta.description);

    // Use the GitHub Pages canonical domain when running on github.io, otherwise current origin
    const originPath =
      typeof window !== 'undefined' && window.location.hostname.includes('github.io')
        ? 'https://advibestudio.github.io/portal/'
        : window.location.origin + window.location.pathname;
    const canonicalUrl = meta.canonicalHash ? `${originPath}${meta.canonicalHash}` : originPath;
    setOrCreateCanonical(canonicalUrl);
    setOrCreateMeta('property', 'og:url', canonicalUrl);

    const savedToken =
      googleSiteVerification ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem(GOOGLE_VERIFICATION_STORAGE_KEY) || '' : '');
    if (savedToken) {
      applyGoogleSiteVerificationTag(savedToken);
    }
  }, [route, googleSiteVerification]);
}
