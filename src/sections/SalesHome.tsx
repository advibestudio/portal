import { ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { fillTokens, offerVars, parseAccent, salesPrice } from '@/lib/sales';
import { defaultSalesPages } from '@/content/salesDefaults';
import { Reveal } from '@/components/shared';

/**
 * HOMEPAGE — "Studio plans": the two sales-page offers as two cards.
 * Everything here (intro, which offers show, blurbs, price, video count) comes from Admin → Sales Pages & Offers.
 * The price and video count are the SAME saved values the sales pages use.
 */
const TONES = ['peach', 'mint', 'butter', 'sky', 'lilac'];

export function useSalesHomeCards() {
  const { content } = useStore();
  const sp = content.salesPages || defaultSalesPages;
  const cards = (sp.offers || []).filter((o) => o.active && o.showOnHome);
  return { sp, cards, visible: sp.home.enabled && cards.length > 0 };
}

export function SalesHome() {
  const { content } = useStore();
  const { country, countries } = useCountry();
  const { sp, cards, visible } = useSalesHomeCards();
  if (!visible) return null;

  return (
    <section id="studio-plans" className="section sh-section">
      <div className="wrap">
        <Reveal>
          <div className="sh-head">
            <p className="sh-eyebrow">{sp.home.eyebrow}</p>
            <h2 className="h-section">
              {parseAccent(sp.home.heading).map((p, i) =>
                p.em ? <em key={i}>{p.t}</em> : <span key={i}>{p.t}</span>
              )}
            </h2>
            <p className="sh-body">{sp.home.body}</p>
          </div>
        </Reveal>
        <div className="sh-grid">
          {cards.map((o, idx) => {
            const price = salesPrice(o, country, countries, sp.settings.baseCountry);
            const v = offerVars(o, price, content.client?.name || 'AdVibe Studios');
            const series = o.kind === 'miniseries';
            return (
              <Reveal key={o.id} delay={idx * 0.08}>
                <a href={`#/${o.slug}`} className={`sh-card ${series ? 'is-series' : 'is-retainer'}`}>
                  <div className="sh-art" aria-hidden="true">
                    {series ? (
                      <div className="sh-film">
                        {[0, 1, 2].map((i) => (
                          <span key={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="sh-tiles">
                        {Array.from({ length: Math.min(o.quantity, 15) }, (_, i) => (
                          <i key={i} className={`tone-${TONES[i % 5]}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <h3>{o.shortLabel}</h3>
                  <p className="sh-blurb">{fillTokens(o.homeCard?.blurb || '', v)}</p>
                  <div className="sh-foot">
                    <p className="sh-price">
                      <strong>{price.text}</strong>{' '}
                      <span>
                        per {o.period} · {o.quantity} videos
                      </span>
                    </p>
                    <span className="sh-cta">
                      {o.homeCard?.cta || 'View Offer'}
                      <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
