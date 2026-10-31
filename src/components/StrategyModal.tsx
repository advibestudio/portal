import { useEffect, useMemo, useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Check,
  Film,
  Video,
  Play,
  TrendingUp,
  Layers,
  Award,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Calculator,
  Users,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmtMoney, getParam } from '@/lib/money';
import { useCountry } from '@/lib/country';
import { track } from '@/lib/tracking';
import type { BusinessAssessment, PortfolioItem } from '@/content/types';
import { useReferralStore } from '@/lib/referralStore';
import { DiscountEligibilityModule } from '@/components/referral/DiscountEligibilityModule';
import { HOW_HEARD_OPTIONS } from '@/lib/referral';
import {
  calculateContentOpportunity,
  calculateRecommendations,
  captureInitialChannel,
  defaultQuizConfig,
  defaultQuizQuestions,
  detectEntryPoint,
  getLocalizedOptionLabel,
  getOriginalAcquisitionChannel,
  buildAssessmentWhatsAppUrl,
  resolveCataloguePackages,
  type QuizAnswersMap,
} from '@/lib/quizEngine';
import {
  logQuizFunnelEvent,
  markAssessmentWhatsAppClicked,
  recordCompletedAssessment,
} from '@/lib/googleSheetsSync';

export interface StrategyModalProps {
  onClose: () => void;
  offerId?: string;
  offerTitle?: string;
  configuredPrice?: number;
  configuredQty?: number;
  bookingUrl?: string;
}

const SESSION_PROGRESS_KEY = 'advibe.quiz.progress.v1';

interface SavedQuizProgress {
  stage: 'intro' | 'question' | 'interlude' | 'direct';
  qIndex: number;
  answers: QuizAnswersMap;
  contact: {
    fullName: string;
    businessName: string;
    whatsapp: string;
    whatBusinessSells: string;
    websiteOrSocial: string;
    email: string;
    howDidYouHear: string;
    manualReferralCode: string;
  };
}

const EMPTY_ANSWERS: QuizAnswersMap = {
  q1: '',
  q2: [],
  q3: '',
  q4: '',
  q5: [],
  q6: '',
  q7: '',
  sawEducationalInterlude: false,
  q8: '',
  q9: '',
  q10: '',
  q11: '',
};

/**
 * INTERACTIVE SERVICE DISCOVERY QUIZ & WHATSAPP LEAD GENERATION SYSTEM
 * --------------------------------------------------------------------
 * Replaces the old traditional form & calendar-vs-WhatsApp modal with an
 * intelligent 12-question business assessment, AI Mini-Series educational
 * interlude, weighted recommendation engine, personalised results page,
 * content opportunity calculator, and prefilled WhatsApp conversion handoff.
 */
export function StrategyModal({
  onClose,
  offerId = 'strategy',
  offerTitle,
}: StrategyModalProps) {
  const { content, addLead, updateLead } = useStore();
  const { country, countries, setCountry } = useCountry();

  const {
    attribution,
    claimDiscount,
    setClaimDiscount,
    checkEligibility,
    applyReferralCode,
    discountPercent,
  } = useReferralStore();

  const quizConfig = content.quizConfig || defaultQuizConfig;
  const activeQuestions = useMemo(
    () =>
      (quizConfig.questions?.length ? quizConfig.questions : defaultQuizQuestions)
        .filter((q) => q.enabled !== false)
        .map((q) =>
          q.id === 'q5'
            ? {
                ...q,
                subtitle:
                  !q.subtitle || q.subtitle.includes('Select 1 or 2')
                    ? 'Select all that apply.'
                    : q.subtitle,
                maxSelections: undefined,
              }
            : q
        ),
    [quizConfig.questions]
  );

  // Capture initial channel & entry point
  const originalChannel = useMemo(() => captureInitialChannel(), []);
  const entryPage = useMemo(() => detectEntryPoint(offerId), [offerId]);

  // Restore saved progress from sessionStorage if present
  const initialProgress = useMemo<SavedQuizProgress | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_PROGRESS_KEY);
      return raw ? (JSON.parse(raw) as SavedQuizProgress) : null;
    } catch {
      return null;
    }
  }, []);

  const [stage, setStage] = useState<'intro' | 'question' | 'interlude' | 'direct' | 'results'>(
    initialProgress?.stage || 'intro'
  );
  const [qIndex, setQIndex] = useState<number>(initialProgress?.qIndex || 0);
  const [answers, setAnswers] = useState<QuizAnswersMap>(initialProgress?.answers || EMPTY_ANSWERS);
  const [contact, setContact] = useState({
    fullName: initialProgress?.contact?.fullName || '',
    businessName: initialProgress?.contact?.businessName || '',
    whatsapp: initialProgress?.contact?.whatsapp || '',
    whatBusinessSells: initialProgress?.contact?.whatBusinessSells || '',
    websiteOrSocial: initialProgress?.contact?.websiteOrSocial || '',
    email: initialProgress?.contact?.email || '',
    howDidYouHear:
      initialProgress?.contact?.howDidYouHear ||
      (attribution?.viaAffiliateLink ? 'Advibe Affiliate Partner Link' : ''),
    manualReferralCode: initialProgress?.contact?.manualReferralCode || '',
    honey: '',
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [completedAssessment, setCompletedAssessment] = useState<BusinessAssessment | null>(null);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [whatsappClicked, setWhatsappClicked] = useState(false);
  const [targetPostsPerWeek, setTargetPostsPerWeek] = useState<number>(5);
  const [playingInterludeVideo, setPlayingInterludeVideo] = useState(false);
  const [selectedDirectPackageId, setSelectedDirectPackageId] = useState<string>(
    offerId && offerId !== 'strategy' ? offerId : ''
  );
  const [referralFeedback, setReferralFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Save quiz progress automatically to sessionStorage
  useEffect(() => {
    if (stage === 'results') return;
    try {
      const stateToSave: SavedQuizProgress = {
        stage,
        qIndex,
        answers,
        contact: {
          fullName: contact.fullName,
          businessName: contact.businessName,
          whatsapp: contact.whatsapp,
          whatBusinessSells: contact.whatBusinessSells,
          websiteOrSocial: contact.websiteOrSocial,
          email: contact.email,
          howDidYouHear: contact.howDidYouHear,
          manualReferralCode: contact.manualReferralCode,
        },
      };
      sessionStorage.setItem(SESSION_PROGRESS_KEY, JSON.stringify(stateToSave));
    } catch {
      /* ignore */
    }
  }, [stage, qIndex, answers, contact]);

  // Keep howDidYouHear synced if affiliate link is present
  useEffect(() => {
    if (attribution?.viaAffiliateLink && !contact.howDidYouHear) {
      setContact((prev) => ({ ...prev, howDidYouHear: 'Advibe Affiliate Partner Link' }));
    }
  }, [attribution, contact.howDidYouHear]);

  // Log quiz opened event once
  useEffect(() => {
    logQuizFunnelEvent({
      type: 'quiz_opened',
      entryPage,
      channel: originalChannel,
      affiliateCode: attribution?.code,
    });
  }, [entryPage, originalChannel, attribution?.code]);

  // Lock background scroll, hide floating nav/sticky bars & handle Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('is-modal-open');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      document.body.classList.remove('is-modal-open');
    };
  }, [onClose]);

  // All active catalogue packages for Direct Package Selection
  const cataloguePackages = useMemo(
    () => resolveCataloguePackages(content, country),
    [content, country]
  );

  const activeDirectPackage = useMemo(() => {
    if (selectedDirectPackageId) {
      const found = cataloguePackages.find((p) => p.id === selectedDirectPackageId);
      if (found) return found;
    }
    if (offerId && offerId !== 'strategy') {
      const byOffer = cataloguePackages.find((p) => p.id === offerId);
      if (byOffer) return byOffer;
    }
    return cataloguePackages[0];
  }, [cataloguePackages, selectedDirectPackageId, offerId]);

  // Compute live recommendation from current answers
  const recommendation = useMemo(() => {
    return calculateRecommendations({
      answers,
      content,
      country,
      entryOfferId: offerId !== 'strategy' ? offerId : undefined,
      originalChannel: getOriginalAcquisitionChannel(),
    });
  }, [answers, content, country, offerId]);

  const targetPackageForEligibility =
    stage === 'direct' && activeDirectPackage
      ? activeDirectPackage
      : recommendation.primaryPackage;

  // Evaluate 5% affiliate referral discount eligibility against the active package
  const eligibility = useMemo(() => {
    return checkEligibility({
      email: contact.email,
      whatsapp: contact.whatsapp,
      offerId: targetPackageForEligibility?.id,
      price: targetPackageForEligibility?.price,
    });
  }, [
    checkEligibility,
    contact.email,
    contact.whatsapp,
    targetPackageForEligibility?.id,
    targetPackageForEligibility?.price,
  ]);

  const handleApplyPartnerCode = () => {
    const code = contact.manualReferralCode.trim();
    if (!code) {
      setReferralFeedback({
        type: 'error',
        text: 'Please enter your partner referral code first.',
      });
      return;
    }
    const res = applyReferralCode(code);
    if (res.success) {
      setReferralFeedback({ type: 'success', text: res.message });
      if (!contact.howDidYouHear) {
        setContact((p) => ({ ...p, howDidYouHear: 'Advibe Affiliate Partner Link' }));
      }
    } else {
      setReferralFeedback({ type: 'error', text: res.message });
    }
  };

  const openDirectPackageFlow = () => {
    setErrors([]);
    if (!selectedDirectPackageId) {
      const initialPkg =
        (offerId !== 'strategy' && cataloguePackages.find((p) => p.id === offerId)?.id) ||
        cataloguePackages[0]?.id ||
        '';
      setSelectedDirectPackageId(initialPkg);
    }
    setStage('direct');
  };

  // Select a showcase portfolio item for the AI Mini-Series Educational Interlude & Results page
  const showcaseVideo = useMemo<PortfolioItem>(() => {
    const visible = content.portfolio.filter((p) => p.visible).sort((a, b) => a.order - b.order);
    return (
      visible.find((p) => p.client.toLowerCase().includes('circlesfundme')) ||
      visible[0] || {
        id: 'default-showcase',
        title: 'Branded AI Story Episode',
        client: 'CirclesFundMe',
        category: 'Brand Story',
        youtubeId: 'dQw4w9WgXcQ',
        orientation: 'vertical',
        featured: true,
        visible: true,
        order: 1,
      }
    );
  }, [content.portfolio]);

  const currentQuestion = activeQuestions[qIndex] || activeQuestions[0];
  const totalSteps = activeQuestions.length;
  const progressPercent =
    stage === 'intro'
      ? 0
      : stage === 'results'
      ? 100
      : Math.min(98, Math.round(((qIndex + 1) / totalSteps) * 100));

  // Helper to get human-readable option labels from answer IDs
  const getAnswerLabel = (qId: string, val: string | string[]): string => {
    const q = activeQuestions.find((x) => x.id === qId) || defaultQuizQuestions.find((x) => x.id === qId);
    if (!q) return Array.isArray(val) ? val.join(', ') : val;
    if (Array.isArray(val)) {
      return val
        .map((id) => {
          const opt = q.options.find((o) => o.id === id);
          return opt ? getLocalizedOptionLabel(qId, id, opt.label, country.code) : id;
        })
        .join(', ');
    }
    const opt = q.options.find((o) => o.id === val);
    return opt ? getLocalizedOptionLabel(qId, val, opt.label, country.code) : val;
  };

  /* ---------- NAVIGATION HANDLERS ---------- */

  const startQuiz = () => {
    setErrors([]);
    logQuizFunnelEvent({
      type: 'quiz_started',
      entryPage,
      channel: originalChannel,
      affiliateCode: attribution?.code,
    });
    setStage('question');
    setQIndex(0);
  };

  const handleSingleSelect = (qId: string, optId: string) => {
    setErrors([]);
    setAnswers((prev) => {
      const next = { ...prev, [qId]: optId };
      // Q1 branching: if user chooses "Not yet, we want to start properly", pre-select "We are not active on social media yet" for Q2 if empty
      if (qId === 'q1' && optId === 'q1_none' && prev.q2.length === 0) {
        next.q2 = ['plat_none'];
      }
      return next;
    });
  };

  const handleMultiToggle = (qId: 'q2' | 'q5', optId: string, max?: number) => {
    setErrors([]);
    setAnswers((prev) => {
      const current = prev[qId] || [];
      // If selecting "plat_none", clear others; if selecting another platform, remove "plat_none"
      if (qId === 'q2') {
        if (optId === 'plat_none') {
          return { ...prev, q2: current.includes('plat_none') ? [] : ['plat_none'] };
        }
        const filtered = current.filter((x) => x !== 'plat_none');
        if (filtered.includes(optId)) {
          return { ...prev, q2: filtered.filter((x) => x !== optId) };
        }
        return { ...prev, q2: [...filtered, optId] };
      }

      if (current.includes(optId)) {
        return { ...prev, [qId]: current.filter((x) => x !== optId) };
      }
      if (max && current.length >= max) {
        return { ...prev, [qId]: [...current.slice(1), optId] };
      }
      return { ...prev, [qId]: [...current, optId] };
    });
  };

  const handleNextStep = async () => {
    setErrors([]);
    if (!currentQuestion) return;

    if (currentQuestion.type === 'contact') {
      await submitAssessment();
      return;
    }

    const val = answers[currentQuestion.id as keyof QuizAnswersMap];
    const isEmpty = Array.isArray(val) ? val.length === 0 : !val;
    if (currentQuestion.required && isEmpty) {
      setErrors(['Please select an option to continue.']);
      return;
    }

    logQuizFunnelEvent({
      type: 'question_answered',
      questionId: currentQuestion.id,
      stepNumber: qIndex + 1,
      entryPage,
      channel: originalChannel,
      affiliateCode: attribution?.code,
    });

    // Check Q7 Branching: If user is unfamiliar with AI mini-series, trigger the Educational Interlude before Q8
    if (currentQuestion.id === 'q7') {
      const selectedOpt = currentQuestion.options.find((o) => o.id === answers.q7);
      const shouldShowInterlude =
        selectedOpt?.triggersInterlude ||
        ['ai_fam_yes_unsure', 'ai_fam_heard', 'ai_fam_no'].includes(answers.q7);

      if (shouldShowInterlude) {
        setAnswers((prev) => ({ ...prev, sawEducationalInterlude: true }));
        logQuizFunnelEvent({
          type: 'interlude_viewed',
          questionId: 'q7',
          stepNumber: qIndex + 1,
          entryPage,
          channel: originalChannel,
        });
        setStage('interlude');
        return;
      }
    }

    if (qIndex < activeQuestions.length - 1) {
      setQIndex(qIndex + 1);
    }
  };

  const handleBackStep = () => {
    setErrors([]);
    if (stage === 'interlude') {
      setStage('question');
      return;
    }
    if (stage === 'question') {
      if (qIndex === 0) {
        setStage('intro');
      } else {
        setQIndex(qIndex - 1);
      }
    }
  };

  /* ---------- SUBMIT ASSESSMENT (Q12 -> RESULTS PAGE) ---------- */

  const submitAssessment = async () => {
    if (submitting) return;
    const errs: string[] = [];

    if (contact.fullName.trim().length < 2) {
      errs.push('Please enter your full name.');
    }
    if (contact.businessName.trim().length < 2) {
      errs.push('Please enter your business or brand name.');
    }
    const cleanDigits = contact.whatsapp.replace(/[^\d]/g, '');
    if (cleanDigits.length < 7 || cleanDigits.length > 15) {
      errs.push('Please enter a valid WhatsApp phone number (including country or local prefix).');
    }
    if (contact.whatBusinessSells.trim().length < 3) {
      errs.push('Please tell us briefly what your business sells or offers.');
    }
    if (contact.email.trim() && !/^\S+@\S+\.\S+$/.test(contact.email.trim())) {
      errs.push('Please enter a valid email address (or leave it blank).');
    }
    if (!contact.howDidYouHear || contact.howDidYouHear === 'Select an option...') {
      errs.push('Please tell us how you heard about Advibe.');
    }

    setErrors(errs);
    if (errs.length > 0) return;
    if (contact.honey) {
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      // If user typed a referral code into the box without clicking "Apply Code", try applying it now
      if (!attribution?.viaAffiliateLink && contact.manualReferralCode.trim()) {
        applyReferralCode(contact.manualReferralCode.trim());
      }

      const chosenPkg =
        stage === 'direct' && activeDirectPackage
          ? activeDirectPackage
          : recommendation.primaryPackage;

      const latestEligibility = checkEligibility({
        email: contact.email,
        whatsapp: contact.whatsapp,
        offerId: chosenPkg.id,
        price: chosenPkg.price,
      });

      const isDiscountEligible = Boolean(latestEligibility.isEligible);
      const isDiscountClaimed = Boolean(isDiscountEligible && claimDiscount);
      const basePrice = chosenPkg.price;
      const discountAmt =
        isDiscountClaimed && basePrice > 0
          ? Math.round(basePrice * (discountPercent / 100))
          : 0;
      const finalPrice = Math.max(0, basePrice - discountAmt);

      const assessmentId =
        stage === 'direct'
          ? `ADV-PKG-${Math.floor(1000 + Math.random() * 9000)}`
          : `ADV-QUIZ-${Math.floor(1000 + Math.random() * 9000)}`;
      const platformsLabels = (answers.q2 || []).map((id) => getAnswerLabel('q2', id));
      const challengesLabels = (answers.q5 || []).map((id) => getAnswerLabel('q5', id));

      const assessmentRecord: BusinessAssessment = {
        assessmentId,
        timestampSubmitted: new Date().toISOString(),
        entryPage,
        entryContextOfferId:
          stage === 'direct' ? chosenPkg.id : offerId !== 'strategy' ? offerId : undefined,
        entryContextOfferName: stage === 'direct' ? chosenPkg.name : offerTitle,
        originalAcquisitionChannel: originalChannel,
        fullName: contact.fullName.trim(),
        businessName: contact.businessName.trim(),
        whatsappNumber: contact.whatsapp.trim(),
        email: contact.email.trim(),
        websiteOrSocial: contact.websiteOrSocial.trim(),
        whatBusinessSells: contact.whatBusinessSells.trim(),
        howDidYouHear: contact.howDidYouHear,
        socialMediaStatus:
          stage === 'direct' ? 'Direct Package Order' : getAnswerLabel('q1', answers.q1),
        platformsUsed: platformsLabels,
        postingFrequency:
          stage === 'direct' ? 'Direct Package Selection' : getAnswerLabel('q3', answers.q3),
        wantsMoreConsistency:
          stage === 'direct' ? 'Yes (Direct Package)' : getAnswerLabel('q4', answers.q4),
        biggestChallenges:
          stage === 'direct' ? ['Direct package purchase'] : challengesLabels,
        storytellingInterest: getAnswerLabel('q6', answers.q6),
        aiSeriesFamiliarity: getAnswerLabel('q7', answers.q7),
        sawEducationalInterlude: answers.sawEducationalInterlude,
        aiMiniSeriesInterest: getAnswerLabel('q8', answers.q8),
        monthlyAdSpendRange: getAnswerLabel('q9', answers.q9),
        monthlyContentSpendRange: getAnswerLabel('q10', answers.q10),
        primaryGoal:
          stage === 'direct'
            ? `Get started with ${chosenPkg.name}`
            : getAnswerLabel('q11', answers.q11),
        primaryRecommendedService:
          stage === 'direct' ? chosenPkg.serviceCategoryLabel : recommendation.primaryServiceTitle,
        primaryRecommendedPackageId: chosenPkg.id,
        primaryRecommendedPackageName: chosenPkg.name,
        primaryRecommendedPrice: finalPrice,
        secondaryRecommendation: recommendation.secondaryServiceTitle,
        secondaryPackageId: recommendation.secondaryPackage.id,
        secondaryPackageName: recommendation.secondaryPackage.name,
        monthlyRetainerOpportunity: recommendation.monthlyRetainerOpportunity,
        aiMiniSeriesOpportunity: recommendation.aiMiniSeriesOpportunity,
        categoryScores: recommendation.scores,
        referralSource: attribution?.viaAffiliateLink
          ? 'affiliate_link'
          : contact.manualReferralCode.trim()
          ? 'manual_code'
          : 'direct',
        affiliateId: attribution?.affiliateId || '',
        affiliateCode: attribution?.code || contact.manualReferralCode.trim().toUpperCase() || '',
        eligibleFor5PercentDiscount: isDiscountEligible,
        claimed5PercentDiscount: isDiscountClaimed,
        discountAmount: discountAmt,
        utmSource: getParam('utm_source') || '',
        utmMedium: getParam('utm_medium') || '',
        utmCampaign: getParam('utm_campaign') || '',
        countryCode: country.code,
        currencyCode: country.currency,
        quizCompletionStatus: 'completed',
        whatsappCtaClicked: false,
        leadStatus: 'New lead',
        salesNotes: '',
        syncStatus: 'pending',
      };

      // 1. Save to primary Assessments Store & sync to Google Sheets (4 Tabs)
      const savedAssessment = await recordCompletedAssessment(
        assessmentRecord,
        quizConfig.googleSheetsWebhookUrl
      );

      // 2. Also add to primary Leads store so Pipeline & Affiliate Performance stay unified
      const summaryNotes = [
        `Assessment ID: ${assessmentId}`,
        `Sells: ${assessmentRecord.whatBusinessSells}`,
        `Frequency: ${assessmentRecord.postingFrequency}`,
        `Ad Spend: ${assessmentRecord.monthlyAdSpendRange}`,
        `Content Spend: ${assessmentRecord.monthlyContentSpendRange}`,
        `Challenges: ${assessmentRecord.biggestChallenges.join('; ')}`,
        `90-Day Goal: ${assessmentRecord.primaryGoal}`,
        `Primary Rec: ${assessmentRecord.primaryRecommendedPackageName}`,
        `Secondary Rec: ${assessmentRecord.secondaryPackageName}`,
        `How heard: ${assessmentRecord.howDidYouHear}`,
        attribution?.viaAffiliateLink
          ? `Referred by: ${attribution.code} [Affiliate Link]`
          : contact.manualReferralCode.trim()
          ? `Manual code entered: ${contact.manualReferralCode.trim()} (No 5% discount)`
          : 'Direct',
        isDiscountClaimed
          ? `Claimed ${discountPercent}% First-Time Referral Discount (${attribution?.code})`
          : '',
      ]
        .filter(Boolean)
        .join(' · ');

      const createdLead = await addLead(
        {
          name: assessmentRecord.fullName,
          business: assessmentRecord.businessName,
          whatsapp: assessmentRecord.whatsappNumber,
          email: assessmentRecord.email,
          offerId: chosenPkg.id,
          offerName: chosenPkg.name,
          price: finalPrice,
          industry: '',
          product: assessmentRecord.whatBusinessSells,
          event: stage === 'direct' ? 'Direct Package Order' : 'Service Discovery Quiz',
          notes: summaryNotes,
          utmSource: assessmentRecord.utmSource || undefined,
          country: country.code,
          currency: country.currency,
          source: entryPage,
          showPublic: false,
          goal: assessmentRecord.primaryGoal,
          pageRoute: window.location.hash || window.location.pathname,
          referralCode: attribution?.code,
          affiliateId: attribution?.affiliateId,
          referralSource: assessmentRecord.referralSource,
          discountClaimed: isDiscountClaimed,
          discountPercent: isDiscountClaimed ? discountPercent : undefined,
          discountAmount: discountAmt > 0 ? discountAmt : undefined,
          howDidYouHear: assessmentRecord.howDidYouHear,
          manualReferralCode: contact.manualReferralCode.trim() || undefined,
          isFirstTimeCustomer: true,
          assessmentId,
          whatsappCtaClicked: false,
          pipelineStage: 'New lead',
          secondaryRecommendation: recommendation.secondaryPackage.name,
          retainerOpportunity: recommendation.monthlyRetainerOpportunity,
          miniSeriesOpportunity: recommendation.aiMiniSeriesOpportunity,
          entryPoint: entryPage,
        },
        country.name
      );

      setSavedLeadId(createdLead.id);
      setCompletedAssessment(savedAssessment);

      logQuizFunnelEvent({
        type: 'quiz_completed',
        entryPage,
        channel: originalChannel,
        affiliateCode: attribution?.code,
        metadata: {
          assessmentId,
          primaryPackage: recommendation.primaryPackage.id,
          retainerOpportunity: recommendation.monthlyRetainerOpportunity,
          miniSeriesOpportunity: recommendation.aiMiniSeriesOpportunity,
        },
      });
      logQuizFunnelEvent({
        type: 'results_viewed',
        entryPage,
        channel: originalChannel,
        affiliateCode: attribution?.code,
      });

      try {
        sessionStorage.removeItem(SESSION_PROGRESS_KEY);
      } catch {
        /* ignore */
      }

      setStage('results');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- WHATSAPP CTA CLICK HANDLER (PART 6) ---------- */

  const handleWhatsAppClick = () => {
    if (!completedAssessment) return;
    setWhatsappClicked(true);

    // Track WhatsApp CTA click in Meta Pixel, Funnel Analytics, and Assessment record
    // IMPORTANT: Do NOT mark the lead as having "Contacted" Advibe just because the link was opened.
    track('Contact', {
      type: 'whatsapp_quiz_handoff',
      assessmentId: completedAssessment.assessmentId,
      offer: completedAssessment.primaryRecommendedPackageName,
    });

    logQuizFunnelEvent({
      type: 'whatsapp_cta_clicked',
      entryPage,
      channel: originalChannel,
      affiliateCode: attribution?.code,
      metadata: { assessmentId: completedAssessment.assessmentId },
    });

    void markAssessmentWhatsAppClicked(
      completedAssessment.assessmentId,
      quizConfig.googleSheetsWebhookUrl
    ).then((updated) => {
      if (updated) setCompletedAssessment(updated);
    });

    if (savedLeadId) {
      updateLead(savedLeadId, {
        whatsappCtaClicked: true,
        whatsappCtaClickedAt: new Date().toISOString(),
      });
    }
  };

  const contentOpportunity = useMemo(() => {
    return calculateContentOpportunity(answers.q3, answers.q9, country.code, targetPostsPerWeek);
  }, [answers.q3, answers.q9, country.code, targetPostsPerWeek]);

  const whatsappUrl = useMemo(() => {
    if (!completedAssessment) return '#';
    return buildAssessmentWhatsAppUrl(completedAssessment, content, country);
  }, [completedAssessment, content, country]);

  const resolvedResultPackage = useMemo(() => {
    if (completedAssessment?.primaryRecommendedPackageId) {
      const found = cataloguePackages.find(
        (p) => p.id === completedAssessment.primaryRecommendedPackageId
      );
      if (found) return found;
    }
    return recommendation.primaryPackage;
  }, [
    completedAssessment?.primaryRecommendedPackageId,
    cataloguePackages,
    recommendation.primaryPackage,
  ]);

  const renderPartnerReferralSection = (targetOfferId: string, targetPrice: number) => (
    <div className="rounded-2xl border-2 border-[#f5a524]/60 bg-gradient-to-br from-[#f5a524]/20 via-[#f5a524]/10 to-[#f5a524]/[0.03] p-4 sm:p-5 space-y-3.5 shadow-[0_10px_35px_rgba(245,165,36,0.12)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5a524] text-black shadow-md">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#f5a524]/25 border border-[#f5a524]/50 px-2.5 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#f5a524]">
              Partner Referral Benefit · 5% Off
            </span>
          </div>
          <p className="font-display text-sm sm:text-base font-extrabold text-white leading-snug">
            Have a referral code from any of our partners? Get a 5% discount!
          </p>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            If you were referred by any of our official Advibe Affiliate Partners, enter your partner referral code below to unlock an exclusive{' '}
            <strong className="text-[#f5a524]">5% discount</strong> on your package.
          </p>
        </div>
      </div>

      {!attribution?.viaAffiliateLink ? (
        <div className="space-y-2 pt-1">
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#f5a524]">
            Enter Partner Referral Code <span className="text-white/50 font-normal">(Optional)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={contact.manualReferralCode}
              onChange={(e) => {
                setContact((p) => ({ ...p, manualReferralCode: e.target.value.toUpperCase() }));
                if (referralFeedback) setReferralFeedback(null);
              }}
              placeholder="e.g. ADV-JOHN (Enter partner code for 5% off)"
              className="flex-1 rounded-xl border border-[#f5a524]/40 bg-black/50 px-4 py-3 text-xs sm:text-sm font-mono uppercase tracking-wider text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyPartnerCode}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#f5a524] px-5 font-display text-xs font-extrabold uppercase tracking-wider text-black shadow-md hover:brightness-110 transition cursor-pointer shrink-0"
            >
              <span>Apply 5% Code</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {referralFeedback && (
            <div
              className={`rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
                referralFeedback.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                  : 'border-red-500/40 bg-red-500/15 text-red-200'
              }`}
            >
              {referralFeedback.text}
            </div>
          )}
        </div>
      ) : (
        <div className="pt-1">
          <DiscountEligibilityModule
            customerEmail={contact.email}
            customerWhatsapp={contact.whatsapp}
            offerId={targetOfferId}
            rawPrice={targetPrice}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Find the Right Creative Solution for Your Business"
    >
      <div
        className={`relative my-auto flex flex-col w-full ${
          stage === 'results' ? 'max-w-4xl' : 'max-w-3xl'
        } max-h-[92dvh] sm:max-h-[90dvh] overflow-hidden rounded-3xl border border-white/15 bg-[#0b0e12] text-white shadow-[0_30px_100px_rgba(0,0,0,0.85)] transition-all duration-300 text-left`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* =====================================================================
            TOP HEADER & PROGRESS BAR
        ====================================================================== */}
        <div className="shrink-0 z-30 border-b border-white/10 bg-[#0b0e12] px-6 py-4 sm:px-9 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5a524]/15 text-[#f5a524] border border-[#f5a524]/30">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#f5a524]">
                  {stage === 'results'
                    ? `Personalised Strategy · Ref ${completedAssessment?.assessmentId || ''}`
                    : stage === 'direct'
                    ? 'Direct Package Selection · Fast-Track Order'
                    : stage === 'interlude'
                    ? 'Creative Spotlight · AI Branded Series'
                    : stage === 'question'
                    ? `Question ${qIndex + 1} of ${totalSteps}`
                    : 'Advibe Service Discovery'}
                </p>
                <p className="font-display text-xs sm:text-sm font-bold text-white/90">
                  {stage === 'direct'
                    ? 'Choose Your Package & Get Started Directly'
                    : offerTitle && offerId !== 'strategy'
                    ? `Exploring: ${offerTitle}`
                    : 'Interactive Business & Content Assessment'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick switch button for visitors who already know the package they want */}
              {(stage === 'question' || stage === 'interlude') && (
                <button
                  type="button"
                  onClick={openDirectPackageFlow}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#f5a524]/40 bg-[#f5a524]/10 px-3 py-1.5 font-mono text-[11px] font-bold text-[#f5a524] transition hover:bg-[#f5a524] hover:text-black cursor-pointer"
                >
                  <Layers className="h-3 w-3" />
                  <span>Select Package Directly →</span>
                </button>
              )}

              {/* Country / Currency selector so Q9/Q10 & package prices match visitor's market */}
              {countries.length > 1 && (
                <select
                  value={country.code}
                  onChange={(e) => setCountry(e.target.value)}
                  className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white focus:border-[#f5a524] focus:outline-none cursor-pointer"
                  aria-label="Select country currency"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#0b0e12] text-white">
                      {c.flag} {c.currency}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white cursor-pointer"
                aria-label="Close assessment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {stage !== 'intro' && stage !== 'direct' && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f5a524] to-amber-300 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* =====================================================================
            STAGE 1: QUIZ INTRO SCREEN (SECTION 2.1)
        ====================================================================== */}
        {stage === 'intro' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-7">
            {/* Partner Referral Banner if visitor arrived via valid affiliate link */}
            {attribution?.viaAffiliateLink && (
              <div className="rounded-2xl border border-[#f5a524]/40 bg-[#f5a524]/10 p-4 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[#f5a524] shrink-0" />
                <div className="text-xs sm:text-sm text-white/90">
                  <strong className="text-[#f5a524]">Partner Referral Active ({attribution.code}):</strong>{' '}
                  Complete this 60-second discovery quiz to unlock your personalised recommendation and claim your{' '}
                  <strong>5% first-time customer discount</strong>.
                </div>
              </div>
            )}

            {/* Entry-point context badge if launched from a specific product/service */}
            {offerId !== 'strategy' && offerTitle && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-mono text-white/80">
                <Video className="h-3.5 w-3.5 text-[#f5a524]" />
                <span>Selected Service Context: <strong className="text-white">{offerTitle}</strong></span>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-[1.08]">
                {quizConfig.introHeading}
              </h2>

              <div className="space-y-3 text-sm sm:text-base text-white/75 leading-relaxed">
                {quizConfig.introCopy.split('\n\n').map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>

            {/* 3 Quick Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#f5a524]">
                  01 · Diagnose
                </span>
                <p className="mt-1 font-display text-sm font-bold text-white">
                  Pinpoint Your Content Gap
                </p>
                <p className="mt-1 text-xs text-white/60 leading-relaxed">
                  Identify whether you need direct-response ad variations, explainers, or consistent monthly volume.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#f5a524]">
                  02 · Discover
                </span>
                <p className="mt-1 font-display text-sm font-bold text-white">
                  Explore New Formats
                </p>
                <p className="mt-1 text-xs text-white/60 leading-relaxed">
                  See how branded AI mini-series and managed monthly retainers work for businesses like yours.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#f5a524]">
                  03 · Action Plan
                </span>
                <p className="mt-1 font-display text-sm font-bold text-white">
                  Tailored Package & Pricing
                </p>
                <p className="mt-1 text-xs text-white/60 leading-relaxed">
                  Get a clear recommendation with transparent pricing and a direct WhatsApp strategy handoff.
                </p>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={startQuiz}
                className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[#f5a524] px-8 font-display text-base font-extrabold uppercase tracking-wider text-black shadow-xl shadow-[#f5a524]/20 transition hover:brightness-110 active:scale-[0.99] cursor-pointer"
              >
                <span>{quizConfig.introCta}</span>
              </button>

              {/* Direct Package Selection Button for visitors who already know the package they want */}
              <button
                type="button"
                onClick={openDirectPackageFlow}
                className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-[#f5a524]/45 bg-[#f5a524]/10 px-6 font-display text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#f5a524] transition hover:bg-[#f5a524]/20 hover:border-[#f5a524] active:scale-[0.99] cursor-pointer"
              >
                <Layers className="h-4 w-4 shrink-0" />
                <span>
                  {offerId !== 'strategy' && offerTitle
                    ? `Already Know You Want ${offerTitle}? Go Directly & Get It →`
                    : 'Already Know the Package You Want? Go Directly & Get It →'}
                </span>
              </button>

              <p className="text-center font-mono text-xs text-white/55">
                {quizConfig.introReassurance}
              </p>
            </div>
          </div>
        )}

        {/* =====================================================================
            STAGE 1B: DIRECT PACKAGE SELECTION (FOR VISITORS WHO KNOW WHAT THEY WANT)
        ====================================================================== */}
        {stage === 'direct' && activeDirectPackage && (
          <>
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-7">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Fast-Track Package Selection</span>
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
                  Select Your Package & Get Started Directly
                </h2>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  Already know the package you want? Choose your package below, fill in your details, and continue straight to WhatsApp with your order prefilled.
                </p>
              </div>

              {/* 1. Interactive Package Selector Grid */}
              <div className="space-y-3">
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                  1. Choose Your Advibe Package
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cataloguePackages.map((pkg) => {
                    const isSelected = activeDirectPackage.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedDirectPackageId(pkg.id)}
                        className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-2 border-[#f5a524] bg-[#f5a524]/15 shadow-[0_0_25px_rgba(245,165,36,0.2)]'
                            : 'border-white/12 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="space-y-1.5 w-full">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524]">
                              {pkg.serviceCategoryLabel}
                            </span>
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                                isSelected
                                  ? 'border-[#f5a524] bg-[#f5a524] text-black'
                                  : 'border-white/30'
                              }`}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </span>
                          </div>
                          <p className="font-display text-base font-extrabold text-white">
                            {pkg.name}
                          </p>
                          <p className="text-xs text-white/65 line-clamp-2 leading-relaxed">
                            {pkg.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/10 flex items-baseline justify-between gap-2 w-full">
                          <span className="font-display text-lg font-black text-[#f5a524]">
                            {pkg.formattedPrice}
                          </span>
                          <span className="font-mono text-[11px] text-white/60">
                            {pkg.durationOrPeriod}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Business & Contact Details */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                  2. Your Business & Contact Details
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      Full Name <span className="text-[#f5a524]">*</span>
                    </label>
                    <input
                      type="text"
                      value={contact.fullName}
                      onChange={(e) => setContact((p) => ({ ...p, fullName: e.target.value }))}
                      placeholder="e.g. Chidi Okonkwo"
                      autoComplete="name"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      Business / Brand Name <span className="text-[#f5a524]">*</span>
                    </label>
                    <input
                      type="text"
                      value={contact.businessName}
                      onChange={(e) => setContact((p) => ({ ...p, businessName: e.target.value }))}
                      placeholder="e.g. Zuri Luxe"
                      autoComplete="organization"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      WhatsApp Phone Number <span className="text-[#f5a524]">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={contact.whatsapp}
                      onChange={(e) => setContact((p) => ({ ...p, whatsapp: e.target.value }))}
                      placeholder={
                        country.code === 'NG'
                          ? '+234 803 000 0000'
                          : country.code === 'GH'
                          ? '+233 24 000 0000'
                          : country.code === 'KE'
                          ? '+254 712 000 000'
                          : '+1 555 000 0000'
                      }
                      autoComplete="tel"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      Email Address <span className="text-white/40">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      inputMode="email"
                      value={contact.email}
                      onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                      placeholder="you@company.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                    What does your business sell or offer? <span className="text-[#f5a524]">*</span>
                  </label>
                  <input
                    type="text"
                    value={contact.whatBusinessSells}
                    onChange={(e) => setContact((p) => ({ ...p, whatBusinessSells: e.target.value }))}
                    placeholder="e.g. Organic skincare products for women in Lagos & Abuja"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      Website or Instagram / TikTok Handle <span className="text-white/40">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={contact.websiteOrSocial}
                      onChange={(e) => setContact((p) => ({ ...p, websiteOrSocial: e.target.value }))}
                      placeholder="@yourbrand or yourwebsite.com"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      How did you hear about Advibe? <span className="text-[#f5a524]">*</span>
                    </label>
                    <select
                      value={contact.howDidYouHear}
                      onChange={(e) => setContact((p) => ({ ...p, howDidYouHear: e.target.value }))}
                      disabled={Boolean(attribution?.viaAffiliateLink)}
                      className="w-full rounded-xl border border-white/15 bg-[#141920] px-4 py-3 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                    >
                      <option value="">Select an option...</option>
                      {HOW_HEARD_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Broad Partner Referral Code Notification & 5% Discount Claim */}
                {renderPartnerReferralSection(activeDirectPackage.id, activeDirectPackage.price)}
              </div>

              {errors.length > 0 && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-200 space-y-1">
                  {errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Pinned Footer for Direct Package Selection */}
            <div className="shrink-0 flex items-center justify-between gap-4 border-t border-white/10 bg-[#0b0e12] px-6 py-4 sm:px-10 sm:py-5">
              <button
                type="button"
                onClick={() => {
                  setErrors([]);
                  setStage('intro');
                }}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 font-display text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Quiz</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={submitAssessment}
                className="inline-flex min-h-[50px] flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-[#f5a524] px-8 font-display text-xs sm:text-sm font-extrabold uppercase tracking-wider text-black shadow-lg shadow-[#f5a524]/20 hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {submitting
                    ? 'Preparing Your Order…'
                    : `Proceed with ${activeDirectPackage.name} →`}
                </span>
              </button>
            </div>
          </>
        )}

        {/* =====================================================================
            STAGE 2: AI MINI-SERIES EDUCATIONAL INTERLUDE (AFTER Q7 IF UNFAMILIAR)
        ====================================================================== */}
        {stage === 'interlude' && (
          <>
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f5a524]/15 border border-[#f5a524]/30 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-[#f5a524]">
              <Film className="h-3.5 w-3.5" />
              <span>60-Second Creative Discovery</span>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Imagine your business had its own mini TV series...
              </h2>
              <p className="text-sm sm:text-base text-white/75 leading-relaxed">
                Instead of posting only <strong className="text-white">"Buy now" flyers</strong> or repetitive product ads, brands can now use AI-generated storytelling to create short dramatic episodes, relatable customer scenarios, humorous moments and memorable characters — with their product or service woven naturally into the story.
              </p>
            </div>

            {/* Interactive Video / Visual Preview Card from Advibe Portfolio */}
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
              {playingInterludeVideo ? (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${showcaseVideo.youtubeId}?autoplay=1&rel=0`}
                    title={showcaseVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div
                  onClick={() => setPlayingInterludeVideo(true)}
                  className="relative aspect-video w-full cursor-pointer group overflow-hidden"
                >
                  <img
                    src={`https://img.youtube.com/vi/${showcaseVideo.youtubeId}/hqdefault.jpg`}
                    alt={showcaseVideo.title}
                    className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-[#f5a524] text-black shadow-xl transition group-hover:scale-110">
                      <Play className="h-7 w-7 fill-black translate-x-0.5" />
                    </span>
                    <span className="mt-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#f5a524]">
                      Watch Advibe Story Example
                    </span>
                    <p className="mt-1 font-display text-base sm:text-lg font-bold text-white">
                      {showcaseVideo.title} ({showcaseVideo.client})
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/10 bg-white/[0.03] p-4 text-xs">
                <div>
                  <strong className="text-[#f5a524] block font-mono uppercase text-[10px]">Why Viewers Watch</strong>
                  <span className="text-white/75">People stay for the story, humour, or suspense instead of skipping an ad.</span>
                </div>
                <div>
                  <strong className="text-[#f5a524] block font-mono uppercase text-[10px]">Brand Integration</strong>
                  <span className="text-white/75">Your product or service resolves the tension naturally inside the episode.</span>
                </div>
                <div>
                  <strong className="text-[#f5a524] block font-mono uppercase text-[10px]">No Film Crew Needed</strong>
                  <span className="text-white/75">Directed by Advibe with cinema-grade AI visuals, characters & voice acting.</span>
                </div>
              </div>
            </div>

            </div>

            <div className="shrink-0 flex items-center justify-between gap-4 border-t border-white/10 bg-[#0b0e12] px-6 py-4 sm:px-10 sm:py-5">
              <button
                type="button"
                onClick={handleBackStep}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 font-display text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPlayingInterludeVideo(false);
                  setStage('question');
                  setQIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1));
                }}
                className="inline-flex min-h-[48px] flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-[#f5a524] px-7 font-display text-xs sm:text-sm font-extrabold uppercase tracking-wider text-black shadow-lg hover:brightness-110 cursor-pointer"
              >
                <span>Continue to Question {qIndex + 2}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {/* =====================================================================
            STAGE 3: QUESTIONS Q1 - Q12 (PART 3)
        ====================================================================== */}
        {stage === 'question' && currentQuestion && (
          <>
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6">
              <div className="space-y-2.5">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                  Step {qIndex + 1} of {totalSteps}
                </span>
                <h2 className="font-display text-xl sm:text-3xl font-extrabold text-white leading-snug">
                  {currentQuestion.title}
                </h2>
              {currentQuestion.subtitle && (
                <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
                  {currentQuestion.subtitle}
                </p>
              )}
            </div>

            {/* SINGLE-SELECT QUESTION OPTIONS */}
            {currentQuestion.type === 'single' && (
              <div className="grid gap-2.5">
                {currentQuestion.options.map((opt) => {
                  const selected = answers[currentQuestion.id as keyof QuizAnswersMap] === opt.id;
                  const localizedLabel = getLocalizedOptionLabel(
                    currentQuestion.id,
                    opt.id,
                    opt.label,
                    country.code
                  );
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSingleSelect(currentQuestion.id, opt.id)}
                      className={`group flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-[#f5a524] bg-[#f5a524]/15 shadow-[0_0_25px_rgba(245,165,36,0.18)]'
                          : 'border-white/12 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
                          selected
                            ? 'border-[#f5a524] bg-[#f5a524] text-black'
                            : 'border-white/30 bg-transparent group-hover:border-white/60'
                        }`}
                      >
                        {selected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </span>
                      <div className="flex-1">
                        <p className="font-display text-sm sm:text-base font-bold text-white">
                          {localizedLabel}
                        </p>
                        {opt.description && (
                          <p className="mt-1 text-xs text-white/60 leading-relaxed">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* MULTI-SELECT QUESTION OPTIONS (Q2 & Q5) */}
            {currentQuestion.type === 'multi' && (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {currentQuestion.options.map((opt) => {
                  const currentList = (answers[currentQuestion.id as 'q2' | 'q5'] || []) as string[];
                  const selected = currentList.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        handleMultiToggle(
                          currentQuestion.id as 'q2' | 'q5',
                          opt.id,
                          currentQuestion.maxSelections
                        )
                      }
                      className={`group flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-[#f5a524] bg-[#f5a524]/15 shadow-[0_0_20px_rgba(245,165,36,0.15)]'
                          : 'border-white/12 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
                          selected
                            ? 'border-[#f5a524] bg-[#f5a524] text-black'
                            : 'border-white/30 bg-transparent'
                        }`}
                      >
                        {selected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </span>
                      <span className="font-display text-xs sm:text-sm font-bold text-white leading-snug">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* QUESTION 12: BUSINESS & CONTACT DETAILS + AFFILIATE DISCOUNT MODULE */}
            {currentQuestion.type === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      Full Name <span className="text-[#f5a524]">*</span>
                    </label>
                    <input
                      type="text"
                      value={contact.fullName}
                      onChange={(e) => setContact((p) => ({ ...p, fullName: e.target.value }))}
                      placeholder="e.g. Chidi Okonkwo"
                      autoComplete="name"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      Business / Brand Name <span className="text-[#f5a524]">*</span>
                    </label>
                    <input
                      type="text"
                      value={contact.businessName}
                      onChange={(e) => setContact((p) => ({ ...p, businessName: e.target.value }))}
                      placeholder="e.g. Zuri Luxe"
                      autoComplete="organization"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      WhatsApp Phone Number <span className="text-[#f5a524]">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={contact.whatsapp}
                      onChange={(e) => setContact((p) => ({ ...p, whatsapp: e.target.value }))}
                      placeholder={
                        country.code === 'NG'
                          ? '+234 803 000 0000'
                          : country.code === 'GH'
                          ? '+233 24 000 0000'
                          : country.code === 'KE'
                          ? '+254 712 000 000'
                          : '+1 555 000 0000'
                      }
                      autoComplete="tel"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      Email Address <span className="text-white/40">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      inputMode="email"
                      value={contact.email}
                      onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                      placeholder="you@company.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                    What does your business sell or offer? <span className="text-[#f5a524]">*</span>
                  </label>
                  <input
                    type="text"
                    value={contact.whatBusinessSells}
                    onChange={(e) => setContact((p) => ({ ...p, whatBusinessSells: e.target.value }))}
                    placeholder="e.g. Organic skincare products for women in Lagos & Abuja"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      Website or Instagram / TikTok Handle <span className="text-white/40">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={contact.websiteOrSocial}
                      onChange={(e) => setContact((p) => ({ ...p, websiteOrSocial: e.target.value }))}
                      placeholder="@yourbrand or yourwebsite.com"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                      How did you hear about Advibe? <span className="text-[#f5a524]">*</span>
                    </label>
                    <select
                      value={contact.howDidYouHear}
                      onChange={(e) => setContact((p) => ({ ...p, howDidYouHear: e.target.value }))}
                      disabled={Boolean(attribution?.viaAffiliateLink)}
                      className="w-full rounded-xl border border-white/15 bg-[#141920] px-4 py-3 text-sm text-white focus:border-[#f5a524] focus:outline-none"
                    >
                      <option value="">Select an option...</option>
                      {HOW_HEARD_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Broad Partner Referral Notification & 5% Discount Module */}
                {renderPartnerReferralSection(
                  recommendation.primaryPackage.id,
                  recommendation.primaryPackage.price
                )}

                {/* Spam trap */}
                <input
                  type="text"
                  value={contact.honey}
                  onChange={(e) => setContact((p) => ({ ...p, honey: e.target.value }))}
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                  aria-hidden="true"
                />
              </div>
            )}

              {/* VALIDATION ERRORS */}
              {errors.length > 0 && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-200 space-y-1">
                  {errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>

            {/* PINNED BACK / CONTINUE FOOTER BAR */}
            <div className="shrink-0 flex items-center justify-between gap-4 border-t border-white/10 bg-[#0b0e12] px-6 py-4 sm:px-10 sm:py-5">
              <button
                type="button"
                onClick={handleBackStep}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 font-display text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleNextStep}
                className="inline-flex min-h-[50px] flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-[#f5a524] px-8 font-display text-xs sm:text-sm font-extrabold uppercase tracking-wider text-black shadow-lg shadow-[#f5a524]/20 hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {submitting
                    ? 'Preparing Your Recommendation…'
                    : currentQuestion.type === 'contact'
                    ? 'See My Personalised Recommendation →'
                    : 'Continue →'}
                </span>
              </button>
            </div>
          </>
        )}

        {/* =====================================================================
            STAGE 4: PERSONALISED RESULTS PAGE THAT SELLS (PART 5 & PART 6)
        ====================================================================== */}
        {stage === 'results' && completedAssessment && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8">
            {/* 5.1 DYNAMIC HEADLINE & PERSONALISED INTRO */}
            <div className="rounded-3xl border border-[#f5a524]/30 bg-gradient-to-br from-[#171c24] via-[#11151c] to-[#0b0e12] p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5a524]/20 border border-[#f5a524]/40 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#f5a524]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Assessment Complete · Prepared for {completedAssessment.businessName}</span>
                </span>
                <span className="font-mono text-xs text-white/50">
                  Ref: <strong className="text-white">{completedAssessment.assessmentId}</strong>
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-[1.08]">
                WE'VE FOUND A SMARTER WAY TO APPROACH YOUR BUSINESS CONTENT.
              </h2>

              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                Hi <strong className="text-white">{completedAssessment.fullName.split(' ')[0]}</strong> — based on what{' '}
                <strong className="text-white">{completedAssessment.businessName}</strong> offers (
                <em>{completedAssessment.whatBusinessSells}</em>), your current posting rhythm (
                <strong className="text-white">{completedAssessment.postingFrequency.toLowerCase()}</strong>), and your 90-day goal to{' '}
                <strong className="text-[#f5a524]">{completedAssessment.primaryGoal.toLowerCase()}</strong>, here is the tailored creative strategy we recommend for your brand.
              </p>

              {/* 5% Affiliate Discount Confirmation Banner if claimed */}
              {completedAssessment.claimed5PercentDiscount && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div className="text-xs sm:text-sm text-emerald-100">
                    <strong className="text-emerald-300">5% Partner Referral Discount Locked In!</strong>{' '}
                    Your exclusive 5% first-time customer discount (via partner code{' '}
                    <strong className="font-mono">{completedAssessment.affiliateCode}</strong>) has been applied to your recommended package below.
                  </div>
                </div>
              )}
            </div>

            {/* 5.2 PRIMARY RECOMMENDATION / SELECTED PACKAGE CARD */}
            <div className="rounded-3xl border-2 border-[#f5a524] bg-[#12161f] p-6 sm:p-8 shadow-[0_20px_60px_rgba(245,165,36,0.12)] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                    {completedAssessment.assessmentId.startsWith('ADV-PKG-')
                      ? '★ Your Selected Advibe Package'
                      : '★ Primary Best-Fit Recommendation'}
                  </span>
                  <h3 className="mt-1 font-display text-xl sm:text-3xl font-extrabold text-white">
                    {resolvedResultPackage.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60">
                    Service Category: {resolvedResultPackage.serviceCategoryLabel}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white/50 block">
                    Package Investment
                  </span>
                  <div className="flex items-baseline gap-2 sm:justify-end">
                    <span className="font-display text-2xl sm:text-3xl font-black text-[#f5a524]">
                      {fmtMoney(completedAssessment.primaryRecommendedPrice, country)}
                    </span>
                    {resolvedResultPackage.isMonthly && (
                      <span className="font-mono text-xs text-white/60">/ month</span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-white/65">
                    {resolvedResultPackage.durationOrPeriod}
                  </span>
                </div>
              </div>

              {/* Why This Fits Your Business */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-2">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                  Why This Fits {completedAssessment.businessName}
                </p>
                <p className="text-sm text-white/85 leading-relaxed">
                  {completedAssessment.assessmentId.startsWith('ADV-PKG-')
                    ? resolvedResultPackage.whoFor || resolvedResultPackage.description
                    : recommendation.primaryWhyFits}
                </p>
                {completedAssessment.biggestChallenges.length > 0 &&
                  !completedAssessment.assessmentId.startsWith('ADV-PKG-') && (
                    <p className="text-xs text-white/65 pt-1">
                      Directly addresses your challenge:{' '}
                      <strong className="text-white">
                        “{completedAssessment.biggestChallenges.join(' & ')}”
                      </strong>
                    </p>
                  )}
              </div>

              {/* Deliverables & Key Features */}
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-white/60 mb-3">
                  Included Deliverables & Studio Workflow ({resolvedResultPackage.quantity} Videos)
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {resolvedResultPackage.features.map((feat, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs sm:text-sm text-white/85"
                    >
                      <Check className="h-4 w-4 text-[#f5a524] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action buttons: Jump to Final WhatsApp Handoff OR Explore Package Page */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppClick}
                  className="flex min-h-[52px] w-full sm:flex-1 items-center justify-center gap-2.5 rounded-2xl bg-[#f5a524] px-6 font-display text-xs sm:text-sm font-extrabold uppercase tracking-wider text-black shadow-lg hover:brightness-110 transition"
                >
                  <MessageCircle className="h-4 w-4 fill-black" />
                  <span>Discuss This Package on WhatsApp →</span>
                </a>

                <a
                  href={resolvedResultPackage.exploreHref}
                  onClick={() => {
                    logQuizFunnelEvent({
                      type: 'package_explored',
                      entryPage,
                      channel: originalChannel,
                      metadata: { packageId: recommendation.primaryPackage.id },
                    });
                    onClose();
                  }}
                  className="flex min-h-[52px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition"
                >
                  <span>Explore This Package →</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* 5.3 SECONDARY RECOMMENDATION / AI MINI-SERIES FEATURE SECTION */}
            <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-[#141821] to-[#0b0e12] p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                  <Film className="h-4 w-4" />
                  <span>
                    {recommendation.aiMiniSeriesOpportunity
                      ? 'High-Impact Creative Opportunity'
                      : 'Creative Format Discovery'}
                  </span>
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs text-white/75">
                  {recommendation.miniSeriesPackage.formattedPrice} · {recommendation.miniSeriesPackage.quantity} videos/mo
                </span>
              </div>

              <h3 className="font-display text-xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
                YOUR BRAND COULD BE THE STAR OF ITS OWN SERIES.
              </h3>

              <p className="text-sm sm:text-base text-white/75 leading-relaxed">
                When every competitor in your market posts the same direct "Buy Now" pitch, audiences scroll past. An{' '}
                <strong className="text-white">Advibe AI Promotional Mini-Series</strong> turns{' '}
                <strong className="text-white">{completedAssessment.businessName}</strong> into episodic entertainment people actually look forward to watching:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <strong className="text-[#f5a524] block mb-1">1. Capture Attention in Crowded Feeds</strong>
                  <p className="text-white/70">
                    Hook viewers in the first 3 seconds with relatable drama, humour, or unexpected twists instead of another sales flyer.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <strong className="text-[#f5a524] block mb-1">2. Recurring Characters & Storylines</strong>
                  <p className="text-white/70">
                    Create recognisable characters your customers remember and associate with your brand every week.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <strong className="text-[#f5a524] block mb-1">3. Entertain While Promoting Naturally</strong>
                  <p className="text-white/70">
                    Weave what {completedAssessment.businessName} sells into the story resolution so viewers see its real-life value.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <strong className="text-[#f5a524] block mb-1">4. Make Viewers Curious for Episode 2</strong>
                  <p className="text-white/70">
                    Connected multi-part arcs train your audience to follow your page and share episodes on WhatsApp and TikTok.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
                <p className="text-xs text-white/60">
                  Includes {recommendation.miniSeriesPackage.quantity} monthly episodes/videos, script & 1-page creative brief before every production.
                </p>
                <a
                  href="#/promotional-mini-series"
                  onClick={() => {
                    logQuizFunnelEvent({
                      type: 'package_explored',
                      entryPage,
                      channel: originalChannel,
                      metadata: { packageId: 'promotional-mini-series' },
                    });
                    onClose();
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#f5a524]/50 bg-[#f5a524]/15 px-5 font-display text-xs font-bold uppercase tracking-wider text-[#f5a524] hover:bg-[#f5a524] hover:text-black transition"
                >
                  <span>Explore Our AI Mini-Series →</span>
                </a>
              </div>
            </div>

            {/* 5.4 VALUE OF CONSISTENT CONTENT SECTION */}
            <div className="rounded-3xl border border-white/12 bg-white/[0.02] p-6 sm:p-8 space-y-4">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                Why Consistency Wins
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase text-white">
                YOUR BRAND SHOULDN'T DISAPPEAR AFTER ONE ADVERTISEMENT.
              </h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Many businesses run a single promotion, post once or twice, and then go silent for weeks. In that quiet gap, potential customers see competitors who keep showing up with helpful, entertaining, and persuasive videos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="font-display text-sm font-bold text-white">
                    Organic Content Publishing (Visibility & Trust)
                  </p>
                  <p className="mt-1.5 text-xs text-white/65 leading-relaxed">
                    Regular video posts on Instagram, TikTok, YouTube Shorts, and WhatsApp Status educate your audience, answer objections, and keep {completedAssessment.businessName} top-of-mind when customers are ready to buy.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="font-display text-sm font-bold text-white">
                    Paid Advertising Media (Creative Testing)
                  </p>
                  <p className="mt-1.5 text-xs text-white/65 leading-relaxed">
                    Paid ad budget buys reach, but your video creative determines whether people stop and act. Having multiple fresh hooks and angles prevents ad fatigue and gives your campaigns stronger creative variety.
                  </p>
                </div>
              </div>
            </div>

            {/* 5.5 INTERACTIVE PERSONALISED CONTENT OPPORTUNITY CALCULATOR */}
            <div className="rounded-3xl border border-white/15 bg-[#11151d] p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                    <Calculator className="h-3.5 w-3.5" />
                    <span>Personalised Content Opportunity Calculator</span>
                  </span>
                  <h3 className="mt-1 font-display text-lg sm:text-2xl font-extrabold text-white">
                    Your Monthly Publishing Opportunity Breakdown
                  </h3>
                </div>

                {/* Hypothetical Plan Selector */}
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 p-1">
                  {[
                    { posts: 3, label: '3x / week' },
                    { posts: 5, label: '5x / week (~20/mo)' },
                    { posts: 7, label: 'Daily (~28/mo)' },
                  ].map((plan) => (
                    <button
                      key={plan.posts}
                      type="button"
                      onClick={() => setTargetPostsPerWeek(plan.posts)}
                      className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition cursor-pointer ${
                        targetPostsPerWeek === plan.posts
                          ? 'bg-[#f5a524] text-black'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {plan.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white/50 block">
                    Your Current Estimated Output
                  </span>
                  <p className="mt-1 font-display text-2xl sm:text-3xl font-black text-white">
                    ~{contentOpportunity.currentEstimatedMonthlyPosts}{' '}
                    <span className="text-sm font-normal text-white/60">posts / month</span>
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    Based on: {contentOpportunity.currentFrequencyLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#f5a524]/40 bg-[#f5a524]/10 p-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#f5a524] block font-bold">
                    Hypothetical Consistent Plan
                  </span>
                  <p className="mt-1 font-display text-2xl sm:text-3xl font-black text-[#f5a524]">
                    ~{contentOpportunity.targetMonthlyPosts}{' '}
                    <span className="text-sm font-normal text-white/80">posts / month</span>
                  </p>
                  <p className="mt-1 text-xs text-white/75">
                    Scenario: {contentOpportunity.targetPlanLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 block font-bold">
                    New Publishing Opportunities
                  </span>
                  <p className="mt-1 font-display text-2xl sm:text-3xl font-black text-emerald-300">
                    +{contentOpportunity.additionalMonthlyOpportunities}{' '}
                    <span className="text-sm font-normal text-emerald-200/80">/ month</span>
                  </p>
                  <p className="mt-1 text-xs text-emerald-200/75">
                    +{contentOpportunity.additionalYearlyOpportunities} additional brand touchpoints per year
                  </p>
                </div>
              </div>

              {/* Separate Paid Ad Spend Display (Section 5.5 rule: display separately without promising guaranteed ad-spend savings) */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-white/80">
                    Your Reported Monthly Paid Advertising Spend:{' '}
                    <span className="text-[#f5a524]">{contentOpportunity.reportedAdSpendLabel}</span>
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {contentOpportunity.hasPaidAdSpend
                      ? 'Paid media spend and creative production work together: pairing your ad budget with multiple distinct video hooks and story angles gives your campaigns stronger creative options to test.'
                      : 'Even before scaling paid media spend, publishing consistent video content builds organic discovery and gives you proven creatives ready for paid amplification later.'}
                  </p>
                </div>
              </div>

              <p className="text-[11px] font-mono text-white/45">
                *Note: The figures above represent hypothetical monthly publishing opportunities and brand touchpoints based on your selected posting schedule — not guaranteed views, impressions, or sales.
              </p>
            </div>

            {/* 5.6 POTENTIAL BUSINESS OUTCOMES SECTION */}
            <div className="rounded-3xl border border-white/12 bg-white/[0.02] p-6 sm:p-8 space-y-4">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                Strategic Impact
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase text-white">
                IMAGINE WHAT A MORE CONSISTENT CONTENT STRATEGY COULD DO FOR YOUR BRAND.
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {[
                  {
                    title: 'Stronger Brand Recall',
                    desc: 'Stay familiar so customers think of your business first when they need what you sell.',
                  },
                  {
                    title: 'More Enquiries & DMs',
                    desc: 'Give prospects clear reasons to message your team on WhatsApp and social media.',
                  },
                  {
                    title: 'Better Social Engagement',
                    desc: 'Replace static flyers with dynamic stories and demonstrations people watch to the end.',
                  },
                  {
                    title: 'More Ad Angles to Test',
                    desc: 'Test different hooks, pain points, and customer scenarios to see what resonates best.',
                  },
                  {
                    title: 'Clearer Product Value',
                    desc: 'Show how your offering works in seconds instead of hoping customers read long captions.',
                  },
                  {
                    title: 'Elevated Brand Authority',
                    desc: 'Look as established and trustworthy online as your business is in real life.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-1"
                  >
                    <p className="font-display text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#f5a524] shrink-0" />
                      <span>{item.title}</span>
                    </p>
                    <p className="text-xs text-white/65 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5.7 REDUCING DEPENDENCE ON INFLUENCERS SECTION */}
            <div className="rounded-3xl border border-white/12 bg-white/[0.02] p-6 sm:p-8 space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                Own Your Creative Assets
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase text-white">
                BUILD CONTENT THAT GIVES YOUR BRAND ITS OWN VOICE.
              </h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Influencer collaborations and creator shoutouts can be useful for short-term awareness, but they can also be unpredictable, expensive to repeat, and tied to someone else’s personality rather than your business.
              </p>
              <p className="text-sm text-white/75 leading-relaxed">
                With Advibe Studio, you build your own <strong className="text-white">repeatable content engine</strong> — complete with custom scripts, branded characters, and a permanent library of commissioned video assets that belong to your brand.
              </p>
            </div>

            {/* PART 9: TAILORED MONTHLY RETAINER UPSELL (Suppressed if original channel was monthly-retainer or already primary) */}
            {!recommendation.suppressRetainerUpsell && (
              <div className="rounded-3xl border border-[#f5a524]/40 bg-gradient-to-r from-[#f5a524]/15 via-[#f5a524]/5 to-transparent p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5a524] px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-wider text-black">
                    <Layers className="h-3 w-3" />
                    <span>{recommendation.retainerUpsellAngle.highlight}</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-[#f5a524]">
                    {recommendation.retainerPackage.formattedPrice} · {recommendation.retainerPackage.quantity} Videos / Month
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                  {recommendation.retainerUpsellAngle.headline}
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  {recommendation.retainerUpsellAngle.body}
                </p>

                <div className="pt-1">
                  <a
                    href="#/monthly-content"
                    onClick={() => {
                      logQuizFunnelEvent({
                        type: 'package_explored',
                        entryPage,
                        channel: originalChannel,
                        metadata: { packageId: 'monthly-content' },
                      });
                      onClose();
                    }}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#f5a524]/50 bg-black/40 px-5 font-display text-xs font-bold uppercase tracking-wider text-[#f5a524] hover:bg-[#f5a524] hover:text-black transition"
                  >
                    <span>Explore the Monthly Content Retainer (15 Videos/Mo) →</span>
                  </a>
                </div>
              </div>
            )}

            {/* PART 6: FINAL WHATSAPP CONVERSION SECTION (SINGLE FINAL DESTINATION) */}
            <div className="rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/50 via-[#0f1715] to-[#0b0e12] p-6 sm:p-9 text-center space-y-5 shadow-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-1 font-mono text-xs font-bold uppercase tracking-wider text-emerald-300">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Next Step · Direct Strategy Handoff</span>
              </span>

              <h3 className="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                LET'S TALK ABOUT YOUR BUSINESS.
              </h3>

              <p className="mx-auto max-w-xl text-sm sm:text-base text-white/80 leading-relaxed">
                We've prepared your personalised recommendation. Click below to continue on WhatsApp with your business details and recommended service already filled in.
              </p>

              <div className="pt-2 max-w-lg mx-auto">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppClick}
                  className="flex min-h-[60px] w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-8 font-display text-sm sm:text-base font-extrabold uppercase tracking-wider text-black shadow-[0_15px_40px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400 active:scale-[0.99]"
                >
                  <MessageCircle className="h-5 w-5 fill-black" />
                  <span>CHAT WITH ADVIBE ON WHATSAPP →</span>
                </a>
              </div>

              {whatsappClicked ? (
                <p className="text-xs font-mono text-emerald-300">
                  ✓ WhatsApp opened with your prefilled assessment ({completedAssessment.assessmentId}). Remember to hit Send inside WhatsApp so our creative team receives your brief!
                </p>
              ) : (
                <p className="text-xs font-mono text-white/50">
                  Opens Official Advibe WhatsApp · Prefilled with Reference {completedAssessment.assessmentId}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
