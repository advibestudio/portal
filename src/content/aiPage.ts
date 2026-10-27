/**
 * COPY FOR THE "AI VIDEO ADS: THE FULL BREAKDOWN" PAGE  (the page at  …/#/ai-video)
 * --------------------------------------------------------------------------------
 * Most of that page re-uses what you already edit in the admin (services, process steps, the "problem"
 * lines, packages, headline numbers, client). Only the wording that belongs to this page alone is here.
 * You can edit this file straight on GitHub (open it, click the pencil ✏️, change the words between the
 * quote marks, commit). Words in {curly brackets} are filled in automatically — leave them as they are:
 *   {days}       → delivery days from Settings        {countries} → the countries you sell in
 *
 * ⚠ Only keep statements that are true for your business.
 */
export const aiPage = {
  topTitle: 'AI VIDEO ADS',
  topBack: 'BACK HOME',
  topAll: 'ALL WORK',

  chip: 'AI VIDEO ADS  ·  NO CAMERA CREW  ·  FAST DELIVERY',
  headline: 'Video ads that cost less and',
  headlineAccent: 'arrive faster.',
  lead: 'AdVibe Studio makes AI video ads for businesses in {countries}. No studio, no actors and no camera crew — just a short brief from you, and finished ads in about {days} days.',

  // PART 01 — the problem (the "reality" list re-uses the problem lines you edit in the admin)
  problemTitle: 'THE PROBLEM',
  realityHeading: 'THE REALITY OF VIDEO ADS',
  resultLabel: 'THE RESULT:',
  doHeading: 'WHAT WE DO',
  doPartOne: 'WHAT WE CREATE',
  doPartTwo: 'HOW WE WORK',

  // PART 02
  createTitle: 'WHAT WE CREATE',
  actionHeading: 'SEE IT IN ACTION',
  actionAll: 'VIEW ALL OUR WORK',

  // PART 03
  howTitle: 'HOW IT WORKS',

  // PART 04
  forTitle: 'WHO THIS IS FOR',
  audiences: [
    { title: 'ONLINE SHOPS & FASHION', points: ['Product ads for new drops', 'Sales and Black Friday promos', 'Several versions to test', 'Short videos for WhatsApp Status'] },
    { title: 'RESTAURANTS & FOOD', points: ['Menu and offer promos', 'New-location announcements', 'Festive-season campaigns', 'Delivery and takeaway ads'] },
    { title: 'SERVICE BUSINESSES', points: ['Salons, clinics, schools and studios', 'Explain what you do in 30 seconds', 'Turn viewers into enquiries', 'Simple monthly videos'] },
    { title: 'FINANCE & FINTECH', points: ['Explain a product simply', 'Campaign launches and reminders', 'Clear, trustworthy tone', 'Repeat campaigns without re-filming'] },
    { title: 'REAL ESTATE', points: ['Property and estate promos', 'Launch and open-day announcements', 'Walk-through style stories', 'Ads for several locations'] },
    { title: 'EVENTS & CAMPAIGNS', points: ['Concerts, launches and sales seasons', 'Countdown and reminder videos', 'Quick turnaround before the date', 'Versions for different countries'] },
  ],

  // PART 05 — savings. Row one (production cost) is computed from your prices; these are the others.
  saveTitle: 'HOW MUCH YOU SAVE',
  costHeading: 'COST COMPARISON',
  colItem: 'ITEM', colTrad: 'TRADITIONAL', colAi: 'WITH ADVIBE',
  costRows: [
    { item: 'Studio rental', trad: 'Charged per day', ours: 'None' },
    { item: 'Equipment', trad: 'Cameras, lights, microphones', ours: 'None needed' },
    { item: 'Editor', trad: 'Hourly or per project', ours: 'Included' },
    { item: 'Script writer', trad: 'Paid per script', ours: 'Included' },
    { item: 'Your time', trad: 'Planning and filming days', ours: 'A short brief' },
  ],
  costBanner: 'ONE PRICE  ·  EVERYTHING ABOVE IS INCLUDED',
  costNote: 'Traditional costs are typical market estimates for {country} and vary a lot. Your quote may differ.',
  timeHeading: 'TIME COMPARISON (PER VIDEO)',
  colTask: 'TASK',
  timeRows: [
    { task: 'Script', trad: 'Written separately', ours: 'Written for you' },
    { task: 'Preparation', trad: 'Crew, props, locations', ours: 'Not needed' },
    { task: 'Filming', trad: 'A shoot day or more', ours: 'None' },
    { task: 'Editing', trad: 'Days of editing', ours: 'Included' },
    { task: 'Changes', trad: 'Re-shoot or re-edit', ours: 'Included, per your package' },
  ],
  timeTotal: { task: 'TOTAL', trad: 'Days to weeks', ours: 'About {days} days' },
  timeBoxes: [
    { big: '{days} days', small: 'Typical delivery' },
    { big: '0', small: 'Camera crews needed' },
    { big: '1 price', small: 'Everything included' },
  ],

  // PART 06
  getTitle: 'EVERYTHING YOU GET',
  getGoalNames: { one: 'SINGLE VIDEO', test: 'TEST SEVERAL ADS', monthly: 'EVERY MONTH' } as Record<string, string>,

  // PART 07
  whyTitle: "WHY WE'RE DIFFERENT",
  why: [
    { title: 'NO CAMERA CREW', body: 'You never need to film anything. Send us a short brief and we handle the script, visuals, voiceover and editing.' },
    { title: 'HONEST, SIMPLE PRICES', body: 'Clear packages with the price shown before you order, in your own currency. Everything is confirmed before production starts.' },
    { title: 'BUILT FOR YOUR MARKET', body: 'Prices, payment methods and sales-season dates for {countries} — so you can run the same ad to different countries.' },
    { title: 'FAST DELIVERY', body: 'Most single videos are delivered in about {days} working days, so you are never late for a sale.' },
    { title: 'A TEAM YOU CAN MESSAGE', body: 'Chat with our team on WhatsApp. Real people answer, and quick changes are part of the process.' },
    { title: 'TRUSTED BY REPEAT CLIENTS', body: '{client} — a fintech — is one of our major clients. We have delivered campaign after campaign for them, because we deliver.' },
  ],

  // Closing call to action
  ctaHeading: 'READY FOR YOUR FIRST VIDEO AD?',
  ctaText: 'Your competitors are posting every day. Tell us what you want to promote and our team will walk you through the best way to do it — free.',
  ctaMicro: ['Free', 'No obligation', 'We reply on WhatsApp'],
  footer: '© {year} {brand}. AI-assisted production, human-directed creative.',
};

/** Fills the {placeholders} used in the copy above. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
