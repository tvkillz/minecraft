import { gsap } from 'gsap'

import { rectToStagePoint } from '../../shared/fx/stageMetrics'
import type { StageMetrics } from '../../shared/fx/stageMetrics'

export function playFreezeLabel(
  anchorEl: HTMLElement,
  metrics: StageMetrics,
  success: boolean,
): Promise<void> {
  const { fxLayer, stageRect, scaleX, scaleY } = metrics
  const rect = anchorEl.getBoundingClientRect()
  const { x, y } = rectToStagePoint(rect, stageRect, scaleX, scaleY)

  const label = document.createElement('div')
  label.className = success ? 'game-fx-signal-lock' : 'game-fx-signal-lock-failed'
  label.textContent = success ? 'SIGNAL LOCK' : 'LOCK FAILED'
  label.style.left = `${x}px`
  label.style.top = `${y}px`
  fxLayer.appendChild(label)

  if (success) {
    anchorEl.classList.add('game-board-card-wrap--freeze-hit')
  }

  return new Promise((resolve) => {
    gsap.fromTo(
      label,
      { opacity: 0, scale: 0.6, y: 10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'back.out(2.2)' },
    )

    gsap.to(label, {
      opacity: 0,
      y: success ? -28 : -18,
      duration: 0.48,
      delay: 0.62,
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
          filter: 'brightness(1.3) drop-shadow(0 0 16px rgba(61, 184, 212, 0.9))',
          duration: 0.16,
          yoyo: true,
          repeat: 2,
          ease: 'power2.inOut',
        },
      )
    }
  })
}
