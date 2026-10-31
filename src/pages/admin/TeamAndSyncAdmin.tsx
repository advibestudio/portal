import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Trash2,
  FileSpreadsheet,
  Database,
  RefreshCw,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Sparkles,
  Lock,
  ArrowRightLeft,
  Activity,
  CloudCog,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  firebaseProjectInfo,
  getFirestoreQuotaStats,
  SPARK_DAILY_READ_LIMIT,
  SPARK_DAILY_WRITE_LIMIT,
} from '@/firebase';
import {
  getSavedSheetsWebhookUrl,
  setSavedSheetsWebhookUrl,
  syncAllRecordsToGoogleSheets,
  testGoogleSheetsConnection,
  exportLeadsCsv,
  exportStudentsCsv,
  exportAssessmentsTabCsv,
  loadAssessments,
  GOOGLE_APPS_SCRIPT_CODE,
} from '@/lib/googleSheetsSync';
import {
  getAutoBackupDaemonState,
  updateAutoBackupDaemonState,
  loadSyncOutbox,
  loadBackupSyncLogs,
  clearBackupSyncLogs,
  runFirestoreToSheetsAutoBackupCycle,
  FIREBASE_CLOUD_FUNCTION_CODE,
  type BackupSyncLogEntry,
  type SyncOutboxItem,
} from '@/lib/firestoreSheetsBackupService';

export function TeamAndSyncAdmin() {
  const {
    session,
    admins,
    addOrUpdateAdmin,
    removeAdmin,
    leads,
    students,
    content,
    saveContent,
    pruneSyncedRecordsFromFirestore,
  } = useStore();

  const isSuperAdmin = session?.role === 'owner';

  // New / Edit Admin form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'owner' | 'ops'>('owner');
  const [newPassword, setNewPassword] = useState('');
  const [teamMsg, setTeamMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingAdmin, setSavingAdmin] = useState(false);

  // Google Sheets & Firebase Sync state
  const [webhookUrl, setWebhookUrl] = useState(() =>
    getSavedSheetsWebhookUrl(content.quizConfig?.googleSheetsWebhookUrl)
  );
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCloudFn, setCopiedCloudFn] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'none' | 'apps_script' | 'cloud_function'>('none');

  // Auto-Backup Daemon & Redundancy Outbox state
  const [daemonState, setDaemonState] = useState(() => getAutoBackupDaemonState());
  const [outbox, setOutbox] = useState<SyncOutboxItem[]>(() => loadSyncOutbox());
  const [syncLogs, setSyncLogs] = useState<BackupSyncLogEntry[]>(() => loadBackupSyncLogs());

  useEffect(() => {
    const refreshBackupState = () => {
      setDaemonState(getAutoBackupDaemonState());
      setOutbox(loadSyncOutbox());
      setSyncLogs(loadBackupSyncLogs());
    };
    window.addEventListener('advibe-backup-sync-updated', refreshBackupState);
    return () => window.removeEventListener('advibe-backup-sync-updated', refreshBackupState);
  }, []);

  const quota = getFirestoreQuotaStats();
  const assessments = loadAssessments();
  const readPct = Math.min(100, (quota.readsToday / SPARK_DAILY_READ_LIMIT) * 100);
  const writePct = Math.min(100, (quota.writesToday / SPARK_DAILY_WRITE_LIMIT) * 100);

  const syncedLeadsCount = leads.filter((l) => l.sheetsSynced).length;
  const syncedStudentsCount = students.filter((s) => s.sheetsSynced).length;
  const syncedAssessmentsCount = assessments.filter((a) => a.syncStatus === 'synced').length;

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setSavingAdmin(true);
    setTeamMsg(null);
    const err = await addOrUpdateAdmin({
      email: newEmail,
      name: newName,
      role: newRole,
      backupPassword: newPassword || 'advibe-admin-2026',
      active: true,
    });
    setSavingAdmin(false);
    if (err) {
      setTeamMsg({ type: 'err', text: err });
    } else {
      setTeamMsg({
        type: 'ok',
        text: `Saved ${newEmail.trim().toLowerCase()} as ${
          newRole === 'owner' ? 'Super Admin (Full Owner)' : 'Regular Admin (Ops)'
        }. They can now sign in with Google or their backup password.`,
      });
      setNewEmail('');
      setNewName('');
      setNewPassword('');
    }
  };

  const handleRoleToggle = async (email: string, currentName: string, nextRole: 'owner' | 'ops') => {
    if (!isSuperAdmin) return;
    const err = await addOrUpdateAdmin({
      email,
      name: currentName,
      role: nextRole,
    });
    if (err) {
      setTeamMsg({ type: 'err', text: err });
    } else {
      setTeamMsg({
        type: 'ok',
        text: `Updated ${email} role to ${nextRole === 'owner' ? 'Super Admin' : 'Regular Admin'}.`,
      });
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!isSuperAdmin) return;
    const err = await removeAdmin(email);
    if (err) {
      setTeamMsg({ type: 'err', text: err });
    } else {
      setTeamMsg({ type: 'ok', text: `Removed admin access for ${email}.` });
    }
  };

  const handleSaveWebhookUrl = async () => {
    const clean = webhookUrl.trim();
    setSavedSheetsWebhookUrl(clean);
    if (content.quizConfig) {
      await saveContent(
        {
          ...content,
          quizConfig: {
            ...content.quizConfig,
            googleSheetsWebhookUrl: clean,
          },
        },
        session?.name || 'Admin',
        'Updated Google Sheets Web App URL'
      );
    }
    setSyncFeedback({
      ok: true,
      text: clean
        ? 'Google Sheets Web App URL saved! Running automatic backup cycle for all Firestore records…'
        : 'Cleared Google Sheets Web App URL. New records will queue in the Redundancy Outbox until reconnected.',
    });

    if (clean) {
      const cycleRes = await runFirestoreToSheetsAutoBackupCycle({
        leads,
        students,
        assessments,
        webhookUrl: clean,
      });
      setSyncFeedback({ ok: true, text: cycleRes.message });
    }
  };

  const handleTestSheets = async () => {
    setSyncBusy(true);
    setSyncFeedback(null);
    setSavedSheetsWebhookUrl(webhookUrl.trim());
    const res = await testGoogleSheetsConnection(webhookUrl.trim());
    setSyncBusy(false);
    setSyncFeedback({ ok: res.ok, text: res.message });
  };

  const handleSyncAllNow = async () => {
    setSyncBusy(true);
    setSyncFeedback(null);
    setSavedSheetsWebhookUrl(webhookUrl.trim());
    const res = await syncAllRecordsToGoogleSheets({
      leads,
      students,
      assessments,
      webhookUrl: webhookUrl.trim(),
    });
    setSyncBusy(false);
    setSyncFeedback({ ok: res.ok, text: res.message });
  };

  const handleRunDeltaBackupNow = async () => {
    setSyncBusy(true);
    setSyncFeedback(null);
    const res = await runFirestoreToSheetsAutoBackupCycle({
      leads,
      students,
      assessments,
      webhookUrl: webhookUrl.trim(),
    });
    setSyncBusy(false);
    setSyncFeedback({ ok: res.remainingOutbox === 0, text: res.message });
  };

  const handleToggleDaemon = () => {
    const nextEnabled = !daemonState.enabled;
    updateAutoBackupDaemonState({ enabled: nextEnabled });
    setDaemonState(getAutoBackupDaemonState());
  };

  const handlePruneQuotaSaver = async () => {
    setSyncBusy(true);
    setSyncFeedback(null);
    const res = await pruneSyncedRecordsFromFirestore();
    setSyncBusy(false);
    setSyncFeedback({ ok: true, text: res.message });
  };

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleCopyCloudFunction = () => {
    navigator.clipboard.writeText(FIREBASE_CLOUD_FUNCTION_CODE);
    setCopiedCloudFn(true);
    setTimeout(() => setCopiedCloudFn(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* TOP SUMMARY BANNER */}
      <div className="bg-ink text-cream rounded-3xl p-6 md:p-8 border border-ink/10 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber/20 text-amber text-xs font-mono uppercase tracking-wider mb-3">
              <Database className="w-3.5 h-3.5" /> Firebase + Google Sheets Dual Redundancy Engine
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Team Access, Firebase Cloud & Automatic Google Sheets Backup
            </h2>
            <p className="text-cream/75 text-sm mt-2 leading-relaxed">
              Every newly submitted document in Firebase Firestore (<code className="font-mono">/leads</code>,{' '}
              <code className="font-mono">/assessments</code>, <code className="font-mono">/students</code>) is
              automatically backed up to your connected Google Sheet via a persistent Redundancy Outbox &amp; Cloud
              Trigger service—ensuring zero data loss while keeping your Firebase free tier protected.
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 min-w-[240px]">
            <div className="text-xs font-mono uppercase tracking-wider text-cream/60">Signed in as</div>
            <div className="font-semibold text-base mt-0.5 truncate">{session?.name}</div>
            <div className="text-xs text-cream/75 truncate">{session?.email}</div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isSuperAdmin ? 'Super Admin (Full Owner)' : 'Regular Admin (Ops)'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: AUTOMATIC FIRESTORE -> GOOGLE SHEETS BACKUP SERVICE & CLOUD FUNCTION */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Auto-Backup Service Control & Webhook Configuration */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-ink/10 p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-700">
                <CloudCog className="w-4 h-4" /> Real-Time Redundancy &amp; Auto-Backup Service
              </div>
              <h3 className="font-display text-xl md:text-2xl font-semibold mt-1 text-ink">
                Firestore → Google Sheets Automatic Backup
              </h3>
              <p className="text-sm text-ink/65 mt-1">
                Watches Firestore collections (<code className="font-mono">leads</code>,{' '}
                <code className="font-mono">assessments</code>, <code className="font-mono">students</code>) and
                automatically backs up newly submitted or updated records to 6 tabs in your Google Sheet.
              </p>
            </div>

            {/* Auto-Backup Daemon Toggle */}
            <button
              type="button"
              onClick={handleToggleDaemon}
              className={`h-9 px-3.5 rounded-full text-xs font-mono font-semibold inline-flex items-center gap-2 border transition cursor-pointer ${
                daemonState.enabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-warm border-ink/15 text-ink/60'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  daemonState.enabled ? 'bg-emerald-600 animate-pulse' : 'bg-ink/30'
                }`}
              />
              Auto-Backup Daemon: {daemonState.enabled ? 'ACTIVE' : 'PAUSED'}
            </button>
          </div>

          {/* Redundancy Status Cards */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-warm/70 border border-ink/10 p-4">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-ink/55">
                <span>Client Leads</span>
                <span className="text-emerald-700 font-semibold">
                  {syncedLeadsCount}/{leads.length} Synced
                </span>
              </div>
              <div className="font-display text-2xl font-semibold mt-1 text-ink">{leads.length}</div>
              <button
                type="button"
                onClick={() => exportLeadsCsv(leads)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink/75 hover:text-ink underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Leads CSV
              </button>
            </div>

            <div className="rounded-2xl bg-warm/70 border border-ink/10 p-4">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-ink/55">
                <span>Quiz Assessments</span>
                <span className="text-emerald-700 font-semibold">
                  {syncedAssessmentsCount}/{assessments.length} Synced
                </span>
              </div>
              <div className="font-display text-2xl font-semibold mt-1 text-ink">{assessments.length}</div>
              <button
                type="button"
                onClick={() => exportAssessmentsTabCsv('all', assessments)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink/75 hover:text-ink underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Assessments CSV
              </button>
            </div>

            <div className="rounded-2xl bg-warm/70 border border-ink/10 p-4">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-ink/55">
                <span>Training Students</span>
                <span className="text-emerald-700 font-semibold">
                  {syncedStudentsCount}/{students.length} Synced
                </span>
              </div>
              <div className="font-display text-2xl font-semibold mt-1 text-ink">{students.length}</div>
              <button
                type="button"
                onClick={() => exportStudentsCsv(students)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink/75 hover:text-ink underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Students CSV
              </button>
            </div>
          </div>

          {/* Webhook URL Input */}
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/70">
              Connected Google Sheet Web App URL (Target for Auto-Backup)
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 h-11 px-4 rounded-xl bg-warm/50 border border-ink/15 text-sm font-mono text-ink focus:outline-none focus:border-ink"
              />
              <button
                type="button"
                onClick={handleSaveWebhookUrl}
                className="h-11 px-5 rounded-xl bg-ink text-cream text-xs font-medium hover:bg-ink/90 transition cursor-pointer shrink-0"
              >
                Save &amp; Enable Auto-Backup
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                disabled={syncBusy}
                onClick={handleRunDeltaBackupNow}
                className="h-10 px-4 rounded-full bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncBusy ? 'animate-spin' : ''}`} />
                Flush Outbox &amp; Back Up Unsynced Records ({outbox.length} queued)
              </button>

              <button
                type="button"
                disabled={syncBusy}
                onClick={handleSyncAllNow}
                className="h-10 px-4 rounded-full bg-ink text-cream text-xs font-medium hover:bg-ink/90 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Full Backup All {leads.length + assessments.length + students.length} Records
              </button>

              <button
                type="button"
                disabled={syncBusy}
                onClick={handleTestSheets}
                className="h-10 px-4 rounded-full bg-warm border border-ink/15 text-ink text-xs font-medium hover:bg-ink/5 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                Test Sheet Connection
              </button>
            </div>
          </div>

          {syncFeedback && (
            <div
              className={`rounded-2xl p-4 text-sm border ${
                syncFeedback.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {syncFeedback.text}
            </div>
          )}

          {/* Serverless Code Templates: Google Apps Script + Firebase Cloud Function v2 */}
          <div className="rounded-2xl bg-warm/60 border border-ink/10 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-sm text-ink">
                  Serverless Redundancy Scripts (Google Apps Script + Firebase Cloud Function)
                </div>
                <p className="text-xs text-ink/65 mt-0.5">
                  Copy the 6-Tab Google Apps Script for your Google Sheet, or inspect the Firebase Cloud Function (
                  <code className="font-mono">onDocumentWritten</code>) trigger.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAppsScript}
                  className="h-9 px-3.5 rounded-full bg-ink text-cream text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedScript ? 'Copied Apps Script!' : 'Copy Google Apps Script'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCloudFunction}
                  className="h-9 px-3.5 rounded-full bg-white border border-ink/15 text-ink text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer hover:bg-warm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedCloudFn ? 'Copied Cloud Function!' : 'Copy Firebase Cloud Function'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveCodeTab((prev) => (prev === 'apps_script' ? 'none' : 'apps_script'))
                  }
                  className="h-9 px-3 rounded-full bg-white border border-ink/15 text-xs font-medium text-ink/75 hover:text-ink cursor-pointer"
                >
                  {activeCodeTab === 'apps_script' ? 'Hide Script' : 'View Apps Script'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveCodeTab((prev) => (prev === 'cloud_function' ? 'none' : 'cloud_function'))
                  }
                  className="h-9 px-3 rounded-full bg-white border border-ink/15 text-xs font-medium text-ink/75 hover:text-ink cursor-pointer"
                >
                  {activeCodeTab === 'cloud_function' ? 'Hide Cloud Fn' : 'View Cloud Function'}
                </button>
              </div>
            </div>

            {activeCodeTab === 'apps_script' && (
              <pre className="mt-3 p-4 rounded-xl bg-ink text-cream text-xs font-mono overflow-x-auto max-h-72">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            )}

            {activeCodeTab === 'cloud_function' && (
              <pre className="mt-3 p-4 rounded-xl bg-ink text-cream text-xs font-mono overflow-x-auto max-h-72">
                {FIREBASE_CLOUD_FUNCTION_CODE}
              </pre>
            )}
          </div>
        </div>

        {/* Right Column: Live Auto-Backup Activity Feed & Spark Quota Guard */}
        <div className="space-y-6">
          {/* Live Auto-Backup Activity Log */}
          <div className="bg-white rounded-3xl border border-ink/10 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-700">
                <Activity className="w-4 h-4" /> Auto-Backup Activity Feed
              </div>
              {syncLogs.length > 0 && (
                <button
                  type="button"
                  onClick={clearBackupSyncLogs}
                  className="text-[11px] font-mono text-ink/45 hover:text-ink cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl bg-warm/60 p-3 border border-ink/10">
                <div className="text-ink/55 font-mono text-[10px] uppercase">Outbox Queue</div>
                <div className="font-display text-lg font-semibold text-ink mt-0.5">
                  {outbox.length} Pending
                </div>
              </div>
              <div className="rounded-xl bg-warm/60 p-3 border border-ink/10">
                <div className="text-ink/55 font-mono text-[10px] uppercase">Total Auto-Backed Up</div>
                <div className="font-display text-lg font-semibold text-emerald-700 mt-0.5">
                  {daemonState.totalBackedUp}
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {syncLogs.length === 0 ? (
                <div className="rounded-xl bg-warm/40 border border-ink/10 p-4 text-xs text-ink/60 text-center">
                  New Firestore submissions (<code className="font-mono">leads</code>,{' '}
                  <code className="font-mono">assessments</code>, <code className="font-mono">students</code>) will
                  appear here as they automatically back up to Google Sheets.
                </div>
              ) : (
                syncLogs.slice(0, 12).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-warm/40 border border-ink/10 p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink truncate">{item.label}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold shrink-0 ${
                          item.status === 'synced'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'queued'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status === 'synced' ? (
                          <Check className="w-3 h-3" />
                        ) : item.status === 'queued' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink/65">{item.message}</div>
                    <div className="text-[10px] font-mono text-ink/45">
                      {new Date(item.timestamp).toLocaleTimeString()} · {item.recordRef}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Spark Free-Tier Quota Guard */}
          <div className="bg-white rounded-3xl border border-ink/10 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-700">
              <Sparkles className="w-4 h-4" /> Spark Free-Tier Guard
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">Firebase Free Quota Health</h3>

            {/* Reads meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-ink">
                <span className="font-medium text-ink/75">Daily Cloud Reads</span>
                <span className="font-mono font-semibold">
                  {quota.readsToday.toLocaleString()} / {SPARK_DAILY_READ_LIMIT.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-warm overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${Math.max(1, readPct)}%` }}
                />
              </div>
            </div>

            {/* Writes meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-ink">
                <span className="font-medium text-ink/75">Daily Cloud Writes</span>
                <span className="font-mono font-semibold">
                  {quota.writesToday.toLocaleString()} / {SPARK_DAILY_WRITE_LIMIT.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-warm overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all"
                  style={{ width: `${Math.max(1, writePct)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-ink/10">
              {isSuperAdmin && (
                <button
                  type="button"
                  disabled={syncBusy}
                  onClick={handlePruneQuotaSaver}
                  className="w-full h-9 px-4 rounded-xl bg-warm border border-ink/15 hover:bg-ink hover:text-cream text-ink text-xs font-medium transition cursor-pointer disabled:opacity-50"
                >
                  Sync to Sheets &amp; Prune Archived Rows
                </button>
              )}
              <a
                href={firebaseProjectInfo.consoleUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full h-9 px-4 rounded-xl bg-warm/50 border border-ink/10 text-ink/75 hover:text-ink text-xs font-medium inline-flex items-center justify-center gap-1.5"
              >
                Open Firebase Firestore Console <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: SUPER ADMIN & REGULAR ADMIN TEAM MANAGER */}
      <div className="bg-white rounded-3xl border border-ink/10 p-6 md:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-ink/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-700">
              <Users className="w-4 h-4" /> Role-Based Access Control
            </div>
            <h3 className="font-display text-xl md:text-2xl font-semibold mt-1 text-ink">
              Super Admins &amp; Regular Admins ({admins.length})
            </h3>
            <p className="text-sm text-ink/65 mt-1">
              Add your new Gmail account or team members below. <strong>Super Admins</strong> have full ownership
              control (including creating other admins and editing prices), while <strong>Regular Admins</strong> manage
              leads, projects, and student payments.
            </p>
          </div>
        </div>

        {/* Add New Gmail / Admin Form (Super Admin Only) */}
        {isSuperAdmin ? (
          <form onSubmit={handleAddAdmin} className="mt-6 bg-warm/60 rounded-2xl p-5 border border-ink/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink mb-4">
              <UserPlus className="w-4 h-4 text-amber-700" />
              Add or Update an Admin Account (Supports Google Sign-In + Backup Password)
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1">Gmail / Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="yournewgmail@gmail.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-ink/15 text-sm text-ink focus:outline-none focus:border-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. AdVibe Owner (New Gmail)"
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-ink/15 text-sm text-ink focus:outline-none focus:border-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1">Access Level (Role) *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'owner' | 'ops')}
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-ink/15 text-sm text-ink focus:outline-none focus:border-ink"
                >
                  <option value="owner">Super Admin (Full Owner)</option>
                  <option value="ops">Regular Admin (Operations)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1">Backup Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="advibe-admin-2026"
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-ink/15 text-sm font-mono text-ink focus:outline-none focus:border-ink"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ink/60">
                Tip: If you sign in with a Gmail address added here, clicking <strong>Continue with Google</strong> on
                the login screen logs you in immediately.
              </p>
              <button
                type="submit"
                disabled={savingAdmin}
                className="h-10 px-5 rounded-full bg-ink text-cream text-xs font-medium hover:bg-ink/90 transition cursor-pointer disabled:opacity-50"
              >
                {savingAdmin ? 'Saving Admin…' : 'Save Admin Account'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl bg-warm/60 border border-ink/10 p-4 flex items-center gap-3 text-sm text-ink/70">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            You are signed in as a Regular Admin (Ops). Only a Super Admin can add or remove admin accounts.
          </div>
        )}

        {teamMsg && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm border ${
              teamMsg.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {teamMsg.text}
          </div>
        )}

        {/* Admin Directory Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ink/10 text-[11px] font-mono uppercase tracking-wider text-ink/55">
                <th className="py-3 pr-4">Admin Name &amp; Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Backup Password</th>
                <th className="py-3 px-4">Sign-In Methods</th>
                {isSuperAdmin && <th className="py-3 pl-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 text-sm">
              {admins.map((a) => {
                const isPrimary = a.email.toLowerCase() === 'shittu.cfm@gmail.com' || a.isPrimaryOwner;
                return (
                  <tr key={a.email} className="hover:bg-warm/40">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-ink flex items-center gap-2">
                        {a.name}
                        {isPrimary && (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber/25 text-ink">
                            Primary Owner
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink/60 font-mono">{a.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {isSuperAdmin && !isPrimary ? (
                        <select
                          value={a.role}
                          onChange={(e) =>
                            handleRoleToggle(a.email, a.name, e.target.value as 'owner' | 'ops')
                          }
                          className="h-8 px-2.5 rounded-lg bg-warm border border-ink/15 text-xs font-medium text-ink"
                        >
                          <option value="owner">Super Admin (Owner)</option>
                          <option value="ops">Regular Admin (Ops)</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            a.role === 'owner'
                              ? 'bg-amber/20 text-ink'
                              : 'bg-ink/10 text-ink/80'
                          }`}
                        >
                          {a.role === 'owner' ? 'Super Admin (Owner)' : 'Regular Admin (Ops)'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-ink/75">
                      {isSuperAdmin ? a.backupPassword || 'advibe-admin-2026' : '••••••••••••'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink/65">
                      Google Sign-In + Backup Password
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3.5 pl-4 text-right">
                        {!isPrimary ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdmin(a.email)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        ) : (
                          <span className="text-xs text-ink/40">Protected</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Guide for Transitioning Ownership to a New Gmail Account */}
        <div className="mt-6 rounded-2xl bg-amber/10 border border-amber/30 p-5">
          <div className="flex items-start gap-3">
            <ArrowRightLeft className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm text-ink/80 space-y-1.5">
              <div className="font-semibold text-ink">
                How to Move Full Ownership to Your New Gmail Account Anytime:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-ink/75">
                <li>
                  Add your new Gmail above with role set to <strong>Super Admin (Full Owner)</strong>. It immediately
                  gets full Super Admin power inside this dashboard.
                </li>
                <li>
                  To also make that new Gmail the cloud owner of the Firebase database, open{' '}
                  <a
                    href={firebaseProjectInfo.iamUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-medium text-ink inline-flex items-center gap-1"
                  >
                    Firebase Users &amp; Permissions <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  and invite your new Gmail as an <strong>Owner</strong>.
                </li>
                <li>
                  Share your connected Google Sheet with your new Gmail as an <strong>Editor / Owner</strong>.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
