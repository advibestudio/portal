# ADVIBE STUDIOS: MASTER BUILD SPECIFICATION (for Google AI Studio)

> **Read this entire file first. Then read the attached `advibe-studio.zip` source. Then build.**
> This is an implementation task on an existing production codebase. It is not a request for a mockup, a concept, a questionnaire, or a plan that stops before code.

---

## 0. HOW TO USE THIS DOCUMENT

**Files you should have been given**
1. `advibe-studio.zip`: the existing site. It is the source of truth for code, brand and behaviour.
2. `ADVIBE_SALES_PAGES_MASTER_BRIEF.txt` (the earlier "Sales Pages, Copy & Website Implementation Master Brief", Parts A–D). It defines the two sales pages `#/monthly-content` and `#/promotional-mini-series`. **It is still fully in force.** Section 5 of this file only summarises it and adds to it.
3. This file. **If this file and the earlier brief conflict, this file wins.**

**Rules of engagement**
- Do **not** interview me. All answers are below. Anything unknown is listed in Section 15 as **TBD**. For every TBD, build an **admin-editable, clearly marked placeholder** and move on. Never invent facts, prices, names, testimonials, statistics, credentials or URLs.
- Work in the **milestones in Section 3**, in order. After each milestone, run `npm run lint` (this project's `lint` script is `tsc --noEmit`) and `npm run build`. Fix what you broke before continuing. Do not declare a milestone done without running both.
- Make a short written plan (≤ 40 lines) before M1, then continue straight into code.
- Preserve everything that works. No destructive rewrites. Extend the existing store, content model, Supabase client, public API, tracking, country/currency system, modals and `LivePopups`.
- Quality bar: **beauty is not optional.** This must look like a premium AI media studio designed by a human art director, not a template. Mobile is the primary experience.

---

## 1. GROUND TRUTH ABOUT THE EXISTING PROJECT (already inspected, so verify, don't assume)

**Stack:** React 19, TypeScript, Vite, Tailwind v4 (`@tailwindcss/vite`) plus custom CSS, `motion` (Framer Motion successor), `lucide-react`, Supabase (`@supabase/supabase-js`). Fonts via `@fontsource`: **Bricolage Grotesque Variable** (display), **Figtree Variable** (body), **Instrument Serif** (italic accents), **Caveat** (handwritten notes). Scripts: `dev`, `build`, `lint` (= `tsc --noEmit`).

**Routing:** hash-based in `src/App.tsx` (`useHashRoute`). `#/admin*` lazy-loads `pages/admin/Admin`. `#/ai-video` lazy-loads `AiVideoPage`. Everything else renders `PublicSite`. **Extend this convention. Do not add a router library.** Route additions needed: `#/monthly-content`, `#/promotional-mini-series`, `#/training`, `#/training/business`, `#/training/creators`, and the nested admin routes in Section 9. Every new public page is `React.lazy` so the homepage bundle does not grow. Handle back/forward and scroll-to-top on route change.

**Key files:** `src/components/Wall.tsx` (3D cylinder video wall), `LivePopups.tsx`, `StrategyModal.tsx`, `OrderModal.tsx`, `shared.tsx`; `src/sections/{sections,chrome,CostCompare}.tsx`; `src/content/{types,defaultContent,aiPage,demoUsers}.ts`; `src/lib/{store,publicApi,supabase,money,country,events,useEvents,integrations,tracking,utils}`; `src/pages/{PublicSite,AiVideoPage}.tsx`; `src/pages/admin/{Admin,Content,Markets,LeadsProjects}.tsx`; `src/styles/{studio,casestudy}.css`, `src/index.css`; `supabase/{schema.sql,migration-2-countries.sql,migration-3-strategy.sql}`. Tables today: `profiles`, `site_content` (JSON), `leads`, `projects`, `audit_log`.

**Existing design tokens (`src/styles/studio.css`):** `--bg 250 250 246` (warm off-white), `--surface`, `--surface-2`, `--ink 17 20 18`, `--ink-2`, `--muted`, `--line`, `--brand 245 165 36` (AdVibe gold), `--accent 160 98 0`, `--coral`, pastels `--peach --mint --butter --sky --lilac`, `--ease-out cubic-bezier(.2,.8,.2,1)`, `--shadow-float`, `--shadow-card`, plus the four font variables. **Reuse these tokens. Add new ones; never fork the system.**

**Problems already spotted. Fix them in M0:**
1. `public/` contains **nested ZIP files** (`advibe-studios-final.zip`, six zips in `public/assets/aistudio/`) and `.aistudio/artifacts/**.zip`. They bloat the deploy. **Delete them and add them to `.gitignore`.** Also remove duplicated `hqdefault(1).jpg`, `hqdefault(2).jpg` copies if unreferenced (grep first), and keep a single `circlesfundme.webp` / `circlesfundme-mark.webp` location.
2. `package.json` lists `express`, `dotenv`, `@google/genai`, `tsx` and `esbuild`. If nothing imports them, remove them (check with grep). Ensure `typescript` resolves to a valid, installable version; if `^7.0.2` fails to install, pin to the latest stable 5.x.
3. `store.tsx` (444 lines), `Content.tsx` and `Markets.tsx` are large single files. Do not rewrite them. Add **new files** for new domains (`src/content/offers.ts`, `src/content/training.ts`, `src/lib/trainingApi.ts`, `src/pages/training/*`, `src/pages/admin/training/*`) and wire them in minimally.
4. The existing "Admin → Content" screen is a desktop-shaped form. See Section 9.

---

## 2. NON-NEGOTIABLE RULES

1. **No second CMS, no second Supabase client.** New content lives in the existing typed `SiteContent` (extend it with safe defaults for old saved JSON). Operational data (cohorts, registrations) gets new tables in a new migration file `supabase/migration-4-training.sql`. Never edit old migrations.
2. **Single source of truth** for every price, quantity, date, seat count, capacity and threshold. No hardcoded `₦200,000`, `15`, `₦19,997`, `100`, `90`, or dates in components. Defaults live only in `defaultContent.ts` / `offers.ts` / `training.ts`.
3. **No fabricated anything**: testimonials, stats, logos, client results, activity, urgency, countdowns that reset, seat counts, "just bought" toasts. If no real data exists, show nothing, or an honest editable placeholder in admin and an honest empty state publicly.
4. **Public/admin separation is preserved.** Admin code stays lazy-loaded. Public visitors can never read leads, registrations, payments, or admin data. All writes that matter are validated **server-side** (RLS and RPC / security-definer functions), not just in the browser.
5. **Keep country/currency behaviour intact** and extend it (Section 7).
6. **Performance budget** (Section 11) is a requirement, not a wish.
7. Never expose service-role keys. Use `.env.example` for any new variable.
8. Keep **hash routing** and existing event/tracking conventions (`lib/events.ts`, `lib/tracking.ts`). Add new events only in the same style.
9. Accessibility: semantic landmarks, one `h1` per page, labelled inputs, focus-visible, accessible dialogs (focus trap, Esc, return focus), `aria-expanded` on accordions, reduced-motion support.
10. Typographic punctuation in all public copy: use ’ and “ ”, ₦ is U+20A6.

---

## 3. EXECUTION ORDER (milestones)

| # | Milestone | Done when |
|---|---|---|
| **M0** | Hygiene: remove junk files and unused deps, fix TS install, baseline `lint` + `build` green. Screenshot-level audit of the current homepage, admin and `AiVideoPage` against Section 4. | Both checks green, bundle size recorded. |
| **M1** | **Design system upgrade**: type scale, spacing scale, motion tokens, the **dark theme token set** (`[data-theme="dark"]` scope), shared primitives (Section 4). | Tokens documented in `studio.css`; no visual regression on existing pages. |
| **M2** | **Homepage redesign pass** (Section 4.6), including cylinder wall retention and the two offer cards plus a "Training" entry. | Wall works; mobile hero fits ≤ 1 viewport. |
| **M3** | **Offers data model + admin "Sales Pages & Offers"** (Section 5) and the two sales pages. | Both routes live; edit in admin → public updates after refresh. |
| **M4** | **Lead flow upgrade**: strategy modal → saved lead → booking + WhatsApp handoff (Section 5.4). | Offer preserved end to end; no false success. |
| **M5** | **Training data model + migration + seat logic** (Section 7). | RPCs tested logically; thresholds admin-driven. |
| **M6** | **Training pages**: chooser, business page, creators page, registration funnel (Sections 6, 8). | Both pages complete; mobile-first. |
| **M7** | **Admin redesign**: mobile-first app shell, Cohorts, Registrations, Start Next Cohort (Section 9). | Every task in 9.6 completable on a 390px screen. |
| **M8** | **LivePopups hardening**, SEO, a11y, perf pass, final QA, implementation report (Sections 10–14). | Acceptance checklist (Section 14) all ticked or honestly marked. |

If you hit an output limit, **stop at a clean milestone boundary**, say exactly what remains, and continue when told "continue". Never leave a milestone half-wired.

---

## 4. DESIGN DIRECTION (applies to the whole site: homepage, sales pages, training, admin)

### 4.0 Brand principle
AdVibe Studios is a **premium creative studio**, not a SaaS template and not an LMS. The existing identity (warm off-white, near-black ink, AdVibe gold, pastel accents, large expressive Bricolage headlines, Instrument Serif italic accents, Caveat handwritten notes, pill buttons, video-led work) stays. We are making it **more intentional**, not different.

**The signature asset is the 3D cylinder video wall (`Wall.tsx`).** Rules:
- Never delete, flatten or replace it with a grid or standard carousel.
- Keep drag/swipe, drift, keyboard navigation, and the preview action.
- Respect `prefers-reduced-motion` (stop drift, keep manual control).
- **At most one wall per page.** Anywhere else use `VideoCard` + the existing lightbox.
- Performance fixes are welcome (see 11) as long as the look is unchanged: pause when off-screen via `IntersectionObserver`, use `will-change` sparingly, thumbnails first, load iframes/video only on interaction, cap number of live cards.
- It may be tinted/dark-themed on the training pages through tokens, not forked into a second component.

### 4.1 Typography director spec (use existing fonts, no new families)

Pairing logic: **Bricolage Grotesque** carries voice (headlines, numbers, buttons); **Figtree** carries reading (body, UI); **Instrument Serif *italic*** is a *single-word or short-phrase accent inside a headline*, never a paragraph; **Caveat** is a rare handwritten annotation (max 1–2 per viewport).

| Role | Font / weight | Mobile (390) | Desktop (≥1024) | Line-height | Tracking |
|---|---|---|---|---|---|
| Display (hero) | Bricolage 700–800 | `clamp(2.5rem, 11vw, 3.4rem)` | `clamp(4rem, 6.4vw, 6.5rem)` | 0.98–1.04 | −0.035em |
| H1 (page) | Bricolage 700 | 2.25rem | 4rem | 1.04 | −0.03em |
| H2 (section) | Bricolage 650–700 | 1.85rem | 3rem | 1.08 | −0.025em |
| H3 (card) | Bricolage 600 | 1.25rem | 1.5rem | 1.2 | −0.015em |
| Lead paragraph | Figtree 400 | 1.125rem | 1.3125rem | 1.55 | 0 |
| Body | Figtree 400 | 1rem (16px min) | 1.0625rem | 1.65 | 0 |
| Caption / meta | Figtree 500 | 0.8125rem | 0.875rem | 1.45 | 0.01em |
| Eyebrow / label | Figtree or Bricolage 600 **uppercase** | 0.72rem | 0.78rem | 1.2 | **+0.14em** |
| Button | Bricolage 600 | 1rem | 1rem | 1 | 0 |
| Serif accent | Instrument Serif italic 400 | match headline size, +4% | same | inherit | −0.01em |

Rules: headlines have **deliberate line breaks** (use `text-wrap: balance`; body gets `text-wrap: pretty`); max measure **62–68ch** for body; headings never centred on long text blocks; serif italic only inside headlines, quotes and numerals; **never more than 2 weights per block**; **the amateur habit to avoid: a paragraph of body copy set at headline-adjacent size with no hierarchy, or centre-aligned multi-line body text.** Tabular numerals (`font-variant-numeric: tabular-nums`) for prices, seats, countdowns.

### 4.2 Spacing and layout (layout-critic spec)
- 8-pt base. **Section vertical padding:** mobile `72–88px`, tablet `96–112px`, desktop `128–160px`. Hero top padding accounts for fixed nav (≈ `104px` mobile).
- Side gutters: mobile `20px`, tablet `32px`, desktop container `max-width: 1200px` (copy columns `720px`).
- Within a section: eyebrow → headline `16px`; headline → lead `20–24px`; lead → content `40px` mobile / `64px` desktop; card inner padding `24px` mobile / `32–40px` desktop; card gap `16px` mobile / `24px` desktop.
- **Group** related sections with a shared background wash and a tight `48px` seam (e.g. Problem + Amplify). **Separate** conversion moments (Offer, Proof, Final CTA) with a tonal change (pastel wash, ink-dark band, or a hairline + `160px` gap).
- Alternate rhythm: *dense* (cards/process) then *airy* (one big statement). A page that is uniformly mid-density feels templated.
- Never full-bleed text on mobile; never a row of >2 items side by side on a 390px screen.
- Whitespace is the premium signal: if a section feels busy, **remove content, don't shrink it.**

### 4.3 Interaction design (three small, tasteful details, plus a rule)
1. **Scroll-linked reveal for headlines/cards:** translateY 16px→0 + opacity 0→1, 450ms `--ease-out`, stagger 60ms, once per element, via `IntersectionObserver` (no scroll listeners). On mobile reduce distance to 10px. Disabled under reduced-motion (render final state).
2. **Magnetic-lite button hover (desktop only):** 2px lift + soft shadow bloom + arrow nudge 3px. On touch: `:active` scale .98 only.
3. **Sticky progress cue for process/curriculum sections:** a thin gold line that fills as the user scrolls the section (CSS `animation-timeline: view()` where supported, graceful fallback to static).
**Line between tasteful and gimmick:** if the motion is noticeable when you are *reading*, it is too much. Nothing loops behind text. Max **one** "wow" interaction per section. No parallax on text. No cursor trails, no confetti, no neon, no heavy glassmorphism.

### 4.4 Case-study / work presentation spec (use for portfolio and the CirclesFundMe proof)
One project, top to bottom: **(1) Title card** (client, one-line brief, role). **(2) The situation** in ≤ 40 words. **(3) The work**: full-bleed video/lightbox first, hero frame large, 2–4 stills; captions in a consistent style (`Label — what you're seeing`, Caveat for at most one hand note). **(4) The thinking** (3 short bullets: idea, execution, constraint). **(5) The outcome**: *only real, evidenced facts* (see Section 6.9 for the CirclesFundMe wording); when no hard numbers exist, show **process evidence** (brief → script → frames → finished cut) and the client relationship, not invented metrics. Cut: logos walls, vague "we elevated the brand" language, long process essays. Text budget per project: ≤ 120 words visible, more behind "Read more".

### 4.5 What premium looks like here / what to skip
**Skip template sections:** "Our values" icon grids, generic "Why choose us" with 3 stock icons, fake stat counters, "As seen in" bars without real press, stock-photo team grids, newsletter-pop-up-on-load, auto-rotating testimonial sliders with invented quotes.
**Premium decisions:** (a) one confident colour per section; (b) video as the hero of every proof moment; (c) oversized numerals for price, `15`, `6`, `100`; (d) editorial asymmetry on desktop, single column discipline on mobile; (e) hairline borders + soft shadow, not heavy boxes; (f) real thumbnails always shown before any iframe loads.
**The one mistake that makes the site feel cheap:** *inconsistent* corners/shadows/spacing/buttons between sections, or a decorative animation that fights the copy. Enforce the token system.

### 4.6 Homepage redesign pass (M2)
Keep content and sections working; elevate them:
- **Above the fold (mobile 390×844):** eyebrow, headline (≤ 3 lines), one-sentence promise, primary CTA (52–56px tall), secondary WhatsApp CTA, and the top of the cylinder wall visible so the user sees motion immediately. No scroll needed to know *what it is, who it's for, what to do.*
- Add a compact **"Choose your path" strip** after the hero: three cards, *Monthly Video Retainer* / *Promotional Mini Series* / *AI Cinematography Intensive (Founding Cohort)*. Each is admin-controlled (visibility, text, price pulled from single source), each ≈ 1 tap to its page.
- Add **"Training"** to the main nav (and mobile menu) linking to `#/training`, with a small gold "Founding Cohort" pill that disappears automatically when no cohort is open.
- Add a proof strip using **real** portfolio items and the CirclesFundMe client record (with approval toggle, 6.9).
- Re-space sections per 4.2; unify headings per 4.1. Do not remove existing sections the team uses; hide-able via admin if they aren't already.

### 4.7 Dark theme (for training pages and optionally the admin)
Implement as a **token override**: `[data-theme="dark"] { --bg: 12 13 12; --surface: 21 23 21; --surface-2: 28 31 28; --ink: 245 243 236; --ink-2: 214 214 206; --muted: 150 156 148; --line: 44 48 43; --brand: 245 165 36; … }`, same fonts, same pill buttons, same gold, same radii. Add a faint film-grain overlay (static PNG/CSS, ≤ 4KB) and a gold radial glow behind hero only. The training pages wrap in `data-theme="dark"`. Make the dark/light choice per page **admin-selectable** (default: dark for training, light for everything else). *(Assumption: Option B "dark version of the same system", recommended and consistent with references; confirm in the report.)* Ensure WCAG AA contrast for all text on dark.

---

## 5. THE TWO SALES PAGES (`#/monthly-content`, `#/promotional-mini-series`)

**Implement exactly as specified in the attached Master Brief (Parts A–D)**: copy, structure, boundaries, ownership wording, revision policy, script-and-one-page-brief checkpoint, CirclesFundMe proof, PASTOR mapping, honest-notifications rules. Additions and clarifications below.

### 5.1 Single source of truth: `src/content/offers.ts`
```ts
type OfferId = 'monthly-content' | 'promotional-mini-series';
interface Offer {
  id: OfferId; active: boolean; showOnHome: boolean;
  name: string; shortLabel: string;
  price: { amount: number; currency: 'NGN'; period: 'month' };  // plus per-country overrides via existing money.ts
  videosPerMonth: number;                                         // default 15
  hero: { eyebrow; headline; support; cta1; cta2; formNote };
  sections: { problem; amplify; solution; valueComparison?; whatWeCreate?; whyDifferent?; ownership; closing };
  deliverables: string[]; process: {title; body}[];
  briefReviewCopy: string; revisionPolicy: { title; body };
  ownership: { body; disclaimer };
  faqs: {q; a}[]; seo: {title; description};
  bookingUrlOverride?: string; packageDisclaimer?: string;
  proofVideoIds: string[];     // references existing portfolio items
}
```
Defaults = the Part B copy, verbatim. Migrate old saved `SiteContent` safely (missing `offers` → defaults). Every public string comes from this object. Prices render through `money.ts` so country-aware behaviour is preserved. **If price/quantity change, every price on page, form, success screen and WhatsApp message changes.**

### 5.2 Art direction (distinct pages, one family)
- **Retainer**: calm, organised, "studio operations." Light theme, gold on cream, a *"One hire vs a whole studio"* visual comparison (left: one overloaded person card; right: a roster of roles: ideation, script, direction, AI production, editing, delivery; **no salary figures, no savings claims**), a **15-tile monthly calendar/grid** package visual (tiles fill in on scroll), and the 6-step approval flow as a horizontal stepper (mobile: vertical timeline).
- **Mini-series**: cinematic, editorial, film-inspired. Letterbox (2.39:1) framing for video, film-title typography (Instrument Serif italic accents large), episode "slate" cards (`EP 01`), a storyboard strip, darker `--ink` band sections for the story-world and offer, Caveat director's notes. Same tokens, different mood.
- Both pages: **wall in the hero once**; below, `VideoCard`/lightbox only.
- **Illustrative one-page brief mockup** (labelled *"Illustrative sample"*): a tasteful paper-card visual of a brief (title, goal, audience, key message, scenes, visual direction, CTA). Never claim it is a real client document.
- The **approval flow** is a persuasive feature: *"You see the direction before production begins."* Steps: Business brief → Script + one-page brief sent → You review & approve (highlight as a checkpoint) → Production → One revision round (within scope) → Delivery.

### 5.3 CirclesFundMe proof section (both pages and homepage)
CTA "Watch Our Work for CirclesFundMe" opens the **existing** video lightbox with videos already linked to that client in the portfolio. Admin selects which. If none selected/visible, hide the CTA (or show an editable fallback), never a broken or fake preview. Respect the "public use approved" toggle (see 6.9).

### 5.4 Lead journey, booking, WhatsApp (extend `StrategyModal`)
1. CTA opens a short form (mobile: **full-screen bottom sheet**): required **full name, business name, WhatsApp number, selected offer** (pre-selected, preserved from the page); optional email, industry, goal. Consent line (admin-editable). Correct `inputmode`/`autocomplete`/`type`.
2. Submit → existing lead API with `offer_id`, `source_route`, UTM/referrer. Disable button during submit (idempotency token to prevent double-tap duplicates). Server-side validation of offer id and price snapshot (RPC; ignore client-sent prices). **No success state until the server confirms.**
3. Success: "Your details are saved." Show **Book your strategy call** (admin booking URL, offer override → global → hidden if none; never invent one) and **Continue on WhatsApp**. Booking click is tracked as `booking_link_click` only. Never mark "booked."
4. WhatsApp: use the existing utility and configured number (country-aware), URL-encoded:
   `Hello AdVibe Studios. My name is {name}, and I represent {business}. I’m interested in your {offer.name} package at {formattedPrice} per month, which includes {videosPerMonth} videos monthly. My main goal is {goal||"to grow with consistent video content"}. I’d like to discuss how this could work for my business.`
   User must click; nothing auto-sends.
5. Events: page_view, cta_click, form_start, lead_submit_success, booking_link_click, whatsapp_handoff, following existing conventions.

### 5.5 Admin: "Sales Pages & Offers"
Mobile-friendly editor (use the new admin shell, Section 9): pick offer → grouped accordions (Status & price, Hero, Story sections, Deliverables, Process, Brief & revision wording, Ownership wording, FAQs (add/reorder/delete), Proof videos, SEO, CTAs) → sticky **Save** bar with unsaved-changes warning, save confirmation, readable errors. Global settings: default booking URL, WhatsApp number, consent copy, shared CTA labels, homepage offer cards, CirclesFundMe selection, popup settings.

---

## 6. TRAINING PROGRAM: LOCKED FACTS (single source: `src/content/training.ts` + DB; all admin-editable)

### 6.1 Program
- **Name:** *The AdVibe AI Cinematography Intensive: Founding Cohort*
- **Supporting line:** *Go from idea to AI commercial, social campaign and short film in 2 weeks.*
- **Core promise (locked):** *In 2 weeks, go from an idea to a finished AI commercial, social campaign and short film, with live instruction, practical assignments and feedback from a marketer and a professional storyteller.*
- **Format:** live online sessions, all recorded. Platform: **TBD** (placeholder "Zoom/Meet link shared after payment confirmation").
- **Certificate:** "AdVibe AI Cinematography Intensive: Certificate of Completion" (*not* accredited/government). Requirement: complete and submit the final capstone (project files + minimum quality criteria).
- **Language:** English (confirm in admin; TBD).

### 6.2 Schedule (WAT, UTC+1). Seed Cohort 1; fully editable
| Session | Date | Time (WAT) |
|---|---|---|
| 1 | Tue 24 Nov 2026 | 7:00–9:30 PM |
| 2 | Thu 26 Nov 2026 | 7:00–9:30 PM |
| 3 | Sat 28 Nov 2026 | 3:00–5:30 PM |
| 4 | Tue 1 Dec 2026 | 7:00–9:30 PM |
| 5 | Thu 3 Dec 2026 | 7:00–9:30 PM |
| 6 | Sat 5 Dec 2026 | 3:00–5:30 PM |
Enrollment closes **Sun 15 Nov 2026** (recommended default; admin-editable). Each session shows a **local-time converter** (uses visitor timezone). Session 2 (26 Nov) is US Thanksgiving: show a small note "All sessions are recorded."

### 6.3 Capacity & seat states (admin-controlled, **never hardcoded**)
Defaults: `capacity = 100`, `almostFullAt = 90`, `fullAt = capacity`, `minimumToRun = 10` (**internal only, never public**). States, computed from **confirmed paid** count (not leads, not registrations): `UPCOMING`, `OPEN`, `ALMOST_FULL` (paid ≥ almostFullAt), `FULL` (paid ≥ capacity), `PAUSED` (manual), `ENDED`/closed (past close date or manual). Public text: `OPEN` → "Enrollment open" (show seat counter **only** from `showCounterFromPaid` threshold, default 0, admin-set); `ALMOST_FULL` → "Almost full: {paid}/{capacity} seats reserved"; `FULL` → CTA becomes **Join the waitlist / Notify me for Cohort 2** (admin chooses behaviour); `PAUSED/ENDED/UPCOMING` → appropriate CTA. "Seats reserved" always means confirmed paid. Calculation happens **server-side** (RPC/view returning only `{state, paid, capacity, remaining}`, no personal data).

### 6.4 Pricing (market-adjusted, all admin-editable; **no fake crossed-out price**)
| Market | Founding | Future cohort |
|---|---|---|
| 🇳🇬 Nigeria | ₦19,997 | ₦29,997 |
| 🇬🇭 Ghana | GH₵350 | GH₵500 |
| 🇰🇪 Kenya | KSh 7,500 | KSh 11,000 |
| 🇺🇸 USA | $49 | $79 |
| 🇬🇧 UK | £39 | £59 |
Extend `money.ts`/`country.tsx` with a **training price table** keyed by country, falling back to Nigeria/USD. Copy form: *"Founding Cohort: ₦19,997. Future cohorts will be ₦29,997."* The "founding price disappears when this cohort closes" **only if** Cohort 2 price differs; the admin "Start next cohort" flow resets this.

### 6.5 Refund policy (admin-editable text, show on page + checkout)
Default (locked): **"Refunds are available before the cohort begins. Once the first session starts, all payments are non-refundable. If AdVibe Studios cancels the cohort, enrolled students receive a full refund."** *(A "7-day guarantee after Session 2 + one-time transfer" variant was proposed but is **unconfirmed**; keep it as a disabled alternate text in admin, not public.)*

### 6.6 What students get (public checklist; each item toggle-able)
6 live AI Cinematography sessions · lifetime session recordings · lifetime AdVibe AI Creator Community · practical assignments & feedback · free mobile video-editing mini-course · **five real resources we will actually create** (AI Prompt Library; AI Advertising Script Templates; Cinematic Shot List Template; AI Tools Directory (editable, not permanent); Client AI Video Brief Template) · AdVibe Founding Creator status · Certificate of Completion · opportunity to be featured in the **AdVibe Founding Creators Showcase** (capstone completers; Name / Project title / Role: AI Director/Creator) · first access to selected future AdVibe opportunities (*not guaranteed*) · Founding Creators Masterclass (private post-training review session with Enoch & Esther) · Founding Student Feedback Council · founding discount on selected future AdVibe training (**no percentage promised**) · Top-10 capstone detailed review (only if admin enables).
**Do not assign monetary "values" to anything.** State: "Included with your founding-cohort enrollment."
Resource deliverables: build a simple **Resources** area (admin-managed list: title, description, link/file path, visibility "after payment confirmed") and seed the five items as **draft/unpublished until uploaded.** Outlines: Prompt Library (image gen, product photography, characters, environments, cinematic shots, camera movement, lighting, image-to-video, UGC, product ads, storytelling); Script Templates (3-second hooks, problem/solution, demonstration, UGC, testimonial, founder story, curiosity, transformation, offer/CTA, short-form); Shot List (Scene → Shot → Subject → Action → Camera → Lens → Movement → Lighting → Environment → Dialogue → SFX); Tools Directory (Purpose → Tool → Free/Paid → Beginner difficulty → Best use → Limitations → Commercial considerations); Client Brief (client info, objective, audience, product, offer, brand identity, message, hook, emotion, references, scenes, deliverables, platforms, aspect ratios, voice, music, deadline, revisions).
**Do not list specific AI tools on the public pages yet** ("they don't need to know yet"). Use generic wording ("the best current AI image, video, voice and editing tools"). The Tools Directory is a post-enrollment resource.

### 6.7 Curriculum (locked; expandable cards, 2-column on desktop, 1 column mobile)
Week 01: **S1** Foundations, prompting & hooks → *Your first AI scene*. **S2** AI images & cinematic video → *15–30 sec cinematic sequence*. **S3** Sound & editing → *30–45 sec AI commercial*. Week 02: **S4** Character consistency, UGC & influencers → *AI influencer + UGC video*. **S5** AI advertising & social content → *Brand campaign*. **S6** AI filmmaking, world-building, cloning & automation → *Final capstone*.
**Final capstone:** 60–90 sec AI film, three tracks: **A Commercial**, **B Story/short film**, **C Creator/branded film**.
Each card: orange/gold pill label `SESSION 01`, title, date/time chip, and when expanded: *What you’ll learn · Key concepts · Skills (generic) · Practical exercise · What you’ll create*. Admin edits every field. Smooth height animation (CSS grid `0fr→1fr`), `aria-expanded`, one open at a time on mobile, first card open by default, "Expand all" on desktop.
Below the 6 cards: **"What you’ll master"** 9-tile skill map (inspired by phase architecture; own wording, no copying) with honest labelling of what is **live / recording / template / assignment / bonus**, so it never implies nine weeks of live class. Tiles: Prompting & hooks · AI images · Cinematic video · Sound & editing · Character consistency · UGC & influencers · AI advertising · Social content · Filmmaking & capstone.

### 6.8 Instructors (locked; admin-editable cards with image, role, bio, credentials, links)
- **Enoch Shittu-Abraham** — *Digital Marketer · Advertising Strategist · AI Creative.* Claims supplied by owner: 1,000+ ecommerce orders generated; worked with fintechs on registration/onboarding campaigns; performance advertising; AI advertising; AI cinematography.
- **Esther Ayankoya Mofiyinfoluwa Ngozi** — *Ghostwriter · Storyteller · Creative Writer · AI Storytelling Specialist.* Claims supplied: multiple writing contracts; novel distribution relationships; thousands of reads; storytelling; character development; AI cinematography.
Add an admin flag `verifiedPublic` per claim (default **on for owner-supplied claims**, but each is individually hide-able). Headshots/links: TBD placeholder.
**The concept: THE ADVIBE METHOD.** *Marketing (Enoch) → Story (Esther) → Cinematography (both) → Production → Commercial content → Your portfolio.* Design it as a signature horizontal/vertical flow diagram. Tagline: *"The mind of a marketer. The heart of a storyteller. The tools of an AI filmmaker."* Which sessions each leads: TBD (admin field).

### 6.9 Proof: CirclesFundMe (admin → "Proof & Results")
Section title: *AI Creative Production Meets Real-World Growth.* Copy: "We’re not teaching AI video in theory. We’re applying it to real commercial campaigns." Mention **CirclesFundMe Digital Savings and Loans Cooperative Society Limited**; objective *helping grow the platform toward 10,000+ registered members*; *advertising work has generated 1,000+ messaging conversations for the company’s customer-care team*; Facebook Ads Manager screenshots. **Gate everything behind admin toggles `clientApprovedPublic` (default OFF until the owner confirms CirclesFundMe approved the wording and screenshots).** Do not claim endorsement. Proof items: image, caption, category, display order, published flag (the storage path is typed in admin now; direct upload later). Generic fallback when OFF: show real portfolio videos only.

### 6.10 Urgency (real only)
Real fixed close date; countdown that **never resets** (computed from `enrollmentClosesAt`); real seat counter; "Founding" label vanishes after close; price-increase message only if next-cohort price is actually higher; activity toasts only from real consented confirmed enrollments. **No fake purchases, no fake scarcity.**

### 6.11 Audience split: same cohort, two pitches
- `#/training`: chooser: **"I’m a Business Owner — I want to learn how to create better promotional content for my business. Continue →"** and **"I’m a Creator — I want to master AI cinematography and build my creative portfolio. Continue →"**. Cinematic, minimal, wall behind/above, two large cards.
- Both pages sell **one shared cohort, one shared seat pool**, same price, same checkout; tracked by `audience` (`business`|`creator`).
- Cross-link: each page has a quiet "Not you? See the {other} version."

---

## 7. DATA MODEL & SEAT LOGIC (`supabase/migration-4-training.sql`)

Create (with RLS enabled on all):
- `cohorts`: `id, number, name, slug, status ('draft'|'upcoming'|'open'|'paused'|'ended'|'archived'), capacity, almost_full_at, minimum_to_run (private), price_table jsonb, future_price_table jsonb, enrollment_opens_at, enrollment_closes_at, starts_at, ends_at, sessions jsonb, payment_url, registration_url, refund_text, created_from uuid, archived_at, created_at`.
- `registrations`: `id, cohort_id, audience, name, whatsapp, email, country, business_or_type, experience_level, goal, consent_public_display bool default false, consent_contact bool, stage ('lead'|'registered'|'payment_started'|'payment_confirmed'|'cohort_member'|'refunded'|'cancelled'), payment_reference, amount, currency, marked_paid_by, marked_paid_at, utm jsonb, source_route, idempotency_key unique, notes, created_at`.
- `assignments_submissions` *(optional, small)*: `id, registration_id, session_no, link, status, feedback`.
- `training_resources`: `id, title, description, path_or_url, published, requires_paid`.
- `announcements` *(optional)*: `id, cohort_id, subject, body, sent_at`.
Seat count = `count(*) where stage in ('payment_confirmed','cohort_member')` for the cohort. **Refunded registrations release the seat** (default; make "hard stop at capacity" the behaviour: `mark_paid` RPC **rejects** when paid ≥ capacity unless admin explicitly overrides).
- **Public RPCs (security definer, minimal output):** `get_cohort_public(slug)` → `{ name, dates, state, paid, capacity, remaining, prices, closes_at }`; `submit_registration(payload, idempotency_key)` validates fields/cohort open, computes the price server-side, returns `{ registration_id, next: 'pay' | 'waitlist' }`; `mark_payment_started(id, token)`.
- **Admin RPCs** (require authenticated admin role from `profiles`): `mark_paid`, `mark_refunded`, `import_payments_csv`, `start_next_cohort(source_cohort_id, overrides)`, `archive_cohort`, `set_cohort_state`. Log each to `audit_log`.
- **Never** expose registrations to `anon`. Public consented-display toasts come from a **view** returning only `first_name, country, event_type, at` for rows with `consent_public_display = true AND stage in (...)`.
- Add TS types in `src/content/types.ts` and API wrappers in `src/lib/trainingApi.ts` (reuse the existing supabase client). Provide safe empty/loading/error fallbacks if the migration hasn’t been run (page shows "Registration opening soon" rather than crashing). Document the migration in the report.

---

## 8. REGISTRATION & PAYMENT FUNNEL (Selfany: **do not invent an API**)

Flow (locked): Landing → **Registration form (before payment, so non-payers are captured)** → lead saved → country/price shown → **Payment started** (opens `payment_url` in new tab; record `payment_started`) → **Thank-you screen** ("We’ve received your registration. Your seat is confirmed once we verify your payment. Send your payment proof on WhatsApp.") → WhatsApp verification button (prefilled message with name, cohort, amount) → **Admin marks as paid** (or CSV import) → seat counted → onboarding (confirmation email, community/WhatsApp link, calendar). **Never say "you're in" before confirmation.**
Selfany integration is a **swappable adapter** (`src/lib/payments.ts` with `PaymentProvider` interface; implementation = `ManualProvider`: payment URL per country + admin Mark-as-Paid + CSV import). Leave a clearly commented `SelfanyProvider` stub with no fake endpoints.
Registration fields: name*, WhatsApp*, email*, country*, business/occupation type, experience level (beginner/some/experienced), goal (optional), consent (contact)*, optional consent (public first-name display). Per-audience variant: business owners ask "What does your business sell?"; creators ask "What do you want to create?".
Emails (transactional, **provider not yet chosen → TBD**): build **template content + trigger events in admin** (registration received, payment pending, payment confirmed, tomorrow reminder, 1-hour reminder, assignment, capstone due) and a "send via configured provider" interface; if no provider is configured, show honestly "Email provider not connected" in admin. WhatsApp automation is **later**.

---

## 9. ADMIN REDESIGN: MOBILE-FIRST APPLICATION (M7)

**Goal:** an admin that feels like a native management app on a phone and scales up to tablet/desktop. Inspect `Admin.tsx`, `Content.tsx`, `Markets.tsx`, `LeadsProjects.tsx` first; **preserve all working functionality and auth**; reorganise the navigation and presentation.

### 9.1 Information architecture (decided)
**Primary (bottom tab bar on mobile, 5 slots):**
1. **Home**: today’s dashboard.
2. **Cohorts**: current cohort first, previous, new.
3. **People**: Registrations/Students, Leads, Projects (segmented control).
4. **Content**: Sales Pages & Offers, Training Page, Proof & Results, Testimonials, FAQs, Portfolio, Resources.
5. **More**: Markets & Pricing, Integrations, Analytics, Announcements, Popups & Notifications, Users, System/Status, Audit log, Sign out.
**Tablet/desktop:** the same IA as a collapsible left sidebar (rail → expanded), content in a 2-pane master/detail layout. The tab bar disappears ≥ 900px.
**Wayfinding:** a compact top bar shows page title + contextual back chevron (deep screens) + a **global search/command button** (jump to a student, cohort, or setting). Breadcrumb alternative: title + parent label ("Cohorts › Cohort 1"). Active tab visibly filled; safe-area padding for iOS (`env(safe-area-inset-bottom)`); tab bar 64px with 48px+ targets.
**Quick-action FAB** (Home/Cohorts/People only): "Mark paid", "Add registration", "Edit dates", "Start next cohort", "Announcement".

### 9.2 Home dashboard (priority order, progressively disclosed)
1. **Current cohort card**: name, state chip (Open/Almost full/Full/Paused/Upcoming), days to enrollment close, **seats ring (paid/capacity)**, three mini-stats (Registered, Payment started, Paid).
2. **Needs attention** list (max 5, each with 1-tap action): "7 payments awaiting verification" → Payments queue; "Session 1 is in 3 days: announcement not sent"; "Cohort 1 has {n} paid, minimum {min} to run" (admin-only).
3. **Quick actions** row (4 icons).
4. **Latest activity** (collapsed, 5 items). Analytics and system status behind "See more."

### 9.3 Mobile patterns (rules)
- **Tables → cards/lists** with the key fact and a status chip; swipe/long-press not required; tap opens a **detail screen** (full-screen, back button) or a **bottom sheet** for quick actions.
- **Registrations list:** search box + filter chips (All · Unpaid · Payment started · Paid · Refunded) + sort; each row: name, WhatsApp icon-button (opens chat), stage chip, amount, relative time. Detail: all fields, notes, **sticky action bar**: *Mark as paid* (confirmation sheet showing name, amount, resulting seat count), *Message on WhatsApp*, *Refund/Cancel* (destructive, confirm).
- **Payments queue:** the single most common job. Dedicated view: "Awaiting verification", **one-tap Mark paid → confirm sheet → undo toast (10s)**. CSV import sits under a "⋯" menu with preview before commit.
- **Forms:** single-column, grouped in accordions with section summaries ("Dates · 6 sessions"), sticky bottom **Save / Discard** bar showing dirty state, inline validation, correct input types (date, time, number, url), unsaved-changes guard on route/tab change.
- **Modals** become full-screen sheets on <640px; drawers on tablet; centered dialogs on desktop. All with focus trap, Esc, labelled titles.
- **Selectors:** native `<select>` or full-height option sheet; no tiny custom dropdowns.
- **Destructive actions:** confirmation sheet with plain-language consequence; archive is reversible; permanent delete requires typing the cohort name.
- **States everywhere:** skeleton loading, empty states with a next action, error banners with retry, success toasts, disabled states with reasons.
- Touch targets ≥ 48px; body 16px; contrast AA; visible focus; `aria-current` on active nav; announce toasts with `aria-live`.
- Admin theme: light by default, using the same tokens, with a dark-mode toggle (uses 4.7 tokens). No decorative animation.

### 9.4 Cohort management (core)
**Cohorts tab:** hero card = *Active cohort* (state, dates, seats, price, links) with actions *Edit · Registrations · Payments · Pause/Close enrollment · Announce*. Below: *Upcoming/Draft*, then *Previous* (archived, read-only summaries with totals), plus **+ New cohort** and **Duplicate**.
**Edit cohort** (accordion sections): Basics (name, number, slug) · Schedule (6 sessions with date/time pickers, timezone fixed WAT with preview) · Enrollment window (opens/closes) · Capacity & thresholds (capacity, "almost full at", "show counter from", minimum to run [private]) · Pricing (table by market; founding vs future) · Payment & links (payment URL per market, community link, session links) · Policy (refund text) · Public state (Auto / force Paused / force Closed) with a **live preview** of how the public page will read.
### 9.5 START NEXT COHORT (the guided wizard, 5 steps, full-screen, progress dots, back/next, state saved as draft)
1. **Choose source**: defaults to the latest cohort ("Duplicate Cohort 1"). Shows what will be copied (curriculum, offer, resources, instructors, FAQ, page text) and what will **not** (registrations, payments, counts).
2. **Name & dates**: auto-increments number & name ("Cohort 2"), new 6 session dates (date-picker with date-shift helper "shift everything by N days"), enrollment open/close.
3. **Pricing & capacity**: pre-fills *future* prices from Cohort 1 as the new current prices; toggles "Founding label" off; capacity/thresholds editable.
4. **Review changes**: diff-style list of every value that changed vs source, warnings (e.g. dates in the past, price lower than before, no payment URL).
5. **Launch**: choose *Save as draft* / *Schedule to open* / *Open now*. Archiving Cohort 1 is offered as a checkbox ("Archive Cohort 1 and switch the public page to Cohort 2"). Success screen with links to the public page and registrations. Implement through `start_next_cohort` RPC (transactional), log to `audit_log`.
Keep it **off the public page** and out of marketing UI.

### 9.6 Mobile task test (must all be achievable at 390px, ≤ 4 taps where reasonable)
Check current cohort (0 taps: Home) · see paid vs unpaid (1) · mark a payment paid (2–3) · review a registration (2) · edit dates (3) · change price (3) · update payment link (3) · edit an FAQ (3) · manage proof images (2–3) · start next cohort (2 + wizard) · pause enrollment (2) · send announcement (3) · view analytics (2) · check system status (2).
**Final self-review:** act as an admin on a phone. If you get lost, can’t find a function, or hit horizontal scroll, fix it before reporting.

---

## 10. LIVE NOTIFICATIONS (`LivePopups.tsx`, extend, don’t replace)
Allowed: real **consented** recent enrollments (first name + broad country only; label exactly what happened: "enrolled", "registered interest", "booked a strategy call", never interchanged), the visitor’s own progress cues ("Your details are saved. Book your call next."), and evergreen **clearly informational** messages when no real activity exists. Prohibited: invented names/places, "someone is viewing", fake urgency, demo data in production. If no eligible events → **show nothing.** Admin settings: on/off, delay, frequency cap, duration, eligible event types, pages (home / each sales page / training), dismiss memory (session). Never overlap the primary CTA, form, or modal. Mobile: bottom-left above the tab/CTA safe area, max 1 visible, auto-dismiss, close button ≥ 44px. Remove or guard `demoUsers.ts` so it can never feed production.

---

## 11. PERFORMANCE BUDGET (hard requirements)
- Homepage JS ≤ current baseline (record in M0). New pages are lazy chunks. Admin remains lazy.
- LCP ≤ 2.5s on a mid-range phone/4G: hero text is real HTML, the wall shows **thumbnails first**, iframes/videos mount **only on interaction**; `loading="lazy"` + `decoding="async"` + explicit width/height (no CLS); WebP/AVIF for local images; `fetchpriority="high"` for the single LCP image.
- Fonts: keep `@fontsource` subsets (latin only), `font-display: swap`, preload only the display + body files actually used above the fold. Drop unused weights/axes.
- Animations: transform/opacity only; `IntersectionObserver` not scroll listeners; pause the wall off-screen and when the tab is hidden; honour `prefers-reduced-motion` and `Save-Data`.
- Only one heavy 3D/video element per page. No autoplaying sound; any autoplay preview is muted, short, and disabled for reduced-motion/data-saver.
- Code-split by route; avoid new dependencies (use existing `motion`, `lucide-react`). Tree-shake icons.
- Verify with `npm run build` output sizes and report them (before vs after).

---

## 12. COPY STANDARD & WRITING BRIEF (be captivating, specific, honest)

**Voice:** confident, modern, warm, plain-spoken, calm premium (not hypey). Local phrases only sparingly and only where natural. **Banned:** "unlock your potential", "revolutionize", "game-changer", "supercharge", "in today’s fast-paced world", vague "AI-powered" fluff, income claims, guaranteed outcomes, fake urgency. **Prefer:** concrete nouns, short sentences, one idea per line, before/after contrasts, objections answered plainly, specifics (numbers that are real, session names, deliverables).
**Inspiration for structure and persuasion (not wording):** `https://nexturge.com/aistudio2/` (Nigerian business-owner AI-ad offer: study how it moves from pain → new possibility → concrete modules → bonuses → guarantee → FAQ) and AI Video Bootcamp ("Learn. Practice. Earn." with two founders). **Do NOT copy their text, their invented "value" prices, income claims, or manufactured "just bought" popups.** If you have web access, skim them and other AI-video / AI-ad / cohort programs to understand patterns in headlines, objection handling and offer architecture; if not, use the principles above.

### 12.1 Page architecture, Business page `#/training/business` (conversion order)
1. Announcement bar (real countdown to enrollment close + seat state). 2. **Hero** (headline, promise, price + dates chips, CTA "Reserve my founding seat", secondary WhatsApp; wall beneath/behind). 3. Pain: "Every promo video starts with a bottleneck." 4. The shift (AI changed production). 5. The promise + **Before/After transformation table**. 6. Who it’s for / who it’s **not** for. 7. What you’ll create (6 session outputs as visual strip). 8. **Curriculum** (expandable cards). 9. **The AdVibe Method** + two instructors. 10. Real work (CirclesFundMe, gated). 11. What you get (checklist) + resources detail. 12. Certificate + capstone (Track A highlighted for business owners). 13. Founding cohort story + price (no fake anchor). 14. Seat meter + countdown. 15. Objections/FAQ. 16. **"Rather not do it yourself? Let AdVibe produce it for you →"** (link to `#/monthly-content`). 17. Final CTA + refund policy + WhatsApp.
**Creators page `#/training/creators`:** same bones, reordered/re-argued: hero → "You’ve seen the videos. Nobody showed you how they’re made." → opportunity → promise → **Learn → Practice → Build → Portfolio → Explore opportunities** path → who it’s for/not → curriculum → Method + instructors → capstone **Tracks B & C highlighted** + Founding Creators Showcase → "Possible paths" (freelance, brand content, ads, social, product videos, UGC) clearly labelled *possibilities, not promises* → objections (beginner, no laptop, can’t edit, no budget, already watched YouTube, no time) → offer/price → FAQ → final CTA.

### 12.2 Seed copy (use as defaults; improve if you can, never weaken honesty)

**BUSINESS: Hero**
Eyebrow: `FOUNDING COHORT · 24 NOV – 5 DEC · LIVE ONLINE`
H1: **Make your own promotional videos with AI. In two weeks.**
Sub: Six live sessions with a digital marketer and a professional storyteller. You leave with a finished AI commercial, a social campaign, and a repeatable way to make more, without waiting on a production crew every time you need content.
CTA: **Reserve my founding seat** · Secondary: **Ask a question on WhatsApp**
Micro: `Seats reserved: {paid}/{capacity} · Enrollment closes {date}` (only if allowed by state)

**Pain**
H2: *Every promo video starts the same way: with a bottleneck.*
Body: You need a video for the new product. So you look for a videographer. Then a model. Then a location, a script, an editor, a few weeks, and a budget that wasn’t in the plan. By the time it’s live, the moment has moved on. And next month you do it all again.
Lines: *Content shouldn’t wait on someone else’s calendar. · One video isn’t a strategy: you need variations to see what works. · Posting “whenever there’s time” is how brands go quiet.*

**Shift**
H2: *AI didn’t just change what a video costs. It changed who can make one.*
Body: What used to need a crew, a camera and a studio can now start with an idea, a few good prompts and a clear workflow. The catch: the tools are noisy, the tutorials are scattered, and most people stall after one impressive clip. What’s missing isn’t another tool. It’s a method.

**Promise**
H2: *Not “learn AI.” Learn to make the video.*
Body: In six live sessions you’ll go from idea to script to visuals to motion to sound to finished edit, on your own products and offers, with live feedback.

**Before / After**
- “I need a promo video.” → “I can turn this product into a concept, generate the visuals, create the video, add voice and sound, edit it, and make three variations.”
- “I hire someone every time I need content.” → “I have a workflow I can run again and again.”
- “I don’t know what to post.” → “I know how to turn one product into several different promotional ideas.”
- “Video is a cost I put off.” → “Video is a skill my business owns.”

**Not for you if** you want a get-rich-quick shortcut · expect a finished business on autopilot · can’t commit to six evenings (recordings help, but live feedback is where the learning happens).

**Founding cohort story**
H2: *Why “Founding Cohort”?*
Body: This is the first time we’re opening the AdVibe training to a group. You’re joining before it grows and before the regular price: ₦29,997 for future cohorts. Founding students get the lowest planned price, Founding Creator status, first access to selected future AdVibe opportunities, and a real say in how the program develops. When this cohort closes, the founding price goes with it.

**Rather not DIY?** *Already running a business and would rather have it done for you? AdVibe produces monthly AI video content for brands. See how it works →*

**CREATORS: Hero**
Eyebrow: `FOUNDING COHORT · LIVE · 6 SESSIONS`
H1: **Learn to direct AI films and ads. Leave with work you can show.**
Sub: Two weeks. Six live sessions. A marketer and a storyteller teach the full workflow: idea, visuals, motion, sound, edit, finished piece. You finish with a capstone film and the start of a portfolio.
CTA: **Join the Founding Cohort** · Secondary: **Chat on WhatsApp**
**Problem:** *You’ve watched the AI videos. You’ve wondered how they’re made. And you’ve probably opened a tool, made one odd clip, and closed it.* The gap isn’t talent. It’s someone showing you the whole workflow, in order, and making you finish something.
**Path:** Learn → Practice → Build → Portfolio → Explore opportunities.
**Honest earning note:** *This training teaches skills people use for freelance video, brand content, ads and social campaigns. It doesn’t promise income or clients. What it gives you is the ability, a portfolio piece, and a clearer idea of where to take it.*
**Opportunities line (locked):** *Top-performing students may be among the first to hear when AdVibe opens future creative, freelance or production opportunities. Opportunities aren’t guaranteed and depend on project availability, skill level and performance.*

**Instructor positioning:** *Two perspectives. One intensive.* Enoch shows how video earns attention and action; Esther shows how stories hold it. Together they teach you to make AI films that look good **and** work.

**FAQ seeds (answer honestly; both pages)** I’ve never used AI before · I don’t know how to prompt · I can’t edit video · I don’t have expensive equipment / a laptop (TBD: phone-only feasibility) · I don’t know if I’m creative enough · I’ve watched YouTube tutorials · I can’t attend live (all sessions recorded; lifetime access) · What do I need to pay for? (TBD: tools/subscription guidance, shared after enrollment) · Is the certificate accredited? (No: certificate of completion) · What’s the refund policy? · What happens after I pay? · How is this different from a self-paced course? (live, feedback, capstone, community) · Will I make money? (no guarantees).
**Sales pages (Retainer / Mini-series):** use Part B verbatim.

---

## 13. SEO, ACCESSIBILITY, TRACKING
Unique `<title>` + meta description + OG tags per route (set in a small `useDocumentMeta` hook; admin-editable for offers and training). One `h1`, logical `h2/h3`. Alt text on meaningful images; decorative marked `alt=""`. Skip link. `lang`. Respect reduced-motion. Structured data (`Course`/`Event`) for the cohort **only** with real dates/price, added via the existing page head. Tracking via existing `events.ts`/`tracking.ts`: add `training_page_view`, `training_cta_click`, `registration_start`, `registration_submit`, `payment_started`, `whatsapp_verify_click` (+ `audience`, `cohort`), mirroring the existing event style. Meta Pixel: reuse the existing pixel; **separate pixel/event mapping = TBD**.

---

## 14. ACCEPTANCE CHECKLIST (run, don’t assume)
**Build:** `npm run lint` and `npm run build` pass. Report before/after bundle sizes.
**Routes:** `#/`, `#/monthly-content`, `#/promotional-mini-series`, `#/training`, `#/training/business`, `#/training/creators`, `#/ai-video`, `#/admin…` work; back/forward OK; no regressions.
**Visual:** cylinder wall intact (drag, keys, reduced-motion) and ≤ 1 per page; no overflow at 320, 360, 390, 430, 768, 1024, 1440; dark training theme AA-contrast; type scale and spacing consistent.
**Offers:** ₦200,000 / 15 videos default; edit price in admin → every price, form and WhatsApp text updates; one revision round visible in offer + FAQ; ownership wording editable and carries the third-party caveat; no promise of unlimited revisions or results.
**Training:** seat states change correctly with capacity/thresholds from admin; counter uses **paid** only; full state swaps CTA; countdown never resets; prices by country; refund text editable; curriculum cards accessible; no tool names public; CirclesFundMe block hidden until approved.
**Leads/payments:** no false success; idempotent submit; server-side price/offer validation; booking click ≠ booked; WhatsApp URL-encoded and uses live values; “Mark as paid” works with confirmation and undo; CSV import previews first.
**Admin:** every task in 9.6 doable at 390px; Start-Next-Cohort wizard completes; unsaved-change guard; destructive confirmations; keyboard/focus/labels OK.
**Notifications:** real + consented only; nothing shown otherwise; dismissible; never covers CTA/forms.
**Security:** no lead/registration/admin data readable by anon; RLS verified by reading the policies; no keys in client.

### Final report (required)
1. What was implemented. 2. Routes added. 3. How the cylinder wall was preserved/optimised. 4. Components/integrations reused. 5. Admin controls added. 6. CirclesFundMe preview behaviour and approval gate. 7. Lead → booking → WhatsApp flow. 8. Training funnel and seat logic. 9. Notifications and consent. 10. Checks run **with real results**. 11. Remaining configuration: run `migration-4-training.sql`; set booking URL; set payment URLs; upload resources and headshots; email provider; Selfany sync status (manual only for now). 12. Any assumption you made (e.g. dark theme, 90 vs 80% almost-full).

---

## 15. TBD REGISTER (build editable placeholders; never invent)
Meeting platform and link · language of instruction confirmation · tool/subscription guidance for students · phone-only feasibility · which sessions each instructor leads · instructor headshots, intro videos, social links · CirclesFundMe **permission** for name, 10,000+ goal, 1,000+ conversations, screenshots · whether the 1,000+ ecommerce orders and writing-contract claims can be evidenced publicly · real testimonials/past-student proof (**none yet → show honest process/work proof instead**) · Selfany capabilities (webhooks/API/export/redirect/receipts) and per-country payment URLs · email provider · community platform and link (WhatsApp/other) · tax/terms/privacy text (draft placeholders for owner review) · final refund variant (locked default above) · minimum-to-run action (internal) · Meta pixel events per page · SendFox/Sheet/Make routing per page · booking URL for the strategy call · Cohort 1 final enrollment close date (default Sun 15 Nov 2026) · "almost full" threshold (default 90 of 100; alternate 80%) · whether to show the seat counter from zero or only after a threshold.

**Begin now: read the zip, run the M0 baseline checks, post the ≤ 40-line plan, then build M0 → M8.**
