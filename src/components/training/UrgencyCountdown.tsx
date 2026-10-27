import React, { useEffect, useState } from 'react';

interface Props {
  deadline: string;
  label?: string;
}

export function UrgencyCountdown({ deadline, label = 'Founding enrollment closes in:' }: Props) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 3, hours: 14, minutes: 22, seconds: 45 });

  useEffect(() => {
    const target = new Date(deadline).getTime();

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="inline-flex flex-col items-center rounded-2xl border border-white/10 bg-[#121415]/90 px-5 py-3 shadow-lg backdrop-blur-md">
      {label && (
        <span className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-[#f5a524]">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2 font-mono font-bold text-white sm:gap-3">
        <div className="flex flex-col items-center">
          <span className="text-xl sm:text-2xl">{pad(timeLeft.days)}</span>
          <span className="text-[9px] uppercase tracking-wider text-white/40">Days</span>
        </div>
        <span className="text-lg text-[#f5a524]">:</span>
        <div className="flex flex-col items-center">
          <span className="text-xl sm:text-2xl">{pad(timeLeft.hours)}</span>
          <span className="text-[9px] uppercase tracking-wider text-white/40">Hours</span>
        </div>
        <span className="text-lg text-[#f5a524]">:</span>
        <div className="flex flex-col items-center">
          <span className="text-xl sm:text-2xl">{pad(timeLeft.minutes)}</span>
          <span className="text-[9px] uppercase tracking-wider text-white/40">Mins</span>
        </div>
        <span className="text-lg text-[#f5a524]">:</span>
        <div className="flex flex-col items-center">
          <span className="text-xl sm:text-2xl text-[#f5a524]">{pad(timeLeft.seconds)}</span>
          <span className="text-[9px] uppercase tracking-wider text-white/40">Secs</span>
        </div>
      </div>
    </div>
  );
}
