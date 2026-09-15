import { gsap } from 'gsap'
import type { ParticleBurstConfig } from '@/config/game/schema'
import type { OrbPresetConfig } from '@/config'

export function spawnBurst(
  fxLayer: HTMLElement,
  x: number,
  y: number,
  color: string,
  count: number,
  spread: number,
  baseSize: number,
  particles: ParticleBurstConfig,
) {
  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement('div')
    particle.className = 'game-vfx-particle'
    particle.style.background = color
    particle.style.width = `${baseSize + Math.random() * baseSize}px`
    particle.style.height = particle.style.width
    particle.style.left = `${x}px`
    particle.style.top = `${y}px`
    fxLayer.appendChild(particle)

    const angle = Math.random() * Math.PI * 2
    const distance = spread * (0.35 + Math.random() * 0.65)
    gsap.to(particle, {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      opacity: 0,
      scale: particles.scaleEnd,
      duration: particles.durationMin + Math.random() * particles.durationRandom,
      ease: particles.ease,
      onComplete: () => particle.remove(),
    })
  }
}

export type FireballAnimConfig = import('@/config/game/schema').FireballAnimationConfig

/** Завершается только после полного проигрыша (включая возврат снаряда, если он есть). */
export function runFireballVfx(
  opts: {
    stage: HTMLDivElement
    fxLayer: HTMLElement
    fromNode: HTMLElement
    targetNode: HTMLElement
    orbPreset: OrbPresetConfig
    particles: ParticleBurstConfig
    fireballAnim: FireballAnimConfig
    /** Skip orb flying back to caster (looks like a dead unit attacking). */
    skipReturnFlight?: boolean
  },
): Promise<void> {
  return new Promise((resolveDone) => {
  const { stage, fxLayer, fromNode, targetNode, orbPreset, particles, fireballAnim, skipReturnFlight } =
    opts

  const stageRect = stage.getBoundingClientRect()
  const fromRect = fromNode.getBoundingClientRect()
  const targetRect = targetNode.getBoundingClientRect()

  const stageScaleX = stageRect.width / stage.clientWidth || 1
  const stageScaleY = stageRect.height / stage.clientHeight || 1

  const startX = (fromRect.left - stageRect.left + fromRect.width / 2) / stageScaleX
  const startY = (fromRect.top - stageRect.top + fromRect.height / 2) / stageScaleY
  const endX = (targetRect.left - stageRect.left + targetRect.width / 2) / stageScaleX
  const endY = (targetRect.top - stageRect.top + targetRect.height / 2) / stageScaleY

  const fireball = document.createElement('div')
  fireball.className = 'game-fireball'
  fireball.style.setProperty('--orb-gradient', orbPreset.gradient)
  fireball.style.setProperty('--orb-shadow-primary', orbPreset.shadowPrimary)
  fireball.style.setProperty('--orb-shadow-secondary', orbPreset.shadowSecondary)
  fireball.style.setProperty('--trail-core', orbPreset.launchColor)
  fireball.style.left = `${startX}px`
  fireball.style.top = `${startY}px`
  fxLayer.appendChild(fireball)

  const castRing = document.createElement('div')
  castRing.className = 'game-cast-ring'
  castRing.style.left = `${startX}px`
  castRing.style.top = `${startY}px`
  castRing.style.setProperty('--cast-color', orbPreset.launchColor)
  fxLayer.appendChild(castRing)

  spawnBurst(fxLayer, startX, startY, orbPreset.launchColor, orbPreset.launchCount, orbPreset.launchSpread, orbPreset.launchSize, particles)

  const updateProjectile = (t: number) => {
    const x = startX + (endX - startX) * t
    const y = startY + (endY - startY) * t
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI)

    fireball.style.left = `${x}px`
    fireball.style.top = `${y}px`
    fireball.style.setProperty('--flight-angle', `${angle}deg`)

    if (Math.random() > orbPreset.trailChance) {
      spawnBurst(fxLayer, x, y, orbPreset.trailColor, 1, orbPreset.trailSpread, orbPreset.trailSize, particles)
    }
  }

  gsap.set(fireball, {
    scale: fireballAnim.initialScale,
    opacity: fireballAnim.initialOpacity,
  })
  gsap.fromTo(
    castRing,
    {
      scale: fireballAnim.castRing.fromScale,
      opacity: fireballAnim.castRing.fromOpacity,
    },
    {
      scale: fireballAnim.castRing.toScale,
      opacity: fireballAnim.castRing.toOpacity,
      duration: Math.max(
        fireballAnim.castRing.minDuration,
        orbPreset.chargeDuration * fireballAnim.castRing.durationChargeMultiplier,
      ),
      ease: fireballAnim.castRing.ease,
      onComplete: () => castRing.remove(),
    },
  )

  gsap.to(fireball, {
    scale: orbPreset.chargeTo,
    opacity: 1,
    duration: orbPreset.chargeDuration,
    ease: fireballAnim.chargeEase,
  })

  const flight = { t: 0 }
  gsap.to(flight, {
    t: 1,
    duration: orbPreset.travelDuration,
    ease: fireballAnim.travelEase,
    onUpdate: () => updateProjectile(flight.t),
    onComplete: () => {
      spawnBurst(fxLayer, endX, endY, orbPreset.impactColor, orbPreset.impactCount, orbPreset.impactSpread, orbPreset.impactSize, particles)
      spawnBurst(fxLayer, endX, endY, orbPreset.flashColor, orbPreset.flashCount, orbPreset.flashSpread, orbPreset.flashSize, particles)

      gsap.fromTo(
        stage,
        { x: -orbPreset.shakeOffset },
        {
          x: orbPreset.shakeOffset,
          duration: fireballAnim.screenShake.duration,
          repeat: orbPreset.shakeRepeat,
          yoyo: true,
          ease: fireballAnim.screenShake.ease,
          onComplete: () => gsap.set(stage, { x: 0 }),
        },
      )

      gsap.fromTo(
        targetNode,
        { filter: 'brightness(1)' },
        {
          filter: `brightness(${orbPreset.brightness})`,
          duration: fireballAnim.targetHit.brightnessDuration,
          yoyo: true,
          repeat: fireballAnim.targetHit.brightnessRepeat,
        },
      )

      const finishVfx = () => {
        gsap.set(stage, { x: 0 })
        resolveDone()
      }

      if (skipReturnFlight) {
        gsap.to(fireball, {
          scale: fireballAnim.fadeOut.scale,
          opacity: fireballAnim.fadeOut.opacity,
          duration: fireballAnim.fadeOut.duration,
          ease: fireballAnim.fadeOut.ease,
          onComplete: () => {
            fireball.remove()
            finishVfx()
          },
        })
        return
      }

      gsap.to(flight, {
        t: 0,
        duration: orbPreset.travelDuration * fireballAnim.returnTravelMultiplier,
        ease: fireballAnim.returnEase,
        onUpdate: () => updateProjectile(flight.t),
        onComplete: () => {
          const linger = fireballAnim.lingerBurst
          spawnBurst(fxLayer, startX, startY, orbPreset.launchColor, linger.count, linger.spread, linger.size, particles)
          gsap.to(fireball, {
            scale: fireballAnim.fadeOut.scale,
            opacity: fireballAnim.fadeOut.opacity,
            duration: fireballAnim.fadeOut.duration,
            ease: fireballAnim.fadeOut.ease,
            onComplete: () => {
              fireball.remove()
              finishVfx()
            },
          })
        },
      })
    },
  })
  })
}
