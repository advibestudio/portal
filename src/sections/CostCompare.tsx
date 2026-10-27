import { ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { ourRange, rangeText, withThe } from '@/lib/money';
import { Reveal } from '@/components/shared';

/**
 * "WHAT AI REPLACES · TYPICAL COSTS" — a small card under the packages that compares the typical
 * cost of one traditionally produced video ad with the price of one with us, in the visitor's currency,
 * and links to the full breakdown page. Your side of the comparison is read from your real prices;
 * the "traditional" range is an estimate you set per country (Admin → Website → Countries & Prices).
 */
export function CostCompare() {
  const { content } = useStore();
  const { country } = useCountry();
  const k = content.aiCompare;
  const ours = ourRange(content.offers, country);
  const hasTrad = country.tradHigh > 0 && country.tradLow > 0;
  if (!ours || !hasTrad) return null;

  const trad = rangeText({ low: country.tradLow, high: country.tradHigh }, country);
  const pct = Math.min(100, Math.max(3, (ours.high / country.tradHigh) * 100));
  return (
    <section className="sec cost-sec" aria-label="Cost comparison">
      <div className="wrap">
        <Reveal>
          <p className="cost-label">What AI replaces · typical costs</p>
          <div className="cost-card">
            <h3>{k.title}</h3>
            <div className="cost-row"><span>{k.tradLabel}</span><strong>{trad}</strong></div>
            <div className="cost-bar" aria-hidden="true"><i style={{ width: '100%' }} /></div>
            <div className="cost-row"><span>{k.aiLabel}</span><strong>{rangeText(ours, country)}</strong></div>
            <div className="cost-bar is-ours" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
            <p className="cost-body">{k.body}</p>
            <p className="cost-note">Typical market estimates for {withThe(country.name)}. Your quote may differ.</p>
            <a className="cost-link" href="#/ai-video">{k.linkText} <ArrowRight size={18} aria-hidden="true" /></a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

