'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import ImageCrossfade from '@/components/ui/ImageCrossfade/ImageCrossfade'
import { appConfig } from '@/config'
import { mcHref } from './mc'
import { useSectionVisible } from './useSectionVisible'
import './sections.css'

function stepHref(featureId: string, storeHref: string): string {
  const discord = appConfig.descriptions.footer?.social?.find((item) => item.id === 'discord')
  if (featureId === 'join-discord' && discord?.href) return discord.href
  if (featureId === 'buy-rank') return mcHref('ranks')
  if (featureId === 'buy-coins') return mcHref('coins')
  return storeHref
}

export default function MinecraftSupport() {
  const pathways = appConfig.descriptions.pathways
  const { hero } = appConfig.descriptions
  const { ref, visible } = useSectionVisible<HTMLElement>()
  const [activeId, setActiveId] = useState(pathways?.features?.[0]?.id ?? '')
  const [copied, setCopied] = useState(false)

  const storeHref = pathways?.marketCta?.route
    ? appConfig.domain.routes[pathways.marketCta.route]
    : appConfig.domain.routes.portalStore

  const active = useMemo(
    () => pathways?.features.find((feature) => feature.id === activeId) ?? pathways?.features[0],
    [pathways, activeId],
  )

  if (!pathways?.features?.length || !active) return null

  const isCopyIp = active.id === 'copy-ip' && Boolean(hero.joinIp)
  const actionHref = stepHref(active.id, storeHref)

  const copyIp = async () => {
    if (!hero.joinIp) return
    try {
      await navigator.clipboard.writeText(hero.joinIp)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      ref={ref}
      className={`mc-section mc-support${visible ? ' mc-section--visible' : ''}`}
      aria-label="Support the server"
      style={{ '--tile-glow': active.glowColor } as CSSProperties}
    >
      <div className="mc-section__bg" aria-hidden="true">
        {active.image ? (
          <ImageCrossfade
            src={active.image}
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
        <div className="mc-support__ambient" aria-hidden="true" />
      </div>

      <div className="landing-shell mc-section__stage">
        <header className="mc-section__copy">
          <p className="mc-section__eyebrow">Keep the server online</p>
          <h2 className="mc-section__title">{pathways.title}</h2>
          <p className="mc-section__lead">{pathways.description}</p>
        </header>

        <div className="mc-support__board">
          <div className="mc-support__rail" role="group" aria-label="Support steps">
            {pathways.features.map((feature, index) => {
              const isActive = feature.id === active.id
              return (
                <button
                  key={feature.id}
                  type="button"
                  aria-pressed={isActive}
                  className={`mc-support__chip${isActive ? ' mc-support__chip--active' : ''}`}
                  style={{ '--tile-glow': feature.glowColor } as CSSProperties}
                  onClick={() => setActiveId(feature.id)}
                  onMouseEnter={() => setActiveId(feature.id)}
                  onFocus={() => setActiveId(feature.id)}
                >
                  <span className="mc-support__chip-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="mc-support__chip-copy">
                    <strong>{feature.title}</strong>
                    <span>{feature.description}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <article className="mc-support__feature" style={{ '--tile-glow': active.glowColor } as CSSProperties}>
            <div className="mc-support__feature-art">
              {active.image ? (
                <ImageCrossfade
                  src={active.image}
                  className="mc-support__feature-fade"
                  imageClassName="mc-support__feature-image"
                  durationMs={640}
                  zoom={false}
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
            </div>
            <div className="mc-support__feature-body" key={active.id}>
              <p className="mc-support__feature-kicker">Next step</p>
              <h3 className="mc-support__feature-title">{active.title}</h3>
              <p className="mc-support__feature-text">{active.description}</p>
              {isCopyIp ? (
                <button type="button" className="mc-cta-chip" onClick={() => void copyIp()}>
                  {copied ? (hero.copiedIpLabel ?? 'Copied!') : (hero.joinIp ?? 'Copy IP')}
                </button>
              ) : (
                <a className="mc-cta-chip" href={actionHref}>
                  {active.title}
                </a>
              )}
            </div>
          </article>
        </div>

        {pathways.tiers.length > 0 ? (
          <div className="mc-ladder">
            <p className="mc-ladder__kicker">Rank ladder</p>
            <ul className="mc-ladder__list" role="list">
              {pathways.tiers.map((tier) => (
                <li key={tier.id}>
                  <article className="mc-ladder__card" style={{ '--tile-glow': tier.glowColor } as CSSProperties}>
                    <span className="mc-ladder__mark">{tier.rarityLabel}</span>
                    <h3 className="mc-ladder__title">{tier.title}</h3>
                    <p className="mc-ladder__text">{tier.description}</p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {pathways.marketCta ? (
          <p className="mc-support-cta">
            <span>{pathways.marketCta.description}</span>
            <a className="mc-cta-chip" href={storeHref}>
              {pathways.marketCta.buttonLabel}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  )
}
