'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import CardPreviewPanel from '@/components/cards/CardPreviewPanel'
import '@/components/CardPlaceholder/styles.css'
import { appConfig } from '@/config'
import { useFwSectionReveal } from '@/hooks/useFwSectionReveal'
import { DOMAIN_LABEL, type CardDomain } from '@/lib/cards/domains'
import {
  computeCardHoverPreviewPosition,
  type CardHoverPreviewPosition,
} from '@/lib/cards/hoverPreview'
import { preloadImage } from '@/lib/cards/preload'
import type { CardDisplayProps } from '@/components/CardPlaceholder/Card'
import type { CollectionCardDisplay } from '@/config/schema'
import './final-whistle-catalog.css'

const DEFAULT_HERO_SLUG = 'striker_card_02_far_post_ghost'

function prefersFinePointerHover() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

type CascadeLayout = {
  x: number
  y: number
  z: number
  scale: number
  blur: number
  ry: number
  rz: number
}

function buildCascadeLayouts(count: number): CascadeLayout[] {
  if (count <= 0) return []

  const cols = count <= 6 ? 3 : 4
  const rows = Math.ceil(count / cols)

  return Array.from({ length: count }, (_, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const rowStagger = row % 2 === 0 ? 0 : 9
    const x = 14 + col * (cols > 1 ? 72 / (cols - 1) : 0) + rowStagger
    const y = 14 + row * (rows > 1 ? 72 / (rows - 1) : 0)
    const depth = count - index

    return {
      x: Math.min(x, 90),
      y: Math.min(y, 88),
      z: depth,
      scale: 1,
      blur: 0,
      ry: -2.5 - (col % 2) * 1.75,
      rz: -1.25 + col * 0.75 + row * 0.35,
    }
  })
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

function FwCatalogHoverPreview({
  cardProps,
  position,
}: {
  cardProps: CardDisplayProps
  position: CardHoverPreviewPosition
}) {
  return (
    <div
      className="fw-catalog__cascade-popover"
      style={
        {
          '--glow-color': cardProps.glowColor,
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
        } as CSSProperties
      }
    >
      <CardPreviewPanel card={cardProps} />
    </div>
  )
}

function FwCatalogCascadeCard({
  card,
  index,
  layout,
  isActive,
  onSelect,
}: {
  card: CollectionCardDisplay
  index: number
  layout: CascadeLayout
  isActive: boolean
  onSelect: (index: number) => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [previewPos, setPreviewPos] = useState<CardHoverPreviewPosition | null>(null)
  const [mounted, setMounted] = useState(false)
  const cardProps = toCardProps(card)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showPreview = () => {
    if (!prefersFinePointerHover()) return
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return
    setPreviewPos(computeCardHoverPreviewPosition(rect))
    setHovered(true)
    void preloadImage(card.artUrl)
  }

  const hidePreview = () => {
    setHovered(false)
    setPreviewPos(null)
  }

  return (
    <>
      <button
        type="button"
        role="listitem"
        className={`fw-catalog__cascade-card${isActive ? ' fw-catalog__cascade-card--active' : ''}${
          hovered ? ' fw-catalog__cascade-card--hovered' : ''
        }`}
        style={
          {
            '--cascade-x': `${layout.x}%`,
            '--cascade-y': `${layout.y}%`,
            '--cascade-z': layout.z,
            '--cascade-scale': layout.scale,
            '--cascade-ry': `${layout.ry}deg`,
            '--cascade-rz': `${layout.rz}deg`,
            '--cascade-blur': `${layout.blur}px`,
            '--cascade-glow': card.glowColor,
          } as CSSProperties
        }
        onClick={() => onSelect(index)}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
        aria-label={`Preview ${card.title}`}
        aria-pressed={isActive}
      >
        <div ref={frameRef} className="fw-catalog__cascade-frame">
          <CardPreviewPanel card={cardProps} variant="thumb" />
        </div>
      </button>

      {mounted && hovered && previewPos
        ? createPortal(
            <FwCatalogHoverPreview cardProps={cardProps} position={previewPos} />,
            document.body,
          )
        : null}
    </>
  )
}

export default function FinalWhistleCatalogSection() {
  const { ref, visible } = useFwSectionReveal()
  const collection = appConfig.descriptions.collection
  const cards = collection?.cards ?? []
  const stageRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })

  const defaultIndex = useMemo(() => {
    const index = cards.findIndex((card) => card.slug === DEFAULT_HERO_SLUG)
    return index >= 0 ? index : 0
  }, [cards])

  useEffect(() => {
    setSelectedIndex(defaultIndex)
  }, [defaultIndex])

  const displayCard = cards[selectedIndex] ?? cards[0]
  const displayProps = displayCard ? toCardProps(displayCard) : null

  const cascadeLayouts = useMemo(() => buildCascadeLayouts(cards.length), [cards.length])

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current
    if (!stage) return

    const rect = stage.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    setParallax({ x, y })
  }, [])

  const handlePointerLeave = useCallback(() => {
    setParallax({ x: 0, y: 0 })
  }, [])

  if (!collection || !displayProps || !displayCard) return null

  const domainLabel = DOMAIN_LABEL[displayProps.domain as CardDomain] ?? displayProps.domain

  return (
    <section
      ref={ref}
      className={`fw-catalog${visible ? ' visible' : ''}`}
      aria-label="Final Whistle catalog"
    >
      <div className="fw-catalog__bg" aria-hidden="true">
        {collection.backgroundImage ? (
          <img
            src={collection.backgroundImage}
            alt=""
            className="fw-catalog__bg-image"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="fw-catalog__bg-scrim" />
      </div>

      <div className="landing-shell fw-catalog__shell">
        <header className="fw-catalog__header">
          <p className="fw-catalog__kicker">CHOREOGRAPHED GALLERY · SECTION 05</p>
          <h2 className="landing-section-title fw-catalog__title">{collection.title}</h2>
          <p className="landing-section-lead fw-catalog__lead">{collection.description}</p>
        </header>

        {collection.stats.length > 0 ? (
          <ul className="fw-catalog__stats" role="list">
            {collection.stats.map((stat) => (
              <li key={stat.id} className="fw-catalog__stat">
                <span className="fw-catalog__stat-value">{stat.value}</span>
                <span className="fw-catalog__stat-label">{stat.label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div
          ref={stageRef}
          className="fw-catalog__gallery"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={
            {
              '--px': parallax.x,
              '--py': parallax.y,
              '--hero-glow': displayCard.glowColor,
            } as CSSProperties
          }
        >
          <div className="fw-catalog__space" aria-hidden="true">
            <div className="fw-catalog__blueprint fw-catalog__blueprint--pitch" />
            <div className="fw-catalog__blueprint fw-catalog__blueprint--grid" />
            <svg
              className="fw-catalog__trail"
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="fw-catalog-trail-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(122, 171, 120, 0.55)" />
                  <stop offset="45%" stopColor="rgba(232, 201, 106, 0.38)" />
                  <stop offset="100%" stopColor="rgba(122, 171, 120, 0.15)" />
                </linearGradient>
              </defs>
              <path
                className="fw-catalog__trail-path"
                d="M 28 108 C 72 78, 118 128, 168 92 S 286 72, 368 98"
                fill="none"
                stroke="url(#fw-catalog-trail-grad)"
              />
            </svg>
            <div className="fw-catalog__vignette" />
          </div>

          <div className="fw-catalog__stage">
            <article className="fw-catalog__hero" aria-live="polite" aria-label="Featured card preview">
              <div className="fw-catalog__hero-frame">
                <div className="fw-catalog__hero-edge" aria-hidden="true" />
                <CardPreviewPanel
                  key={displayCard.id}
                  card={displayProps}
                  className="fw-catalog__hero-panel"
                  showKeywords={false}
                />
              </div>

              {displayCard.keywords && displayCard.keywords.length > 0 ? (
                <div className="fw-catalog__hero-actions" aria-label="Card traits">
                  {displayCard.keywords.map((keyword) => (
                    <span key={keyword} className="fw-catalog__hero-btn">
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="fw-catalog__hero-caption">
                <h3 className="fw-catalog__hero-title">
                  <span className="fw-catalog__hero-domain-part">{domainLabel}:</span>{' '}
                  <span className="fw-catalog__hero-name">{displayCard.title}</span>
                </h3>
              </div>
            </article>

            <div className="fw-catalog__cascade" role="list" aria-label="Catalog card cascade">
              {cards.map((card, index) => {
                const layout = cascadeLayouts[index]
                if (!layout) return null

                return (
                  <FwCatalogCascadeCard
                    key={card.id}
                    card={card}
                    index={index}
                    layout={layout}
                    isActive={selectedIndex === index}
                    onSelect={setSelectedIndex}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
