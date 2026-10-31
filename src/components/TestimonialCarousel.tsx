import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Pause,
  Play,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { SecHead } from '@/components/shared';
import type { Testimonial } from '@/content/types';

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

interface TestimonialCarouselProps {
  onStrategy?: () => void;
}

export function TestimonialCarousel({ onStrategy }: TestimonialCarouselProps) {
  const { content } = useStore();
  const items = content.testimonials.filter((t) => t.visible);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const count = items.length;
  const safeIndex = count > 0 ? activeIndex % count : 0;
  const current: Testimonial | undefined = items[safeIndex];

  const handleNext = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const handlePrev = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (!isAutoPlaying || isHovered || count <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 8500);
    return () => window.clearInterval(timer);
  }, [isAutoPlaying, isHovered, count]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  if (!items.length || !current) return null;

  const highlights =
    current.highlightStats && current.highlightStats.length > 0
      ? current.highlightStats
      : [
          { value: current.roiMultiplier || '4.4x', label: 'More Sales from Ads' },
          { value: '70% Less', label: 'Spent on Making Videos' },
          { value: '5 Days', label: 'Wait Time for Videos' },
        ];

  const beforeText =
    current.beforeSummary ||
    'Waiting weeks for expensive shoots and posting plain flyers that people scrolled past without buying.';

  const afterText =
    current.afterSummary ||
    'Ready-to-post AI videos delivered in days that grab attention right away and bring daily customer orders.';

  return (
    <section
      id="testimonials"
      className="sec pt-4 pb-20 sm:pb-24"
      aria-label="Real Client Stories and Results"
      onKeyDown={handleKeyDown}
    >
      <div className="wrap">
        {/* Clean, Spacious Section Header */}
        <div className="max-w-3xl">
          <SecHead
            label="Real Client Stories & Results"
            lead="See what changed when these business owners stopped waiting weeks for expensive shoots and switched to fast, clear AI videos."
          >
            How real businesses grew their sales with <em>our videos</em>.
          </SecHead>
        </div>

        {/* Simple Business Name Tabs + Back & Next Controls */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div
            className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
            role="tablist"
            aria-label="Choose a business story"
          >
            {items.map((item, idx) => {
              const isSelected = idx === safeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveIndex(idx)}
                  className={`shrink-0 rounded-xl border px-4 py-2.5 font-display text-sm font-bold tracking-tight transition duration-200 ${
                    isSelected
                      ? 'border-[#111412] bg-[#111412] text-white shadow-sm'
                      : 'border-[#111412]/15 bg-white text-[#2a302b] hover:border-[#111412]/40 hover:bg-[#f3f4ef]'
                  }`}
                >
                  {item.business}
                </button>
              );
            })}
          </div>

          {/* Simple Back / Next & Pause Controls */}
          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
            <span className="font-mono text-xs font-semibold text-[#586159] tabular-nums">
              Story {safeIndex + 1} of {count}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAutoPlaying((prev) => !prev)}
                aria-label={isAutoPlaying ? 'Pause automatic slide changes' : 'Play automatic slide changes'}
                className=" inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#111412]/15 bg-white text-[#111412] transition hover:border-[#111412] hover:bg-[#f3f4ef]"
                title={isAutoPlaying ? 'Pause auto-play' : 'Resume auto-play'}
              >
                {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous client story"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#111412]/15 bg-white px-3.5 text-xs font-bold text-[#111412] transition hover:border-[#111412] hover:bg-[#f3f4ef]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next client story"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#111412] bg-[#111412] px-3.5 text-xs font-bold text-white transition hover:bg-[#2a302b]"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Spacious Story Card */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative overflow-hidden rounded-[32px] border border-[#111412]/12 bg-white shadow-[0_24px_56px_-32px_rgba(17,20,18,0.22)]"
        >
          <div
            key={current.id}
            className="anim-step grid grid-cols-1 lg:grid-cols-12"
          >
            {/* Left Column: Plain-English Story, Quote & 3 Clear Numbers */}
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:col-span-7 lg:border-r lg:border-[#111412]/10 lg:p-12">
              <div>
                {/* Simple Category & Package Line */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs font-bold uppercase tracking-wider text-[#b87508]">
                  <span>{current.industry}</span>
                  {current.packageUsed && (
                    <>
                      <span aria-hidden="true" className="text-[#111412]/30">·</span>
                      <span className="text-[#586159]">
                        Package used: <strong className="font-bold text-[#111412]">{current.packageUsed}</strong>
                      </span>
                    </>
                  )}
                </div>

                {/* Clear Outcome Headline */}
                <h3 className="mt-3.5 font-display text-2xl font-extrabold leading-[1.16] tracking-tight text-[#111412] sm:text-3xl lg:text-[34px]">
                  {current.roiHeadline || `${current.business} Grew Their Sales with Our Videos`}
                </h3>

                {current.timeframe && (
                  <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-[#586159]">
                    <Clock className="h-4 w-4 shrink-0 text-[#b87508]" />
                    <span>Result seen in: {current.timeframe}</span>
                  </p>
                )}

                {/* Open, Uncluttered Client Quote */}
                <blockquote className="mt-7 text-lg leading-[1.7] text-[#2a302b] sm:text-[19px]">
                  “{current.quote}”
                </blockquote>

                {/* Client Attribution Row */}
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#111412]/10 pt-6">
                  <div className="flex items-center gap-3.5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#111412] font-display text-sm font-extrabold text-[#f5a524]">
                      {getInitials(current.name)}
                    </span>
                    <div>
                      <span className="block font-display text-base font-bold text-[#111412]">
                        {current.name}
                      </span>
                      <span className="block text-sm text-[#586159]">
                        {current.role ? `${current.role}, ` : ''}
                        <strong className="font-semibold text-[#111412]">{current.business}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#0d8a5a]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Verified Client</span>
                  </div>
                </div>
              </div>

              {/* 3 Big, Easy-to-Read Result Numbers */}
              <div className="mt-8 grid grid-cols-1 gap-3.5 border-t border-[#111412]/10 pt-7 sm:grid-cols-3 sm:gap-4">
                {highlights.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`rounded-2xl border p-4 sm:p-5 ${
                      i === 0
                        ? 'border-[#f5a524]/50 bg-[#fff8e6]'
                        : 'border-[#111412]/10 bg-[#fafaf6]'
                    }`}
                  >
                    <p className="font-display text-2xl font-extrabold tracking-tight text-[#111412] tabular-nums sm:text-[28px]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-snug text-[#586159] sm:text-sm">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Two Simple Boxes for Before & After */}
            <div className="flex flex-col justify-between bg-[#fafaf6] p-7 sm:p-10 lg:col-span-5 lg:p-12">
              <div>
                <div className="flex items-center justify-between border-b border-[#111412]/10 pb-4">
                  <span className="font-display text-base font-bold text-[#111412]">
                    Before &amp; After AdVibe
                  </span>
                  {current.roiMultiplier && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#0d8a5a] tabular-nums">
                      <TrendingUp className="h-4 w-4" />
                      {current.roiMultiplier}
                    </span>
                  )}
                </div>

                <div className="mt-6 space-y-5">
                  {/* Box 1: Before AdVibe */}
                  <div className="rounded-2xl border border-[#111412]/10 bg-white p-5 sm:p-6">
                    <span className="inline-block font-mono text-xs font-bold uppercase tracking-wider text-[#a52114]">
                      Before AdVibe
                    </span>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-[#2a302b] sm:text-base">
                      {beforeText}
                    </p>
                  </div>

                  {/* Box 2: After AdVibe */}
                  <div className="rounded-2xl border border-[#111412] bg-[#111412] p-5 text-white shadow-md sm:p-6">
                    <span className="inline-block font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                      After AdVibe
                    </span>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-white/95 sm:text-base">
                      {afterText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Simple Action Button */}
              {onStrategy && (
                <div className="mt-8 border-t border-[#111412]/10 pt-6">
                  <button
                    type="button"
                    onClick={onStrategy}
                    className="btn btn-acc w-full justify-between"
                  >
                    <span>Get Results Like This for Your Business</span>
                    <span className="arr">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default TestimonialCarousel;
