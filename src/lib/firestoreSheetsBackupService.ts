import type { BusinessAssessment, Lead, TrainingStudent } from '@/content/types';
import { doc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured, trackFirestoreWrite, firebaseProjectInfo } from '@/firebase';
import {
  getSavedSheetsWebhookUrl,
  loadAssessments,
  saveAssessments,
  syncAssessmentToGoogleSheets,
  syncLeadToGoogleSheets,
  syncStudentToGoogleSheets,
} from '@/lib/googleSheetsSync';

/* ==========================================================================
   FIRESTORE -> GOOGLE SHEETS AUTOMATIC BACKUP & REDUNDANCY SYNC SERVICE
   ==========================================================================
   Guarantees every newly submitted or updated document in Firestore
   (/leads, /assessments, /students) is backed up to Google Sheets:
   1. Immediate Dual-Trigger on submission
   2. Persistent Outbox Queue (survives page reloads & offline periods)
   3. Background Delta Scanner (detects any Firestore records with
      sheetsSynced !== true and backs them up + stamps sheetsSyncedAt)
   4. Live Backup Activity Log for Admin auditability
   ========================================================================== */

export type BackupCollectionType = 'leads' | 'assessments' | 'students';

export interface SyncOutboxItem {
  id: string;
  collection: BackupCollectionType;
  recordId: string;
  recordRef: string;
  label: string;
  payload: Lead | BusinessAssessment | TrainingStudent;
  queuedAt: string;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
}

export interface BackupSyncLogEntry {
  id: string;
  timestamp: string;
  collection: BackupCollectionType;
  recordId: string;
  recordRef: string;
  label: string;
  targetTabs: string[];
  status: 'synced' | 'queued' | 'failed';
  durationMs?: number;
  message: string;
}

export interface AutoBackupDaemonState {
  enabled: boolean;
  isRunning: boolean;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  totalBackedUp: number;
  pendingOutboxCount: number;
}

const LS_OUTBOX_KEY = 'advibe.sheets_sync_outbox.v1';
const LS_SYNC_LOG_KEY = 'advibe.sheets_sync_log.v1';
const LS_DAEMON_STATE_KEY = 'advibe.sheets_daemon_state.v1';

function stripUndefined<T>(val: T): T {
  if (Array.isArray(val)) {
    return val.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (val !== null && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return val;
}

/* ---------- OUTBOX STORAGE ---------- */

export function loadSyncOutbox(): SyncOutboxItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncOutboxItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSyncOutbox(items: SyncOutboxItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_OUTBOX_KEY, JSON.stringify(items.slice(0, 500)));
    window.dispatchEvent(new CustomEvent('advibe-backup-sync-updated'));
  } catch {
    /* ignore */
  }
}

/* ---------- BACKUP ACTIVITY LOG ---------- */

export function loadBackupSyncLogs(): BackupSyncLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_SYNC_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BackupSyncLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendBackupSyncLog(
  entry: Omit<BackupSyncLogEntry, 'id' | 'timestamp'>
): BackupSyncLogEntry {
  const full: BackupSyncLogEntry = {
    ...entry,
    id: `bsync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    try {
      const existing = loadBackupSyncLogs();
      const next = [full, ...existing].slice(0, 150);
      localStorage.setItem(LS_SYNC_LOG_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('advibe-backup-sync-updated'));
    } catch {
      /* ignore */
    }
  }
  return full;
}

export function clearBackupSyncLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_SYNC_LOG_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('advibe-backup-sync-updated'));
  } catch {
    /* ignore */
  }
}

/* ---------- DAEMON STATE ---------- */

export function getAutoBackupDaemonState(): AutoBackupDaemonState {
  const outbox = loadSyncOutbox();
  if (typeof window === 'undefined') {
    return {
      enabled: true,
      isRunning: false,
      lastRunAt: null,
      lastSuccessAt: null,
      totalBackedUp: 0,
      pendingOutboxCount: outbox.length,
    };
  }
  try {
    const raw = localStorage.getItem(LS_DAEMON_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AutoBackupDaemonState>;
      return {
        enabled: parsed.enabled ?? true,
        isRunning: false,
        lastRunAt: parsed.lastRunAt ?? null,
        lastSuccessAt: parsed.lastSuccessAt ?? null,
        totalBackedUp: parsed.totalBackedUp ?? 0,
        pendingOutboxCount: outbox.length,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    enabled: true,
    isRunning: false,
    lastRunAt: null,
    lastSuccessAt: null,
    totalBackedUp: 0,
    pendingOutboxCount: outbox.length,
  };
}

export function updateAutoBackupDaemonState(patch: Partial<AutoBackupDaemonState>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAutoBackupDaemonState();
    const next = { ...current, ...patch, pendingOutboxCount: loadSyncOutbox().length };
    localStorage.setItem(LS_DAEMON_STATE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('advibe-backup-sync-updated'));
  } catch {
    /* ignore */
  }
}

/* ---------- ENQUEUE & IMMEDIATE BACKUP TRIGGER ---------- */

export async function triggerImmediateSheetsBackup(params: {
  collection: BackupCollectionType;
  record: Lead | BusinessAssessment | TrainingStudent;
  webhookUrl?: string;
}): Promise<{ synced: boolean; syncedAt?: string; message: string }> {
  const startMs = Date.now();
  const { collection, record, webhookUrl } = params;

  let recordId = '';
  let recordRef = '';
  let label = '';
  let targetTabs: string[] = [];

  if (collection === 'leads') {
    const l = record as Lead;
    recordId = l.id;
    recordRef = l.ref;
    label = `${l.name} (${l.offerName})`;
    targetTabs = ['Client_Leads_Orders'];
  } else if (collection === 'students') {
    const s = record as TrainingStudent;
    recordId = s.id;
    recordRef = s.ref;
    label = `${s.name} (${s.track} track)`;
    targetTabs = ['Training_Students'];
  } else {
    const a = record as BusinessAssessment;
    recordId = a.assessmentId;
    recordRef = a.assessmentId;
    label = `${a.fullName} — ${a.businessName}`;
    targetTabs = [
      'All_Assessments',
      'WhatsApp_Leads',
      'Service_Recommendations',
      'Follow_Up_Sales_Pipeline',
    ];
  }

  // 1. Place in Outbox first so even if browser tab closes mid-flight, it is persisted
  const existingOutbox = loadSyncOutbox().filter(
    (x) => !(x.collection === collection && x.recordId === recordId)
  );
  const outboxItem: SyncOutboxItem = {
    id: `${collection}:${recordId}`,
    collection,
    recordId,
    recordRef,
    label,
    payload: record,
    queuedAt: new Date().toISOString(),
    attempts: 1,
    lastAttemptAt: new Date().toISOString(),
  };
  saveSyncOutbox([outboxItem, ...existingOutbox]);

  const configuredUrl = getSavedSheetsWebhookUrl(webhookUrl);
  if (!configuredUrl) {
    appendBackupSyncLog({
      collection,
      recordId,
      recordRef,
      label,
      targetTabs,
      status: 'queued',
      durationMs: Date.now() - startMs,
      message: 'Queued in Redundancy Outbox (waiting for Google Sheets Web App URL configuration).',
    });
    return {
      synced: false,
      message: 'Queued in Redundancy Outbox. Will auto-backup as soon as Google Sheets URL is connected.',
    };
  }

  // 2. Push to Google Sheets
  let ok = false;
  let errorMsg = '';

  if (collection === 'leads') {
    const res = await syncLeadToGoogleSheets(record as Lead, configuredUrl);
    ok = res.status === 'synced';
  } else if (collection === 'students') {
    const res = await syncStudentToGoogleSheets(record as TrainingStudent, configuredUrl);
    ok = res.status === 'synced';
  } else {
    const res = await syncAssessmentToGoogleSheets(record as BusinessAssessment, configuredUrl);
    ok = res.status === 'synced';
    errorMsg = res.error || '';
  }

  const durationMs = Date.now() - startMs;

  if (ok) {
    const syncedAt = new Date().toISOString();
    // Remove from Outbox
    saveSyncOutbox(
      loadSyncOutbox().filter((x) => !(x.collection === collection && x.recordId === recordId))
    );

    // Stamp Firestore document as backed up
    if (isFirebaseConfigured) {
      try {
        if (collection === 'leads') {
          await setDoc(
            doc(db, 'leads', recordId),
            stripUndefined({ sheetsSynced: true, sheetsSyncedAt: syncedAt }),
            { merge: true }
          );
          trackFirestoreWrite(1);
        } else if (collection === 'students') {
          await setDoc(
            doc(db, 'students', recordId),
            stripUndefined({ sheetsSynced: true, sheetsSyncedAt: syncedAt }),
            { merge: true }
          );
          trackFirestoreWrite(1);
        } else {
          await setDoc(
            doc(db, 'assessments', recordId),
            stripUndefined({ syncStatus: 'synced', lastSyncAttemptAt: syncedAt }),
            { merge: true }
          );
          trackFirestoreWrite(1);
        }
      } catch {
        /* ignore Firestore stamp error if offline */
      }
    }

    const prevState = getAutoBackupDaemonState();
    updateAutoBackupDaemonState({
      lastRunAt: syncedAt,
      lastSuccessAt: syncedAt,
      totalBackedUp: (prevState.totalBackedUp || 0) + 1,
    });

    appendBackupSyncLog({
      collection,
      recordId,
      recordRef,
      label,
      targetTabs,
      status: 'synced',
      durationMs,
      message: `Automatically backed up from Firestore to Google Sheets (${targetTabs.join(', ')})`,
    });

    return {
      synced: true,
      syncedAt,
      message: `Backed up ${recordRef} to Google Sheets in ${durationMs}ms.`,
    };
  }

  // Keep in Outbox for automatic retry
  const updatedOutbox = loadSyncOutbox().map((x) =>
    x.collection === collection && x.recordId === recordId
      ? { ...x, lastError: errorMsg || 'Network retry scheduled' }
      : x
  );
  saveSyncOutbox(updatedOutbox);

  appendBackupSyncLog({
    collection,
    recordId,
    recordRef,
    label,
    targetTabs,
    status: 'failed',
    durationMs,
    message: errorMsg || 'Network error while reaching Google Sheets; queued for automatic retry.',
  });

  return {
    synced: false,
    message: errorMsg || 'Queued for automatic retry.',
  };
}

/* ---------- BACKGROUND DELTA SCANNER & OUTBOX PROCESSOR ---------- */

export async function runFirestoreToSheetsAutoBackupCycle(params: {
  leads: Lead[];
  students: TrainingStudent[];
  assessments?: BusinessAssessment[];
  webhookUrl?: string;
  onLeadSynced?: (leadId: string, syncedAt: string) => void;
  onStudentSynced?: (studentId: string, syncedAt: string) => void;
}): Promise<{
  processed: number;
  syncedCount: number;
  remainingOutbox: number;
  message: string;
}> {
  const targetUrl = getSavedSheetsWebhookUrl(params.webhookUrl);
  const nowIso = new Date().toISOString();
  updateAutoBackupDaemonState({ lastRunAt: nowIso });

  // 1. Identify any unsynced records in Firestore / Store state that aren't in the outbox yet
  const currentOutbox = loadSyncOutbox();
  const outboxKeys = new Set(currentOutbox.map((x) => `${x.collection}:${x.recordId}`));
  const newOutboxItems: SyncOutboxItem[] = [];

  for (const lead of params.leads) {
    if (!lead.sheetsSynced && !outboxKeys.has(`leads:${lead.id}`)) {
      newOutboxItems.push({
        id: `leads:${lead.id}`,
        collection: 'leads',
        recordId: lead.id,
        recordRef: lead.ref,
        label: `${lead.name} (${lead.offerName})`,
        payload: lead,
        queuedAt: nowIso,
        attempts: 0,
      });
    }
  }

  for (const student of params.students) {
    if (!student.sheetsSynced && !outboxKeys.has(`students:${student.id}`)) {
      newOutboxItems.push({
        id: `students:${student.id}`,
        collection: 'students',
        recordId: student.id,
        recordRef: student.ref,
        label: `${student.name} (${student.track} track)`,
        payload: student,
        queuedAt: nowIso,
        attempts: 0,
      });
    }
  }

  const assessmentsList = params.assessments || loadAssessments();
  for (const assessment of assessmentsList) {
    if (assessment.syncStatus !== 'synced' && !outboxKeys.has(`assessments:${assessment.assessmentId}`)) {
      newOutboxItems.push({
        id: `assessments:${assessment.assessmentId}`,
        collection: 'assessments',
        recordId: assessment.assessmentId,
        recordRef: assessment.assessmentId,
        label: `${assessment.fullName} — ${assessment.businessName}`,
        payload: assessment,
        queuedAt: nowIso,
        attempts: 0,
      });
    }
  }

  const combinedOutbox = [...newOutboxItems, ...currentOutbox];
  if (newOutboxItems.length > 0) {
    saveSyncOutbox(combinedOutbox);
  }

  if (!targetUrl) {
    return {
      processed: 0,
      syncedCount: 0,
      remainingOutbox: combinedOutbox.length,
      message: `${combinedOutbox.length} record(s) queued in Redundancy Outbox. Connect your Google Sheets Web App URL to flush automatically.`,
    };
  }

  if (combinedOutbox.length === 0) {
    return {
      processed: 0,
      syncedCount: 0,
      remainingOutbox: 0,
      message: 'All Firestore records are 100% backed up and in sync with Google Sheets.',
    };
  }

  let syncedCount = 0;
  const updatedAssessmentsMap = new Map<string, BusinessAssessment>();

  for (const item of combinedOutbox) {
    const res = await triggerImmediateSheetsBackup({
      collection: item.collection,
      record: item.payload,
      webhookUrl: targetUrl,
    });
    if (res.synced && res.syncedAt) {
      syncedCount++;
      if (item.collection === 'leads' && params.onLeadSynced) {
        params.onLeadSynced(item.recordId, res.syncedAt);
      } else if (item.collection === 'students' && params.onStudentSynced) {
        params.onStudentSynced(item.recordId, res.syncedAt);
      } else if (item.collection === 'assessments') {
        const a = item.payload as BusinessAssessment;
        updatedAssessmentsMap.set(a.assessmentId, {
          ...a,
          syncStatus: 'synced',
          lastSyncAttemptAt: res.syncedAt,
        });
      }
    }
  }

  if (updatedAssessmentsMap.size > 0) {
    const latestAssessments = loadAssessments().map(
      (a) => updatedAssessmentsMap.get(a.assessmentId) || a
    );
    saveAssessments(latestAssessments);
  }

  const remaining = loadSyncOutbox().length;
  return {
    processed: combinedOutbox.length,
    syncedCount,
    remainingOutbox: remaining,
    message: `Auto-backup cycle complete: ${syncedCount}/${combinedOutbox.length} Firestore record(s) backed up to Google Sheets.`,
  };
}

/* ---------- SERVERLESS FIREBASE CLOUD FUNCTION V2 CODE (FOR CLI DEPLOYMENT) ---------- */

export const FIREBASE_CLOUD_FUNCTION_CODE = `/**
 * ADVIBE STUDIO — FIREBASE CLOUD FUNCTIONS V2 (FIRESTORE -> GOOGLE SHEETS AUTO-BACKUP)
 * File: functions/src/index.ts
 *
 * Automatically triggers whenever any document is created or updated in:
 *   - /leads/{leadId}
 *   - /assessments/{assessmentId}
 *   - /students/{studentId}
 * in Firestore database: "${firebaseProjectInfo.firestoreDatabaseId}"
 * and backs up the record to your connected Google Sheet for 100% redundancy.
 */
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { defineString } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';

const GOOGLE_SHEETS_WEBHOOK_URL = defineString('GOOGLE_SHEETS_WEBHOOK_URL');
const DATABASE_ID = '${firebaseProjectInfo.firestoreDatabaseId}';

async function pushToGoogleSheets(payload: Record<string, unknown>) {
  const url = GOOGLE_SHEETS_WEBHOOK_URL.value();
  if (!url) {
    logger.warn('GOOGLE_SHEETS_WEBHOOK_URL is not set; skipping Sheets push.');
    return false;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      payload_json: JSON.stringify(payload),
    }).toString(),
  });
  return response.ok;
}

// 1. Auto-Backup Client Leads, Bookings & Referral Claims
export const backupLeadToGoogleSheets = onDocumentWritten(
  {
    document: 'leads/{leadId}',
    database: DATABASE_ID,
    region: 'europe-west3',
  },
  async (event) => {
    const after = event.data?.after.data();
    if (!after || after.sheetsSynced === true) return;

    const ok = await pushToGoogleSheets({
      spreadsheetName: 'ADVIBE STUDIO — LEADS & BUSINESS ASSESSMENTS',
      deduplicationKey: after.ref || after.id,
      tabs: {
        Client_Leads_Orders: {
          Lead_Ref: after.ref || '',
          Lead_ID: after.id || '',
          Submitted_At: after.date || '',
          Customer_Name: after.name || '',
          Business_Name: after.business || '',
          WhatsApp_Number: after.whatsapp || '',
          Email_Address: after.email || '',
          Package_ID: after.offerId || '',
          Package_Name: after.offerName || '',
          Price: String(after.price ?? 0),
          Currency: after.currency || 'NGN',
          Country: after.country || 'NG',
          Lead_Status: after.status || 'New',
          Payment_Status: after.paymentStatus || 'Unpaid',
          Referral_Code: after.referralCode || after.manualReferralCode || '',
          Discount_5_Percent_Claimed: after.discountClaimed ? 'Yes' : 'No',
          Customer_Notes: after.notes || '',
        },
      },
    });

    if (ok && event.data?.after.ref) {
      await event.data.after.ref.set(
        { sheetsSynced: true, sheetsSyncedAt: new Date().toISOString() },
        { merge: true }
      );
    }
  }
);

// 2. Auto-Backup Training Cohort Student Signups
export const backupStudentToGoogleSheets = onDocumentWritten(
  {
    document: 'students/{studentId}',
    database: DATABASE_ID,
    region: 'europe-west3',
  },
  async (event) => {
    const after = event.data?.after.data();
    if (!after || after.sheetsSynced === true) return;

    const ok = await pushToGoogleSheets({
      spreadsheetName: 'ADVIBE STUDIO — LEADS & BUSINESS ASSESSMENTS',
      deduplicationKey: after.ref || after.id,
      tabs: {
        Training_Students: {
          Student_Ref: after.ref || '',
          Student_ID: after.id || '',
          Cohort_ID: after.cohortId || '',
          Registered_At: after.date || '',
          Full_Name: after.name || '',
          Email_Address: after.email || '',
          WhatsApp_Number: after.whatsapp || '',
          Country: after.country || 'NG',
          Learning_Track: after.track || '',
          Enrollment_Status: after.status || 'registered',
          Tuition_Price: String(after.price ?? 0),
          Currency: after.currency || 'NGN',
        },
      },
    });

    if (ok && event.data?.after.ref) {
      await event.data.after.ref.set(
        { sheetsSynced: true, sheetsSyncedAt: new Date().toISOString() },
        { merge: true }
      );
    }
  }
);

// 3. Auto-Backup 12-Question Business Assessments (4 Tabs)
export const backupAssessmentToGoogleSheets = onDocumentWritten(
  {
    document: 'assessments/{assessmentId}',
    database: DATABASE_ID,
    region: 'europe-west3',
  },
  async (event) => {
    const after = event.data?.after.data();
    if (!after || after.syncStatus === 'synced') return;

    const ok = await pushToGoogleSheets({
      spreadsheetName: 'ADVIBE STUDIO — LEADS & BUSINESS ASSESSMENTS',
      deduplicationKey: after.assessmentId,
      tabs: {
        All_Assessments: {
          '1_Assessment_ID': after.assessmentId || '',
          '2_Timestamp_Submitted': after.timestampSubmitted || '',
          '4_Full_Name': after.fullName || '',
          '5_Business_Name': after.businessName || '',
          '6_WhatsApp_Number': after.whatsappNumber || '',
          '7_Email_Address': after.email || '',
          '21_Primary_Recommended_Service': after.primaryRecommendedService || '',
          '22_Primary_Recommended_Package': after.primaryRecommendedPackageName || '',
          '38_Lead_Status': after.leadStatus || 'New lead',
        },
      },
    });

    if (ok && event.data?.after.ref) {
      await event.data.after.ref.set(
        { syncStatus: 'synced', lastSyncAttemptAt: new Date().toISOString() },
        { merge: true }
      );
    }
  }
);
`;
