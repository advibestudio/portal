import React, { useEffect, useMemo, useState } from 'react';
import {
  FolderKanban,
  Users,
  Sparkles,
  Activity,
  LogOut,
  Lock,
  MessageCircle,
  Plus,
  CheckCircle2,
  ExternalLink,
  Share2,
  Search,
  Download,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useStore, waLink } from '@/lib/store';
import { fmtMoney } from '@/lib/money';
import { ClientProjectsAdminView } from '@/components/admin/ClientProjectsAdminView';
import { RealtimeFirestoreSummaryWidget } from '@/components/admin/RealtimeFirestoreSummaryWidget';
import { PWAInstallButton, AdminNotificationToggle, OfflineBanner } from '@/lib/pwa';
import { provisionCustomerFromBooking } from '@/lib/customerPortalStore';
import { ThemeToggleButton, AppQuickSwitcher } from '@/components/UnifiedAppNav';
import type { AffiliatePartner, Lead } from '@/content/types';

type MobileAdminTab = 'clients' | 'orders' | 'affiliates' | 'pulse';

function MobileAdminSignIn() {
  const { signIn, signInWithGoogle } = useStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const err = await signIn(identifier, password);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-dvh bg-[#090c10] text-white flex flex-col justify-between p-4">
      <OfflineBanner />
      <header className="flex items-center justify-between py-2">
        <a href="#/" className="flex items-center gap-2 text-white no-underline">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#f5a524] text-black font-extrabold font-display text-xs">
            AV
          </span>
          <span className="font-display text-base font-extrabold">AdVibe · Mobile Client Admin</span>
        </a>
        <PWAInstallButton variant="compact" label="Install Admin App" />
      </header>

      <main className="my-auto mx-auto w-full max-w-md py-4">
        <div className="rounded-3xl border border-white/15 bg-[#12161f] p-6 shadow-2xl space-y-5 text-left">
          <div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#f5a524]">
              <Smartphone className="h-3.5 w-3.5" /> CO-FOUNDER POCKET ADMIN PWA
            </span>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-white">
              Mobile Client Manager
            </h1>
            <p className="mt-1 text-xs text-white/60 leading-relaxed">
              Sign in with your Co-Founder Super Admin username & password to manage client projects, payment milestones, scripts, and incoming orders from your phone.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1">
                Co-Founder Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="enoch or esther"
                className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1">
                Super Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
                required
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#f5a524] py-3.5 font-display text-sm font-extrabold uppercase tracking-wider text-black shadow-lg hover:brightness-110 transition cursor-pointer"
            >
              {busy ? 'Signing in…' : 'Sign In to Mobile Admin'}
            </button>
          </form>

          {/* Dual Co-Founder Quick Fill */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524]">
              Dual Co-Founder Super Admin Logins:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('enoch');
                  setPassword('advibe-enoch-2026');
                }}
                className="w-full rounded-xl border border-[#f5a524]/35 bg-[#f5a524]/10 px-3 py-2 text-left hover:bg-[#f5a524]/20 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-white">
                    Co-Founder 1: Enoch Shittu-Abraham
                  </span>
                  <span className="font-mono text-[10px] text-[#f5a524]">Fill</span>
                </div>
                <p className="font-mono text-[10px] text-white/65 mt-0.5">
                  User: enoch · Pass: advibe-enoch-2026
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('esther');
                  setPassword('advibe-esther-2026');
                }}
                className="w-full rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-left hover:bg-emerald-500/20 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-white">
                    Co-Founder 2: Esther Ayankoya
                  </span>
                  <span className="font-mono text-[10px] text-emerald-300">Fill</span>
                </div>
                <p className="font-mono text-[10px] text-white/65 mt-0.5">
                  User: esther · Pass: advibe-esther-2026
                </p>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 transition cursor-pointer"
          >
            Or Continue with Google Account
          </button>
        </div>
      </main>

      <footer className="flex items-center justify-center gap-4 text-xs text-white/40 py-2">
        <a href="#/admin" className="text-[#f5a524] hover:underline">
          Open Full Desktop Admin
        </a>
        <span>·</span>
        <a href="#/apps" className="text-white/60 hover:text-white">
          Download Hub
        </a>
      </footer>
    </div>
  );
}

export default function MobileClientAdminApp() {
  const {
    session,
    initStaff,
    signOut,
    leads,
    updateLead,
    deleteLead,
    content,
    saveContent,
  } = useStore();

  const [tab, setTab] = useState<MobileAdminTab>('clients');
  const [leadFilter, setLeadFilter] = useState<'all' | 'strategy' | 'orders'>('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [toast, setToast] = useState('');

  // Quick Affiliate Add state
  const [affName, setAffName] = useState('');
  const [affEmail, setAffEmail] = useState('');
  const [affWhatsapp, setAffWhatsapp] = useState('');
  const [affCode, setAffCode] = useState('');

  useEffect(() => {
    initStaff();
  }, [initStaff]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (leadFilter === 'strategy' && l.offerId !== 'strategy' && l.source !== 'strategy') return false;
      if (leadFilter === 'orders' && (l.offerId === 'strategy' || l.source === 'strategy')) return false;
      if (!leadSearch.trim()) return true;
      const q = leadSearch.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.business.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.whatsapp.includes(q) ||
        l.ref.toLowerCase().includes(q)
      );
    });
  }, [leads, leadFilter, leadSearch]);

  if (!session) {
    return <MobileAdminSignIn />;
  }

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleConvertLeadToClientPortal = (lead: Lead) => {
    const { project } = provisionCustomerFromBooking({
      name: lead.name,
      email: lead.email,
      phone: lead.whatsapp,
      business: lead.business,
      country: lead.country,
      offerId: lead.offerId,
      offerName: lead.offerName,
      price: lead.price || 35000,
      currency: lead.currency || 'NGN',
      ref: lead.ref,
    });
    showNotice(`Created Client Portal Project (${project.ref}) for ${lead.name}! Switching to Clients tab…`);
    setTimeout(() => setTab('clients'), 900);
  };

  const handleQuickAddAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affName.trim() || !affWhatsapp.trim()) return;
    const base = (affCode.trim() || affName.trim().split(' ')[0] || 'PARTNER')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    const code = base.startsWith('ADV-') ? base : `ADV-${base}`;
    const existing = content.affiliates || [];
    if (existing.some((a) => a.code.toUpperCase() === code)) {
      showNotice(`Partner code ${code} already exists.`);
      return;
    }
    const newPartner: AffiliatePartner = {
      id: `aff-${Date.now().toString(36)}`,
      code,
      username: (affEmail.trim().split('@')[0] || base).toLowerCase(),
      password: 'advibe-partner-2026',
      name: affName.trim(),
      email: affEmail.trim().toLowerCase() || `${base.toLowerCase()}@partner.advibe.studio`,
      whatsapp: affWhatsapp.trim(),
      status: 'active',
      approved: true,
      commissionPercent: 10,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    await saveContent(
      { ...content, affiliates: [newPartner, ...existing] },
      session.name,
      `Added affiliate partner ${code}`
    );
    setAffName('');
    setAffEmail('');
    setAffWhatsapp('');
    setAffCode('');
    showNotice(`Added partner ${newPartner.name} (${code})!`);
  };

  const handleToggleAffiliateStatus = async (partner: AffiliatePartner) => {
    const nextStatus = partner.status === 'active' ? 'deactivated' : 'active';
    const nextList = (content.affiliates || []).map((a) =>
      a.id === partner.id ? { ...a, status: nextStatus, approved: nextStatus === 'active' } : a
    );
    await saveContent(
      { ...content, affiliates: nextList },
      session.name,
      `Updated affiliate ${partner.code} status to ${nextStatus}`
    );
    showNotice(`${partner.code} is now ${nextStatus}.`);
  };

  return (
    <div className="min-h-dvh bg-[#090c10] text-white pb-24">
      <OfflineBanner />

      {/* STICKY MOBILE HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090c10]/95 backdrop-blur-md px-3.5 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f5a524] text-black font-display font-extrabold text-sm">
              AV
            </span>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-sm font-extrabold text-white truncate">
                  Client Manager PWA
                </h1>
                <span className="rounded bg-[#f5a524]/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[#f5a524]">
                  {session.username || 'Co-Founder'}
                </span>
              </div>
              <p className="font-mono text-[10px] text-white/50 truncate">{session.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <AppQuickSwitcher label="Apps" compact includeAdmin />
            <ThemeToggleButton compact />
            <AdminNotificationToggle />
            <PWAInstallButton variant="compact" label="Install" />
            <button
              type="button"
              onClick={signOut}
              title="Sign Out"
              className="rounded-xl border border-white/15 bg-white/5 p-2 text-white/70 hover:text-white cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="mx-auto max-w-3xl px-3.5 pt-4 space-y-5 text-left">
        {toast && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs font-bold text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* TAB 1: CLIENT PORTAL PROJECTS (PAYMENTS, SCRIPTS, DRIVE VIDEOS) */}
        {tab === 'clients' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#f5a524]/30 bg-[#f5a524]/10 p-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524]">
                  CLIENT WORKSPACE MANAGER
                </p>
                <p className="text-xs text-white/80">
                  Approve payment %, upload scripts, and attach Google Drive deliverables.
                </p>
              </div>
              <a
                href="#/portal"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#f5a524] px-3 py-2 font-mono text-[11px] font-bold text-black"
              >
                <span>Preview Client Portal</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <ClientProjectsAdminView />
          </div>
        )}

        {/* TAB 2: INCOMING ORDERS, LEADS & STRATEGY CALL BOOKINGS */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#12161f] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524]">
                    INCOMING ORDERS & STRATEGY CALLS
                  </span>
                  <h2 className="font-display text-lg font-extrabold text-white">
                    Leads & Bookings ({filteredLeads.length})
                  </h2>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-black/50 p-1 border border-white/10">
                {(['all', 'orders', 'strategy'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setLeadFilter(f)}
                    className={`rounded-lg py-2 text-xs font-bold capitalize transition cursor-pointer ${
                      leadFilter === f ? 'bg-[#f5a524] text-black' : 'text-white/65 hover:text-white'
                    }`}
                  >
                    {f === 'all' ? `All (${leads.length})` : f === 'orders' ? 'Orders' : 'Strategy Calls'}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search client name, business, phone, or ref…"
                  className="w-full rounded-xl border border-white/15 bg-black/40 pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none"
                />
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-[#12161f]/60 p-8 text-center space-y-2">
                <p className="font-display text-sm font-bold text-white/80">
                  No incoming orders or strategy bookings yet
                </p>
                <p className="text-xs text-white/50">
                  All fake backend leads have been cleared. New visitor bookings and package orders will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-2xl border border-white/12 bg-[#12161f] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-display text-sm font-extrabold text-white">
                            {lead.name}
                          </span>
                          {lead.business && (
                            <span className="text-xs text-white/60">· {lead.business}</span>
                          )}
                          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-[#f5a524]">
                            {lead.ref}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#f5a524] mt-0.5">
                          {lead.offerName}{' '}
                          {lead.price > 0
                            ? `(${fmtMoney(lead.price, { symbol: lead.currency === 'NGN' ? '₦' : `${lead.currency} ` })})`
                            : '(Free Strategy Call)'}
                        </p>
                        <p className="font-mono text-[11px] text-white/55 mt-0.5">
                          {lead.email} · {lead.whatsapp} · {lead.date}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteLead(lead.id)}
                        className="rounded-lg p-1.5 text-white/35 hover:bg-red-500/15 hover:text-red-300"
                        title="Delete lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Quick Status & Payment Selects */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-mono text-[10px] uppercase text-white/45 mb-1">
                          Lead Status
                        </label>
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateLead(lead.id, { status: e.target.value as Lead['status'] }, session.name)
                          }
                          className="w-full rounded-xl border border-white/15 bg-black/50 px-2.5 py-2 text-xs text-white"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase text-white/45 mb-1">
                          Payment Status
                        </label>
                        <select
                          value={lead.paymentStatus}
                          onChange={(e) =>
                            updateLead(
                              lead.id,
                              { paymentStatus: e.target.value as Lead['paymentStatus'] },
                              session.name
                            )
                          }
                          className="w-full rounded-xl border border-white/15 bg-black/50 px-2.5 py-2 text-xs text-white"
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Deposit">Deposit</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href={waLink(
                          lead.whatsapp,
                          `Hi ${lead.name}! This is ${session.name} from AdVibe Studio regarding your ${lead.offerName} (${lead.ref}).`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3 py-2.5 font-mono text-xs font-bold text-emerald-300"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleConvertLeadToClientPortal(lead)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#f5a524] px-3 py-2.5 font-mono text-xs font-bold text-black cursor-pointer"
                      >
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span>Create Portal Project</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AFFILIATE PARTNERS & REFERRAL TRACKING */}
        {tab === 'affiliates' && (
          <div className="space-y-4">
            <form
              onSubmit={handleQuickAddAffiliate}
              className="rounded-2xl border border-white/12 bg-[#12161f] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524]">
                  QUICK ADD AFFILIATE PARTNER
                </span>
                <a
                  href="#/affiliate-portal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] font-bold text-emerald-400 hover:underline"
                >
                  Open Partner App →
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={affName}
                  onChange={(e) => setAffName(e.target.value)}
                  placeholder="Partner Full Name"
                  className="rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white"
                  required
                />
                <input
                  type="tel"
                  value={affWhatsapp}
                  onChange={(e) => setAffWhatsapp(e.target.value)}
                  placeholder="WhatsApp (+234...)"
                  className="rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white"
                  required
                />
                <input
                  type="email"
                  value={affEmail}
                  onChange={(e) => setAffEmail(e.target.value)}
                  placeholder="Email Address (optional)"
                  className="rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={affCode}
                  onChange={(e) => setAffCode(e.target.value)}
                  placeholder="Custom Code (e.g. ADV-TUNDE)"
                  className="rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-mono uppercase text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#f5a524] py-2.5 font-display text-xs font-extrabold uppercase tracking-wider text-black cursor-pointer"
              >
                + Generate Partner Code
              </button>
            </form>

            <div className="space-y-2.5">
              {(content.affiliates || []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#12161f]/60 p-6 text-center space-y-1.5">
                  <p className="font-display text-sm font-bold text-white/80">
                    No affiliate partners added yet
                  </p>
                  <p className="text-xs text-white/50">
                    Add your first affiliate partner above or share the Affiliate App download link (`#/download/affiliate-app`) so partners can register their code.
                  </p>
                </div>
              ) : (
                (content.affiliates || []).map((partner) => {
                  const refLeads = leads.filter(
                    (l) =>
                      (l.referralCode && l.referralCode.toUpperCase() === partner.code.toUpperCase()) ||
                      l.affiliateId === partner.id
                  );
                  return (
                    <div
                      key={partner.id}
                      className="rounded-2xl border border-white/10 bg-[#12161f] p-4 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-white truncate">
                            {partner.name}
                          </span>
                          <span className="rounded bg-[#f5a524]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#f5a524]">
                            {partner.code}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-white/55">
                          {refLeads.length} referrals · {partner.commissionPercent}% commission
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleAffiliateStatus(partner)}
                        className={`rounded-xl px-3 py-1.5 font-mono text-[10px] font-bold uppercase cursor-pointer ${
                          partner.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {partner.status}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PULSE STATS, NOTIFICATIONS & APP DOWNLOAD LINKS */}
        {tab === 'pulse' && (
          <div className="space-y-5">
            <RealtimeFirestoreSummaryWidget
              onNavigateTab={(t) => {
                if (t === 'portal') setTab('clients');
                else if (t === 'pipeline') setTab('orders');
                else if (t === 'affiliates') setTab('affiliates');
              }}
            />

            {/* Quick App Share Cards for Clients & Affiliates */}
            <div className="rounded-2xl border border-white/12 bg-[#12161f] p-4 space-y-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524]">
                SHARE OUR WEBAPPS WITH CLIENTS & AFFILIATES
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href="#/download/customer-app"
                  className="rounded-xl border border-white/10 bg-black/40 p-3.5 flex items-center justify-between hover:border-[#f5a524]/40 transition"
                >
                  <div>
                    <p className="font-display text-xs font-bold text-white">Customer Portal App Page</p>
                    <p className="font-mono text-[10px] text-white/50">#/download/customer-app</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#f5a524]" />
                </a>

                <a
                  href="#/download/affiliate-app"
                  className="rounded-xl border border-white/10 bg-black/40 p-3.5 flex items-center justify-between hover:border-emerald-400/40 transition"
                >
                  <div>
                    <p className="font-display text-xs font-bold text-white">Affiliate Partner App Page</p>
                    <p className="font-mono text-[10px] text-white/50">#/download/affiliate-app</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-400" />
                </a>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <a
                  href="#/admin"
                  className="font-mono text-xs font-bold text-[#f5a524] hover:underline flex items-center gap-1.5"
                >
                  <span>Switch to Full General Admin Dashboard</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* THUMB-FRIENDLY 4-TAB MOBILE BOTTOM BAR */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/12 bg-[#0b0e14]/95 backdrop-blur-md"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={() => setTab('clients')}
          className={`flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
            tab === 'clients' ? 'text-[#f5a524]' : 'text-white/55 hover:text-white'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          <span>Clients</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
            tab === 'orders' ? 'text-[#f5a524]' : 'text-white/55 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Orders ({leads.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('affiliates')}
          className={`flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
            tab === 'affiliates' ? 'text-[#f5a524]' : 'text-white/55 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Affiliates</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('pulse')}
          className={`flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
            tab === 'pulse' ? 'text-[#f5a524]' : 'text-white/55 hover:text-white'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Pulse & Apps</span>
        </button>
      </nav>
    </div>
  );
}
