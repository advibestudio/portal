import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, MessageCircle, Check, CalendarDays, Plus, Star, Package, Briefcase, Sparkles, Clapperboard, PartyPopper, Tv } from 'lucide-react';
import { useStore, waLink } from '@/lib/store';
import { assetUrl, fmtMoney, priceFor, unitNote, waNumberFor } from '@/lib/money';
import { useCountry } from '@/lib/country';
import { useEvents } from '@/lib/useEvents';
import { fmtEventDate } from '@/lib/events';
import { track } from '@/lib/tracking';
import type { Offer, PortfolioItem } from '@/content/types';
import { defaultCommercialOffers } from '@/content/commercialOffers';
import { Reveal, SecHead, EmLast, Collapse, VideoCard } from '@/components/shared';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';

const ArrowBtn = () => <span className="btn-arrow" aria-hidden="true"><ArrowRight size={18} strokeWidth={2.4} /></span>;
const TONES = ['peach', 'mint', 'butter', 'sky', 'lilac'];

/* ---------- PROBLEM ---------- */
export function Problem() {
  const { content } = useStore();
  return (
    <section className="sec" style={{ paddingBottom: 'clamp(40px,6vw,70px)' }}>
      <div className="wrap" style={{ maxWidth: 960 }}>
        <Reveal><h2 className="h-section" style={{ maxWidth: '22ch' }}><EmLast text={content.problem.heading} /></h2></Reveal>
        <div className="problem-lines">
          {content.problem.lines.map((line, i) => (
            <Reveal key={i} delay={i * 0.06}><p>{line}</p></Reveal>
          ))}
        </div>
        <Reveal delay={0.15}><p className="problem-end">{content.problem.transition}</p></Reveal>
      </div>
    </section>
  );
}

/* ---------- SERVICES ---------- */
const ICONS = [Package, Briefcase, Sparkles, Clapperboard, PartyPopper, Tv];
export function Services() {
  const { content } = useStore();
  return (
    <section id="services" className="sec">
      <div className="wrap">
        <SecHead label="What we create">Every kind of ad your feed is <em>missing.</em></SecHead>
        <ul className="tiles">
          {content.services.map((s, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={s.id} style={{ display: 'flex' }}>
                <Reveal delay={i * 0.05} className="tile-wrap" >
                  <article className={`tile tone-${TONES[i % TONES.length]}`} style={{ height: '100%' }}>
                    <span className="tile-icon"><Icon size={22} /></span>
                    <h3 className="h-tile">{s.title}</h3>
                    <p>{s.description}</p>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- CLIENT SPOTLIGHT (trust) ---------- */
export function ClientSpotlight({ onPlay }: { onPlay: (i: PortfolioItem) => void }) {
  const { content } = useStore();
  const k = content.client;
  const needle = k.matchName.trim().toLowerCase();
  const vids = needle
    ? content.portfolio.filter((p) => p.visible && p.client.toLowerCase().includes(needle)).sort((x, y) => x.order - y.order).slice(0, 3)
    : [];
  if (!k.name) return null;
  return (
    <section id="clients" className="sec" style={{ paddingTop: 0 }} aria-label={`Client spotlight: ${k.name}`}>
      <div className="wrap">
        <div className="spotlight">
          <Reveal className="spot-logo-wrap">
            <div className="spot-logo">
              <img src={assetUrl(k.logo)} alt={`${k.name} logo`} width={360} height={360} loading="lazy" decoding="async" />
            </div>
          </Reveal>
          <Reveal delay={0.08} className="spot-copy">
            <div className="spot-tags">
              {k.sector && <span className="pill-label" style={{ marginBottom: 0 }}>{k.sector}</span>}
              {k.badge && <span className="spot-badge"><Star size={13} fill="currentColor" aria-hidden="true" /> {k.badge}</span>}
            </div>
            <h2 className="h-section" style={{ maxWidth: '16ch' }}><EmLast text={k.heading} /></h2>
            <p className="lead">{k.body}</p>
            {k.points.length > 0 && (
              <ul className="spot-points">
                {k.points.map((p) => <li key={p}><Check size={18} strokeWidth={2.6} aria-hidden="true" />{p}</li>)}
              </ul>
            )}
          </Reveal>
          {vids.length > 0 && (
            <div className="spot-videos">
              {vids.map((v) => (
                <div key={v.id} style={{ width: v.orientation === 'vertical' ? 'min(200px, 44vw)' : 'min(340px, 80vw)' }}>
                  <VideoCard item={v} onPlay={onPlay} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- EVENTS / SEASONAL (driven by the calendar) ---------- */
export function Events({ onOrder }: { onOrder: (eventName: string) => void }) {
  const { content } = useStore();
  const { country } = useCountry();
  const events = useEvents();
  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="seasons">
          <Reveal>
            <span className="pill-label" style={{ background: '#ffffffa6' }}>Sales seasons</span>
            <h2 className="h-section" style={{ maxWidth: '16ch' }}><EmLast text={content.events.heading} /></h2>
            <p className="season-sub">{content.events.subheading}</p>
            <p className="season-body">{content.events.body}</p>
          </Reveal>
          {events.length > 0 && (
            <>
              <p className="season-caption"><span aria-hidden="true">{country.flag}</span> Coming up in {country.name}</p>
              <div className="season-grid">
                {events.map((e, i) => (
                  <Reveal key={e.id} delay={i * 0.05}>
                    <button onClick={() => onOrder(e.name)} className="season" style={{ width: '100%' }}>
                      <span>
                        <small><CalendarDays size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: -1 }} aria-hidden="true" />{fmtEventDate(e.date, true)}</small>
                        <strong>{e.name}</strong>
                        <small className="season-order">Order by {fmtEventDate(e.orderBy)}</small>
                      </span>
                      <ArrowRight size={20} aria-hidden="true" />
                    </button>
                  </Reveal>
                ))}
              </div>
            </>
          )}
          <Reveal delay={0.1}>
            <button onClick={() => onOrder('')} className="btn-studio" style={{ marginTop: 34 }}><span>{content.events.cta}</span><ArrowBtn /></button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- PRICING (prices follow the visitor's country) ---------- */
function OfferCard({ offer, onChoose }: { offer: Offer; onChoose: (o: Offer) => void }) {
  const { country } = useCountry();
  const [drawer, setDrawer] = useState<'none' | 'included' | 'good'>('none');
  const price = priceFor(offer, country) ?? 0;
  return (
    <div className={`offer anim-rise ${offer.featured ? 'is-featured' : ''}`}>
      {offer.badge && <span className="offer-badge">{offer.badge}</span>}
      <h3>{offer.name}</h3>
      <p className="offer-desc">{offer.description}</p>
      <p className="offer-price">{fmtMoney(price, country)}{offer.goal === 'monthly' && <small> /mo</small>}</p>
      <p className="offer-note">{unitNote(offer, country)}</p>
      <p className="offer-who">{offer.whoFor}</p>
      <ul className="offer-list">
        {offer.features.map((f) => <li key={f}><Check size={18} strokeWidth={2.6} />{f}</li>)}
      </ul>
      {(['included', 'good'] as const).map((d) => (
        <div key={d} className="drawer">
          <button onClick={() => setDrawer(drawer === d ? 'none' : d)} aria-expanded={drawer === d}>
            {d === 'included' ? "What's included" : 'Good to know'}
            <ChevronDown size={18} style={{ transform: drawer === d ? 'rotate(180deg)' : 'none' }} />
          </button>
          <Collapse open={drawer === d}>
            <ul>{(d === 'included' ? offer.included : offer.goodToKnow).map((x) => <li key={x}>· {x}</li>)}</ul>
          </Collapse>
        </div>
      ))}
      <div className="offer-spacer" />
      <button onClick={() => onChoose(offer)} className="btn-studio"><span>{offer.cta}</span><ArrowBtn /></button>
    </div>
  );
}

export function Pricing({ onChoose }: { onChoose: (o: Offer) => void }) {
  const { content } = useStore();
  const { country } = useCountry();
  const [goal, setGoal] = useState<'one' | 'test' | 'monthly'>('one');
  const secRef = useRef<HTMLElement>(null);

  // Only packages that have a price in this country are shown.
  // The monthly subscription is now its own flagship dedicated offer (Monthly Content Retainer).
  const available = useMemo(
    () => content.offers.filter((o) => o.active && o.goal !== 'monthly' && priceFor(o, country) !== undefined).sort((a, b) => a.order - b.order),
    [content.offers, country],
  );
  const goals = content.pricing.goals.filter((g) => g.id !== 'monthly' && available.some((o) => o.goal === g.id));
  const activeGoal = goals.find((g) => g.id === goal) ?? goals[0];
  const offers = available.filter((o) => o.goal === activeGoal?.id);

  // Tell Meta the visitor looked at the packages (once per country per visit).
  useEffect(() => {
    const el = secRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { track('ViewContent', { content_name: 'Packages', currency: country.currency }); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [country.code, country.currency]);

  return (
    <section id="pricing" className="sec" ref={secRef}>
      <div className="wrap">
        <SecHead label="Packages" lead={content.pricing.subheading}><EmLast text={content.pricing.heading} /></SecHead>
        {available.length === 0 ? (
          <div className="card-soft" style={{ maxWidth: 560 }}>
            <p style={{ fontWeight: 700 }}>Packages for {country.name} are coming soon.</p>
            <p style={{ marginTop: 6, color: 'rgb(var(--ink-2))' }}>Message us on WhatsApp and we will send you a quote.</p>
            <a className="btn-studio" style={{ marginTop: 14 }} href={waLink(waNumberFor(content.settings.whatsappNumber, country), `Hi ${content.settings.whatsappDisplay}, I'm in ${country.name} and want a video ad.`)} target="_blank" rel="noreferrer" onClick={() => track('Contact')}>
              <span>WhatsApp us</span><ArrowBtn />
            </a>
          </div>
        ) : (
          <>
            <Reveal delay={0.05}>
              <div className="goal-tabs" role="tablist" aria-label="Choose your goal">
                {goals.map((g) => (
                  <button key={g.id} role="tab" aria-selected={activeGoal?.id === g.id} onClick={() => setGoal(g.id)} className="goal">
                    <strong>{g.label}</strong><span>{g.blurb}</span>
                  </button>
                ))}
              </div>
            </Reveal>
            <div className={`offers ${offers.length > 1 ? '' : 'single'}`}>
              {offers.map((o) => <OfferCard key={`${country.code}-${o.id}`} offer={o} onChoose={onChoose} />)}
            </div>

            {/* Dedicated Monthly Retainer Bridge Callout */}
            <div style={{ marginTop: 24, padding: '18px 22px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(245,165,36,0.08), rgba(17,20,18,0.03))', border: '1px solid rgba(245,165,36,0.3)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <div>
                  <p style={{ margin: 0, fontSize: 14.5, color: 'rgb(var(--ink))', fontWeight: 700 }}>
                    Need consistent high-volume video production every month?
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgb(var(--ink-2))' }}>
                    Our flagship Monthly Content Retainer gives you 15 videos/month with dedicated creative direction.
                  </p>
                </div>
              </div>
              <a href="#/monthly-content" className="btn-studio is-sm" style={{ textDecoration: 'none' }}>
                <span>Explore Monthly Retainer (15 videos)</span>
                <ArrowBtn />
              </a>
            </div>

            {activeGoal?.id === 'test' && <p className="pricing-foot">One ad gives you one chance. Multiple ads give you data. {activeGoal.blurb}</p>}
            <p className="pricing-foot">Prices shown in {country.name} ({country.currency}).</p>
            <p className="pricing-foot" style={{ marginTop: 4, color: '#9e6203' }}>
              ✨ <strong>Partner Referral Promotion:</strong> Have an Advibe affiliate referral code? Apply it at checkout to claim <strong>5% off</strong> your first eligible project.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

/* ---------- WHY US ---------- */
export function WhyUs() {
  const { content } = useStore();
  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="why-wrap">
          <Reveal>
            <span className="pill-label">{content.whyUs.heading}</span>
            <h2 className="h-section" style={{ maxWidth: '16ch' }}><EmLast text={content.whyUs.statement} /></h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="chips" style={{ paddingTop: 8 }}>
              {content.whyUs.points.map((p, i) => (
                <span key={p} className="chip" style={{ ['--tone' as string]: `rgb(var(--${TONES[i % TONES.length]}))` }}>{p}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- PROCESS ---------- */
export function Process() {
  const { content } = useStore();
  return (
    <section id="process" className="sec">
      <div className="wrap">
        <SecHead label={content.process.heading}>From brief to finished ad in {content.settings.deliveryDays} <em>days.</em></SecHead>
        <ol className="steps">
          {content.process.steps.map((s, i) => (
            <li key={s.title} style={{ display: 'flex' }}>
              <Reveal delay={i * 0.06} className="step-wrap">
                <div className="step-card" style={{ height: '100%' }}>
                  <span className="step-num">Step {i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- TESTIMONIALS (BEFORE & AFTER ROI CAROUSEL) ---------- */
export function Testimonials({ onStrategy }: { onStrategy?: () => void }) {
  return <TestimonialCarousel onStrategy={onStrategy} />;
}

/* ---------- FAQ + AI NOTE ---------- */
function FaqItem({ id, q, a, open, setOpen, note = false }: { id: string; q: string; a: string; open: string | null; setOpen: (v: string | null) => void; note?: boolean }) {
  const isOpen = open === id;
  return (
    <div className={`faq-item ${isOpen ? 'is-open' : ''} ${note ? 'is-note' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}>
        <span>{q}</span>
        <span className="faq-icon"><Plus size={18} /></span>
      </button>
      <Collapse open={isOpen}><p className="faq-a">{a}</p></Collapse>
    </div>
  );
}

export function Faq() {
  const { content } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const faqs = content.faqs.filter((f) => f.visible);
  return (
    <section id="faq" className="sec" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <SecHead label="Questions" center>Before you <em>ask.</em></SecHead>
        <div className="faq">
          {faqs.map((f) => <FaqItem key={f.id} id={f.id} q={f.q} a={f.a} open={open} setOpen={setOpen} />)}
          <FaqItem id="ai-note" q={content.aiNote.title} a={content.aiNote.body} open={open} setOpen={setOpen} note />
        </div>
      </div>
    </section>
  );
}

/* ---------- FINAL CTA ---------- */
export function FinalCta({ onStrategy }: { onStrategy: () => void }) {
  const { content } = useStore();
  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="final">
          <Reveal>
            <h2 className="h-section"><EmLast text={content.finalCta.heading} /></h2>
            <p className="lead">{content.finalCta.subheading}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="final-cta">
              <button onClick={onStrategy} className="btn-studio"><span>Book a Free Strategy Session</span><ArrowBtn /></button>
              <a className="btn-ghost" href="#work">
                Watch Our Work
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- FOOTER ---------- */
export function Footer() {
  const { content } = useStore();
  const { country } = useCountry();
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="foot-grid">
          <div style={{ maxWidth: 320 }}>
            <p className="site-brand" style={{ color: 'rgb(var(--ink))' }}>{content.brand.name}</p>
            <p style={{ marginTop: 8 }}>{content.brand.tagline}</p>
          </div>
          <div className="foot-col">
            <h4>Contact</h4>
            <a href={`mailto:${content.settings.email}`}>{content.settings.email}</a>
            <a href={waLink(waNumberFor(content.settings.whatsappNumber, country), 'Hi!')} target="_blank" rel="noreferrer" onClick={() => track('Contact')}>WhatsApp</a>
          </div>
          <div className="foot-col">
            <h4>Explore</h4>
            {[
              ['Our Work', '#work'],
              ['Services', '#services'],
              ['Packages', '#pricing'],
              ['Monthly Retainer', '#/monthly-content'],
              ['How It Works', '#process'],
              ['AI Mini-Series', '#/promotional-mini-series'],
              ['Training', '#/training'],
            ].map(([l, h]) => (
              <a key={h} href={h}>
                {l}
              </a>
            ))}
          </div>
        </div>
        <p className="foot-legal">© {new Date().getFullYear()} {content.brand.name}. AI-assisted production, human-directed creative.</p>
      </div>
    </footer>
  );
}

/* ---------- COMMERCIAL OFFERS SHOWCASE (FLAGSHIP RETAINER & MINI SERIES) ---------- */
export function CommercialOffersShowcase() {
  const { content } = useStore();
  const { country } = useCountry();
  const retainer = content.commercialOffers?.['monthly-content'] || defaultCommercialOffers['monthly-content'];
  const miniSeries = content.commercialOffers?.['promotional-mini-series'] || defaultCommercialOffers['promotional-mini-series'];

  const retPrice = fmtMoney(retainer.pricesByCountry?.[country.code] ?? retainer.price ?? 250000, country);
  const msPrice = fmtMoney(miniSeries.pricesByCountry?.[country.code] ?? miniSeries.price ?? 300000, country);

  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <SecHead label="Flagship Programs" lead="For brands seeking consistent monthly video volume or original episodic branded entertainment.">
          Two Ways to Partner With Our <em>Studio.</em>
        </SecHead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20, textAlign: 'left' }}>
          {/* Retainer Card */}
          {retainer.showOnHomepage && (
            <div style={{ borderRadius: 28, background: '#fff', border: '1px solid rgb(var(--line))', padding: 'clamp(24px, 3.5vw, 36px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#b87508' }}>
                  {retainer.hero.eyebrow}
                </span>
                <h3 style={{ font: '800 clamp(22px, 2.5vw, 28px) / 1.15 var(--font-display)', color: 'rgb(var(--ink))', marginTop: 8 }}>
                  {retainer.name}
                </h3>
                <p style={{ marginTop: 10, fontSize: 14.5, color: 'rgb(var(--ink-2))', lineHeight: 1.55 }}>
                  {retainer.tagline}
                </p>
                <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgb(var(--line))', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ font: '800 clamp(28px, 3.5vw, 36px) / 1 var(--font-display)', color: 'rgb(var(--ink))' }}>{retPrice}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'rgb(var(--muted))' }}>/ mo · {retainer.monthlyVideoQuantity} videos</span>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <a
                  href="#/monthly-content"
                  className="btn-studio"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <span>Explore Monthly Retainer</span>
                  <ArrowBtn />
                </a>
              </div>
            </div>
          )}

          {/* Mini-Series Card */}
          {miniSeries.showOnHomepage && (
            <div style={{ borderRadius: 28, background: '#0d1117', border: '1px solid rgba(255,255,255,0.12)', padding: 'clamp(24px, 3.5vw, 36px)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#f5a524' }}>
                  {miniSeries.hero.eyebrow}
                </span>
                <h3 style={{ font: '800 clamp(22px, 2.5vw, 28px) / 1.15 var(--font-display)', color: '#fff', marginTop: 8 }}>
                  {miniSeries.name}
                </h3>
                <p style={{ marginTop: 10, fontSize: 14.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
                  {miniSeries.tagline}
                </p>
                <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ font: '800 clamp(28px, 3.5vw, 36px) / 1 var(--font-display)', color: '#fff' }}>{msPrice}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}>/ mo · {miniSeries.monthlyVideoQuantity} videos</span>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <a
                  href="#/promotional-mini-series"
                  className="btn-studio is-brand"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <span>Explore Mini Series</span>
                  <ArrowBtn />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
