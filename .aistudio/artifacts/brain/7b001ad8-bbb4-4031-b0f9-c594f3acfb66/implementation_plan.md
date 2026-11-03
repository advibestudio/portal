# Promotional Mini-Series Page Visual & Theme Fixes

## Root Cause Analysis from Uploaded Screenshots

1. **Invisible Text in "THE TRANSFORMATIVE QUESTION" Callout (`image_beae45cb.png`)**
   - In Chapter 3 of `src/pages/commercial/MiniSeriesPage.tsx`, the callout box has `bg-[#111412] text-white`, and its main headline `<p>` has `text-white`.
   - In `src/index.css`, the light-mode adaptation rule `html[data-theme="light"] .theme-adaptive .text-white:not(.bg-\[\#111412\]):not(...)` has higher CSS specificity `(0, 6, 1)` than `html[data-theme="light"] .theme-adaptive .bg-\[\#111412\] .text-white` `(0, 3, 1)`.
   - Because both rules use `!important`, the higher-specificity rule wins and forces child `.text-white` elements inside `.bg-[#111412]` containers to become `#111412` (black text on a `#111412` black background), making the question text completely invisible.

2. **Muddy, Low-Contrast Comparison Cards (`image_c1f2f992.png`)**
   - In Chapter 2 of `src/pages/commercial/MiniSeriesPage.tsx`, **"THE REPETITIVE AD TRAP"** (`bg-red-50/50 text-red-950/80 border-red-200/80`) and **"THE EPISODIC MINI-SERIES"** (`bg-emerald-50/50 text-emerald-950/80 border-emerald-200/80`) sit inside a `<section>` that lacks a surface background class, inheriting the root container's `#0b0e12` dark background.
   - As a result, `bg-red-50/50` and `bg-emerald-50/50` blend 50% white-tinted pastel over `#0b0e12` black into muddy grey-brown and muddy grey-green boxes while keeping dark `text-red-950/80` and `text-emerald-950/80` text.

3. **Unstyled Section Backgrounds & Dark/Light Mode Consistency Across `MiniSeriesPage.tsx`**
   - Chapters 2, 5, 6, and the CirclesFundMe proof section in `MiniSeriesPage.tsx` use dark foreground text (`text-[#111412]`, `text-[#2a302b]`) without an explicit `<section className="bg-[#fafaf6] text-[#111412]">` wrapper.
   - In `AnimatedStoryGraphic.tsx` (used in Chapter 5), the mode toggle button uses `bg-white/10 text-white/60`, which becomes low-contrast on light cards.

---

## Proposed Changes

### 1. Fix CSS Specificity & Dark/Light Surface Rules (`src/index.css`)
- Update the light-mode `.text-white` rule in `src/index.css` so it never overrides `.text-white` elements that are descendants of dark containers (`.bg-[#111412]`, `.keep-dark`, `.vcard`, `.bg-black`), and raise the specificity of `.bg-[#111412] .text-white` and `.keep-dark .text-white` so white text on intentionally dark callout cards remains crisp `#ffffff` in both Light and Dark modes.
- Add explicit dark-mode adaptation rules for light red/emerald comparison cards so they render with high-contrast dark surfaces and bright legible text in Dark mode and crisp tinted surfaces with deep legible text in Light mode.

### 2. Fix Section Wrappers, Callout Contrast & Comparison Cards (`src/pages/commercial/MiniSeriesPage.tsx`)
- **Chapter 2 ("The Repetitive Ad Trap" vs. "The Episodic Mini-Series")**:
  - Wrap Chapter 2 in a full-width `bg-[#fafaf6] text-[#111412]` section container so its editorial hierarchy alternates cleanly with Chapter 1 (`#0b0e12`).
  - Redesign the **"The Repetitive Ad Trap"** and **"The Episodic Mini-Series"** cards with high-contrast, opaque surfaces, clear borders, generous padding, and responsive typography so they never blend into a muddy grey or clip text in either theme.
- **Chapter 3 ("The Transformative Question")**:
  - Mark the **"THE TRANSFORMATIVE QUESTION"** dark callout box with `keep-dark` and explicit white text styling (`!text-white`) so the question *"What if your brand could become the reason people stop scrolling, instead of always paying someone else to get them to look?"* is 100% legible in both Light and Dark modes.
- **Chapters 5, 6 & CirclesFundMe Proof Section**:
  - Add explicit full-width `bg-[#fafaf6] text-[#111412]` wrappers to Chapters 5, 6, and the CirclesFundMe proof section so every chapter has a consistent, intentional background in both Light and Dark modes.

### 3. Polish Interactive Story Graphic & Retention Graph Contrast (`src/components/animations/AnimatedStoryGraphic.tsx` & `src/components/animations/RetentionCurveGraph.tsx`)
- Ensure the `4K Camera Viewfinder` / `Production Slate` toggle buttons in `AnimatedStoryGraphic.tsx` and the legend/axis labels in `RetentionCurveGraph.tsx` maintain high contrast in both Light and Dark modes.

---

## Verification Plan
- Run `compile_applet` to verify zero TypeScript or CSS build errors.
- Verify that **"THE TRANSFORMATIVE QUESTION"** card displays bright white headline text on its dark `#111412` background in both Light and Dark modes.
- Verify that **"THE REPETITIVE AD TRAP"** and **"THE EPISODIC MINI-SERIES"** cards have crisp, high-contrast backgrounds and legible text across mobile and desktop viewports in both Light and Dark modes.
