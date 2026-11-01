import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Film,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
  ExternalLink,
  Copy,
  Check,
  BellRing,
  Lock,
  Play,
  Gift,
  FolderKanban,
  ArrowRight,
  Apple,
  Monitor,
} from 'lucide-react';
import { usePWAInstall, OfflineBanner } from '@/lib/pwa';
import { useStore } from '@/lib/store';
import { ThemeToggleButton, AppQuickSwitcher } from '@/components/UnifiedAppNav';

export type DownloadPageMode = 'hub' | 'customer' | 'affiliate' | 'admin';

interface AppCardSpec {
  id: 'customer' | 'affiliate' | 'admin';
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  launchHref: string;
  launchLabel: string;
  downloadRoute: string;
  features: string[];
  credentialsHint?: {
    title: string;
    items: string[];
  };
}

const APP_SPECS: Record<'customer' | 'affiliate' | 'admin', AppCardSpec> = {
  customer: {
    id: 'customer',
    badge: 'FOR CLIENTS & BRANDS',
    title: 'AdVibe Client Portal WebApp',
    subtitle: 'Track video production, approve scripts, submit brand assets & download master files.',
    description:
      'Install the official AdVibe Client Workspace on your phone or laptop. Review scene-by-scene scripts, paste Google Drive brand assets, stream preview cuts, and unlock master video downloads as payment milestones complete.',
    accentColor: '#f5a524',
    launchHref: '#/client-portal',
    launchLabel: 'Launch Client Portal App',
    downloadRoute: '#/download/customer-app',
    features: [
      'Real-time project status & milestone payment progress bar',
      'Interactive Script Review room (Approve or Request Rework with notes)',
      'Google Drive & Cloud brand asset link submission per episode',
      'Instant 9:16 & 16:9 Screening Room + Master File Downloads',
      '1-Tap Direct WhatsApp Customer Care support',
    ],
    credentialsHint: {
      title: '2 Ready-to-Use Test Client Logins',
      items: [
        'Test Account 1 (15-Video Retainer + 5-Pack): testclient1 / advibe-test-1 (or test1@advibestudio.com)',
        'Test Account 2 (Single Video 60% Paid): testclient2 / advibe-test-2 (or test2@advibestudio.com)',
      ],
    },
  },
  affiliate: {
    id: 'affiliate',
    badge: 'FOR AFFILIATES & CREATORS',
    title: 'AdVibe Affiliate Partner WebApp',
    subtitle: 'Give business owners 5% off their first video package & earn 10% commission.',
    description:
      'Install the AdVibe Partner Portal on your home screen to generate your custom ADV-XXXX referral code, copy high-converting funnel links for WhatsApp & Instagram, and track every referred lead and commission payout.',
    accentColor: '#10b981',
    launchHref: '#/affiliate-portal',
    launchLabel: 'Launch Affiliate Partner App',
    downloadRoute: '#/download/affiliate-app',
    features: [
      'Instant custom Partner Referral Code generator (e.g. ADV-YOURNAME)',
      'Trackable funnel links for Main Site, AI Mini-Series & Monthly Retainer',
      'Automatic 5% first-order discount unlocked for your referred clients',
      'Live attribution ledger showing referred leads, deposits & 10% commissions',
      '1-Tap WhatsApp pitch templates ready to share with business owners',
    ],
    credentialsHint: {
      title: 'Test Affiliate Sandbox Login',
      items: [
        'Partner Code: ADV-PARTNER1 · Username: testaffiliate · Password: advibe-partner-1',
      ],
    },
  },
  admin: {
    id: 'admin',
    badge: 'FOR CO-FOUNDERS & TEAM',
    title: 'AdVibe Mobile Client Manager PWA',
    subtitle: 'Pocket command center for managing client projects, orders, scripts & payments on mobile.',
    description:
      'Built specifically for smartphone screens so Co-Founders can approve client payment milestones, post scripts, attach Google Drive deliverables, convert strategy calls into projects, and receive instant order notifications on the go.',
    accentColor: '#38bdf8',
    launchHref: '#/client-admin',
    launchLabel: 'Launch Mobile Client Admin',
    downloadRoute: '#/download/admin-app',
    features: [
      'Thumb-friendly 5-tab mobile navigation bar with zero horizontal clutter',
      'One-tap payment % milestone pills (0%, 40%, 50%, 60%, 100%) & download unlock',
      'Mobile script publisher + client revision alert badges',
      'Incoming orders & strategy call leads with 1-tap WhatsApp follow-up',
      'Device push notification toggle for new client orders & bookings',
    ],
    credentialsHint: {
      title: 'Dual Co-Founder Super Admin Logins',
      items: [
        'Co-Founder 1 (Enoch): Username "enoch" (or shittu.cfm@gmail.com) · Pass: advibe-enoch-2026',
        'Co-Founder 2 (Esther): Username "esther" (or esther@advibestudio.com) · Pass: advibe-esther-2026',
      ],
    },
  },
};

export default function AppDownloadHubPage({ mode = 'hub' }: { mode?: DownloadPageMode }) {
  const { content } = useStore();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeMode, setActiveMode] = useState<DownloadPageMode>(mode);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installNotice, setInstallNotice] = useState('');

  React.useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  const handleInstallAction = async (targetHref: string, appTitle: string) => {
    setInstallNotice('');
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallNotice(`${appTitle} is installing to your device! Launching workspace…`);
        setTimeout(() => {
          window.location.hash = targetHref.replace(/^#/, '');
        }, 900);
        return;
      }
    }
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (isInstalled) {
      window.location.hash = targetHref.replace(/^#/, '');
      return;
    }
    // Fallback for desktop/mobile browsers where beforeinstallprompt hasn't fired yet
    setShowIOSModal(true);
  };

  const handleCopyShareLink = (route: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://advibe.studio/';
    const full = `${base}${route}`;
    navigator.clipboard.writeText(full);
    setCopiedUrl(route);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const focusedSpec = activeMode !== 'hub' ? APP_SPECS[activeMode] : null;

  return (
    <div className="min-h-dvh bg-[#0a0d12] text-white flex flex-col justify-between pb-16">
      <OfflineBanner />

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0d12]/95 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <a href="#/" className="flex items-center gap-2.5 text-white no-underline">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5a524] text-black font-extrabold font-display">
              AV
            </span>
            <div className="text-left">
              <span className="font-display text-base sm:text-lg font-extrabold tracking-tight block leading-none">
                {content.brand.name}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#f5a524]">
                WebApp Download Center
              </span>
            </div>
          </a>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <AppQuickSwitcher label="Navigate" />
            <ThemeToggleButton compact />
            <a
              href="#/apps"
              onClick={() => setActiveMode('hub')}
              className={`rounded-xl px-3 py-2 text-xs font-mono font-bold transition ${
                activeMode === 'hub'
                  ? 'bg-[#f5a524] text-black'
                  : 'border border-white/15 bg-white/5 text-white/75 hover:text-white'
              }`}
            >
              All Apps
            </a>
            <a
              href="#/download/customer-app"
              onClick={() => setActiveMode('customer')}
              className={`rounded-xl px-3 py-2 text-xs font-mono font-bold transition ${
                activeMode === 'customer'
                  ? 'bg-[#f5a524] text-black'
                  : 'border border-white/15 bg-white/5 text-white/75 hover:text-white'
              }`}
            >
              Customer App
            </a>
            <a
              href="#/download/affiliate-app"
              onClick={() => setActiveMode('affiliate')}
              className={`rounded-xl px-3 py-2 text-xs font-mono font-bold transition ${
                activeMode === 'affiliate'
                  ? 'bg-emerald-400 text-black'
                  : 'border border-white/15 bg-white/5 text-white/75 hover:text-white'
              }`}
            >
              Affiliate App
            </a>
            {activeMode === 'admin' && (
              <a
                href="#/download/admin-app"
                onClick={() => setActiveMode('admin')}
                className="rounded-xl px-3 py-2 text-xs font-mono font-bold transition bg-sky-400 text-black"
              >
                Mobile Admin (Internal)
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-8 space-y-10 text-left">
        {installNotice && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-sm font-bold text-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{installNotice}</span>
          </div>
        )}

        {/* FOCUSED SINGLE-APP DOWNLOAD LANDING PAGE */}
        {focusedSpec ? (
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-[#131822] via-[#10141d] to-[#0b0e14] p-6 sm:p-10 shadow-2xl">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#f5a524]/30 bg-[#f5a524]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>{focusedSpec.badge} · INSTALLABLE PWA</span>
                  </div>

                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
                    {focusedSpec.title}
                  </h1>

                  <p className="text-base sm:text-lg text-white/85 font-medium leading-relaxed">
                    {focusedSpec.subtitle}
                  </p>

                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                    {focusedSpec.description}
                  </p>

                  {/* Primary Download / Launch CTAs */}
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleInstallAction(focusedSpec.launchHref, focusedSpec.title)}
                      className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#f5a524] px-6 py-4 font-display text-sm font-extrabold uppercase tracking-wider text-black shadow-xl hover:brightness-110 active:scale-[0.99] transition cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>
                        {isInstalled
                          ? `App Installed — Open ${focusedSpec.title}`
                          : `Download & Install on Phone / Laptop`}
                      </span>
                    </button>

                    <a
                      href={focusedSpec.launchHref}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 font-display text-sm font-bold text-white hover:bg-white/15 transition"
                    >
                      <span>{focusedSpec.launchLabel}</span>
                      <ArrowRight className="h-4 w-4 text-[#f5a524]" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyShareLink(focusedSpec.downloadRoute)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/40 px-4 py-3.5 font-mono text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      {copiedUrl === focusedSpec.downloadRoute ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-300">Download Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4 text-[#f5a524]" />
                          <span>Copy Shareable Download Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Platform Compatibility Badges */}
                  <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-white/50 font-mono">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Android Chrome 1-Tap Install
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> iPhone / iPad Home Screen
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Windows & Mac Desktop App
                    </span>
                  </div>
                </div>

                {/* Right Column: Features & Test Credentials Card */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-2xl border border-white/12 bg-black/50 p-5 sm:p-6 space-y-4">
                    <h3 className="font-display text-base font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#f5a524]" />
                      <span>What Is Inside This WebApp</span>
                    </h3>
                    <ul className="space-y-2.5">
                      {focusedSpec.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-white/80">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {focusedSpec.credentialsHint && (
                      <div className="mt-4 rounded-xl border border-[#f5a524]/30 bg-[#f5a524]/10 p-4 space-y-2">
                        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#f5a524]">
                          {focusedSpec.credentialsHint.title}
                        </p>
                        <div className="space-y-1.5">
                          {focusedSpec.credentialsHint.items.map((item, i) => (
                            <p key={i} className="font-mono text-[11px] text-white/85 leading-relaxed">
                              • {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* UNIFIED DOWNLOAD HUB (#/apps) */
          <div className="space-y-8">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#f5a524]/30 bg-[#f5a524]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                <Smartphone className="h-3.5 w-3.5" /> OFFICIAL ADVIBE PROGRESSIVE WEB APPS
              </span>
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Download & Install Our WebApps
              </h1>
              <p className="text-sm sm:text-base text-white/65 leading-relaxed">
                Install the dedicated AdVibe Client Portal or Affiliate Partner WebApp directly onto your phone or computer home screen—no app store wait times, instant offline-ready speed, and real-time updates.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {(['customer', 'affiliate'] as const).map((key) => {
                const spec = APP_SPECS[key];
                return (
                  <div
                    key={spec.id}
                    className="rounded-3xl border border-white/12 bg-[#12161f] p-6 flex flex-col justify-between gap-6 shadow-xl"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524]">
                          {spec.badge}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyShareLink(spec.downloadRoute)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[10px] text-white/70 hover:text-white cursor-pointer"
                        >
                          {copiedUrl === spec.downloadRoute ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedUrl === spec.downloadRoute ? 'Copied' : 'Share Link'}</span>
                        </button>
                      </div>

                      <div>
                        <h2 className="font-display text-xl font-extrabold text-white">{spec.title}</h2>
                        <p className="mt-1.5 text-xs text-white/65 leading-relaxed">{spec.subtitle}</p>
                      </div>

                      <ul className="space-y-2 border-t border-white/10 pt-4">
                        {spec.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/75">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {spec.credentialsHint && (
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1">
                          <p className="font-mono text-[10px] font-bold uppercase text-[#f5a524]">
                            {spec.credentialsHint.title}
                          </p>
                          {spec.credentialsHint.items.map((it, idx) => (
                            <p key={idx} className="font-mono text-[10px] text-white/70 leading-relaxed">
                              {it}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleInstallAction(spec.launchHref, spec.title)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5a524] px-4 py-3 font-display text-xs font-extrabold uppercase tracking-wider text-black hover:brightness-110 transition cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        <span>Install & Launch App</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={spec.downloadRoute}
                          onClick={() => setActiveMode(spec.id)}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 font-mono text-[11px] font-bold text-white/80 hover:bg-white/10 transition"
                        >
                          <span>Download Page</span>
                        </a>
                        <a
                          href={spec.launchHref}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 font-mono text-[11px] font-bold text-[#f5a524] hover:bg-white/10 transition"
                        >
                          <span>Open WebApp →</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HOW TO INSTALL ON ANDROID, IPHONE & DESKTOP */}
        <div className="rounded-3xl border border-white/10 bg-[#12161f] p-6 sm:p-8 space-y-6">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
              30-SECOND INSTALLATION GUIDE
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white mt-1">
              How to Add the App to Your Home Screen
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
                <Smartphone className="h-4 w-4" /> 1. Android (Chrome / Edge)
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Tap the <strong>"Download & Install"</strong> button above, then tap <strong>Install</strong> on the prompt. Or tap the Chrome <strong>⋮ menu</strong> in the top-right corner and select <strong>"Install app"</strong>.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-bold uppercase">
                <Apple className="h-4 w-4" /> 2. iPhone & iPad (Safari)
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Open this page in <strong>Safari</strong>, tap the <strong>Share</strong> button at the bottom of your screen, scroll down and tap <strong>"Add to Home Screen"</strong>, then tap <strong>Add</strong>.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
                <Monitor className="h-4 w-4" /> 3. Windows & Mac Laptop
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Click the <strong>"Download & Install"</strong> button above, or click the <strong>Install icon</strong> on the right side of your Chrome/Edge address bar to pin the app to your dock or taskbar.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* IOS / MANUAL INSTALL GUIDE MODAL */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/15 bg-[#141821] p-6 text-left text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                INSTALL WEBAPP TO HOME SCREEN
              </span>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <h3 className="font-display text-xl font-extrabold">
              Install {focusedSpec ? focusedSpec.title : 'AdVibe WebApp'}
            </h3>
            <ol className="space-y-3 text-xs sm:text-sm text-white/80 list-decimal list-inside">
              <li>
                <strong>On iPhone / iPad (Safari):</strong> Tap the <strong>Share</strong> icon in the browser bar and tap <strong>"Add to Home Screen"</strong>.
              </li>
              <li>
                <strong>On Android (Chrome):</strong> Tap the <strong>⋮ three-dots menu</strong> at the top-right and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
              </li>
              <li>
                <strong>On Laptop (Chrome / Edge):</strong> Click the <strong>Install App</strong> icon inside the right side of your address bar.
              </li>
            </ol>
            <div className="flex gap-2.5 pt-2">
              {focusedSpec && (
                <a
                  href={focusedSpec.launchHref}
                  onClick={() => setShowIOSModal(false)}
                  className="flex-1 rounded-xl bg-[#f5a524] py-3 text-center font-display text-xs font-extrabold uppercase tracking-wider text-black"
                >
                  Open App Now →
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-mono text-xs text-white/80 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
