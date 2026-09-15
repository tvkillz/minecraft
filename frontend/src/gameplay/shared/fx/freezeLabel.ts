import { gsap } from 'gsap'

import { rectToStagePoint } from './stageMetrics'
import type { StageMetrics } from './stageMetrics'

export function playFreezeLabel(
  anchorEl: HTMLElement,
  metrics: StageMetrics,
  success: boolean,
): Promise<void> {
  const { fxLayer, stageRect, scaleX, scaleY } = metrics
  const rect = anchorEl.getBoundingClientRect()
  const { x, y } = rectToStagePoint(rect, stageRect, scaleX, scaleY)

  const label = document.createElement('div')
  label.className = success ? 'game-fx-freeze' : 'game-fx-freeze-failed'
  label.textContent = success ? 'FREEZE' : 'FREEZE FAILED'
  label.style.left = `${x}px`
  label.style.top = `${y}px`
  fxLayer.appendChild(label)

  if (success) {
    anchorEl.classList.add('game-board-card-wrap--freeze-hit')
  }

  return new Promise((resolve) => {
    gsap.fromTo(
      label,
      { opacity: 0, scale: 0.55, y: 12 },
      { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: 'back.out(2.5)' },
    )

    gsap.to(label, {
      opacity: 0,
      y: success ? -32 : -22,
      duration: 0.5,
      delay: 0.65,
      ease: 'power2.in',
      onComplete: () => {
        label.remove()
        anchorEl.classList.remove('game-board-card-wrap--freeze-hit')
        resolve()
      },
    })

    if (success) {
      gsap.fromTo(
        anchorEl,
        { filter: 'brightness(1)' },
        {
          filter: 'brightness(1.35) drop-shadow(0 0 18px rgba(125, 211, 252, 0.95))',
          duration: 0.2,
          yoyo: true,
          repeat: 2,
          ease: 'power2.inOut',
        },
      )
    }
  })
}
