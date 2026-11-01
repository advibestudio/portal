# Client Portal Mobile UI Fixes & Direct Brand Asset File Upload Plan

## 1. Fix Crushed & Overflowing Navigation Tabs in Client Portal (`/src/pages/CustomerPortalPage.tsx`)
- **Issue Shown in Screenshot 1 (`image_e0434af7.png`)**:
  - The workspace tab bar (`Project Overview`, `Scripts, Approvals & Brand Assets`, `Google Drive Video Deliverables`) uses a single horizontal flex row without `shrink-0` or responsive wrapping. On mobile screens, the first tab collapses into a tiny orange pill showing only `"P"`, while the second tab overflows off the right edge.
- **Fix**:
  - Convert the navigation tab bar into a responsive grid (`grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-b border-white/10 pb-4`) where every tab button is full-width on mobile (`w-full justify-between sm:justify-center min-w-0`) with clean, unclipped labels and badge counters so all 3 workspace sections are 100% readable and tap-friendly on every screen size.

## 2. Fix Mobile Overflow & Add Direct File Upload for Brand Assets (`/src/lib/customerPortalStore.ts` & `/src/pages/CustomerPortalPage.tsx`)
- **Issue Shown in Screenshot 2 (`image_ce581cdb.png`)**:
  - Inside each script card's **"Provide Assets for This Video"** box, the URL input and `+ Attach Link` button sit in an unwrapped horizontal row that overflows the right border of the card on mobile.
  - Additionally, clients need to **upload brand assets directly from their phone or computer** (logos, product photos, short clips, voiceover audio, PDFs) in addition to pasting Google Drive/cloud links.
- **Data Model Upgrade (`/src/lib/customerPortalStore.ts`)**:
  - Add `ClientUploadedAsset` interface (`id`, `name`, `mimeType`, `sizeBytes`, `dataUrl`, `uploadedAt`) and optional `clientUploadedAssets?: ClientUploadedAsset[]` onto `ProjectScriptItem`.
- **Client Portal Upload & Link UI (`/src/pages/CustomerPortalPage.tsx`)**:
  - **Direct File Upload Control**: Add a prominent **"Upload Files from Device (Logos, Photos, Audio, PDFs)"** button + hidden `<input type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip" />` inside the Brand Assets box on every script card.
  - **Uploaded Files List**: Display uploaded files with thumbnail previews (for images), file type icons, file size, an **Open / Download** action, and a **Remove** button, automatically synced to Firestore and local storage.
  - **Mobile-Safe Cloud Link Row**: Stack the Google Drive/cloud link input and `+ Attach Link` button cleanly on mobile (`flex flex-col sm:flex-row gap-2` with `min-w-0 w-full`) so the button never overflows the container border.

## 3. Admin Portal & Mobile Client Manager Asset Inspection (`/src/components/admin/ClientProjectsAdminView.tsx`)
- Update the Admin Script & Asset Inspector (used in both Desktop Admin `#/admin` and Co-Founder Mobile Client Manager `#/client-admin`) so any files uploaded directly by a client appear alongside their cloud links with one-tap **Preview / Download File** buttons for the production team.
