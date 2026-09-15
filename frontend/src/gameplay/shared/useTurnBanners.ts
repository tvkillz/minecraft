'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { gameAnimationsConfig } from '@/config'
import type { CombatRoundResult, MatchState } from '@/lib/game/match/types'
import type { EndTurnSnapshots } from '@/lib/matches/sync'

const { turnBanner } = gameAnimationsConfig

type BannerPhase = 'hidden' | 'enter' | 'exit'

/** Показать баннер с enter → exit → hidden (один цикл). */
function runBannerCycle(
  setPhase: (p: BannerPhase) => void,
  timing: { exitPhaseMs: number; hideMs: number },
): () => void {
  setPhase('enter')
  const t1 = window.setTimeout(() => setPhase('exit'), timing.exitPhaseMs)
  const t2 = window.setTimeout(() => setPhase('hidden'), timing.hideMs)
  return () => {
    window.clearTimeout(t1)
    window.clearTimeout(t2)
  }
}

/**
 * Баннеры «YOUR TURN» / «ENEMY TURN» — строго один раз в начале соответствующей фазы.
 */
export function useTurnBanners(
  match: MatchState | null,
  endTurnVisual: EndTurnSnapshots | null,
  combatResult: CombatRoundResult | null,
  processing: boolean,
) {
  const [enemyTurnPhase, setEnemyTurnPhase] = useState<BannerPhase>('hidden')
  const [yourTurnPhase, setYourTurnPhase] = useState<BannerPhase>('hidden')

  const enemyBannerKeyRef = useRef<object | null>(null)
  const yourTurnBannerShownRef = useRef(0)

  const showEnemyTurnBanner = useCallback(() => {
    return runBannerCycle(setEnemyTurnPhase, turnBanner.enemy)
  }, [])

  const showYourTurnBanner = useCallback(() => {
    return runBannerCycle(setYourTurnPhase, turnBanner.your)
  }, [])

  // Ход врага: баннер в начале визуальной фазы end-turn (враг играет карты).
  useEffect(() => {
    if (!endTurnVisual) return
    if (enemyBannerKeyRef.current === endTurnVisual) return
    enemyBannerKeyRef.current = endTurnVisual
    const cleanup = showEnemyTurnBanner()
    return cleanup
  }, [endTurnVisual, showEnemyTurnBanner])

  // Ход игрока: баннер после завершения боя/врага, когда снова hero_main и нет активного боя.
  useEffect(() => {
    if (!match || match.phase !== 'hero_main' || match.winner) return
    if (processing || endTurnVisual || combatResult) return
    if (yourTurnBannerShownRef.current === match.turn) return

    yourTurnBannerShownRef.current = match.turn
    const cleanup = showYourTurnBanner()
    return cleanup
  }, [
    match?.turn,
    match?.phase,
    match?.winner,
    processing,
    endTurnVisual,
    combatResult,
    showYourTurnBanner,
  ])

  const resetTurnBanners = useCallback(() => {
    yourTurnBannerShownRef.current = 0
    enemyBannerKeyRef.current = null
    setEnemyTurnPhase('hidden')
    setYourTurnPhase('hidden')
  }, [])

  return {
    enemyTurnPhase,
    yourTurnPhase: yourTurnPhase,
    resetTurnBanners,
  }
}
