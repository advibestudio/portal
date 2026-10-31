import type { CommercialOfferPage } from './types';

export const defaultCommercialOffers: Record<'monthly-content' | 'promotional-mini-series', CommercialOfferPage> = {
  'monthly-content': {
    id: 'monthly-content',
    slug: 'monthly-content',
    name: 'Monthly AI Video Content Retainer',
    shortLabel: 'Monthly Retainer',
    tagline: 'Your brand’s on-demand creative studio for consistent video content.',
    active: true,
    showOnHomepage: true,
    price: 250000,
    monthlyVideoQuantity: 15,
    pricesByCountry: {
      NG: 250000,
      GH: 3000,
      KE: 42000,
      US: 899,
      UK: 699,
    },
    hero: {
      eyebrow: "YOUR BRAND'S ON-DEMAND CREATIVE STUDIO",
      headline: 'What If You Had an Entire Creative Team Working on Your Brand for the Cost of One Hire?',
      subheadline:
        'You already know your business needs great video content. The challenge is finding the time, fresh ideas, and reliable creative capacity to keep producing it.\n\nWith AdVibe Studios, you get a managed creative partner that develops ideas, writes scripts, and produces engaging videos to help your brand show up consistently—without the burden of building and managing your own production team.',
      primaryCta: 'Book a Free Strategy Call',
      secondaryCta: 'Chat With Us on WhatsApp',
      contextNote: 'Tell us a little about your business first. We’ll use that context to make your strategy conversation more useful.',
    },
    problem: {
      heading: 'Your Business Is Growing. Why Does Creating Content Still Feel Like Another Full-Time Job?',
      paragraphs: [
        'You know you should be posting more videos. You see other brands showing up with product videos, creative campaigns, educational content, and engaging social posts. You want your business to have that same presence.',
        'But then reality sets in.',
        'You have a business to run. Customers to serve. Staff to manage. Operations to oversee. Sales to close.',
        'Some weeks, you have great content ideas. Other weeks, you have no idea what to post. You might hire someone to help, only to find yourself spending time supervising, correcting, explaining, and chasing deliverables.',
        'And when content production depends on one person’s time, skill, or availability, your brand’s visibility can depend on that one person, too.',
      ],
      highlight: 'Your business shouldn’t have to choose between running the company and showing up consistently online.',
    },
    amplify: {
      heading: 'Every Month You Go Quiet Is Another Month Your Competitors Get to Be Remembered.',
      paragraphs: [
        'Your potential customers are constantly seeing other businesses. Other brands are introducing products, explaining their value, demonstrating their expertise, and giving people reasons to pay attention.',
        'Meanwhile, your business may have something genuinely valuable to offer—but if your content is inconsistent, that value can be harder for potential customers to discover and remember.',
        'The answer isn’t posting for the sake of posting. It’s having a reliable creative process that turns your products, services, ideas, and expertise into content worth watching.',
      ],
      callout: 'You don’t need another responsibility on your plate. You need a team that helps take this responsibility off it.',
    },
    solution: {
      heading: 'Not Just One Person With a Camera. An Entire Creative Studio Behind Your Brand.',
      paragraphs: [
        'Imagine having a team that can help develop ideas, shape your message, write scripts, plan creative concepts, produce videos, and refine the finished work—working together to help your brand communicate more effectively.',
        'That’s the advantage of working with AdVibe Studios.',
        'Instead of depending on one employee to handle every part of video production, you work with a creative studio built around producing engaging AI-assisted video content.',
        'We bring creative thinking, scripting, visual direction, AI-assisted production, and editing into one managed monthly service.',
        'You tell us about your business, your customers, your goals, and what you want to promote. We help turn that information into a planned stream of video content.',
        'You stay focused on running your business while your creative partner helps your brand keep showing up.',
      ],
    },
    valueComparison: {
      heading: 'Why Build a One-Person Content Department When You Can Work With a Whole Studio?',
      paragraphs: [
        'Hiring one person can be useful. But that person may be expected to develop ideas, write scripts, produce videos, edit footage, and manage the entire content process.',
        'That’s a lot of responsibility for one role—and a lot of dependence on one person’s capacity.',
        'For a monthly cost comparable to one hire in some businesses, AdVibe gives you access to a broader creative production capability instead of asking one individual to do everything.',
      ],
      includedList: [
        '15 videos every month to support your agreed content plan.',
        'Creative ideation to develop fresh angles for your business.',
        'Scriptwriting and messaging tailored to your brand and audience.',
        'AI-assisted video production shaped around the agreed creative direction.',
        'Editing and finishing to prepare videos for their intended use.',
        'A managed creative workflow so you don’t have to coordinate every production task yourself.',
      ],
      conclusion: 'You’re not simply paying for a folder of videos. You’re paying for creative capacity, a production process, and a team you can work with.',
    },
    whatWeCreate: {
      heading: 'More Than Product Videos. More Ways to Tell Your Brand’s Story.',
      intro: 'Depending on your goals and agreed monthly plan, your content can include:',
      categories: [
        {
          title: 'Product and service promotions',
          desc: 'Show people what you offer, how it works, and why it matters.',
        },
        {
          title: 'Educational and explainer videos',
          desc: 'Break down complex ideas, answer common customer questions, and demonstrate your expertise.',
        },
        {
          title: 'Lifestyle and scenario-based content',
          desc: 'Present your products or services in relatable situations your audience can recognise.',
        },
        {
          title: 'Campaign and offer videos',
          desc: 'Give launches, seasonal promotions, and special offers a more engaging visual presentation.',
        },
        {
          title: 'Brand storytelling and creative concepts',
          desc: 'Move beyond repetitive sales messages with videos that communicate your brand’s personality and values.',
        },
      ],
      conclusion: 'Every video should have a purpose. We work with you to align your content with your brand, audience, and business objectives.',
    },
    process: {
      heading: 'No Guesswork. You’ll Know What We’re Making Before We Make It.',
      intro: 'You see and approve the creative direction before production resources are committed.',
      steps: [
        {
          step: 1,
          title: 'Tell Us About Your Business',
          desc: 'Complete the short lead form and book a strategy call. Tell us what you sell, who you serve, and what you want your content to accomplish.',
        },
        {
          step: 2,
          title: 'Develop Your Content Direction',
          desc: 'We discuss your brand, audience, goals, preferred formats, and content priorities to determine the most appropriate creative approach.',
        },
        {
          step: 3,
          title: 'Review the Script and One-Page Creative Brief',
          desc: 'Before production begins, we send you the script and a concise one-page creative brief. The brief is designed to be quick to consume and helps you understand the idea, message, intended scenes or visual direction, and how the video fits your brand. This gives you a clear opportunity to review what we’re proposing before production starts.',
        },
        {
          step: 4,
          title: 'Produce the Approved Direction',
          desc: 'Once the script and brief are approved, we create the video through the agreed production workflow.',
        },
        {
          step: 5,
          title: 'One Revision Round Per Video',
          desc: 'Each video includes one consolidated revision round within the agreed scope. Please send clear, combined feedback for that round. Substantial changes after approval can require new scripts, scenes, character creation, or voice generation, so they may fall outside the included revision and require a separate agreement.',
        },
        {
          step: 6,
          title: 'Receive Your Videos and Covered Assets',
          desc: 'We deliver the completed videos and agreed assets in the formats and timeline set out in your service agreement.',
        },
      ],
      briefMockupSample: {
        title: 'Illustrative One-Page Creative Brief (Sample)',
        brand: 'Lush Apparel Co.',
        objective: 'Drive discovery for new seasonal collection across TikTok & Instagram Reels',
        audience: 'Fashion-forward young professionals (ages 22-38) in urban centers',
        hookAngle: 'Contrast traditional tailoring delays with instantaneous luxury delivery',
        visualDirection: 'High-fashion editorial lighting, dynamic camera push-in, rich textile textures',
        soundStyle: 'Subtle Afro-fusion baseline with crisp foley fabric rustles and clear voiceover',
        callToAction: 'Shop the Drop with 48h Nationwide Delivery',
      },
    },
    revisionPolicy: {
      heading: 'One focused revision round per video',
      body: 'Every video includes one consolidated revision round within the agreed scope. We send the script and one-page brief for review before production so the direction is clear from the start. Major changes after approval can require rescripting, new scenes, new characters, or regenerated voice/audio, and may need a separate agreement.',
      notes: [
        'Consolidate feedback into one clear set of notes per video.',
        'Minor pacing, caption, audio level, or font tweaks are included in the revision round.',
        'Complete conceptual overhauls after script approval require a separate production agreement.',
      ],
    },
    ownership: {
      heading: 'The Videos We Create for You Are Built to Become Your Brand’s Assets.',
      paragraphs: [
        'We want you to build a valuable content library for your business—not become dependent on us just to keep using the work we’ve produced.',
        'Under the signed agreement, your brand owns the commissioned video deliverables and project-specific assets covered by that agreement. Depending on the agreed scope, these may include finished videos, client-specific scripts, generated visuals, generated voice/audio files, and other agreed production materials.',
        'Before production, we’ll clarify which source and project files are delivered and any restrictions that apply to third-party tools or assets.',
        'Your content should be an asset your business can continue using under the agreed rights—not just a post that disappears into last month’s feed.',
      ],
      clarification: 'Client owns commissioned deliverables and covered custom scripts/audio under the signed agreement. Third-party software and AI model engines remain licensed per standard vendor terms.',
    },
    circlesFundMeProof: {
      heading: 'Real Work. Real Creative Collaboration.',
      body: 'AdVibe Studios has worked with CirclesFundMe, a brand in the digital savings and loans space. Explore selected videos we’ve produced for the company and see our creative work in action.',
      ctaText: 'Watch Our Work for CirclesFundMe',
      featuredVideoIds: ['dQw4w9WgXcQ'],
    },
    offerSummary: {
      heading: 'Give Your Brand the Creative Support It Deserves.',
      packageTitle: 'ADVIBE MONTHLY VIDEO CONTENT RETAINER',
      inclusions: [
        '15 videos every month (up to 1 minute 30 seconds max duration per video).',
        'Creative ideation and agreed content planning.',
        'Scriptwriting and creative development.',
        'A script and one-page creative brief for review before production.',
        'AI-assisted video production and editing.',
        'One consolidated revision round per video within the agreed scope.',
        'Delivery of commissioned video assets and covered project-specific assets under the signed agreement.',
        'A defined monthly production workflow.',
      ],
      disclaimer: 'Video formats, durations, timelines, revision boundaries, source-file delivery, and any exclusions will be agreed before production begins.',
      primaryCta: 'Book My Free Strategy Call',
      secondaryCta: 'Discuss My Content on WhatsApp',
    },
    faqs: [
      {
        id: 'r-f1',
        q: 'Do I need to know anything about AI video production?',
        a: 'No. Tell us about your business and your goals. We manage the agreed creative production process for you.',
        visible: true,
      },
      {
        id: 'r-f2',
        q: 'Is AdVibe the same as hiring a video editor?',
        a: 'No. The service combines creative development, scripting, visual direction, and AI-assisted video production in a managed monthly service. Rather than depending entirely on one person to perform every task, you work with a creative studio.',
        visible: true,
      },
      {
        id: 'r-f3',
        q: 'How many videos do I receive, and what is the maximum duration?',
        a: 'Your package includes 15 videos per month, with each video up to a maximum duration of 1 minute 30 seconds. The exact formats and pacing are tailored to your campaign needs and package scope.',
        visible: true,
      },
      {
        id: 'r-f4',
        q: 'Will I see the script before you start making the video?',
        a: 'Yes. We send the script and a concise one-page creative brief for your review before production begins. This helps you understand the direction before production resources are committed.',
        visible: true,
      },
      {
        id: 'r-f5',
        q: 'How many revisions are included?',
        a: 'Each video includes one consolidated revision round within the agreed scope. Extensive changes can require rescripting, new scenes, new characters, or regenerated voice/audio, so major changes after approval may require a separate agreement.',
        visible: true,
      },
      {
        id: 'r-f6',
        q: 'Can I use the videos on my social media pages and in my marketing?',
        a: 'Your ownership and usage rights are set out in the agreement. We will clarify applicable third-party restrictions before production.',
        visible: true,
      },
      {
        id: 'r-f7',
        q: 'Do you guarantee sales or viral videos?',
        a: 'No responsible creative partner can guarantee that every video will go viral or produce a specific amount of sales. Our focus is on creating content with a clear creative purpose, aligned with your business goals.',
        visible: true,
      },
      {
        id: 'r-f8',
        q: 'What happens after I submit my details?',
        a: 'We’ll use your information to understand your business, then help you arrange a strategy call or continue the conversation on WhatsApp.',
        visible: true,
      },
    ],
    finalCta: {
      heading: 'Your Business Has Enough to Manage. Let Your Creative Production Become One Less Thing to Worry About.',
      paragraphs: [
        'You don’t have to build an entire content team before your brand can show up consistently.',
        'Let’s talk about your business, your audience, and what 15 strategically planned videos each month could look like for you.',
      ],
      primaryCta: 'Book My Free Strategy Call',
      secondaryCta: 'Start a WhatsApp Conversation',
      note: 'First, tell us a little about your business. We’ll take it from there.',
    },
    seo: {
      title: 'Monthly AI Video Content Retainer — AdVibe Studios',
      description: 'Get an entire creative studio behind your brand for the cost of one hire. 15 strategic videos per month.',
    },
  },

  'promotional-mini-series': {
    id: 'promotional-mini-series',
    slug: 'promotional-mini-series',
    name: 'AI Promotional Mini Series',
    shortLabel: 'Mini Series',
    tagline: 'Branded entertainment and story worlds people want to watch.',
    active: true,
    showOnHomepage: true,
    price: 300000,
    monthlyVideoQuantity: 15,
    pricesByCountry: {
      NG: 300000,
      GH: 3500,
      KE: 50000,
      US: 1099,
      UK: 849,
    },
    hero: {
      eyebrow: 'BRANDED ENTERTAINMENT BY ADVIBE STUDIOS',
      headline: 'Stop Making Every Post an Advertisement. Start Creating Stories People Want to Watch.',
      subheadline:
        'Your brand has more to offer than another discount, product announcement, or "Buy Now" post.\n\nWhat if your audience could meet memorable characters, follow an intriguing story, laugh at familiar situations, or look forward to the next episode—while your brand becomes part of the experience?\n\nAdVibe Studios helps brands turn their products, services, and brand identity into original AI-assisted promotional mini-series and cinematic short films.',
      primaryCta: 'Book a Mini-Series Strategy Call',
      secondaryCta: 'Chat With Us on WhatsApp',
      contextNote: 'Tell us about your brand and the kind of story you want people to remember.',
    },
    problem: {
      heading: 'Your Audience Doesn’t Need Another Brand Asking Them to Buy Something.',
      paragraphs: [
        'Think about the content people scroll past every day.',
        'Buy this. Try that. Limited offer. New arrival. Don’t miss out.',
        'Your business may have an excellent product or service. You may be better than your competitors in important ways. But when every post is another direct sales pitch, it can be difficult to create a distinctive identity or give people a reason to return for more.',
        'You can keep increasing the volume of promotional posts. You can keep changing the graphics and trying new captions.',
        'Or you can explore a different creative approach.',
      ],
      highlight: 'What if your brand didn’t just interrupt what people were watching? What if it gave them something worth watching?',
    },
    amplify: {
      heading: 'People Can See Your Advertisement Without Remembering Your Brand.',
      paragraphs: [
        'A view doesn’t automatically create a connection. An impression doesn’t automatically make someone remember you. And a promotional post isn’t necessarily something an audience wants to revisit.',
        'If your content is interchangeable with what every competitor publishes, you have fewer opportunities to build a recognisable creative identity.',
        'Your brand deserves more than a collection of disconnected sales messages.',
        'It deserves a way to express its personality, values, and promise through content that feels distinctive.',
      ],
      callout: 'This doesn’t mean abandoning direct promotions. It means adding another creative asset to your marketing: stories that give people a reason to spend time with your brand.',
    },
    solution: {
      heading: 'Imagine Your Brand as the World Behind a Story People Look Forward to.',
      paragraphs: [
        'The possibilities depend on your audience, your brand, your offer, and the stories worth telling.',
        'At AdVibe Studios, we develop original concepts, scripts, characters, and episode ideas designed around your business. We then use AI-assisted production to bring those ideas to life as branded video content.',
        'Your product doesn’t have to be forced into every line of dialogue. Your brand can be integrated into the setting, characters, situations, central conflict, or resolution in ways that make sense for the story.',
        'The aim is to create entertainment that can carry your brand message—not disguise an ordinary sales pitch as a film.',
      ],
      worldExamples: [
        {
          title: 'Fashion & Apparel',
          desc: 'A comedy around friendship, confidence, and the relatable situations people get into when choosing what to wear.',
        },
        {
          title: 'Food & Dining',
          desc: 'A relatable drama around family, ambition, relationships, and the central role food plays in everyday life.',
        },
        {
          title: 'Real Estate & Properties',
          desc: 'Stories about the emotional meaning of home, family decisions, aspirations, and the journey toward property ownership.',
        },
        {
          title: 'Finance & Fintech',
          desc: 'Character-driven stories about everyday money choices, entrepreneurial grit, and the consequences of financial decisions.',
        },
      ],
    },
    whatWeCreate: {
      heading: 'Your Own Branded Mini-Series, Produced Every Month.',
      intro: 'The AdVibe Promotional Mini Series service combines creative storytelling with managed video production:',
      categories: [
        {
          title: 'Original story development',
          desc: 'We develop a concept based on your business, audience, positioning, and creative goals.',
        },
        {
          title: 'Scriptwriting',
          desc: 'We shape the ideas into stories with relatable situations, dialogue, tension, humour, emotion, or intrigue where appropriate.',
        },
        {
          title: 'Characters and continuity',
          desc: 'We plan recurring characters and a coherent creative direction so episodes feel connected rather than like unrelated clips.',
        },
        {
          title: 'A script and one-page creative brief before production',
          desc: 'Before production starts, we send the script and a concise one-page brief so you can quickly understand the story, intended message, visual direction, and planned execution. You review the direction before we begin producing the video.',
        },
        {
          title: 'AI-assisted production',
          desc: 'We turn approved concepts and scripts into finished video content using the agreed visual and production approach.',
        },
        {
          title: '15 videos every month (up to 2 minutes each)',
          desc: 'Your monthly output is planned around the agreed mini-series concept and episode structure, with a maximum time duration of 2 minutes per episode/video.',
        },
        {
          title: 'Editing and delivery',
          desc: 'We prepare the videos in the agreed formats and deliver the commissioned assets under your service agreement.',
        },
      ],
    },
    process: {
      heading: 'From Brand Brief to Your First Episode—and Beyond.',
      intro: 'A deliberate, transparent production checkpoint at every stage:',
      steps: [
        {
          step: 1,
          title: 'Tell Us About Your Brand',
          desc: 'Share your business, audience, products, brand values, and the audience response you hope to encourage.',
        },
        {
          step: 2,
          title: 'Develop the Concept',
          desc: 'We explore possible story worlds, themes, characters, and creative directions that fit your brand.',
        },
        {
          step: 3,
          title: 'Review the Script and One-Page Creative Brief',
          desc: 'Before production begins, we send the script and a concise one-page brief. It is designed to be quick to consume and makes the intended story, message, visual direction, and planned execution clear. You have the opportunity to review and approve the direction before production begins.',
        },
        {
          step: 4,
          title: 'Produce the Approved Direction',
          desc: 'We bring the approved ideas to life using the agreed AI-assisted production workflow.',
        },
        {
          step: 5,
          title: 'One Revision Round Per Video',
          desc: 'Each video includes one consolidated revision round within the agreed scope. Major changes after approval can require rescripting, new scene creation, character regeneration, and voice/audio regeneration. Those changes can go beyond the included revision and may require a separate agreement.',
        },
        {
          step: 6,
          title: 'Review and Delivery',
          desc: 'You review the videos within the agreed revision process, and we deliver the completed work and covered assets.',
        },
      ],
      briefMockupSample: {
        title: 'Illustrative Mini-Series Episode Brief (Sample)',
        brand: 'CirclesFundMe',
        objective: 'Episode 03: Demystifying emergency loans without predatory interest anxiety',
        audience: 'SME owners and young professionals seeking dependable cooperative savings',
        hookAngle: 'A boutique founder faces unexpected stock arrival costs 48h before weekend sales',
        visualDirection: 'Warm cinematic bokeh, realistic commercial lighting, expressive facial close-ups',
        soundStyle: 'Subtle ambient Lagos café soundscape, upbeat confident resolution sting',
        callToAction: 'Lock In Your Emergency Savings Pool on CirclesFundMe',
      },
    },
    revisionPolicy: {
      heading: 'One focused revision round per video',
      body: 'Each video includes one consolidated revision round within the agreed scope. Major changes after approval can require rescripting, new scenes, new characters, or regenerated voice/audio. Those changes go beyond the included revision and may require a separate agreement.',
      notes: [
        'Consolidate feedback into one clear set of notes per episode.',
        'Review the script and one-page brief closely during Step 3 before visual generation begins.',
        'Significant character face or scene environment changes after final approval require new generation cycles.',
      ],
    },
    ownership: {
      heading: 'Build Something Your Brand Can Own.',
      paragraphs: [
        'The mini-series is created around your brand, with a clear agreement on deliverables and ownership rights.',
        'Under the signed contract, your brand owns the commissioned deliverables and project-specific assets covered by the agreement. Depending on the agreed scope, these may include finished episodes, client-specific scripts, approved story concepts, created visuals, generated voice/audio files, and other agreed production materials.',
        'We will also define the delivery of available source files, character materials, and other production assets, subject to applicable third-party tool terms.',
        'The goal is to give your brand a valuable library of commissioned creative work it can continue using under its agreed rights—not leave ownership unclear.',
      ],
      clarification: 'Client owns commissioned episodes, custom characters, and specific storylines under the signed agreement. General AI model weights and proprietary editing workflows remain with respective platform licensors.',
    },
    circlesFundMeProof: {
      heading: 'Storytelling and Video Production for Real Brands.',
      body: 'AdVibe Studios has worked with CirclesFundMe, a brand in the digital savings and loans space. Explore selected videos we’ve produced for the company and see our creative work in action.',
      ctaText: 'Watch Our Work for CirclesFundMe',
      featuredVideoIds: ['dQw4w9WgXcQ'],
    },
    offerSummary: {
      heading: 'Give People More Reasons to Remember Your Brand.',
      packageTitle: 'ADVIBE AI PROMOTIONAL MINI SERIES',
      inclusions: [
        '15 videos per month (up to 2 minutes max duration per episode/video).',
        'Original story and creative concept development.',
        'Scriptwriting and episode planning.',
        'Character and continuity planning.',
        'A script and one-page creative brief for review before production.',
        'AI-assisted video production and editing.',
        'One consolidated revision round per video within the agreed scope.',
        'Delivery of commissioned videos and covered project-specific assets under the signed agreement.',
      ],
      disclaimer: 'The final episode structure, duration, production complexity, delivery schedule, revision boundaries, and source-file delivery will be confirmed during your strategy call and service agreement.',
      primaryCta: 'Book My Mini-Series Strategy Call',
      secondaryCta: 'Discuss My Brand on WhatsApp',
    },
    faqs: [
      {
        id: 'ms-f1',
        q: 'Will every video be a direct advertisement for my product?',
        a: 'Not necessarily. The creative direction may integrate your product, service, values, or brand identity naturally into the story. The approach depends on your goals and the agreed concept.',
        visible: true,
      },
      {
        id: 'ms-f2',
        q: 'What kinds of businesses can use a promotional mini-series?',
        a: 'Fashion, beauty, food, lifestyle, consumer products, real estate, education, financial services, and other businesses can explore this approach when a suitable story can be built around their brand. We assess suitability during the strategy call.',
        visible: true,
      },
      {
        id: 'ms-f3',
        q: 'Do I get 15 episodes every month, and what is the maximum duration?',
        a: 'Your package includes 15 videos per month, with a maximum time duration of 2 minutes per video/episode. Whether those videos form 15 episodic installments or a mix of longer episodes and supporting story cuts depends on the creative concept and production scope.',
        visible: true,
      },
      {
        id: 'ms-f4',
        q: 'Will I see the script before production?',
        a: 'Yes. We send the script and a concise one-page creative brief for review before production begins.',
        visible: true,
      },
      {
        id: 'ms-f5',
        q: 'How many revisions are included?',
        a: 'Each video includes one consolidated revision round within the agreed scope. Extensive changes can require rescripting, new scenes, new characters, or regenerated voice/audio, and may require a separate agreement.',
        visible: true,
      },
      {
        id: 'ms-f6',
        q: 'Do I own the characters, scripts, voice files, and videos?',
        a: 'Your ownership rights for commissioned work and covered project-specific assets are defined in your agreement. We will explain any limitations that apply to third-party tools or assets before production.',
        visible: true,
      },
      {
        id: 'ms-f7',
        q: 'Can the series help my business sell more?',
        a: 'It can support brand awareness, audience engagement, and product communication, but sales depend on many factors, including your offer, audience, distribution, and conversion process. We do not guarantee a particular sales outcome.',
        visible: true,
      },
      {
        id: 'ms-f8',
        q: 'What happens when I contact AdVibe?',
        a: 'You’ll share a few details about your brand, then arrange a strategy call or continue the conversation on WhatsApp so we can understand your goals and assess the best approach.',
        visible: true,
      },
    ],
    finalCta: {
      heading: 'Your Brand Has a Story to Tell. Let’s Build One Worth Watching.',
      paragraphs: [
        'Your audience doesn’t have to encounter your brand only when you ask them to buy.',
        'Let’s explore what an original mini-series could look like for your business—from the first concept to the characters, episodes, and brand integration.',
      ],
      primaryCta: 'Book My Mini-Series Strategy Call',
      secondaryCta: 'Chat With AdVibe on WhatsApp',
      note: 'Share your details so we can understand your brand before we talk.',
    },
    seo: {
      title: 'AI Promotional Mini Series — AdVibe Studios',
      description: 'Stop making every post an ad. Start creating story-driven branded entertainment people want to watch. 15 videos per month.',
    },
  },
};
