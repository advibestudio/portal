import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { backupSubmissionToGoogleSheet, canUseFirestoreQuota, recordFirestoreQuotaOp } from '@/lib/firestoreSheetsBackupService';

export type PortalPackageType = 'single' | 'pack_5' | 'pack_10' | 'retainer_15';

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  business?: string;
  country?: string;
  password?: string;
  passwordSet: boolean;
  otpCode?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ProjectScriptItem {
  id: string;
  episodeNumber: number;
  title: string;
  hook: string;
  scriptBody: string;
  visualNotes?: string;
  status: 'pending_review' | 'approved' | 'changes_requested';
  clientAssetLinks: string[]; // Google Drive / cloud links provided by customer
  clientRecommendations?: string; // Customer recommendations / creative notes
  revisionExplanation?: string; // Detailed explanation when customer rejects/requests rework
  updatedAt: string;
}

export interface ProjectVideoDeliverable {
  id: string;
  index: number; // 1-based video number
  title: string;
  category: string;
  duration?: string;
  driveUrl: string; // Google Drive link or YouTube link
  status: 'in_production' | 'ready';
  manualDownloadUnlocked?: boolean; // Admin manual override to unlock download regardless of % paid
  uploadedAt: string;
}

export interface CustomerProject {
  id: string;
  ref: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  businessName?: string;
  packageType: PortalPackageType;
  packageName: string;
  totalVideos: number;
  totalPrice: number;
  currency: string;
  paidPercent: number; // 0 to 100, manually approved by Admin
  amountPaid: number;
  paymentNotes?: string;
  status: 'Awaiting Deposit' | 'Scripting & Review' | 'In Production' | 'Ready for Review' | 'Completed';
  scripts: ProjectScriptItem[];
  videos: ProjectVideoDeliverable[];
  unreadScriptAlert?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverableGateSummary {
  minStartDepositPercent: number;
  canBeginWork: boolean;
  unlockedDownloadCount: number;
  viewOnlyCount: number;
  ruleExplanation: string;
  nextMilestoneNote: string;
}

const ACCOUNTS_KEY = 'advibe.customer.accounts.v1';
const PROJECTS_KEY = 'advibe.customer.projects.v1';
const ACTIVE_CUSTOMER_KEY = 'advibe.customer.session.v1';

/**
 * Classifies an offer into one of the 4 commercial payment rules:
 * - 'single': 1 video (100% or >=60% to start; view-only at 60-99%; download at 100%)
 * - 'pack_5': 5 videos (50% deposit to start -> unlocks 2 downloads, 3 view-only; 100% unlocks all 5)
 * - 'pack_10': 10 videos (50% deposit to start -> unlocks 5 downloads, 5 view-only; 100% unlocks all 10)
 * - 'retainer_15': 15-video Monthly Retainer / Mini-Series (40% deposit to start -> unlocks 40% (6 videos), scales with % paid up to 100%)
 */
export function inferPackageTypeAndCount(offerId: string, offerName: string, configuredQty?: number): {
  packageType: PortalPackageType;
  totalVideos: number;
} {
  const lower = `${offerId} ${offerName}`.toLowerCase();
  if (
    configuredQty === 15 ||
    lower.includes('retainer') ||
    lower.includes('mini-series') ||
    lower.includes('mini series') ||
    lower.includes('monthly') ||
    lower.includes('15')
  ) {
    return { packageType: 'retainer_15', totalVideos: configuredQty || 15 };
  }
  if (configuredQty === 10 || lower.includes('10 ') || lower.includes('ten') || lower.includes('scale')) {
    return { packageType: 'pack_10', totalVideos: 10 };
  }
  if (
    configuredQty === 5 ||
    configuredQty === 3 ||
    lower.includes('5 ') ||
    lower.includes('five') ||
    lower.includes('pack') ||
    lower.includes('bundle') ||
    lower.includes('growth')
  ) {
    return { packageType: 'pack_5', totalVideos: 5 };
  }
  return { packageType: 'single', totalVideos: 1 };
}

/**
 * Computes the exact deliverable access rules for a project based on packageType and Admin-approved paidPercent.
 */
export function computeDeliverableGate(project: Pick<CustomerProject, 'packageType' | 'totalVideos' | 'paidPercent'>): DeliverableGateSummary {
  const paid = Math.max(0, Math.min(100, Number(project.paidPercent) || 0));
  const total = Math.max(1, Number(project.totalVideos) || 1);

  if (project.packageType === 'single' || total === 1) {
    const minStartDepositPercent = 60;
    const canBeginWork = paid >= 60;
    const unlockedDownloadCount = paid >= 100 ? 1 : 0;
    const viewOnlyCount = canBeginWork && paid < 100 ? 1 : 0;
    return {
      minStartDepositPercent,
      canBeginWork,
      unlockedDownloadCount,
      viewOnlyCount,
      ruleExplanation:
        '1-Video Package Policy: Requires 100% full payment (or at least 60% deposit) to begin production. At 60%–99% paid, your completed video can be streamed inside the portal (View-Only). Once 100% payment is confirmed, the Google Drive master download link unlocks.',
      nextMilestoneNote:
        paid < 60
          ? `Complete at least 60% deposit (currently ${paid}%) so production & script writing can begin.`
          : paid < 100
            ? `View-Only streaming is active (${paid}% paid). Complete the remaining ${100 - paid}% balance to unlock the master Google Drive download link.`
            : '100% Full Payment Confirmed — Master Google Drive video download is unlocked.',
    };
  }

  if (project.packageType === 'pack_5') {
    const minStartDepositPercent = 50;
    const canBeginWork = paid >= 50;
    const unlockedDownloadCount = paid >= 100 ? 5 : paid >= 50 ? 2 : 0;
    const viewOnlyCount = canBeginWork ? 5 - unlockedDownloadCount : 0;
    return {
      minStartDepositPercent,
      canBeginWork,
      unlockedDownloadCount,
      viewOnlyCount,
      ruleExplanation:
        '5-Video Package Policy: Requires 50% initial deposit to begin work. At 50% paid, you unlock full download access to 2 of your 5 videos while the remaining 3 completed videos are View-Only on the platform until the remaining balance is confirmed.',
      nextMilestoneNote:
        paid < 50
          ? `Complete your 50% deposit (currently ${paid}%) to start work and unlock 2 downloadable videos.`
          : paid < 100
            ? `${unlockedDownloadCount} of 5 videos unlocked for download · 3 videos in View-Only mode until 100% payment (${100 - paid}% remaining).`
            : '100% Full Payment Confirmed — All 5 master videos are unlocked for download.',
    };
  }

  if (project.packageType === 'pack_10') {
    const minStartDepositPercent = 50;
    const canBeginWork = paid >= 50;
    const unlockedDownloadCount = paid >= 100 ? 10 : paid >= 50 ? 5 : 0;
    const viewOnlyCount = canBeginWork ? 10 - unlockedDownloadCount : 0;
    return {
      minStartDepositPercent,
      canBeginWork,
      unlockedDownloadCount,
      viewOnlyCount,
      ruleExplanation:
        '10-Video Package Policy: Requires 50% initial deposit to begin work. At 50% paid, you unlock full download access to 5 of your 10 videos while the remaining 5 completed videos are View-Only on the platform until full payment is confirmed.',
      nextMilestoneNote:
        paid < 50
          ? `Complete your 50% deposit (currently ${paid}%) to start work and unlock 5 downloadable videos.`
          : paid < 100
            ? `${unlockedDownloadCount} of 10 videos unlocked for download · 5 videos in View-Only mode until 100% payment (${100 - paid}% remaining).`
            : '100% Full Payment Confirmed — All 10 master videos are unlocked for download.',
    };
  }

  // Monthly Retainer / AI Promotional Mini-Series (15 videos)
  const minStartDepositPercent = 40;
  const canBeginWork = paid >= 40;
  const unlockedDownloadCount = paid >= 100 ? total : paid >= 40 ? Math.max(1, Math.floor((total * paid) / 100)) : 0;
  const viewOnlyCount = canBeginWork ? Math.max(0, total - unlockedDownloadCount) : 0;
  return {
    minStartDepositPercent,
    canBeginWork,
    unlockedDownloadCount,
    viewOnlyCount,
    ruleExplanation:
      `Monthly Retainer Policy (${total} Videos): Requires 40% initial deposit to begin work, unlocking 40% (${Math.floor(total * 0.4)} of ${total}) of your videos for download. As subsequent payment milestones are confirmed up to 100%, remaining videos transition from View-Only to full download access.`,
    nextMilestoneNote:
      paid < 40
        ? `Complete your 40% initial retainer deposit (currently ${paid}%) to start production and unlock ${Math.floor(total * 0.4)} videos.`
        : paid < 100
          ? `${unlockedDownloadCount} of ${total} videos (${paid}%) unlocked for download · ${viewOnlyCount} videos in View-Only mode until remaining payment is completed.`
          : `100% Full Payment Confirmed — All ${total} monthly videos are unlocked for download.`,
  };
}

/**
 * Checks whether a specific video deliverable (1-based index) can be downloaded or only streamed in View-Only mode.
 */
export function getVideoDeliverableAccess(
  project: CustomerProject,
  video: ProjectVideoDeliverable,
): {
  canStream: boolean;
  canDownload: boolean;
  accessLabel: string;
} {
  if (video.manualDownloadUnlocked) {
    return {
      canStream: true,
      canDownload: true,
      accessLabel: 'Unlocked by Admin',
    };
  }
  const gate = computeDeliverableGate(project);
  if (!gate.canBeginWork && project.paidPercent < gate.minStartDepositPercent) {
    return {
      canStream: false,
      canDownload: false,
      accessLabel: `Locked (Requires ${gate.minStartDepositPercent}% Deposit)`,
    };
  }
  if (video.index <= gate.unlockedDownloadCount) {
    return {
      canStream: true,
      canDownload: true,
      accessLabel: 'Download Unlocked',
    };
  }
  return {
    canStream: true,
    canDownload: false,
    accessLabel: 'View-Only on Platform (Complete Payment to Download)',
  };
}

/**
 * Converts a Google Drive share link or YouTube URL into a fast-booting embedded preview URL
 * and a direct master download URL.
 */
export function parseGoogleDriveVideoUrl(rawUrl: string): {
  isGoogleDrive: boolean;
  isYouTube: boolean;
  fileId: string;
  embedUrl: string;
  downloadUrl: string;
} {
  const url = (rawUrl || '').trim();
  // Match Google Drive /file/d/{id} or ?id={id}
  const driveMatch =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      isGoogleDrive: true,
      isYouTube: false,
      fileId,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    };
  }

  // Match YouTube ID or watch URL
  const ytMatch =
    url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/) ||
    (/^[a-zA-Z0-9_-]{11}$/.test(url) ? [url, url] : null);

  if (ytMatch && ytMatch[1]) {
    const ytId = ytMatch[1];
    return {
      isGoogleDrive: false,
      isYouTube: true,
      fileId: ytId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`,
      downloadUrl: `https://www.youtube.com/watch?v=${ytId}`,
    };
  }

  return {
    isGoogleDrive: false,
    isYouTube: false,
    fileId: '',
    embedUrl: url,
    downloadUrl: url,
  };
}

const SEEDED_PROJECTS: CustomerProject[] = [
  {
    id: 'proj_cfm_retainer',
    ref: 'AV-CFM-01',
    customerId: 'cust_circlesfundme',
    customerName: 'CirclesFundMe Team',
    customerEmail: 'demo@circlesfundme.com',
    customerPhone: '+2348000000001',
    businessName: 'CirclesFundMe Fintech',
    packageType: 'retainer_15',
    packageName: 'Monthly Content Retainer (15 Videos)',
    totalVideos: 15,
    totalPrice: 250000,
    currency: 'NGN',
    paidPercent: 40,
    amountPaid: 100000,
    paymentNotes: '40% Initial Retainer Deposit Confirmed — 6 of 15 videos unlocked for download.',
    status: 'Ready for Review',
    unreadScriptAlert: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    scripts: [
      {
        id: 'scr_1',
        episodeNumber: 1,
        title: 'Episode 01 — Cooperative Savings Without Stress',
        hook: '0–3s Hook: "Why do traditional contribution groups always end in drama when it is your turn to collect?"',
        scriptBody:
          'Scene 1: Protagonist checks phone anxiously while waiting for group payout.\nScene 2: CirclesFundMe automated contribution shield appears with verified background checks.\nScene 3: Instant payout notification lands with zero friction.',
        visualNotes: '9:16 vertical reel · Green branded cap & polo · Warm Lagos street lighting.',
        status: 'approved',
        clientAssetLinks: ['https://drive.google.com/drive/folders/1CirclesFundMeBrandKit'],
        clientRecommendations: 'Keep the green cap logo clearly visible in Scene 2.',
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'scr_2',
        episodeNumber: 2,
        title: 'Episode 02 — CNG Conversion Financing Reel',
        hook: '0–3s Hook: "Fuel costs doubled, but converting your vehicle to CNG does not have to drain your savings."',
        scriptBody:
          'Scene 1: Auto workshop technician showing the CNG conversion kit installation.\nScene 2: Step-by-step breakdown of how CirclesFundMe spreads the cost effortlessly.\nScene 3: Call to action to apply in 3 minutes.',
        visualNotes: '9:16 vertical reel · Workshop cutaway graphics.',
        status: 'pending_review',
        clientAssetLinks: [],
        clientRecommendations: '',
        updatedAt: new Date().toISOString(),
      },
    ],
    videos: [
      {
        id: 'vid_1',
        index: 1,
        title: 'CirclesFundMe Campaign Reel 01 — Service Ad',
        category: 'Service Ads',
        duration: '0:45',
        driveUrl: 'YSTvgHJ9vRU',
        status: 'ready',
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'vid_2',
        index: 2,
        title: 'CirclesFundMe Campaign Reel 02 — Story Ad',
        category: 'Story Ads',
        duration: '0:52',
        driveUrl: 'NuUviJm2DLo',
        status: 'ready',
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'vid_3',
        index: 3,
        title: 'CirclesFundMe Campaign Reel 03 — Launch Ad',
        category: 'Launch Ads',
        duration: '0:48',
        driveUrl: 'XUn7L2s-Bqk',
        status: 'ready',
        uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: 'vid_4',
        index: 4,
        title: 'CirclesFundMe Campaign Reel 04 — Brand Film',
        category: 'Brand Films',
        duration: '1:05',
        driveUrl: 'QsqKNOo1uDQ',
        status: 'ready',
        uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: 'vid_5',
        index: 5,
        title: 'CirclesFundMe Campaign Reel 05 — Direct Offer',
        category: 'Service Ads',
        duration: '0:50',
        driveUrl: 'JecWfFOuUp0',
        status: 'ready',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'vid_6',
        index: 6,
        title: 'CirclesFundMe Campaign Reel 06 — Community Story',
        category: 'Story Ads',
        duration: '0:55',
        driveUrl: 'lE5JSLxRCU4',
        status: 'ready',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'vid_7',
        index: 7,
        title: 'CirclesFundMe Campaign Reel 07 — Promo Cut (View-Only at 40% Paid)',
        category: 'Promo Videos',
        duration: '0:46',
        driveUrl: 'sbirMUA3WNU',
        status: 'ready',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'vid_8',
        index: 8,
        title: 'CirclesFundMe Campaign Reel 08 — Product Spotlight (View-Only at 40% Paid)',
        category: 'Product Ads',
        duration: '0:58',
        driveUrl: '1nUi3LNvFHs',
        status: 'ready',
        uploadedAt: new Date().toISOString(),
      },
    ],
  },
];

const SEEDED_ACCOUNTS: CustomerAccount[] = [
  {
    id: 'cust_circlesfundme',
    name: 'CirclesFundMe Team',
    email: 'demo@circlesfundme.com',
    phone: '+2348000000001',
    business: 'CirclesFundMe Fintech',
    country: 'NG',
    password: 'cfm-client-2026',
    passwordSet: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export function loadCustomerAccounts(): CustomerAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(SEEDED_ACCOUNTS));
      return SEEDED_ACCOUNTS;
    }
    const parsed = JSON.parse(raw) as CustomerAccount[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEEDED_ACCOUNTS;
  } catch {
    return SEEDED_ACCOUNTS;
  }
}

export function saveCustomerAccounts(accounts: CustomerAccount[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    window.dispatchEvent(new CustomEvent('advibe-portal-updated'));
  } catch {
    // ignore
  }
}

export function loadCustomerProjects(): CustomerProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(SEEDED_PROJECTS));
      return SEEDED_PROJECTS;
    }
    const parsed = JSON.parse(raw) as CustomerProject[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEEDED_PROJECTS;
  } catch {
    return SEEDED_PROJECTS;
  }
}

export function saveCustomerProjects(projects: CustomerProject[]) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    window.dispatchEvent(new CustomEvent('advibe-portal-updated'));
  } catch {
    // ignore
  }
}

export async function syncCustomerProjectToFirestore(project: CustomerProject) {
  const list = loadCustomerProjects();
  const idx = list.findIndex((p) => p.id === project.id);
  if (idx >= 0) list[idx] = project;
  else list.unshift(project);
  saveCustomerProjects(list);

  if (canUseFirestoreQuota('writes', 1)) {
    recordFirestoreQuotaOp('writes', 1);
    try {
      await setDoc(doc(db, 'customer_projects', project.id), project, { merge: true });
    } catch {
      // ignore if offline
    }
  }
}

export async function syncCustomerAccountToFirestore(account: CustomerAccount) {
  const list = loadCustomerAccounts();
  const idx = list.findIndex((a) => a.id === account.id);
  if (idx >= 0) list[idx] = account;
  else list.unshift(account);
  saveCustomerAccounts(list);

  if (canUseFirestoreQuota('writes', 1)) {
    recordFirestoreQuotaOp('writes', 1);
    try {
      await setDoc(doc(db, 'customer_accounts', account.id), account, { merge: true });
    } catch {
      // ignore
    }
  }
}

export async function fetchAllPortalDataFromFirestore(): Promise<{
  accounts: CustomerAccount[];
  projects: CustomerProject[];
}> {
  const localAccounts = loadCustomerAccounts();
  const localProjects = loadCustomerProjects();
  if (!canUseFirestoreQuota('reads', 2)) {
    return { accounts: localAccounts, projects: localProjects };
  }
  try {
    recordFirestoreQuotaOp('reads', 2);
    const [accSnap, projSnap] = await Promise.all([
      getDocs(collection(db, 'customer_accounts')),
      getDocs(collection(db, 'customer_projects')),
    ]);

    const accMap = new Map<string, CustomerAccount>();
    localAccounts.forEach((a) => accMap.set(a.id, a));
    accSnap.docs.forEach((d) => {
      const data = d.data() as CustomerAccount;
      if (data?.id) accMap.set(data.id, { ...accMap.get(data.id), ...data });
    });

    const projMap = new Map<string, CustomerProject>();
    localProjects.forEach((p) => projMap.set(p.id, p));
    projSnap.docs.forEach((d) => {
      const data = d.data() as CustomerProject;
      if (data?.id) projMap.set(data.id, { ...projMap.get(data.id), ...data });
    });

    const accounts = Array.from(accMap.values());
    const projects = Array.from(projMap.values()).sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || ''),
    );
    saveCustomerAccounts(accounts);
    saveCustomerProjects(projects);
    return { accounts, projects };
  } catch {
    return { accounts: localAccounts, projects: localProjects };
  }
}

/**
 * Automatically provisions a CustomerAccount and an initial CustomerProject
 * whenever a visitor completes the Strategy Session or Order registration form.
 */
export function provisionCustomerFromBooking(params: {
  name: string;
  email?: string;
  phone: string;
  business?: string;
  country?: string;
  offerId: string;
  offerName: string;
  price: number;
  currency: string;
  configuredQty?: number;
  ref?: string;
}): { account: CustomerAccount; project: CustomerProject } {
  const cleanEmail = (params.email || '').trim().toLowerCase();
  const cleanPhone = (params.phone || '').trim();
  const accounts = loadCustomerAccounts();

  let account = accounts.find(
    (a) =>
      (cleanEmail && a.email.toLowerCase() === cleanEmail) ||
      (cleanPhone && a.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '') && cleanPhone.length >= 6),
  );

  const now = new Date().toISOString();
  if (!account) {
    const id = `cust_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    account = {
      id,
      name: params.name.trim() || 'Valued Client',
      email: cleanEmail,
      phone: cleanPhone,
      business: params.business?.trim() || '',
      country: params.country || 'NG',
      passwordSet: false,
      otpCode: String(Math.floor(100000 + Math.random() * 900000)),
      createdAt: now,
      lastLoginAt: now,
    };
  } else {
    account = {
      ...account,
      name: params.name.trim() || account.name,
      email: cleanEmail || account.email,
      phone: cleanPhone || account.phone,
      business: params.business?.trim() || account.business,
      lastLoginAt: now,
    };
  }

  void syncCustomerAccountToFirestore(account);

  const { packageType, totalVideos } = inferPackageTypeAndCount(
    params.offerId,
    params.offerName,
    params.configuredQty,
  );

  const projId = `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
  const projectRef = params.ref || `AV-${Date.now().toString(36).slice(-4).toUpperCase()}`;

  const newProject: CustomerProject = {
    id: projId,
    ref: projectRef,
    customerId: account.id,
    customerName: account.name,
    customerEmail: account.email,
    customerPhone: account.phone,
    businessName: account.business,
    packageType,
    packageName: params.offerName || 'AI Video Production Package',
    totalVideos,
    totalPrice: params.price || 0,
    currency: params.currency || 'NGN',
    paidPercent: 0,
    amountPaid: 0,
    paymentNotes: 'Awaiting initial deposit confirmation from Admin to begin script production.',
    status: 'Awaiting Deposit',
    unreadScriptAlert: false,
    createdAt: now,
    updatedAt: now,
    scripts: [
      {
        id: `scr_${Date.now().toString(36)}_1`,
        episodeNumber: 1,
        title: 'Video 01 — Initial Direct-Response Concept & Hook',
        hook: '0–3s Hook: Drafted immediately upon deposit confirmation.',
        scriptBody:
          'Your dedicated creative director will publish your full scene-by-scene script here for your approval before we generate and edit your video.',
        visualNotes: '9:16 Vertical & 16:9 Widescreen · Studio Audio Mastering',
        status: 'pending_review',
        clientAssetLinks: [],
        clientRecommendations: '',
        updatedAt: now,
      },
    ],
    videos: [],
  };

  void syncCustomerProjectToFirestore(newProject);
  setActiveCustomerSession(account);

  // Also back up to Google Sheets
  void backupSubmissionToGoogleSheet('lead', {
    id: newProject.id,
    ref: newProject.ref,
    name: account.name,
    email: account.email,
    phone: account.phone,
    packageName: newProject.packageName,
    packageType: newProject.packageType,
    totalVideos: newProject.totalVideos,
    totalPrice: newProject.totalPrice,
    currency: newProject.currency,
  });

  return { account, project: newProject };
}

export function getActiveCustomerSession(): CustomerAccount | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CUSTOMER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerAccount;
    const latest = loadCustomerAccounts().find((a) => a.id === parsed.id);
    return latest || parsed;
  } catch {
    return null;
  }
}

export function setActiveCustomerSession(account: CustomerAccount | null) {
  try {
    if (!account) {
      localStorage.removeItem(ACTIVE_CUSTOMER_KEY);
    } else {
      localStorage.setItem(ACTIVE_CUSTOMER_KEY, JSON.stringify(account));
    }
    window.dispatchEvent(new CustomEvent('advibe-portal-updated'));
  } catch {
    // ignore
  }
}
