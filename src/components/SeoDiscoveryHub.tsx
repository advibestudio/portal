import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

export interface SeoDiscoveryHubProps {
  onSelectTopic?: (topicTitle: string) => void;
}

interface PillarCapability {
  index: string;
  title: string;
  meta: string;
  summary: string;
  searchIntentTerms: string[];
  ctaLabel: string;
  offerContext: string;
}

interface PillarSection {
  id: 'tools' | 'production' | 'marketing' | 'regions';
  tabLabel: string;
  editorialTitle: string;
  editorialSubtitle: string;
  capabilities: PillarCapability[];
}

const SEO_PILLARS: PillarSection[] = [
  {
    id: 'tools',
    tabLabel: '01. AI Video Tools & Studio',
    editorialTitle: 'Done-For-You Alternative to DIY AI Video Generation Tools',
    editorialSubtitle:
      'Searching for an AI video generator, text-to-video software, or image-to-video tool? Instead of spending weeks wrestling with prompts, broken lip-sync, and watermarked software subscriptions, our studio directs and delivers broadcast-ready commercials for you in 5 working days.',
    capabilities: [
      {
        index: '01.1',
        title: 'Text-to-Video & Image-to-Video Commercial Direction',
        meta: 'Enterprise AI Models · Custom Scripting · 1080p HD Master',
        summary:
          'We combine top generative video models with human creative direction to turn your product photos, brand guidelines, or text briefs into photorealistic video commercials—zero prompt engineering required on your end.',
        searchIntentTerms: [
          'Text to video AI generator',
          'Image to video AI commercial maker',
          'AI product video generator',
          'Done-for-you AI video creation',
        ],
        ctaLabel: 'Commission a Custom AI Video',
        offerContext: 'Single Video Ad (Text/Image to Video)',
      },
      {
        index: '01.2',
        title: 'AI UGC Video Maker & Consistent Character Studio',
        meta: 'Natural Voice Synthesis · Cultural Authenticity · Multi-Scene Continuity',
        summary:
          'Unlike generic AI avatar tools that look robotic, we engineer believable, culturally relatable spokespeople and recurring characters with natural Nigerian, Ghanaian, Kenyan, British, and American voiceovers.',
        searchIntentTerms: [
          'AI UGC video generator',
          'AI spokesperson & avatar video studio',
          'AI voiceover commercial production',
          'Consistent character AI filmmaking',
        ],
        ctaLabel: 'Request UGC Creative Pack',
        offerContext: '5 Creative Test Pack (AI UGC & Spokesperson)',
      },
      {
        index: '01.3',
        title: 'Learn AI Video Generation Tools In-House (AdVibe Academy)',
        meta: 'Live Practical Cohort · Business & Creator Tracks · Founding Tuition',
        summary:
          'Want to master the exact AI video generation tools, prompt frameworks, character continuity workflows, and editing pipelines our studio uses? Join our live hands-on training cohort.',
        searchIntentTerms: [
          'Best AI video generation course',
          'How to use AI video generator tools',
          'AI filmmaking & ad directing academy',
          'In-house AI video team training',
        ],
        ctaLabel: 'Explore Training Academy',
        offerContext: 'AI Video Directing Training Academy',
      },
    ],
  },
  {
    id: 'production',
    tabLabel: '02. Video Production Agency',
    editorialTitle: 'Full-Service AI Video Production Agency & Commercial Studio',
    editorialSubtitle:
      'We deliver everything a traditional commercial video production house provides—scriptwriting, storyboarding, casting, voice acting, foley sound design, and color grading—at 90% lower cost and 5-day turnaround.',
    capabilities: [
      {
        index: '02.1',
        title: 'Product & Service Commercial Video Production',
        meta: '5-Day Turnaround · Up to 2m 30s · 100% Paid Ads Rights',
        summary:
          'High-impact product showcases, fintech app explainers, real estate walkthroughs, healthcare commercials, and hospitality spots engineered to turn cold viewers into paying customers.',
        searchIntentTerms: [
          'Commercial video production agency',
          'Product video production studio',
          'Explainer video production company',
          'Corporate & service video agency',
        ],
        ctaLabel: 'Start Single Video Project',
        offerContext: 'Single Commercial Video Production',
      },
      {
        index: '02.2',
        title: 'Monthly On-Demand Video Content Studio (15 Videos / Month)',
        meta: '15 Custom Videos Monthly · Script + 1-Page Brief · Dedicated Creative Team',
        summary:
          'Replace the cost of hiring an in-house videographer, scriptwriter, and video editor. Receive 15 custom promotional, educational, and lifestyle videos every month with pre-production brief approval.',
        searchIntentTerms: [
          'Monthly video production retainer',
          'Unlimited / on-demand video editing & production agency',
          'Outsourced video production team for brands',
          '15 videos per month content package',
        ],
        ctaLabel: 'View Monthly Content Retainer',
        offerContext: 'Monthly AI Video Content Retainer',
      },
      {
        index: '02.3',
        title: 'AI Promotional Mini-Series & Branded Entertainment Studio',
        meta: '15 Episodic Videos Monthly · Up to 2 Mins Each · Original Story World',
        summary:
          'Combat ad fatigue by turning your brand into an episodic drama, comedy, or suspense mini-series with recurring characters that audiences binge-watch and share organically.',
        searchIntentTerms: [
          'Branded entertainment production agency',
          'AI mini-series production studio',
          'Episodic brand storytelling videos',
          'Cinematic AI animation & film studio',
        ],
        ctaLabel: 'Explore Mini-Series Retainer',
        offerContext: 'AI Promotional Mini-Series Retainer',
      },
    ],
  },
  {
    id: 'marketing',
    tabLabel: '03. Marketing & Ad Agency',
    editorialTitle: 'Direct-Response Video Marketing & Social Advertising Agency',
    editorialSubtitle:
      'Built for media buyers, e-commerce founders, and growth teams running paid campaigns across Meta (Facebook & Instagram), TikTok, YouTube Shorts, and WhatsApp funnels.',
    capabilities: [
      {
        index: '03.1',
        title: 'Facebook, Instagram & TikTok Performance Ad Creatives',
        meta: '3-Second Scroll-Stopping Hooks · Multi-Angle Testing · ROAS Engineered',
        summary:
          'In modern paid social, your creative IS your targeting. Our 5-Pack and 10-Pack creative testing bundles give your media buyer distinct hooks and psychological angles to slash Cost-Per-Acquisition (CPA).',
        searchIntentTerms: [
          'Facebook & Instagram video ads agency',
          'TikTok video ad creative agency',
          'Performance marketing creative studio',
          'E-commerce video marketing agency',
        ],
        ctaLabel: 'Get 5-Ad Creative Test Pack',
        offerContext: '5 Creative Test Pack for Meta/TikTok Ads',
      },
      {
        index: '03.2',
        title: 'WhatsApp Marketing & Conversational Funnel Video Ads',
        meta: 'Verified 1,000+ Chats Case Study · 9:16 Vertical Format · Direct CTA',
        summary:
          'Purpose-built for businesses closing sales on WhatsApp. As proven with CirclesFundMe (1,000+ verified WhatsApp customer conversations at 64% lower cost per chat), our vertical ads drive high-intent inbox leads.',
        searchIntentTerms: [
          'WhatsApp video marketing agency',
          'Click-to-WhatsApp ad creative agency',
          'Lead generation video marketing company',
          'Social media advertising agency for SMEs',
        ],
        ctaLabel: 'Book WhatsApp Funnel Strategy',
        offerContext: 'WhatsApp Conversion Video Ad Strategy',
      },
      {
        index: '03.3',
        title: 'Seasonal Campaign & Product Launch Advertising',
        meta: 'Black Friday · Detty December · Ramadan/Eid · Valentine · New Launches',
        summary:
          'Never miss a peak revenue window waiting on slow production crews. Launch urgent promotional video campaigns for holiday sales, app releases, and event promotions within 5 working days.',
        searchIntentTerms: [
          'Seasonal marketing campaign agency',
          'Black Friday & holiday video ad production',
          'Product launch video marketing agency',
          'Fast-turnaround advertising agency',
        ],
        ctaLabel: 'Plan a Campaign Launch',
        offerContext: 'Seasonal & Campaign Video Ad Pack',
      },
    ],
  },
  {
    id: 'regions',
    tabLabel: '04. Global & Regional Markets',
    editorialTitle: 'Local Cultural Nuance Meets Global Agency Standards',
    editorialSubtitle:
      'Serving high-growth brands across Nigeria, West & East Africa, the United Kingdom, the United States, and English-speaking global markets with localized pricing and culturally native storytelling.',
    capabilities: [
      {
        index: '04.1',
        title: 'Nigeria & West Africa (Lagos, Abuja, Port Harcourt, Accra)',
        meta: 'NGN (₦) & GHS (GH₵) Pricing · Authentic Local Voices · Fast WhatsApp Delivery',
        summary:
          'The premier AI video production and marketing creative studio for Nigerian and Ghanaian fintechs, real estate firms, e-commerce vendors, logistics brands, and corporate enterprises.',
        searchIntentTerms: [
          'AI video production agency in Nigeria',
          'Video production company in Lagos & Abuja',
          'Digital marketing & video ad agency Ghana Accra',
          'Best video advertising agency in West Africa',
        ],
        ctaLabel: 'View NGN / GHS Packages',
        offerContext: 'Nigeria & West Africa Video Production',
      },
      {
        index: '04.2',
        title: 'East Africa & Pan-African Markets (Nairobi, Kenya)',
        meta: 'KES (KSh) Pricing · Mobile-First Vertical Reels · Pan-African Casting',
        summary:
          'Tailored commercial video production and social ad creatives for Kenyan and East African startups, SACCOs, fintech platforms, hospitality brands, and service businesses.',
        searchIntentTerms: [
          'AI video agency in Kenya Nairobi',
          'Commercial video production company Nairobi',
          'Social media video marketing agency East Africa',
          'Affordable video ad studio Africa',
        ],
        ctaLabel: 'View KES Packages',
        offerContext: 'Kenya & East Africa Video Production',
      },
      {
        index: '04.3',
        title: 'United Kingdom, United States & Worldwide English Markets',
        meta: 'USD ($) & GBP (£) Pricing · Agency White-Label · 100% Remote Pipeline',
        summary:
          'High-margin, rapid-turnaround AI video production partner for UK, US, Canadian, and global D2C brands, SaaS startups, and marketing agencies seeking scalable creative testing.',
        searchIntentTerms: [
          'AI video production agency UK & London',
          'AI commercial video studio USA',
          'White-label AI video agency for marketing agencies',
          'Global remote AI video ad studio',
        ],
        ctaLabel: 'Book Global Strategy Call',
        offerContext: 'UK / USA & Global Agency Production',
      },
    ],
  },
];

const SEARCH_INTENT_FAQS = [
  {
    q: 'Should I use an AI video generator tool myself or hire an AI video production agency like AdVibe Studio?',
    a: 'DIY AI video generation tools require paid subscriptions across multiple platforms (text-to-video, voice synthesis, lip-sync, upscaling, and sound design) plus dozens of hours learning prompt engineering and video editing. At AdVibe Studio, our directors handle the entire stack—conversion scriptwriting, consistent character generation, natural voiceover, foley sound design, and commercial editing—delivering a ready-to-run HD video ad in 5 working days starting at ₦35,000 ($119 / £89). Or, if you prefer to build in-house skills, you can join our live AI Video Directing Training Academy.',
  },
  {
    q: 'How does AdVibe Studio compare to a traditional video production company or marketing agency?',
    a: 'Traditional video production agencies charge ₦1.5M–₦5M+ ($2,500–$10,000+) per shoot and take 4 to 8 weeks to coordinate studios, cameras, actors, and locations. AdVibe Studio combines direct-response marketing agency strategy with enterprise AI video production—cutting your production cost by up to 90% and delivering in 5 to 10 working days with full paid-ads ownership.',
  },
  {
    q: 'What types of businesses and industries do you produce AI video ads for?',
    a: 'We produce high-converting product ads, service explainers, UGC-style social ads, seasonal campaign spots, and 15-episode monthly brand mini-series for fintechs (such as CirclesFundMe), e-commerce stores, beauty and skincare brands, real estate companies, healthcare clinics, restaurants, SaaS platforms, and educational brands across Nigeria, Ghana, Kenya, the UK, and the USA.',
  },
  {
    q: 'Do you offer white-label AI video production for digital marketing and media-buying agencies?',
    a: 'Yes. Digital marketing agencies, social media managers, and performance media buyers in Lagos, Accra, Nairobi, London, and New York use our 5 Creative Test Pack, 10 Creative Test Pack, and 15-Video Monthly Content Retainer to supply their clients with scroll-stopping video ad creatives at predictable wholesale economics.',
  },
];

export function SeoDiscoveryHub({ onSelectTopic }: SeoDiscoveryHubProps) {
  const [activePillarId, setActivePillarId] = useState<PillarSection['id']>('tools');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [directoryExpanded, setDirectoryExpanded] = useState(false);

  const activePillar = SEO_PILLARS.find((p) => p.id === activePillarId) || SEO_PILLARS[0];

  const handleAction = (capability: PillarCapability) => {
    if (capability.offerContext === 'AI Video Directing Training Academy') {
      window.location.hash = '#/training';
      return;
    }
    if (capability.offerContext === 'Monthly AI Video Content Retainer') {
      window.location.hash = '#/monthly-content';
      return;
    }
    if (capability.offerContext === 'AI Promotional Mini-Series Retainer') {
      window.location.hash = '#/promotional-mini-series';
      return;
    }
    if (onSelectTopic) {
      onSelectTopic(capability.offerContext);
    } else {
      const pricingEl = document.getElementById('pricing');
      if (pricingEl) {
        pricingEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = '#/book-strategy-session';
      }
    }
  };

  return (
    <section
      id="seo-discovery-hub"
      aria-labelledby="seo-hub-heading"
      className="theme-adaptive border-t border-[#111412]/10 bg-[#f3f4ef] py-20 px-4 sm:px-6 text-[#111412]"
    >
      <div className="mx-auto max-w-6xl space-y-14">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 text-left">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#586159]">
            <span>Search & Capability Index</span>
            <span aria-hidden="true">·</span>
            <span>AI Video Generation</span>
            <span aria-hidden="true">·</span>
            <span>Commercial Video Production</span>
            <span aria-hidden="true">·</span>
            <span>Performance Marketing Agency</span>
          </div>

          <h2
            id="seo-hub-heading"
            className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-[#111412] leading-tight"
            style={{ textWrap: 'balance' }}
          >
            From AI Video Generation Tools to Full-Scale Agency Production
          </h2>

          <p className="text-sm sm:text-base text-[#586159] leading-relaxed">
            Whether you are comparing AI video generators, looking for a commercial video production company, or hiring a performance marketing agency to scale your Facebook, Instagram, TikTok, and WhatsApp ads, explore how AdVibe Studio bridges technology and conversion storytelling.
          </p>
        </div>

        {/* Interactive Pillar Segmented Filter Bar */}
        <div className="space-y-8">
          <div
            role="tablist"
            aria-label="SEO Capability Pillars"
            className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#111412]/10 bg-white p-1.5"
          >
            {SEO_PILLARS.map((pillar) => {
              const isSelected = pillar.id === activePillar.id;
              return (
                <button
                  key={pillar.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActivePillarId(pillar.id)}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#111412] text-white shadow-sm'
                      : 'text-[#586159] hover:text-[#111412] hover:bg-[#faf9f5]'
                  }`}
                >
                  {pillar.tabLabel}
                </button>
              );
            })}
          </div>

          {/* Active Pillar Content */}
          <div className="space-y-8 rounded-2xl border border-[#111412]/10 bg-white p-6 sm:p-10">
            <div className="max-w-3xl space-y-2 border-b border-[#111412]/10 pb-6 text-left">
              <h3
                className="font-display text-xl sm:text-2xl font-bold text-[#111412]"
                style={{ textWrap: 'balance' }}
              >
                {activePillar.editorialTitle}
              </h3>
              <p className="text-sm sm:text-base text-[#586159] leading-relaxed">
                {activePillar.editorialSubtitle}
              </p>
            </div>

            {/* 3-Column Capability Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {activePillar.capabilities.map((cap) => (
                <article
                  key={cap.index}
                  className="flex flex-col justify-between space-y-5 border-b lg:border-b-0 lg:border-r last:border-0 border-[#111412]/10 pb-6 lg:pb-0 lg:pr-6 last:pr-0 text-left"
                >
                  <div className="space-y-3">
                    <div className="text-xs font-mono text-[#a06200]">
                      {cap.index} · {cap.meta}
                    </div>

                    <h4 className="font-display text-lg font-bold text-[#111412] leading-snug">
                      {cap.title}
                    </h4>

                    <p className="text-sm text-[#586159] leading-relaxed">
                      {cap.summary}
                    </p>

                    <div className="pt-2 text-xs text-[#586159]">
                      <span className="font-semibold text-[#111412]">Related Searches: </span>
                      {cap.searchIntentTerms.join(' · ')}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleAction(cap)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#111412] hover:text-[#a06200] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>{cap.ctaLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Search-Intent FAQ Accordion for Rich Snippet & Quality Score */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4 border-t border-[#111412]/10">
          <div className="lg:col-span-5 space-y-3 text-left">
            <div className="text-xs font-medium text-[#586159]">
              <span>Search FAQ</span>
              <span aria-hidden="true"> · </span>
              <span>Tools vs. Studio Comparison</span>
            </div>
            <h3
              className="font-display text-xl sm:text-2xl font-bold text-[#111412]"
              style={{ textWrap: 'balance' }}
            >
              Common Questions From Brands Comparing AI Tools & Marketing Agencies
            </h3>
            <p className="text-sm text-[#586159] leading-relaxed">
              Direct answers for founders, CMOs, and media buyers evaluating AI video software against done-for-you commercial production.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-3">
            {SEARCH_INTENT_FAQS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#111412]/10 bg-white overflow-hidden text-left"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm sm:text-base font-bold text-[#111412] cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180 text-[#a06200]' : 'text-[#586159]'
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-[#586159] leading-relaxed border-t border-[#111412]/5">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Collapsible Complete Search & Keyword Index for Crawlers & Media Buyers */}
        <div className="border-t border-[#111412]/10 pt-6 text-left">
          <button
            type="button"
            aria-expanded={directoryExpanded}
            onClick={() => setDirectoryExpanded(!directoryExpanded)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#586159] hover:text-[#111412] transition-colors cursor-pointer"
          >
            <span>
              {directoryExpanded
                ? 'Hide Complete AI Video, Production & Marketing Keyword Directory'
                : 'View Complete AI Video, Production & Marketing Keyword Directory'}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-150 ${
                directoryExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {directoryExpanded && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 rounded-xl border border-[#111412]/10 bg-white p-6 text-xs text-[#586159] leading-relaxed">
              <div>
                <h4 className="font-bold text-[#111412] mb-2">01. AI Video Generation</h4>
                <p>
                  AI video generator · Text to video AI · Image to video AI · AI commercial generator · AI UGC video maker · AI product video creator · AI spokesperson & avatar video · AI voiceover & lip-sync studio · Done-for-you AI video software alternative
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#111412] mb-2">02. Video Production Studio</h4>
                <p>
                  AI video production agency · Commercial video production company · Product advertisement video studio · Service explainer video production · Brand story & corporate video agency · AI promotional mini-series · Episodic branded entertainment
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#111412] mb-2">03. Marketing & Ad Agency</h4>
                <p>
                  Video marketing agency · Social media video advertising · Facebook & Instagram video ads · TikTok ad creative studio · WhatsApp Status & Click-to-WhatsApp video ads · YouTube Shorts ad production · Direct-response creative testing packs
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#111412] mb-2">04. Markets & Currencies</h4>
                <p>
                  Nigeria (Lagos, Abuja, Port Harcourt — ₦ NGN) · Ghana (Accra, Kumasi — GH₵ GHS) · Kenya (Nairobi, Mombasa — KSh KES) · United Kingdom (London, Manchester — £ GBP) · United States (New York, Austin, Los Angeles — $ USD) · Global Remote Delivery
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
