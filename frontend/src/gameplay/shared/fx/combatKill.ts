import { gsap } from 'gsap'

import { rectToStagePoint } from './stageMetrics'
import type { StageMetrics } from './stageMetrics'

export function pulseAttacker(attackerEl: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    attackerEl.classList.add('game-board-card-wrap--striking')
    gsap.fromTo(
      attackerEl,
      { filter: 'brightness(1)' },
      {
        filter: 'brightness(1.45) drop-shadow(0 0 22px rgba(251, 191, 36, 0.9))',
        duration: 0.18,
        yoyo: true,
        repeat: 3,
        ease: 'power2.inOut',
        onComplete: () => {
          attackerEl.classList.remove('game-board-card-wrap--striking')
          resolve()
        },
      },
    )
  })
}

export function playExecutedKill(
  targetWrap: HTMLElement,
  metrics: StageMetrics,
): Promise<void> {
  const { fxLayer, stageRect, scaleX, scaleY } = metrics
  const rect = targetWrap.getBoundingClientRect()
  const { x, y } = rectToStagePoint(rect, stageRect, scaleX, scaleY)

  const label = document.createElement('div')
  label.className = 'game-fx-executed'
  label.textContent = 'EXECUTED'
  label.style.left = `${x}px`
  label.style.top = `${y}px`
  fxLayer.appendChild(label)

  targetWrap.classList.add('game-board-card-wrap--executed')

  return new Promise((resolve) => {
    gsap.fromTo(
      label,
      { opacity: 0, scale: 0.5, y: 10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'back.out(3)' },
    )

    gsap.to(label, {
      opacity: 0,
      y: -28,
      duration: 0.45,
      delay: 0.55,
      ease: 'power2.in',
    })

    gsap.to(targetWrap, {
      opacity: 0,
      scale: 0.4,
      rotation: 12,
      filter: 'brightness(2) blur(4px)',
      duration: 0.55,
      delay: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        label.remove()
        targetWrap.classList.remove('game-board-card-wrap--executed')
        resolve()
      },
    })
  })
}
