import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  Bell,
  BellRing,
  WifiOff,
  X,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

const PWA_LAUNCH_ROUTE_KEY = 'advibe.pwa.launch_route';

export function setPreferredPWALaunchRoute(route: string, appShortTitle?: string) {
  try {
    const clean = route.startsWith('#') ? route.replace(/^#\/?/, '/') : route;
    const normalized = clean.startsWith('/') ? clean : `/${clean}`;
    localStorage.setItem(PWA_LAUNCH_ROUTE_KEY, normalized);
    if (appShortTitle && typeof document !== 'undefined') {
      const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleTitle) {
        appleTitle.setAttribute('content', appShortTitle);
      }
    }
  } catch {
    // ignore storage errors
  }
}

export function getPreferredPWALaunchRoute(): string | null {
  try {
    return localStorage.getItem(PWA_LAUNCH_ROUTE_KEY);
  } catch {
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((fn) => fn());
  });
  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((fn) => fn());
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent || '';
    const uaLower = ua.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(uaLower) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(uaLower);
    const inApp = /whatsapp|instagram|fbav|fban|tiktok|line|wv/i.test(uaLower);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsInAppBrowser(inApp);

    const sync = () => {
      setDeferredPrompt(globalDeferredPrompt);
      const standaloneNow =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standaloneNow);
    };
    promptListeners.add(sync);
    return () => {
      promptListeners.delete(sync);
    };
  }, []);

  const install = async (preferredRoute?: string, shortTitle?: string) => {
    if (preferredRoute) {
      setPreferredPWALaunchRoute(preferredRoute, shortTitle);
    }
    if (!globalDeferredPrompt) return false;
    try {
      await globalDeferredPrompt.prompt();
      const { outcome } = await globalDeferredPrompt.userChoice;
      if (outcome === 'accepted') {
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
        setIsInstalled(true);
        return true;
      }
    } catch {
      // Fallback if prompt was already used
    }
    return false;
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    install,
  };
}

export function PWAInstallButton({
  variant = 'portal',
  label,
  targetRoute,
  className = '',
}: {
  variant?: 'admin' | 'portal' | 'affiliate' | 'compact';
  label?: string;
  targetRoute?: string;
  className?: string;
}) {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInAppBrowser, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const resolvedRoute =
    targetRoute ||
    (variant === 'admin' || variant === 'compact'
      ? '#/client-admin'
      : variant === 'affiliate'
        ? '#/affiliate-portal'
        : '#/client-portal');

  const shortTitle =
    variant === 'admin' || variant === 'compact'
      ? 'AdVibe Admin'
      : variant === 'affiliate'
        ? 'AdVibe Partner'
        : 'AdVibe Client';

  const appDisplayName =
    variant === 'admin' || variant === 'compact'
      ? 'AdVibe Admin PWA'
      : variant === 'affiliate'
        ? 'AdVibe Affiliate Partner App'
        : 'AdVibe Client Portal App';

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-mono font-semibold text-emerald-400 shrink-0">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>App Installed</span>
      </span>
    );
  }

  const defaultLabel =
    label ||
    (variant === 'admin' || variant === 'compact'
      ? 'Install Admin App'
      : variant === 'affiliate'
        ? 'Install Partner App'
        : 'Install Client App');

  const getDirectAppUrl = () => {
    if (typeof window === 'undefined') return 'https://advibestudio.github.io/portal/#/client-portal';
    const base = window.location.origin + window.location.pathname;
    return `${base}${resolvedRoute}`;
  };

  const handleCopyDirectUrl = () => {
    try {
      navigator.clipboard.writeText(getDirectAppUrl());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleClick = async () => {
    setPreferredPWALaunchRoute(resolvedRoute, shortTitle);
    if (isInstallable) {
      const ok = await install(resolvedRoute, shortTitle);
      if (ok) return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          (variant === 'admin'
            ? 'inline-flex items-center gap-1.5 rounded-xl bg-[#f5a524] px-3.5 py-2 font-display text-xs font-bold uppercase tracking-wider text-black shadow-sm transition hover:brightness-110 whitespace-nowrap shrink-0 cursor-pointer'
            : variant === 'compact'
              ? 'inline-flex items-center gap-1.5 rounded-xl border border-[#f5a524]/40 bg-[#f5a524]/15 px-3 py-1.5 font-display text-xs font-bold text-[#f5a524] hover:bg-[#f5a524] hover:text-black transition whitespace-nowrap shrink-0 cursor-pointer'
              : 'inline-flex items-center gap-1.5 rounded-xl bg-[#f5a524] px-3.5 py-2 font-display text-xs font-extrabold uppercase tracking-wider text-black shadow-md transition hover:brightness-110 whitespace-nowrap shrink-0 cursor-pointer')
        }
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span>{defaultLabel}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/15 bg-[#12161f] p-5 sm:p-6 text-left text-white shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f5a524] text-black">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base sm:text-lg font-extrabold text-white truncate">
                    Install {appDisplayName}
                  </h3>
                  <p className="font-mono text-[11px] text-[#f5a524]">
                    Works on iPhone (iOS) &amp; Android Phones
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-xl p-1.5 text-white/50 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isInAppBrowser && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/15 p-3.5 space-y-2 text-xs text-amber-200">
                <p className="font-bold text-amber-300">
                  You are viewing inside an In-App Browser (WhatsApp / Instagram):
                </p>
                <p className="text-white/85 leading-relaxed">
                  To install the app to your phone’s home screen, tap the <strong>⋮</strong> or <strong>⋯</strong> menu at the top-right and select <strong>Open in Safari / Open in Chrome</strong>, or copy the direct link below:
                </p>
                <button
                  type="button"
                  onClick={handleCopyDirectUrl}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#f5a524] px-3.5 py-2 font-mono text-xs font-bold text-black cursor-pointer"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? 'Direct App Link Copied!' : 'Copy Direct App Link'}</span>
                </button>
              </div>
            )}

            {/* Apple iOS / iPadOS Instructions */}
            <div
              className={`rounded-2xl border p-4 space-y-2.5 ${
                isIOS
                  ? 'border-[#f5a524]/50 bg-[#f5a524]/10'
                  : 'border-white/10 bg-black/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-xs sm:text-sm font-bold text-[#f5a524]">
                  iPhone &amp; iPad (Apple Safari)
                </p>
                {isIOS && (
                  <span className="rounded-full bg-[#f5a524] px-2 py-0.5 font-mono text-[10px] font-bold text-black">
                    Your Device
                  </span>
                )}
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-white/85 leading-relaxed">
                <li>
                  Tap the <strong>Share</strong> button <Share2 className="inline h-3.5 w-3.5 text-[#f5a524]" /> at the bottom of Safari.
                </li>
                <li>
                  Scroll down the share sheet and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> in the top-right corner — the <strong>{shortTitle}</strong> icon will appear on your iPhone home screen!
                </li>
              </ol>
            </div>

            {/* Android / Chrome / Desktop Instructions */}
            <div
              className={`rounded-2xl border p-4 space-y-2.5 ${
                isAndroid
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-white/10 bg-black/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-xs sm:text-sm font-bold text-emerald-400">
                  Android Phones &amp; Chrome / Edge
                </p>
                {isAndroid && (
                  <span className="rounded-full bg-emerald-400 px-2 py-0.5 font-mono text-[10px] font-bold text-black">
                    Your Device
                  </span>
                )}
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-white/85 leading-relaxed">
                <li>
                  Tap the <strong>⋮ Menu</strong> (top-right of Chrome) and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </li>
                <li>
                  Confirm <strong>Install</strong> to add <strong>{shortTitle}</strong> directly to your phone app drawer.
                </li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCopyDirectUrl}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 font-mono text-xs font-bold text-white/85 hover:bg-white/10 transition cursor-pointer"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Direct App Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreferredPWALaunchRoute(resolvedRoute, shortTitle);
                  window.location.hash = resolvedRoute.replace(/^#/, '');
                  setShowGuide(false);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#f5a524] px-5 py-2.5 font-display text-xs font-extrabold uppercase tracking-wider text-black hover:brightness-110 transition cursor-pointer"
              >
                <span>Open App Workspace</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9990] flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-mono font-bold text-black shadow-xl">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Offline Mode — Showing saved workspace data</span>
    </div>
  );
}

/** Play a subtle two-tone studio notification chime using Web Audio API */
export function playAdminAlertSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.12); // A5
    osc2.frequency.setValueAtTime(293.66, now);
    osc2.frequency.setValueAtTime(440, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch {
    // AudioContext blocked until user interaction
  }
}

export async function requestAdminNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function triggerAdminBrowserNotification(title: string, body: string) {
  playAdminAlertSound();
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: './pwa-192x192.png',
        badge: './pwa-192x192.png',
      });
    } catch {
      if (navigator.serviceWorker?.ready) {
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification(title, {
              body,
              icon: './pwa-192x192.png',
              badge: './pwa-192x192.png',
            }),
          )
          .catch(() => {});
      }
    }
  }
}

export function AdminNotificationToggle() {
  const [perm, setPerm] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
  );

  const enableNotifications = async () => {
    const res = await requestAdminNotificationPermission();
    setPerm(res);
    if (res === 'granted') {
      triggerAdminBrowserNotification(
        'AdVibe Admin Alerts Enabled',
        'You will now receive instant alerts when clients place orders, book strategy calls, or review scripts.',
      );
    }
  };

  if (perm === 'granted') {
    return (
      <button
        type="button"
        onClick={() =>
          triggerAdminBrowserNotification(
            'AdVibe Order Alert Test',
            'Real-time order and script review notifications are active.',
          )
        }
        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-mono font-semibold text-emerald-300 hover:bg-emerald-500/20 transition whitespace-nowrap shrink-0 cursor-pointer"
        title="Click to test order notification alert"
      >
        <BellRing className="h-3.5 w-3.5 text-emerald-400" />
        <span>Order Alerts On</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={enableNotifications}
      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono font-semibold text-white/80 hover:border-[#f5a524] hover:text-[#f5a524] transition whitespace-nowrap shrink-0 cursor-pointer"
    >
      <Bell className="h-3.5 w-3.5" />
      <span>Enable Order Alerts</span>
    </button>
  );
}
