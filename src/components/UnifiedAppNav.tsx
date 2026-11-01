import React, { useEffect, useRef, useState } from 'react';
import {
  Sun,
  Moon,
  LayoutGrid,
  Home,
  Film,
  Clapperboard,
  FolderKanban,
  Sparkles,
  Download,
  GraduationCap,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function ThemeToggleButton({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to White (Light) Mode' : 'Switch to Black (Dark) Mode'}
      aria-label={isDark ? 'Switch to White Mode' : 'Switch to Dark Mode'}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-mono font-bold transition cursor-pointer select-none shrink-0 ${
        isDark
          ? 'border-white/20 bg-white/10 text-[#f5a524] hover:bg-white/15'
          : 'border-[#111412]/15 bg-[#111412]/5 text-[#111412] hover:bg-[#111412]/10'
      } ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="h-3.5 w-3.5 text-[#f5a524] shrink-0" />
          {!compact && <span className="hidden sm:inline">White Mode</span>}
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-[#111412] shrink-0" />
          {!compact && <span className="hidden sm:inline">Dark Mode</span>}
        </>
      )}
    </button>
  );
}

interface NavDestination {
  label: string;
  sublabel: string;
  href: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'website' | 'webapps';
  adminOnly?: boolean;
}

const DESTINATIONS: NavDestination[] = [
  {
    label: 'Main Studio Website',
    sublabel: 'Portfolio, packages & strategy booking',
    href: '#/',
    icon: Home,
    group: 'website',
  },
  {
    label: 'Monthly Content Retainer',
    sublabel: '15 direct-response video ads every 30 days',
    href: '#/monthly-content',
    badge: '15 VIDS/MO',
    icon: Film,
    group: 'website',
  },
  {
    label: 'AI Promotional Mini-Series',
    sublabel: '15-episode branded entertainment series',
    href: '#/promotional-mini-series',
    badge: 'SERIES',
    icon: Clapperboard,
    group: 'website',
  },
  {
    label: 'AI Video Training Academy',
    sublabel: 'Intensive tracks for business owners & creators',
    href: '#/training',
    icon: GraduationCap,
    group: 'website',
  },
  {
    label: 'Client Project Portal',
    sublabel: 'Approve scripts, upload assets & download videos',
    href: '#/client-portal',
    badge: 'CLIENT APP',
    icon: FolderKanban,
    group: 'webapps',
  },
  {
    label: 'Affiliate Partner Portal',
    sublabel: 'Share 5% client discount & earn 10% commission',
    href: '#/affiliate-portal',
    badge: '10% EARN',
    icon: Sparkles,
    group: 'webapps',
  },
  {
    label: 'Download WebApps Hub',
    sublabel: 'Install Client & Affiliate apps on your phone',
    href: '#/apps',
    icon: Download,
    group: 'webapps',
  },
  {
    label: 'Mobile Client Manager PWA',
    sublabel: 'Pocket admin for client gates, scripts & leads',
    href: '#/client-admin',
    badge: 'MOBILE ADMIN',
    icon: Smartphone,
    group: 'webapps',
    adminOnly: true,
  },
  {
    label: 'Full Studio Admin',
    sublabel: 'Co-Founder command center, analytics & CMS',
    href: '#/admin',
    icon: ShieldCheck,
    group: 'webapps',
    adminOnly: true,
  },
];

export function AppQuickSwitcher({
  label = 'Navigate',
  compact = false,
  includeAdmin = false,
}: {
  label?: string;
  compact?: boolean;
  includeAdmin?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const visibleDestinations = DESTINATIONS.filter((d) => includeAdmin || !d.adminOnly);
  const websiteLinks = visibleDestinations.filter((d) => d.group === 'website');
  const webappLinks = visibleDestinations.filter((d) => d.group === 'webapps');

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Quick App & Page Switcher"
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-display font-bold transition cursor-pointer select-none shrink-0 ${
          isDark
            ? 'border-white/20 bg-white/10 text-white hover:border-[#f5a524] hover:text-[#f5a524]'
            : 'border-[#111412]/15 bg-[#111412]/5 text-[#111412] hover:bg-[#111412]/10'
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5 text-[#f5a524] shrink-0" />
        {!compact && <span>{label}</span>}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 sm:top-full sm:mt-2 z-[120] w-auto sm:w-[360px] max-h-[82dvh] overflow-y-auto rounded-3xl border p-4 shadow-2xl backdrop-blur-xl text-left ${
            isDark
              ? 'border-white/15 bg-[#12161d]/98 text-white'
              : 'border-[#111412]/15 bg-white/98 text-[#111412]'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 mb-3 border-current/10">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#f5a524]">
                QUICK NAVIGATION HUB
              </p>
              <p className="font-display text-sm font-extrabold">
                Jump Anywhere in 1 Tap
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-mono font-bold cursor-pointer ${
                  isDark
                    ? 'border-white/15 bg-white/10 text-[#f5a524]'
                    : 'border-[#111412]/15 bg-[#111412]/5 text-[#111412]'
                }`}
              >
                {isDark ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                <span>{isDark ? 'White' : 'Dark'}</span>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 opacity-60 hover:opacity-100 cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="px-2 mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider opacity-50">
                Website & Commercial Funnels
              </p>
              <div className="space-y-1">
                {websiteLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-start justify-between gap-2.5 rounded-2xl p-2.5 no-underline transition ${
                        isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-[#111412]/5 text-[#111412]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#f5a524]/15 text-[#f5a524] mt-0.5">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-display text-xs font-bold leading-tight">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="rounded-md bg-[#f5a524] px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-black">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] opacity-65 leading-snug mt-0.5">
                            {item.sublabel}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-40 shrink-0 mt-1" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="px-2 mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider opacity-50">
                Portals & Installable WebApps
              </p>
              <div className="space-y-1">
                {webappLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-start justify-between gap-2.5 rounded-2xl p-2.5 no-underline transition ${
                        isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-[#111412]/5 text-[#111412]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500 mt-0.5">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-display text-xs font-bold leading-tight">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-emerald-500">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] opacity-65 leading-snug mt-0.5">
                            {item.sublabel}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-40 shrink-0 mt-1" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
