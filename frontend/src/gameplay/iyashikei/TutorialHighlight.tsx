'use client'

import { useLayoutEffect, useMemo, useState, type RefObject } from 'react'

import type { TutorialTarget } from '@/lib/game/tutorial/steps'
import './TutorialHighlight.css'

const STAGE_WIDTH = 1920
const STAGE_HEIGHT = 1080
const HOLE_RADIUS = 12

type HighlightRect = {
  top: number
  left: number
  width: number
  height: number
}

/** Per-target nudge in game-stage pixels (1920×1080 space). Tune here. */
export type TutorialHighlightOffset = {
  top?: number
  left?: number
  width?: number
  height?: number
}

/** Extra inset/outset around the measured box. */
const PADDING: Partial<Record<TutorialTarget, number>> = {
  mana: 6,
  hand: 10,
  'hero-board': 8,
  battle: 6,
  'end-turn': 6,
  controls: 8,
}

/**
 * Manual position/size correction per tutorial target.
 * Positive top/left moves the ring down/right; positive width/height enlarges it.
 */
export const TUTORIAL_HIGHLIGHT_OFFSET: Partial<Record<TutorialTarget, TutorialHighlightOffset>> = {
  mana: { top: 0, left: -33, width: -170, height: 0 },
  hand: { top: 0, left: 0 },
  'hero-board': {},
  battle: {},
  'end-turn': {},
  controls: {},
}

type TutorialHighlightRefs = {
  avatar: RefObject<HTMLElement | null>
  hand: RefObject<HTMLElement | null>
  heroBoard: RefObject<HTMLElement | null>
  battle: RefObject<HTMLElement | null>
  endTurn: RefObject<HTMLElement | null>
  controls: RefObject<HTMLElement | null>
}

type TutorialHighlightProps = {
  stageRef: RefObject<HTMLElement | null>
  target: TutorialTarget | null
  refs: TutorialHighlightRefs
  /** Re-measure when board/hand layout changes. */
  layoutKey?: string
  /** Dim/blur backdrop around the highlight (early tutorial steps only). */
  showSpotlight?: boolean
}

function getStageScale(stage: HTMLElement): number {
  const localW = stage.offsetWidth || STAGE_WIDTH
  const renderedW = stage.getBoundingClientRect().width
  if (!localW || !renderedW) return 1
  return renderedW / localW
}

function applyOffset(rect: HighlightRect, offset?: TutorialHighlightOffset): HighlightRect {
  if (!offset) return rect
  return {
    top: rect.top + (offset.top ?? 0),
    left: rect.left + (offset.left ?? 0),
    width: Math.max(0, rect.width + (offset.width ?? 0)),
    height: Math.max(0, rect.height + (offset.height ?? 0)),
  }
}

function getTargetElements(target: TutorialTarget, refs: TutorialHighlightRefs): HTMLElement[] {
  switch (target) {
    case 'mana':
      return refs.avatar.current ? [refs.avatar.current] : []
    case 'hand':
      return refs.hand.current ? [refs.hand.current] : []
    case 'hero-board': {
      const lane = refs.heroBoard.current
      if (!lane) return []
      const cards = lane.querySelectorAll<HTMLElement>('.game-board-card-wrap')
      return cards.length > 0 ? Array.from(cards) : [lane]
    }
    case 'battle':
      return refs.battle.current ? [refs.battle.current] : []
    case 'end-turn':
      return refs.endTurn.current ? [refs.endTurn.current] : []
    case 'controls':
      return refs.controls.current ? [refs.controls.current] : []
    default:
      return []
  }
}

function toHighlightRect(boxes: DOMRect[], stage: HTMLElement, pad: number): HighlightRect | null {
  if (!boxes.length) return null

  const stageBox = stage.getBoundingClientRect()
  const scale = getStageScale(stage)

  const left = Math.min(...boxes.map((b) => b.left))
  const top = Math.min(...boxes.map((b) => b.top))
  const right = Math.max(...boxes.map((b) => b.right))
  const bottom = Math.max(...boxes.map((b) => b.bottom))

  return {
    left: (left - stageBox.left) / scale - pad,
    top: (top - stageBox.top) / scale - pad,
    width: (right - left) / scale + pad * 2,
    height: (bottom - top) / scale + pad * 2,
  }
}

function buildSpotlightMask(rect: HighlightRect): string {
  const { left, top, width, height } = rect
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}">`,
    '<defs>',
    '<mask id="tutorial-hole">',
    `<rect width="${STAGE_WIDTH}" height="${STAGE_HEIGHT}" fill="white"/>`,
    `<rect x="${left}" y="${top}" width="${width}" height="${height}" rx="${HOLE_RADIUS}" fill="black"/>`,
    '</mask>',
    '</defs>',
    `<rect width="${STAGE_WIDTH}" height="${STAGE_HEIGHT}" fill="white" mask="url(#tutorial-hole)"/>`,
    '</svg>',
  ].join('')
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

export default function TutorialHighlight({
  stageRef,
  target,
  refs,
  layoutKey = '',
  showSpotlight = false,
}: TutorialHighlightProps) {
  const [rect, setRect] = useState<HighlightRect | null>(null)

  const spotlightMask = useMemo(
    () => (rect ? buildSpotlightMask(rect) : undefined),
    [rect],
  )

  useLayoutEffect(() => {
    if (!target || target === 'none') {
      setRect(null)
      return
    }

    const stage = stageRef.current
    if (!stage) {
      setRect(null)
      return
    }

    const update = () => {
      const pad = PADDING[target] ?? 8
      const elements = getTargetElements(target, refs)
      const boxes = elements.map((el) => el.getBoundingClientRect())
      const base = toHighlightRect(boxes, stage, pad)
      setRect(base ? applyOffset(base, TUTORIAL_HIGHLIGHT_OFFSET[target]) : null)
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(stage)
    for (const el of getTargetElements(target, refs)) {
      observer.observe(el)
    }

    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [target, layoutKey, stageRef])

  if (!rect || !target || target === 'none') return null

  return (
    <>
      {showSpotlight ? (
        <div
          className="tutorial-spotlight-backdrop"
          aria-hidden="true"
          style={{
            maskImage: spotlightMask,
            WebkitMaskImage: spotlightMask,
          }}
        />
      ) : null}
      <div
        className="tutorial-highlight"
        aria-hidden="true"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
    </>
  )
}
