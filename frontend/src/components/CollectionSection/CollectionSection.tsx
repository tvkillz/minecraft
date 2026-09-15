'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Card, { type CardDisplayProps } from '@/components/CardPlaceholder/Card'
import CardPreviewPanel from '@/components/cards/CardPreviewPanel'
import '@/components/CardPlaceholder/styles.css'
import { appConfig } from '@/config'
import { DOMAIN_LABEL, type CardDomain } from '@/lib/cards/domains'
import type { CollectionCardDisplay, CollectionStatConfig } from '@/config/schema'
import './CollectionSection.css'

const MOBILE_BREAKPOINT = 919
const SECTION_THRESHOLD = 0.2
const REVEAL_THRESHOLD = 0.25
const REVEAL_ROOT_MARGIN = '5% 0px 5% 0px'

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

function CollectionStatItem({
  stat,
  staggerIndex,
  sectionVisible,
}: {
  stat: CollectionStatConfig
  staggerIndex: number
  sectionVisible: boolean
}) {
  const itemRef = useRef<HTMLLIElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = itemRef.current
    if (!el) return

    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)

    let observer: IntersectionObserver | null = null

    const attach = () => {
      observer?.disconnect()

      if (!mq.matches) {
        setInView(false)
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          setInView(Boolean(entries[0]?.isIntersecting))
        },
        { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
      )
      observer.observe(el)
    }

    attach()
    mq.addEventListener('change', attach)
    return () => {
      observer?.disconnect()
      mq.removeEventListener('change', attach)
    }
  }, [])

  const mobileVisible = sectionVisible && inView

  return (
    <li
      ref={itemRef}
      className={`collection__stat${mobileVisible ? ' collection__stat--in-view' : ''}`}
      style={{ '--collection-stagger': staggerIndex } as CSSProperties}
    >
      <span className="collection__stat-value">{stat.value}</span>
      <span className="collection__stat-label">{stat.label}</span>
    </li>
  )
}

const PREVIEW_SWAP_MS = 350

function CollectionPreviewCrossfade({ card }: { card: CardDisplayProps }) {
  const [layerA, setLayerA] = useState(card)
  const [layerB, setLayerB] = useState<CardDisplayProps | null>(null)
  const [showA, setShowA] = useState(true)
  const [captionVisible, setCaptionVisible] = useState(true)

  useEffect(() => {
    const visible = showA ? layerA : layerB
    if (visible?.id === card.id) return

    setCaptionVisible(false)

    if (showA) {
      setLayerB(card)
      setShowA(false)
    } else {
      setLayerA(card)
      setShowA(true)
    }

    const captionTimer = window.setTimeout(() => {
      setCaptionVisible(true)
    }, PREVIEW_SWAP_MS)

    return () => window.clearTimeout(captionTimer)
  }, [card, showA, layerA, layerB])

  const visibleCard = showA ? layerA : (layerB ?? layerA)

  return (
    <>
      <div className="collection__preview-stack">
        <div
          className={`collection__preview-layer${showA ? ' collection__preview-layer--active' : ''}`}
        >
          <CardPreviewPanel card={layerA} />
        </div>
        {layerB ? (
          <div
            className={`collection__preview-layer${showA ? '' : ' collection__preview-layer--active'}`}
          >
            <CardPreviewPanel card={layerB} />
          </div>
        ) : null}
      </div>
      <p
        className={`collection__preview-caption${captionVisible ? '' : ' collection__preview-caption--hidden'}`}
      >
        <span className="collection__preview-domain">
          {DOMAIN_LABEL[visibleCard.domain as CardDomain] ?? visibleCard.domain}
          {appConfig.landing?.variant === 'helix' ? ' Lab' : ''}
        </span>
        <span className="collection__preview-title">{visibleCard.title}</span>
      </p>
    </>
  )
}

function CollectionPickerItem({
  card,
  isActive,
  staggerIndex,
  sectionVisible,
  onSelect,
}: {
  card: CollectionCardDisplay
  isActive: boolean
  staggerIndex: number
  sectionVisible: boolean
  onSelect: () => void
}) {
  const itemRef = useRef<HTMLLIElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = itemRef.current
    if (!el) return

    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)

    let observer: IntersectionObserver | null = null

    const attach = () => {
      observer?.disconnect()

      if (!mq.matches) {
        setInView(false)
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          setInView(Boolean(entries[0]?.isIntersecting))
        },
        { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
      )
      observer.observe(el)
    }

    attach()
    mq.addEventListener('change', attach)
    return () => {
      observer?.disconnect()
      mq.removeEventListener('change', attach)
    }
  }, [])

  const mobileVisible = sectionVisible && inView
  const cardProps = toCardProps(card)

  const handleMouseEnter = () => {
    if (prefersFinePointerHover()) onSelect()
  }

  const handleClick = () => {
    onSelect()
  }

  return (
    <li
      ref={itemRef}
      className={`collection__picker-item${isActive ? ' collection__picker-item--active' : ''}${
        mobileVisible ? ' collection__picker-item--in-view' : ''
      }`}
      style={{ '--collection-stagger': staggerIndex } as CSSProperties}
    >
      <button
        type="button"
        className="collection__picker-btn"
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        aria-pressed={isActive}
        aria-label={`Preview ${card.title}`}
      >
        <Card
          {...cardProps}
          totalCards={1}
          fanIndex={0}
          layoutMode="compact"
          showAbility={false}
          thumbOnly
        />
      </button>
    </li>
  )
}

export default function CollectionSection() {
  const collection = appConfig.descriptions.collection
  const cards = collection?.cards ?? []
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(Boolean(entries[0]?.isIntersecting))
      },
      { threshold: SECTION_THRESHOLD },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!collection || !cards.length) return null

  const activeCard = cards[activeIndex] ?? cards[0]
  const activeProps = toCardProps(activeCard)
  const isHelix = appConfig.landing?.variant === 'helix'

  return (
    <section
      ref={sectionRef}
      className={`collection${isVisible ? ' visible' : ''}`}
      aria-label={isHelix ? 'Frame catalog' : 'Card collection'}
    >
      {collection.backgroundImage ? (
        <div className="collection__bg" aria-hidden="true">
          <img
            src={collection.backgroundImage}
            alt=""
            className="collection__bg-image"
            loading="lazy"
            decoding="async"
          />
          <div className="collection__bg-scrim" />
        </div>
      ) : null}

      <div className="landing-shell collection__inner">
        <header className="collection__header">
          {isHelix ? (
            <p className="collection__eyebrow">CATALOG // FRAME INDEX</p>
          ) : null}
          <h2 className="landing-section-title">{collection.title}</h2>
          <p className="landing-section-lead">{collection.description}</p>
        </header>

        {collection.stats.length > 0 ? (
          <ul className="collection__stats" role="list">
            {collection.stats.map((stat, index) => (
              <CollectionStatItem
                key={stat.id}
                stat={stat}
                staggerIndex={index}
                sectionVisible={isVisible}
              />
            ))}
          </ul>
        ) : null}

        <div
          className="collection__showcase"
          style={{ '--collection-glow': activeCard.glowColor } as CSSProperties}
        >
          <div className="collection__preview" aria-live="polite">
            {isHelix ? (
              <>
                <span className="collection__bracket collection__bracket--tl" aria-hidden="true" />
                <span className="collection__bracket collection__bracket--tr" aria-hidden="true" />
                <span className="collection__bracket collection__bracket--bl" aria-hidden="true" />
                <span className="collection__bracket collection__bracket--br" aria-hidden="true" />
                <p className="collection__scan-label" aria-hidden="true">
                  SPECIMEN SCAN
                </p>
                <div className="collection__scan-field" aria-hidden="true">
                  <div className="collection__scan-grid" />
                  <div className="collection__scan-beam" />
                </div>
              </>
            ) : (
              <>
                <div className="collection__preview-aura" aria-hidden="true" />
                <div className="collection__preview-ring" aria-hidden="true" />
              </>
            )}
            <div className="collection__preview-stage">
              <CollectionPreviewCrossfade card={activeProps} />
            </div>
          </div>

          <ul className="collection__picker" role="list">
            {cards.map((card, index) => (
              <CollectionPickerItem
                key={card.id}
                card={card}
                isActive={index === activeIndex}
                staggerIndex={index}
                sectionVisible={isVisible}
                onSelect={() => setActiveIndex(index)}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
