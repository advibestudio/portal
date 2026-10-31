# CirclesFundMe Video Portfolio & VSL Update Plan

We will remove every placeholder video across the website and replace them with the **9 real CirclesFundMe campaign videos**, formatted for a **9:16 vertical mobile reel player**, while hiding the top VSL player boxes on the **Monthly Retainer** and **AI Promotional Mini-Series** pages until their dedicated VSL videos are provided.

---

## 1. Replace All Placeholder Videos with the 9 CirclesFundMe Reels
All legacy placeholder YouTube IDs (`aqz-KE-bpKQ`, `eRsGyueVLvQ`, `jfKfPfyJRdk`, `dQw4w9WgXcQ`, `60ItHLz5WEA`, `9bZkp7q19f0`, `kJQP7kiw5Fk`) will be completely removed from the site defaults, cached browser storage, and synced Firestore site content.

In their place, we will load your **9 official CirclesFundMe videos** (`client: "CirclesFundMe"`, `orientation: "vertical"` for 9:16 mobile reel playback) distributed across your ad categories so every filter tab in **Our Work** and the **3D Hero Wall** showcases real work:
1. **`YSTvgHJ9vRU`** — CirclesFundMe Campaign Reel 01 (*Service Ads*)
2. **`NuUviJm2DLo`** — CirclesFundMe Campaign Reel 02 (*Story Ads*)
3. **`XUn7L2s-Bqk`** — CirclesFundMe Campaign Reel 03 (*Launch Ads*)
4. **`QsqKNOo1uDQ`** — CirclesFundMe Campaign Reel 04 (*Brand Films*)
5. **`JecWfFOuUp0`** — CirclesFundMe Campaign Reel 05 (*Service Ads*)
6. **`lE5JSLxRCU4`** — CirclesFundMe Campaign Reel 06 (*Story Ads*)
7. **`sbirMUA3WNU`** — CirclesFundMe Campaign Reel 07 (*Promo Videos*)
8. **`1nUi3LNvFHs`** — CirclesFundMe Campaign Reel 08 (*Product Ads*)
9. **`a1HbWwqF5-A`** — CirclesFundMe Campaign Reel 09 (*Brand Films*)

---

## 2. 9:16 Vertical Mobile Reel Display Across All Showcases
- **Homepage 3D Wall & Our Work Gallery**: All 9 videos will render and open in the **9:16 vertical reel lightbox player**.
- **Homepage Client Spotlight & CirclesFundMe Case Modal**: The CirclesFundMe spotlight section and proof modal on the commercial pages will automatically pull and play these 9 real vertical reels.
- **Training & Sales Proof Sections**: Update `salesDefaults.ts` and `commercialOffers.ts` so all proof reels reference your real CirclesFundMe video IDs with zero placeholder fallbacks.

---

## 3. Hide Top VSL Player Boxes Until Dedicated VSL Links Are Ready
- **AI Promotional Mini-Series Page**: Hide the "Watch This First · 2-Minute Cinema Trailer" banner and top VSL player box when no dedicated VSL link is set, while keeping the 3D Portfolio Wall and CirclesFundMe Case Reel active further down the page.
- **Monthly Retainer Page**: Ensure no top VSL player box is shown until a dedicated VSL link is provided, and update the deliverable preview cards to use the real CirclesFundMe vertical reels.
- **Ready for Future VSL Links**: Add an optional `vslYoutubeId` field to both commercial packages so that as soon as you share the VSL links (or paste them in the Admin Dashboard), the top VSL player will automatically appear.
