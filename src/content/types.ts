export interface PortfolioItem {
  id: string;
  title: string;
  client: string;
  category: string;
  youtubeId: string;
  orientation: 'vertical' | 'landscape';
  result?: string;
  featured: boolean;
  visible: boolean;
  order: number;
}

export interface Offer {
  id: string;
  name: string;
  goal: 'one' | 'test' | 'monthly';
  duration: string;
  quantity: number;
  price: number;
  unitNote: string;
  description: string;
  whoFor: string;
  features: string[];
  included: string[];
  goodToKnow: string[];
  badge?: string;
  cta: string;
  featured: boolean;
  active: boolean;
  order: number;
}

export interface Campaign {
  id: string;
  name: string;
  eventDate: string; // ISO
  orderBy: string; // ISO
  bannerText: string;
  active: boolean;
  /** Country codes this event is shown in (e.g. ['NG','GH']). Empty/missing = every country. */
  countries?: string[];
}

/** One market you sell to. Each has its own prices, currency, payment details and web link. */
export interface Country {
  code: string;              // 'NG', 'GH', 'KE', 'US', 'UK'
  slug: string;              // used in the ad link: https://yoursite/#/gh
  name: string;
  flag: string;              // emoji flag
  currency: string;          // 'NGN', 'GHS', 'KES', 'USD', 'GBP'
  symbol: string;            // '₦', 'GH₵', 'KSh', '$', '£'
  active: boolean;           // switch a whole country on/off
  /** Price of each package in this country's currency, keyed by offer id. Missing = package hidden here. */
  prices: Record<string, number>;
  whatsappNumber: string;    // blank = use the main number from Settings
  paymentInstructions: string; // blank = use the main text from Settings
  pixelId: string;           // blank = use the main Meta Pixel from Settings
  /** Typical cost of ONE traditionally-produced video ad in this country's currency (used by the cost-comparison card). 0 = unknown. */
  tradLow: number;
  tradHigh: number;
}

export type SectionKey =
  | 'wall' | 'proof' | 'showcase' | 'clients' | 'problem' | 'services'
  | 'events' | 'whyUs' | 'process' | 'testimonials' | 'faq' | 'finalCta' | 'liveToasts' | 'aiCompare';

export interface ClientCaseStudy {
  title: string;
  subtitle: string;
  challenge: string;
  approach: string;
  process: string[];
  deliverables: string[];
  metrics: { value: string; label: string }[];
  learnings: string;
  ctaText?: string;
}

export interface FeaturedClient {
  name: string;              // short display name, e.g. CirclesFundMe
  legalName: string;         // full registered name
  sector: string;            // e.g. Fintech
  logo: string;              // full logo image (path inside the site, or a web address)
  mark: string;              // small square icon for badges
  badge: string;             // e.g. Repeat client
  heading: string;
  body: string;
  points: string[];
  /** Portfolio videos whose "Client" field contains this text are shown inside the spotlight. */
  matchName: string;
  caseStudy?: ClientCaseStudy;
  clientApprovedPublic?: boolean; // Gate for public mention of metrics/screenshots until confirmed
}

export interface TestimonialMetricPair {
  label: string;
  before: string;
  after: string;
  improvement?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  business: string;
  industry: string;
  quote: string;
  featured: boolean;
  visible: boolean;
  packageUsed?: string;
  roiHeadline?: string;
  roiMultiplier?: string;
  timeframe?: string;
  beforeSummary?: string;
  afterSummary?: string;
  metricComparisons?: TestimonialMetricPair[];
  highlightStats?: { value: string; label: string }[];
}

export interface Faq { id: string; q: string; a: string; visible: boolean; }

export interface CommercialOfferCategory {
  title: string;
  desc: string;
}

export interface CommercialOfferProcessStep {
  step: number;
  title: string;
  desc: string;
}

export interface CommercialOfferPage {
  id: 'monthly-content' | 'promotional-mini-series';
  slug: string;
  name: string;
  shortLabel: string;
  tagline: string;
  active: boolean;
  showOnHomepage: boolean;
  price: number; // default 200000 NGN
  monthlyVideoQuantity: number; // default 15
  pricesByCountry?: Record<string, number>;
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    contextNote: string;
    vslYoutubeId?: string;
  };
  problem: {
    heading: string;
    paragraphs: string[];
    highlight?: string;
  };
  amplify: {
    heading: string;
    paragraphs: string[];
    callout?: string;
  };
  solution: {
    heading: string;
    paragraphs: string[];
    worldExamples?: { title: string; desc: string }[];
  };
  valueComparison?: {
    heading: string;
    paragraphs: string[];
    includedList: string[];
    conclusion: string;
  };
  whatWeCreate: {
    heading: string;
    intro: string;
    categories: CommercialOfferCategory[];
    conclusion?: string;
  };
  process: {
    heading: string;
    intro?: string;
    steps: CommercialOfferProcessStep[];
    briefMockupSample?: {
      title: string;
      brand: string;
      objective: string;
      audience: string;
      hookAngle: string;
      visualDirection: string;
      soundStyle: string;
      callToAction: string;
    };
  };
  revisionPolicy: {
    heading: string;
    body: string;
    notes: string[];
  };
  ownership: {
    heading: string;
    paragraphs: string[];
    clarification: string;
  };
  circlesFundMeProof: {
    heading: string;
    body: string;
    ctaText: string;
    featuredVideoIds?: string[];
  };
  offerSummary: {
    heading: string;
    packageTitle: string;
    inclusions: string[];
    disclaimer: string;
    primaryCta: string;
    secondaryCta: string;
  };
  faqs: Faq[];
  finalCta: {
    heading: string;
    paragraphs: string[];
    primaryCta: string;
    secondaryCta: string;
    note: string;
  };
  seo: {
    title: string;
    description: string;
  };
  bookingUrlOverride?: string;
}

export interface SiteContent {
  brand: { name: string; logoText: string; tagline: string };
  settings: {
    whatsappNumber: string;
    whatsappDisplay: string;
    whatsappMessage: string;
    email: string;
    pixelId: string;
    paymentInstructions: string;
    deliveryDays: number;
    bookingUrl?: string;
  };
  countries: Country[];
  defaultCountry: string;    // country code shown when a visitor arrives on the plain link
  sections: Record<SectionKey, boolean>;
  client: FeaturedClient;
  commercialOffers?: Record<string, CommercialOfferPage>;
  /** The "What AI replaces" cost card under the packages, and the link to the full breakdown page. */
  aiCompare: { title: string; tradLabel: string; aiLabel: string; body: string; linkText: string };
  popups: {
    delaySeconds: number;
    gapSeconds: number;
    maxPerVisit: number;
    withinHours: number;
    types?: { orders: boolean; enquiries: boolean; bookings: boolean };
    pages?: { home: boolean; sales: boolean };
    ownProgress?: boolean;
    reassurance?: boolean;
    reassuranceMessages?: string[];
  };
  banner: { enabled: boolean; campaignId: string };
  hero: {
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    stats: { value: string; label: string }[];
  };
  problem: { heading: string; lines: string[]; transition: string };
  services: { id: string; title: string; description: string }[];
  events: {
    heading: string; subheading: string; body: string; cta: string;
    /** Pull public holidays automatically from a free calendar API (Nager.Date). */
    auto: boolean;
    /** Add built-in shopping dates (Black Friday, Cyber Monday, Valentine's, Mother's/Father's Day …). */
    builtin: boolean;
    maxItems: number;      // how many upcoming events to show
    windowDays: number;    // only look this many days ahead
    leadDays: number;      // "order by" = event date minus this many days
    hide: string;          // comma-separated words; events containing any of them are not shown
  };
  campaigns: Campaign[];
  portfolio: PortfolioItem[];
  categories: string[];
  pricing: {
    heading: string;
    subheading: string;
    goals: { id: 'one' | 'test' | 'monthly'; label: string; blurb: string }[];
  };
  offers: Offer[];
  whyUs: { heading: string; statement: string; points: string[] };
  process: { heading: string; steps: { title: string; description: string }[] };
  testimonials: Testimonial[];
  faqs: Faq[];
  aiNote: { title: string; body: string };
  finalCta: { heading: string; subheading: string; primaryCta: string };
  /** The two sales pages (#/monthly-content and #/promotional-mini-series) and their shared settings. */
  salesPages?: SalesPages;
  /** Referral-based 5% discount settings and affiliate partner directory */
  referralSettings?: ReferralDiscountSettings;
  affiliates?: AffiliatePartner[];
  /** Service Discovery Quiz, Weighted Recommendation Engine & Google Sheets Config */
  quizConfig?: QuizConfig;
}

export interface ReferralDiscountSettings {
  enabled: boolean;
  discountPercent: number; // default: 5
  attributionWindowDays: number; // default: 30 days
  firstTimeOnly: boolean; // default: true
  eligibleServices: string[]; // e.g. ['strategy', 'monthly-content', 'promotional-mini-series', 'bundle-5']
  promotionExpiry?: string | null; // ISO date or null for ongoing
  minPurchaseValue: number; // minimum eligible purchase value
}

export interface AffiliatePartner {
  id: string;
  code: string; // e.g. 'ADV-JOHN'
  name: string;
  email: string;
  whatsapp: string;
  status: 'active' | 'deactivated';
  approved: boolean;
  commissionPercent: number; // default: 10
  createdAt: string;
  totalReferrals?: number;
  totalRevenue?: number;
  clicks?: number; // referral link visits / usage
}

/* ---------- SALES PAGES & OFFERS ---------- */
export interface SalesBlock { heading: string; paragraphs: string[]; closing?: string[] }
export interface SalesItem { title: string; description: string }
export interface SalesStep { title: string; description: string; tag?: string }
export interface SalesFaq { id: string; q: string; a: string; visible: boolean }
export interface SalesSeed { label: string; tag: string; text: string }

export interface SalesOffer {
  /** Stable id. Saved on every lead and checked by the database against the saved offer. */
  id: string;
  /** The address: #/<slug> */
  slug: string;
  /** Decides the art direction of the page. */
  kind: 'retainer' | 'miniseries';
  active: boolean;
  showOnHome: boolean;
  name: string;
  shortLabel: string;
  /** Price in the base country's currency (Settings → base country). THE single source of truth for price. */
  price: number;
  /** Optional price in another country's currency, keyed by country code. Missing = the base price is shown. */
  countryPrices?: Record<string, number>;
  period: string;
  /** THE single source of truth for videos per month. */
  quantity: number;
  seoTitle?: string;
  seoDescription?: string;
  /** Optional: overrides the shared booking link for this offer. */
  bookingUrl?: string;
  homeCard: { blurb: string; cta: string };
  hero?: { eyebrow?: string; headline?: string; body?: string[]; tagline?: string; ctaPrimary?: string; ctaSecondary?: string; formNote?: string };
  problem?: SalesBlock & { lines?: string[] };
  amplify?: SalesBlock;
  solution?: SalesBlock & { seeds?: SalesSeed[]; seedsNote?: string; roles?: string[] };
  value?: SalesBlock & {
    listIntro?: string; bullets?: string[];
    compare?: { oneLabel?: string; oneCaption?: string; oneRoles?: string[]; studioLabel?: string; studioCaption?: string };
  };
  features?: { heading?: string; intro?: string; items?: SalesItem[]; outro?: string };
  process?: { heading?: string; flowTitle?: string; flow?: string[]; steps?: SalesStep[]; briefLabel?: string; briefCaption?: string };
  revision?: { title?: string; body?: string; note?: string };
  ownership?: SalesBlock & { note?: string };
  proof?: { heading?: string; body?: string; cta?: string };
  offer?: { heading?: string; included?: string[]; fineprint?: string; disclaimer?: string; ctaPrimary?: string; ctaSecondary?: string };
  faqs?: SalesFaq[];
  finalCta?: { heading?: string; paragraphs?: string[]; ctaPrimary?: string; ctaSecondary?: string; formNote?: string };
}

export interface SalesPages {
  home: { enabled: boolean; eyebrow: string; heading: string; body: string };
  settings: {
    /** The scheduler link shown AFTER a lead is saved. Blank = no booking button. May contain {name} {email} {offer} {ref}. */
    bookingUrl: string;
    /** Country code whose currency the base prices are written in. */
    baseCountry: string;
    whatsappTemplate: string;
    consentText: string;
    publicDisplayLabel: string;
    currencyNote: string;
    labels?: {
      modalKicker?: string;
      modalTitle?: string;
      submit?: string;
      saving?: string;
      savedTitle?: string;
      whatsapp?: string;
      book?: string;
      bookClicked?: string;
      noBooking?: string;
    };
    uiText?: Record<string, string>;
  };
  proof?: { videoIds: string[]; showLogo: boolean; emptyNote: string; modalTitle: string };
  offers: SalesOffer[];
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  ref: string;
  date: string;
  name: string;
  business: string;
  whatsapp: string;
  email: string;
  offerId: string;
  offerName: string;
  price: number;
  industry: string;
  product: string;
  event: string;
  notes: string;
  status: LeadStatus;
  paymentStatus: 'Unpaid' | 'Deposit' | 'Paid';
  utmSource?: string;
  country: string;      // country code, e.g. 'GH'
  currency: string;     // currency code the price is in, e.g. 'GHS'
  source: string;       // 'website' or where a manually-entered order came from
  showPublic: boolean;  // customer agreed to appear in the "just started" pop-up
  /** Sales-page leads only */
  goal?: string;
  pageRoute?: string;
  bookingClickedAt?: string;
  bookingConfirmedAt?: string;
  /** Referral & Affiliate Tracking */
  referralCode?: string;
  affiliateId?: string;
  referralSource?: string; // 'affiliate_link' | 'manual_code' | 'none'
  discountClaimed?: boolean;
  discountPercent?: number;
  discountAmount?: number;
  howDidYouHear?: string;
  manualReferralCode?: string;
  isFirstTimeCustomer?: boolean;
  /** Quiz Assessment & WhatsApp Funnel Tracking */
  assessmentId?: string;
  whatsappCtaClicked?: boolean;
  whatsappCtaClickedAt?: string;
  pipelineStage?: PipelineStage;
  salesNotes?: string;
  secondaryRecommendation?: string;
  retainerOpportunity?: boolean;
  miniSeriesOpportunity?: boolean;
  entryPoint?: string;
  /** Google Sheets hand-in-hand sync tracking */
  sheetsSynced?: boolean;
  sheetsSyncedAt?: string;
}

export type ProjectStatus =
  | 'Briefing' | 'In production' | 'Review' | 'Revision' | 'Delivered' | 'Closed';

export interface Project {
  id: string;
  ref: string;
  client: string;
  contact: string;
  whatsapp: string;
  packageName: string;
  videosTotal: number;
  videosDone: number;
  status: ProjectStatus;
  payment: 'Unpaid' | 'Deposit' | 'Paid';
  startedUnpaid: boolean;
  approvedBy?: string;
  deadline: string; // ISO
  assigned: string;
}

export interface AuditEntry { id: string; at: string; user: string; action: string }

export interface SessionUser {
  email: string;
  name: string;
  role: 'owner' | 'ops';
  authMethod?: 'google' | 'password';
  photoURL?: string;
}

export interface AdminAccount {
  id: string; // lowercase email key
  email: string;
  name: string;
  role: 'owner' | 'ops'; // 'owner' = Super Admin, 'ops' = Regular Admin
  backupPassword?: string;
  addedBy?: string;
  createdAt: string;
  active: boolean;
  isPrimaryOwner?: boolean;
}

/* ---------- TRAINING PROGRAM TYPES ---------- */

export interface TrainingSession {
  day: number;
  label: string; // e.g. "DAY 1"
  week: 1 | 2;
  title: string;
  focus: string;
  outcome: string;
  whatYouLearn: string[];
  toolsAndSkills: string[];
  practicalExercise: string;
}

export interface TrainingPillar {
  number: string; // e.g. "01"
  title: string;
  description: string;
  topics: string[];
}

export interface TrainingBonus {
  id: string;
  number: string;
  title: string;
  description: string;
  badge?: string;
  isAvailableNow: boolean;
}

export interface TrainingInstructor {
  id: string;
  name: string;
  role: string;
  headline: string;
  bio: string[];
  keyWins: string[];
  philosophy: string;
  image: string;
}

export interface TrainingProofItem {
  id: string;
  title: string;
  metric: string;
  client: string;
  description: string;
  image?: string;
  verified: boolean;
}

export interface TrainingCohort {
  id: string;
  cohortNumber: number;
  name: string;
  tagline: string;
  status: 'upcoming' | 'open' | 'almost_full' | 'final_seats' | 'full' | 'paused' | 'ended';
  startDate: string;
  endDate: string;
  enrollmentDeadline: string; // ISO
  scheduleDays: string;
  sessionCount: number;
  durationWeeks: number;
  seatCapacity: number;
  almostFullThreshold: number;
  prices: Record<string, { founding: number; regular: number }>;
  paymentUrl: string;
  whatsappContact: string;
  sessions: TrainingSession[];
  pillars: TrainingPillar[];
  bonuses: TrainingBonus[];
  instructors: TrainingInstructor[];
  proofItems: TrainingProofItem[];
  faqs: Faq[];
  isCurrent: boolean;
  createdAt: string;
}

export interface TrainingStudent {
  id: string;
  ref: string;
  cohortId: string;
  name: string;
  email: string;
  whatsapp: string;
  country: string;
  track: 'business' | 'creators';
  businessName?: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  goal: string;
  status: 'registered' | 'payment_pending' | 'paid' | 'confirmed';
  price: number;
  currency: string;
  date: string;
  paymentMethod?: string;
  notes?: string;
  sheetsSynced?: boolean;
  sheetsSyncedAt?: string;
}

/* ---------- INTERACTIVE SERVICE DISCOVERY QUIZ & FUNNEL TYPES ---------- */

export type ServiceCategoryKey =
  | 'regular-ads'
  | 'monthly-retainer'
  | 'ai-mini-series'
  | 'explainer-educational'
  | 'brand-storytelling';

export type PipelineStage =
  | 'New lead'
  | 'Contacted'
  | 'Conversation ongoing'
  | 'Consultation/discovery completed'
  | 'Proposal sent'
  | 'Awaiting payment'
  | 'Won'
  | 'Lost'
  | 'Follow-up required';

export interface QuizOption {
  id: string;
  label: string;
  description?: string;
  /** Optional score boosts per service category when this option is selected */
  weights?: Partial<Record<ServiceCategoryKey, number>>;
  /** Optional branching flag (e.g. triggers educational interlude or skips active-only questions) */
  triggersInterlude?: boolean;
  disqualifiesCategory?: ServiceCategoryKey;
}

export interface QuizQuestion {
  id: string; // 'q1' .. 'q12'
  stepNumber: number;
  title: string;
  subtitle?: string;
  type: 'single' | 'multi' | 'contact';
  maxSelections?: number;
  required: boolean;
  enabled: boolean;
  options: QuizOption[];
  /** Optional branching note shown in Admin */
  branchingRuleNote?: string;
}

export interface RecommendationConfig {
  /** Base multipliers for each service category (default 1.0) */
  categoryMultipliers: Record<ServiceCategoryKey, number>;
  /** Minimum score threshold to trigger Monthly Retainer opportunity */
  retainerThreshold: number;
  /** Minimum score threshold to trigger AI Mini-Series opportunity */
  miniSeriesThreshold: number;
  /** High budget threshold multiplier */
  highBudgetBoost: number;
  /** Customisable explanation templates per category */
  explanations: Record<ServiceCategoryKey, string>;
}

export interface QuizConfig {
  enabled: boolean;
  introHeading: string;
  introCopy: string;
  introCta: string;
  introReassurance: string;
  questions: QuizQuestion[];
  recommendation: RecommendationConfig;
  whatsappTemplate: string;
  googleSheetsWebhookUrl: string;
  spreadsheetName: string;
}

/**
 * Full 39-column Business Assessment record saved to primary store/database
 * and synced to Google Sheets ("ADVIBE STUDIO — LEADS & BUSINESS ASSESSMENTS").
 */
export interface BusinessAssessment {
  // 1-3: Metadata
  assessmentId: string;
  timestampSubmitted: string; // ISO
  entryPage: string; // homepage, service-page, package-page, popup, monthly-retainer, affiliate
  entryContextOfferId?: string;
  entryContextOfferName?: string;
  originalAcquisitionChannel: string; // 'monthly-retainer' | 'affiliate' | 'direct' | 'product-page'

  // 4-9: Contact & Business Details (Q12)
  fullName: string;
  businessName: string;
  whatsappNumber: string;
  email: string;
  websiteOrSocial: string;
  whatBusinessSells: string;
  howDidYouHear: string;

  // 10-20: Quiz Answers (Q1 - Q11)
  socialMediaStatus: string; // Q1
  platformsUsed: string[]; // Q2
  postingFrequency: string; // Q3
  wantsMoreConsistency: string; // Q4
  biggestChallenges: string[]; // Q5 (up to 2)
  storytellingInterest: string; // Q6
  aiSeriesFamiliarity: string; // Q7
  sawEducationalInterlude: boolean;
  aiMiniSeriesInterest: string; // Q8
  monthlyAdSpendRange: string; // Q9
  monthlyContentSpendRange: string; // Q10
  primaryGoal: string; // Q11

  // 21-26: Recommendation Engine Outputs
  primaryRecommendedService: string;
  primaryRecommendedPackageId: string;
  primaryRecommendedPackageName: string;
  primaryRecommendedPrice: number;
  secondaryRecommendation: string;
  secondaryPackageId: string;
  secondaryPackageName: string;
  monthlyRetainerOpportunity: boolean;
  aiMiniSeriesOpportunity: boolean;
  categoryScores: Record<ServiceCategoryKey, number>;

  // 27-32: Affiliate & 5% Discount Attribution
  referralSource: string;
  affiliateId: string;
  affiliateCode: string;
  eligibleFor5PercentDiscount: boolean;
  claimed5PercentDiscount: boolean;
  discountAmount: number;

  // 33-35: UTM & Campaign Attribution
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  countryCode: string;
  currencyCode: string;

  // 36-39: Conversion & Pipeline Status
  quizCompletionStatus: 'completed' | 'abandoned';
  whatsappCtaClicked: boolean;
  whatsappCtaClickedAt?: string;
  leadStatus: PipelineStage;
  salesNotes: string;

  // Sync tracking
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncAttemptAt?: string;
  syncErrorMessage?: string;
}

export interface QuizFunnelAnalyticsEvent {
  id: string;
  sessionId: string;
  timestamp: string;
  type:
    | 'quiz_opened'
    | 'quiz_started'
    | 'question_answered'
    | 'interlude_viewed'
    | 'quiz_completed'
    | 'results_viewed'
    | 'package_explored'
    | 'whatsapp_cta_clicked';
  questionId?: string;
  stepNumber?: number;
  entryPage?: string;
  channel?: string;
  affiliateCode?: string;
  metadata?: Record<string, unknown>;
}

