'use client'

import {
  forwardRef,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'

import { preloadImage } from '@/lib/cards/preload'
import { formatCardStat } from '@/lib/cards/numerals'
import { formatRarityLabel } from '@/lib/cards/rarity'
import { appConfig } from '@/config'
import { DOMAIN_LABEL, type CardDomain } from '@/lib/cards/domains'
import type { CardAbility, CardRarity } from '@/lib/cards/types'

export interface CardDisplayProps {
  id: string
  slug?: string
  title: string
  thumbUrl: string
  artUrl: string
  stats: { mana: number; attack: number; health: number }
  domain: CardDomain
  rarity?: CardRarity
  keywords?: string[]
  ability?: CardAbility
  glowColor: string
  fanIndex: number
}

/** @deprecated Use CardDisplayProps — kept for gradual migration. */
export type CardProps = CardDisplayProps & {
  /** @deprecated Use thumbUrl */
  bgImage?: string
}

interface CardComponentProps extends CardDisplayProps {
  totalCards: number
  layoutMode?: 'default' | 'game' | 'compact' | 'preview' | 'hero' | 'market'
  showAbility?: boolean
  /** Keyword chips (Stealth, Charge, …). Independent of showAbility. */
  showKeywords?: boolean
  showRarity?: boolean
  frozen?: boolean
  /** Picker grids: keep thumbnail art; preview lives elsewhere. */
  thumbOnly?: boolean
  className?: string
  /** Stat badge numerals — iyashikei hero uses kanji. */
  numeralStyle?: 'arabic' | 'kanji'
  onHoverChange?: (isHovered: boolean) => void
  onDoubleClick?: (event: MouseEvent<HTMLElement>) => void
}

const Card = forwardRef<HTMLElement, CardComponentProps>(function Card(
  {
    id,
    title,
    thumbUrl,
    artUrl,
    stats,
    domain,
    rarity,
    keywords = [],
    ability,
    glowColor,
    fanIndex,
    totalCards,
    layoutMode = 'default',
    showAbility,
    showKeywords,
    showRarity,
    frozen = false,
    thumbOnly = false,
    className = '',
    numeralStyle = appConfig.landing?.variant === 'iyashikei' ? 'kanji' : 'arabic',
    onHoverChange,
    onDoubleClick,
  },
  forwardedRef,
) {
  const innerRef = useRef<HTMLElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const displayAbility = showAbility ?? (layoutMode !== 'game' && layoutMode !== 'hero')
  const displayKeywords = showKeywords ?? (layoutMode === 'hero' || displayAbility)
  const displayRarity = showRarity === true
  const isIyashikei = appConfig.landing?.variant === 'iyashikei'
  const isHelix = appConfig.landing?.variant === 'helix'
  const isFinalWhistle = appConfig.landing?.variant === 'final_whistle'
  const spiritLabel = isIyashikei
    ? 'Spirit'
    : isHelix
      ? 'Signal'
      : isFinalWhistle
        ? 'Threat'
        : 'Attack'
  const calmLabel = isIyashikei
    ? 'Calm'
    : isHelix
      ? 'Integrity'
      : isFinalWhistle
        ? 'Resolve'
        : 'Health'
  const imageSrc =
    layoutMode === 'preview' || layoutMode === 'hero'
      ? artUrl
      : layoutMode === 'game' || thumbOnly
        ? thumbUrl
        : isHovered && artUrl !== thumbUrl
          ? artUrl
          : thumbUrl

  const setRef = (el: HTMLElement | null) => {
    innerRef.current = el
    if (typeof forwardedRef === 'function') forwardedRef(el)
    else if (forwardedRef) forwardedRef.current = el
  }

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = innerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    el.style.setProperty('--tilt-x', `${y * -14}deg`)
    el.style.setProperty('--tilt-y', `${x * 14}deg`)
  }

  const handleMouseLeave = () => {
    const el = innerRef.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
    setIsHovered(false)
    onHoverChange?.(false)
  }

  const centerOffset = fanIndex - (totalCards - 1) / 2
  const maxOffset = Math.max((totalCards - 1) / 2, 1)
  const normalizedCenterDistance = 1 - Math.min(1, Math.abs(centerOffset) / maxOffset)

  const spacing =
    totalCards > 1
      ? layoutMode === 'game'
        ? Math.max(24, Math.min(63, 1140 / (totalCards - 1)))
        : Math.max(24, Math.min(64, 980 / (totalCards - 1)))
      : 0

  const rotateStep =
    layoutMode === 'game'
      ? Math.max(1.2, Math.min(3.4, 52 / Math.max(totalCards, 1)))
      : Math.max(2.2, Math.min(8, 120 / Math.max(totalCards, 1)))

  const cardScale =
    layoutMode === 'game' || layoutMode === 'preview'
      ? 1
      : totalCards > 10
        ? Math.max(0.54, 10 / totalCards)
        : layoutMode === 'compact'
          ? 1
          : 1

  const attackStat = (
    <div className="card__stat card__stat--attack" aria-label={`${spiritLabel} ${stats.attack}`}>
      <span className="card__stat-icon card__stat-icon--attack" aria-hidden="true" />
      <span className="card__stat-value">{formatCardStat(stats.attack, numeralStyle)}</span>
    </div>
  )

  const healthStat = (
    <div
      className="card__stat card__stat--health"
      aria-label={`${calmLabel} ${Math.max(0, stats.health)}`}
    >
      <span className="card__stat-value">
        {formatCardStat(Math.max(0, stats.health), numeralStyle)}
      </span>
    </div>
  )

  const cardFooter = (
    <div className="card__footer">
      <h3 className="card__title">{title}</h3>
      {displayAbility && ability && (
        <div className="card__ability">
          <strong className="card__ability-name">{ability.name}</strong>
          <p className="card__ability-text">{ability.text}</p>
        </div>
      )}
      {keywords.length > 0 && displayKeywords && (
        <ul className="card__keywords" aria-label="Keywords">
          {keywords.map((kw) => (
            <li key={kw}>{kw}</li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <article
      ref={setRef}
      className={`card card--${layoutMode}${isHovered ? ' card--hovered' : ''}${frozen ? ' card--frozen' : ''}${className ? ` ${className}` : ''}`}
      aria-disabled={frozen || undefined}
      data-card-id={id}
      data-domain={domain}
      data-rarity={rarity}
      style={
        {
          '--glow-color': glowColor,
          '--fan-rotate': `${centerOffset * rotateStep}deg`,
          '--fan-translate-x': `${centerOffset * spacing}px`,
          '--fan-lift':
            layoutMode === 'game' ? `${-Math.pow(normalizedCenterDistance, 1.35) * 34}px` : '0px',
          '--fan-index': fanIndex,
          '--card-scale': cardScale,
          '--tilt-x': '0deg',
          '--tilt-y': '0deg',
        } as CSSProperties
      }
      onMouseMove={thumbOnly ? undefined : handleMouseMove}
      onMouseEnter={
        thumbOnly
          ? undefined
          : () => {
              if (layoutMode === 'game') void preloadImage(artUrl)
              setIsHovered(true)
              onHoverChange?.(true)
            }
      }
      onMouseLeave={thumbOnly ? undefined : handleMouseLeave}
      onDoubleClick={layoutMode === 'hero' ? undefined : onDoubleClick}
    >
      <div className="card__frame">
        <img
          src={imageSrc}
          alt={title}
          className="card__art"
          loading={layoutMode === 'game' || layoutMode === 'hero' || layoutMode === 'default' ? 'eager' : 'lazy'}
          fetchPriority={layoutMode === 'hero' ? 'high' : undefined}
          decoding="async"
        />
        <div className="card__overlay" />
        <div
          className="card__stat card__stat--mana"
          aria-label={`${isFinalWhistle ? 'Cost' : 'Mana'} ${stats.mana}`}
        >
          <span className="card__stat-value">{formatCardStat(stats.mana, numeralStyle)}</span>
        </div>
        <div
          className={`card__domain card__domain--${domain}`}
          aria-label={`${DOMAIN_LABEL[domain]}${isHelix ? ' lab' : isFinalWhistle ? ' zone' : ' domain'}`}
          title={DOMAIN_LABEL[domain]}
        />
        {rarity && displayRarity && (
          <span className={`card__rarity card__rarity--${rarity}`}>{formatRarityLabel(rarity)}</span>
        )}
        {layoutMode === 'preview' ? (
          <div className="card__bottom">
            <div className="card__combat-stats">
              {attackStat}
              {healthStat}
            </div>
            {cardFooter}
          </div>
        ) : (
          <>
            {attackStat}
            {healthStat}
            {cardFooter}
          </>
        )}
      </div>
    </article>
  )
})

Card.displayName = 'Card'

export default Card
