import React from 'react';
import { ArrowRight, Sparkles, Film, Video, Calendar, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCountry } from '@/lib/country';
import { fmtMoney } from '@/lib/money';
import { defaultCommercialOffers } from '@/content/commercialOffers';

export function ChooseYourPathStrip() {
  const { content, activeCohort } = useStore();
  const { country } = useCountry();

  const retainer = content.commercialOffers?.['monthly-content'] || defaultCommercialOffers['monthly-content'];
  const miniSeries = content.commercialOffers?.['promotional-mini-series'] || defaultCommercialOffers['promotional-mini-series'];

  const retPriceNum = retainer.pricesByCountry?.[country.code] ?? retainer.price ?? 250000;
  const msPriceNum = miniSeries.pricesByCountry?.[country.code] ?? miniSeries.price ?? 300000;

  const retPrice = fmtMoney(retPriceNum, country);
  const msPrice = fmtMoney(msPriceNum, country);

  const cohortPriceObj = activeCohort?.prices?.[country.code] || activeCohort?.prices?.NG || { founding: 19997, regular: 29997 };
  const cohortPrice = fmtMoney(cohortPriceObj.founding, { symbol: country.symbol });

  const isCohortActive = activeCohort && (
    activeCohort.status === 'open' ||
    activeCohort.status === 'almost_full' ||
    activeCohort.status === 'final_seats'
  );

  return (
    <section className="sec" style={{ paddingTop: 'clamp(28px, 4vw, 48px)', paddingBottom: 'clamp(28px, 4vw, 48px)' }} aria-label="Choose your path">
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 3.5vw, 36px)' }}>
          <span className="pill-label" style={{ marginBottom: 10 }}>CHOOSE YOUR PATH</span>
          <h2 className="h-section" style={{ margin: '0 auto', maxWidth: '24ch' }}>
            Three ways to grow with <em>AdVibe Studios.</em>
          </h2>
          <p className="lead" style={{ margin: '10px auto 0', fontSize: 16 }}>
            Whether you want our creative studio to produce your monthly videos or you want to master AI video yourself.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 18,
          alignItems: 'stretch'
        }}>
          {/* Card 1: Monthly Content Retainer */}
          {retainer.showOnHomepage && (
            <div style={{
              borderRadius: 24,
              background: '#fff',
              border: '1px solid rgb(var(--line))',
              padding: 'clamp(22px, 3vw, 28px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 30px -18px rgba(17,20,18,0.12)',
              position: 'relative',
              textAlign: 'left'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b87508' }}>
                    <Video size={13} style={{ color: '#f5a524' }} />
                    <span>Monthly Retainer</span>
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: 999, background: 'rgba(17,20,18,0.06)', color: 'rgb(var(--ink-2))' }}>
                    15 videos/mo
                  </span>
                </div>

                <h3 style={{ font: '800 clamp(20px, 2.2vw, 24px) / 1.15 var(--font-display)', color: 'rgb(var(--ink))' }}>
                  Monthly Content Retainer
                </h3>
                <p style={{ marginTop: 8, fontSize: 14, color: 'rgb(var(--ink-2))', lineHeight: 1.55 }}>
                  For growing businesses that need high-volume, reliable promo videos every month without building an internal production team.
                </p>

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgb(var(--line))', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ font: '800 clamp(24px, 2.8vw, 30px) / 1 var(--font-display)', color: 'rgb(var(--ink))' }}>{retPrice}</span>
                  <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'rgb(var(--muted))' }}>/ month · 15 videos</span>
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <a
                  href="#/monthly-content"
                  className="btn-studio"
                  style={{ width: '100%', justifyContent: 'space-between', minHeight: 48, padding: '0 8px 0 20px', fontSize: 14.5 }}
                >
                  <span>Explore Monthly Retainer</span>
                  <span className="btn-arrow" style={{ width: 34, height: 34 }} aria-hidden="true">
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </span>
                </a>
              </div>
            </div>
          )}

          {/* Card 2: AI Promotional Mini Series */}
          {miniSeries.showOnHomepage && (
            <div style={{
              borderRadius: 24,
              background: '#0d1117',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: 'clamp(22px, 3vw, 28px)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 16px 36px -18px rgba(0,0,0,0.6)',
              position: 'relative',
              textAlign: 'left'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f5a524' }}>
                    <Film size={13} style={{ color: '#f5a524' }} />
                    <span>Branded Entertainment</span>
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                    Original Series
                  </span>
                </div>

                <h3 style={{ font: '800 clamp(20px, 2.2vw, 24px) / 1.15 var(--font-display)', color: '#fff' }}>
                  AI Promotional Mini Series
                </h3>
                <p style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
                  Stop making every post an ad. Create connected episodic storytelling with recurring characters that audiences look forward to watching.
                </p>

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ font: '800 clamp(24px, 2.8vw, 30px) / 1 var(--font-display)', color: '#fff' }}>{msPrice}</span>
                  <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}>/ month · 15 videos</span>
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <a
                  href="#/promotional-mini-series"
                  className="btn-studio is-brand"
                  style={{ width: '100%', justifyContent: 'space-between', minHeight: 48, padding: '0 8px 0 20px', fontSize: 14.5 }}
                >
                  <span>Explore Mini Series</span>
                  <span className="btn-arrow" style={{ width: 34, height: 34, background: '#111412', color: '#fff' }} aria-hidden="true">
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </span>
                </a>
              </div>
            </div>
          )}

          {/* Card 3: AI Cinematography Intensive Training */}
          <div style={{
            borderRadius: 24,
            background: 'linear-gradient(145deg, #181d22, #0b0d10)',
            border: isCohortActive ? '1px solid rgba(245,165,36,0.45)' : '1px solid rgba(255,255,255,0.12)',
            padding: 'clamp(22px, 3vw, 28px)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 16px 36px -18px rgba(0,0,0,0.6)',
            position: 'relative',
            textAlign: 'left'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f5a524' }}>
                  <Sparkles size={13} style={{ color: '#f5a524' }} />
                  <span>2-Week Live Intensive</span>
                </span>
                {isCohortActive && (
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: '#f5a524', color: '#000', textTransform: 'uppercase' }}>
                    Founding Cohort
                  </span>
                )}
              </div>

              <h3 style={{ font: '800 clamp(20px, 2.2vw, 24px) / 1.15 var(--font-display)', color: '#fff' }}>
                AI Cinematography Intensive
              </h3>
              <p style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
                Master AI cinematography and video creation. 6 live sessions, direct feedback, capstone film, certificate, and lifetime community.
              </p>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ font: '800 clamp(24px, 2.8vw, 30px) / 1 var(--font-display)', color: '#f5a524' }}>{cohortPrice}</span>
                <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}>· Founding seat (was {fmtMoney(cohortPriceObj.regular, { symbol: country.symbol })})</span>
              </div>
            </div>

            <div style={{ marginTop: 22 }}>
              <a
                href="#/training"
                className="btn-studio is-brand"
                style={{ width: '100%', justifyContent: 'space-between', minHeight: 48, padding: '0 8px 0 20px', fontSize: 14.5 }}
              >
                <span>Choose Track &amp; Enroll</span>
                <span className="btn-arrow" style={{ width: 34, height: 34, background: '#111412', color: '#fff' }} aria-hidden="true">
                  <ArrowRight size={16} strokeWidth={2.4} />
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
