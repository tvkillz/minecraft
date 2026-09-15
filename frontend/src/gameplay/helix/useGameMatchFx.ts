'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { gameAnimationsConfig } from '@/config'
import type { BoardSnapshot } from '@/hooks/useMatch'
import {
  COMBAT_STRIKE_GAP_MS,
  VILLAIN_PLAY_GAP_MS,
  orderCombatStrikes,
  randomVillainTurnDelayMs,
} from '@/lib/game/match'
import type { CombatRoundResult, FreezeEvent, MatchState } from '@/lib/game/match/types'
import type { EndTurnSnapshots } from '@/lib/matches/sync'

import {
  createCardBackClone,
  createThumbClone,
  flyElementBetween,
  getStageMetrics,
  playExecutedKill,
  playFreezeLabel,
  playManaGainBurst,
  pulseAttacker,
} from './fx'
import { runLaserStrikeVfx } from './vfx'

const { orbs: orbPresets } = gameAnimationsConfig

function boardWrap(slotEl: HTMLElement | null): HTMLElement | null {
  return slotEl?.querySelector<HTMLElement>('.game-board-card-wrap') ?? null
}

function delay(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms))
}

async function waitForHandCard(
  handCardRefs: React.MutableRefObject<Map<string, HTMLElement>>,
  id: string,
  maxMs = 900,
): Promise<HTMLElement | null> {
  const deadline = Date.now() + maxMs
  while (Date.now() < deadline) {
    const el = handCardRefs.current.get(id)
    if (el) return el
    await delay(16)
  }
  return null
}

async function waitForBoardSlot(
  boardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>,
  slot: number,
  maxMs = 700,
): Promise<HTMLDivElement | null> {
  const deadline = Date.now() + maxMs
  while (Date.now() < deadline) {
    const slotEl = boardRefs.current[slot]
    if (slotEl) return slotEl
    await delay(16)
  }
  return boardRefs.current[slot] ?? null
}

export interface GameMatchFxRefs {
  stageRef: React.RefObject<HTMLDivElement | null>
  fxLayerRef: React.RefObject<HTMLDivElement | null>
  heroAvatarRef: React.RefObject<HTMLDivElement | null>
  villainAvatarRef: React.RefObject<HTMLDivElement | null>
  heroManaRef: React.RefObject<HTMLDivElement | null>
  villainManaRef: React.RefObject<HTMLDivElement | null>
  heroDeckRef: React.RefObject<HTMLDivElement | null>
  enemyHandRef: React.RefObject<HTMLDivElement | null>
  heroBoardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
  villainBoardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
  handCardRefs: React.MutableRefObject<Map<string, HTMLElement>>
}

export interface UseGameMatchFxOptions {
  match: MatchState | null
  endTurnVisual: EndTurnSnapshots | null
  combatResult: CombatRoundResult | null
  combatBoardSnapshot: BoardSnapshot | null
  processing: boolean
  completeEndTurnVisual: (snapshots: EndTurnSnapshots) => void
  clearEndTurnVisual: () => void
  acknowledgeCombat: () => void
  refs: GameMatchFxRefs
}

export function useGameMatchFx({
  match,
  endTurnVisual,
  combatResult,
  combatBoardSnapshot,
  processing,
  completeEndTurnVisual,
  clearEndTurnVisual,
  acknowledgeCombat,
  refs,
}: UseGameMatchFxOptions) {
  const {
    stageRef,
    fxLayerRef,
    heroAvatarRef,
    villainAvatarRef,
    heroManaRef,
    villainManaRef,
    heroDeckRef,
    enemyHandRef,
    heroBoardRefs,
    villainBoardRefs,
    handCardRefs,
  } = refs

  const [arenaMatch, setArenaMatch] = useState<MatchState | null>(null)
  const [combatBoardView, setCombatBoardView] = useState<BoardSnapshot | null>(null)
  const [dealingHandIds, setDealingHandIds] = useState<Set<string>>(() => new Set())

  const prevHeroManaRef = useRef({ mana: 0, maxMana: 0, turn: 0 })
  const prevHandIdsRef = useRef<Set<string>>(new Set())
  const skipInitialDealFxRef = useRef(true)
  const endTurnRunningRef = useRef(false)
  const endTurnSessionRef = useRef(0)
  const dealHandSessionRef = useRef(0)
  const combatRunningRef = useRef(false)
  const combatPlaybackIdRef = useRef(0)
  const combatBoardViewRef = useRef<BoardSnapshot | null>(null)

  useEffect(() => {
    if (!match) {
      setArenaMatch(null)
      return
    }
    if (!endTurnVisual && !combatResult) {
      setArenaMatch(match)
    }
  }, [match, endTurnVisual, combatResult])

  useEffect(() => {
    if (combatBoardSnapshot) {
      setCombatBoardView(combatBoardSnapshot)
      combatBoardViewRef.current = combatBoardSnapshot
    } else {
      setCombatBoardView(null)
      combatBoardViewRef.current = null
    }
  }, [combatBoardSnapshot])

  const isAttackerOnBoard = useCallback((strike: CombatRoundResult['strikes'][number]) => {
    const view = combatBoardViewRef.current
    if (!view) return true
    const lane = strike.attackerSide === 'hero' ? view.hero : view.villain
    const unit = lane[strike.slotIndex]
    return unit != null && !unit.frozen
  }, [])

  const displayMatch = useMemo(() => {
    // During villain turn VFX, board is built incrementally in arenaMatch.
    const base = endTurnVisual ? (arenaMatch ?? match) : (match ?? arenaMatch)
    if (!base || !combatBoardView) return base
    return {
      ...base,
      hero: {
        ...base.hero,
        board: combatBoardView.hero,
        hp: match?.hero.hp ?? base.hero.hp,
      },
      villain: {
        ...base.villain,
        board: combatBoardView.villain,
        hp: match?.villain.hp ?? base.villain.hp,
      },
    }
  }, [arenaMatch, match, combatBoardView, endTurnVisual])

  const removeBoardUnit = useCallback((side: 'hero' | 'villain', slot: number) => {
    setCombatBoardView((prev) => {
      if (!prev) return prev
      const lane = side === 'hero' ? [...prev.hero] : [...prev.villain]
      lane[slot] = null
      const next =
        side === 'hero' ? { ...prev, hero: lane } : { ...prev, villain: lane }
      combatBoardViewRef.current = next
      return next
    })
  }, [])

  const playManaBurstIfGained = useCallback(
    async (
      before: { mana: number; maxMana: number },
      after: { mana: number; maxMana: number },
      anchor: HTMLElement | null,
      variant: 'hero' | 'villain',
    ) => {
      const stage = stageRef.current
      const fxLayer = fxLayerRef.current
      if (!stage || !fxLayer || !anchor) return

      const gainedMax = after.maxMana - before.maxMana
      const gainedMana = after.mana - before.mana
      const amount = gainedMax > 0 ? gainedMax : gainedMana > 0 ? gainedMana : 0
      if (amount <= 0) return

      await playManaGainBurst(anchor, stage, fxLayer, { amount, variant })
    },
    [stageRef, fxLayerRef],
  )

  const playFreezeAttempt = useCallback(
    async (event: FreezeEvent, metrics: ReturnType<typeof getStageMetrics>) => {
      const boardRefs = event.targetSide === 'hero' ? heroBoardRefs : villainBoardRefs
      const casterRefs = event.casterSide === 'hero' ? heroBoardRefs : villainBoardRefs

      let anchor: HTMLElement | null = null
      if (event.targetSlot >= 0) {
        anchor = boardWrap(boardRefs.current[event.targetSlot])
      }
      if (!anchor) {
        anchor = boardWrap(casterRefs.current[event.casterSlot])
      }
      if (!anchor) return

      await playFreezeLabel(anchor, metrics, event.success)
    },
    [heroBoardRefs, villainBoardRefs],
  )

  useEffect(() => {
    if (!match || endTurnVisual || !heroManaRef.current) return
    if (match.phase !== 'hero_main') return

    const prev = prevHeroManaRef.current
    // Только старт хода героя: +1 к max и полное восстановление (не mid-turn).
    const gained =
      match.turn > prev.turn && match.hero.maxMana > prev.maxMana

    if (gained && match.turn > 1) {
      void playManaBurstIfGained(
        { mana: prev.mana, maxMana: prev.maxMana },
        { mana: match.hero.mana, maxMana: match.hero.maxMana },
        heroManaRef.current,
        'hero',
      )
    }

    prevHeroManaRef.current = {
      mana: match.hero.mana,
      maxMana: match.hero.maxMana,
      turn: match.turn,
    }
  }, [match, endTurnVisual, heroManaRef, playManaBurstIfGained])

  useEffect(() => {
    if (!match || processing) return

    const stage = stageRef.current
    const fxLayer = fxLayerRef.current
    const deckEl = heroDeckRef.current
    if (!stage || !fxLayer || !deckEl) return

    const currentIds = match.hero.hand.map((c) => c.instanceId)

    if (skipInitialDealFxRef.current) {
      skipInitialDealFxRef.current = false
      prevHandIdsRef.current = new Set(currentIds)
      return
    }

    const newIds = currentIds.filter((id) => !prevHandIdsRef.current.has(id))
    prevHandIdsRef.current = new Set(currentIds)

    if (newIds.length === 0) return

    const metrics = getStageMetrics(stage, fxLayer)
    const deckRect = deckEl.getBoundingClientRect()

    const dealSession = ++dealHandSessionRef.current

    void (async () => {
      for (const id of newIds) {
        if (dealSession !== dealHandSessionRef.current) return
        setDealingHandIds((s) => new Set(s).add(id))

        const handEl = await waitForHandCard(handCardRefs, id)
        if (dealSession !== dealHandSessionRef.current) return
        if (!handEl) {
          setDealingHandIds((s) => {
            const n = new Set(s)
            n.delete(id)
            return n
          })
          continue
        }

        const clone = createThumbClone(handEl)
        clone.style.opacity = '1'
        const removeClone = await flyElementBetween(clone, deckRect, handEl.getBoundingClientRect(), metrics, {
          duration: 0.58,
          startScale: 0.5,
          endScale: 1,
          arc: -44,
          smooth: true,
        })

        setDealingHandIds((s) => {
          const n = new Set(s)
          n.delete(id)
          return n
        })
        await delay(32)
        removeClone()
        await delay(80)
      }
    })()
  }, [match?.hero.hand, processing, stageRef, fxLayerRef, heroDeckRef, handCardRefs])

  // Фаза врага: сессия по endTurnVisual; cleanup не ставит cancelled (не обрывать VFX).
  useEffect(() => {
    if (!endTurnVisual || endTurnRunningRef.current) return

    const stage = stageRef.current
    const fxLayer = fxLayerRef.current
    if (!stage || !fxLayer) return

    const session = ++endTurnSessionRef.current
    endTurnRunningRef.current = true

    void (async () => {
      const snapshots = endTurnVisual
      setArenaMatch(snapshots.afterMana)

      await playManaBurstIfGained(
        snapshots.villainManaBefore,
        {
          mana: snapshots.afterMana.villain.mana,
          maxMana: snapshots.afterMana.villain.maxMana,
        },
        villainManaRef.current,
        'villain',
      )

      if (session !== endTurnSessionRef.current) return

      const metrics = getStageMetrics(stage, fxLayer)
      const handRect = enemyHandRef.current?.getBoundingClientRect()
      let boardState = snapshots.afterMana

      await delay(randomVillainTurnDelayMs())

      for (let i = 0; i < snapshots.villainPlays.length; i += 1) {
        if (session !== endTurnSessionRef.current) return

        const play = snapshots.villainPlays[i]!
        if (!handRect) break

        const slotEl = await waitForBoardSlot(villainBoardRefs, play.slotIndex)
        if (!slotEl) continue

        const clone = createCardBackClone()
        const removeClone = await flyElementBetween(
          clone,
          handRect,
          slotEl.getBoundingClientRect(),
          metrics,
          {
            duration: 0.5,
            startScale: 0.7,
            arc: 36,
          },
        )

        const unit = snapshots.afterVillain.villain.board[play.slotIndex]
        if (unit) {
          const nextBoard = [...boardState.villain.board]
          nextBoard[play.slotIndex] = unit
          boardState = {
            ...boardState,
            villain: { ...boardState.villain, board: nextBoard },
          }
          setArenaMatch(boardState)
          await delay(0)
        }

        let attempts = 0
        while (attempts < 24) {
          const rendered =
            slotEl.querySelector('.game-board-card-wrap') !== null ||
            slotEl.querySelector('.game-card') !== null
          if (rendered) break
          await delay(16)
          attempts += 1
        }

        await delay(16)
        removeClone()

        if (play.freeze) {
          await playFreezeAttempt(play.freeze, metrics)
        }

        if (i < snapshots.villainPlays.length - 1) {
          await delay(VILLAIN_PLAY_GAP_MS)
        }
      }

      if (session !== endTurnSessionRef.current) return

      setArenaMatch(snapshots.afterVillain)

      if (session !== endTurnSessionRef.current) return
      completeEndTurnVisual(snapshots)
      if (session === endTurnSessionRef.current) {
        endTurnRunningRef.current = false
      }
    })().catch(() => {
      if (session === endTurnSessionRef.current) {
        endTurnRunningRef.current = false
        clearEndTurnVisual()
      }
    })
  }, [
    endTurnVisual,
    stageRef,
    fxLayerRef,
    villainManaRef,
    enemyHandRef,
    villainBoardRefs,
    playManaBurstIfGained,
    completeEndTurnVisual,
    clearEndTurnVisual,
    playFreezeAttempt,
  ])

  const runStrike = useCallback(
    async (
      strike: CombatRoundResult['strikes'][number],
      metrics: ReturnType<typeof getStageMetrics>,
    ) => {
      const stage = stageRef.current!
      const fxLayer = fxLayerRef.current!
      const slot = strike.slotIndex
      const isHero = strike.attackerSide === 'hero'
      const fromSlot = isHero ? heroBoardRefs.current[slot] : villainBoardRefs.current[slot]
      const attackerWrap = boardWrap(fromSlot)

      if (attackerWrap) {
        await pulseAttacker(attackerWrap)
      }

      let targetNode: HTMLElement | null = null
      let targetWrap: HTMLElement | null = null
      if (strike.faceDamage > 0) {
        targetNode = isHero ? villainAvatarRef.current : heroAvatarRef.current
      } else if (strike.targetSlot !== null) {
        const targetLane = strike.targetSide === 'hero' ? heroBoardRefs : villainBoardRefs
        targetWrap = boardWrap(targetLane.current[strike.targetSlot])
        targetNode = targetWrap ?? targetLane.current[strike.targetSlot]
      }

      const preset = orbPresets[slot % orbPresets.length]
      if (fromSlot && targetNode) {
        await runLaserStrikeVfx({
          stage,
          fxLayer,
          fromNode: fromSlot,
          targetNode,
          orbPreset: preset,
          particles: gameAnimationsConfig.particles,
        })
      }

      if (strike.killed && strike.targetSlot !== null && targetWrap?.isConnected) {
        await playExecutedKill(targetWrap, metrics)
        removeBoardUnit(strike.targetSide, strike.targetSlot)
      }
    },
    [stageRef, fxLayerRef, heroBoardRefs, villainBoardRefs, heroAvatarRef, villainAvatarRef, removeBoardUnit],
  )

  // Бой: строго await каждого удара; не отменять при смене snapshot (только новый combatResult).
  useEffect(() => {
    if (!combatResult || !combatBoardSnapshot) return

    const stage = stageRef.current
    const fxLayer = fxLayerRef.current
    if (!stage || !fxLayer) return

    const playbackId = ++combatPlaybackIdRef.current
    const sessionCombat = combatResult
    const sessionSnapshot = combatBoardSnapshot

    combatRunningRef.current = true

    void (async () => {
      try {
        const metrics = getStageMetrics(stage, fxLayer)
        const playbackStrikes = orderCombatStrikes(sessionCombat.strikes)

        for (let i = 0; i < playbackStrikes.length; i += 1) {
          if (playbackId !== combatPlaybackIdRef.current) return
          const strike = playbackStrikes[i]!
          if (!isAttackerOnBoard(strike)) continue
          await runStrike(strike, metrics)
          if (playbackId !== combatPlaybackIdRef.current) return
          if (i < playbackStrikes.length - 1) {
            await delay(COMBAT_STRIKE_GAP_MS)
          }
        }

        if (playbackId === combatPlaybackIdRef.current) {
          acknowledgeCombat()
        }
      } finally {
        if (playbackId === combatPlaybackIdRef.current) {
          combatRunningRef.current = false
        }
      }
    })()
    // Намеренно без cleanup с aborted — иначе React Strict Mode обрывает удары на полпути.
  }, [combatResult, stageRef, fxLayerRef, runStrike, isAttackerOnBoard, acknowledgeCombat])

  const flyHeroCardToBoard = useCallback(
    async (instanceId: string, slotIndex: number) => {
      const stage = stageRef.current
      const fxLayer = fxLayerRef.current
      const handEl = handCardRefs.current.get(instanceId)
      const boardEl = heroBoardRefs.current[slotIndex]
      if (!stage || !fxLayer || !handEl || !boardEl) return

      const fromRect = handEl.getBoundingClientRect()
      const toRect = boardEl.getBoundingClientRect()
      const metrics = getStageMetrics(stage, fxLayer)

      const clone = createThumbClone(handEl)
      const removeClone = await flyElementBetween(clone, fromRect, toRect, metrics, {
        duration: 0.48,
        startScale: 0.82,
        arc: -50,
      })

      const maxAttempts = 20
      let attempts = 0
      while (attempts < maxAttempts) {
        const realCardIsRendered =
          boardEl.querySelector('.game-board-card-wrap') !== null ||
          boardEl.querySelector('.game-card') !== null
        if (realCardIsRendered) break
        await delay(16)
        attempts += 1
      }

      await delay(16)
      removeClone()
    },
    [stageRef, fxLayerRef, handCardRefs, heroBoardRefs],
  )

  const runFreezeAttempt = useCallback(
    async (event: FreezeEvent) => {
      const stage = stageRef.current
      const fxLayer = fxLayerRef.current
      if (!stage || !fxLayer) return
      const metrics = getStageMetrics(stage, fxLayer)
      await playFreezeAttempt(event, metrics)
    },
    [stageRef, fxLayerRef, playFreezeAttempt],
  )

  return {
    displayMatch,
    dealingHandIds,
    flyHeroCardToBoard,
    runFreezeAttempt,
  }
}
