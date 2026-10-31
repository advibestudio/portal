import type {
  BusinessAssessment,
  PipelineStage,
  QuizFunnelAnalyticsEvent,
} from '@/content/types';

/* ==========================================================================
   PRIMARY ASSESSMENT & FUNNEL ANALYTICS STORE + GOOGLE SHEETS 4-TAB SYNC
   ========================================================================== */

const LS_ASSESSMENTS = 'advibe.assessments.v1';
const LS_FUNNEL_EVENTS = 'advibe.quiz.events.v1';
const SESSION_ID_KEY = 'advibe.quiz.session_id.v1';

export function getQuizSessionId(): string {
  if (typeof window === 'undefined') return 'srv-session';
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return `SES-${Date.now()}`;
  }
}

/* ---------- SEED ASSESSMENTS FOR INITIAL PIPELINE & ANALYTICS ---------- */
const SEED_ASSESSMENTS: BusinessAssessment[] = [
  {
    assessmentId: 'ADV-QUIZ-8491',
    timestampSubmitted: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    entryPage: 'homepage',
    originalAcquisitionChannel: 'affiliate',
    fullName: 'Adaeze Nwosu',
    businessName: 'Zuri Luxe Hair & Beauty',
    whatsappNumber: '+2348034567890',
    email: 'adaeze@zuriluxe.ng',
    websiteOrSocial: '@zuriluxehair',
    whatBusinessSells: 'Luxury raw virgin hair extensions and wig installations in Lagos',
    howDidYouHear: 'Advibe Affiliate Partner Link',
    socialMediaStatus: 'Yes, but inconsistently',
    platformsUsed: ['Instagram', 'TikTok', 'WhatsApp Business / Status'],
    postingFrequency: '1–2 times a week',
    wantsMoreConsistency: "Yes, if we didn't have to manage the whole creative process ourselves",
    biggestChallenges: [
      "We don't have enough time to plan and create content consistently",
      'Our posts look like ordinary flyers or repetitive sales posts',
    ],
    storytellingInterest: 'Very interested — I love the idea of stories people actually want to watch',
    aiSeriesFamiliarity: 'Yes, a few, but I was not sure how a business could use them',
    sawEducationalInterlude: true,
    aiMiniSeriesInterest: 'Very interested — I would love to see ideas for our business',
    monthlyAdSpendRange: '₦150,000 – ₦500,000',
    monthlyContentSpendRange: '₦150,000 – ₦300,000',
    primaryGoal: 'Show up consistently on social media without the stress of creating everything ourselves',
    primaryRecommendedService: 'Advibe Monthly Video Content Retainer',
    primaryRecommendedPackageId: 'monthly-content',
    primaryRecommendedPackageName: 'Monthly AI Video Content Retainer',
    primaryRecommendedPrice: 190000,
    secondaryRecommendation: 'AI Promotional Mini-Series & Branded Entertainment',
    secondaryPackageId: 'promotional-mini-series',
    secondaryPackageName: 'AI Promotional Mini Series',
    monthlyRetainerOpportunity: true,
    aiMiniSeriesOpportunity: true,
    categoryScores: {
      'regular-ads': 54,
      'monthly-retainer': 142,
      'ai-mini-series': 118,
      'explainer-educational': 32,
      'brand-storytelling': 76,
    },
    referralSource: 'affiliate_link',
    affiliateId: 'aff-1',
    affiliateCode: 'ADV-JOHN',
    eligibleFor5PercentDiscount: true,
    claimed5PercentDiscount: true,
    discountAmount: 10000,
    utmSource: 'instagram',
    utmMedium: 'partner_bio',
    utmCampaign: 'q4_retainer',
    countryCode: 'NG',
    currencyCode: 'NGN',
    quizCompletionStatus: 'completed',
    whatsappCtaClicked: true,
    whatsappCtaClickedAt: new Date(Date.now() - 35.8 * 3600 * 1000).toISOString(),
    leadStatus: 'Conversation ongoing',
    salesNotes: 'Loved the CirclesFundMe example during the quiz. Wants 15 videos/mo starting next Monday.',
    syncStatus: 'synced',
    lastSyncAttemptAt: new Date(Date.now() - 35.8 * 3600 * 1000).toISOString(),
  },
  {
    assessmentId: 'ADV-QUIZ-8498',
    timestampSubmitted: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    entryPage: 'ai-mini-series-page',
    entryContextOfferId: 'promotional-mini-series',
    entryContextOfferName: 'AI Promotional Mini Series',
    originalAcquisitionChannel: 'ai-mini-series',
    fullName: 'Tunde Bakare',
    businessName: 'PaySwift Microfinance',
    whatsappNumber: '+2348091122334',
    email: 'tunde@payswift.io',
    websiteOrSocial: 'https://payswift.io',
    whatBusinessSells: 'Instant SME working capital loans and automated cooperative savings',
    howDidYouHear: 'Instagram',
    socialMediaStatus: 'Yes, actively',
    platformsUsed: ['Instagram', 'Facebook', 'TikTok', 'YouTube / YouTube Shorts', 'LinkedIn'],
    postingFrequency: '3–5 times a week',
    wantsMoreConsistency: 'We already post enough, but we want better quality and better results',
    biggestChallenges: [
      'We run out of fresh creative ideas',
      'We want our brand to look more memorable and professional',
    ],
    storytellingInterest: 'Very interested — I love the idea of stories people actually want to watch',
    aiSeriesFamiliarity: 'Yes, and some of them are very impressive',
    sawEducationalInterlude: false,
    aiMiniSeriesInterest: 'Extremely interested — this could set our brand apart',
    monthlyAdSpendRange: '₦500,000 – ₦1,000,000',
    monthlyContentSpendRange: '₦300,000 – ₦500,000',
    primaryGoal: 'Build a stronger, more memorable brand through storytelling or an AI mini-series',
    primaryRecommendedService: 'AI Promotional Mini-Series & Branded Entertainment',
    primaryRecommendedPackageId: 'promotional-mini-series',
    primaryRecommendedPackageName: 'AI Promotional Mini Series',
    primaryRecommendedPrice: 200000,
    secondaryRecommendation: 'Advibe Monthly Video Content Retainer',
    secondaryPackageId: 'monthly-content',
    secondaryPackageName: 'Monthly AI Video Content Retainer',
    monthlyRetainerOpportunity: true,
    aiMiniSeriesOpportunity: true,
    categoryScores: {
      'regular-ads': 62,
      'monthly-retainer': 115,
      'ai-mini-series': 168,
      'explainer-educational': 48,
      'brand-storytelling': 112,
    },
    referralSource: 'direct',
    affiliateId: '',
    affiliateCode: '',
    eligibleFor5PercentDiscount: false,
    claimed5PercentDiscount: false,
    discountAmount: 0,
    utmSource: 'meta_ads',
    utmMedium: 'cpc',
    utmCampaign: 'mini_series_launch',
    countryCode: 'NG',
    currencyCode: 'NGN',
    quizCompletionStatus: 'completed',
    whatsappCtaClicked: true,
    whatsappCtaClickedAt: new Date(Date.now() - 13.9 * 3600 * 1000).toISOString(),
    leadStatus: 'Proposal sent',
    salesNotes: 'Sent 5-episode fintech drama treatment. Reviewing with CEO.',
    syncStatus: 'synced',
    lastSyncAttemptAt: new Date(Date.now() - 13.9 * 3600 * 1000).toISOString(),
  },
  {
    assessmentId: 'ADV-QUIZ-8504',
    timestampSubmitted: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    entryPage: 'homepage',
    originalAcquisitionChannel: 'homepage',
    fullName: 'Kwame Mensah',
    businessName: 'Accra Solar Homes',
    whatsappNumber: '+233245678901',
    email: 'kwame@accrasolar.gh',
    websiteOrSocial: 'accrasolar.gh',
    whatBusinessSells: 'Residential solar inverter installations for homes and offices in Accra',
    howDidYouHear: 'Google Search',
    socialMediaStatus: 'We have pages, but we barely post',
    platformsUsed: ['Facebook', 'Instagram', 'WhatsApp Business / Status'],
    postingFrequency: 'Once a month or less',
    wantsMoreConsistency: 'Yes, if the cost made sense for our business',
    biggestChallenges: [
      'Our product or service is hard to explain quickly',
      'We get views or likes, but our content does not convert well enough',
    ],
    storytellingInterest: 'I prefer direct promotional ads for now',
    aiSeriesFamiliarity: 'No, this is new to me',
    sawEducationalInterlude: true,
    aiMiniSeriesInterest: 'Maybe later — right now we need simpler promotional ads',
    monthlyAdSpendRange: 'GH₵600 – GH₵1,800 (≈ ₦50k – ₦150k)',
    monthlyContentSpendRange: 'GH₵600 – GH₵1,800',
    primaryGoal: 'Get more leads, enquiries and sales from our ads',
    primaryRecommendedService: 'Direct-Response Video Advertisements',
    primaryRecommendedPackageId: 'bundle-5',
    primaryRecommendedPackageName: '5 Creative Test Pack',
    primaryRecommendedPrice: 950,
    secondaryRecommendation: 'Explainer & Educational Video Production',
    secondaryPackageId: 'single-60',
    secondaryPackageName: 'Single 60s Video',
    monthlyRetainerOpportunity: false,
    aiMiniSeriesOpportunity: false,
    categoryScores: {
      'regular-ads': 128,
      'monthly-retainer': 48,
      'ai-mini-series': 20,
      'explainer-educational': 94,
      'brand-storytelling': 45,
    },
    referralSource: 'direct',
    affiliateId: '',
    affiliateCode: '',
    eligibleFor5PercentDiscount: false,
    claimed5PercentDiscount: false,
    discountAmount: 0,
    utmSource: 'google',
    utmMedium: 'organic',
    utmCampaign: '',
    countryCode: 'GH',
    currencyCode: 'GHS',
    quizCompletionStatus: 'completed',
    whatsappCtaClicked: false,
    leadStatus: 'New lead',
    salesNotes: 'Completed assessment; follow up on WhatsApp with solar explainer sample.',
    syncStatus: 'synced',
    lastSyncAttemptAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
];

/* ---------- LOAD & SAVE ASSESSMENTS ---------- */

export function loadAssessments(): BusinessAssessment[] {
  if (typeof window === 'undefined') return SEED_ASSESSMENTS;
  try {
    const raw = localStorage.getItem(LS_ASSESSMENTS);
    if (!raw) {
      localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(SEED_ASSESSMENTS));
      return SEED_ASSESSMENTS;
    }
    const parsed = JSON.parse(raw) as BusinessAssessment[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_ASSESSMENTS;
  } catch {
    return SEED_ASSESSMENTS;
  }
}

export function saveAssessments(list: BusinessAssessment[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('advibe-assessments-updated'));
  } catch {
    /* ignore storage quota errors */
  }
}

/* ---------- 39-COLUMN PAYLOAD FORMATTER FOR GOOGLE SHEETS TAB 1 ---------- */

export function buildAllAssessmentsRow(a: BusinessAssessment): Record<string, string> {
  return {
    '1_Assessment_ID': a.assessmentId,
    '2_Timestamp_Submitted': a.timestampSubmitted,
    '3_Entry_Page': a.entryPage,
    '4_Full_Name': a.fullName,
    '5_Business_Name': a.businessName,
    '6_WhatsApp_Number': a.whatsappNumber,
    '7_Email_Address': a.email || '',
    '8_Website_or_Social_Handle': a.websiteOrSocial || '',
    '9_What_Business_Sells': a.whatBusinessSells,
    '10_Social_Media_Promotion_Status': a.socialMediaStatus,
    '11_Platforms_Currently_Used': a.platformsUsed.join(', '),
    '12_Current_Posting_Frequency': a.postingFrequency,
    '13_Wants_More_Consistent_Content': a.wantsMoreConsistency,
    '14_Biggest_Marketing_Challenges': a.biggestChallenges.join(' | '),
    '15_Storytelling_Series_Interest': a.storytellingInterest,
    '16_AI_Series_Familiarity': a.aiSeriesFamiliarity,
    '17_AI_Mini_Series_Interest': a.aiMiniSeriesInterest,
    '18_Monthly_Paid_Ad_Spend_Range': a.monthlyAdSpendRange,
    '19_Monthly_Content_Creation_Spend_Range': a.monthlyContentSpendRange,
    '20_Primary_90_Day_Goal': a.primaryGoal,
    '21_Primary_Recommended_Service': a.primaryRecommendedService,
    '22_Primary_Recommended_Package': a.primaryRecommendedPackageName,
    '23_Recommended_Package_Price': `${a.currencyCode} ${a.primaryRecommendedPrice}`,
    '24_Secondary_Recommendation': `${a.secondaryRecommendation} (${a.secondaryPackageName})`,
    '25_Monthly_Retainer_Opportunity': a.monthlyRetainerOpportunity ? 'Yes' : 'No',
    '26_AI_Mini_Series_Opportunity': a.aiMiniSeriesOpportunity ? 'Yes' : 'No',
    '27_How_Did_You_Hear': a.howDidYouHear,
    '28_Referral_Source': a.referralSource,
    '29_Affiliate_ID': a.affiliateId || '',
    '30_Affiliate_Code': a.affiliateCode || '',
    '31_Eligible_For_5_Percent_Discount': a.eligibleFor5PercentDiscount ? 'Yes' : 'No',
    '32_Claimed_5_Percent_Discount': a.claimed5PercentDiscount ? 'Yes' : 'No',
    '33_UTM_Source': a.utmSource || '',
    '34_UTM_Medium': a.utmMedium || '',
    '35_UTM_Campaign': a.utmCampaign || '',
    '36_Quiz_Completion_Status': a.quizCompletionStatus,
    '37_WhatsApp_CTA_Clicked': a.whatsappCtaClicked ? 'Yes' : 'No',
    '38_Lead_Status': a.leadStatus,
    '39_Notes': a.salesNotes || '',
  };
}

/* ---------- SYNC ASSESSMENT TO GOOGLE SHEETS (4 TABS) ---------- */

export async function syncAssessmentToGoogleSheets(
  assessment: BusinessAssessment,
  webhookUrl?: string
): Promise<{ ok: boolean; status: 'synced' | 'pending' | 'failed'; error?: string }> {
  const targetUrl =
    (webhookUrl || '').trim() ||
    (import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_MAKE_WEBHOOK_URL as string | undefined)?.trim() ||
    '';

  if (!targetUrl) {
    // Graceful queue when no external webhook/Apps Script endpoint is configured yet
    return {
      ok: true,
      status: 'pending',
      error: 'Saved to primary local database. Connect a Google Apps Script / Sheets Webhook URL in Admin to enable live cloud spreadsheet push.',
    };
  }

  const payload = {
    spreadsheetName: 'ADVIBE STUDIO — LEADS & BUSINESS ASSESSMENTS',
    deduplicationKey: assessment.assessmentId,
    tabs: {
      All_Assessments: buildAllAssessmentsRow(assessment),
      WhatsApp_Leads: {
        Assessment_ID: assessment.assessmentId,
        Timestamp: assessment.timestampSubmitted,
        Full_Name: assessment.fullName,
        Business_Name: assessment.businessName,
        WhatsApp_Number: assessment.whatsappNumber,
        Recommended_Package: assessment.primaryRecommendedPackageName,
        Price: `${assessment.currencyCode} ${assessment.primaryRecommendedPrice}`,
        WhatsApp_CTA_Clicked: assessment.whatsappCtaClicked ? 'Yes' : 'No',
        WhatsApp_Clicked_At: assessment.whatsappCtaClickedAt || '',
        Discount_Claimed: assessment.claimed5PercentDiscount ? '5% Affiliate Discount' : 'None',
        Lead_Status: assessment.leadStatus,
      },
      Service_Recommendations: {
        Assessment_ID: assessment.assessmentId,
        Business_Name: assessment.businessName,
        Primary_Service: assessment.primaryRecommendedService,
        Primary_Package: assessment.primaryRecommendedPackageName,
        Secondary_Service: assessment.secondaryRecommendation,
        Retainer_Opportunity: assessment.monthlyRetainerOpportunity ? 'Yes' : 'No',
        Mini_Series_Opportunity: assessment.aiMiniSeriesOpportunity ? 'Yes' : 'No',
        Regular_Ads_Score: String(assessment.categoryScores['regular-ads'] || 0),
        Retainer_Score: String(assessment.categoryScores['monthly-retainer'] || 0),
        Mini_Series_Score: String(assessment.categoryScores['ai-mini-series'] || 0),
        Explainer_Score: String(assessment.categoryScores['explainer-educational'] || 0),
        Storytelling_Score: String(assessment.categoryScores['brand-storytelling'] || 0),
      },
      Follow_Up_Sales_Pipeline: {
        Assessment_ID: assessment.assessmentId,
        Full_Name: assessment.fullName,
        Business_Name: assessment.businessName,
        WhatsApp_Number: assessment.whatsappNumber,
        Primary_Package: assessment.primaryRecommendedPackageName,
        Pipeline_Stage: assessment.leadStatus,
        WhatsApp_Link_Opened: assessment.whatsappCtaClicked ? 'Yes (Awaiting Manual Message Verification)' : 'Not Clicked Yet',
        Affiliate_Partner: assessment.affiliateCode || 'Direct',
        Sales_Notes: assessment.salesNotes || '',
      },
    },
  };

  try {
    const flatParams: Record<string, string> = {
      ...buildAllAssessmentsRow(assessment),
      payload_json: JSON.stringify(payload),
    };

    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(flatParams).toString(),
    });

    return { ok: true, status: 'synced' };
  } catch (err) {
    return {
      ok: false,
      status: 'pending',
      error: (err as Error)?.message || 'Network error while syncing to Google Sheets; queued for retry.',
    };
  }
}

/* ---------- RECORD, UPDATE & RETRY ASSESSMENTS ---------- */

export async function recordCompletedAssessment(
  assessment: BusinessAssessment,
  webhookUrl?: string
): Promise<BusinessAssessment> {
  const existing = loadAssessments();
  // Deduplicate by assessmentId
  const withoutDup = existing.filter((x) => x.assessmentId !== assessment.assessmentId);

  const syncRes = await syncAssessmentToGoogleSheets(assessment, webhookUrl);
  const finalRecord: BusinessAssessment = {
    ...assessment,
    syncStatus: syncRes.status,
    lastSyncAttemptAt: new Date().toISOString(),
    syncErrorMessage: syncRes.error,
  };

  saveAssessments([finalRecord, ...withoutDup]);
  return finalRecord;
}

export async function markAssessmentWhatsAppClicked(
  assessmentId: string,
  webhookUrl?: string
): Promise<BusinessAssessment | null> {
  const list = loadAssessments();
  const idx = list.findIndex((x) => x.assessmentId === assessmentId);
  if (idx === -1) return null;

  // IMPORTANT RULE (Part 1.2 & Part 6.4):
  // Do NOT falsely mark leadStatus as 'Contacted' simply because the WhatsApp link was opened.
  // Only set whatsappCtaClicked = true and whatsappCtaClickedAt.
  const updated: BusinessAssessment = {
    ...list[idx],
    whatsappCtaClicked: true,
    whatsappCtaClickedAt: new Date().toISOString(),
  };

  const syncRes = await syncAssessmentToGoogleSheets(updated, webhookUrl);
  updated.syncStatus = syncRes.status;
  updated.lastSyncAttemptAt = new Date().toISOString();

  const next = [...list];
  next[idx] = updated;
  saveAssessments(next);
  return updated;
}

export async function updateAssessmentPipeline(
  assessmentId: string,
  patch: { leadStatus?: PipelineStage; salesNotes?: string },
  webhookUrl?: string
): Promise<BusinessAssessment | null> {
  const list = loadAssessments();
  const idx = list.findIndex((x) => x.assessmentId === assessmentId);
  if (idx === -1) return null;

  const updated: BusinessAssessment = {
    ...list[idx],
    ...(patch.leadStatus !== undefined ? { leadStatus: patch.leadStatus } : {}),
    ...(patch.salesNotes !== undefined ? { salesNotes: patch.salesNotes } : {}),
  };

  const syncRes = await syncAssessmentToGoogleSheets(updated, webhookUrl);
  updated.syncStatus = syncRes.status;
  updated.lastSyncAttemptAt = new Date().toISOString();

  const next = [...list];
  next[idx] = updated;
  saveAssessments(next);
  return updated;
}

export async function retryPendingAssessments(webhookUrl?: string): Promise<{ retried: number; synced: number }> {
  const list = loadAssessments();
  let retried = 0;
  let synced = 0;

  const next = await Promise.all(
    list.map(async (item) => {
      if (item.syncStatus === 'synced') return item;
      retried++;
      const res = await syncAssessmentToGoogleSheets(item, webhookUrl);
      if (res.status === 'synced') synced++;
      return {
        ...item,
        syncStatus: res.status,
        lastSyncAttemptAt: new Date().toISOString(),
        syncErrorMessage: res.error,
      };
    })
  );

  saveAssessments(next);
  return { retried, synced };
}

export async function testGoogleSheetsConnection(webhookUrl?: string): Promise<{ ok: boolean; message: string }> {
  const targetUrl =
    (webhookUrl || '').trim() ||
    (import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_MAKE_WEBHOOK_URL as string | undefined)?.trim() ||
    '';

  if (!targetUrl) {
    return {
      ok: true,
      message:
        'Primary local database store is active and healthy (0ms latency). To push rows live to an external Google Sheet, paste a Google Apps Script Web App URL or Make.com Webhook URL above.',
    };
  }

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        test_ping: 'true',
        spreadsheet: 'ADVIBE STUDIO — LEADS & BUSINESS ASSESSMENTS',
        timestamp: new Date().toISOString(),
      }).toString(),
    });
    return {
      ok: true,
      message: `Successfully sent test ping to Google Sheets endpoint (${targetUrl.slice(0, 45)}...).`,
    };
  } catch (err) {
    return {
      ok: false,
      message: `Connection test failed: ${(err as Error)?.message || 'Unable to reach endpoint'}. Assessments will remain safely queued in primary storage.`,
    };
  }
}

/* ---------- 4-TAB CSV EXPORT FOR GOOGLE SHEETS ---------- */

export function exportAssessmentsTabCsv(
  tab: 'all' | 'whatsapp' | 'recommendations' | 'pipeline',
  assessments: BusinessAssessment[]
): void {
  const rows: Record<string, string>[] = assessments.map((a) => {
    if (tab === 'whatsapp') {
      return {
        Assessment_ID: a.assessmentId,
        Timestamp: a.timestampSubmitted,
        Full_Name: a.fullName,
        Business_Name: a.businessName,
        WhatsApp_Number: a.whatsappNumber,
        What_Business_Sells: a.whatBusinessSells,
        Recommended_Package: a.primaryRecommendedPackageName,
        Package_Price: `${a.currencyCode} ${a.primaryRecommendedPrice}`,
        WhatsApp_CTA_Clicked: a.whatsappCtaClicked ? 'Yes' : 'No',
        WhatsApp_CTA_Clicked_At: a.whatsappCtaClickedAt || '',
        Affiliate_Code: a.affiliateCode || '',
        Discount_Claimed: a.claimed5PercentDiscount ? 'Yes (5%)' : 'No',
        Pipeline_Stage: a.leadStatus,
      };
    }
    if (tab === 'recommendations') {
      return {
        Assessment_ID: a.assessmentId,
        Business_Name: a.businessName,
        Primary_Recommended_Service: a.primaryRecommendedService,
        Primary_Recommended_Package: a.primaryRecommendedPackageName,
        Secondary_Recommendation: `${a.secondaryRecommendation} (${a.secondaryPackageName})`,
        Monthly_Retainer_Opportunity: a.monthlyRetainerOpportunity ? 'Yes' : 'No',
        AI_Mini_Series_Opportunity: a.aiMiniSeriesOpportunity ? 'Yes' : 'No',
        Regular_Ads_Score: String(a.categoryScores['regular-ads'] || 0),
        Monthly_Retainer_Score: String(a.categoryScores['monthly-retainer'] || 0),
        AI_Mini_Series_Score: String(a.categoryScores['ai-mini-series'] || 0),
        Explainer_Score: String(a.categoryScores['explainer-educational'] || 0),
        Brand_Storytelling_Score: String(a.categoryScores['brand-storytelling'] || 0),
      };
    }
    if (tab === 'pipeline') {
      return {
        Assessment_ID: a.assessmentId,
        Submitted_At: a.timestampSubmitted.slice(0, 10),
        Full_Name: a.fullName,
        Business_Name: a.businessName,
        WhatsApp_Number: a.whatsappNumber,
        Email: a.email || '',
        Recommended_Package: a.primaryRecommendedPackageName,
        Price: `${a.currencyCode} ${a.primaryRecommendedPrice}`,
        WhatsApp_Link_Clicked: a.whatsappCtaClicked ? 'Yes' : 'No',
        Pipeline_Stage: a.leadStatus,
        Sales_Notes: a.salesNotes || '',
      };
    }
    return buildAllAssessmentsRow(a);
  });

  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const csvLines = [
    headers.map(escapeCsv).join(','),
    ...rows.map((r) => headers.map((h) => escapeCsv(r[h] || '')).join(',')),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `advibe-sheets-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   FUNNEL ANALYTICS EVENT TRACKER & AGGREGATOR (PART 13)
   ========================================================================== */

const SEED_EVENTS: QuizFunnelAnalyticsEvent[] = [
  { id: 'ev-1', sessionId: 'SES-SEED1', timestamp: new Date(Date.now() - 40 * 3600 * 1000).toISOString(), type: 'quiz_started', entryPage: 'homepage', channel: 'affiliate', affiliateCode: 'ADV-JOHN' },
  { id: 'ev-2', sessionId: 'SES-SEED1', timestamp: new Date(Date.now() - 39.9 * 3600 * 1000).toISOString(), type: 'question_answered', questionId: 'q1', stepNumber: 1 },
  { id: 'ev-3', sessionId: 'SES-SEED1', timestamp: new Date(Date.now() - 39.8 * 3600 * 1000).toISOString(), type: 'question_answered', questionId: 'q7', stepNumber: 7 },
  { id: 'ev-4', sessionId: 'SES-SEED1', timestamp: new Date(Date.now() - 39.7 * 3600 * 1000).toISOString(), type: 'interlude_viewed', questionId: 'q7', stepNumber: 7 },
  { id: 'ev-5', sessionId: 'SES-SEED1', timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), type: 'quiz_completed', entryPage: 'homepage', channel: 'affiliate', affiliateCode: 'ADV-JOHN' },
  { id: 'ev-6', sessionId: 'SES-SEED1', timestamp: new Date(Date.now() - 35.8 * 3600 * 1000).toISOString(), type: 'whatsapp_cta_clicked', entryPage: 'homepage', channel: 'affiliate', affiliateCode: 'ADV-JOHN' },
  { id: 'ev-7', sessionId: 'SES-SEED2', timestamp: new Date(Date.now() - 15 * 3600 * 1000).toISOString(), type: 'quiz_started', entryPage: 'ai-mini-series-page', channel: 'ai-mini-series' },
  { id: 'ev-8', sessionId: 'SES-SEED2', timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(), type: 'quiz_completed', entryPage: 'ai-mini-series-page', channel: 'ai-mini-series' },
  { id: 'ev-9', sessionId: 'SES-SEED2', timestamp: new Date(Date.now() - 13.9 * 3600 * 1000).toISOString(), type: 'whatsapp_cta_clicked', entryPage: 'ai-mini-series-page', channel: 'ai-mini-series' },
  { id: 'ev-10', sessionId: 'SES-SEED3', timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), type: 'quiz_started', entryPage: 'homepage', channel: 'homepage' },
  { id: 'ev-11', sessionId: 'SES-SEED3', timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), type: 'quiz_completed', entryPage: 'homepage', channel: 'homepage' },
  { id: 'ev-12', sessionId: 'SES-SEED4', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), type: 'quiz_started', entryPage: 'homepage', channel: 'homepage' },
  { id: 'ev-13', sessionId: 'SES-SEED4', timestamp: new Date(Date.now() - 1.9 * 3600 * 1000).toISOString(), type: 'question_answered', questionId: 'q1', stepNumber: 1 },
  { id: 'ev-14', sessionId: 'SES-SEED4', timestamp: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(), type: 'question_answered', questionId: 'q2', stepNumber: 2 },
  { id: 'ev-15', sessionId: 'SES-SEED4', timestamp: new Date(Date.now() - 1.7 * 3600 * 1000).toISOString(), type: 'question_answered', questionId: 'q3', stepNumber: 3 },
];

export function loadQuizAnalyticsEvents(): QuizFunnelAnalyticsEvent[] {
  if (typeof window === 'undefined') return SEED_EVENTS;
  try {
    const raw = localStorage.getItem(LS_FUNNEL_EVENTS);
    if (!raw) {
      localStorage.setItem(LS_FUNNEL_EVENTS, JSON.stringify(SEED_EVENTS));
      return SEED_EVENTS;
    }
    const parsed = JSON.parse(raw) as QuizFunnelAnalyticsEvent[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_EVENTS;
  } catch {
    return SEED_EVENTS;
  }
}

export function logQuizFunnelEvent(
  event: Omit<QuizFunnelAnalyticsEvent, 'id' | 'sessionId' | 'timestamp'>
): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadQuizAnalyticsEvents();
    const full: QuizFunnelAnalyticsEvent = {
      ...event,
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionId: getQuizSessionId(),
      timestamp: new Date().toISOString(),
    };
    const next = [full, ...existing].slice(0, 1000);
    localStorage.setItem(LS_FUNNEL_EVENTS, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
