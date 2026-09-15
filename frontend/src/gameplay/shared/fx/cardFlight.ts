import { gsap } from 'gsap'

import { rectToStagePoint } from './stageMetrics'
import type { StageMetrics } from './stageMetrics'

export function flyElementBetween(
  flyingEl: HTMLElement,
  fromRect: DOMRect,
  toRect: DOMRect,
  metrics: StageMetrics,
  options?: {
    duration?: number
    startScale?: number
    endScale?: number
    arc?: number
    /** Single continuous ease (deck → hand). */
    smooth?: boolean
  },
): Promise<() => void> {
  const { stageRect, scaleX, scaleY, fxLayer } = metrics
  const start = rectToStagePoint(fromRect, stageRect, scaleX, scaleY)
  const end = rectToStagePoint(toRect, stageRect, scaleX, scaleY)
  const arc = options?.arc ?? -40

  flyingEl.style.position = 'absolute'
  flyingEl.style.left = `${start.x}px`
  flyingEl.style.top = `${start.y}px`
  flyingEl.style.transform = 'translate(-50%, -50%)'
  flyingEl.style.zIndex = '80'
  flyingEl.style.pointerEvents = 'none'
  fxLayer.appendChild(flyingEl)

  const dx = end.x - start.x
  const dy = end.y - start.y
  const duration = options?.duration ?? 0.48

  const removeClone = () => {
    if (flyingEl.parentNode) flyingEl.remove()
  }

  return new Promise((resolve) => {
    if (options?.smooth) {
      gsap.fromTo(
        flyingEl,
        {
          x: 0,
          y: 0,
          scale: options?.startScale ?? 0.55,
          opacity: 0.9,
          rotation: -6,
        },
        {
          x: dx,
          y: dy,
          scale: options?.endScale ?? 1,
          opacity: 1,
          rotation: 2,
          duration,
          ease: 'power1.inOut',
          onComplete: () => resolve(removeClone),
        },
      )
      return
    }

    const tl = gsap.timeline({
      onComplete: () => resolve(removeClone),
    })

    tl.fromTo(
      flyingEl,
      {
        x: 0,
        y: 0,
        scale: options?.startScale ?? 0.75,
        opacity: 0.85,
        rotation: -8,
      },
      {
        x: dx * 0.5,
        y: dy * 0.5 + arc,
        scale: (options?.endScale ?? 1) * 0.95,
        opacity: 1,
        rotation: 2,
        duration: duration * 0.55,
        ease: 'power1.out',
      },
    )

    tl.to(flyingEl, {
      x: dx,
      y: dy,
      scale: options?.endScale ?? 1,
      rotation: 4,
      duration: duration * 0.45,
      ease: 'power1.in',
    })
  })
}

export function createCardBackClone(className = 'game-enemy-card-back'): HTMLElement {
  const el = document.createElement('div')
  el.className = `${className} game-card-fly-clone`
  return el
}

export function createThumbClone(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement
  clone.classList.add('game-card-fly-clone')
  clone.style.transform = 'none'
  clone.style.animation = 'none'
  return clone
}
