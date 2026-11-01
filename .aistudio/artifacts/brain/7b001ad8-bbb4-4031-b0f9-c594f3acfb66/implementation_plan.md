# Mobile Layout & Button Overflow Fixes Plan

This update resolves the three mobile viewport overflow and clipping issues shown in your screenshots: the **CirclesFundMe Client Spotlight** section expanding wider than the mobile screen (clipping the bullet text and video carousel), the **"Create my campaign videos"** button overflowing the Sales Seasons card, and the **"Explore Monthly Retainer (15 videos)"** button overflowing the Monthly Retainer callout card in the Packages section.

## User Review & Critical Decisions

> [!IMPORTANT]
> All three issues stem from CSS Grid intrinsic minimum-width sizing and fixed `nowrap` button widths on narrow mobile viewports (`320px–430px`). No functional logic or copy is removed—every section and button will fit cleanly inside its card boundaries on mobile while preserving the desktop layout.

- **Fix 1 — CirclesFundMe Client Spotlight Container & Carousel (`Screenshot 1`)**: Enforce `min-width: 0` and `max-width: 100%` on the Spotlight grid and its child columns so the horizontal video reel carousel scrolls *inside* the mint card rather than stretching the entire card off the right edge of the phone screen. Also refine card caption spacing so the two-line client subtitle sits comfortably above the bottom edge.
- **Fix 2 — Sales Seasons CTA Button (`Screenshot 2`)**: Make `.btn-studio` responsive on mobile screens (`max-width: 100%`, balanced mobile horizontal padding and font size, and text wrapping support when a label exceeds the card width) so **"Create my campaign videos"** stays completely inside the warm seasonal card.
- **Fix 3 — Monthly Retainer Bridge Callout Button (`Screenshot 3`)**: Stack the Monthly Retainer callout banner cleanly on mobile viewports and allow **"Explore Monthly Retainer (15 videos)"** to span full card width with proper inner padding so the arrow icon never clips past the card border.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Constrains the Client Spotlight Grid on Mobile**: Fixes the CSS Grid blowout where the 3-card horizontal video carousel forced `.spotlight` wider than `100vw`, which cut off *"A repeat client — they keep coming back"* and pushed the mint card border to the left of the second reel.
  2. **Responsive Pill CTA Buttons**: Ensures all primary pill buttons (`.btn-studio` and `.btn-studio.is-sm`) respect their parent card's width (`max-width: 100%`, `box-sizing: border-box`) on mobile viewports (`< 640px`), scaling font size and padding gracefully so long labels never protrude outside rounded cards.
  3. **Refined Vertical Video Card Footer Spacing**: Adjusts the bottom gradient and metadata padding inside 9:16 vertical video cards on mobile so subtitles like *"CirclesFundMe · Verified Client Campaign"* have breathing room above the bottom border.
- **Target Audience / Persona**: Mobile visitors browsing AdVibe Studios on iOS and Android phones (`360px–430px` viewport widths).
- **Key Value**: Zero horizontal overflow, crisp card borders, readable bullet points, and properly aligned CTA buttons across all mobile sections.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  - **Client Spotlight Flow**: On mobile, the mint-tinted CirclesFundMe card stays 100% contained within the page margins. All check-list bullets wrap cleanly inside the card, and swiping the 3 vertical reels scrolls smoothly inside the card boundary with a clear peek of the next reel.
  - **Sales Seasons & Package Callout Flow**: Both **"Create my campaign videos"** and **"Explore Monthly Retainer (15 videos)"** sit centered and fully contained inside their parent cards with the gold circular arrow badge (`→`) aligned inside the right edge of the button.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Warm editorial studio aesthetic (`--bg: 250 250 246`, `--ink: 17 20 18`, `--brand: 245 165 36`, `--mint: 200 245 222`, `--butter: 255 238 166`).
  - *Spatial & Typographic Math*:
    - Outer container padding (`20px–24px` on mobile) $\ge$ inner element gap (`12px–14px`).
    - Buttons on mobile use `width: 100%` or `max-width: 100%` with `padding: 6px 6px 6px 18px` and `font-size: clamp(13.5px, 3.8vw, 16px)` so single-line CTA labels fit comfortably alongside the `36px` circular arrow icon.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Fixing Grid Track Blowout in Client Spotlight**
  - *Chosen Approach*: Apply `grid-template-columns: minmax(0, 1fr)` on mobile (`<= 899px`), set `min-width: 0; max-width: 100%; overflow: hidden;` on `.spotlight` and `.spot-videos-wrap`, and size mobile carousel items to `flex: 0 0 min(220px, 72%)` with scroll-snap alignment.
  - *Why*: In CSS Grid, a grid item containing a flex scroller defaults to `min-width: auto`, expanding the grid column to the sum of the flex items' widths unless `minmax(0, 1fr)` and `min-width: 0` are explicitly set on the grid track and wrapper.
- **Decision 2: Responsive `.btn-studio` Sizing on Narrow Viewports**
  - *Chosen Approach*: Add mobile-specific rules (`@media (max-width: 639px)`) to `.btn-studio` and `.btn-studio.is-sm` setting `max-width: 100%`, reducing left padding from `26px` to `18px`, scaling font size with `clamp(13.5px, 3.7vw, 15.5px)`, allowing text to wrap cleanly if needed (`white-space: normal; text-align: left; line-height: 1.2`), and keeping `.btn-arrow` `flex-shrink: 0`.
  - *Why*: Prevents any long CTA label across the entire site from ever poking out of its parent card on narrow phones (`360px–390px` wide).

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Mobile Container & Button Containment Diagram**:

```
┌─────────────────────────────────────────────────────────────────┐
│ Mobile Viewport (360px - 430px) — .wrap (padding-inline: 16px)  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ 1. Client Spotlight (.spotlight) ────────────────────────┐  │
│  │  grid-template-columns: minmax(0, 1fr); overflow: hidden; │  │
│  │  • Copy Column (.spot-copy, min-width: 0)                 │  │
│  │    ✓ Many campaigns delivered                             │  │
│  │    ✓ A repeat client — they keep coming back  (wraps!)    │  │
│  │  • Carousel Wrapper (.spot-videos-wrap, min-width: 0)     │  │
│  │    ┌───────────────────┐ ┌──────────                      │  │
│  │    │ Reel 01 (72% w)   │ │ Reel 02  (scrolls inside card) │  │
│  │    └───────────────────┘ └──────────                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ 2. Sales Seasons (.seasons) ─────────────────────────────┐  │
│  │  padding: 24px 20px (mobile)                              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Create my campaign videos                       (→) │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ 3. Monthly Retainer Bridge Callout ──────────────────────┐  │
│  │  flex-direction: column (mobile); padding: 18px 16px      │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Explore Monthly Retainer (15 videos)            (→) │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

- **Interactive Component & Layout Mapping**:
  - **Client Spotlight (`.spotlight`, `.spot-copy`, `.spot-videos-wrap`, `.spot-videos`)**:
    - Ensure `.spotlight` has `overflow: hidden` and `grid-template-columns: minmax(0, 1fr)` on viewports `<= 899px`.
    - Ensure `.spot-copy` and `.spot-videos-wrap` have `min-width: 0; width: 100%; max-width: 100%;` so long bullet points wrap cleanly and `.spot-videos` scrolls horizontally within the card's inner width.
    - Adjust `.vcard-info` bottom padding and line-height on mobile so multi-line video titles and client metadata never clip at the bottom of the 9:16 frame.
  - **Sales Seasons Card (`.seasons`) & Global `.btn-studio`**:
    - Reduce `.seasons` mobile padding (`padding: 28px 20px`) to maximize inner content width on phones.
    - Update `.btn-studio` and `.btn-studio.is-sm` on mobile (`max-width: 100%`, responsive font size and padding, `flex-shrink: 0` on `.btn-arrow`) so buttons never overflow their container.
  - **Monthly Retainer Callout in Packages (`Pricing`)**:
    - Make the callout container and its `.btn-studio.is-sm` button full-width (`width: 100%`, `max-width: 100%`, `justify-content: space-between`) on mobile so `"Explore Monthly Retainer (15 videos)"` fits with zero right-edge overflow.
