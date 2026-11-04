# Hero Video GitHub Bundling, Dark Cinema Grade Restoration & Slow-Internet Mobile Fix

Resolves all three issues identified from your mobile screenshot (`image_5aadc50e.png`): bundles the uploaded video directly inside the website's tracked source assets so it always deploys to GitHub Pages, restores the rich dark cinema overlay you liked, and fixes the mobile zoom-crop blur and slow-internet startup time.

### User Review & Critical Decisions

> [!IMPORTANT]
> **3 Root Causes Diagnosed from Your Mobile Screenshot (`image_5aadc50e.png`)**:
> 1. **Why the Video Missing / Slow Issue Happened on GitHub Pages**: The video paths used root-absolute URLs (`/assets/aistudio/...`) instead of Vite-bundled / relative (`./assets/...`) paths. When hosted on GitHub Pages (e.g. `/portal/`), root-absolute `/assets/...` requests fail with a 404 or bypass the bundle. We will place the video and poster directly inside `src/assets/hero/` (imported via Vite so they are committed to Git and automatically bundled into `dist/assets/`) as well as relative `./assets/aistudio/` paths.
> 2. **Why It Looked Too Bright & Zoomed-In/Blurry on Mobile**:
>    - Removing the dark overlay and adding `brightness-110` washed out the moody cinema atmosphere and made the video clash with the text.
>    - On a tall vertical phone screen, applying `object-cover` to a `16:9` widescreen video zoomed **320% into the dead center**, cutting off 4 of the 6 mosaic columns and stretching just 2 tiles (the horse and coffee cup) across the entire screen.
> 3. **How We Fix Both Visuals & Slow-Internet Mobile Speed**:
>    - **Restore Moody Dark Cinema Overlay**: Bring back the dark obsidian wash (`bg-[#07090d]/42` + center radial vignette `78%` center → `48%` edges + warm `#f5a524` gold glow) and remove `brightness-110` so it looks just like the rich dark version you liked while keeping the mosaic subtly visible.
>    - **Proper Mobile Mosaic Framing + Ultra-Light Slow-Network Stream**: Format the mobile video stream and framing so mobile visitors see a multi-tile mosaic grid (not 2 giant zoomed-in blurry tiles), encoded with H.264 `+faststart` and an embedded tiny blurred/sharp first-frame data preview that paints in **0ms** even on 3G / slow mobile internet.

---

### 1. Overview & Core Concept

- **What It Does**: Embeds your uploaded mosaic video directly into the website's bundled codebase, restores the rich dark cinema aesthetic, and ensures the mosaic grid looks sharp and boots immediately on mobile devices—even on slow internet connections.
- **Target Audience / Persona**: Mobile and desktop visitors opening the **AI Promotional Mini-Series** (`#/promotional-mini-series`) and **Monthly AI Video Content Retainer** (`#/monthly-content`) pages on AI Studio or GitHub Pages.
- **Key Value**: Guaranteed video inclusion in Git/GitHub deployments, authentic dark cinema aesthetics matching your reference, and instant startup on slow mobile connections without blurry 2-tile zoom cropping.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **0ms Instant Paint (Even on Slow 3G)**: An ultra-lightweight inline/bundled first-frame WebP backdrop paints immediately with the dark cinema vignette already applied—zero blank screen and zero wait for network handshakes.
  2. **Rich Dark Cinema Look**: The mosaic video plays smoothly behind a balanced dark obsidian scrim (`42%` base wash + `78%` center text radial scrim tapering to `48%` on the outer grid), so the videos are tastefully visible in the background while the white and `#f5a524` gold typography pops with crystal clarity.
  3. **Multi-Tile Mobile Mosaic Composition**: On mobile viewports, the video framing preserves the multi-tile mosaic aesthetic rather than zooming 320% into just two center tiles.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Dark Cinema Studio Mosaic (`#07090d` obsidian, `#f5a524` AdVibe gold, `#ffffff` crisp white).
  - *Color Palette & Mood*: Restores the deep cinema contrast from the initial version you liked, removing the artificial `brightness-110` filter.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Vite-Bundled `src/assets/hero/` Imports + Relative Public Assets**
  - *Chosen Approach*: Store the optimized video streams and WebP poster inside `src/assets/hero/` and import them as ES module asset URLs in `HeroMosaicVideoBackdrop.tsx`, while also keeping relative `./assets/aistudio/...` copies in `public/`.
  - *Why*: Ensures the video files are tracked in GitHub and resolved correctly by Vite (`base: './'`) regardless of whether the site is hosted at the root domain or a GitHub Pages subfolder (`/portal/`).
- **Decision 2: Mobile-Optimized Multi-Tile Framing & Fast-Start Encoding (~550 KB)**
  - *Chosen Approach*: Encode a dedicated mobile stream (`hero-video-mobile.mp4`, ~550 KB, `-movflags +faststart`, keyframe at frame 0) and adjust mobile video sizing so more of the mosaic grid is visible instead of over-magnifying two center tiles.
  - *Why*: Eliminates pixelation on portrait mobile screens while cutting the mobile video download size by **93%** compared to the 8.4 MB raw upload so it boots rapidly on slow internet.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│               Git-Tracked & Vite-Bundled Hero Media Assets              │
│  • Bundled in src/assets/hero/ + relative ./assets/aistudio/            │
│  • Works identically on AI Studio, Custom Domains & GitHub Pages        │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    HeroMosaicVideoBackdrop Component                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  1. Instant 0ms First-Frame Poster Layer (WebP)                   │  │
│  │     • Paints immediately on slow mobile internet                  │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │  2. Fast-Start Responsive Video Stream                            │  │
│  │     • Mobile: ~550 KB faststart stream + multi-tile framing       │  │
│  │     • Desktop: ~1.8 MB faststart HD stream                        │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │  3. Restored Dark Cinema Vignette Stack                           │  │
│  │     • Base obsidian wash (bg-[#07090d]/42)                        │  │
│  │     • Center text radial scrim (78% center -> 48% outer mosaic)   │  │
│  │     • Subtle #f5a524 brand gold ambient glow + top/bottom fades   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Interactive Component & State Mapping**:
  - **Slow-Internet Resilience**: The poster frame and dark cinema vignette render at 0ms from bundled assets; the `<video>` element streams progressively from byte 0 (`+faststart`) and seamlessly plays underneath the dark vignette as soon as the first GOP (group of pictures) arrives.
