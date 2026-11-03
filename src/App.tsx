import React, { lazy, Suspense, useEffect, useState } from 'react';
import { StoreProvider } from '@/lib/store';
import { ReferralProvider } from '@/lib/referralStore';
import { CountryProvider } from '@/lib/country';
import PublicSite from '@/pages/PublicSite';

// Code-splitting: Pages are loaded on demand to keep initial load instantaneous.
const Admin = lazy(() => import('@/pages/admin/Admin'));
const AiVideoPage = lazy(() => import('@/pages/AiVideoPage'));
const TrainingSelector = lazy(() => import('@/pages/training/TrainingSelector'));
const BusinessSalesPage = lazy(() => import('@/pages/training/BusinessSalesPage'));
const CreatorSalesPage = lazy(() => import('@/pages/training/CreatorSalesPage'));
const TrainingThankYou = lazy(() => import('@/pages/training/TrainingThankYou'));
const MonthlyRetainerPage = lazy(() => import('@/pages/commercial/MonthlyRetainerPage'));
const MiniSeriesPage = lazy(() => import('@/pages/commercial/MiniSeriesPage'));
const CustomerPortalPage = lazy(() => import('@/pages/CustomerPortalPage'));
const AffiliatePortalPage = lazy(() => import('@/pages/AffiliatePortalPage'));
const AppDownloadHubPage = lazy(() => import('@/pages/AppDownloadHubPage'));
const MobileClientAdminApp = lazy(() => import('@/pages/admin/MobileClientAdminApp'));
const WorkShowcasePage = lazy(() => import('@/pages/WorkShowcasePage'));
import { TapRipple } from '@/components/animations/TapRipple';
import { usePageHeatmapTracker } from '@/lib/heatmapAnalytics';
import { OfflineBanner, getPreferredPWALaunchRoute, setPreferredPWALaunchRoute } from '@/lib/pwa';
import { ThemeProvider } from '@/lib/theme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App uncaught error:', error, errorInfo);
  }
  handleReset = () => {
    try {
      localStorage.removeItem('advibe:cohorts');
      localStorage.removeItem('advibe:students');
    } catch {
      // ignore
    }
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-[#faf9f4] p-6 text-center text-[#111412]">
          <div className="max-w-md rounded-2xl border border-[#111412]/15 bg-white p-8 shadow-xl">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-600">Notice</span>
            <h2 className="mt-2 font-display text-2xl font-bold">Something went wrong</h2>
            <p className="mt-2 text-xs text-[#111412]/60">
              {this.state.error?.message || 'An error occurred while loading this view.'}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-[#111412] px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-[#f5a524] hover:text-black transition"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="rounded-xl border border-[#111412]/20 px-4 py-2 font-mono text-[11px] text-[#111412]/70 hover:bg-black/5"
              >
                Reset Stored Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function useAppRoute() {
  const getRoute = () => {
    const hash = window.location.hash || '';
    if (hash && hash !== '#' && hash !== '#/') {
      return hash.replace(/^#\/?/, '/');
    }
    // If launched as an installed standalone PWA from the phone's home screen with no hash,
    // open the specific WebApp the user installed (e.g. /client-portal or /affiliate-portal).
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    if (isStandalone && (!hash || hash === '#' || hash === '#/')) {
      const preferred = getPreferredPWALaunchRoute();
      if (preferred && preferred !== '/') {
        return preferred;
      }
    }
    // Strip GitHub Pages repository base path `/portal` or `/portal/` so visiting
    // https://advibestudio.github.io/portal/ or https://advibestudio.github.io/portal/#/
    // in a browser always opens the Main Website (`/`).
    const rawPath = window.location.pathname || '/';
    const stripped = rawPath.replace(/^\/portal\/?/i, '/');
    return stripped.startsWith('/') ? stripped : `/${stripped}`;
  };

  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  return route;
}

export default function App() {
  const route = useAppRoute();

  // Track page views and section dwell-time heatmaps across routes
  usePageHeatmapTracker(route);

  const isMonthlyContent = route.startsWith('/monthly-content') || route.startsWith('monthly-content');
  const isMiniSeries = route.startsWith('/promotional-mini-series') || route.startsWith('promotional-mini-series');
  const isClientAdmin = route.startsWith('/client-admin') || route.startsWith('client-admin');
  const isAdmin = !isClientAdmin && (route.startsWith('/admin') || route.startsWith('admin'));
  const isAffiliatePortal =
    route.startsWith('/affiliate-portal') ||
    route.startsWith('affiliate-portal') ||
    route.startsWith('/affiliates') ||
    route.startsWith('affiliates');
  const isCustomerPortal =
    !isAffiliatePortal &&
    (route.startsWith('/client-portal') ||
      route.startsWith('client-portal') ||
      route.startsWith('/portal') ||
      route.startsWith('portal'));
  const isDownloadCustomerApp =
    route.startsWith('/download/customer-app') || route.startsWith('download/customer-app');
  const isDownloadAffiliateApp =
    route.startsWith('/download/affiliate-app') || route.startsWith('download/affiliate-app');
  const isDownloadAdminApp =
    route.startsWith('/download/admin-app') || route.startsWith('download/admin-app');
  const isAppsHub =
    route.startsWith('/apps') ||
    route.startsWith('apps') ||
    isDownloadCustomerApp ||
    isDownloadAffiliateApp ||
    isDownloadAdminApp;
  const isCase = route.startsWith('/ai-video') || route.startsWith('ai-video');
  const isWorkShowcase =
    route.startsWith('/our-work') ||
    route.startsWith('our-work') ||
    route.startsWith('/portfolio') ||
    route.startsWith('portfolio') ||
    route.startsWith('/work-gallery') ||
    route.startsWith('work-gallery') ||
    route.startsWith('/watch') ||
    route.startsWith('watch') ||
    route.startsWith('/showcase') ||
    route.startsWith('showcase');
  const isTrainingBusiness = route.startsWith('/training/business') || route.startsWith('training/business');
  const isTrainingCreators = route.startsWith('/training/creators') || route.startsWith('training/creators');
  const isTrainingThankYou = route.startsWith('/training/thank-you') || route.startsWith('training/thank-you');
  const isBookStrategy = route.startsWith('/book-strategy-session') || route.startsWith('book-strategy-session');
  const isTrainingSelector =
    (route.startsWith('/training') || route.startsWith('training')) &&
    !isTrainingBusiness &&
    !isTrainingCreators &&
    !isTrainingThankYou;

  useEffect(() => {
    if (isClientAdmin) {
      document.title = 'Mobile Client Manager Admin PWA — AdVibe Studios';
      setPreferredPWALaunchRoute('/client-admin', 'AdVibe Admin');
    } else if (isAdmin) {
      document.title = 'Admin Portal — AdVibe Studios';
      setPreferredPWALaunchRoute('/admin', 'AdVibe Admin');
    } else if (isAffiliatePortal || isDownloadAffiliateApp) {
      document.title = 'Affiliate Partner Portal WebApp — AdVibe Studios';
      setPreferredPWALaunchRoute('/affiliate-portal', 'AdVibe Partner');
    } else if (isCustomerPortal || isDownloadCustomerApp) {
      document.title = 'Client Project Portal — AdVibe Studios';
      setPreferredPWALaunchRoute('/client-portal', 'AdVibe Client');
    } else if (isAppsHub) {
      document.title = 'Download AdVibe WebApps — Client & Affiliate Partner Apps';
    } else if (isBookStrategy) {
      document.title = 'Book Free Strategy Session — AdVibe Studios';
    } else if (isMonthlyContent) {
      document.title = 'Monthly AI Video Content Retainer — AdVibe Studios';
    } else if (isMiniSeries) {
      document.title = 'AI Promotional Mini Series — Branded Entertainment — AdVibe Studios';
    } else if (isTrainingBusiness) {
      document.title = 'AI Video Ads Training For Business Owners — AdVibe Studios';
    } else if (isTrainingCreators) {
      document.title = 'AI Cinematography Intensive For Creators — AdVibe Studios';
    } else if (isTrainingSelector) {
      document.title = 'Choose Your AI Video Track — AdVibe Studios';
    } else if (isTrainingThankYou) {
      document.title = 'Registration Received — AdVibe Studios';
    } else if (isWorkShowcase) {
      document.title = 'All Our Work — Official Studio Screening Room — AdVibe Studios';
    } else if (isCase) {
      document.title = 'AI Video Ads Breakdown — AdVibe Studios';
    } else {
      document.title = 'AdVibe Studio — AI Video Ads That Turn Attention Into Orders';
    }
  }, [
    isClientAdmin,
    isAdmin,
    isAffiliatePortal,
    isCustomerPortal,
    isAppsHub,
    isBookStrategy,
    isWorkShowcase,
    isCase,
    isMonthlyContent,
    isMiniSeries,
    isTrainingBusiness,
    isTrainingCreators,
    isTrainingSelector,
    isTrainingThankYou,
  ]);

  const downloadMode = isDownloadCustomerApp
    ? 'customer'
    : isDownloadAffiliateApp
    ? 'affiliate'
    : isDownloadAdminApp
    ? 'admin'
    : 'hub';

  return (
    <ThemeProvider route={route}>
      <StoreProvider>
        <ReferralProvider>
          <CountryProvider>
            <OfflineBanner />
            <TapRipple />
            <ErrorBoundary>
              <div className="theme-adaptive">
                {isClientAdmin ? (
                  <Suspense
                    fallback={
                      <div className="grid min-h-dvh place-items-center bg-[#faf9f4] text-[#111412]/60 font-mono text-xs">
                        Loading Mobile Client Manager…
                      </div>
                    }
                  >
                    <MobileClientAdminApp />
                  </Suspense>
                ) : isAdmin ? (
                  <Suspense
                    fallback={
                      <div className="grid min-h-dvh place-items-center bg-[#faf9f4] text-[#111412]/60 font-mono text-xs">
                        Loading admin…
                      </div>
                    }
                  >
                    <Admin />
                  </Suspense>
                ) : isAffiliatePortal ? (
                  <Suspense
                    fallback={
                      <div className="grid min-h-dvh place-items-center bg-[#faf9f4] text-[#111412]/60 font-mono text-xs">
                        Loading Affiliate Portal…
                      </div>
                    }
                  >
                    <AffiliatePortalPage />
                  </Suspense>
                ) : isCustomerPortal ? (
                  <Suspense
                    fallback={
                      <div className="grid min-h-dvh place-items-center bg-[#faf9f4] text-[#111412]/60 font-mono text-xs">
                        Loading Client Portal…
                      </div>
                    }
                  >
                    <CustomerPortalPage />
                  </Suspense>
                ) : isAppsHub ? (
                  <Suspense
                    fallback={
                      <div className="grid min-h-dvh place-items-center bg-[#faf9f4] text-[#111412]/60 font-mono text-xs">
                        Loading WebApps Download Center…
                      </div>
                    }
                  >
                    <AppDownloadHubPage mode={downloadMode} />
                  </Suspense>
                ) : isMonthlyContent ? (
                  <Suspense
                    fallback={
                      <div className="grid min-h-dvh place-items-center bg-[#07090c] text-white/60 font-mono text-xs">
                        Loading Monthly Retainer…
                      </div>
                    }
                  >
                    <MonthlyRetainerPage />
                  </Suspense>
                ) : isMiniSeries ? (
                  <Suspense
                    fallback={
                      <div className="grid min-h-dvh place-items-center bg-[#0b0e12] text-white/60 font-mono text-xs">
                        Loading Mini Series…
                      </div>
                    }
                  >
                    <MiniSeriesPage />
                  </Suspense>
                ) : isTrainingBusiness ? (
                  <Suspense
                    fallback={
                      <div className="grid min-h-dvh place-items-center bg-[#faf9f4] text-[#111412]/60 font-mono text-xs">
                        Loading Business Owner Training…
                      </div>
                    }
                  >
                    <BusinessSalesPage />
                  </Suspense>
                ) : isTrainingCreators ? (
                  <Suspense
                    fallback={
                      <div className="grid min-h-dvh place-items-center bg-[#faf9f4] text-[#111412]/60 font-mono text-xs">
                        Loading Creator Training…
                      </div>
                    }
                  >
                    <CreatorSalesPage />
                  </Suspense>
                ) : isTrainingSelector ? (
                  <Suspense fallback={<div className="min-h-dvh bg-[#faf9f4]" />}>
                    <TrainingSelector />
                  </Suspense>
                ) : isTrainingThankYou ? (
                  <Suspense fallback={<div className="min-h-dvh bg-[#faf9f4]" />}>
                    <TrainingThankYou />
                  </Suspense>
                ) : isWorkShowcase ? (
                  <Suspense
                    fallback={
                      <div className="grid min-h-dvh place-items-center bg-[#0a0c0f] text-white/60 font-mono text-xs">
                        Loading Studio Screening Room…
                      </div>
                    }
                  >
                    <WorkShowcasePage />
                  </Suspense>
                ) : isCase ? (
                  <Suspense fallback={<div className="min-h-dvh bg-[#faf9f4]" />}>
                    <AiVideoPage />
                  </Suspense>
                ) : (
                  <PublicSite />
                )}
              </div>
            </ErrorBoundary>
          </CountryProvider>
        </ReferralProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
