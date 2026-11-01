import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Bell, BellRing, WifiOff, X, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

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

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

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

  const install = async () => {
    if (!globalDeferredPrompt) return false;
    await globalDeferredPrompt.prompt();
    const { outcome } = await globalDeferredPrompt.userChoice;
    if (outcome === 'accepted') {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
      return true;
    }
    return false;
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}

export function PWAInstallButton({
  variant = 'admin',
  label,
  className = '',
}: {
  variant?: 'admin' | 'portal';
  label?: string;
  className?: string;
}) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-mono font-semibold text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>{variant === 'admin' ? 'Admin App Installed' : 'Portal App Installed'}</span>
      </span>
    );
  }

  const defaultLabel =
    label || (variant === 'admin' ? 'Install Admin App' : 'Download Client WebApp');

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          (variant === 'admin'
            ? 'inline-flex items-center gap-2 rounded-xl bg-[#f5a524] px-3.5 py-2 font-display text-xs font-bold uppercase tracking-wider text-black shadow-sm transition hover:brightness-110 whitespace-nowrap shrink-0'
            : 'inline-flex items-center gap-2 rounded-xl bg-[#111412] px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-[#f5a524] border border-[#f5a524]/40 shadow-md transition hover:bg-[#f5a524] hover:text-black whitespace-nowrap shrink-0')
        }
      >
        <Download className="h-3.5 w-3.5" />
        <span>{defaultLabel}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12151b] p-6 text-left text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5a524]/15 text-[#f5a524]">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    {variant === 'admin' ? 'Install AdVibe Admin PWA' : 'Install AdVibe Client WebApp'}
                  </h3>
                  <p className="font-mono text-[11px] text-white/50">
                    Standalone App · Instant Launch & Notifications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs sm:text-sm text-white/80 leading-relaxed">
                <p className="font-semibold text-[#f5a524]">To install on iPhone or iPad (Safari):</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Tap the <strong>Share</strong> icon at the bottom of Safari.
                  </li>
                  <li>
                    Scroll down and select <strong>Add to Home Screen</strong>.
                  </li>
                  <li>
                    Tap <strong>Add</strong> in the top-right corner to launch the app directly from your home screen.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs sm:text-sm text-white/80 leading-relaxed">
                <p className="font-semibold text-[#f5a524]">To install on Chrome, Edge, or Android:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Open this link in its own browser tab (if currently inside a preview frame) or click the <strong>Install App</strong> icon in your browser address bar.
                  </li>
                  <li>
                    On Android Chrome, tap the <strong>⋮ Menu</strong> and choose <strong>Install app / Add to Home screen</strong>.
                  </li>
                </ol>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-xl bg-[#f5a524] px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-black"
              >
                Got It
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
    <div className="fixed bottom-4 left-4 z-[150] flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-mono font-bold text-black shadow-xl">
      <WifiOff className="h-4 w-4" />
      <span>Offline Mode — Using cached data</span>
    </div>
  );
}

/** Play a subtle two-tone studio notification chime using Web Audio API */
export function playAdminAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
      });
    } catch {
      // Fallback for mobile service worker notifications
      if (navigator.serviceWorker?.ready) {
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification(title, {
              body,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
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
        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-mono font-semibold text-emerald-300 hover:bg-emerald-500/20 transition whitespace-nowrap shrink-0"
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
      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono font-semibold text-white/80 hover:border-[#f5a524] hover:text-[#f5a524] transition whitespace-nowrap shrink-0"
    >
      <Bell className="h-3.5 w-3.5" />
      <span>Enable Order Alerts</span>
    </button>
  );
}
