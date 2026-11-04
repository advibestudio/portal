# Instant Mobile Hero Video Boot Optimization

Eliminates mobile startup delay on the **AI Promotional Mini-Series** and **Monthly AI Video Content Retainer** hero sections so the mosaic video backdrop appears and begins playing virtually instantaneously on mobile connections.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Root Cause Diagnosed**: The raw uploaded hero video is **8.4 MB** (`hero-video_3a894603.mp4`) and its fallback image is an uncompressed **1.6 MB PNG** (`image_583be17e.png` which also contains baked-in reference screenshot text). On mobile networks, downloading 10 MB of unoptimized media before playback starts causes a noticeable delay.
>
> **Optimization Strategy**:
> - **88% Mobile Video Payload Reduction + Fast-Start Atom**: Encode a dedicated mobile-optimized stream (~850 KB, H.264 with `-movflags +faststart` and muted audio track stripped) alongside a fast-start desktop stream (~2.0 MB) so playback starts on the very first network packet without waiting for the full file.
> - **Instant Clean First-Frame WebP Poster (~35 KB)**: Extract the exact first frame of the clean mosaic video as an ultra-lightweight WebP poster (~98% smaller than the 1.6 MB PNG) and preload it in the document `<head>`, ensuring zero blank screen and zero flash of reference screenshot text while the video stream initializes.

---

### 1. Overview & Core Concept

- **What It Does**: Delivers a zero-lag, instant-booting mosaic video backdrop on both commercial offer pages (`#/promotional-mini-series` and `#/monthly-content`) tailored specifically for mobile bandwidth and mobile browser autoplay engines (iOS Safari and Android Chrome).
- **Target Audience / Persona**: Mobile visitors, founders, and marketing decision-makers clicking through from WhatsApp, Instagram, or mobile search who expect immediate visual polish within the first 300ms.
- **Key Value**: Removes the multi-second black box / loading stall on mobile devices while preserving the exact full-bleed mosaic video aesthetic and AdVibe Studio's signature gold (`#f5a524`), crisp white (`#ffffff`), and obsidian (`#07090d`) brand palette.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **0ms – Instant Visual Frame**: As soon as a visitor opens either commercial page on mobile, the preloaded ~35 KB clean first-frame WebP mosaic image paints immediately behind the headline and gold cinema vignette—no dark flash or layout shift.
  2. **<300ms – Fast-Start Mobile Stream**: Mobile browsers (`max-width: 768px`) automatically select the lightweight fast-start mobile video stream (`~850 KB`), where the MP4 `moov` header sits at byte 0 and unused audio data is stripped, allowing hardware decoding to begin on the first chunk.
  3. **Seamless Crossfade**: Once the first video frame decodes, the video layer transitions in smoothly over the matching first-frame poster with zero visual jump, and programmatic low-power/autoplay recovery ensures playback starts reliably on iOS Safari and Android Chrome.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Dark Cinema Editorial Studio (`#07090d` obsidian canvas, `#f5a524` AdVibe gold highlights, `#ffffff` high-contrast display typography).
  - *Color Palette & Mood*: Retains the multi-layered radial and linear obsidian scrims plus warm gold ambient glow (`rgba(245, 165, 36, 0.16)`) with `.keep-dark` protection across Light and Dark modes.
  - *Typography & Hierarchy*: Bold geometric sans-serif upper headline paired with expressive gold italic serif second line and inline gold highlight pill.
- **Interactive Feedback & Motion**: Compositor-only opacity transition (`transition-opacity duration-300`) from the static first-frame WebP layer to the live video loop, respecting `prefers-reduced-motion`.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Responsive Dual-Stream Encoding (`+faststart`) vs. Single 8.4 MB Raw Video**
  - *Chosen Approach*: Generate a dedicated mobile 720p fast-start MP4 (~850 KB) and a desktop 1080p fast-start MP4 (~2.0 MB) with the silent audio stream removed (`-an`), served via responsive `<source media="(max-width: 768px)">` tags.
  - *Why*: Because the hero backdrop sits behind a dark cinema vignette (`55%–88%` opacity scrim), a ~850 KB 720p stream is visually indistinguishable from the 8.4 MB original on mobile Retina screens while booting up to **10x faster** on 4G/5G connections.
  - *Alternatives Considered*: Keeping the single 8.4 MB video and relying only on `preload="auto"`, which still bottlenecks mobile bandwidth and delays time-to-first-frame.
- **Decision 2: Extracted Frame-0 WebP Poster (~35 KB) vs. Raw 1.6 MB Reference PNG**
  - *Chosen Approach*: Extract frame `00:00:00` directly from the mosaic video as a compressed WebP poster (`~35 KB`) and preload it with `fetchpriority="high"`.
  - *Why*: Reduces initial image weight by 98% and guarantees the poster frame aligns pixel-for-pixel with frame 1 of the video (without flashing the reference screenshot's third-party text overlay).

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Document Head & Asset Preloader                      │
│  • <link rel="preload" as="image" type="image/webp" fetchpriority="high"│
│  • Proactive idle video warm-up for instant route transitions           │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 Reusable Hero Mosaic Video Backdrop                     │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐  │
│  │  Instant Frame-0 WebP Layer   │   │  Fast-Start <video> Element   │  │
│  │  • ~35 KB clean mosaic frame  │   │  • preload="auto" + playsInline│  │
│  │  • Paints at 0ms before video │   │  • Mobile source (<768px)     │  │
│  │    stream finishes buffering  │   │    ~850 KB (+faststart, -an)  │  │
│  └───────────────┬───────────────┘   │  • Desktop source (>768px)    │  │
│                  │                   │    ~2.0 MB (+faststart, -an)  │  │
│                  └─────────┬─────────┴───────────────┬───────────────┘  │
│                            ▼                         ▼                  │
│          ┌───────────────────────────────────────────────────┐          │
│          │   Brand-Tuned Obsidian & Gold Cinema Vignettes    │          │
│          │   • Radial center focus + #f5a524 ambient glow    │          │
│          └─────────────────────────┬─────────────────────────┘          │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│   AI Promotional Mini-Series    │     │  Monthly Video Content Retainer │
│   (#/promotional-mini-series)   │     │        (#/monthly-content)      │
└─────────────────────────────────┘     └─────────────────────────────────┘
```

- **Data Model & State**:
  - `isVideoReady` (`boolean`): Tracks whether the `<video>` element has decoded its first playable frame (`onLoadedData` / `onCanPlay` / `onPlaying`), smoothly layering the playing video over the identical Frame-0 WebP backdrop.
- **Interactive Component & State Mapping**:
  - **Mount & Autoplay Assurance**: On mount, a `useEffect` hook sets `video.muted = true`, `video.defaultMuted = true`, and invokes `video.play().catch(() => {})` to satisfy strict iOS Safari and Android Chrome mobile autoplay policies immediately.
  - **Visibility Recovery**: Listens for `visibilitychange` so if a mobile user switches tabs or apps and returns, the background video resumes playing without stalling.
