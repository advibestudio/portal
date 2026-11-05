import { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Globe,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  fetchFirestoreTrafficSources,
  loadTrafficSourceSummary,
  resetAllTrafficSources,
  type TrafficSourceCounter,
} from '@/lib/heatmapAnalytics';
import { useStore } from '@/lib/store';
import {
  applyGoogleSiteVerificationTag,
  GOOGLE_VERIFICATION_STORAGE_KEY,
} from '@/lib/seo';

const GITHUB_DOMAIN_URL = 'https://advibestudio.github.io/portal/';
const GITHUB_SITEMAP_URL = 'https://advibestudio.github.io/portal/sitemap.xml';

export function SimpleTrafficSourcesWidget() {
  const { content, saveContent, session } = useStore();
  const [sources, setSources] = useState<TrafficSourceCounter[]>(() =>
    loadTrafficSourceSummary(),
  );
  const [syncing, setSyncing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [searchConsoleOpen, setSearchConsoleOpen] = useState(false);

  const [verificationCode, setVerificationCode] = useState(() => {
    const fromSettings = content.settings.googleSiteVerification || '';
    if (fromSettings) return fromSettings;
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(GOOGLE_VERIFICATION_STORAGE_KEY) || '';
    }
    return '';
  });
  const [savedNotice, setSavedNotice] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleRefresh = async () => {
    setSyncing(true);
    const updated = await fetchFirestoreTrafficSources();
    setSources(updated);
    setSyncing(false);
  };

  useEffect(() => {
    void handleRefresh();
  }, []);

  const totalVisits = sources.reduce((sum, s) => sum + s.visits, 0);

  const handleResetCounters = async () => {
    setSyncing(true);
    const fresh = await resetAllTrafficSources();
    setSources(fresh);
    setConfirmReset(false);
    setSyncing(false);
  };

  const handleCopy = (key: string, value: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleSaveVerification = async () => {
    const cleaned = verificationCode
      .trim()
      .replace(/^.*content=["']([^"']+)["'].*$/i, '$1');
    setVerificationCode(cleaned);
    try {
      localStorage.setItem(GOOGLE_VERIFICATION_STORAGE_KEY, cleaned);
    } catch {
      // ignore
    }
    applyGoogleSiteVerificationTag(cleaned);

    await saveContent(
      {
        ...content,
        settings: {
          ...content.settings,
          googleSiteVerification: cleaned,
        },
      },
      session?.name || 'Admin',
      'Updated Google Search Console verification tag',
    );
    setSavedNotice('Verification code saved & active in <head>');
    window.setTimeout(() => setSavedNotice(''), 3500);
  };

  const barColorFor = (id: TrafficSourceCounter['id']) => {
    switch (id) {
      case 'search':
        return 'bg-[#f5a524]';
      case 'social':
        return 'bg-emerald-500';
      case 'ads_referrals':
        return 'bg-sky-500';
      case 'direct':
      default:
        return 'bg-white/40';
    }
  };

  return (
    <section
      aria-label="Visitor Traffic Sources and Google Search Discovery"
      className="rounded-2xl border border-white/10 bg-[#121518] p-5 sm:p-6 text-left space-y-5"
    >
      {/* Top Bar: Title + Total Visits + Refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Search className="h-3.5 w-3.5 text-[#f5a524]" />
            <span>Visitor Traffic Sources</span>
            <span aria-hidden="true">·</span>
            <span>Simple Arrival Breakdown</span>
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
            Where People Came From ({totalVisits.toLocaleString()} Total Visits)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin text-[#f5a524]' : ''}`} />
            <span>{syncing ? 'Syncing…' : 'Refresh'}</span>
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetCounters}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/60 hover:text-white transition cursor-pointer whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4-Column Simple Traffic Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sources.map((src) => {
          const pct = totalVisits > 0 ? Math.round((src.visits / totalVisits) * 100) : 0;
          return (
            <div
              key={src.id}
              className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">
                    {src.label}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-white/50">
                    {pct}%
                  </span>
                </div>
                <p className="text-[11px] text-white/45 leading-snug">
                  {src.subtitle}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-white">
                    {src.visits.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-white/40">
                    visits
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full transition-all duration-300 ${barColorFor(src.id)}`}
                    style={{ width: `${Math.max(src.visits > 0 ? 6 : 0, pct)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalVisits === 0 && (
        <p className="text-xs text-white/50">
          No visitor sessions recorded yet since last reset. As visitors open your public pages via Google Search, Instagram/WhatsApp, Paid Ads, or Direct links, their arrival source is counted here automatically.
        </p>
      )}

      {/* Collapsible 1-Click Google Search Console & GitHub Domain Indexing Helper */}
      <div className="border-t border-white/10 pt-4">
        <button
          type="button"
          aria-expanded={searchConsoleOpen}
          onClick={() => setSearchConsoleOpen(!searchConsoleOpen)}
          className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold text-white/80 hover:text-white transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-[#f5a524]" />
            <span>
              Google Search Console &amp; Instant Brand Indexing Setup (AdVibe · AdVibe Studios · AdVibe Studios Global)
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-white/50 transition-transform duration-150 ${
              searchConsoleOpen ? 'rotate-180 text-[#f5a524]' : ''
            }`}
          />
        </button>

        {searchConsoleOpen && (
          <div className="mt-4 space-y-4 rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/75">
            <p className="leading-relaxed">
              Your site is configured with Schema.org <code className="text-[#f5a524]">WebSite</code> and <code className="text-[#f5a524]">Organization</code> structured data for <strong>AdVibe</strong>, <strong>AdVibe Studio</strong>, <strong>AdVibe Studios</strong>, and <strong>AdVibe Studios Global</strong> pointing to your GitHub domain. Complete the 2 quick steps below in Google Search Console so Google indexes your GitHub domain immediately:
            </p>

            {/* Step 1: Copy URLs for Google Search Console */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">01. Official GitHub Domain URL</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('domain', GITHUB_DOMAIN_URL)}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/10 transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedKey === 'domain' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-[11px] text-[#f5a524] break-all">
                  {GITHUB_DOMAIN_URL}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">02. Sitemap URL (Paste in Search Console)</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('sitemap', GITHUB_SITEMAP_URL)}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/10 transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedKey === 'sitemap' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Sitemap</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-[11px] text-[#f5a524] break-all">
                  {GITHUB_SITEMAP_URL}
                </p>
              </div>
            </div>

            {/* Step 2: Paste Google Search Console HTML Tag Verification Code */}
            <div className="space-y-2 pt-1">
              <label
                htmlFor="gsc-verification-input"
                className="block font-semibold text-white"
              >
                03. Google Search Console HTML Verification Code (Optional)
              </label>
              <p className="text-[11px] text-white/55">
                In <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-[#f5a524] underline inline-flex items-center gap-1">Google Search Console <ExternalLink className="h-2.5 w-2.5" /></a>, choose <strong>URL Prefix</strong> (<code className="text-white/80">{GITHUB_DOMAIN_URL}</code>) → <strong>HTML tag</strong>, and paste either the full meta tag or the verification code below:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="gsc-verification-input"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder='Paste verification code or <meta name="google-site-verification" content="..." />'
                  className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveVerification}
                  className="rounded-lg bg-[#f5a524] px-4 py-2 text-xs font-bold text-black hover:brightness-110 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  Save Verification Code
                </button>
              </div>
              {savedNotice && (
                <p className="text-[11px] font-medium text-emerald-400">
                  ✓ {savedNotice}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
