import { gsap } from 'gsap'

import { rectToStagePoint } from '../../shared/fx/stageMetrics'
import type { StageMetrics } from '../../shared/fx/stageMetrics'

export function pulseAttacker(attackerEl: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    attackerEl.classList.add('game-board-card-wrap--striking')
    gsap.fromTo(
      attackerEl,
      { filter: 'brightness(1)' },
      {
        filter: 'brightness(1.4) drop-shadow(0 0 18px rgba(61, 184, 212, 0.85))',
        duration: 0.14,
        yoyo: true,
        repeat: 2,
        ease: 'power2.inOut',
        onComplete: () => {
          attackerEl.classList.remove('game-board-card-wrap--striking')
          resolve()
        },
      },
    )
  })
}

/** Frame goes offline — sci-fi kill, not voidborn EXECUTED. */
export function playExecutedKill(
  targetWrap: HTMLElement,
  metrics: StageMetrics,
): Promise<void> {
  const { fxLayer, stageRect, scaleX, scaleY } = metrics
  const rect = targetWrap.getBoundingClientRect()
  const { x, y } = rectToStagePoint(rect, stageRect, scaleX, scaleY)

  const label = document.createElement('div')
  label.className = 'game-fx-deactivated'
  label.textContent = 'DEACTIVATED'
  label.style.left = `${x}px`
  label.style.top = `${y}px`
  fxLayer.appendChild(label)

  targetWrap.classList.add('game-board-card-wrap--deactivated')

  return new Promise((resolve) => {
    gsap.fromTo(
      label,
      { opacity: 0, scale: 0.55, y: 8 },
      { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: 'back.out(2.4)' },
    )

    gsap.to(label, {
      opacity: 0,
      y: -26,
      duration: 0.42,
      delay: 0.55,
      ease: 'power2.in',
    })

    gsap.to(targetWrap, {
      opacity: 0,
      scale: 0.55,
      filter: 'brightness(1.8) saturate(0.2) blur(2px)',
      duration: 0.5,
      delay: 0.28,
      ease: 'power2.in',
      onComplete: () => {
        label.remove()
        targetWrap.classList.remove('game-board-card-wrap--deactivated')
        resolve()
      },
    })
  })
}
