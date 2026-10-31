# Mini-Series Hero Hook, Mobile Spotlight Carousel & Zero-Lag Video Lightbox Plan

This update adds the second-hook narrative subheadline to the AI Promotional Mini-Series hero while the VSL video is hidden, replaces the awkward mobile stacking of the CirclesFundMe spotlight reels with a smooth horizontal swipe carousel (3-across on desktop), eliminates YouTube player boot-up lag, and adds a clear, high-contrast Exit/Close button whenever a visitor watches a video from the 3D cylinder.

## User Review & Critical Decisions

> [!IMPORTANT]
> Summary of choices confirmed during clarification:

- **Confirmed Decision 1 — Mini-Series Hero Second Hook (No VSL Prompt)**: Display the second hook from the VSL narrative directly below the main headline (*"Here is how to get their attention: Turn them into brand ambassadors who share your videos, and make them choose you over your competitors with stories that keep them engaged, build a connection, and drive conversions."*) without the "Watch This Video" label while the VSL link is not yet set.
- **Confirmed Decision 2 — CirclesFundMe Spotlight Mobile Layout**: Arrange the 3 CirclesFundMe vertical reels in a smooth horizontal swipe carousel on mobile viewports and a clean 3-across row on desktop so cards never stack 2-over-1 on phones.
- **Confirmed Decision 3 — Click-to-Play with Instant Boot-Up**: Do not autoplay videos in the background; instead, eliminate click-to-play boot-up lag using early TLS preconnects to YouTube embed servers, instant thumbnail placeholders during iframe initialization, and pausing the 3D cylinder animation loop while the player modal is open.
- **Confirmed Decision 4 — Unmistakable Video Lightbox Exit Button**: Add a prominent, high-contrast **"✕ Close Video"** button bar directly on the video player header and top-right corner, and automatically hide floating navigation/sticky bars while the video lightbox is open.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Mini-Series Hero Subheadline**: Bridges the bold Chapter 1 headline (*"Your customers are tired of your boring 'buy now' messages"*) directly into the core value proposition with the second hook so the hero reads as a complete, persuasive funnel statement without needing a VSL box.
  2. **Mobile-First Spotlight Carousel**: Transforms the CirclesFundMe client spotlight section from a wrapping flex grid into a touch-friendly horizontal snap carousel on mobile while keeping the balanced 3-across presentation on desktop.
  3. **Fast YouTube Player Boot-Up**: Warms up YouTube embed connections ahead of time and pauses background 3D animations while a video is open so clicking any video launches smoothly without lag.
  4. **Clear Exit Button on Cylinder Video Player**: Ensures every video opened from the 3D cylinder or showcase has an immediately visible, accessible **"Close / Exit Video"** button on both mobile and desktop.
- **Target Audience / Persona**: Mobile and desktop prospects exploring AdVibe Studios' portfolio reels and the AI Promotional Mini-Series funnel.
- **Key Value**: Smoother mobile browsing, stronger funnel continuity above the fold, faster video playback initialization, and friction-free navigation back to the page after watching a reel.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Mini-Series Hero Flow**: Visitors land on the AI Promotional Mini-Series page, read the primary headline, and immediately see the highlighted second-hook subheadline (*"Here is how to get their attention..."*) leading directly into the *"Book Your Free Strategy Call"* and *"Chat on WhatsApp"* CTAs.
  2. **CirclesFundMe Spotlight Mobile Swipe Flow**: On mobile screens, visitors see the first vertical reel framed cleanly with a peek of the next card and can swipe horizontally with scroll-snap precision through all 3 CirclesFundMe reels. On tablet and desktop screens, all 3 vertical reels sit side-by-side in a single balanced row.
  3. **Cylinder Video Watch & Exit Flow**: When a visitor clicks any card in the 3D rotating cylinder (or any portfolio grid), the floating navigation bar hides, the 9:16 vertical player opens immediately with its cached thumbnail while the stream connects, and a prominent **"✕ Close Video"** button at the top of the player frame (plus backdrop tap and Escape key support) lets them exit in one tap.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Editorial studio craft matching each section's native surface (obsidian `#0b0e12` with warm gold `#f5a524` accents in the Mini-Series hero; mint-tinted editorial card in the Homepage Client Spotlight).
  - *Typography & Hierarchy*: `Bricolage Grotesque` display lead-in (*"Here is how to get their attention:"*) paired with readable `Figtree` body prose (*"Turn them into brand ambassadors..."*), constrained with `text-wrap: balance` and comfortable line lengths.
- **Interactive Feedback & Motion**:
  - Native CSS `scroll-snap-type: x mandatory` for zero-jitter mobile swiping.
  - Compositor-only fade transition (`opacity`) when the YouTube iframe finishes loading over its instant poster frame.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Always-Visible Second Hook Subheadline vs. VSL-Only Banner**
  - *Chosen Approach*: Decouple the second-hook subheadline from the VSL player conditional so the narrative hook always renders below the H1, and only show the *"Watch This First · 2-Minute Cinema Trailer"* kicker and video box when a VSL YouTube ID is configured.
  - *Why*: Keeps the funnel persuasive and complete right now while remaining ready for the VSL video later.
- **Decision 2: Preconnect + Cylinder RAF Pause vs. Background Iframe Preloading**
  - *Chosen Approach*: Use `<link rel="preconnect">` for YouTube's embed origins, display an instant cached thumbnail frame until the iframe fires `onLoad`, and pause the 3D cylinder's `requestAnimationFrame` loop when `body.is-modal-open` is active.
  - *Why*: Preloading hidden iframes in the background slows down initial page load and wastes mobile data, whereas preconnecting + pausing background 3D rendering makes both the site and video startup fast.
- **Decision 3: Self-Contained Lightbox Header Close Button**
  - *Chosen Approach*: Render an explicit top control bar on the `Lightbox` player frame with a high-contrast **"✕ Close"** pill button in addition to the corner close button, and toggle `body.is-modal-open` whenever the lightbox is active.
  - *Why*: Guarantees the close button is never covered by floating headers or pushed off-screen on tall 9:16 mobile reels, and works across all pages (Homepage, Mini-Series, Retainer, and Training pages).

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Document Head Preconnects                         │
│     i.ytimg.com · www.youtube.com · www.youtube-nocookie.com · s.ytimg   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌─────────────────────┐   ┌──────────────────────┐   ┌─────────────────────┐
│  Mini-Series Hero   │   │  Client Spotlight    │   │  3D Cylinder Wall   │
│  ─────────────────  │   │  ──────────────────  │   │  ─────────────────  │
│  H1 + Second-Hook   │   │  Mobile: Horizontal  │   │  Pauses RAF loop    │
│  Subheadline Block  │   │  Snap Carousel       │   │  when modal is open │
│  (VSL box hidden    │   │  Desktop: 3-Across   │   │  Opens Lightbox on  │
│   until ID is set)  │   │  Balanced Row        │   │  card tap           │
└─────────────────────┘   └──────────┬───────────┘   └──────────┬──────────┘
                                     │                          │
                                     └────────────┬─────────────┘
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │   Zero-Lag Video Lightbox     │
                                  │   ─────────────────────────   │
                                  │   • Sets body.is-modal-open   │
                                  │   • Top "✕ Close Video" Bar   │
                                  │   • Instant Thumbnail Poster  │
                                  │     + Smooth Iframe Reveal    │
                                  └───────────────────────────────┘
```

### Interactive Component & State Mapping
- **Mini-Series Hero Subheadline**: Renders unconditionally below the H1; if `vslYoutubeId` is empty, omits the `"WATCH THIS FIRST"` badge and player frame; if `vslYoutubeId` is populated later in Admin, displays the badge and cinema trailer player below the subheadline.
- **Client Spotlight Carousel**: Uses horizontal scroll-snap (`scroll-snap-type: x mandatory`, `overflow-x: auto`) on viewports `< 768px` with `72vw` max-width 9:16 cards so cards never wrap 2-over-1, switching to a 3-column centered row on `>= 768px`.
- **3D Cylinder & Lightbox Synchronization**: Opening `Lightbox` sets `body.is-modal-open`, hiding floating nav/sticky bars and signaling `Wall` to pause its rotation tick until the user clicks **"✕ Close Video"**, taps the backdrop, or presses `Escape`.
