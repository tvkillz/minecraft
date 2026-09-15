import { gsap } from 'gsap'

import { rectToStagePoint } from '../../shared/fx/stageMetrics'
import type { StageMetrics } from '../../shared/fx/stageMetrics'
import { iySec } from '../animScale'

export function pulseAttacker(attackerEl: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    attackerEl.classList.add('game-board-card-wrap--striking')
    gsap.fromTo(
      attackerEl,
      { filter: 'brightness(1)' },
      {
        filter: 'brightness(1.05) drop-shadow(0 0 10px rgba(184, 220, 232, 0.4))',
        duration: iySec(0.28),
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
        onComplete: () => {
          attackerEl.classList.remove('game-board-card-wrap--striking')
          resolve()
        },
      },
    )
  })
}

/** Card leaves the board gently — not "EXECUTED". */
export function playExecutedKill(
  targetWrap: HTMLElement,
  metrics: StageMetrics,
): Promise<void> {
  const { fxLayer, stageRect, scaleX, scaleY } = metrics
  const rect = targetWrap.getBoundingClientRect()
  const { x, y } = rectToStagePoint(rect, stageRect, scaleX, scaleY)

  const label = document.createElement('div')
  label.className = 'game-fx-rest'
  label.textContent = 'At rest'
  label.style.left = `${x}px`
  label.style.top = `${y}px`
  fxLayer.appendChild(label)

  targetWrap.classList.add('game-board-card-wrap--rest')

  return new Promise((resolve) => {
    gsap.fromTo(
      label,
      { opacity: 0, scale: 0.92, y: 6 },
      { opacity: 1, scale: 1, y: 0, duration: iySec(0.28), ease: 'sine.out' },
    )

    gsap.to(label, {
      opacity: 0,
      y: -20,
      duration: iySec(0.55),
      delay: iySec(0.7),
      ease: 'sine.in',
    })

    gsap.to(targetWrap, {
      opacity: 0,
      scale: 0.92,
      y: -16,
      filter: 'brightness(1.06) saturate(0.85)',
      duration: iySec(0.65),
      delay: iySec(0.25),
      ease: 'sine.inOut',
      onComplete: () => {
        label.remove()
        targetWrap.classList.remove('game-board-card-wrap--rest')
        resolve()
      },
    })
  })
}
