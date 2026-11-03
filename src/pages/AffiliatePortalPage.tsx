import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  Users,
  Wallet,
  ExternalLink,
  LogOut,
  Share2,
  Gift,
  MessageCircle,
  Download,
  ShieldCheck,
  UserPlus,
  KeyRound,
  ArrowUpRight,
} from 'lucide-react';
import { useStore, waLink } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { fmtMoney, waNumberFor } from '@/lib/money';
import type { AffiliatePartner } from '@/content/types';
import { PWAInstallButton, OfflineBanner } from '@/lib/pwa';
import { ThemeToggleButton, AppQuickSwitcher } from '@/components/UnifiedAppNav';

const AFFILIATE_SESSION_KEY = 'advibe.affiliate.session.v1';

const TEST_AFFILIATE_ACCOUNT: AffiliatePartner = {
  id: 'aff_test_demo',
  code: 'ADV-PARTNER1',
  username: 'testaffiliate',
  password: 'advibe-partner-1',
  name: 'Test Affiliate Partner (Sandbox)',
  email: 'partner@advibestudio.com',
  whatsapp: '+2348000000099',
  status: 'active',
  approved: true,
  commissionPercent: 10,
  createdAt: '2026-10-01',
  clicks: 24,
};

function loadAffiliateSession(): AffiliatePartner | null {
  try {
    const raw = localStorage.getItem(AFFILIATE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AffiliatePartner) : null;
  } catch {
    return null;
  }
}

function saveAffiliateSession(partner: AffiliatePartner | null) {
  try {
    if (!partner) localStorage.removeItem(AFFILIATE_SESSION_KEY);
    else localStorage.setItem(AFFILIATE_SESSION_KEY, JSON.stringify(partner));
  } catch {
    // ignore
  }
}

export default function AffiliatePortalPage() {
  const { content, saveContent, leads } = useStore();
  const { country } = useCountry();
  const affiliates = content.affiliates || [];

  const [session, setSession] = useState<AffiliatePartner | null>(() => loadAffiliateSession());
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regCode, setRegCode] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Copy states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activePartner = useMemo(() => {
    if (!session) return null;
    if (session.id === TEST_AFFILIATE_ACCOUNT.id) return TEST_AFFILIATE_ACCOUNT;
    const found = affiliates.find(
      (a) => a.id === session.id || a.code.toUpperCase() === session.code.toUpperCase()
    );
    return found || session;
  }, [session, affiliates]);

  const originUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://advibe.studio/';

  const referralLinks = useMemo(() => {
    const code = activePartner?.code || 'ADV-PARTNER';
    return [
      {
        id: 'main',
        label: 'Main Agency Website (5% Off Auto-Applied)',
        url: `${originUrl}?ref=${encodeURIComponent(code)}#/`,
        desc: 'Best for general business owners looking for Single Video Ads, 5-Video Packs, or Strategy Sessions.',
      },
      {
        id: 'miniseries',
        label: 'AI Promotional Mini-Series Funnel',
        url: `${originUrl}?ref=${encodeURIComponent(code)}#/promotional-mini-series`,
        desc: 'High-ticket episodic storytelling funnel (₦300,000 package · 10% partner commission).',
      },
      {
        id: 'retainer',
        label: 'Monthly Content Retainer Funnel (15 Videos)',
        url: `${originUrl}?ref=${encodeURIComponent(code)}#/monthly-content`,
        desc: 'Recurring monthly 15-video retainer funnel (₦250,000/mo package).',
      },
    ];
  }, [activePartner?.code, originUrl]);

  const partnerLeads = useMemo(() => {
    if (!activePartner) return [];
    const code = activePartner.code.toUpperCase();
    return leads.filter(
      (l) =>
        (l.referralCode && l.referralCode.toUpperCase() === code) ||
        (l.manualReferralCode && l.manualReferralCode.toUpperCase() === code) ||
        l.affiliateId === activePartner.id
    );
  }, [leads, activePartner]);

  const metrics = useMemo(() => {
    const commPct = activePartner?.commissionPercent || 10;
    const totalReferrals = partnerLeads.length;
    const paidLeads = partnerLeads.filter((l) => l.paymentStatus === 'Paid' || l.status === 'Won');
    const depositLeads = partnerLeads.filter((l) => l.paymentStatus === 'Deposit');
    const totalRevenue = paidLeads.reduce((sum, l) => sum + (Number(l.price) || 0), 0);
    const earnedCommission = Math.round((totalRevenue * commPct) / 100);
    const pendingRevenue = depositLeads.reduce((sum, l) => sum + (Number(l.price) || 0), 0);
    const pendingCommission = Math.round((pendingRevenue * commPct) / 100);
    return {
      commPct,
      totalReferrals,
      paidCount: paidLeads.length,
      totalRevenue,
      earnedCommission,
      pendingCommission,
    };
  }, [partnerLeads, activePartner]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const clean = identifier.trim().toLowerCase();
    const cleanCode = identifier.trim().toUpperCase();
    const pass = password.trim();

    if (
      clean === 'testaffiliate' ||
      clean === TEST_AFFILIATE_ACCOUNT.email.toLowerCase() ||
      cleanCode === TEST_AFFILIATE_ACCOUNT.code
    ) {
      if (!pass || pass === TEST_AFFILIATE_ACCOUNT.password) {
        saveAffiliateSession(TEST_AFFILIATE_ACCOUNT);
        setSession(TEST_AFFILIATE_ACCOUNT);
        return;
      }
    }

    const found = affiliates.find(
      (a) =>
        a.code.toUpperCase() === cleanCode ||
        a.email.toLowerCase() === clean ||
        (a.username && a.username.toLowerCase() === clean) ||
        (a.whatsapp && a.whatsapp.replace(/\D/g, '').endsWith(clean.replace(/\D/g, '').slice(-8)))
    );

    if (!found) {
      setAuthError('No affiliate account found with that partner code, username, or email. Register as a new partner or use the Test Partner login below.');
      return;
    }

    if (found.password && pass && found.password !== pass) {
      setAuthError('Incorrect password for this affiliate partner account.');
      return;
    }

    saveAffiliateSession(found);
    setSession(found);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!regName.trim() || !regEmail.trim() || !regWhatsapp.trim()) {
      setAuthError('Please fill in your name, email address, and WhatsApp number.');
      return;
    }

    const baseCode = (regCode.trim() || regName.trim().split(' ')[0] || 'PARTNER')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    const finalCode = baseCode.startsWith('ADV-') ? baseCode : `ADV-${baseCode}`;

    if (affiliates.some((a) => a.code.toUpperCase() === finalCode)) {
      setAuthError(`Partner code ${finalCode} is already taken. Please choose another code.`);
      return;
    }

    setBusy(true);
    const newPartner: AffiliatePartner = {
      id: `aff-${Date.now().toString(36)}`,
      code: finalCode,
      username: regEmail.trim().split('@')[0].toLowerCase(),
      password: regPassword.trim() || 'advibe-partner-2026',
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      whatsapp: regWhatsapp.trim(),
      status: 'active',
      approved: true,
      commissionPercent: 10,
      createdAt: new Date().toISOString().slice(0, 10),
      totalReferrals: 0,
      clicks: 0,
    };

    const nextAffiliates = [newPartner, ...affiliates];
    await saveContent(
      {
        ...content,
        affiliates: nextAffiliates,
      },
      newPartner.name,
      `Registered new affiliate partner ${newPartner.code}`
    );
    setBusy(false);
    saveAffiliateSession(newPartner);
    setSession(newPartner);
  };

  const supportWaUrl = useMemo(() => {
    const waNum = waNumberFor(content.settings.whatsappNumber, country);
    return waLink(
      waNum,
      `Hi ${content.settings.whatsappDisplay}! I am an Affiliate Partner (${activePartner?.code || 'New Partner'}) and I have a question about my referral commissions.`
    );
  }, [content.settings.whatsappNumber, content.settings.whatsappDisplay, country, activePartner]);

  if (!activePartner) {
    return (
      <div className="min-h-dvh bg-[#0b0d11] text-white flex flex-col justify-between p-4 sm:p-8">
        <OfflineBanner />
        <header className="mx-auto w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 py-2">
          <a href="#/" className="flex items-center gap-2.5 text-white no-underline">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5a524] text-black font-bold">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              {content.brand.name} · Affiliate Partner App
            </span>
          </a>
          <div className="flex flex-wrap items-center gap-2">
            <AppQuickSwitcher label="Navigate" />
            <ThemeToggleButton compact />
            <PWAInstallButton variant="portal" label="Install Partner App" />
            <a
              href="#/download/affiliate-app"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono font-bold text-white/80 hover:bg-white/10 transition"
            >
              <Download className="h-3.5 w-3.5 text-[#f5a524]" />
              <span>Download Guide</span>
            </a>
          </div>
        </header>

        <main className="mx-auto my-auto w-full max-w-md py-6">
          <div className="rounded-3xl border border-white/15 bg-[#12161f] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="space-y-1.5 text-left">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f5a524]">
                AFFILIATE & PARTNER WEBAPP
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Share 5% Off. Earn 10% Commission.
              </h1>
              <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
                Every business owner who uses your partner link or code gets 5% off their first AI video campaign, and you earn 10% commission on every closed deal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-black/50 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setAuthError('');
                }}
                className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                  authTab === 'login' ? 'bg-[#f5a524] text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                Partner Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setAuthError('');
                }}
                className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                  authTab === 'register' ? 'bg-[#f5a524] text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                Create Partner Code
              </button>
            </div>

            {authTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Partner Code, Username, or Email
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. ADV-PARTNER1 or partner@email.com"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Password (optional if using partner code)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  className="w-full rounded-xl bg-[#f5a524] py-3.5 font-display text-sm font-extrabold uppercase tracking-wider text-black shadow-lg transition hover:brightness-110 cursor-pointer"
                >
                  Open My Affiliate Dashboard
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5 text-left">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Daniel Okafor"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={regWhatsapp}
                      onChange={(e) => setRegWhatsapp(e.target.value)}
                      placeholder="+23480..."
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1">
                      Preferred Code Word
                    </label>
                    <input
                      type="text"
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value)}
                      placeholder="e.g. DANIEL"
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm font-mono uppercase text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1">
                    Create Password
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
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
                  disabled={busy}
                  className="w-full rounded-xl bg-[#f5a524] py-3.5 font-display text-sm font-extrabold uppercase tracking-wider text-black shadow-lg transition hover:brightness-110 cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Creating Partner Account…' : 'Generate My Partner Code & Enter'}
                </button>
              </form>
            )}

            {/* Quick Test Partner Login */}
            <div className="rounded-2xl border border-[#f5a524]/30 bg-[#f5a524]/5 p-4 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#f5a524]">
                  Test Affiliate Login (Sandbox)
                </span>
                <span className="rounded bg-[#f5a524]/20 px-2 py-0.5 font-mono text-[10px] text-[#f5a524]">
                  Code: ADV-PARTNER1
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  saveAffiliateSession(TEST_AFFILIATE_ACCOUNT);
                  setSession(TEST_AFFILIATE_ACCOUNT);
                }}
                className="w-full rounded-xl border border-[#f5a524]/40 bg-[#f5a524]/15 px-3.5 py-2.5 text-left hover:bg-[#f5a524]/25 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-white">
                    1-Tap Test Affiliate Portal
                  </span>
                  <span className="font-mono text-[10px] text-[#f5a524] font-bold">Open →</span>
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-white/60">
                  User: testaffiliate · Pass: advibe-partner-1
                </p>
              </button>
            </div>
          </div>
        </main>

        <footer className="mx-auto w-full max-w-5xl flex flex-wrap items-center justify-center gap-4 text-center text-xs text-white/40 py-4">
          <a href="#/" className="text-[#f5a524] hover:underline">
            ← Back to {content.brand.name}
          </a>
          <span>·</span>
          <a href="#/apps" className="text-white/70 hover:text-white hover:underline">
            All WebApps & Download Hub
          </a>
        </footer>
      </div>
    );
  }

  const shareText = `Hey! Need scroll-stopping AI video ads for your business without renting a studio? Use my AdVibe Studio partner link (${referralLinks[0].url}) or enter code ${activePartner.code} at checkout to claim 5% OFF your first video package!`;

  return (
    <div className="min-h-dvh bg-[#0b0d11] text-white pb-28 overflow-x-hidden">
      <OfflineBanner />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0d11]/95 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f5a524] text-black font-bold">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-base sm:text-lg font-extrabold text-white truncate">
                  {activePartner.name}
                </h1>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-300">
                  {activePartner.code}
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono truncate">
                {activePartner.commissionPercent}% Partner Commission · Gives Clients 5% Off
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AppQuickSwitcher label="Navigate" />
            <ThemeToggleButton compact />
            <PWAInstallButton variant="portal" label="Install App" />
            <a
              href={supportWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-mono font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Partner Support</span>
            </a>
            <button
              type="button"
              onClick={() => {
                saveAffiliateSession(null);
                setSession(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-8 space-y-6 text-left">
        {/* KPI SUMMARY CARDS */}
        <div id="affiliate-overview" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-white/10 bg-[#12161f] p-4 sm:p-5">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono uppercase">
              <span>Partner Code</span>
              <Gift className="h-4 w-4 text-[#f5a524]" />
            </div>
            <p className="mt-2 font-mono text-xl sm:text-2xl font-extrabold text-[#f5a524]">
              {activePartner.code}
            </p>
            <p className="mt-1 text-[11px] text-white/50">Unlocks 5% client discount</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12161f] p-4 sm:p-5">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono uppercase">
              <span>Referred Leads</span>
              <Users className="h-4 w-4 text-sky-400" />
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-white">
              {metrics.totalReferrals}
            </p>
            <p className="mt-1 text-[11px] text-white/50">{metrics.paidCount} closed / paid orders</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12161f] p-4 sm:p-5">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono uppercase">
              <span>Earned Commission</span>
              <Wallet className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {fmtMoney(metrics.earnedCommission, { symbol: '₦' })}
            </p>
            <p className="mt-1 text-[11px] text-white/50">
              {metrics.commPct}% of {fmtMoney(metrics.totalRevenue, { symbol: '₦' })} paid sales
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12161f] p-4 sm:p-5">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono uppercase">
              <span>Pending Pipeline</span>
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-amber-300">
              {fmtMoney(metrics.pendingCommission, { symbol: '₦' })}
            </p>
            <p className="mt-1 text-[11px] text-white/50">From deposit-stage referrals</p>
          </div>
        </div>

        {/* REFERRAL LINKS & ONE-TAP WHATSAPP SHARE */}
        <div id="affiliate-links" className="rounded-3xl border border-white/12 bg-[#12161f] p-5 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                YOUR TRACKABLE FUNNEL LINKS
              </span>
              <h2 className="font-display text-xl font-extrabold text-white mt-0.5">
                Share Your Referral Links
              </h2>
            </div>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#f5a524] px-4 py-2.5 font-display text-xs font-extrabold uppercase tracking-wider text-black hover:brightness-110 transition"
            >
              <Share2 className="h-4 w-4" />
              <span>Share Pitch on WhatsApp</span>
            </a>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {referralLinks.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-display text-sm font-bold text-white">{item.label}</p>
                  <p className="text-xs text-white/55">{item.desc}</p>
                  <p className="font-mono text-xs text-[#f5a524] truncate">{item.url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(item.id, item.url)}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#f5a524]/40 bg-[#f5a524]/15 px-4 py-2.5 font-mono text-xs font-bold text-[#f5a524] hover:bg-[#f5a524] hover:text-black transition cursor-pointer"
                >
                  {copiedKey === item.id ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* REFERRED LEADS & ORDERS TABLE */}
        <div id="affiliate-ledger" className="rounded-3xl border border-white/12 bg-[#12161f] p-5 sm:p-7 space-y-4">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
              LIVE ATTRIBUTION LEDGER
            </span>
            <h2 className="font-display text-xl font-extrabold text-white mt-0.5">
              Your Referred Clients & Bookings ({partnerLeads.length})
            </h2>
          </div>

          {partnerLeads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-8 text-center space-y-2">
              <p className="font-display text-base font-bold text-white/80">
                No referrals recorded for {activePartner.code} yet
              </p>
              <p className="text-xs text-white/50 max-w-md mx-auto">
                Share any of your referral links above or tell clients to enter code{' '}
                <strong className="text-[#f5a524] font-mono">{activePartner.code}</strong> at checkout to unlock their 5% discount. Every lead or order appears here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {partnerLeads.map((lead) => {
                const comm = Math.round(((Number(lead.price) || 0) * metrics.commPct) / 100);
                return (
                  <div
                    key={lead.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-bold text-white">
                          {lead.business || lead.name}
                        </span>
                        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/70">
                          {lead.ref}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                            lead.paymentStatus === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : lead.paymentStatus === 'Deposit'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {lead.paymentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-white/60">
                        Package: <strong className="text-white/85">{lead.offerName}</strong> · Date: {lead.date}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-mono text-xs text-white/50">Est. Commission ({metrics.commPct}%)</p>
                      <p className="font-display text-base font-extrabold text-emerald-400">
                        {fmtMoney(comm, { symbol: '₦' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Affiliate Mobile Navigation"
        className="bottom-navigation-bar fixed inset-x-0 bottom-0 z-[9999] border-t border-white/10 bg-[#0b0d11]/95 backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => document.getElementById('affiliate-overview')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 font-mono text-[10px] font-bold text-white/80 hover:text-[#f5a524] cursor-pointer"
          >
            <Wallet className="h-4 w-4 text-[#f5a524]" />
            <span>Earnings</span>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('affiliate-links')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 font-mono text-[10px] font-bold text-white/80 hover:text-[#f5a524] cursor-pointer"
          >
            <Share2 className="h-4 w-4 text-emerald-400" />
            <span>Share Links</span>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('affiliate-ledger')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 font-mono text-[10px] font-bold text-white/80 hover:text-[#f5a524] cursor-pointer"
          >
            <Users className="h-4 w-4 text-sky-400" />
            <span>Referrals ({partnerLeads.length})</span>
          </button>
          <a
            href={supportWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 font-mono text-[10px] font-bold text-emerald-400 no-underline"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Support</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
