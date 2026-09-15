'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { gameAnimationsConfig } from './animations.config'
import type { CombatRoundResult, MatchState } from '@/lib/game/match/types'
import type { EndTurnSnapshots } from '@/lib/matches/sync'

const { turnBanner } = gameAnimationsConfig

type BannerPhase = 'hidden' | 'enter' | 'exit'
type BannerVariant = 'your' | 'enemy'

type ActiveBanner = {
  variant: BannerVariant
  phase: BannerPhase
}

/** One banner cycle: enter → exit → hidden. Returns cleanup. */
function runBannerCycle(
  setBanner: (banner: ActiveBanner | null) => void,
  variant: BannerVariant,
  timing: { exitPhaseMs: number; hideMs: number },
): () => void {
  setBanner({ variant, phase: 'enter' })

  const t1 = window.setTimeout(() => {
    setBanner({ variant, phase: 'exit' })
  }, timing.exitPhaseMs)

  const t2 = window.setTimeout(() => {
    setBanner(null)
  }, timing.hideMs)

  return () => {
    window.clearTimeout(t1)
    window.clearTimeout(t2)
  }
}

/**
 * Final Whistle turn banners — single slot only (prevents AWAY then HOME overlap).
 * HOME: only when entering hero_main (game start or after combat).
 * AWAY: only when villain end-turn visual begins.
 */
export function useTurnBanners(
  match: MatchState | null,
  endTurnVisual: EndTurnSnapshots | null,
  combatResult: CombatRoundResult | null,
  processing: boolean,
) {
  const [activeBanner, setActiveBanner] = useState<ActiveBanner | null>(null)

  const bannerCleanupRef = useRef<(() => void) | null>(null)
  const enemyBannerKeyRef = useRef<object | null>(null)
  const yourTurnBannerShownRef = useRef(0)
  const prevPhaseRef = useRef<MatchState['phase'] | null>(null)
  const suppressYourBannerRef = useRef(false)

  const clearBannerTimers = useCallback(() => {
    bannerCleanupRef.current?.()
    bannerCleanupRef.current = null
  }, [])

  const showEnemyTurnBanner = useCallback(() => {
    clearBannerTimers()
    suppressYourBannerRef.current = true
    bannerCleanupRef.current = runBannerCycle(setActiveBanner, 'enemy', turnBanner.enemy)
    return bannerCleanupRef.current
  }, [clearBannerTimers])

  const showYourTurnBanner = useCallback(() => {
    if (suppressYourBannerRef.current) return () => {}
    clearBannerTimers()
    bannerCleanupRef.current = runBannerCycle(setActiveBanner, 'your', turnBanner.your)
    return bannerCleanupRef.current
  }, [clearBannerTimers])

  // Enemy turn: start of end-turn visual (villain plays).
  useEffect(() => {
    if (!endTurnVisual) return
    if (enemyBannerKeyRef.current === endTurnVisual) return
    enemyBannerKeyRef.current = endTurnVisual
    const cleanup = showEnemyTurnBanner()
    return cleanup
  }, [endTurnVisual, showEnemyTurnBanner])

  // Your turn: only on transition into hero_main (not on turn number alone).
  useEffect(() => {
    if (!match || match.phase !== 'hero_main' || match.winner) return
    if (processing || endTurnVisual || combatResult) return

    const prev = prevPhaseRef.current
    const enteredHeroMain = prev === null || prev === 'combat' || prev === 'villain_main' || prev === 'ended'
    if (!enteredHeroMain) return
    if (yourTurnBannerShownRef.current === match.turn) return

    yourTurnBannerShownRef.current = match.turn
    suppressYourBannerRef.current = false
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

  useEffect(() => {
    prevPhaseRef.current = match?.phase ?? null
  }, [match?.phase])

  const resetTurnBanners = useCallback(() => {
    clearBannerTimers()
    yourTurnBannerShownRef.current = 0
    enemyBannerKeyRef.current = null
    suppressYourBannerRef.current = false
    prevPhaseRef.current = null
    setActiveBanner(null)
  }, [clearBannerTimers])

  return {
    activeBanner,
    enemyTurnPhase:
      activeBanner?.variant === 'enemy' ? activeBanner.phase : ('hidden' as BannerPhase),
    yourTurnPhase:
      activeBanner?.variant === 'your' ? activeBanner.phase : ('hidden' as BannerPhase),
    resetTurnBanners,
  }
}
