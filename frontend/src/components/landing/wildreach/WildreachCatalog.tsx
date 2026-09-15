'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Card, { type CardDisplayProps } from '@/components/CardPlaceholder/Card'
import CardPreviewPanel from '@/components/cards/CardPreviewPanel'
import '@/components/CardPlaceholder/styles.css'
import { appConfig } from '@/config'
import { DOMAIN_LABEL, type CardDomain } from '@/lib/cards/domains'
import type { CollectionCardDisplay } from '@/config/schema'
import './WildreachCatalog.css'

function prefersFinePointerHover() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function toCardProps(card: CollectionCardDisplay): CardDisplayProps {
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    domain: card.domain as CardDisplayProps['domain'],
    rarity: card.rarity as CardDisplayProps['rarity'],
    stats: card.stats,
    keywords: card.keywords ?? [],
    ability: card.ability,
    glowColor: card.glowColor,
    thumbUrl: card.thumbUrl,
    artUrl: card.artUrl,
    fanIndex: card.fanIndex,
  }
}

export default function WildreachCatalog() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const collection = appConfig.descriptions.collection
  const cards = collection?.cards ?? []

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => setIsVisible(Boolean(entries[0]?.isIntersecting)),
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!collection || !cards.length) return null

  const activeCard = cards[activeIndex] ?? cards[0]
  if (!activeCard) return null

  const activeProps = toCardProps(activeCard)
  const domainLabel =
    DOMAIN_LABEL[activeProps.domain as CardDomain] ?? activeProps.domain
  const activePlate = String(activeIndex + 1).padStart(2, '0')

  return (
    <section
      ref={sectionRef}
      className={`wr-catalog${isVisible ? ' wr-catalog--visible' : ''}`}
      aria-label="Wildreach Catalog"
    >
      <div className="wr-catalog__bg" aria-hidden="true">
        <div className="wr-catalog__grain" />
        <div className="wr-catalog__wash" />
      </div>

      <div className="landing-shell wr-catalog__shell">
        <header className="wr-catalog__header">
          <p className="wr-catalog__eyebrow">SPECIMEN DOSSIER · PLATE {activePlate}</p>
          <h2 className="wr-catalog__title">{collection.title}</h2>
          <p className="wr-catalog__lead">{collection.description}</p>
        </header>

        {collection.stats.length > 0 ? (
          <ul className="wr-catalog__ledger" role="list" aria-label="Catalog field ledger">
            {collection.stats.map((stat) => (
              <li key={stat.id} className="wr-catalog__metric">
                <span className="wr-catalog__metric-value">{stat.value}</span>
                <span className="wr-catalog__metric-label">{stat.label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div
          className="wr-catalog__board"
          style={{ '--specimen-glow': activeCard.glowColor } as CSSProperties}
        >
          <div className="wr-catalog__mount" aria-live="polite">
            <div className="wr-catalog__mount-frame">
              <span className="wr-catalog__corner wr-catalog__corner--tl" aria-hidden="true" />
              <span className="wr-catalog__corner wr-catalog__corner--tr" aria-hidden="true" />
              <span className="wr-catalog__corner wr-catalog__corner--bl" aria-hidden="true" />
              <span className="wr-catalog__corner wr-catalog__corner--br" aria-hidden="true" />
              <div className="wr-catalog__mount-mist" aria-hidden="true" />
              <div className="wr-catalog__mount-stage">
                <CardPreviewPanel card={activeProps} />
              </div>
            </div>

            <div className="wr-catalog__caption">
              <p className="wr-catalog__caption-range">{domainLabel}</p>
              <h3 className="wr-catalog__caption-name">{activeCard.title}</h3>
              {activeCard.keywords?.length ? (
                <ul className="wr-catalog__tags" role="list">
                  {activeCard.keywords.slice(0, 4).map((keyword) => (
                    <li key={keyword} className="wr-catalog__tag">
                      {keyword}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <ul className="wr-catalog__tray" role="list" aria-label="Specimen tray">
            {cards.map((card, index) => {
              const isActive = index === activeIndex
              const props = toCardProps(card)
              const plate = String(index + 1).padStart(2, '0')
              return (
                <li
                  key={card.id}
                  className={`wr-catalog__specimen${isActive ? ' wr-catalog__specimen--active' : ''}`}
                  style={
                    {
                      '--specimen-glow': card.glowColor,
                      '--specimen-i': index,
                    } as CSSProperties
                  }
                >
                  <button
                    type="button"
                    className="wr-catalog__specimen-btn"
                    aria-pressed={isActive}
                    aria-label={`Preview ${card.title}`}
                    onMouseEnter={() => {
                      if (prefersFinePointerHover()) setActiveIndex(index)
                    }}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => setActiveIndex(index)}
                  >
                    <span className="wr-catalog__specimen-pin" aria-hidden="true">
                      {plate}
                    </span>
                    <span className="wr-catalog__specimen-card">
                      <Card
                        {...props}
                        totalCards={1}
                        fanIndex={0}
                        layoutMode="compact"
                        showAbility={false}
                        thumbOnly
                      />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
