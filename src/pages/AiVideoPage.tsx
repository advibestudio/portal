import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, Briefcase, Check, CheckCircle2, Clapperboard, Landmark, Home, PartyPopper, Package, Play, ShoppingBag, Sparkles, Target, TrendingUp, Tv, UtensilsCrossed, Video, X, AlertTriangle } from 'lucide-react';
import '@/styles/casestudy.css';
import { useStore } from '@/lib/store';
import { CountryProvider, useCountry } from '@/lib/country';
import { fmtMoney, ourRange, priceFor, rangeText, unitNote, withThe } from '@/lib/money';
import { aiPage as T, fill } from '@/content/aiPage';
import { Lightbox, VideoCard } from '@/components/shared';
import type { PortfolioItem } from '@/content/types';

const StrategyModal = lazy(() => import('@/components/StrategyModal').then((m) => ({ default: m.StrategyModal })));

const joinList = (a: string[]) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const STEP_ICONS = [Target, BarChart3, Sparkles, Video, TrendingUp, CheckCircle2];
const SERVICE_ICONS = [Package, Briefcase, Sparkles, Clapperboard, PartyPopper, Tv];
const AUD_ICONS = [ShoppingBag, UtensilsCrossed, Briefcase, Landmark, Home, PartyPopper];

function Head({ part, title }: { part: number; title: string }) {
  return (
    <>
      <span className="cs-part">PART {String(part).padStart(2, '0')}</span>
      <h2 className="cs-h2">{title}</h2>
      <div className="cs-rule" />
    </>
  );
}

function Page() {
  const { content } = useStore();
  const { country, countries } = useCountry();
  const [playing, setPlaying] = useState<PortfolioItem | null>(null);
  const [strategy, setStrategy] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    document.title = `AI video ads: the full breakdown — ${content.brand.name}`;
    document.body.classList.add('is-public');
    return () => document.body.classList.remove('is-public');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const days = content.settings.deliveryDays;
  const vars = useMemo(() => ({
    days, country: withThe(country.name), client: content.client.name, brand: content.brand.name, year: new Date().getFullYear(),
    countries: joinList(countries.map((c) => withThe(c.name))),
  }), [days, country.name, content.client.name, content.brand.name, countries]);
  const f = (s: string) => fill(s, vars);

  const ours = ourRange(content.offers, country);
  const hasTrad = country.tradLow > 0 && country.tradHigh > 0;
  const videos = content.portfolio.filter((p) => p.visible).sort((a, b) => (a.orientation === 'vertical' ? 0 : 1) - (b.orientation === 'vertical' ? 0 : 1) || a.order - b.order).slice(0, 4);
  const stats = [...content.hero.stats, { value: String(countries.length), label: countries.length === 1 ? 'country served' : 'countries served' }];
  const backHref = `#/${country.slug}`;
  const jump = (where: string) => { try { sessionStorage.setItem('advibe.jump', where); } catch { /* ignore */ } };

  // one featured package per goal, only those sold in this country
  const goals = (['one', 'test', 'monthly'] as const).map((g) => content.offers
    .filter((o) => o.active && o.goal === g && priceFor(o, country) !== undefined)
    .sort((a, b) => a.order - b.order)[0]).filter(Boolean);

  return (
    <div className="studio cs">
      <header className="cs-top">
        <div className="cs-wrap">
          <a href={backHref} onClick={() => jump('top')}><ArrowLeft size={16} aria-hidden="true" /> {T.topBack}</a>
          <span className="cs-top-title">{T.topTitle}</span>
          <a href={backHref} onClick={() => jump('work')}>{T.topAll}</a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="cs-hero">
          <div className="cs-wrap">
            <span className="cs-chip">{T.chip}</span>
            <h1 className="cs-h1">{T.headline} <span>{T.headlineAccent}</span></h1>
            <p className="cs-lead">{f(T.lead)}</p>
            <div className="cs-stats">
              {stats.map((s) => <div className="cs-stat" key={s.label}><b>{s.value}</b><span>{s.label}</span></div>)}
            </div>
          </div>
        </section>

        {/* PART 01 — the problem */}
        <section className="cs-sec">
          <div className="cs-wrap">
            <Head part={1} title={T.problemTitle} />
            <div className="cs-grid c2">
              <div className="cs-card">
                <div className="cs-card-h"><AlertTriangle size={20} aria-hidden="true" /> {T.realityHeading}</div>
                <ul className="cs-list bad">
                  {content.problem.lines.map((l) => <li key={l}><X size={14} aria-hidden="true" />{l}</li>)}
                </ul>
                <p className="cs-result"><b>{T.resultLabel}</b> {content.problem.transition}</p>
              </div>
              <div className="cs-card">
                <div className="cs-card-h"><Sparkles size={20} aria-hidden="true" /> {T.doHeading}</div>
                <p className="cs-sub">{T.doPartOne}</p>
                <ul className="cs-list">{content.services.map((s) => <li key={s.id}><CheckCircle2 size={17} aria-hidden="true" />{s.title}</li>)}</ul>
                <p className="cs-sub">{T.doPartTwo}</p>
                <ul className="cs-list">{content.process.steps.map((s) => <li key={s.title}><CheckCircle2 size={17} aria-hidden="true" />{s.title}</li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        {/* PART 02 — what we create + videos */}
        {content.services.length > 0 && (
          <section className="cs-sec">
            <div className="cs-wrap">
              <Head part={2} title={T.createTitle} />
              <div className="cs-grid c3">
                {content.services.map((s, i) => {
                  const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
                  return <div className="cs-card" key={s.id}><Icon className="cs-icon" aria-hidden="true" /><h3>{s.title}</h3><p className="cs-p">{s.description}</p></div>;
                })}
              </div>
              {videos.length > 0 && (
                <div className="cs-action">
                  <p className="cs-action-h"><Play size={16} aria-hidden="true" /> {T.actionHeading}</p>
                  <div className="cs-videos">
                    {videos.map((v) => <VideoCard key={v.id} item={v} onPlay={setPlaying} />)}
                  </div>
                  <div className="cs-more"><a href={backHref} onClick={() => jump('work')}>{T.actionAll} <ArrowRight size={16} aria-hidden="true" /></a></div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* PART 03 — how it works */}
        <section className="cs-sec">
          <div className="cs-wrap">
            <Head part={3} title={T.howTitle} />
            <div className="cs-steps">
              {content.process.steps.map((s, i) => {
                const Icon = STEP_ICONS[i % STEP_ICONS.length];
                return (
                  <div className="cs-step" key={s.title}>
                    <span className="cs-num">{String(i + 1).padStart(2, '0')}</span>
                    <div><h3><Icon size={20} aria-hidden="true" />{s.title}</h3><p>{s.description}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PART 04 — who it's for */}
        <section className="cs-sec">
          <div className="cs-wrap">
            <Head part={4} title={T.forTitle} />
            <div className="cs-grid c3">
              {T.audiences.map((a, i) => {
                const Icon = AUD_ICONS[i % AUD_ICONS.length];
                return (
                  <div className="cs-card" key={a.title}>
                    <Icon className="cs-icon" aria-hidden="true" />
                    <h3>{a.title}</h3>
                    <ul className="cs-list" style={{ marginTop: 22 }}>{a.points.map((p) => <li key={p}><CheckCircle2 size={16} aria-hidden="true" />{p}</li>)}</ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PART 05 — savings */}
        <section className="cs-sec">
          <div className="cs-wrap">
            <Head part={5} title={T.saveTitle} />
            <div className="cs-stack">
              <div className="cs-card">
                <div className="cs-card-h">{T.costHeading}</div>
                <div className="cs-scroll">
                  <table className="cs-table">
                    <thead><tr><th>{T.colItem}</th><th>{T.colTrad}</th><th>{T.colAi}</th></tr></thead>
                    <tbody>
                      {ours && hasTrad && (
                        <tr><td>Video production</td><td>{rangeText({ low: country.tradLow, high: country.tradHigh }, country)} / video</td><td>{rangeText(ours, country)} / video</td></tr>
                      )}
                      {T.costRows.map((r) => <tr key={r.item}><td>{r.item}</td><td>{r.trad}</td><td>{r.ours}</td></tr>)}
                    </tbody>
                  </table>
                </div>
                <div className="cs-banner">{T.costBanner}</div>
                <p className="cs-note">{f(T.costNote)}</p>
              </div>
              <div className="cs-card">
                <div className="cs-card-h">{T.timeHeading}</div>
                <div className="cs-scroll">
                  <table className="cs-table">
                    <thead><tr><th>{T.colTask}</th><th>{T.colTrad}</th><th>{T.colAi}</th></tr></thead>
                    <tbody>
                      {T.timeRows.map((r) => <tr key={r.task}><td>{r.task}</td><td>{r.trad}</td><td>{r.ours}</td></tr>)}
                      <tr className="total"><td>{T.timeTotal.task}</td><td>{f(T.timeTotal.trad)}</td><td>{f(T.timeTotal.ours)}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="cs-boxes">
                  {T.timeBoxes.map((b) => <div className="cs-box" key={b.small}><b>{f(b.big)}</b><span>{b.small}</span></div>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PART 06 — everything you get (real packages, real prices for this country) */}
        {goals.length > 0 && (
          <section className="cs-sec">
            <div className="cs-wrap">
              <Head part={6} title={T.getTitle} />
              <div className="cs-grid c3">
                {goals.map((o) => (
                  <div className="cs-card" key={o.id}>
                    <div className="cs-card-h">{T.getGoalNames[o.goal] ?? o.name.toUpperCase()}</div>
                    <p className="cs-get-price">{fmtMoney(priceFor(o, country) ?? 0, country)}{o.goal === 'monthly' && <small> /mo</small>} <small>· {unitNote(o, country)}</small></p>
                    <ul className="cs-list">{o.features.map((x) => <li key={x}><CheckCircle2 size={17} aria-hidden="true" />{x}</li>)}</ul>
                    <p className="cs-get-foot">{o.whoFor}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PART 07 — why different */}
        <section className="cs-sec">
          <div className="cs-wrap">
            <Head part={goals.length ? 7 : 6} title={T.whyTitle} />
            <div className="cs-grid c3">
              {T.why.filter((w) => content.client.name || !w.body.includes('{client}')).map((w, i) => (
                <div className="cs-card" key={w.title}>
                  <span className="cs-num" style={{ marginBottom: 22 }}>{String(i + 1).padStart(2, '0')}</span>
                  <h3>{w.title}</h3>
                  <p className="cs-p">{f(w.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* closing call to action */}
        <section className="cs-cta">
          <div className="cs-wrap">
            <h2>{T.ctaHeading}</h2>
            <p>{T.ctaText}</p>
            <button className="btn-studio is-wrap" onClick={() => setStrategy(true)} style={{ marginInline: 'auto' }}>
              <span>{content.hero.primaryCta}</span>
              <span className="btn-arrow" aria-hidden="true"><ArrowRight size={18} strokeWidth={2.4} /></span>
            </button>
            <div className="cs-micro">{T.ctaMicro.map((m) => <span key={m} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Check size={14} aria-hidden="true" />{m}</span>)}</div>
          </div>
        </section>
      </main>

      <footer className="cs-foot"><div className="cs-wrap">{f(T.footer)}</div></footer>

      <Lightbox item={playing} onClose={() => setPlaying(null)} />
      {strategy && <Suspense fallback={null}><StrategyModal onClose={() => setStrategy(false)} /></Suspense>}
    </div>
  );
}

export default function AiVideoPage() {
  return <CountryProvider><Page /></CountryProvider>;
}
