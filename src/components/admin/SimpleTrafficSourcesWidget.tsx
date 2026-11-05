import { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
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
  const [searchConsoleOpen, setSearchConsoleOpen] = useState(true);

  const [verificationCode, setVerificationCode] = useState(() => {
    const fromSettings = content.settings.googleSiteVerification || '';
    if (fromSettings) return fromSettings;
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(GOOGLE_VERIFICATION_STORAGE_KEY) || '';
    }
    return '';
  });
  const [googleHtmlFilename, setGoogleHtmlFilename] = useState('');
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

  const cleanVerificationToken = (raw: string) =>
    raw
      .trim()
      .replace(/^.*content=["']([^"']+)["'].*$/i, '$1')
      .replace(/^google-site-verification=/i, '');

  const handleSaveVerification = async () => {
    const cleaned = cleanVerificationToken(verificationCode);
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
    setSavedNotice('Verification token saved & active in <head>');
    window.setTimeout(() => setSavedNotice(''), 4000);
  };

  const handleDownloadVerificationFile = () => {
    const raw = googleHtmlFilename.trim();
    if (!raw) return;
    const normalizedFile = raw.endsWith('.html')
      ? raw
      : raw.startsWith('google')
        ? `${raw}.html`
        : `google${raw}.html`;
    const fileContent = `google-site-verification: ${normalizedFile}`;
    const blob = new Blob([fileContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = normalizedFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const cleanedMetaToken = cleanVerificationToken(verificationCode);
  const staticMetaSnippet = cleanedMetaToken
    ? `<meta name="google-site-verification" content="${cleanedMetaToken}" />`
    : '';

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

      {/* 4-Step Google Search Console & GitHub Domain Indexing Wizard */}
      <div className="border-t border-white/10 pt-4">
        <button
          type="button"
          aria-expanded={searchConsoleOpen}
          onClick={() => setSearchConsoleOpen(!searchConsoleOpen)}
          className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold text-white/90 hover:text-white transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-[#f5a524]" />
            <span>
              4-Step Google Search Console Indexing Wizard (Make Your Site Appear on Google Search)
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-white/50 transition-transform duration-150 ${
              searchConsoleOpen ? 'rotate-180 text-[#f5a524]' : ''
            }`}
          />
        </button>

        {searchConsoleOpen && (
          <div className="mt-4 space-y-4 rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5 text-xs text-white/80">
            <p className="leading-relaxed text-white/70">
              Your site now has <strong>Wave-1 Googlebot static HTML</strong> and <strong>hash-free sitemap pages</strong> (<code className="text-[#f5a524]">/monthly-content/</code>, <code className="text-[#f5a524]">/promotional-mini-series/</code>, <code className="text-[#f5a524]">/our-work/</code>, <code className="text-[#f5a524]">/training/</code>). Because Google never crawls a new GitHub Pages domain until you tell it to, complete these 4 steps once after pushing your latest code to GitHub:
            </p>

            {/* STEP 01 */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white">
                  01. Add Your GitHub URL in Google Search Console
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy('domain', GITHUB_DOMAIN_URL)}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/10 transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedKey === 'domain' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Copied URL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Domain URL</span>
                      </>
                    )}
                  </button>
                  <a
                    href="https://search.google.com/search-console/welcome"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-[#f5a524] px-2.5 py-1 text-[11px] font-bold text-black hover:brightness-110 transition whitespace-nowrap shrink-0"
                  >
                    <span>Open Search Console</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Open Google Search Console, select the right-hand box <strong>URL prefix</strong>, and paste: <code className="text-[#f5a524] font-mono">{GITHUB_DOMAIN_URL}</code>
              </p>
            </div>

            {/* STEP 02 */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5 space-y-3">
              <span className="font-bold text-white block">
                02. Verify Ownership (HTML File Download or HTML Meta Tag)
              </span>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Google Search Console will give you either an <strong>HTML file name</strong> (like <code className="text-white/85">google1234567890abcdef.html</code>) or an <strong>HTML tag</strong>. You can generate the static verification file right here to place in your <code className="text-white/85">public/</code> folder on GitHub, or save your verification token below:
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Option A: HTML Verification File Generator */}
                <div className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-2">
                  <span className="text-[11px] font-semibold text-white block">
                    Option A — Generate Static <code className="text-[#f5a524]">google*.html</code> File
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={googleHtmlFilename}
                      onChange={(e) => setGoogleHtmlFilename(e.target.value)}
                      placeholder="e.g. google1234567890abcdef.html"
                      className="flex-1 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleDownloadVerificationFile}
                      disabled={!googleHtmlFilename.trim()}
                      className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/15 disabled:opacity-40 transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Download className="h-3 w-3 text-[#f5a524]" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>

                {/* Option B: HTML Meta Tag Token */}
                <div className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-2">
                  <span className="text-[11px] font-semibold text-white block">
                    Option B — Save Verification Token
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder='Paste token or <meta name="google-site-verification" ... />'
                      className="flex-1 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/35 focus:border-[#f5a524] focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveVerification}
                      className="rounded-md bg-[#f5a524] px-3 py-1.5 text-[11px] font-bold text-black hover:brightness-110 transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Save Token
                    </button>
                  </div>
                  {staticMetaSnippet && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <code className="text-[10px] text-white/60 truncate">{staticMetaSnippet}</code>
                      <button
                        type="button"
                        onClick={() => handleCopy('meta', staticMetaSnippet)}
                        className="text-[10px] font-semibold text-[#f5a524] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedKey === 'meta' ? 'Copied!' : 'Copy <meta>'}
                      </button>
                    </div>
                  )}
                  {savedNotice && (
                    <p className="text-[11px] font-medium text-emerald-400">
                      ✓ {savedNotice}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 03 */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white">
                  03. Submit Your Clean Sitemap &amp; Click &ldquo;Request Indexing&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('sitemap', GITHUB_SITEMAP_URL)}
                  className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/10 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedKey === 'sitemap' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Copied Sitemap URL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Sitemap URL</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                1. In Google Search Console, click <strong>Sitemaps</strong> in the left menu, type <code className="text-[#f5a524] font-mono">sitemap.xml</code>, and click <strong>Submit</strong>.<br />
                2. In the top search bar of Search Console (<em>&ldquo;Inspect any URL&rdquo;</em>), paste <code className="text-[#f5a524] font-mono">{GITHUB_DOMAIN_URL}</code> and click <strong>Request Indexing</strong>. This puts your site in Google&apos;s priority crawl queue.
              </p>
            </div>

            {/* STEP 04 */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-white block">
                  04. Test Live Google Search Indexing Status
                </span>
                <p className="text-[11px] text-white/55">
                  Check which pages of <code className="text-white/80">advibestudio.github.io/portal</code> are currently live on Google Search:
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://www.google.com/search?q=site%3Aadvibestudio.github.io%2Fportal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/10 transition whitespace-nowrap shrink-0"
                >
                  <span>Check Indexed Pages (site:)</span>
                  <ExternalLink className="h-3 w-3 text-[#f5a524]" />
                </a>
                <a
                  href="https://www.google.com/search?q=%22AdVibe+Studio%22+OR+%22AdVibe+Studios+Global%22"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#f5a524]/40 bg-[#f5a524]/15 px-3 py-1.5 text-[11px] font-semibold text-[#f5a524] hover:bg-[#f5a524]/25 transition whitespace-nowrap shrink-0"
                >
                  <span>Test Brand Search</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
