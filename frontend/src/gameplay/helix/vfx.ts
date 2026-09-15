import { gsap } from 'gsap'

import type { ParticleBurstConfig } from '@/config/game/schema'
import type { OrbPresetConfig } from '@/config'

import { spawnBurst } from '../shared/vfx'
import { rectToStagePoint } from '../shared/fx/stageMetrics'

/**
 * Helix combat strike — cyan/violet laser lance (not a fireball orb).
 * Instant beam snap + impact flash; no return flight.
 */
export function runLaserStrikeVfx(opts: {
  stage: HTMLDivElement
  fxLayer: HTMLElement
  fromNode: HTMLElement
  targetNode: HTMLElement
  orbPreset: OrbPresetConfig
  particles: ParticleBurstConfig
}): Promise<void> {
  return new Promise((resolveDone) => {
    const { stage, fxLayer, fromNode, targetNode, orbPreset, particles } = opts

    const stageRect = stage.getBoundingClientRect()
    const fromRect = fromNode.getBoundingClientRect()
    const targetRect = targetNode.getBoundingClientRect()
    const scaleX = stageRect.width / stage.clientWidth || 1
    const scaleY = stageRect.height / stage.clientHeight || 1

    const { x: startX, y: startY } = rectToStagePoint(fromRect, stageRect, scaleX, scaleY)
    const { x: endX, y: endY } = rectToStagePoint(targetRect, stageRect, scaleX, scaleY)

    const dx = endX - startX
    const dy = endY - startY
    const length = Math.max(24, Math.hypot(dx, dy))
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    const cleanup: HTMLElement[] = []
    const track = (el: HTMLElement) => {
      cleanup.push(el)
      return el
    }

    const muzzle = track(document.createElement('div'))
    muzzle.className = 'game-laser-muzzle'
    muzzle.style.left = `${startX}px`
    muzzle.style.top = `${startY}px`
    muzzle.style.setProperty('--laser-color', orbPreset.launchColor)
    fxLayer.appendChild(muzzle)

    const beam = track(document.createElement('div'))
    beam.className = 'game-laser-beam'
    beam.style.left = `${startX}px`
    beam.style.top = `${startY}px`
    beam.style.width = `${length}px`
    beam.style.setProperty('--laser-gradient', orbPreset.gradient)
    beam.style.setProperty('--laser-shadow', orbPreset.shadowPrimary)
    beam.style.setProperty('--flight-angle', `${angle}deg`)
    fxLayer.appendChild(beam)

    const core = track(document.createElement('div'))
    core.className = 'game-laser-core'
    core.style.left = `${startX}px`
    core.style.top = `${startY}px`
    core.style.width = `${length}px`
    core.style.setProperty('--flight-angle', `${angle}deg`)
    fxLayer.appendChild(core)

    const impact = track(document.createElement('div'))
    impact.className = 'game-laser-impact'
    impact.style.left = `${endX}px`
    impact.style.top = `${endY}px`
    impact.style.setProperty('--laser-color', orbPreset.impactColor)
    fxLayer.appendChild(impact)

    spawnBurst(
      fxLayer,
      startX,
      startY,
      orbPreset.launchColor,
      orbPreset.launchCount,
      orbPreset.launchSpread,
      orbPreset.launchSize,
      particles,
    )

    const tl = gsap.timeline({
      onComplete: () => {
        cleanup.forEach((el) => el.remove())
        resolveDone()
      },
    })

    tl.fromTo(
      muzzle,
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1.15, duration: 0.08, ease: 'power2.out' },
      0,
    )
    tl.to(muzzle, { opacity: 0, scale: 0.6, duration: 0.22, ease: 'power2.in' }, 0.12)

    tl.fromTo(
      beam,
      { opacity: 0, scaleX: 0.08 },
      { opacity: 1, scaleX: 1, duration: 0.1, ease: 'power3.out' },
      0.04,
    )
    tl.fromTo(
      core,
      { opacity: 0, scaleX: 0.08 },
      { opacity: 0.95, scaleX: 1, duration: 0.08, ease: 'power3.out' },
      0.05,
    )

    tl.call(
      () => {
        spawnBurst(
          fxLayer,
          endX,
          endY,
          orbPreset.impactColor,
          orbPreset.impactCount,
          orbPreset.impactSpread,
          orbPreset.impactSize,
          particles,
        )
        spawnBurst(
          fxLayer,
          endX,
          endY,
          orbPreset.flashColor,
          orbPreset.flashCount,
          orbPreset.flashSpread,
          orbPreset.flashSize,
          particles,
        )
      },
      [],
      0.12,
    )

    tl.fromTo(
      impact,
      { opacity: 0, scale: 0.35 },
      { opacity: 1, scale: 1.2, duration: 0.12, ease: 'power2.out' },
      0.1,
    )
    tl.to(impact, { opacity: 0, scale: 1.55, duration: 0.28, ease: 'power2.in' }, 0.24)

    tl.fromTo(
      targetNode,
      { filter: 'brightness(1)' },
      {
        filter: `brightness(${orbPreset.brightness}) drop-shadow(0 0 16px ${orbPreset.launchColor})`,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut',
      },
      0.1,
    )

    if (orbPreset.shakeOffset > 0) {
      tl.fromTo(
        stage,
        { x: 0 },
        {
          x: orbPreset.shakeOffset,
          duration: 0.04,
          yoyo: true,
          repeat: orbPreset.shakeRepeat * 2,
          ease: 'power1.inOut',
        },
        0.1,
      )
    }

    tl.to([beam, core], { opacity: 0, duration: 0.16, ease: 'power2.in' }, 0.22)
    tl.to({}, { duration: 0.08 }, 0.4)
  })
}
