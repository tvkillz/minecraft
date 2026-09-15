import { gsap } from 'gsap'

import type { ParticleBurstConfig } from '@/config/game/schema'
import type { OrbPresetConfig } from '@/config'

import { spawnBurst } from '../shared/vfx'
import { rectToStagePoint } from '../shared/fx/stageMetrics'

/**
 * Wildreach combat strike — claw slash / trail pounce.
 * Talon chevron arcs toward the target with dust wake + scratch impact.
 * No return flight (predator strike, not a bouncing orb).
 */
export function runClawStrikeVfx(opts: {
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
    const dist = Math.max(40, Math.hypot(dx, dy))
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    // Slight parabolic lift so the slash feels like a pounce, not a laser
    const arcLift = Math.min(56, dist * 0.12) * (startY > endY ? 1 : -0.35)

    const cleanup: HTMLElement[] = []
    const track = (el: HTMLElement) => {
      cleanup.push(el)
      return el
    }

    const muzzle = track(document.createElement('div'))
    muzzle.className = 'game-claw-muzzle'
    muzzle.style.left = `${startX}px`
    muzzle.style.top = `${startY}px`
    muzzle.style.setProperty('--claw-color', orbPreset.launchColor)
    fxLayer.appendChild(muzzle)

    const blaze = track(document.createElement('div'))
    blaze.className = 'game-claw-blaze'
    blaze.style.left = `${startX}px`
    blaze.style.top = `${startY}px`
    blaze.style.setProperty('--claw-color', orbPreset.launchColor)
    fxLayer.appendChild(blaze)

    const slash = track(document.createElement('div'))
    slash.className = 'game-claw-slash'
    slash.style.left = `${startX}px`
    slash.style.top = `${startY}px`
    slash.style.setProperty('--claw-gradient', orbPreset.gradient)
    slash.style.setProperty('--claw-shadow', orbPreset.shadowPrimary)
    slash.style.setProperty('--claw-color', orbPreset.launchColor)
    slash.style.setProperty('--flight-angle', `${angle}deg`)
    fxLayer.appendChild(slash)

    const wake = track(document.createElement('div'))
    wake.className = 'game-claw-wake'
    wake.style.left = `${startX}px`
    wake.style.top = `${startY}px`
    wake.style.setProperty('--claw-color', orbPreset.trailColor)
    wake.style.setProperty('--flight-angle', `${angle}deg`)
    fxLayer.appendChild(wake)

    const scratches = track(document.createElement('div'))
    scratches.className = 'game-claw-scratches'
    scratches.style.left = `${endX}px`
    scratches.style.top = `${endY}px`
    scratches.style.setProperty('--claw-color', orbPreset.impactColor)
    scratches.style.setProperty('--flight-angle', `${angle}deg`)
    scratches.innerHTML =
      '<span class="game-claw-scratch"></span><span class="game-claw-scratch"></span><span class="game-claw-scratch"></span>'
    fxLayer.appendChild(scratches)

    const impact = track(document.createElement('div'))
    impact.className = 'game-claw-impact'
    impact.style.left = `${endX}px`
    impact.style.top = `${endY}px`
    impact.style.setProperty('--claw-color', orbPreset.impactColor)
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

    // Warm dust kick at launch (ochre / ash, not neon)
    spawnBurst(
      fxLayer,
      startX,
      startY,
      'rgba(196, 154, 58, 0.55)',
      5,
      42,
      4,
      particles,
    )

    const travel = { t: 0 }
    const travelDuration = Math.max(0.22, orbPreset.travelDuration)

    const samplePoint = (t: number) => {
      const x = startX + dx * t
      const y = startY + dy * t + Math.sin(Math.PI * t) * arcLift
      const nextT = Math.min(1, t + 0.02)
      const nx = startX + dx * nextT
      const ny = startY + dy * nextT + Math.sin(Math.PI * nextT) * arcLift
      const flightAngle = (Math.atan2(ny - y, nx - x) * 180) / Math.PI
      return { x, y, flightAngle }
    }

    const tl = gsap.timeline({
      onComplete: () => {
        cleanup.forEach((el) => el.remove())
        gsap.set(stage, { x: 0 })
        resolveDone()
      },
    })

    // Wind-up: blaze plate + muzzle flare
    tl.fromTo(
      blaze,
      { opacity: 0, scale: 0.55, y: 6 },
      { opacity: 1, scale: 1.05, y: 0, duration: 0.1, ease: 'power2.out' },
      0,
    )
    tl.to(blaze, { opacity: 0, scale: 0.7, duration: 0.2, ease: 'power2.in' }, 0.14)

    tl.fromTo(
      muzzle,
      { opacity: 0, scale: 0.35 },
      { opacity: 1, scale: 1.2, duration: 0.1, ease: 'power2.out' },
      0.02,
    )
    tl.to(muzzle, { opacity: 0, scale: 0.5, duration: 0.22, ease: 'power2.in' }, 0.14)

    // Slash charge-in then flight along arc
    tl.fromTo(
      slash,
      { opacity: 0, scale: 0.45 },
      { opacity: 1, scale: 1, duration: orbPreset.chargeDuration * 0.85, ease: 'power2.out' },
      0.06,
    )
    tl.fromTo(
      wake,
      { opacity: 0, scaleX: 0.2 },
      { opacity: 0.75, scaleX: 1, duration: 0.12, ease: 'power2.out' },
      0.1,
    )

    tl.to(
      travel,
      {
        t: 1,
        duration: travelDuration,
        ease: 'power2.in',
        onUpdate: () => {
          const { x, y, flightAngle } = samplePoint(travel.t)
          slash.style.left = `${x}px`
          slash.style.top = `${y}px`
          slash.style.setProperty('--flight-angle', `${flightAngle}deg`)
          wake.style.left = `${x}px`
          wake.style.top = `${y}px`
          wake.style.setProperty('--flight-angle', `${flightAngle}deg`)

          if (Math.random() > orbPreset.trailChance) {
            spawnBurst(
              fxLayer,
              x,
              y,
              orbPreset.trailColor,
              1,
              orbPreset.trailSpread,
              orbPreset.trailSize,
              particles,
            )
          }
          // Occasional larger dust mote
          if (Math.random() > 0.72) {
            spawnBurst(fxLayer, x, y, 'rgba(240, 235, 228, 0.35)', 1, 22, 5, particles)
          }
        },
      },
      0.12,
    )

    const impactAt = 0.12 + travelDuration

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
        spawnBurst(fxLayer, endX, endY, 'rgba(196, 154, 58, 0.4)', 6, 48, 5, particles)
      },
      [],
      impactAt,
    )

    tl.fromTo(
      impact,
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1.35, duration: 0.12, ease: 'power2.out' },
      impactAt,
    )
    tl.to(impact, { opacity: 0, scale: 1.8, duration: 0.32, ease: 'power2.in' }, impactAt + 0.12)

    tl.fromTo(
      scratches,
      { opacity: 0, scale: 0.55 },
      { opacity: 1, scale: 1, duration: 0.1, ease: 'back.out(2)' },
      impactAt + 0.02,
    )
    tl.to(
      scratches,
      { opacity: 0, scale: 1.12, duration: 0.38, ease: 'power2.in' },
      impactAt + 0.28,
    )

    tl.to([slash, wake], { opacity: 0, scale: 0.7, duration: 0.12, ease: 'power2.in' }, impactAt)

    tl.fromTo(
      targetNode,
      { filter: 'brightness(1)' },
      {
        filter: `brightness(${orbPreset.brightness}) drop-shadow(0 0 14px ${orbPreset.launchColor})`,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut',
      },
      impactAt,
    )

    if (orbPreset.shakeOffset > 0) {
      tl.fromTo(
        stage,
        { x: 0 },
        {
          x: orbPreset.shakeOffset,
          duration: 0.045,
          yoyo: true,
          repeat: orbPreset.shakeRepeat * 2,
          ease: 'power1.inOut',
        },
        impactAt,
      )
    }

    tl.to({}, { duration: 0.06 }, impactAt + 0.48)
  })
}
