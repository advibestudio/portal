import { lazy, Suspense, useEffect, useState } from 'react';
import type { PortfolioItem, Offer } from '@/content/types';
import { useStore } from '@/lib/store';
import { CountryProvider } from '@/lib/country';
import { Nav, Hero, Proof, Showcase, StickyBar } from '@/sections/chrome';
import { Problem, Services, Events, Pricing, WhyUs, Process, Testimonials, Faq, FinalCta, Footer, ClientSpotlight, CommercialOffersShowcase } from '@/sections/sections';
import { CostCompare } from '@/sections/CostCompare';
import { Lightbox } from '@/components/shared';
import { ChooseYourPathStrip } from '@/components/ChooseYourPathStrip';

// The order form and the "just started" pop-ups are separate small downloads, fetched quietly
// AFTER the page is up, so they never slow down the first load.
const loadOrderModal = () => import('@/components/OrderModal').then((m) => ({ default: m.OrderModal }));
const OrderModal = lazy(loadOrderModal);
const LivePopups = lazy(() => import('@/components/LivePopups'));
const StrategyModal = lazy(() => import('@/components/StrategyModal').then((m) => ({ default: m.StrategyModal })));

function Page() {
  const { content } = useStore();
  const sec = content.sections; // the on/off switches from Admin → Website → Sections
  const [playing, setPlaying] = useState<PortfolioItem | null>(null);
  const [orderOffer, setOrderOffer] = useState<Offer | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderEvent, setOrderEvent] = useState<string>('');
  const [popupsReady, setPopupsReady] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);

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

  const openOrder = (offer?: Offer, eventName = '') => {
    setOrderOffer(offer ?? null);
    setOrderEvent(eventName);
    setOrderOpen(true);
  };

  return (
    <div className="studio" style={{ minHeight: '100dvh' }}>
      <Nav onOrder={() => openOrder()} />
      <main>
        <Hero onOrder={() => openOrder()} onStrategy={() => setStrategyOpen(true)} onPlay={setPlaying} />
        <ChooseYourPathStrip />
        {sec.proof && <Proof />}
        {sec.showcase && <Showcase onPlay={setPlaying} />}
        {sec.clients && <ClientSpotlight onPlay={setPlaying} />}
        {sec.problem && <Problem />}
        {sec.services && <Services />}
        <CommercialOffersShowcase />
        {sec.events && <Events onOrder={(ev) => openOrder(undefined, ev)} />}
        <Pricing onChoose={(o) => openOrder(o)} />
        {sec.aiCompare && <CostCompare />}
        {sec.whyUs && <WhyUs />}
        {sec.process && <Process />}
        {sec.testimonials && <Testimonials />}
        {sec.faq && <Faq />}
        {sec.finalCta && <FinalCta onStrategy={() => setStrategyOpen(true)} />}
      </main>
      <Footer />
      <StickyBar onStrategy={() => setStrategyOpen(true)} />
      <Lightbox item={playing} onClose={() => setPlaying(null)} />
      {sec?.liveToasts !== false && (
        <Suspense fallback={null}><LivePopups paused={orderOpen || Boolean(playing)} /></Suspense>
      )}
      {strategyOpen && <Suspense fallback={null}><StrategyModal onClose={() => setStrategyOpen(false)} /></Suspense>}
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
