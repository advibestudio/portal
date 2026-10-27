import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Sparkles, Eye, PhoneCall, GraduationCap, Flame, ShoppingBag, Film, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';

const OFF_KEY = 'advibe.popups.off';

export interface LiveActivityItem {
  id: string;
  category: 'viewer' | 'strategy_call' | 'offers' | 'enrollment' | 'project';
  actor: string;
  flag: string;
  location: string;
  action: string;
  timeAgo: string;
  badgeLabel: string;
  badgeColor: 'emerald' | 'gold' | 'sky' | 'amber';
}

export default function LivePopups({ paused }: { paused: boolean }) {
  const { content, leads, students } = useStore();

  const [current, setCurrent] = useState<LiveActivityItem | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [off, setOff] = useState(false);

  const shownCount = useRef(0);
  const itemIndex = useRef(0);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Clear any past dismissal blocks from localStorage/sessionStorage
  useEffect(() => {
    try {
      sessionStorage.removeItem(OFF_KEY);
      localStorage.removeItem(OFF_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // Monitor browser tab visibility
  useEffect(() => {
    const onVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Construct dynamic real-life activity queue
  const activityQueue = useMemo<LiveActivityItem[]>(() => {
    const list: LiveActivityItem[] = [
      // 1. Explicitly requested first-arrival signals
      {
        id: 'act-ghana-view',
        category: 'viewer',
        actor: 'Someone from Ghana',
        flag: '🇬🇭',
        location: 'Accra, Ghana',
        action: 'is viewing this page too',
        timeAgo: 'just now',
        badgeLabel: 'Live Viewer',
        badgeColor: 'emerald',
      },
      {
        id: 'act-alieze-strategy',
        category: 'strategy_call',
        actor: 'Alieze',
        flag: '🇳🇬',
        location: 'Lagos, Nigeria',
        action: 'just booked a free strategy call',
        timeAgo: '1m ago',
        badgeLabel: 'Strategy Call Booked',
        badgeColor: 'gold',
      },
      {
        id: 'act-checking-offers',
        category: 'offers',
        actor: 'A business owner',
        flag: '🇳🇬',
        location: 'Abuja, Nigeria',
        action: 'is checking out our commercial video offers',
        timeAgo: 'just now',
        badgeLabel: 'Exploring Offers',
        badgeColor: 'sky',
      },
      {
        id: 'act-uk-retainer',
        category: 'offers',
        actor: 'Someone in United Kingdom',
        flag: '🇬🇧',
        location: 'London, UK',
        action: 'is reviewing the Monthly Video Retainer packages',
        timeAgo: '2m ago',
        badgeLabel: 'Exploring Retainer',
        badgeColor: 'sky',
      },
      {
        id: 'act-kenya-series',
        category: 'viewer',
        actor: 'A founder from Kenya',
        flag: '🇰🇪',
        location: 'Nairobi, Kenya',
        action: 'is watching the AI Promotional Mini-Series trailer',
        timeAgo: '3m ago',
        badgeLabel: 'Watching Trailer',
        badgeColor: 'emerald',
      },
      {
        id: 'act-us-seat',
        category: 'enrollment',
        actor: 'David',
        flag: '🇺🇸',
        location: 'New York, US',
        action: 'enrolled in the AI Cinematography Founding Cohort',
        timeAgo: '5m ago',
        badgeLabel: 'Cohort Enrolled',
        badgeColor: 'amber',
      },
      {
        id: 'act-gh-curriculum',
        category: 'offers',
        actor: 'A creator from Ghana',
        flag: '🇬🇭',
        location: 'Kumasi, Ghana',
        action: 'is checking out the 2-week training curriculum',
        timeAgo: 'just now',
        badgeLabel: 'Live Visitor',
        badgeColor: 'emerald',
      },
      {
        id: 'act-ng-creative',
        category: 'project',
        actor: 'Kwame',
        flag: '🇬🇭',
        location: 'Accra, Ghana',
        action: 'started their creative brief for an AI commercial ad',
        timeAgo: '7m ago',
        badgeLabel: 'Project Started',
        badgeColor: 'gold',
      },
    ];

    // Merge actual verified student enrollments from the store
    if (students && students.length > 0) {
      students
        .filter((s) => s.status === 'paid' || s.status === 'confirmed')
        .slice(0, 4)
        .forEach((s) => {
          const countryObj = content.countries.find((c) => c.code === s.country);
          const firstName = s.name.split(/\s+/)[0] || 'A student';
          list.push({
            id: `real-student-${s.id}`,
            category: 'enrollment',
            actor: `${firstName} from ${countryObj?.name || s.country}`,
            flag: countryObj?.flag || '🎓',
            location: countryObj?.name || s.country,
            action: `secured a seat in the ${s.track === 'business' ? 'Business Owner' : 'Creator'} Track`,
            timeAgo: 'recently',
            badgeLabel: 'Verified Student',
            badgeColor: 'amber',
          });
        });
    }

    // Merge actual client leads / strategy requests from the store
    if (leads && leads.length > 0) {
      leads
        .filter((l) => l.source === 'strategy' || l.status === 'Won' || l.showPublic)
        .slice(0, 3)
        .forEach((l) => {
          const countryObj = content.countries.find((c) => c.code === l.country);
          const firstName = l.name.split(/\s+/)[0] || 'A business';
          list.push({
            id: `real-lead-${l.id}`,
            category: 'strategy_call',
            actor: `${firstName} (${l.business})`,
            flag: countryObj?.flag || '🌍',
            location: countryObj?.name || l.country,
            action: l.source === 'strategy' ? 'booked a free video strategy call' : `requested "${l.offerName}"`,
            timeAgo: 'recently',
            badgeLabel: 'Verified Client',
            badgeColor: 'gold',
          });
        });
    }

    return list;
  }, [students, leads, content.countries]);

  // Natural cadence: display for 4.5s (exit animation starts at 4.1s), then wait 6.5s gap between popups (5-10s range)
  useEffect(() => {
    if (off || !activityQueue.length || !isTabVisible) return;

    if (current) {
      setIsExiting(false);
      // Start exit fade-and-slide at 4.1 seconds
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 4100);

      // Unmount completely at 4.5 seconds after smooth slide-and-fade exit
      const unmountTimer = setTimeout(() => {
        setCurrent(null);
        setIsExiting(false);
      }, 4500);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(unmountTimer);
      };
    }

    if (paused) return;

    // First popup appears 1.5s after load, subsequent ones every 6.5s (natural 5-10s cycle)
    const delay = shownCount.current === 0 ? 1500 : 6500;
    const timer = setTimeout(() => {
      shownCount.current += 1;
      const nextItem = activityQueue[itemIndex.current % activityQueue.length];
      itemIndex.current += 1;
      setIsExiting(false);
      setCurrent(nextItem);
    }, delay);

    return () => clearTimeout(timer);
  }, [activityQueue, current, paused, off, isTabVisible]);

  if (!current || off || paused || !isTabVisible) return null;

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setCurrent(null);
      setIsExiting(false);
    }, 350);
  };

  // Badge icon and styling based on category
  const renderBadge = () => {
    switch (current.category) {
      case 'viewer':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {current.badgeLabel}
          </span>
        );
      case 'strategy_call':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#f5a524]/40 bg-[#f5a524]/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524]">
            <PhoneCall className="h-2.5 w-2.5 text-[#f5a524]" />
            {current.badgeLabel}
          </span>
        );
      case 'offers':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300">
            <ShoppingBag className="h-2.5 w-2.5 text-sky-300" />
            {current.badgeLabel}
          </span>
        );
      case 'enrollment':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
            <GraduationCap className="h-2.5 w-2.5 text-amber-300" />
            {current.badgeLabel}
          </span>
        );
      case 'project':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#f5a524]/40 bg-[#f5a524]/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5a524]">
            <Sparkles className="h-2.5 w-2.5 text-[#f5a524]" />
            {current.badgeLabel}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
            {current.badgeLabel}
          </span>
        );
    }
  };

  const renderIcon = () => {
    switch (current.category) {
      case 'viewer':
        return <Eye className="h-4 w-4 text-emerald-400" />;
      case 'strategy_call':
        return <PhoneCall className="h-4 w-4 text-[#f5a524]" />;
      case 'offers':
        return <ShoppingBag className="h-4 w-4 text-sky-400" />;
      case 'enrollment':
        return <GraduationCap className="h-4 w-4 text-amber-400" />;
      case 'project':
        return <Film className="h-4 w-4 text-[#f5a524]" />;
      default:
        return <Flame className="h-4 w-4 text-[#f5a524]" />;
    }
  };

  return (
    <aside
      className={`fixed left-3 sm:left-5 bottom-[calc(92px+env(safe-area-inset-bottom,0px))] sm:bottom-6 z-[9999] max-w-[400px] w-[calc(100vw-24px)] sm:w-auto rounded-2xl bg-[#0b0e12]/98 text-white border border-white/20 p-3.5 sm:p-4 shadow-[0_24px_55px_-10px_rgba(0,0,0,0.9),0_0_24px_rgba(245,165,36,0.2)] backdrop-blur-2xl overflow-hidden pointer-events-auto ${
        isExiting ? 'toast-slide-exit' : 'toast-slide-enter'
      }`}
      role="status"
      aria-live="polite"
    >
      {/* Top Header Strip with Status Pill & Time */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {renderBadge()}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-300 font-semibold">{current.timeAgo}</span>
          <button
            onClick={handleDismiss}
            className="grid h-6 w-6 place-items-center rounded-full text-zinc-400 hover:text-white hover:bg-white/15 transition active:scale-95"
            aria-label="Dismiss notice"
            title="Dismiss notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="flex items-start gap-3">
        {/* Avatar / Flag Icon Box */}
        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 shadow-inner">
          <span className="text-xl leading-none select-none" aria-hidden="true">
            {current.flag}
          </span>
          <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-[#14181f] border border-white/25">
            {renderIcon()}
          </span>
        </div>

        {/* Text Details with High-Contrast Typography */}
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[13.5px] sm:text-[14px] font-bold text-white leading-tight truncate">
            {current.actor}
          </p>
          <p className="mt-1 text-[12.5px] sm:text-[13px] font-medium text-zinc-100 leading-snug">
            {current.action}
          </p>
          <p className="mt-1 font-mono text-[10.5px] text-zinc-300 font-semibold tracking-wide flex items-center gap-1.5">
            <span className="text-[#f5a524]">●</span>
            <span>AdVibe Studios · {current.location}</span>
          </p>
        </div>
      </div>

      {/* Animated Progress Bar Countdown */}
      <div className="absolute bottom-0 left-0 h-[2.5px] w-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#f5a524] via-amber-300 to-[#f5a524]"
          style={{
            animation: 'shrinkWidth 4.1s linear forwards',
          }}
        />
      </div>
    </aside>
  );
}
