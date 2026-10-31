import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const isFirebaseConfigured = Boolean(
  firebaseConfig?.projectId && firebaseConfig?.apiKey && firebaseConfig?.firestoreDatabaseId
);

export const firebaseProjectInfo = {
  projectId: firebaseConfig.projectId,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
  authDomain: firebaseConfig.authDomain,
  consoleUrl: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`,
  iamUrl: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/settings/iam`,
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/* ---------- FIRESTORE FREE-TIER QUOTA TRACKER ---------- */
const QUOTA_STORAGE_KEY = 'advibe_firestore_quota_v1';
export const SPARK_DAILY_READ_LIMIT = 50000;
export const SPARK_DAILY_WRITE_LIMIT = 20000;

export interface FirestoreQuotaStats {
  dateKey: string; // YYYY-MM-DD
  readsToday: number;
  writesToday: number;
  cacheHitsToday: number;
  lastOperationAt?: string;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getFirestoreQuotaStats(): FirestoreQuotaStats {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FirestoreQuotaStats;
      if (parsed.dateKey === today) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return {
    dateKey: today,
    readsToday: 0,
    writesToday: 0,
    cacheHitsToday: 0,
  };
}

function saveQuotaStats(stats: FirestoreQuotaStats) {
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function trackFirestoreRead(count = 1) {
  const stats = getFirestoreQuotaStats();
  stats.readsToday += count;
  stats.lastOperationAt = new Date().toISOString();
  saveQuotaStats(stats);
}

export function trackFirestoreWrite(count = 1) {
  const stats = getFirestoreQuotaStats();
  stats.writesToday += count;
  stats.lastOperationAt = new Date().toISOString();
  saveQuotaStats(stats);
}

export function trackLocalCacheHit(count = 1) {
  const stats = getFirestoreQuotaStats();
  stats.cacheHitsToday += count;
  saveQuotaStats(stats);
}

/* ---------- VALIDATE CONNECTION ON BOOT ---------- */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    trackFirestoreRead(1);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  testConnection();
}
