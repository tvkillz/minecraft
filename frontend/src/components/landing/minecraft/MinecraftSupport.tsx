'use client'

import { useMemo, type CSSProperties } from 'react'
import ImageCrossfade from '@/components/ui/ImageCrossfade/ImageCrossfade'
import { appConfig } from '@/config'
import { mcHref } from './mc'
import { useSectionVisible } from './useSectionVisible'
import './sections.css'

const FUND_IDS = new Set(['buy-rank', 'buy-coins'])

const FUND_KICKER: Record<string, string> = {
  'buy-rank': 'Stays forever',
  'buy-coins': 'Spends in-game',
}

function fundHref(featureId: string): string {
  if (featureId === 'buy-rank') return mcHref('ranks')
  if (featureId === 'buy-coins') return mcHref('coins')
  return '#'
}

export default function MinecraftSupport() {
  const pathways = appConfig.descriptions.pathways
  const { ref, visible } = useSectionVisible<HTMLElement>()

  const funds = useMemo(() => {
    const features = pathways?.features ?? []
    const picked = features.filter((feature) => FUND_IDS.has(feature.id))
    return picked.length ? picked : features.slice(-2)
  }, [pathways])

  const poster =
    appConfig.descriptions.finalCta.backgroundImage || funds.find((fund) => fund.image)?.image || ''

  if (!pathways || funds.length === 0) return null

  return (
    <section
      ref={ref}
      className={`mc-section mc-support${visible ? ' mc-section--visible' : ''}`}
      aria-label="Server upkeep"
    >
      <div className="mc-section__bg" aria-hidden="true">
        {poster ? (
          <ImageCrossfade
            src={poster}
            className="mc-support__bg-fade"
            imageClassName="mc-support__bg-image"
            durationMs={720}
            zoom={false}
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="mc-section__wash" />
        <div className="mc-section__vignette" />
      </div>

      <div className="landing-shell mc-section__stage mc-support__stage">
        <header className="mc-support__masthead">
          <p className="mc-support__eyebrow">The upkeep</p>
          <h2 className="mc-support__title">{pathways.title}</h2>
          <p className="mc-support__lead">{pathways.description}</p>
        </header>

        <div className="mc-support__funds">
          {funds.map((fund) => (
            <a
              key={fund.id}
              className="mc-support__pledge"
              href={fundHref(fund.id)}
              style={{ '--tile-glow': fund.glowColor } as CSSProperties}
            >
              <span className="mc-support__pledge-art" aria-hidden="true">
                {fund.image ? <img src={fund.image} alt="" /> : null}
              </span>
              <span className="mc-support__pledge-copy">
                <span className="mc-support__pledge-kicker">
                  {FUND_KICKER[fund.id] ?? 'Store'}
                </span>
                <strong className="mc-support__pledge-title">{fund.title}</strong>
                <span className="mc-support__pledge-text">{fund.description}</span>
              </span>
            </a>
          ))}
        </div>

        {pathways.tiers.length > 0 ? (
          <ol className="mc-support__path" aria-label="Rank path">
            {pathways.tiers.map((tier) => (
              <li
                key={tier.id}
                className="mc-support__rung"
                style={{ '--tile-glow': tier.glowColor } as CSSProperties}
              >
                <span className="mc-support__rung-mark">{tier.rarityLabel}</span>
                <strong className="mc-support__rung-title">{tier.title}</strong>
                <span className="mc-support__rung-text">{tier.description}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {pathways.marketCta ? (
          <p className="mc-support__close">
            <button type="button" className="mc-cta-chip" aria-disabled="true">
              {pathways.marketCta.buttonLabel}
            </button>
          </p>
        ) : null}
      </div>
    </section>
  )
}
