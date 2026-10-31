import { lazy, Suspense, useEffect, useState } from 'react';
import type { PortfolioItem, Offer } from '@/content/types';
import { useStore } from '@/lib/store';
import { CountryProvider } from '@/lib/country';
import { Nav, Hero, Proof, Showcase, StickyBar } from '@/sections/chrome';
import { Problem, Services, Events, Pricing, WhyUs, Process, Testimonials, Faq, FinalCta, Footer, ClientSpotlight, CommercialOffersShowcase } from '@/sections/sections';
import { CostCompare } from '@/sections/CostCompare';
import { SalesHome } from '@/sections/SalesHome';
import { Lightbox } from '@/components/shared';
import { ChooseYourPathStrip } from '@/components/ChooseYourPathStrip';

// The order form and the "just started" pop-ups are separate small downloads, fetched quietly
// AFTER the page is up, so they never slow down the first load.
const loadOrderModal = () => import('@/components/OrderModal').then((m) => ({ default: m.OrderModal }));
const OrderModal = lazy(loadOrderModal);
const LivePopups = lazy(() => import('@/components/LivePopups'));
const StrategyModal = lazy(() => import('@/components/StrategyModal').then((m) => ({ default: m.StrategyModal })));

import { captureReferralFromUrl } from '@/lib/referral';
import { captureInitialChannel } from '@/lib/quizEngine';

function Page() {
  const { content } = useStore();
  const sec = content.sections; // the on/off switches from Admin → Website → Sections
  const [playing, setPlaying] = useState<PortfolioItem | null>(null);
  const [orderOffer, setOrderOffer] = useState<Offer | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderEvent, setOrderEvent] = useState<string>('');
  const [popupsReady, setPopupsReady] = useState(false);
  const [strategyContext, setStrategyContext] = useState<{ offerId?: string; offerTitle?: string }>({});
  const [strategyOpen, setStrategyOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const h = window.location.hash || '';
    const p = window.location.pathname || '';
    return h.includes('book-strategy-session') || p.includes('book-strategy-session');
  });

  // Automatically capture and preserve any affiliate referral parameter and initial channel upon landing
  useEffect(() => {
    captureInitialChannel();
    captureReferralFromUrl(content.affiliates, content.referralSettings);
  }, [content.affiliates, content.referralSettings]);

  useEffect(() => {
    const checkStrategyUrl = () => {
      const h = window.location.hash || '';
      const p = window.location.pathname || '';
      if (h.includes('book-strategy-session') || p.includes('book-strategy-session')) {
        setStrategyContext({ offerId: 'strategy', offerTitle: 'Free Strategy Session' });
        setStrategyOpen(true);
      }
    };
    window.addEventListener('hashchange', checkStrategyUrl);
    window.addEventListener('popstate', checkStrategyUrl);
    return () => {
      window.removeEventListener('hashchange', checkStrategyUrl);
      window.removeEventListener('popstate', checkStrategyUrl);
    };
  }, []);

  useEffect(() => {
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const t = idle ? idle(() => { void loadOrderModal(); }) : window.setTimeout(() => { void loadOrderModal(); }, 2500);
    const p = window.setTimeout(() => setPopupsReady(true), 1500);
    return () => { if (!idle) clearTimeout(t); clearTimeout(p); };
  }, []);

  // Coming back from the "AI video ads" page: jump to the top, or to the work gallery.
  useEffect(() => {
    let where = '';
    try { where = sessionStorage.getItem('advibe.jump') ?? ''; sessionStorage.removeItem('advibe.jump'); } catch { /* ignore */ }
    if (where === 'top') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    if (where === 'work') setTimeout(() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }), 250);
  }, []);

  useEffect(() => {
    document.body.classList.add('is-public');
    return () => document.body.classList.remove('is-public');
  }, []);

  const openStrategy = (offer?: Offer, customTitle?: string) => {
    setStrategyContext({
      offerId: offer?.id || 'strategy',
      offerTitle: customTitle || offer?.name || 'Free Strategy Session',
    });
    setStrategyOpen(true);
  };

  const openOrder = (offer?: Offer, eventName = '') => {
    // Launch the unified Service Discovery experience with the selected package/event context
    openStrategy(offer, eventName ? `${eventName} Campaign` : offer?.name);
  };

  return (
    <div className="studio" style={{ minHeight: '100dvh' }}>
      <Nav onOrder={() => openStrategy()} onStrategy={() => openStrategy()} />
      <main>
        <Hero onOrder={() => openStrategy()} onStrategy={() => openStrategy()} onPlay={setPlaying} />
        <ChooseYourPathStrip />
        {sec.proof && <Proof />}
        {sec.showcase && <Showcase onPlay={setPlaying} />}
        {sec.clients && <ClientSpotlight onPlay={setPlaying} />}
        <SalesHome />
        {sec.problem && <Problem />}
        {sec.services && <Services />}
        <CommercialOffersShowcase />
        {sec.events && <Events onOrder={(ev) => openStrategy(undefined, ev ? `${ev} Campaign` : undefined)} />}
        <Pricing onChoose={(o) => openStrategy(o)} />
        {sec.aiCompare && <CostCompare />}
        {sec.whyUs && <WhyUs />}
        {sec.process && <Process />}
        {sec.testimonials && <Testimonials onStrategy={() => openStrategy()} />}
        {sec.faq && <Faq />}
        {sec.finalCta && <FinalCta onStrategy={() => openStrategy()} />}
      </main>
      <Footer />
      <StickyBar onStrategy={() => openStrategy()} />
      <Lightbox item={playing} onClose={() => setPlaying(null)} />
      {sec?.liveToasts !== false && (
        <Suspense fallback={null}><LivePopups paused={orderOpen || strategyOpen || Boolean(playing)} /></Suspense>
      )}
      {strategyOpen && (
        <Suspense fallback={null}>
          <StrategyModal
            onClose={() => setStrategyOpen(false)}
            offerId={strategyContext.offerId}
            offerTitle={strategyContext.offerTitle}
          />
        </Suspense>
      )}
      {orderOpen && (
        <Suspense fallback={<div className="overlay"><div className="modal" style={{ textAlign: 'center', color: 'rgb(var(--muted))' }}>Loading…</div></div>}>
          <OrderModal
            key={`${orderOffer?.id ?? 'none'}-${orderEvent}`}
            offer={orderOffer}
            eventName={orderEvent}
            onClose={() => setOrderOpen(false)}
            onPickOffer={() => {
              setOrderOpen(false);
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function PublicSite() {
  return (
    <CountryProvider>
      <Page />
    </CountryProvider>
  );
}
