import { gsap } from 'gsap'

import type { ParticleBurstConfig } from '@/config/game/schema'
import type { OrbPresetConfig } from '@/config'

import { spawnBurst } from '../shared/vfx'
import { rectToStagePoint } from '../shared/fx/stageMetrics'
import { IYASHIKEI_ANIM_SCALE } from './animScale'

/** Ambient field strike — no projectile; light washes the arena then settles on the target. */
export function runKomorebiStrikeVfx(opts: {
  stage: HTMLDivElement
  fxLayer: HTMLElement
  targetNode: HTMLElement
  attackerNode?: HTMLElement | null
  orbPreset: OrbPresetConfig
  particles: ParticleBurstConfig
  faceHit?: boolean
}): Promise<void> {
  const { stage, fxLayer, targetNode, attackerNode, orbPreset, particles, faceHit } = opts

  return new Promise((resolve) => {
    const stageRect = stage.getBoundingClientRect()
    const scaleX = stageRect.width / stage.clientWidth || 1
    const scaleY = stageRect.height / stage.clientHeight || 1
    const stageW = stage.clientWidth
    const stageH = stage.clientHeight

    const targetRect = targetNode.getBoundingClientRect()
    const { x: targetX, y: targetY } = rectToStagePoint(targetRect, stageRect, scaleX, scaleY)

    const cleanup: HTMLElement[] = []
    const track = (el: HTMLElement) => {
      cleanup.push(el)
      return el
    }

    const veil = track(document.createElement('div'))
    veil.className = `game-field-veil game-field-veil--${orbPreset.id}`
    fxLayer.appendChild(veil)

    const rayCount = orbPreset.id === 'orange' ? 5 : orbPreset.id === 'green' ? 4 : 3
    for (let i = 0; i < rayCount; i += 1) {
      const ray = track(document.createElement('div'))
      ray.className = `game-field-ray game-field-ray--${orbPreset.id}`
      ray.style.left = `${12 + (i / Math.max(rayCount - 1, 1)) * 76}%`
      ray.style.animationDelay = `${i * 0.06}s`
      fxLayer.appendChild(ray)
    }

    const moteCount = orbPreset.id === 'green' ? 14 : 10
    for (let i = 0; i < moteCount; i += 1) {
      const mote = track(document.createElement('div'))
      mote.className = `game-field-mote game-field-mote--${orbPreset.id}`
      const startX = 80 + Math.random() * (stageW - 160)
      const startY = 40 + Math.random() * (stageH * 0.55)
      mote.style.left = `${startX}px`
      mote.style.top = `${startY}px`
      mote.style.setProperty('--mote-drift', `${(Math.random() - 0.5) * 48}px`)
      fxLayer.appendChild(mote)
    }

    if (attackerNode?.isConnected) {
      const attackerRect = attackerNode.getBoundingClientRect()
      const { x: ax, y: ay } = rectToStagePoint(attackerRect, stageRect, scaleX, scaleY)
      const whisper = track(document.createElement('div'))
      whisper.className = `game-field-whisper game-field-whisper--${orbPreset.id}`
      whisper.style.left = `${ax}px`
      whisper.style.top = `${ay}px`
      fxLayer.appendChild(whisper)
    }

    const bloom = track(document.createElement('div'))
    bloom.className = `game-field-bloom game-field-bloom--${orbPreset.id}${faceHit ? ' game-field-bloom--face' : ''}`
    bloom.style.left = `${targetX}px`
    bloom.style.top = `${targetY}px`
    fxLayer.appendChild(bloom)

    const ripple = track(document.createElement('div'))
    ripple.className = `game-field-ripple game-field-ripple--${orbPreset.id}`
    ripple.style.left = `${targetX}px`
    ripple.style.top = `${targetY}px`
    fxLayer.appendChild(ripple)

    const tl = gsap.timeline({
      timeScale: 1 / IYASHIKEI_ANIM_SCALE,
      onComplete: () => {
        cleanup.forEach((el) => el.remove())
        resolve()
      },
    })

    tl.to(veil, { opacity: 1, duration: 0.32, ease: 'sine.out' }, 0)
    tl.to(veil, { opacity: 0, duration: 0.55, ease: 'sine.in' }, 0.45)

    cleanup
      .filter((el) => el.classList.contains('game-field-ray'))
      .forEach((ray, i) => {
        tl.fromTo(
          ray,
          { opacity: 0, scaleY: 0.65 },
          { opacity: 0.55, scaleY: 1, duration: 0.42, ease: 'sine.out' },
          0.04 + i * 0.05,
        )
        tl.to(ray, { opacity: 0, duration: 0.38, ease: 'sine.in' }, 0.38 + i * 0.04)
      })

    cleanup
      .filter((el) => el.classList.contains('game-field-mote'))
      .forEach((mote, i) => {
        tl.fromTo(
          mote,
          { opacity: 0, y: 0 },
          {
            opacity: 0.75,
            y: 24 + Math.random() * 36,
            duration: 0.85 + (i % 3) * 0.12,
            ease: 'sine.out',
          },
          0.08 + (i % 5) * 0.03,
        )
        tl.to(mote, { opacity: 0, duration: 0.45, ease: 'sine.in' }, 0.55 + (i % 4) * 0.04)
      })

    const whisperEl = cleanup.find((el) => el.classList.contains('game-field-whisper'))
    if (whisperEl) {
      tl.fromTo(
        whisperEl,
        { opacity: 0, scale: 0.85 },
        { opacity: 0.7, scale: 1.15, duration: 0.38, ease: 'sine.out' },
        0.1,
      )
      tl.to(whisperEl, { opacity: 0, scale: 1.35, duration: 0.42, ease: 'sine.in' }, 0.42)
    }

    tl.fromTo(
      bloom,
      { opacity: 0, scale: 0.72 },
      { opacity: 0.92, scale: faceHit ? 1.35 : 1.08, duration: 0.38, ease: 'sine.out' },
      0.28,
    )
    tl.to(bloom, { opacity: 0, scale: faceHit ? 1.55 : 1.22, duration: 0.52, ease: 'sine.in' }, 0.58)

    tl.fromTo(
      ripple,
      { opacity: 0, scale: 0.35 },
      { opacity: 0.55, scale: faceHit ? 2.4 : 1.85, duration: 0.62, ease: 'sine.out' },
      0.32,
    )
    tl.to(ripple, { opacity: 0, scale: faceHit ? 2.8 : 2.15, duration: 0.48, ease: 'sine.in' }, 0.62)

    tl.call(
      () => {
        spawnBurst(
          fxLayer,
          targetX,
          targetY,
          orbPreset.impactColor,
          Math.max(4, Math.floor(orbPreset.impactCount * 0.55)),
          orbPreset.impactSpread * 0.85,
          orbPreset.impactSize,
          particles,
        )
      },
      [],
      0.34,
    )

    tl.fromTo(
      targetNode,
      { filter: 'brightness(1)' },
      {
        filter: `brightness(${orbPreset.brightness}) drop-shadow(0 0 14px ${orbPreset.launchColor})`,
        duration: 0.22,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
      },
      0.36,
    )

    tl.to({}, { duration: 0.12 }, 0.92)
  })
}
