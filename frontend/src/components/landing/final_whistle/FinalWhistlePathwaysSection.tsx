'use client'

import type { CSSProperties } from 'react'
import ProtectedNavButton from '@/components/auth/ProtectedNavButton'
import { Button } from '@/components/ui/Button/Button'
import { appConfig } from '@/config'
import { useFwSectionReveal } from '@/hooks/useFwSectionReveal'
import { routeRequiresAuth } from '@/lib/auth/guards'
import './final-whistle-pathways.css'

const OPS_MARKS = ['01', '02', '03', '04', '05', '06']

export default function FinalWhistlePathwaysSection() {
  const { ref, visible } = useFwSectionReveal()
  const pathways = appConfig.descriptions.pathways

  if (!pathways?.features?.length) return null

  const marketCta = pathways.marketCta
  const marketHref = marketCta ? appConfig.domain.routes[marketCta.route] : '#'

  return (
    <section
      ref={ref}
      className={`fw-transfer${visible ? ' visible' : ''}`}
      aria-label="Collect, trade, and shape your squad"
    >
      <div className="landing-shell fw-transfer__shell">
        <header className="fw-transfer__header">
          <p className="fw-transfer__kicker">TRANSFER WINDOW · SECTION 06</p>
          <h2 className="landing-section-title fw-transfer__title">{pathways.title}</h2>
          <p className="landing-section-lead fw-transfer__lead">{pathways.description}</p>
        </header>

        <ul className="fw-transfer__ops" role="list" aria-label="Market operations">
          {pathways.features.map((feature, index) => (
            <li
              key={feature.id}
              className="fw-transfer__op"
              style={{ '--op-glow': feature.glowColor } as CSSProperties}
            >
              <article className="fw-transfer__op-card">
                <span className="fw-transfer__op-mark" aria-hidden="true">
                  {OPS_MARKS[index] ?? String(index + 1).padStart(2, '0')}
                </span>

                <div className="fw-transfer__op-media">
                  <img
                    src={feature.image}
                    alt=""
                    className="fw-transfer__op-image"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="fw-transfer__op-scan" aria-hidden="true" />
                </div>

                <div className="fw-transfer__op-copy">
                  <h3 className="fw-transfer__op-title">{feature.title}</h3>
                  <p className="fw-transfer__op-desc">{feature.description}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {pathways.tiers.length > 0 ? (
          <div className="fw-transfer__depth">
            <p className="fw-transfer__depth-label">Squad Depth · Print Spectrum</p>
            <ul className="fw-transfer__tiers" role="list" aria-label="Print tiers">
              {pathways.tiers.map((tier) => (
                <li
                  key={tier.id}
                  className="fw-transfer__tier"
                  style={{ '--tier-glow': tier.glowColor } as CSSProperties}
                >
                  <article className="fw-transfer__tier-card">
                    <span className="fw-transfer__tier-rarity">{tier.rarityLabel}</span>
                    <h3 className="fw-transfer__tier-title">{tier.title}</h3>
                    <p className="fw-transfer__tier-desc">{tier.description}</p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {marketCta ? (
          <aside className="fw-transfer__cta" aria-label="Market call to action">
            <div className="fw-transfer__cta-rail" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="fw-transfer__cta-body">
              <p className="fw-transfer__cta-tag">LIVE LISTINGS</p>
              <p className="fw-transfer__cta-lead">{marketCta.description}</p>

              {routeRequiresAuth(marketCta.route) ? (
                <ProtectedNavButton
                  label={marketCta.buttonLabel}
                  href={marketHref}
                  variant="primary"
                  className="fw-transfer__cta-btn"
                />
              ) : (
                <Button
                  as="link"
                  href={marketHref}
                  variant="primary"
                  size="lg"
                  className="fw-transfer__cta-btn"
                >
                  {marketCta.buttonLabel}
                </Button>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
