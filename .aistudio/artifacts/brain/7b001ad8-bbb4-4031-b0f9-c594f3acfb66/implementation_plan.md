### User Review & Critical Decisions

- **Showcase Segmentation & Structure**: The Our Work Screening Room (`#/our-work`) will be organized into three distinct, visually cohesive zones below the Cinema Screening Stage:
  1. **Featured CirclesFundMe Brand Collection (`#circlesfundme`)**: A dedicated editorial showcase spotlighting CirclesFundMe's campaign reels, verified impact highlights, and a 1-click shareable CirclesFundMe portfolio link.
  2. **Company-Specific Search & Brand Directory (`#company-search`)**: A dedicated company search bar paired with interactive client selector pills (showing reel counts per brand) and 1-click shareable company URLs (`#/our-work?company=<ClientName>`).
  3. **General Work Depository (`#general-depository`)**: The complete master repository of all studio productions with category tabs, aspect-ratio filtering (`9:16 Vertical` vs. `16:9 Widescreen`), and keyword search.
- **Navigation Bar Upgrade**: Both the Our Work Showcase page and the main studio navigation will feature a sleek floating studio pill navbar (`rounded-full`, glassmorphic backdrop blur, crisp 1px border, and balanced 3-zone layout) that adapts seamlessly between White Mode and Dark Mode with quick-jump section links (`Screening Stage`, `CirclesFundMe`, `Company Search`, `All Works`).
- **View-Only Screening Protection**: All video embeds across the Featured CirclesFundMe section, Company Directory, and General Work Depository maintain strict view-only streaming protections (`youtube-nocookie.com`, disabled context menus, no download links).

---

### 1. Overview & Core Concept

The **Our Work Showcase & Screening Room** serves as AdVibe Studio's executive screening portal where prospective clients, partners, and brand teams can watch verified commercial productions without downloading source files.

To elevate both client-specific presentation and broad portfolio exploration, the page will be structured around a curated hierarchy:
- **Cinema Screening Stage & Master Playlist**: An interactive theater at the top of the page where any reel selected from the CirclesFundMe showcase, Company Search, or General Depository immediately loads and plays, accompanied by a synchronized playlist sidebar.
- **Featured CirclesFundMe Brand Collection**: Segments all CirclesFundMe productions into a flagship brand monograph card featuring the client's logo, sector metadata, verified performance outcomes, a "Share CirclesFundMe Portfolio" link (`#/our-work?company=CirclesFundMe`), and dedicated reel cards.
- **Company-Specific Search & Brand Selector**: Enables visitors to search by company name or click any brand pill (e.g., `CirclesFundMe`, `AdVibe Studio`, or any client added in the Admin CMS) to isolate that company's productions and copy a direct company-specific showcase link.
- **General Work Depository**: Houses the full catalog of studio works with multi-dimensional filtering by production category, aspect ratio (`9:16 Vertical` and `16:9 Widescreen`), and title/keyword search.

---

### 2. User Experience & Visual Design

- **Sleek Floating Studio Pill Navbar**:
  - **3-Zone Architecture**:
    - *Left Zone*: Studio emblem, brand wordmark, and subtle `"Screening Room"` editorial subtitle.
    - *Center Zone*: Single-line quick-jump navigation links (`Stage`, `CirclesFundMe`, `By Company`, `All Works`) with active section highlighting and smooth scroll behavior.
    - *Right Zone*: Theme toggle (`White Mode` / `Dark Mode`), 1-click `"Share Link"` button (copies the active company or video link), `Back to Home` link, and the primary emerald `"Book Strategy Call"` action button.
  - **Responsive Discipline**: All navigation items enforce `whitespace-nowrap` with adaptive compact spacing on smaller viewports so the floating pill never wraps awkwardly or crowds adjacent controls.
- **Dual-Theme High-Contrast Palette (`White Mode` & `Dark Mode`)**:
  - **Alabaster Daylight (`White Mode`)**: Warm editorial stone canvas (`#F7F6F2`) paired with pure white elevated cards (`#FFFFFF`), deep obsidian typography (`#0F1412`), muted slate secondary metadata (`#475467`), and forest emerald accents (`#047857`).
  - **Cinema Obsidian (`Dark Mode`)**: Deep carbon theater canvas (`#080B0E`) paired with charcoal cards (`#10151C`), crisp alabaster typography (`#F8FAFC`), cool silver secondary copy (`#94A3B8`), and luminous emerald highlights (`#34D399`).
- **Editorial Card & Metadata Formatting**:
  - Client, category, and aspect ratio metadata on video cards use clean typographic hierarchy with middle-dot (`·`) separators (`CirclesFundMe · Crowdfunding · 9:16 Vertical`) and `tabular-nums` index badges (`#01`, `#02`) rather than cluttered badge clusters.

---

### 3. Key Product Decisions & Trade-Offs

- **Dynamic Client Matching with Admin CMS Compatibility**:
  - *Decision*: Rather than hardcoding CirclesFundMe videos, the Featured CirclesFundMe section dynamically matches items whose `client` field matches `content.client.matchName` (defaulting to `"CirclesFundMe"`), while the Company Search & Brand Directory automatically indexes all unique `client` names present in `content.portfolio`.
  - *Rationale*: Any new video or client added via the Admin Portal automatically populates both the Company Selector pills and the General Depository without requiring code changes.
- **Shareable Deep Links for Both Companies and Individual Videos**:
  - *Decision*: Support URL query parameters for both company filtering (`#/our-work?company=CirclesFundMe`) and direct video playback (`#/our-work?v=<id>`), combinable so sharing a filtered company view opens the page scrolled or filtered directly to that brand's work.
  - *Rationale*: Allows the sales and production team to send tailored links to prospects showcasing either a specific brand case study or a specific reel.

---

### 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   Floating Studio Pill Navbar (3-Zone)                   │
│  [Brand Identity]   [Stage · CirclesFundMe · By Company · All]   [CTAs]  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                 URL Hash & Query Parameter Synchronizer                  │
│          Parses & updates ?v=<videoId> and ?company=<clientName>         │
└───────────┬────────────────────────┬─────────────────────────┬───────────┘
            │                        │                         │
            ▼                        ▼                         ▼
┌───────────────────────┐ ┌──────────────────────┐ ┌───────────────────────┐
│   Cinema Screening    │ │   CirclesFundMe      │ │   Company Search &    │
│   Stage & Playlist    │ │   Brand Collection   │ │   General Depository  │
│                       │ │                      │ │                       │
│ • Active YouTube      │ │ • Matches client ==  │ │ • Company search bar  │
│   NoCookie Player     │ │   CirclesFundMe      │ │   & Brand Pills       │
│ • Up Next Queue       │ │ • Verified metrics & │ │ • Category + Aspect   │
│ • Lightbox Trigger    │ │   Case Study summary │ │   Ratio + Keyword     │
│ • View-Only Shield    │ │ • Direct Share Link  │ │   Master Grid         │
└───────────────────────┘ └──────────────────────┘ └───────────────────────┘
```

1. **URL State Synchronization**:
   - Parse `company` and `v` query parameters from `window.location.hash` on mount and `hashchange`.
   - Selecting a company pill or typing in the Company Search updates the active company filter and provides a 1-click `"Copy Company Link"` button that generates the exact `#/our-work?company=...` URL.
2. **Segmented Data Pipelines**:
   - `allVideos`: All visible portfolio items sorted by `order`.
   - `circlesFundMeVideos`: Filtered subset of `allVideos` matching `CirclesFundMe` (`content.client.matchName`).
   - `companyDirectory`: Aggregated list of unique client brands with their respective reel counts, orientations, and categories.
   - `companyFilteredVideos`: Videos matching the active company search query and selected brand pill.
   - `depositoryVideos`: Master repository filtered by category tab, orientation (`all` / `vertical` / `horizontal`), and keyword search.
