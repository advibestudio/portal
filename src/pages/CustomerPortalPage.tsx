import React, { useEffect, useMemo, useState } from 'react';
import {
  Film,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  Download,
  FileText,
  Plus,
  MessageCircle,
  AlertCircle,
  ExternalLink,
  BellRing,
  LogOut,
  ShieldCheck,
  KeyRound,
  FolderPlus,
  Sparkles,
  X,
  RefreshCw,
  Eye,
  Send,
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';
import { useStore, waLink } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { waNumberFor } from '@/lib/money';
import { PWAInstallButton, OfflineBanner } from '@/lib/pwa';
import {
  type CustomerAccount,
  type CustomerProject,
  type PortalPackageType,
  type ProjectScriptItem,
  type ProjectVideoDeliverable,
  computeDeliverableGate,
  fetchAllPortalDataFromFirestore,
  getActiveCustomerSession,
  getVideoDeliverableAccess,
  loadCustomerAccounts,
  loadCustomerProjects,
  parseGoogleDriveVideoUrl,
  provisionCustomerFromBooking,
  setActiveCustomerSession,
  syncCustomerAccountToFirestore,
  syncCustomerProjectToFirestore,
} from '@/lib/customerPortalStore';

export default function CustomerPortalPage() {
  const { content } = useStore();
  const { country } = useCountry();

  const [session, setSession] = useState<CustomerAccount | null>(() => getActiveCustomerSession());
  const [projects, setProjects] = useState<CustomerProject[]>(() => loadCustomerProjects());
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'scripts' | 'videos'>('overview');

  // Login states
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [otpSentCode, setOtpSentCode] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');

  // Post-booking password setup state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSavedToast, setPasswordSavedToast] = useState(false);

  // Script review states
  const [assetInputByScript, setAssetInputByScript] = useState<Record<string, string>>({});
  const [notesByScript, setNotesByScript] = useState<Record<string, string>>({});
  const [rejectingScriptId, setRejectingScriptId] = useState<string | null>(null);
  const [rejectExplanation, setRejectExplanation] = useState('');
  const [scriptToast, setScriptToast] = useState('');

  // Screening room video modal
  const [screeningVideo, setScreeningVideo] = useState<{
    video: ProjectVideoDeliverable;
    canDownload: boolean;
    accessLabel: string;
  } | null>(null);
  const [iframeReady, setIframeReady] = useState(false);

  // Request new project modal
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [reqPackageType, setReqPackageType] = useState<PortalPackageType>('single');
  const [reqBusinessName, setReqBusinessName] = useState('');
  const [reqBriefNotes, setReqBriefNotes] = useState('');

  const refreshData = async () => {
    const { accounts, projects: latestProjects } = await fetchAllPortalDataFromFirestore();
    setProjects(latestProjects);
    const current = getActiveCustomerSession();
    if (current) {
      const updatedAcc = accounts.find((a) => a.id === current.id) || current;
      setSession(updatedAcc);
    }
  };

  useEffect(() => {
    void refreshData();
    const onUpdate = () => {
      setProjects(loadCustomerProjects());
      setSession(getActiveCustomerSession());
    };
    window.addEventListener('advibe-portal-updated', onUpdate);
    return () => window.removeEventListener('advibe-portal-updated', onUpdate);
  }, []);

  const customerProjects = useMemo(() => {
    if (!session) return [];
    const cleanEmail = (session.email || '').trim().toLowerCase();
    const cleanPhone = (session.phone || '').replace(/\D/g, '');
    return projects.filter(
      (p) =>
        p.customerId === session.id ||
        (cleanEmail && p.customerEmail.toLowerCase() === cleanEmail) ||
        (cleanPhone.length >= 6 && p.customerPhone.replace(/\D/g, '') === cleanPhone),
    );
  }, [projects, session]);

  useEffect(() => {
    if (customerProjects.length > 0 && !customerProjects.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(customerProjects[0].id);
    }
  }, [customerProjects, selectedProjectId]);

  const activeProject = useMemo(
    () => customerProjects.find((p) => p.id === selectedProjectId) || customerProjects[0] || null,
    [customerProjects, selectedProjectId],
  );

  const pendingScriptsCount = useMemo(() => {
    if (!activeProject) return 0;
    return activeProject.scripts.filter((s) => s.status === 'pending_review').length;
  }, [activeProject]);

  // WhatsApp Customer Care Direct Link
  const careWaUrl = useMemo(() => {
    const waNum = waNumberFor(content.settings.whatsappNumber, country);
    const msg = session
      ? `Hi ${content.settings.whatsappDisplay} Customer Care! I am ${session.name} (${session.email || session.phone}).${
          activeProject
            ? ` I need assistance with my project "${activeProject.packageName}" (Ref: ${activeProject.ref}, ${activeProject.paidPercent}% Paid).`
            : ' I need assistance with my Client Portal account.'
        }`
      : `Hi ${content.settings.whatsappDisplay} Customer Care! I need help accessing my Client Portal account.`;
    return waLink(waNum, msg);
  }, [content.settings.whatsappNumber, content.settings.whatsappDisplay, country, session, activeProject]);

  /* ---------------- AUTH HANDLERS ---------------- */
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    if (!clean) {
      setAuthError('Please enter your email address or phone number.');
      return;
    }
    const accounts = loadCustomerAccounts();
    const found = accounts.find(
      (a) =>
        (a.email && a.email.toLowerCase() === clean) ||
        (cleanDigits.length >= 6 && a.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-8))),
    );

    if (!found) {
      setAuthError('No client account found with that email or phone. Book a free strategy session first or use Demo Login below.');
      return;
    }

    if (found.passwordSet && found.password && found.password !== passwordInput) {
      setAuthError('Incorrect password. You can switch to "Login with Email/Phone OTP" to sign in with a one-time code.');
      return;
    }

    const updated = { ...found, lastLoginAt: new Date().toISOString() };
    void syncCustomerAccountToFirestore(updated);
    setActiveCustomerSession(updated);
    setSession(updated);
  };

  const handleSendOtp = () => {
    setAuthError('');
    setAuthNotice('');
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    if (!clean) {
      setAuthError('Enter your registered email address or phone number first.');
      return;
    }
    const accounts = loadCustomerAccounts();
    const found = accounts.find(
      (a) =>
        (a.email && a.email.toLowerCase() === clean) ||
        (cleanDigits.length >= 6 && a.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-8))),
    );
    if (!found) {
      setAuthError('Account not found. Please check your email/phone or book your free strategy call first.');
      return;
    }
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    const updated = { ...found, otpCode: generatedCode };
    void syncCustomerAccountToFirestore(updated);
    setOtpSentCode(generatedCode);
    setAuthNotice(`One-Time Passcode generated for ${found.email || found.phone}: ${generatedCode}`);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    const accounts = loadCustomerAccounts();
    const found = accounts.find(
      (a) =>
        (a.email && a.email.toLowerCase() === clean) ||
        (cleanDigits.length >= 6 && a.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-8))),
    );
    if (!found) {
      setAuthError('Account not found.');
      return;
    }
    if (!otpInput.trim() || (otpSentCode && otpInput.trim() !== otpSentCode && otpInput.trim() !== found.otpCode)) {
      setAuthError('Invalid OTP code. Please check the 6-digit code shown above.');
      return;
    }
    const updated = { ...found, lastLoginAt: new Date().toISOString() };
    void syncCustomerAccountToFirestore(updated);
    setActiveCustomerSession(updated);
    setSession(updated);
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const email = (user.email || '').toLowerCase();
      const accounts = loadCustomerAccounts();
      let found = accounts.find((a) => a.email.toLowerCase() === email);
      if (!found) {
        const provisioned = provisionCustomerFromBooking({
          name: user.displayName || 'Google Client',
          email,
          phone: user.phoneNumber || '',
          business: '',
          offerId: 'single',
          offerName: 'Single Video Ad Package (1 Video)',
          price: 60000,
          currency: country.currency,
          configuredQty: 1,
        });
        found = provisioned.account;
      }
      setActiveCustomerSession(found);
      setSession(found);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In could not be completed.');
    }
  };

  const handleSetCustomerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (newPassword.trim().length < 4) {
      setAuthError('Please choose a password of at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    setAuthError('');
    const updated: CustomerAccount = {
      ...session,
      password: newPassword.trim(),
      passwordSet: true,
    };
    await syncCustomerAccountToFirestore(updated);
    setActiveCustomerSession(updated);
    setSession(updated);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSavedToast(true);
    setTimeout(() => setPasswordSavedToast(false), 4000);
  };

  /* ---------------- SCRIPT WORKFLOW HANDLERS ---------------- */
  const handleAddAssetLink = async (script: ProjectScriptItem) => {
    if (!activeProject) return;
    const raw = (assetInputByScript[script.id] || '').trim();
    if (!raw) return;
    const updatedScripts = activeProject.scripts.map((s) =>
      s.id === script.id
        ? {
            ...s,
            clientAssetLinks: [...(s.clientAssetLinks || []), raw],
            updatedAt: new Date().toISOString(),
          }
        : s,
    );
    const updatedProject: CustomerProject = {
      ...activeProject,
      scripts: updatedScripts,
      updatedAt: new Date().toISOString(),
    };
    await syncCustomerProjectToFirestore(updatedProject);
    setProjects(loadCustomerProjects());
    setAssetInputByScript((prev) => ({ ...prev, [script.id]: '' }));
    setScriptToast('Brand asset link saved to script.');
    setTimeout(() => setScriptToast(''), 3000);
  };

  const handleSaveRecommendations = async (script: ProjectScriptItem) => {
    if (!activeProject) return;
    const note = (notesByScript[script.id] ?? script.clientRecommendations ?? '').trim();
    const updatedScripts = activeProject.scripts.map((s) =>
      s.id === script.id
        ? {
            ...s,
            clientRecommendations: note,
            updatedAt: new Date().toISOString(),
          }
        : s,
    );
    const updatedProject: CustomerProject = {
      ...activeProject,
      scripts: updatedScripts,
      updatedAt: new Date().toISOString(),
    };
    await syncCustomerProjectToFirestore(updatedProject);
    setProjects(loadCustomerProjects());
    setScriptToast('Your recommendations have been sent to the creative team.');
    setTimeout(() => setScriptToast(''), 3000);
  };

  const handleApproveScript = async (script: ProjectScriptItem) => {
    if (!activeProject) return;
    const note = (notesByScript[script.id] ?? script.clientRecommendations ?? '').trim();
    const updatedScripts = activeProject.scripts.map((s) =>
      s.id === script.id
        ? {
            ...s,
            status: 'approved' as const,
            clientRecommendations: note || s.clientRecommendations,
            updatedAt: new Date().toISOString(),
          }
        : s,
    );
    const updatedProject: CustomerProject = {
      ...activeProject,
      scripts: updatedScripts,
      unreadScriptAlert: updatedScripts.some((s) => s.status === 'pending_review'),
      status: 'In Production',
      updatedAt: new Date().toISOString(),
    };
    await syncCustomerProjectToFirestore(updatedProject);
    setProjects(loadCustomerProjects());
    setScriptToast(`Approved "${script.title}"! Production is now underway.`);
    setTimeout(() => setScriptToast(''), 4000);
  };

  const handleSubmitScriptRejection = async (script: ProjectScriptItem) => {
    if (!activeProject) return;
    if (rejectExplanation.trim().length < 10) {
      return;
    }
    const updatedScripts = activeProject.scripts.map((s) =>
      s.id === script.id
        ? {
            ...s,
            status: 'changes_requested' as const,
            revisionExplanation: rejectExplanation.trim(),
            updatedAt: new Date().toISOString(),
          }
        : s,
    );
    const updatedProject: CustomerProject = {
      ...activeProject,
      scripts: updatedScripts,
      unreadScriptAlert: updatedScripts.some((s) => s.status === 'pending_review'),
      updatedAt: new Date().toISOString(),
    };
    await syncCustomerProjectToFirestore(updatedProject);
    setProjects(loadCustomerProjects());
    setRejectingScriptId(null);
    setRejectExplanation('');
    setScriptToast(`Rework explanation sent for "${script.title}". Our writers will revise and update.`);
    setTimeout(() => setScriptToast(''), 4500);
  };

  /* ---------------- REQUEST NEW PROJECT HANDLER ---------------- */
  const handleRequestNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const packageConfig: Record<
      PortalPackageType,
      { name: string; totalVideos: number; price: number }
    > = {
      single: { name: 'Single AI Video Ad (1 Video)', totalVideos: 1, price: 60000 },
      pack_5: { name: 'Growth Campaign Pack (5 Videos)', totalVideos: 5, price: 220000 },
      pack_10: { name: 'Scale Campaign Pack (10 Videos)', totalVideos: 10, price: 400000 },
      retainer_15: { name: 'Monthly Content Retainer / Mini-Series (15 Videos)', totalVideos: 15, price: 250000 },
    };
    const cfg = packageConfig[reqPackageType];
    const now = new Date().toISOString();
    const newProj: CustomerProject = {
      id: `proj_${Date.now().toString(36)}`,
      ref: `AV-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      customerId: session.id,
      customerName: session.name,
      customerEmail: session.email,
      customerPhone: session.phone,
      businessName: reqBusinessName.trim() || session.business || '',
      packageType: reqPackageType,
      packageName: cfg.name,
      totalVideos: cfg.totalVideos,
      totalPrice: cfg.price,
      currency: country.currency,
      paidPercent: 0,
      amountPaid: 0,
      paymentNotes: reqBriefNotes.trim()
        ? `Client Brief: ${reqBriefNotes.trim()}`
        : 'New project requested from Client Portal. Awaiting initial deposit confirmation.',
      status: 'Awaiting Deposit',
      unreadScriptAlert: false,
      createdAt: now,
      updatedAt: now,
      scripts: [
        {
          id: `scr_${Date.now().toString(36)}_1`,
          episodeNumber: 1,
          title: 'Video 01 — Initial Script & Creative Angle',
          hook: '0–3s Hook: Drafted upon deposit confirmation.',
          scriptBody: reqBriefNotes.trim()
            ? `Client Brief Notes: "${reqBriefNotes.trim()}"\n\nOur creative director will post your full script here once your initial deposit is confirmed.`
            : 'Our creative director will post your full script here once your initial deposit is confirmed.',
          visualNotes: '9:16 Vertical & 16:9 Widescreen',
          status: 'pending_review',
          clientAssetLinks: [],
          clientRecommendations: reqBriefNotes.trim(),
          updatedAt: now,
        },
      ],
      videos: [],
    };
    await syncCustomerProjectToFirestore(newProj);
    setProjects(loadCustomerProjects());
    setSelectedProjectId(newProj.id);
    setNewProjectModal(false);
    setReqBriefNotes('');
  };

  /* ---------------- RENDER: LOGIN VIEW ---------------- */
  if (!session) {
    return (
      <div className="min-h-dvh bg-[#0b0e12] text-white flex flex-col justify-between p-4 sm:p-8">
        <OfflineBanner />
        <header className="mx-auto w-full max-w-5xl flex items-center justify-between gap-4 py-2">
          <a href="#/" className="flex items-center gap-2.5 text-white no-underline">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5a524] text-black font-bold">
              <Film className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              {content.brand.name} · Client Portal
            </span>
          </a>
          <div className="flex items-center gap-2.5">
            <PWAInstallButton variant="portal" label="Install Client App" />
            <a
              href={careWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-mono font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Customer Care</span>
            </a>
          </div>
        </header>

        <main className="mx-auto my-auto w-full max-w-md py-8">
          <div className="rounded-3xl border border-white/15 bg-[#12161d] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="space-y-1.5 text-left">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                CLIENT WORKSPACE WEBAPP
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Access Your Projects & Deliverables
              </h1>
              <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
                Track your ongoing video production, approve scripts, submit brand assets, and stream or download your Google Drive master files.
              </p>
            </div>

            {/* Login Mode Switch */}
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-black/50 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('password');
                  setAuthError('');
                }}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  loginMode === 'password' ? 'bg-[#f5a524] text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                Email / Phone + Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('otp');
                  setAuthError('');
                }}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  loginMode === 'otp' ? 'bg-[#f5a524] text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                One-Time Code (OTP)
              </button>
            </div>

            {loginMode === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4 text-left">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Registered Email or Phone Number
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@company.com or +234..."
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Password (leave blank if logging in right after booking)
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                  />
                </div>
                {authError && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    {authError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#f5a524] py-3.5 font-display text-sm font-extrabold uppercase tracking-wider text-black shadow-lg transition hover:brightness-110"
                >
                  Sign In to Client Portal
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Registered Email or Phone Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="you@company.com or +234..."
                      className="flex-1 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="shrink-0 rounded-xl border border-[#f5a524]/40 bg-[#f5a524]/15 px-3.5 py-2.5 font-mono text-xs font-bold text-[#f5a524] hover:bg-[#f5a524] hover:text-black transition"
                    >
                      Get OTP
                    </button>
                  </div>
                </div>
                {authNotice && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-mono text-emerald-300">
                    {authNotice}
                  </div>
                )}
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm font-mono tracking-widest text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                    required
                  />
                </div>
                {authError && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    {authError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#f5a524] py-3.5 font-display text-sm font-extrabold uppercase tracking-wider text-black shadow-lg transition hover:brightness-110"
                >
                  Verify & Enter Portal
                </button>
              </form>
            )}

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/10" />
              <span className="flex-shrink mx-3 font-mono text-[10px] uppercase text-white/40">OR</span>
              <div className="flex-grow border-t border-white/10" />
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                <span>Continue with Google Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const demoAcc = loadCustomerAccounts().find((a) => a.id === 'cust_circlesfundme') || loadCustomerAccounts()[0];
                  if (demoAcc) {
                    setActiveCustomerSession(demoAcc);
                    setSession(demoAcc);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#f5a524]/30 bg-[#f5a524]/10 py-2.5 font-mono text-xs font-bold text-[#f5a524] hover:bg-[#f5a524]/20 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Explore Live Demo Account (CirclesFundMe 15-Video Retainer)</span>
              </button>
            </div>
          </div>
        </main>

        <footer className="mx-auto w-full max-w-5xl text-center text-xs text-white/40 py-4">
          <a href="#/" className="text-[#f5a524] hover:underline">
            ← Return to {content.brand.name} Main Website
          </a>
        </footer>
      </div>
    );
  }

  const gate = activeProject
    ? computeDeliverableGate(activeProject)
    : {
        minStartDepositPercent: 50,
        canBeginWork: false,
        unlockedDownloadCount: 0,
        viewOnlyCount: 0,
        ruleExplanation: '',
        nextMilestoneNote: '',
      };

  return (
    <div className="min-h-dvh bg-[#0b0e12] text-white pb-20">
      <OfflineBanner />

      {/* =====================================================================
          TOP BAR CONTRACT — CLIENT PORTAL WEBAPP
      ====================================================================== */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0e12]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 flex-wrap">
          <div className="flex items-center gap-3">
            <a href="#/" className="flex items-center gap-2.5 text-white no-underline">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5a524] text-black">
                <Film className="h-4 w-4" />
              </span>
              <div>
                <span className="font-display text-base font-extrabold tracking-tight block leading-none">
                  {content.brand.name}
                </span>
                <span className="font-mono text-[10px] text-[#f5a524] uppercase tracking-wider">
                  Client Project WebApp
                </span>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <PWAInstallButton variant="portal" label="Install Client App" />

            <button
              type="button"
              onClick={() => setNewProjectModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 font-display text-xs font-bold uppercase tracking-wider text-white hover:border-[#f5a524] hover:text-[#f5a524] transition whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Request New Project</span>
            </button>

            <a
              href={careWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 font-display text-xs font-bold uppercase tracking-wider text-black shadow-sm hover:brightness-110 transition whitespace-nowrap shrink-0"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp Customer Care</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setActiveCustomerSession(null);
                setSession(null);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 space-y-6">
        {/* =====================================================================
            POST-BOOKING PASSWORD SETUP PROMPT (When passwordSet === false)
        ====================================================================== */}
        {!session.passwordSet && (
          <div className="rounded-3xl border-2 border-[#f5a524] bg-gradient-to-r from-[#f5a524]/15 via-[#141922] to-[#141922] p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5 text-left max-w-xl">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                  <KeyRound className="h-4 w-4" />
                  <span>FINAL STEP · SECURE YOUR CLIENT PORTAL ACCOUNT</span>
                </div>
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
                  Welcome, {session.name}! Set your password to access your projects anytime.
                </h2>
                <p className="text-xs sm:text-sm text-white/75">
                  Your account ({session.email || session.phone}) was automatically created from your booking. Set a password below so you can log in on any device to approve scripts and download completed Google Drive videos.
                </p>
              </div>

              <form onSubmit={handleSetCustomerPassword} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create password"
                  className="rounded-xl border border-white/20 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-[#f5a524] focus:outline-none"
                  required
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="rounded-xl border border-white/20 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-[#f5a524] focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#f5a524] px-5 py-2.5 font-display text-xs font-extrabold uppercase tracking-wider text-black hover:brightness-110 transition whitespace-nowrap"
                >
                  Save Password
                </button>
              </form>
            </div>
            {authError && <p className="mt-2 text-xs text-red-300">{authError}</p>}
          </div>
        )}

        {passwordSavedToast && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-mono font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Password saved! You can now sign in anytime with {session.email || session.phone}.</span>
          </div>
        )}

        {/* =====================================================================
            PROJECT SWITCHER & ACCOUNT SUMMARY
        ====================================================================== */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#12161d] p-5 sm:p-6">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 font-mono text-xs text-white/60">
              <span>CLIENT ACCOUNT:</span>
              <strong className="text-white">{session.name}</strong>
              <span>·</span>
              <span>{session.email || session.phone}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              {activeProject ? activeProject.packageName : 'Your Studio Projects'}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
            {customerProjects.length > 1 && (
              <select
                value={activeProject?.id || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="rounded-xl border border-white/20 bg-black/60 px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#f5a524] focus:outline-none"
              >
                {customerProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.ref} · {proj.packageName} ({proj.paidPercent}% Paid)
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => void refreshData()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-mono text-white/80 hover:text-white transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sync Status</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            UNREAD SCRIPT NOTIFICATION BANNER
        ====================================================================== */}
        {pendingScriptsCount > 0 && (
          <div className="rounded-2xl border border-[#f5a524]/50 bg-[#f5a524]/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f5a524] text-black">
                <BellRing className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm sm:text-base font-bold text-white">
                  Action Needed: You have {pendingScriptsCount} script{pendingScriptsCount > 1 ? 's' : ''} awaiting your review & approval
                </p>
                <p className="text-xs text-white/75">
                  Review your scripts, attach Google Drive brand assets or recommendations, or request a script rework with detailed feedback.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('scripts')}
              className="shrink-0 rounded-xl bg-[#f5a524] px-4 py-2.5 font-display text-xs font-extrabold uppercase tracking-wider text-black hover:brightness-110 transition"
            >
              Review Scripts Now →
            </button>
          </div>
        )}

        {activeProject ? (
          <>
            {/* =====================================================================
                PAYMENT & DELIVERABLE RELEASE GATE PROGRESS CARD
            ====================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#12161d] p-6 space-y-4 text-left">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                    PAYMENT MILESTONE & DELIVERABLE GATE
                  </span>
                  <span className="font-mono text-xs text-white/60">
                    Ref: <strong className="text-white">{activeProject.ref}</strong> · Status:{' '}
                    <strong className="text-emerald-400">{activeProject.status}</strong>
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <div className="font-display text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
                      {activeProject.paidPercent}%{' '}
                      <span className="text-base font-normal text-white/60">Confirmed by Admin</span>
                    </div>
                    <p className="text-xs text-white/60 mt-1">{gate.nextMilestoneNote}</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-white/50 block">Package Total</span>
                    <span className="text-base font-bold text-[#f5a524] tabular-nums">
                      {activeProject.currency} {activeProject.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-black/60 border border-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#f5a524] to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, activeProject.paidPercent))}%` }}
                  />
                </div>

                <p className="rounded-2xl border border-white/10 bg-black/40 p-3.5 text-xs text-white/75 leading-relaxed">
                  {gate.ruleExplanation}
                </p>
              </div>

              {/* Deliverable Unlock Counters */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5 flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-emerald-400">
                      Download Unlocked
                    </span>
                    <Unlock className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="my-2 font-display text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
                    {gate.unlockedDownloadCount}{' '}
                    <span className="text-lg font-normal text-white/50">/ {activeProject.totalVideos}</span>
                  </div>
                  <p className="text-[11px] text-white/65">
                    Master Google Drive files unlocked for full download at your current {activeProject.paidPercent}% payment tier.
                  </p>
                </div>

                <div className="rounded-3xl border border-[#f5a524]/25 bg-[#f5a524]/5 p-5 flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-[#f5a524]">
                      View-Only Mode
                    </span>
                    <Eye className="h-4 w-4 text-[#f5a524]" />
                  </div>
                  <div className="my-2 font-display text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
                    {gate.viewOnlyCount}{' '}
                    <span className="text-lg font-normal text-white/50">Videos</span>
                  </div>
                  <p className="text-[11px] text-white/65">
                    Streamable on platform as soon as completed; direct download unlocks once remaining balance is confirmed.
                  </p>
                </div>
              </div>
            </div>

            {/* =====================================================================
                NAVIGATION TABS (OVERVIEW / SCRIPTS & ASSETS / GOOGLE DRIVE VIDEOS)
            ====================================================================== */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-[#f5a524] text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Project Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('scripts')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === 'scripts'
                    ? 'bg-[#f5a524] text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Scripts, Approvals & Brand Assets ({activeProject.scripts.length})</span>
                {pendingScriptsCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-mono font-extrabold text-white">
                    {pendingScriptsCount} New
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === 'videos'
                    ? 'bg-[#f5a524] text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Play className="h-4 w-4" />
                <span>Google Drive Video Deliverables ({activeProject.videos.length}/{activeProject.totalVideos})</span>
              </button>
            </div>

            {scriptToast && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-mono font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{scriptToast}</span>
              </div>
            )}

            {/* =====================================================================
                TAB 1: OVERVIEW (QUICK ACCESS TO SCRIPTS + VIDEOS + CARE)
            ====================================================================== */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {/* Script summary card */}
                <div className="rounded-3xl border border-white/10 bg-[#12161d] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase text-[#f5a524]">
                      STEP 1 · SCRIPT APPROVAL & ASSETS
                    </span>
                    <span className="font-mono text-xs text-white/60">
                      {activeProject.scripts.filter((s) => s.status === 'approved').length} / {activeProject.scripts.length} Approved
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">
                    Approve Scripts & Provide Brand Assets
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    Once your initial deposit is confirmed, we upload your video scripts here. You can approve each script, paste Google Drive links to your product photos/logos, add creative recommendations, or reject and explain what changes you want.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('scripts')}
                    className="rounded-xl bg-white/10 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-[#f5a524] hover:text-black transition"
                  >
                    Open Script & Asset Hub →
                  </button>
                </div>

                {/* Video Screening & Google Drive Download Card */}
                <div className="rounded-3xl border border-white/10 bg-[#12161d] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase text-emerald-400">
                      STEP 2 · GOOGLE DRIVE DELIVERABLES
                    </span>
                    <span className="font-mono text-xs text-white/60">
                      {activeProject.videos.length} Uploaded
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">
                    Stream Previews & Download Unlocked Videos
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    Watch completed videos directly inside our fast-booting screening player. Videos covered by your confirmed payment tier include a direct Google Drive master download button.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('videos')}
                    className="rounded-xl bg-[#f5a524] px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 transition"
                  >
                    Open Video Screening Room →
                  </button>
                </div>
              </div>
            )}

            {/* =====================================================================
                TAB 2: SCRIPTS, APPROVALS, BRAND ASSETS & DETAILED REWORK
            ====================================================================== */}
            {activeTab === 'scripts' && (
              <div className="space-y-5 text-left">
                {activeProject.scripts.map((scr) => {
                  const isRejecting = rejectingScriptId === scr.id;
                  return (
                    <div
                      key={scr.id}
                      className="rounded-3xl border border-white/15 bg-[#12161d] p-6 space-y-5 shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div>
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-[#f5a524] font-bold">EPISODE / VIDEO 0{scr.episodeNumber}</span>
                            <span className="text-white/30">·</span>
                            <span className="text-white/60">Updated {new Date(scr.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <h3 className="font-display text-xl font-bold text-white mt-1">{scr.title}</h3>
                        </div>

                        <div>
                          {scr.status === 'approved' && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 font-mono text-xs font-bold text-emerald-300">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Approved for Production</span>
                            </span>
                          )}
                          {scr.status === 'pending_review' && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#f5a524]/40 bg-[#f5a524]/15 px-3.5 py-1.5 font-mono text-xs font-bold text-[#f5a524]">
                              <BellRing className="h-4 w-4" />
                              <span>Awaiting Your Approval</span>
                            </span>
                          )}
                          {scr.status === 'changes_requested' && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/15 px-3.5 py-1.5 font-mono text-xs font-bold text-red-300">
                              <AlertCircle className="h-4 w-4" />
                              <span>Rework Requested — Studio Revising</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Script Hook & Scene Body */}
                      <div className="space-y-3 rounded-2xl bg-black/50 p-4 sm:p-5 border border-white/10">
                        <p className="font-display text-sm sm:text-base font-bold text-[#f5a524]">
                          {scr.hook}
                        </p>
                        <p className="whitespace-pre-line text-xs sm:text-sm text-white/85 leading-relaxed">
                          {scr.scriptBody}
                        </p>
                        {scr.visualNotes && (
                          <p className="pt-2 border-t border-white/10 font-mono text-[11px] text-white/55">
                            Director Notes: {scr.visualNotes}
                          </p>
                        )}
                      </div>

                      {/* Client Asset Links & Recommendations Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Google Drive / Cloud Brand Assets */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#f5a524]">
                            <FolderPlus className="h-4 w-4" />
                            <span>PROVIDE ASSETS FOR THIS VIDEO (GOOGLE DRIVE / CLOUD LINKS)</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={assetInputByScript[scr.id] || ''}
                              onChange={(e) =>
                                setAssetInputByScript((prev) => ({ ...prev, [scr.id]: e.target.value }))
                              }
                              placeholder="Paste Google Drive folder or file link..."
                              className="flex-1 rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => void handleAddAssetLink(scr)}
                              className="shrink-0 rounded-xl bg-white/10 px-3.5 py-2 font-mono text-xs font-bold text-white hover:bg-[#f5a524] hover:text-black transition"
                            >
                              + Attach Link
                            </button>
                          </div>
                          {scr.clientAssetLinks && scr.clientAssetLinks.length > 0 && (
                            <ul className="space-y-1.5 pt-1">
                              {scr.clientAssetLinks.map((lnk, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-center justify-between gap-2 rounded-lg bg-black/40 px-3 py-1.5 text-xs font-mono text-emerald-300"
                                >
                                  <a
                                    href={lnk}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate hover:underline flex items-center gap-1.5"
                                  >
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{lnk}</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Client Recommendations / Production Notes */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5">
                          <span className="font-mono text-xs font-bold text-white/80 block">
                            YOUR CREATIVE RECOMMENDATIONS & INPUT
                          </span>
                          <textarea
                            rows={2}
                            value={notesByScript[scr.id] ?? scr.clientRecommendations ?? ''}
                            onChange={(e) =>
                              setNotesByScript((prev) => ({ ...prev, [scr.id]: e.target.value }))
                            }
                            placeholder="Add any specific product details, pronunciation notes, or visual preferences..."
                            className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-xs text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => void handleSaveRecommendations(scr)}
                              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] font-semibold text-white/80 hover:border-[#f5a524] hover:text-[#f5a524] transition"
                            >
                              Save Notes
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Show previous rejection explanation if any */}
                      {scr.revisionExplanation && (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs space-y-1">
                          <span className="font-mono font-bold uppercase text-red-300 block">
                            Your Requested Script Rework Explanation:
                          </span>
                          <p className="text-white/90 leading-relaxed">{scr.revisionExplanation}</p>
                        </div>
                      )}

                      {/* Approve or Reject / Request Rework Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => void handleApproveScript(scr)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-display text-xs font-extrabold uppercase tracking-wider text-black shadow-md hover:brightness-110 transition"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Approve Script for Production</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRejectingScriptId(isRejecting ? null : scr.id);
                              setRejectExplanation(scr.revisionExplanation || '');
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/20 transition"
                          >
                            <AlertCircle className="h-4 w-4" />
                            <span>Reject & Request Script Rework</span>
                          </button>
                        </div>
                      </div>

                      {/* Detailed Rejection / Rework Form */}
                      {isRejecting && (
                        <div className="rounded-2xl border border-red-500/40 bg-red-950/25 p-5 space-y-3">
                          <h4 className="font-display text-sm font-bold text-red-200">
                            Tell Our Creative Team Exactly What You Want Reworked
                          </h4>
                          <p className="text-xs text-white/70">
                            Please provide a detailed explanation of what you want changed in the hook, storyline, dialogue, or product positioning so we can revise and re-deliver accurately.
                          </p>
                          <textarea
                            rows={4}
                            value={rejectExplanation}
                            onChange={(e) => setRejectExplanation(e.target.value)}
                            placeholder="Explain in detail what scenes, tone, or messaging should be changed..."
                            className="w-full rounded-xl border border-red-500/30 bg-black/70 p-3.5 text-xs sm:text-sm text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                          />
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={() => setRejectingScriptId(null)}
                              className="rounded-xl border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSubmitScriptRejection(scr)}
                              disabled={rejectExplanation.trim().length < 10}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-5 py-2 font-display text-xs font-extrabold uppercase tracking-wider text-white disabled:opacity-40"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Submit Rework Request</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* =====================================================================
                TAB 3: GOOGLE DRIVE VIDEO DELIVERABLES (VIEW-ONLY VS DOWNLOAD GATE)
            ====================================================================== */}
            {activeTab === 'videos' && (
              <div className="space-y-5 text-left">
                {activeProject.videos.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-[#12161d] p-8 text-center space-y-3">
                    <Film className="h-8 w-8 text-[#f5a524] mx-auto" />
                    <h3 className="font-display text-xl font-bold text-white">
                      Your Video Deliverables Will Appear Here
                    </h3>
                    <p className="text-xs sm:text-sm text-white/65 max-w-lg mx-auto">
                      Once your script is approved and production completes, our studio hosts your master Google Drive links here for instant streaming and download based on your payment milestone.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {activeProject.videos.map((vid) => {
                      const access = getVideoDeliverableAccess(activeProject, vid);
                      const parsed = parseGoogleDriveVideoUrl(vid.driveUrl);
                      return (
                        <div
                          key={vid.id}
                          className="rounded-3xl border border-white/15 bg-[#12161d] overflow-hidden flex flex-col justify-between shadow-lg"
                        >
                          <div>
                            <div className="p-5 pb-3 flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-[#f5a524]">
                                VIDEO #{vid.index} · {vid.category}
                              </span>
                              {access.canDownload ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-300">
                                  <Unlock className="h-3 w-3" />
                                  <span>Download Unlocked</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-300">
                                  <Lock className="h-3 w-3" />
                                  <span>View-Only Mode</span>
                                </span>
                              )}
                            </div>

                            <div className="px-5 pb-4">
                              <h4 className="font-display text-base font-bold text-white leading-snug">
                                {vid.title}
                              </h4>
                              <p className="font-mono text-[11px] text-white/50 mt-1">
                                {access.accessLabel}
                              </p>
                            </div>
                          </div>

                          <div className="p-5 pt-3 border-t border-white/10 bg-black/30 space-y-2.5">
                            {access.canStream ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIframeReady(false);
                                  setScreeningVideo({
                                    video: vid,
                                    canDownload: access.canDownload,
                                    accessLabel: access.accessLabel,
                                  });
                                }}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-[#f5a524] hover:text-black transition"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                <span>Watch on Platform</span>
                              </button>
                            ) : (
                              <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-center font-mono text-[11px] text-white/50">
                                Complete {gate.minStartDepositPercent}% deposit to unlock streaming
                              </div>
                            )}

                            {access.canDownload ? (
                              <a
                                href={parsed.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 font-display text-xs font-extrabold uppercase tracking-wider text-black hover:brightness-110 transition no-underline"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download Master File</span>
                              </a>
                            ) : (
                              <div className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 font-mono text-[11px] text-white/45">
                                <Lock className="h-3 w-3 text-[#f5a524]" />
                                <span>Download Locked Until Balance Paid</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* =====================================================================
          FAST-BOOTING GOOGLE DRIVE / STUDIO SCREENING ROOM MODAL
          Enforces View-Only Mode when canDownload === false
      ====================================================================== */}
      {screeningVideo && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setScreeningVideo(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-[#12161d] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
              <div className="min-w-0 text-left">
                <p className="truncate font-display text-sm font-bold text-white">
                  {screeningVideo.video.title}
                </p>
                <p className="font-mono text-[11px] text-[#f5a524]">
                  {screeningVideo.accessLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScreeningVideo(null)}
                className="inline-flex items-center gap-1 rounded-full bg-[#f5a524] px-3.5 py-1.5 font-display text-xs font-extrabold text-black"
              >
                <X className="h-4 w-4" />
                <span>Exit Video</span>
              </button>
            </div>

            <div
              className="relative aspect-[9/16] max-h-[68dvh] mx-auto bg-black"
              onContextMenu={(e) => {
                if (!screeningVideo.canDownload) e.preventDefault();
              }}
            >
              {!iframeReady && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-black/90 text-xs font-mono text-[#f5a524]">
                  Booting High-Speed Stream…
                </div>
              )}
              {(() => {
                const parsed = parseGoogleDriveVideoUrl(screeningVideo.video.driveUrl);
                return (
                  <>
                    <iframe
                      src={parsed.embedUrl}
                      title={screeningVideo.video.title}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen={screeningVideo.canDownload}
                      onLoad={() => setIframeReady(true)}
                      className="h-full w-full border-0"
                    />
                    {/* When in View-Only Mode on a Google Drive embed, block the top-right pop-out download icon */}
                    {!screeningVideo.canDownload && (
                      <div
                        className="absolute top-0 right-0 h-14 w-28 z-20 bg-black/80 flex items-center justify-center rounded-bl-xl border-b border-l border-white/10 px-2 text-[10px] font-mono text-[#f5a524]"
                        title="View-Only Mode: Complete payment balance to unlock external link and download"
                      >
                        <Lock className="h-3 w-3 mr-1 shrink-0" />
                        <span>VIEW ONLY</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3.5 bg-black/40">
              {screeningVideo.canDownload ? (
                <a
                  href={parseGoogleDriveVideoUrl(screeningVideo.video.driveUrl).downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-display text-xs font-extrabold uppercase tracking-wider text-black no-underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Master File</span>
                </a>
              ) : (
                <span className="font-mono text-[11px] text-white/60 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-[#f5a524]" />
                  <span>Platform Preview Only · Complete payment to download</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => setScreeningVideo(null)}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 font-display text-xs font-bold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          REQUEST NEW PROJECT MODAL
      ====================================================================== */}
      {newProjectModal && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setNewProjectModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#12161d] p-6 sm:p-8 text-left space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#f5a524]">
                  START ANOTHER CAMPAIGN
                </span>
                <h3 className="font-display text-xl font-extrabold text-white">
                  Request a New Video Project
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewProjectModal(false)}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRequestNewProject} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase text-white/70 mb-1.5">
                  Select Package & Deliverable Tier
                </label>
                <select
                  value={reqPackageType}
                  onChange={(e) => setReqPackageType(e.target.value as PortalPackageType)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3 text-xs sm:text-sm font-bold text-white focus:border-[#f5a524] focus:outline-none"
                >
                  <option value="single">
                    1-Video Ad Package (100% or 60% Deposit to Start · View-Only until 100%)
                  </option>
                  <option value="pack_5">
                    5-Video Campaign Pack (50% Deposit to Start · Unlocks 2 Videos, 3 View-Only)
                  </option>
                  <option value="pack_10">
                    10-Video Scale Pack (50% Deposit to Start · Unlocks 5 Videos, 5 View-Only)
                  </option>
                  <option value="retainer_15">
                    15-Video Monthly Retainer / Mini-Series (40% Deposit to Start · Unlocks 40% / 6 Videos)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase text-white/70 mb-1.5">
                  Brand / Campaign Name
                </label>
                <input
                  type="text"
                  value={reqBusinessName}
                  onChange={(e) => setReqBusinessName(e.target.value)}
                  placeholder={session.business || 'Your Brand or Product Name'}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase text-white/70 mb-1.5">
                  Campaign Goals, Offer & Creative Direction
                </label>
                <textarea
                  rows={3}
                  value={reqBriefNotes}
                  onChange={(e) => setReqBriefNotes(e.target.value)}
                  placeholder="Describe what product or service this campaign promotes and any initial ideas..."
                  className="w-full rounded-xl border border-white/15 bg-black/60 p-3.5 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setNewProjectModal(false)}
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#f5a524] px-6 py-2.5 font-display text-xs font-extrabold uppercase tracking-wider text-black"
                >
                  Create Project in Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
