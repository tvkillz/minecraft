'use client'

import { useCallback, useEffect, useState } from 'react'

import type { CombatRoundResult, MatchState } from '@/lib/game/match/types'
import type { EndTurnSnapshots } from '@/lib/matches/sync'

import { TUTORIAL_STEPS, type TutorialStep } from '@/lib/game/tutorial/steps'

type UseTutorialOptions = {
  enabled: boolean
  match: MatchState | null
  processing: boolean
  endTurnVisual: EndTurnSnapshots | null
  combatResult: CombatRoundResult | null
  matchEnded: boolean
}

function isAutoStepComplete(
  step: TutorialStep,
  match: MatchState,
  processing: boolean,
  endTurnVisual: EndTurnSnapshots | null,
  combatResult: CombatRoundResult | null,
): boolean {
  const heroOnBoard = match.hero.board.some(Boolean)

  switch (step.id) {
    case 'play_card':
      return heroOnBoard
    case 'battle':
      return match.heroCombatDone === true || match.phase !== 'hero_main' || Boolean(endTurnVisual)
    case 'end_turn':
      return Boolean(endTurnVisual) || match.phase !== 'hero_main' || match.turn > 1
    case 'resolution':
      return match.turn >= 2 && match.phase === 'hero_main' && !processing && !endTurnVisual && !combatResult
    default:
      return false
  }
}

export function useTutorial({
  enabled,
  match,
  processing,
  endTurnVisual,
  combatResult,
  matchEnded,
}: UseTutorialOptions) {
  const [stepIndex, setStepIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setStepIndex(0)
      setDismissed(false)
    }
  }, [enabled])

  useEffect(() => {
    if (matchEnded && enabled && !dismissed) {
      setDismissed(true)
    }
  }, [matchEnded, enabled, dismissed])

  useEffect(() => {
    if (!enabled || dismissed || !match) return

    const step = TUTORIAL_STEPS[stepIndex]
    if (!step || step.advance !== 'auto') return

    if (isAutoStepComplete(step, match, processing, endTurnVisual, combatResult)) {
      setStepIndex((current) => Math.min(current + 1, TUTORIAL_STEPS.length - 1))
    }
  }, [enabled, dismissed, match, processing, endTurnVisual, combatResult, stepIndex])

  const continueTutorial = useCallback(() => {
    setStepIndex((current) => {
      const step = TUTORIAL_STEPS[current]
      if (!step || step.advance !== 'manual') return current
      if (current >= TUTORIAL_STEPS.length - 1) {
        setDismissed(true)
        return current
      }
      return current + 1
    })
  }, [])

  const dismissTutorial = useCallback(() => {
    setDismissed(true)
  }, [])

  const step = enabled && !dismissed ? (TUTORIAL_STEPS[stepIndex] ?? null) : null
  const stepNumber = stepIndex + 1
  const stepTotal = TUTORIAL_STEPS.length

  return {
    step,
    stepNumber,
    stepTotal,
    continueTutorial,
    dismissTutorial,
    isActive: Boolean(step),
  }
}
