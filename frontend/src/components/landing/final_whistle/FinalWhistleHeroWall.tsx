'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import CardPreviewPanel from '@/components/cards/CardPreviewPanel'
import Card, { type CardDisplayProps } from '@/components/CardPlaceholder/Card'
import '@/components/CardPlaceholder/styles.css'
import { HERO_CARDS } from '@/config'
import {
  computeCardHoverPreviewPosition,
  type CardHoverPreviewPosition,
} from '@/lib/cards/hoverPreview'
import { preloadCardImages, preloadImage } from '@/lib/cards/preload'
import './styles.css'

/**
 * ── Hero wall arc tuning ──────────────────────────────────────────────
 * Edit WALL_ARC to reposition cards. Slots are computed on a semicircle:
 *
 *   x = sin(angle) × radiusX     ← horizontal offset from centre (px)
 *   y = (1 - cos(angle)) × radiusY   ← outer cards rise slightly (px)
 *   rotate = angle × rotateFactor    ← tilt toward centre (deg)
 *
 * | Knob          | Effect                                         |
 * |---------------|------------------------------------------------|
 * | radiusX       | Wider arc ↔ tighter (keep cards on screen)     |
 * | radiusY       | Flatter ↔ more “smile” at the wings            |
 * | halfAngle     | Narrow fan ↔ wide fan (degrees each side)      |
 * | rotateFactor  | Less tilt ↔ more tilt on outer cards           |
 * | edgeScaleDrop | How much smaller wing cards are (0–0.2)          |
 *
 * Card pixel size: `.fw-hero__wall-card` in `styles.css`.
 */
export const WALL_ARC = {
  radiusX: 500,
  radiusY: 24,
  halfAngle: 40,
  rotateFactor: 0,
  edgeScaleDrop: 0.1,
  delayStep: 0,
} as const

export type WallSlot = {
  rotate: number
  x: number
  y: number
  scale: number
  delay: number
}

export function buildWallSlots(count: number, arc = WALL_ARC): WallSlot[] {
  if (count <= 0) return []

  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1)
    const angle = -arc.halfAngle + t * arc.halfAngle * 2
    const rad = (angle * Math.PI) / 180

    return {
      rotate: angle * arc.rotateFactor,
      x: Math.sin(rad) * arc.radiusX,
      y: (1 - Math.cos(rad)) * arc.radiusY,
      scale: 1 - (Math.abs(angle) / arc.halfAngle) * arc.edgeScaleDrop,
      delay: index * arc.delayStep,
    }
  })
}

const WALL_SLOTS = buildWallSlots(6)

const SPOTLIGHT_INTERVAL_MS = 2800
const MANUAL_SELECT_PAUSE_MS = SPOTLIGHT_INTERVAL_MS * 3

function prefersFinePointerHover() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function FwHeroWallPreview({
  card,
  position,
}: {
  card: CardDisplayProps
  position: CardHoverPreviewPosition
}) {
  return (
    <div
      className="fw-hero__wall-popover"
      style={
        {
          '--glow-color': card.glowColor,
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
        } as CSSProperties
      }
    >
      <CardPreviewPanel card={card} />
    </div>
  )
}

function FwHeroWallSlot({
  card,
  slot,
  index,
  isLit,
  onSelect,
}: {
  card: CardDisplayProps
  slot: WallSlot
  index: number
  isLit: boolean
  onSelect: (index: number) => void
}) {
  const frameRef = useRef<HTMLLIElement>(null)
  const [hovered, setHovered] = useState(false)
  const [previewPos, setPreviewPos] = useState<CardHoverPreviewPosition | null>(null)
  const [mounted, setMounted] = useState(false)

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
      <li
        ref={frameRef}
        className={`fw-hero__wall-slot${isLit ? ' fw-hero__wall-slot--lit' : ''}`}
        style={
          {
            '--wall-rotate': `${slot.rotate}deg`,
            '--wall-x': `${slot.x}px`,
            '--wall-y': `${slot.y}px`,
            '--wall-scale': slot.scale,
            '--wall-delay': `${slot.delay}s`,
            zIndex: isLit ? 14 : 4 + index,
          } as CSSProperties
        }
        onClick={() => onSelect(index)}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
        tabIndex={0}
        role="button"
        aria-pressed={isLit}
        aria-label={`Select ${card.title}`}
      >
        <div className="fw-hero__wall-shadow" aria-hidden="true" />
        <Card
          {...card}
          layoutMode="hero"
          thumbOnly
          showAbility={false}
          showKeywords={false}
          showRarity={false}
          totalCards={1}
          fanIndex={0}
          className="fw-hero__wall-card"
        />
      </li>

      {mounted && hovered && previewPos
        ? createPortal(<FwHeroWallPreview card={card} position={previewPos} />, document.body)
        : null}
    </>
  )
}

export default function FinalWhistleHeroWall() {
  const cards = HERO_CARDS.slice(0, 6)
  const [activeIndex, setActiveIndex] = useState(2)
  const manualUntilRef = useRef(0)

  useEffect(() => {
    if (!cards.length) return
    void preloadCardImages(cards, { fullArt: true })
  }, [cards])

  useEffect(() => {
    if (!cards.length) return

    const interval = window.setInterval(() => {
      if (Date.now() < manualUntilRef.current) return
      setActiveIndex((prev) => (prev + 1) % cards.length)
    }, SPOTLIGHT_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [cards.length])

  const handleSelect = (index: number) => {
    manualUntilRef.current = Date.now() + MANUAL_SELECT_PAUSE_MS
    setActiveIndex(index)
  }

  if (!cards.length) return null

  const activeSlot = WALL_SLOTS[activeIndex] ?? WALL_SLOTS[0]

  return (
    <div className="fw-hero__wall" aria-hidden={cards.length === 0}>
      <div className="fw-hero__wall-pitch" aria-hidden="true">
        <div className="fw-hero__wall-circle" />
        <div
          className="fw-hero__wall-spotlight"
          style={{ '--spot-x': `${activeSlot?.x ?? 0}px` } as CSSProperties}
        />
      </div>

      <ul className="fw-hero__wall-line">
        {cards.map((card, index) => {
          const slot = WALL_SLOTS[index % WALL_SLOTS.length]
          if (!slot) return null

          return (
            <FwHeroWallSlot
              key={card.id}
              card={card}
              slot={slot}
              index={index}
              isLit={index === activeIndex}
              onSelect={handleSelect}
            />
          )
        })}
      </ul>
    </div>
  )
}
