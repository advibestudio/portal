import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Plus,
  ExternalLink,
  Film,
  FileText,
  DollarSign,
  RefreshCw,
  FolderOpen,
  UserPlus,
} from 'lucide-react';
import {
  type CustomerProject,
  type PortalPackageType,
  type ProjectScriptItem,
  type ProjectVideoDeliverable,
  computeDeliverableGate,
  fetchAllPortalDataFromFirestore,
  getVideoDeliverableAccess,
  loadCustomerProjects,
  provisionCustomerFromBooking,
  syncCustomerProjectToFirestore,
} from '@/lib/customerPortalStore';

export function ClientProjectsAdminView() {
  const [projects, setProjects] = useState<CustomerProject[]>(() => loadCustomerProjects());
  const [selectedId, setSelectedId] = useState<string>(() => loadCustomerProjects()[0]?.id || '');
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState('');

  // Add Script form state
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptHook, setScriptHook] = useState('');
  const [scriptBody, setScriptBody] = useState('');
  const [scriptVisualNotes, setScriptVisualNotes] = useState('');

  // Add Google Drive Video Deliverable state
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCategory, setVideoCategory] = useState('Service Ads');
  const [videoDriveUrl, setVideoDriveUrl] = useState('');

  // Quick Create Client Project Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newPkgType, setNewPkgType] = useState<PortalPackageType>('single');
  const [newPrice, setNewPrice] = useState(60000);

  const refresh = async () => {
    setSyncing(true);
    const { projects: latest } = await fetchAllPortalDataFromFirestore();
    setProjects(latest);
    if (latest.length > 0 && !latest.some((p) => p.id === selectedId)) {
      setSelectedId(latest[0].id);
    }
    setSyncing(false);
  };

  useEffect(() => {
    void refresh();
    const onUpdate = () => setProjects(loadCustomerProjects());
    window.addEventListener('advibe-portal-updated', onUpdate);
    return () => window.removeEventListener('advibe-portal-updated', onUpdate);
  }, []);

  const activeProject = projects.find((p) => p.id === selectedId) || projects[0] || null;

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleUpdatePaymentPercent = async (percent: number) => {
    if (!activeProject) return;
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    const amountPaid = Math.round((activeProject.totalPrice * clamped) / 100);
    const gate = computeDeliverableGate({
      packageType: activeProject.packageType,
      totalVideos: activeProject.totalVideos,
      paidPercent: clamped,
    });
    const nextStatus =
      clamped >= 100
        ? 'Completed'
        : gate.canBeginWork
          ? activeProject.status === 'Awaiting Deposit'
            ? 'Scripting & Review'
            : activeProject.status
          : 'Awaiting Deposit';

    const updated: CustomerProject = {
      ...activeProject,
      paidPercent: clamped,
      amountPaid,
      status: nextStatus,
      paymentNotes: `${clamped}% Payment Confirmed by Admin (${gate.unlockedDownloadCount} of ${activeProject.totalVideos} videos unlocked for download).`,
      updatedAt: new Date().toISOString(),
    };
    await syncCustomerProjectToFirestore(updated);
    setProjects(loadCustomerProjects());
    notify(
      `Updated ${activeProject.customerName} payment to ${clamped}% — ${gate.unlockedDownloadCount}/${activeProject.totalVideos} downloads unlocked.`,
    );
  };

  const handleAddScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !scriptTitle.trim() || !scriptBody.trim()) return;
    const nextEp = activeProject.scripts.length + 1;
    const newScr: ProjectScriptItem = {
      id: `scr_${Date.now().toString(36)}`,
      episodeNumber: nextEp,
      title: scriptTitle.trim(),
      hook: scriptHook.trim() || '0–3s Attention Hook',
      scriptBody: scriptBody.trim(),
      visualNotes: scriptVisualNotes.trim(),
      status: 'pending_review',
      clientAssetLinks: [],
      clientRecommendations: '',
      updatedAt: new Date().toISOString(),
    };
    const updated: CustomerProject = {
      ...activeProject,
      scripts: [...activeProject.scripts, newScr],
      unreadScriptAlert: true,
      status: 'Scripting & Review',
      updatedAt: new Date().toISOString(),
    };
    await syncCustomerProjectToFirestore(updated);
    setProjects(loadCustomerProjects());
    setScriptTitle('');
    setScriptHook('');
    setScriptBody('');
    setScriptVisualNotes('');
    notify(`Published "${newScr.title}" to client portal with notification alert.`);
  };

  const handleAddVideoDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !videoTitle.trim() || !videoDriveUrl.trim()) return;
    const nextIdx = activeProject.videos.length + 1;
    const newVid: ProjectVideoDeliverable = {
      id: `vid_${Date.now().toString(36)}`,
      index: nextIdx,
      title: videoTitle.trim(),
      category: videoCategory,
      driveUrl: videoDriveUrl.trim(),
      status: 'ready',
      manualDownloadUnlocked: false,
      uploadedAt: new Date().toISOString(),
    };
    const updated: CustomerProject = {
      ...activeProject,
      videos: [...activeProject.videos, newVid],
      status: 'Ready for Review',
      updatedAt: new Date().toISOString(),
    };
    await syncCustomerProjectToFirestore(updated);
    setProjects(loadCustomerProjects());
    setVideoTitle('');
    setVideoDriveUrl('');
    notify(`Uploaded Video #${nextIdx} to ${activeProject.customerName}'s portal.`);
  };

  const handleToggleManualVideoUnlock = async (vidId: string) => {
    if (!activeProject) return;
    const updatedVideos = activeProject.videos.map((v) =>
      v.id === vidId ? { ...v, manualDownloadUnlocked: !v.manualDownloadUnlocked } : v,
    );
    const updated: CustomerProject = {
      ...activeProject,
      videos: updatedVideos,
      updatedAt: new Date().toISOString(),
    };
    await syncCustomerProjectToFirestore(updated);
    setProjects(loadCustomerProjects());
    notify('Updated manual download release override for video.');
  };

  const handleCreateClientProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const pkgMap: Record<PortalPackageType, { name: string; qty: number }> = {
      single: { name: 'Single AI Video Ad (1 Video)', qty: 1 },
      pack_5: { name: 'Growth Campaign Pack (5 Videos)', qty: 5 },
      pack_10: { name: 'Scale Campaign Pack (10 Videos)', qty: 10 },
      retainer_15: { name: 'Monthly Content Retainer / Mini-Series (15 Videos)', qty: 15 },
    };
    const cfg = pkgMap[newPkgType];
    const { project } = provisionCustomerFromBooking({
      name: newClientName.trim(),
      email: newClientEmail.trim(),
      phone: newClientPhone.trim() || '+234',
      offerId: newPkgType,
      offerName: cfg.name,
      price: Number(newPrice) || 60000,
      currency: 'NGN',
      configuredQty: cfg.qty,
    });
    setProjects(loadCustomerProjects());
    setSelectedId(project.id);
    setCreateOpen(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    notify(`Created client account & portal project for ${project.customerName}.`);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
            CLIENT PORTAL & TIERED PAYMENT CONTROLLER
          </span>
          <h2 className="font-display text-2xl font-extrabold text-white mt-1">
            Manage Client Payments, Script Approvals & Google Drive Deliverables
          </h2>
          <p className="text-xs text-white/60 mt-0.5">
            Manually approve payment percentages (1-Video: 60%/100%, 5-Videos: 50% unlocks 2, 10-Videos: 50% unlocks 5, 15-Retainer: 40% unlocks 6) and publish scripts or Google Drive video links.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#f5a524] px-4 py-2.5 font-display text-xs font-extrabold uppercase tracking-wider text-black"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ New Client Project</span>
          </button>
          <a
            href="#/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 font-mono text-xs font-bold text-white hover:border-[#f5a524] no-underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Client Portal</span>
          </a>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-mono font-bold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Project List */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between px-1 font-mono text-xs text-white/50">
            <span>CLIENT PROJECTS ({projects.length})</span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-[#f5a524] hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {projects.map((p) => {
              const gate = computeDeliverableGate(p);
              const hasChangesRequested = p.scripts.some((s) => s.status === 'changes_requested');
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition space-y-2 ${
                    activeProject?.id === p.id
                      ? 'border-[#f5a524] bg-[#f5a524]/10'
                      : 'border-white/10 bg-[#121317] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#f5a524]">{p.ref}</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white tabular-nums">
                      {p.paidPercent}% Paid · {gate.unlockedDownloadCount}/{p.totalVideos} Unlocked
                    </span>
                  </div>
                  <div className="font-display text-sm font-bold text-white truncate">
                    {p.customerName} {p.businessName ? `(${p.businessName})` : ''}
                  </div>
                  <div className="text-xs text-white/60 truncate">{p.packageName}</div>
                  {hasChangesRequested && (
                    <div className="inline-flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-red-300">
                      <AlertCircle className="h-3 w-3" />
                      <span>Client Requested Script Rework</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Project Payment, Scripts & Google Drive Deliverables */}
        {activeProject && (
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Manual Backend Payment Approval Box */}
            <div className="rounded-2xl border border-white/12 bg-[#121317] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <span className="font-mono text-[11px] font-bold uppercase text-[#f5a524]">
                    1 · MANUAL BACKEND PAYMENT APPROVAL
                  </span>
                  <h3 className="font-display text-lg font-bold text-white">
                    {activeProject.customerName} — {activeProject.packageName}
                  </h3>
                  <p className="font-mono text-xs text-white/55">
                    {activeProject.customerEmail} · {activeProject.customerPhone}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-white/50 block">Approved Payment</span>
                  <span className="font-display text-2xl font-extrabold text-emerald-400 tabular-nums">
                    {activeProject.paidPercent}%
                  </span>
                </div>
              </div>

              {/* Preset Milestone Buttons matching exact commercial rules */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { pct: 0, label: '0% (Unpaid)' },
                  { pct: 40, label: '40% (Retainer Start · 6/15 Videos)' },
                  { pct: 50, label: '50% (5/10-Pack Start · 50% Videos)' },
                  { pct: 60, label: '60% (1-Video Start · View-Only)' },
                  { pct: 80, label: '80% Milestone' },
                  { pct: 100, label: '100% Full Payment (Unlock All Downloads)' },
                ].map((btn) => (
                  <button
                    key={btn.pct}
                    type="button"
                    onClick={() => void handleUpdatePaymentPercent(btn.pct)}
                    className={`rounded-xl px-3 py-2 font-mono text-xs font-bold transition ${
                      activeProject.paidPercent === btn.pct
                        ? 'bg-[#f5a524] text-black'
                        : 'border border-white/15 bg-white/5 text-white/80 hover:border-[#f5a524]'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Custom % Slider */}
              <div className="flex items-center gap-4 pt-1">
                <span className="font-mono text-xs text-white/60 whitespace-nowrap">
                  Custom % Paid:
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={activeProject.paidPercent}
                  onChange={(e) => void handleUpdatePaymentPercent(Number(e.target.value))}
                  className="flex-1 accent-[#f5a524]"
                />
                <span className="font-mono text-xs font-bold text-[#f5a524] tabular-nums w-12 text-right">
                  {activeProject.paidPercent}%
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/75 font-mono">
                {computeDeliverableGate(activeProject).nextMilestoneNote}
              </div>
            </div>

            {/* 2. Script Publisher & Client Feedback / Asset Inspector */}
            <div className="rounded-2xl border border-white/12 bg-[#121317] p-5 space-y-4">
              <span className="font-mono text-[11px] font-bold uppercase text-[#f5a524] block">
                2 · SCRIPTS, CLIENT APPROVALS, REWORK EXPLANATIONS & ASSETS ({activeProject.scripts.length})
              </span>

              <div className="space-y-3">
                {activeProject.scripts.map((scr) => (
                  <div
                    key={scr.id}
                    className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <strong className="font-display text-sm text-white">
                        Ep 0{scr.episodeNumber}: {scr.title}
                      </strong>
                      <span
                        className={`rounded-lg px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          scr.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : scr.status === 'changes_requested'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {scr.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-[#f5a524] font-semibold">{scr.hook}</p>
                    <p className="text-xs text-white/75 whitespace-pre-line">{scr.scriptBody}</p>

                    {scr.revisionExplanation && (
                      <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs space-y-1">
                        <strong className="text-red-300 font-mono block">
                          CLIENT REJECTION / REWORK EXPLANATION:
                        </strong>
                        <p className="text-white/90">{scr.revisionExplanation}</p>
                      </div>
                    )}

                    {scr.clientRecommendations && (
                      <div className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs">
                        <strong className="text-[#f5a524] font-mono block">
                          Client Creative Recommendations:
                        </strong>
                        <p className="text-white/80">{scr.clientRecommendations}</p>
                      </div>
                    )}

                    {scr.clientUploadedAssets && scr.clientUploadedAssets.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="font-mono text-[10px] uppercase text-[#f5a524] block">
                          Client Uploaded Files ({scr.clientUploadedAssets.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {scr.clientUploadedAssets.map((asset) => (
                            <a
                              key={asset.id}
                              href={asset.dataUrl}
                              download={asset.name}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-[11px] text-white hover:border-[#f5a524] hover:text-[#f5a524] transition no-underline"
                            >
                              {asset.mimeType.startsWith('image/') ? (
                                <img
                                  src={asset.dataUrl}
                                  alt={asset.name}
                                  className="h-5 w-5 rounded object-cover shrink-0"
                                />
                              ) : (
                                <FileText className="h-3.5 w-3.5 shrink-0 text-[#f5a524]" />
                              )}
                              <span className="truncate max-w-[180px]">{asset.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {scr.clientAssetLinks && scr.clientAssetLinks.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="font-mono text-[10px] uppercase text-emerald-400 block">
                          Client Submitted Cloud Links:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {scr.clientAssetLinks.map((lnk, i) => (
                            <a
                              key={i}
                              href={lnk}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2.5 py-1 font-mono text-[11px] text-emerald-300 hover:underline"
                            >
                              <FolderOpen className="h-3 w-3" />
                              <span>Asset Link #{i + 1}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Publish New Script Form */}
              <form onSubmit={handleAddScript} className="space-y-3 border-t border-white/10 pt-4">
                <h4 className="font-display text-sm font-bold text-white">
                  + Publish New Script for Client Approval
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={scriptTitle}
                    onChange={(e) => setScriptTitle(e.target.value)}
                    placeholder="Script Title (e.g., Video 02 — Problem/Solution)"
                    className="rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    value={scriptHook}
                    onChange={(e) => setScriptHook(e.target.value)}
                    placeholder="0–3s Opening Hook Line"
                    className="rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <textarea
                  rows={3}
                  value={scriptBody}
                  onChange={(e) => setScriptBody(e.target.value)}
                  placeholder="Paste full scene-by-scene script and voiceover dialogue..."
                  className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-xs text-white"
                  required
                />
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={scriptVisualNotes}
                    onChange={(e) => setScriptVisualNotes(e.target.value)}
                    placeholder="Visual / Audio direction notes (optional)"
                    className="flex-1 rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-[#f5a524] px-4 py-2 font-display text-xs font-extrabold uppercase tracking-wider text-black"
                  >
                    Send Script to Client
                  </button>
                </div>
              </form>
            </div>

            {/* 3. Google Drive Video Deliverables & Manual Release Override */}
            <div className="rounded-2xl border border-white/12 bg-[#121317] p-5 space-y-4">
              <span className="font-mono text-[11px] font-bold uppercase text-emerald-400 block">
                3 · GOOGLE DRIVE VIDEO DELIVERABLES & MANUAL RELEASE OVERRIDE ({activeProject.videos.length}/{activeProject.totalVideos})
              </span>

              <div className="space-y-2.5">
                {activeProject.videos.map((vid) => {
                  const access = getVideoDeliverableAccess(activeProject, vid);
                  return (
                    <div
                      key={vid.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 p-3.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#f5a524]">
                            #{vid.index}
                          </span>
                          <strong className="font-display text-sm text-white truncate">
                            {vid.title}
                          </strong>
                        </div>
                        <p className="font-mono text-[11px] text-white/55 truncate mt-0.5">
                          {vid.driveUrl} · <span className="text-emerald-300">{access.accessLabel}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleToggleManualVideoUnlock(vid.id)}
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-bold transition ${
                          vid.manualDownloadUnlocked
                            ? 'bg-emerald-500 text-black'
                            : 'border border-white/15 bg-white/5 text-white/80 hover:border-[#f5a524]'
                        }`}
                      >
                        {vid.manualDownloadUnlocked ? (
                          <>
                            <Unlock className="h-3.5 w-3.5" />
                            <span>Manual Unlock ON</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-3.5 w-3.5" />
                            <span>Force Unlock Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleAddVideoDeliverable} className="space-y-3 border-t border-white/10 pt-4">
                <h4 className="font-display text-sm font-bold text-white">
                  + Host Completed Google Drive Video Link
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Video Title (e.g., Campaign Ad 01)"
                    className="rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                    placeholder="Category (e.g., Service Ads)"
                    className="rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={videoDriveUrl}
                    onChange={(e) => setVideoDriveUrl(e.target.value)}
                    placeholder="Google Drive share link or YouTube ID"
                    className="rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-500 px-4 py-2 font-display text-xs font-extrabold uppercase tracking-wider text-black"
                  >
                    Add Video to Client Portal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Create Client Project Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12151b] p-6 space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-white">
              Create Client Portal Account & Project
            </h3>
            <form onSubmit={handleCreateClientProject} className="space-y-3">
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Client Full Name or Company"
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white"
                required
              />
              <input
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="Client Email Address"
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white"
                required
              />
              <input
                type="text"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Client Phone / WhatsApp (+234...)"
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white"
              />
              <select
                value={newPkgType}
                onChange={(e) => {
                  const val = e.target.value as PortalPackageType;
                  setNewPkgType(val);
                  if (val === 'single') setNewPrice(60000);
                  if (val === 'pack_5') setNewPrice(220000);
                  if (val === 'pack_10') setNewPrice(400000);
                  if (val === 'retainer_15') setNewPrice(250000);
                }}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white font-bold"
              >
                <option value="single">1-Video Package (60% / 100% Rule)</option>
                <option value="pack_5">5-Video Package (50% Deposit → 2 Videos Unlocked)</option>
                <option value="pack_10">10-Video Package (50% Deposit → 5 Videos Unlocked)</option>
                <option value="retainer_15">15-Video Monthly Retainer (40% Deposit → 40% Unlocked)</option>
              </select>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                placeholder="Package Price"
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl border border-white/15 px-4 py-2 text-xs text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#f5a524] px-5 py-2 font-display text-xs font-extrabold uppercase text-black"
                >
                  Create Client & Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
