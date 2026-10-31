import type {
  Country,
  QuizConfig,
  QuizQuestion,
  ServiceCategoryKey,
  SiteContent,
  BusinessAssessment,
} from '@/content/types';
import { fmtMoney, priceFor, waNumberFor } from '@/lib/money';
import { defaultCommercialOffers } from '@/content/commercialOffers';

/* ==========================================================================
   ENTRY-POINT & ORIGINAL ACQUISITION CHANNEL ATTRIBUTION
   ========================================================================== */

const CHANNEL_SESSION_KEY = 'advibe.original_channel.v1';

export function captureInitialChannel(): string {
  if (typeof window === 'undefined') return 'direct';
  try {
    const existing = sessionStorage.getItem(CHANNEL_SESSION_KEY);
    if (existing) return existing;

    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();

    let channel = 'direct';
    if (search.includes('ref=') || hash.includes('ref=')) {
      channel = 'affiliate';
    } else if (hash.includes('monthly-content') || path.includes('monthly-content') || search.includes('channel=monthly-retainer')) {
      channel = 'monthly-retainer';
    } else if (hash.includes('promotional-mini-series') || path.includes('promotional-mini-series')) {
      channel = 'ai-mini-series';
    } else if (hash.includes('book-strategy-session') || path.includes('book-strategy-session')) {
      channel = 'strategy-link';
    } else {
      channel = 'homepage';
    }

    sessionStorage.setItem(CHANNEL_SESSION_KEY, channel);
    return channel;
  } catch {
    return 'direct';
  }
}

export function getOriginalAcquisitionChannel(): string {
  if (typeof window === 'undefined') return 'direct';
  try {
    return sessionStorage.getItem(CHANNEL_SESSION_KEY) || captureInitialChannel();
  } catch {
    return 'direct';
  }
}

export function detectEntryPoint(offerId?: string): string {
  if (typeof window === 'undefined') return 'homepage';
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();

  if (offerId === 'monthly-content' || hash.includes('monthly-content') || path.includes('monthly-content')) {
    return 'monthly-retainer';
  }
  if (offerId === 'promotional-mini-series' || hash.includes('promotional-mini-series') || path.includes('promotional-mini-series')) {
    return 'ai-mini-series-page';
  }
  if (offerId && offerId !== 'strategy') {
    return `package:${offerId}`;
  }
  if (hash.includes('book-strategy-session') || path.includes('book-strategy-session')) {
    return 'book-strategy-session';
  }
  return 'homepage';
}

/* ==========================================================================
   DEFAULT 12-QUESTION SERVICE DISCOVERY QUIZ CONFIGURATION
   ========================================================================== */

export const defaultQuizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    stepNumber: 1,
    title: 'Is your business currently using social media to promote its products or services?',
    subtitle: 'Select the option that best describes where you are right now.',
    type: 'single',
    required: true,
    enabled: true,
    branchingRuleNote: 'Branches based on active vs inconsistent vs not started.',
    options: [
      {
        id: 'q1_active',
        label: 'Yes, actively',
        description: 'We publish content regularly to promote what we sell.',
        weights: { 'monthly-retainer': 15, 'ai-mini-series': 15, 'regular-ads': 10 },
      },
      {
        id: 'q1_inconsistent',
        label: 'Yes, but inconsistently',
        description: 'We post when we can, with long quiet gaps in between.',
        weights: { 'monthly-retainer': 25, 'regular-ads': 15, 'brand-storytelling': 10 },
      },
      {
        id: 'q1_starting',
        label: 'We have pages, but we barely post',
        description: 'Our pages exist, but they do not reflect how serious our business is.',
        weights: { 'regular-ads': 20, 'explainer-educational': 20, 'monthly-retainer': 15 },
      },
      {
        id: 'q1_none',
        label: 'Not yet, we want to start properly',
        description: 'We want to launch with strong, clear creative from day one.',
        weights: { 'explainer-educational': 25, 'regular-ads': 25, 'brand-storytelling': 15 },
      },
    ],
  },
  {
    id: 'q2',
    stepNumber: 2,
    title: 'Which social media platforms do you currently use for your business?',
    subtitle: 'Select all that apply.',
    type: 'multi',
    required: true,
    enabled: true,
    options: [
      { id: 'plat_ig', label: 'Instagram', weights: { 'monthly-retainer': 8, 'ai-mini-series': 10, 'regular-ads': 8 } },
      { id: 'plat_fb', label: 'Facebook', weights: { 'regular-ads': 10, 'ai-mini-series': 8 } },
      { id: 'plat_tt', label: 'TikTok', weights: { 'ai-mini-series': 15, 'monthly-retainer': 10 } },
      { id: 'plat_yt', label: 'YouTube / YouTube Shorts', weights: { 'ai-mini-series': 15, 'explainer-educational': 12 } },
      { id: 'plat_li', label: 'LinkedIn', weights: { 'explainer-educational': 15, 'brand-storytelling': 12 } },
      { id: 'plat_wa', label: 'WhatsApp Business / Status', weights: { 'regular-ads': 12, 'monthly-retainer': 8 } },
      { id: 'plat_x', label: 'X (Twitter)', weights: { 'brand-storytelling': 8, 'regular-ads': 6 } },
      { id: 'plat_other', label: 'Other', weights: { 'regular-ads': 5 } },
      { id: 'plat_none', label: 'We are not active on social media yet', weights: { 'regular-ads': 15, 'explainer-educational': 15 } },
    ],
  },
  {
    id: 'q3',
    stepNumber: 3,
    title: 'How often does your business currently post promotional or marketing content?',
    subtitle: 'Be honest — this helps us estimate your monthly content opportunity.',
    type: 'single',
    required: true,
    enabled: true,
    options: [
      { id: 'freq_daily', label: 'Every day', weights: { 'monthly-retainer': 25, 'ai-mini-series': 20 } },
      { id: 'freq_3_5_wk', label: '3–5 times a week', weights: { 'monthly-retainer': 22, 'ai-mini-series': 18 } },
      { id: 'freq_1_2_wk', label: '1–2 times a week', weights: { 'monthly-retainer': 25, 'regular-ads': 15 } },
      { id: 'freq_few_mo', label: 'A few times a month', weights: { 'monthly-retainer': 28, 'regular-ads': 18 } },
      { id: 'freq_once_mo', label: 'Once a month or less', weights: { 'regular-ads': 22, 'monthly-retainer': 20 } },
      { id: 'freq_hardly', label: 'Hardly ever / only when we have a special promotion', weights: { 'regular-ads': 25, 'explainer-educational': 18, 'monthly-retainer': 15 } },
    ],
  },
  {
    id: 'q4',
    stepNumber: 4,
    title: 'Would you like your business to publish more high-quality content consistently?',
    subtitle: 'Understanding what holds back consistency helps us recommend the right setup.',
    type: 'single',
    required: true,
    enabled: true,
    options: [
      {
        id: 'cons_yes_definitely',
        label: 'Yes, definitely — we know we should be posting more',
        weights: { 'monthly-retainer': 30, 'ai-mini-series': 12 },
      },
      {
        id: 'cons_yes_no_time',
        label: "Yes, if we didn't have to manage the whole creative process ourselves",
        weights: { 'monthly-retainer': 35, 'brand-storytelling': 10 },
      },
      {
        id: 'cons_yes_cost',
        label: 'Yes, if the cost made sense for our business',
        weights: { 'regular-ads': 22, 'monthly-retainer': 18 },
      },
      {
        id: 'cons_maybe',
        label: 'Maybe — I want to understand how it would help us',
        weights: { 'explainer-educational': 20, 'regular-ads': 18 },
      },
      {
        id: 'cons_quality',
        label: 'We already post enough, but we want better quality and better results',
        weights: { 'ai-mini-series': 28, 'brand-storytelling': 25, 'regular-ads': 15 },
      },
    ],
  },
  {
    id: 'q5',
    stepNumber: 5,
    title: 'What is your biggest challenge with creating marketing content right now?',
    subtitle: 'Select all that apply.',
    type: 'multi',
    required: true,
    enabled: true,
    options: [
      {
        id: 'chal_no_time',
        label: "We don't have enough time to plan and create content consistently",
        weights: { 'monthly-retainer': 25 },
      },
      {
        id: 'chal_no_ideas',
        label: 'We run out of fresh creative ideas',
        weights: { 'ai-mini-series': 22, 'monthly-retainer': 20, 'brand-storytelling': 15 },
      },
      {
        id: 'chal_boring',
        label: 'Our posts look like ordinary flyers or repetitive sales posts',
        weights: { 'ai-mini-series': 25, 'brand-storytelling': 22, 'regular-ads': 15 },
      },
      {
        id: 'chal_expensive',
        label: 'Good video production feels too expensive or slow',
        weights: { 'regular-ads': 20, 'monthly-retainer': 20 },
      },
      {
        id: 'chal_creators',
        label: 'Managing designers, editors or influencers is stressful',
        weights: { 'monthly-retainer': 25, 'ai-mini-series': 18 },
      },
      {
        id: 'chal_no_convert',
        label: 'We get views or likes, but our content does not convert well enough',
        weights: { 'regular-ads': 28, 'explainer-educational': 20 },
      },
      {
        id: 'chal_ad_fatigue',
        label: 'We run paid ads, but we do not have enough strong creatives to test',
        weights: { 'regular-ads': 30, 'monthly-retainer': 22 },
      },
      {
        id: 'chal_hard_explain',
        label: 'Our product or service is hard to explain quickly',
        weights: { 'explainer-educational': 35, 'brand-storytelling': 15 },
      },
      {
        id: 'chal_stand_out',
        label: 'We want our brand to look more memorable and professional',
        weights: { 'brand-storytelling': 28, 'ai-mini-series': 22 },
      },
      {
        id: 'chal_not_sure',
        label: 'We are not sure what type of content will work best for our audience',
        weights: { 'regular-ads': 20, 'explainer-educational': 18 },
      },
    ],
  },
  {
    id: 'q6',
    stepNumber: 6,
    title: 'When you think about the brands that truly capture people’s attention online, how interested are you in using storytelling, relatable scenarios, short dramas or episodic series to promote your business?',
    subtitle: 'Story-driven videos make viewers stop scrolling because they want to see what happens next.',
    type: 'single',
    required: true,
    enabled: true,
    options: [
      {
        id: 'story_very',
        label: 'Very interested — I love the idea of stories people actually want to watch',
        weights: { 'ai-mini-series': 30, 'brand-storytelling': 25 },
      },
      {
        id: 'story_interested',
        label: 'Interested — if it fits our brand and helps people remember us',
        weights: { 'ai-mini-series': 20, 'brand-storytelling': 20 },
      },
      {
        id: 'story_curious',
        label: "Curious — I've seen brands do this, and I'd like to understand how it works",
        weights: { 'ai-mini-series': 15, 'brand-storytelling': 15 },
      },
      {
        id: 'story_direct',
        label: 'I prefer direct promotional ads for now',
        weights: { 'regular-ads': 28, 'explainer-educational': 12 },
      },
      {
        id: 'story_unsure',
        label: "I'm not sure what would work best for my business",
        weights: { 'regular-ads': 15, 'explainer-educational': 15 },
      },
    ],
  },
  {
    id: 'q7',
    stepNumber: 7,
    title: 'Have you seen AI-generated short films, dramatic videos or branded mini-series online?',
    subtitle: 'If you have not seen one yet, we will show you a quick example on the next screen.',
    type: 'single',
    required: true,
    enabled: true,
    branchingRuleNote: 'Unfamiliar answers trigger the AI Mini-Series Educational Interlude before Question 8.',
    options: [
      {
        id: 'ai_fam_yes_impressive',
        label: 'Yes, and some of them are very impressive',
        weights: { 'ai-mini-series': 20, 'brand-storytelling': 12 },
        triggersInterlude: false,
      },
      {
        id: 'ai_fam_yes_unsure',
        label: 'Yes, a few, but I was not sure how a business could use them',
        weights: { 'ai-mini-series': 12, 'brand-storytelling': 10 },
        triggersInterlude: true,
      },
      {
        id: 'ai_fam_heard',
        label: "I've heard about them, but I haven't really seen good examples",
        weights: { 'ai-mini-series': 10 },
        triggersInterlude: true,
      },
      {
        id: 'ai_fam_no',
        label: 'No, this is new to me',
        weights: { 'explainer-educational': 10 },
        triggersInterlude: true,
      },
    ],
  },
  {
    id: 'q8',
    stepNumber: 8,
    title: 'If Advibe could create an original AI mini-series or story-driven video campaign tailored to your brand, how interested would you be?',
    subtitle: 'Recurring characters, relatable humour or suspense — with your business woven naturally into the story.',
    type: 'single',
    required: true,
    enabled: true,
    branchingRuleNote: 'Top 3 options boost AI mini-series score; declining prevents forced AI mini-series recommendation.',
    options: [
      {
        id: 'ms_int_extremely',
        label: 'Extremely interested — this could set our brand apart',
        weights: { 'ai-mini-series': 45, 'brand-storytelling': 20 },
      },
      {
        id: 'ms_int_very',
        label: 'Very interested — I would love to see ideas for our business',
        weights: { 'ai-mini-series': 32, 'brand-storytelling': 15 },
      },
      {
        id: 'ms_int_open',
        label: 'Open to it — alongside regular promotional videos',
        weights: { 'ai-mini-series': 18, 'monthly-retainer': 20, 'regular-ads': 15 },
      },
      {
        id: 'ms_int_later',
        label: 'Maybe later — right now we need simpler promotional ads',
        weights: { 'regular-ads': 30, 'explainer-educational': 15 },
        disqualifiesCategory: 'ai-mini-series',
      },
      {
        id: 'ms_int_no',
        label: 'Not interested right now',
        weights: { 'regular-ads': 25 },
        disqualifiesCategory: 'ai-mini-series',
      },
    ],
  },
  {
    id: 'q9',
    stepNumber: 9,
    title: 'Roughly how much does your business currently spend on paid advertising in an average month?',
    subtitle: 'e.g., Instagram/Facebook ads, TikTok ads, Google ads, YouTube ads, or sponsored posts.',
    type: 'single',
    required: true,
    enabled: true,
    options: [
      {
        id: 'ad_0',
        label: '₦0 — We are not running paid ads yet',
        weights: { 'regular-ads': 15, 'explainer-educational': 15 },
      },
      {
        id: 'ad_under_50k',
        label: 'Under ₦50,000',
        weights: { 'regular-ads': 20 },
      },
      {
        id: 'ad_50k_150k',
        label: '₦50,000 – ₦150,000',
        weights: { 'regular-ads': 25, 'explainer-educational': 12 },
      },
      {
        id: 'ad_150k_500k',
        label: '₦150,000 – ₦500,000',
        weights: { 'regular-ads': 25, 'monthly-retainer': 22, 'ai-mini-series': 15 },
      },
      {
        id: 'ad_500k_1m',
        label: '₦500,000 – ₦1,000,000',
        weights: { 'monthly-retainer': 30, 'ai-mini-series': 22, 'regular-ads': 20 },
      },
      {
        id: 'ad_above_1m',
        label: 'Above ₦1,000,000',
        weights: { 'monthly-retainer': 35, 'ai-mini-series': 28, 'brand-storytelling': 20 },
      },
      {
        id: 'ad_prefer_not',
        label: 'Prefer not to say',
        weights: { 'regular-ads': 10, 'monthly-retainer': 10 },
      },
    ],
  },
  {
    id: 'q10',
    stepNumber: 10,
    title: 'Roughly how much do you currently spend or plan to invest monthly in creating content for your business?',
    subtitle: 'e.g., video editors, designers, shoots, UGC creators, influencers, or content agencies.',
    type: 'single',
    required: true,
    enabled: true,
    options: [
      {
        id: 'cnt_0',
        label: '₦0 — We create everything ourselves',
        weights: { 'regular-ads': 20, 'explainer-educational': 15 },
      },
      {
        id: 'cnt_under_50k',
        label: 'Under ₦50,000',
        weights: { 'regular-ads': 25 },
      },
      {
        id: 'cnt_50k_150k',
        label: '₦50,000 – ₦150,000',
        weights: { 'regular-ads': 25, 'monthly-retainer': 15, 'explainer-educational': 15 },
      },
      {
        id: 'cnt_150k_300k',
        label: '₦150,000 – ₦300,000',
        weights: { 'monthly-retainer': 30, 'ai-mini-series': 25, 'brand-storytelling': 18 },
      },
      {
        id: 'cnt_300k_500k',
        label: '₦300,000 – ₦500,000',
        weights: { 'monthly-retainer': 35, 'ai-mini-series': 30, 'brand-storytelling': 22 },
      },
      {
        id: 'cnt_above_500k',
        label: 'Above ₦500,000',
        weights: { 'monthly-retainer': 40, 'ai-mini-series': 35, 'brand-storytelling': 25 },
      },
      {
        id: 'cnt_flexible',
        label: 'We do not have a fixed monthly budget yet, but we are ready to invest in the right solution',
        weights: { 'monthly-retainer': 22, 'ai-mini-series': 20, 'regular-ads': 20 },
      },
      {
        id: 'cnt_prefer_not',
        label: 'Prefer not to say',
        weights: { 'regular-ads': 12, 'monthly-retainer': 12 },
      },
    ],
  },
  {
    id: 'q11',
    stepNumber: 11,
    title: 'If we work together over the next 30 to 90 days, what would be the most valuable outcome for your business?',
    subtitle: 'Pick your #1 priority so we can tailor your recommendation.',
    type: 'single',
    required: true,
    enabled: true,
    options: [
      {
        id: 'goal_leads_sales',
        label: 'Get more leads, enquiries and sales from our ads',
        weights: { 'regular-ads': 35, 'monthly-retainer': 15 },
      },
      {
        id: 'goal_consistency',
        label: 'Show up consistently on social media without the stress of creating everything ourselves',
        weights: { 'monthly-retainer': 42, 'regular-ads': 10 },
      },
      {
        id: 'goal_launch',
        label: 'Launch a new product, service or campaign with strong video content',
        weights: { 'brand-storytelling': 30, 'regular-ads': 28 },
      },
      {
        id: 'goal_explain',
        label: 'Explain our product or service clearly so customers understand why they need it',
        weights: { 'explainer-educational': 42, 'regular-ads': 15 },
      },
      {
        id: 'goal_story_series',
        label: 'Build a stronger, more memorable brand through storytelling or an AI mini-series',
        weights: { 'ai-mini-series': 45, 'brand-storytelling': 30 },
      },
      {
        id: 'goal_test_angles',
        label: 'Create enough fresh creatives to test different marketing angles',
        weights: { 'regular-ads': 35, 'monthly-retainer': 28 },
      },
      {
        id: 'goal_partner',
        label: 'Have a reliable creative partner handling our video content every month',
        weights: { 'monthly-retainer': 45, 'ai-mini-series': 15 },
      },
    ],
  },
  {
    id: 'q12',
    stepNumber: 12,
    title: 'Where should we prepare your personalised recommendation?',
    subtitle: 'Enter your details below to unlock your tailored creative blueprint and strategy summary.',
    type: 'contact',
    required: true,
    enabled: true,
    options: [],
  },
];

export const defaultQuizConfig: QuizConfig = {
  enabled: true,
  introHeading: "LET'S FIND THE RIGHT CREATIVE SOLUTION FOR YOUR BUSINESS.",
  introCopy:
    "Every business has different marketing needs. Some need more consistent content. Others need better advertisements, more engaging storytelling or a completely different way to capture their audience's attention.\n\nAnswer a few quick questions about your business, your marketing activities and your goals. We'll help you discover the Advibe services that could work best for you.",
  introCta: 'Find My Best-Fit Service →',
  introReassurance: 'Quick, simple and free. No commitment required.',
  questions: defaultQuizQuestions,
  recommendation: {
    categoryMultipliers: {
      'regular-ads': 1.0,
      'monthly-retainer': 1.05,
      'ai-mini-series': 1.05,
      'explainer-educational': 1.0,
      'brand-storytelling': 1.0,
    },
    retainerThreshold: 55,
    miniSeriesThreshold: 55,
    highBudgetBoost: 1.2,
    explanations: {
      'regular-ads':
        'Based on your answers, your immediate priority is generating direct leads, enquiries, and sales with scroll-stopping advertising creatives that test different hooks and angles.',
      'monthly-retainer':
        'You highlighted the need for consistent social media visibility without the operational stress of planning, scripting, and managing editors every week. A dedicated Monthly Content Retainer gives your brand an entire creative studio on tap.',
      'ai-mini-series':
        'Your openness to episodic storytelling and desire to stand out from repetitive "Buy Now" flyers makes your brand a strong candidate for an original AI Promotional Mini-Series with recurring characters and memorable plotlines.',
      'explainer-educational':
        'Because your offering benefits from clear demonstration and trust-building, structured Explainer & Educational AI videos will help prospects immediately grasp why they need your solution.',
      'brand-storytelling':
        'To elevate how your business is perceived and launch campaigns with cinematic polish, Brand Storytelling & Promotional Campaign films will give your offer the authority it deserves.',
    },
  },
  whatsappTemplate: `Hello Advibe!

My name is {fullName} from {businessName}.

I just completed the Advibe Service Discovery Quiz and would like to discuss the recommended creative solution for my business.

*Assessment Reference:* {assessmentId}

*Business Details*
• Business Name: {businessName}
• What We Sell/Offer: {whatBusinessSells}
• Website / Social Page: {websiteOrSocial}

*Current Marketing*
• Active Platforms: {platformsUsed}
• Posting Frequency: {postingFrequency}
• Monthly Paid Ad Spend: {monthlyAdSpendRange}
• Monthly Content Budget: {monthlyContentSpendRange}

*Main Challenges & Goals*
• Biggest Challenge(s): {biggestChallenges}
• Primary Goal: {primaryGoal}
• Interested in Consistent Content: {wantsMoreConsistency}
• Interested in AI Mini-Series: {aiMiniSeriesInterest}

*Advibe Recommendation*
• Primary Recommendation: {primaryRecommendedService}
• Suggested Package: {primaryRecommendedPackageName} ({primaryRecommendedPriceFormatted})
• Secondary Opportunity: {secondaryRecommendation}{affiliateBlock}

I'd love to discuss how we can get started.`,
  googleSheetsWebhookUrl: (import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined)?.trim() || (import.meta.env.VITE_MAKE_WEBHOOK_URL as string | undefined)?.trim() || '',
  spreadsheetName: 'ADVIBE STUDIO — LEADS & BUSINESS ASSESSMENTS',
};

/* ==========================================================================
   CURRENCY-AWARE SPEND LABEL FORMATTER (Q9 & Q10)
   ========================================================================== */

const LOCALIZED_AD_SPEND: Record<string, Record<string, string>> = {
  GH: {
    ad_0: 'GH₵0 — We are not running paid ads yet',
    ad_under_50k: 'Under GH₵600 (≈ Under ₦50,000)',
    ad_50k_150k: 'GH₵600 – GH₵1,800 (≈ ₦50k – ₦150k)',
    ad_150k_500k: 'GH₵1,800 – GH₵6,000 (≈ ₦150k – ₦500k)',
    ad_500k_1m: 'GH₵6,000 – GH₵12,000 (≈ ₦500k – ₦1M)',
    ad_above_1m: 'Above GH₵12,000 (≈ Above ₦1,000,000)',
  },
  KE: {
    ad_0: 'KSh 0 — We are not running paid ads yet',
    ad_under_50k: 'Under KSh 8,500 (≈ Under ₦50,000)',
    ad_50k_150k: 'KSh 8,500 – KSh 25,000 (≈ ₦50k – ₦150k)',
    ad_150k_500k: 'KSh 25,000 – KSh 85,000 (≈ ₦150k – ₦500k)',
    ad_500k_1m: 'KSh 85,000 – KSh 170,000 (≈ ₦500k – ₦1M)',
    ad_above_1m: 'Above KSh 170,000 (≈ Above ₦1,000,000)',
  },
  US: {
    ad_0: '$0 — We are not running paid ads yet',
    ad_under_50k: 'Under $100 / month',
    ad_50k_150k: '$100 – $300 / month',
    ad_150k_500k: '$300 – $1,000 / month',
    ad_500k_1m: '$1,000 – $2,500 / month',
    ad_above_1m: 'Above $2,500 / month',
  },
  UK: {
    ad_0: '£0 — We are not running paid ads yet',
    ad_under_50k: 'Under £80 / month',
    ad_50k_150k: '£80 – £250 / month',
    ad_150k_500k: '£250 – £800 / month',
    ad_500k_1m: '£800 – £2,000 / month',
    ad_above_1m: 'Above £2,000 / month',
  },
};

const LOCALIZED_CONTENT_SPEND: Record<string, Record<string, string>> = {
  GH: {
    cnt_0: 'GH₵0 — We create everything ourselves',
    cnt_under_50k: 'Under GH₵600',
    cnt_50k_150k: 'GH₵600 – GH₵1,800',
    cnt_150k_300k: 'GH₵1,800 – GH₵3,600',
    cnt_300k_500k: 'GH₵3,600 – GH₵6,000',
    cnt_above_500k: 'Above GH₵6,000',
  },
  KE: {
    cnt_0: 'KSh 0 — We create everything ourselves',
    cnt_under_50k: 'Under KSh 8,500',
    cnt_50k_150k: 'KSh 8,500 – KSh 25,000',
    cnt_150k_300k: 'KSh 25,000 – KSh 50,000',
    cnt_300k_500k: 'KSh 50,000 – KSh 85,000',
    cnt_above_500k: 'Above KSh 85,000',
  },
  US: {
    cnt_0: '$0 — We create everything ourselves',
    cnt_under_50k: 'Under $100 / month',
    cnt_50k_150k: '$100 – $350 / month',
    cnt_150k_300k: '$350 – $750 / month',
    cnt_300k_500k: '$750 – $1,200 / month',
    cnt_above_500k: 'Above $1,200 / month',
  },
  UK: {
    cnt_0: '£0 — We create everything ourselves',
    cnt_under_50k: 'Under £80 / month',
    cnt_50k_150k: '£80 – £280 / month',
    cnt_150k_300k: '£280 – £600 / month',
    cnt_300k_500k: '£600 – £950 / month',
    cnt_above_500k: 'Above £950 / month',
  },
};

export function getLocalizedOptionLabel(questionId: string, optionId: string, defaultLabel: string, countryCode: string): string {
  if (countryCode === 'NG') return defaultLabel;
  if (questionId === 'q9' && LOCALIZED_AD_SPEND[countryCode]?.[optionId]) {
    return LOCALIZED_AD_SPEND[countryCode][optionId];
  }
  if (questionId === 'q10' && LOCALIZED_CONTENT_SPEND[countryCode]?.[optionId]) {
    return LOCALIZED_CONTENT_SPEND[countryCode][optionId];
  }
  return defaultLabel;
}

/* ==========================================================================
   DYNAMIC PACKAGE CATALOGUE RESOLVER (NO HARDCODED PRICES OR NAMES)
   ========================================================================== */

export interface ResolvedCataloguePackage {
  id: string;
  name: string;
  serviceCategory: ServiceCategoryKey;
  serviceCategoryLabel: string;
  price: number;
  formattedPrice: string;
  quantity: number;
  durationOrPeriod: string;
  description: string;
  whoFor: string;
  features: string[];
  exploreHref: string;
  isMonthly: boolean;
}

export function resolveCataloguePackages(content: SiteContent, country: Country): ResolvedCataloguePackage[] {
  const list: ResolvedCataloguePackage[] = [];

  // 1. Flagship Commercial Offers (Monthly Retainer & AI Promotional Mini-Series)
  const retainer = content.commercialOffers?.['monthly-content'] || defaultCommercialOffers['monthly-content'];
  if (retainer.active !== false) {
    const rPrice = retainer.pricesByCountry?.[country.code] ?? retainer.price ?? 250000;
    list.push({
      id: retainer.id,
      name: retainer.name,
      serviceCategory: 'monthly-retainer',
      serviceCategoryLabel: 'Monthly Content Retainer',
      price: rPrice,
      formattedPrice: `${fmtMoney(rPrice, country)}/month`,
      quantity: retainer.monthlyVideoQuantity || 15,
      durationOrPeriod: `${retainer.monthlyVideoQuantity || 15} videos every month (up to 1m 30s each)`,
      description: retainer.tagline,
      whoFor: 'Growing businesses that want a dedicated creative studio producing consistent videos every month.',
      features: retainer.offerSummary?.inclusions?.slice(0, 6) || [
        `${retainer.monthlyVideoQuantity || 15} strategic videos every month (up to 1m 30s each)`,
        'Creative ideation, scripting & one-page creative briefs',
        'AI-assisted video production, voiceover & editing',
        '1 consolidated revision round per video',
      ],
      exploreHref: '#/monthly-content',
      isMonthly: true,
    });
  }

  const miniSeries = content.commercialOffers?.['promotional-mini-series'] || defaultCommercialOffers['promotional-mini-series'];
  if (miniSeries.active !== false) {
    const mPrice = miniSeries.pricesByCountry?.[country.code] ?? miniSeries.price ?? 300000;
    list.push({
      id: miniSeries.id,
      name: miniSeries.name,
      serviceCategory: 'ai-mini-series',
      serviceCategoryLabel: 'AI Promotional Mini-Series',
      price: mPrice,
      formattedPrice: `${fmtMoney(mPrice, country)}/month`,
      quantity: miniSeries.monthlyVideoQuantity || 15,
      durationOrPeriod: `${miniSeries.monthlyVideoQuantity || 15} episodic / story videos monthly (up to 2 mins each)`,
      description: miniSeries.tagline,
      whoFor: 'Brands ready to stand out with original characters, relatable drama, comedy, or connected episodic stories.',
      features: miniSeries.offerSummary?.inclusions?.slice(0, 6) || [
        `${miniSeries.monthlyVideoQuantity || 15} story-driven / episodic videos monthly (up to 2 mins each)`,
        'Character bible, world-building & episode scripts',
        '1-page creative brief before each production sprint',
        'Cinema-grade AI visuals, sound design & voice acting',
      ],
      exploreHref: '#/promotional-mini-series',
      isMonthly: true,
    });
  }

  // 2. Standard Offers from content.offers (excluding legacy monthly-studio)
  const activeOffers = (content.offers || []).filter((o) => o.active && o.id !== 'monthly-studio' && o.goal !== 'monthly');
  for (const offer of activeOffers) {
    const p = priceFor(offer, country) ?? offer.price;
    let cat: ServiceCategoryKey = 'regular-ads';
    let catLabel = 'Direct-Response Video Advertisements';

    if (offer.id === 'single-video' || offer.id === 'single-60') {
      cat = 'explainer-educational';
      catLabel = 'Single Video Ad & Explainer Production';
    } else if (offer.id === 'bundle-10') {
      cat = 'brand-storytelling';
      catLabel = 'Brand Storytelling & Multi-Angle Campaigns';
    }

    list.push({
      id: offer.id,
      name: offer.name,
      serviceCategory: cat,
      serviceCategoryLabel: catLabel,
      price: p,
      formattedPrice: fmtMoney(p, country),
      quantity: offer.quantity,
      durationOrPeriod: `${offer.quantity} × ${offer.duration}`,
      description: offer.description,
      whoFor: offer.whoFor,
      features: [...(offer.features || []), ...(offer.included || [])].slice(0, 6),
      exploreHref: '#pricing',
      isMonthly: false,
    });
  }

  return list;
}

/* ==========================================================================
   WEIGHTED RECOMMENDATION ENGINE
   ========================================================================== */

export interface QuizAnswersMap {
  q1: string;
  q2: string[];
  q3: string;
  q4: string;
  q5: string[];
  q6: string;
  q7: string;
  sawEducationalInterlude: boolean;
  q8: string;
  q9: string;
  q10: string;
  q11: string;
}

export interface ComputedRecommendation {
  scores: Record<ServiceCategoryKey, number>;
  primaryCategory: ServiceCategoryKey;
  primaryServiceTitle: string;
  primaryPackage: ResolvedCataloguePackage;
  primaryWhyFits: string;
  secondaryCategory: ServiceCategoryKey;
  secondaryServiceTitle: string;
  secondaryPackage: ResolvedCataloguePackage;
  monthlyRetainerOpportunity: boolean;
  retainerPackage: ResolvedCataloguePackage;
  retainerUpsellAngle: {
    headline: string;
    body: string;
    highlight: string;
  };
  aiMiniSeriesOpportunity: boolean;
  miniSeriesPackage: ResolvedCataloguePackage;
  suppressRetainerUpsell: boolean;
}

const SERVICE_TITLES: Record<ServiceCategoryKey, string> = {
  'regular-ads': 'Direct-Response Video Advertisements',
  'monthly-retainer': 'Advibe Monthly Video Content Retainer',
  'ai-mini-series': 'AI Promotional Mini-Series & Branded Entertainment',
  'explainer-educational': 'Explainer & Educational Video Production',
  'brand-storytelling': 'Brand Storytelling & Promotional Campaign Videos',
};

export function calculateRecommendations(opts: {
  answers: QuizAnswersMap;
  content: SiteContent;
  country: Country;
  entryOfferId?: string;
  originalChannel?: string;
}): ComputedRecommendation {
  const { answers, content, country, entryOfferId, originalChannel } = opts;
  const quizCfg = content.quizConfig || defaultQuizConfig;
  const recCfg = quizCfg.recommendation || defaultQuizConfig.recommendation;
  const questions = quizCfg.questions?.length ? quizCfg.questions : defaultQuizQuestions;
  const catalogue = resolveCataloguePackages(content, country);

  const scores: Record<ServiceCategoryKey, number> = {
    'regular-ads': 10,
    'monthly-retainer': 10,
    'ai-mini-series': 10,
    'explainer-educational': 10,
    'brand-storytelling': 10,
  };

  let disqualifiedMiniSeries = false;

  // 1. Accumulate weights from selected options across Q1..Q11
  for (const q of questions) {
    if (q.id === 'q12') continue;
    const rawAns = answers[q.id as keyof QuizAnswersMap];
    const selectedIds = Array.isArray(rawAns) ? rawAns : typeof rawAns === 'string' && rawAns ? [rawAns] : [];

    for (const optId of selectedIds) {
      const opt = q.options.find((o) => o.id === optId);
      if (!opt) continue;
      if (opt.disqualifiesCategory === 'ai-mini-series') {
        disqualifiedMiniSeries = true;
      }
      if (opt.weights) {
        for (const [cat, weight] of Object.entries(opt.weights) as [ServiceCategoryKey, number][]) {
          scores[cat] = (scores[cat] || 0) + weight;
        }
      }
    }
  }

  // 2. Entry-point context boost (respects what the visitor clicked to open the quiz, while still adapting to their answers)
  if (entryOfferId === 'monthly-content') {
    scores['monthly-retainer'] += 22;
  } else if (entryOfferId === 'promotional-mini-series') {
    scores['ai-mini-series'] += 22;
  } else if (entryOfferId === 'single-video' || entryOfferId === 'single-60') {
    scores['explainer-educational'] += 18;
    scores['regular-ads'] += 18;
  } else if (entryOfferId === 'bundle-5' || entryOfferId === 'bundle-10' || entryOfferId === 'single-30') {
    scores['regular-ads'] += 18;
  }

  // 3. Apply high-budget boost if Q9 or Q10 indicates strong investment capacity
  const isHighBudget =
    ['ad_150k_500k', 'ad_500k_1m', 'ad_above_1m'].includes(answers.q9) ||
    ['cnt_150k_300k', 'cnt_300k_500k', 'cnt_above_500k', 'cnt_flexible'].includes(answers.q10);

  if (isHighBudget) {
    scores['monthly-retainer'] = Math.round(scores['monthly-retainer'] * (recCfg.highBudgetBoost || 1.15));
    scores['ai-mini-series'] = Math.round(scores['ai-mini-series'] * (recCfg.highBudgetBoost || 1.15));
  }

  // 4. Apply Admin category multipliers
  for (const cat of Object.keys(scores) as ServiceCategoryKey[]) {
    const mult = recCfg.categoryMultipliers?.[cat] ?? 1.0;
    scores[cat] = Math.round(scores[cat] * mult);
  }

  // 5. Enforce Q8 rule: If user explicitly declined AI mini-series in Q8 ("Maybe later" or "Not interested right now"),
  // do NOT force AI mini-series as primary recommendation.
  if (disqualifiedMiniSeries) {
    scores['ai-mini-series'] = Math.min(scores['ai-mini-series'], 25);
  }

  // 6. Rank categories
  const sortedCategories = (Object.keys(scores) as ServiceCategoryKey[]).sort((a, b) => scores[b] - scores[a]);
  const primaryCategory = sortedCategories[0];
  const secondaryCategory = sortedCategories[1] || 'monthly-retainer';

  // 7. Map category + budget to specific real package from the catalogue
  const pickPackageForCategory = (cat: ServiceCategoryKey): ResolvedCataloguePackage => {
    if (cat === 'monthly-retainer') {
      return catalogue.find((p) => p.id === 'monthly-content') || catalogue[0];
    }
    if (cat === 'ai-mini-series') {
      return catalogue.find((p) => p.id === 'promotional-mini-series') || catalogue[0];
    }
    if (cat === 'explainer-educational') {
      if (isHighBudget) {
        return catalogue.find((p) => p.id === 'bundle-5') || catalogue.find((p) => p.id === 'single-video') || catalogue[0];
      }
      return catalogue.find((p) => p.id === 'single-video') || catalogue[0];
    }
    if (cat === 'brand-storytelling') {
      if (['cnt_300k_500k', 'cnt_above_500k', 'ad_500k_1m', 'ad_above_1m'].includes(answers.q9) || ['cnt_300k_500k', 'cnt_above_500k'].includes(answers.q10)) {
        return catalogue.find((p) => p.id === 'bundle-10') || catalogue.find((p) => p.id === 'bundle-5') || catalogue[0];
      }
      return catalogue.find((p) => p.id === 'bundle-5') || catalogue.find((p) => p.id === 'single-video') || catalogue[0];
    }
    // 'regular-ads'
    if (['ad_500k_1m', 'ad_above_1m'].includes(answers.q9) || ['cnt_300k_500k', 'cnt_above_500k'].includes(answers.q10)) {
      return catalogue.find((p) => p.id === 'bundle-10') || catalogue.find((p) => p.id === 'bundle-5') || catalogue[0];
    }
    if (['ad_50k_150k', 'ad_150k_500k'].includes(answers.q9) || ['cnt_50k_150k', 'cnt_150k_300k', 'cnt_flexible'].includes(answers.q10) || answers.q5.includes('chal_ad_fatigue') || answers.q11 === 'goal_test_angles') {
      return catalogue.find((p) => p.id === 'bundle-5') || catalogue[0];
    }
    return catalogue.find((p) => p.id === 'single-video') || catalogue[0];
  };

  const primaryPackage = pickPackageForCategory(primaryCategory);
  let secondaryPackage = pickPackageForCategory(secondaryCategory);
  if (secondaryPackage.id === primaryPackage.id) {
    secondaryPackage =
      catalogue.find((p) => p.id === 'monthly-content' && p.id !== primaryPackage.id) ||
      catalogue.find((p) => p.id === 'promotional-mini-series' && p.id !== primaryPackage.id) ||
      catalogue.find((p) => p.id === 'bundle-5' && p.id !== primaryPackage.id) ||
      catalogue[0];
  }

  const retainerPackage = catalogue.find((p) => p.id === 'monthly-content') || catalogue[0];
  const miniSeriesPackage = catalogue.find((p) => p.id === 'promotional-mini-series') || catalogue[0];

  const monthlyRetainerOpportunity =
    scores['monthly-retainer'] >= (recCfg.retainerThreshold || 55) ||
    ['cons_yes_definitely', 'cons_yes_no_time'].includes(answers.q4) ||
    answers.q11 === 'goal_consistency' ||
    answers.q11 === 'goal_partner';

  const aiMiniSeriesOpportunity =
    !disqualifiedMiniSeries &&
    (scores['ai-mini-series'] >= (recCfg.miniSeriesThreshold || 55) ||
      ['ms_int_extremely', 'ms_int_very', 'ms_int_open'].includes(answers.q8) ||
      ['story_very', 'story_interested'].includes(answers.q6));

  // Suppress redundant monthly retainer upsell if visitor's original attributed channel was monthly-retainer
  // or if Monthly Retainer is already the primary recommendation.
  const effectiveChannel = originalChannel || getOriginalAcquisitionChannel();
  const suppressRetainerUpsell =
    effectiveChannel === 'monthly-retainer' ||
    entryOfferId === 'monthly-content' ||
    primaryPackage.id === 'monthly-content';

  // Build tailored upsell angle based on Section 9.2 rules
  let retainerUpsellAngle = {
    headline: 'Want Consistent Visibility Without Managing Production Every Week?',
    body: 'Instead of ordering one-off videos only when a campaign comes up, our Monthly Content Retainer gives your brand 15 planned, scripted, and finished videos every month.',
    highlight: 'Your on-demand creative studio — 15 videos every month.',
  };

  if (['freq_once_mo', 'freq_hardly', 'freq_few_mo'].includes(answers.q3)) {
    retainerUpsellAngle = {
      headline: 'Turn Sporadic Posting Into Consistent Brand Visibility',
      body: 'Posting once in a while means your audience forgets your brand between promotions. Our Monthly Content Retainer keeps your feed active with 15 planned videos every month so you stay top-of-mind.',
      highlight: 'Built for consistency & brand recall',
    };
  } else if (answers.q4 === 'cons_yes_no_time' || answers.q5.includes('chal_no_time') || answers.q5.includes('chal_creators')) {
    retainerUpsellAngle = {
      headline: 'Done-For-You Creative Planning, Scripting & Production',
      body: 'You have a business to run. With our Monthly Content Retainer, Advibe handles ideation, scriptwriting, one-page creative briefs, and full AI production — so you only review and approve.',
      highlight: 'Zero production headaches for your team',
    };
  } else if (['ad_150k_500k', 'ad_500k_1m', 'ad_above_1m'].includes(answers.q9) || answers.q5.includes('chal_ad_fatigue')) {
    retainerUpsellAngle = {
      headline: 'Feed Your Ad Campaigns With Fresh Creative Angles Every Month',
      body: 'Running paid ads with the same 1 or 2 videos leads to creative fatigue. A Monthly Retainer supplies 15 fresh hooks, angles, and formats every 30 days to support stronger creative testing.',
      highlight: '15 fresh creatives/month to combat ad fatigue',
    };
  } else if (answers.q5.includes('chal_expensive') || answers.q4 === 'cons_yes_cost') {
    retainerUpsellAngle = {
      headline: 'Lower Cost Per Video With Predictable Monthly Output',
      body: `Rather than paying separately for individual shoots or freelancers, the Monthly Content Retainer brings your unit cost down to ~${fmtMoney(Math.round(retainerPackage.price / Math.max(1, retainerPackage.quantity)), country)} per video across ${retainerPackage.quantity} monthly deliverables.`,
      highlight: 'Best value per finished commercial video',
    };
  }

  const baseExplanation =
    recCfg.explanations?.[primaryCategory] || defaultQuizConfig.recommendation.explanations[primaryCategory];

  return {
    scores,
    primaryCategory,
    primaryServiceTitle: SERVICE_TITLES[primaryCategory],
    primaryPackage,
    primaryWhyFits: baseExplanation,
    secondaryCategory,
    secondaryServiceTitle: SERVICE_TITLES[secondaryCategory],
    secondaryPackage,
    monthlyRetainerOpportunity,
    retainerPackage,
    retainerUpsellAngle,
    aiMiniSeriesOpportunity,
    miniSeriesPackage,
    suppressRetainerUpsell,
  };
}

/* ==========================================================================
   PERSONALISED CONTENT OPPORTUNITY CALCULATOR (SECTION 5.5)
   ========================================================================== */

export interface ContentOpportunitySummary {
  currentEstimatedMonthlyPosts: number;
  currentFrequencyLabel: string;
  targetPlanLabel: string;
  targetMonthlyPosts: number;
  additionalMonthlyOpportunities: number;
  additionalYearlyOpportunities: number;
  reportedAdSpendLabel: string;
  hasPaidAdSpend: boolean;
}

export function calculateContentOpportunity(
  q3FrequencyId: string,
  q9AdSpendId: string,
  countryCode: string,
  targetPostsPerWeek = 5
): ContentOpportunitySummary {
  const freqMap: Record<string, { postsPerMonth: number; label: string }> = {
    freq_daily: { postsPerMonth: 28, label: 'Every day (~28 posts/month)' },
    freq_3_5_wk: { postsPerMonth: 16, label: '3–5 times a week (~16 posts/month)' },
    freq_1_2_wk: { postsPerMonth: 6, label: '1–2 times a week (~6 posts/month)' },
    freq_few_mo: { postsPerMonth: 3, label: 'A few times a month (~3 posts/month)' },
    freq_once_mo: { postsPerMonth: 1, label: 'Once a month or less (~1 post/month)' },
    freq_hardly: { postsPerMonth: 0, label: 'Hardly ever (0–1 post/month)' },
  };

  const current = freqMap[q3FrequencyId] || { postsPerMonth: 2, label: 'Occasionally (~2 posts/month)' };
  const targetMonthlyPosts = Math.round(targetPostsPerWeek * 4);
  const additionalMonthlyOpportunities = Math.max(0, targetMonthlyPosts - current.postsPerMonth);
  const additionalYearlyOpportunities = additionalMonthlyOpportunities * 12;

  const q9Default = defaultQuizQuestions.find((q) => q.id === 'q9')?.options.find((o) => o.id === q9AdSpendId)?.label || 'Not specified';
  const reportedAdSpendLabel = getLocalizedOptionLabel('q9', q9AdSpendId, q9Default, countryCode);
  const hasPaidAdSpend = Boolean(q9AdSpendId && q9AdSpendId !== 'ad_0' && q9AdSpendId !== 'ad_prefer_not');

  return {
    currentEstimatedMonthlyPosts: current.postsPerMonth,
    currentFrequencyLabel: current.label,
    targetPlanLabel: `${targetPostsPerWeek} posts per week`,
    targetMonthlyPosts,
    additionalMonthlyOpportunities,
    additionalYearlyOpportunities,
    reportedAdSpendLabel,
    hasPaidAdSpend,
  };
}

/* ==========================================================================
   WHATSAPP PREFILLED MESSAGE & LINK GENERATOR (PART 6)
   ========================================================================== */

export function buildAssessmentWhatsAppMessage(
  assessment: BusinessAssessment,
  content: SiteContent,
  country: Country
): string {
  const template = content.quizConfig?.whatsappTemplate || defaultQuizConfig.whatsappTemplate;
  const priceFormatted = fmtMoney(assessment.primaryRecommendedPrice, country);

  let affiliateBlock = '';
  if (assessment.affiliateCode) {
    affiliateBlock = `\n\n*Referral & Discount Attribution*\n• Referral Code: ${assessment.affiliateCode}\n• 5% First-Time Referral Discount: ${
      assessment.claimed5PercentDiscount
        ? 'Claimed & Eligible (5% Off First Qualifying Project)'
        : assessment.eligibleFor5PercentDiscount
        ? 'Eligible (Not Claimed)'
        : 'Standard'
    }`;
  }

  return template
    .replace(/\{fullName\}/g, assessment.fullName)
    .replace(/\{businessName\}/g, assessment.businessName)
    .replace(/\{assessmentId\}/g, assessment.assessmentId)
    .replace(/\{whatBusinessSells\}/g, assessment.whatBusinessSells)
    .replace(/\{websiteOrSocial\}/g, assessment.websiteOrSocial || 'Not provided')
    .replace(/\{platformsUsed\}/g, assessment.platformsUsed.join(', ') || 'None specified')
    .replace(/\{postingFrequency\}/g, assessment.postingFrequency)
    .replace(/\{monthlyAdSpendRange\}/g, assessment.monthlyAdSpendRange)
    .replace(/\{monthlyContentSpendRange\}/g, assessment.monthlyContentSpendRange)
    .replace(/\{biggestChallenges\}/g, assessment.biggestChallenges.join('; '))
    .replace(/\{primaryGoal\}/g, assessment.primaryGoal)
    .replace(/\{wantsMoreConsistency\}/g, assessment.wantsMoreConsistency)
    .replace(/\{aiMiniSeriesInterest\}/g, assessment.aiMiniSeriesInterest)
    .replace(/\{primaryRecommendedService\}/g, assessment.primaryRecommendedService)
    .replace(/\{primaryRecommendedPackageName\}/g, assessment.primaryRecommendedPackageName)
    .replace(/\{primaryRecommendedPriceFormatted\}/g, priceFormatted)
    .replace(/\{secondaryRecommendation\}/g, `${assessment.secondaryRecommendation} (${assessment.secondaryPackageName})`)
    .replace(/\{affiliateBlock\}/g, affiliateBlock);
}

export function buildAssessmentWhatsAppUrl(
  assessment: BusinessAssessment,
  content: SiteContent,
  country: Country
): string {
  const number = waNumberFor(content.settings.whatsappNumber, country).replace(/[^\d]/g, '');
  const message = buildAssessmentWhatsAppMessage(assessment, content, country);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
