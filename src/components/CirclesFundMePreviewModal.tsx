import { useEffect, useState } from 'react';
import { X, Play, ExternalLink, ShieldCheck, Star } from 'lucide-react';
import { useStore, ytThumb } from '@/lib/store';
import { assetUrl } from '@/lib/money';
import type { PortfolioItem } from '@/content/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectVideo?: (item: PortfolioItem) => void;
}

export function CirclesFundMePreviewModal({ open, onClose, onSelectVideo }: Props) {
  const { content } = useStore();
  const client = content.client;
  const match = (client.matchName || 'CirclesFundMe').toLowerCase();

  // Find videos matched to CirclesFundMe
  const matchedVideos = content.portfolio.filter(
    (p) => p.visible && (p.client.toLowerCase().includes(match) || p.client.toLowerCase().includes('fintech'))
  );

  const fallbackVideos = matchedVideos.length > 0 ? matchedVideos : content.portfolio.filter((p) => p.visible).slice(0, 3);
  const [playingVideo, setPlayingVideo] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (playingVideo) setPlayingVideo(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, playingVideo]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${client.name} Commercial Work Preview`}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92dvh] overflow-y-auto rounded-3xl border border-[#111412]/15 bg-[#faf9f4] p-6 text-[#111412] shadow-2xl sm:p-9 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-[#111412]/15 bg-white text-[#111412]/70 transition hover:bg-[#111412] hover:text-white"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Client Lockup Header */}
        <div className="flex items-center gap-3.5 mb-6">
          {client.mark && (
            <img
              src={assetUrl(client.mark)}
              alt={client.name}
              className="h-12 w-12 rounded-xl object-cover border border-[#111412]/10"
            />
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-lg font-bold tracking-tight text-[#111412]">
                {client.name}
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 uppercase">
                {client.badge || 'Repeat Client'}
              </span>
              <span className="font-mono text-[10px] text-[#111412]/50 uppercase tracking-wider">
                {client.sector || 'Fintech'}
              </span>
            </div>
            <p className="text-[11px] text-[#111412]/60 font-mono">
              {client.legalName}
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="border-b border-[#111412]/10 pb-5">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#b87508]">
            PROOF OF WORK · COMMERCIAL COLLABORATION
          </span>
          <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-[#111412] sm:text-3xl">
            Selected Video Campaigns for {client.name}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#111412]/70 leading-relaxed max-w-2xl">
            Explore authentic commercial campaigns directed by AdVibe Studios. Built using our agile AI creative pipeline—pairing direct-response customer messaging with cinematic visuals.
          </p>
        </div>

        {/* Video Player or Grid */}
        {playingVideo ? (
          <div className="my-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#111412]">{playingVideo.title}</h3>
                <p className="text-xs text-[#111412]/60">{playingVideo.client} · {playingVideo.category}</p>
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                className="rounded-lg border border-[#111412]/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-black/5"
              >
                ← Back to List
              </button>
            </div>
            <div
              className="overflow-hidden rounded-2xl bg-black shadow-lg"
              style={{
                aspectRatio: playingVideo.orientation === 'vertical' ? '9/16' : '16/9',
                maxHeight: '65dvh',
                margin: '0 auto',
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${playingVideo.youtubeId}?autoplay=1&rel=0&playsinline=1`}
                title={playingVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 0 }}
              />
            </div>
          </div>
        ) : (
          <div className="my-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {fallbackVideos.map((video) => (
              <div
                key={video.id}
                className="group relative overflow-hidden rounded-2xl border border-[#111412]/10 bg-white shadow-sm transition hover:shadow-md cursor-pointer"
                onClick={() => {
                  if (onSelectVideo) onSelectVideo(video);
                  else setPlayingVideo(video);
                }}
              >
                <div
                  className="relative overflow-hidden bg-black/90"
                  style={{ aspectRatio: video.orientation === 'vertical' ? '9/16' : '16/9' }}
                >
                  <img
                    src={ytThumb(video.youtubeId)}
                    alt={video.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-black shadow-lg transition group-hover:scale-110 group-hover:bg-[#f5a524]">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </span>
                  </div>
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 font-mono text-[10px] font-bold text-black">
                    {video.category}
                  </span>
                </div>
                <div className="p-3.5">
                  <h4 className="font-display text-sm font-bold text-[#111412] line-clamp-1">{video.title}</h4>
                  <p className="mt-0.5 text-[11px] text-[#111412]/50 line-clamp-1">{video.client} {video.result ? `· ${video.result}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verified Notice Footer */}
        <div className="pt-4 border-t border-[#111412]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#111412]/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Commercial creative partnership verified by AdVibe Studios.</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#111412] px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-[#f5a524] hover:text-black transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
