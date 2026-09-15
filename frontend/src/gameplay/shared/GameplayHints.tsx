'use client'

import { useLayoutEffect, useMemo, useState, type RefObject } from 'react'

import { GAMEPLAY_HINTS, type GameplayHintId } from './gameplayHints'
import './GameplayHints.css'

type HintAnchor = {
  top: number
  left: number
  width: number
}

type GameplayHintsProps = {
  stageRef: RefObject<HTMLElement | null>
  hint: GameplayHintId | null
  refs: {
    hand: RefObject<HTMLElement | null>
    battle: RefObject<HTMLElement | null>
    endTurn: RefObject<HTMLElement | null>
  }
  /** Re-measure when layout shifts (hand size, buttons visible). */
  layoutKey?: string
}

function getStageScale(stage: HTMLElement): number {
  const localW = stage.offsetWidth || 1920
  const renderedW = stage.getBoundingClientRect().width
  if (!localW || !renderedW) return 1
  return renderedW / localW
}

function measureAnchor(
  stage: HTMLElement,
  target: HTMLElement,
  placement: 'above' | 'below',
): HintAnchor {
  const scale = getStageScale(stage)
  const stageRect = stage.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  const width = Math.min(360, Math.max(220, targetRect.width / scale))
  const centerX = (targetRect.left + targetRect.width / 2 - stageRect.left) / scale
  const left = centerX - width / 2

  const top =
    placement === 'above'
      ? (targetRect.top - stageRect.top) / scale - 44
      : (targetRect.bottom - stageRect.top) / scale + 12

  return { top, left, width }
}

export default function GameplayHints({ stageRef, hint, refs, layoutKey }: GameplayHintsProps) {
  const [anchor, setAnchor] = useState<HintAnchor | null>(null)

  const label = useMemo(
    () => GAMEPLAY_HINTS.find((entry) => entry.id === hint)?.label ?? '',
    [hint],
  )

  useLayoutEffect(() => {
    if (!hint) {
      setAnchor(null)
      return
    }

    const stage = stageRef.current
    if (!stage) return

    const measure = () => {
      let target: HTMLElement | null = null
      let placement: 'above' | 'below' = 'above'

      if (hint === 'play_card') {
        target = refs.hand.current
        placement = 'above'
      } else if (hint === 'battle') {
        target = refs.battle.current
        placement = 'below'
      } else if (hint === 'end_turn') {
        target = refs.endTurn.current
        placement = 'below'
      }

      if (!target) {
        setAnchor(null)
        return
      }

      setAnchor(measureAnchor(stage, target, placement))
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    if (refs.hand.current) observer.observe(refs.hand.current)
    if (refs.battle.current) observer.observe(refs.battle.current)
    if (refs.endTurn.current) observer.observe(refs.endTurn.current)

    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [hint, layoutKey, refs, stageRef])

  if (!hint || !label || !anchor) return null

  return (
    <div
      className={`gameplay-hint gameplay-hint--${hint}`}
      style={{
        top: anchor.top,
        left: anchor.left,
        width: anchor.width,
      }}
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  )
}
