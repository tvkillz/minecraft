import { gsap } from 'gsap'

import { rectToStagePoint } from '../../shared/fx/stageMetrics'
import type { StageMetrics } from '../../shared/fx/stageMetrics'
import { iySec } from '../animScale'

export function playFreezeLabel(
  anchorEl: HTMLElement,
  metrics: StageMetrics,
  success: boolean,
): Promise<void> {
  const { fxLayer, stageRect, scaleX, scaleY } = metrics
  const rect = anchorEl.getBoundingClientRect()
  const { x, y } = rectToStagePoint(rect, stageRect, scaleX, scaleY)

  const label = document.createElement('div')
  label.className = success ? 'game-fx-stillness' : 'game-fx-stillness-failed'
  label.textContent = success ? 'Stillness' : 'Unmoved'
  label.style.left = `${x}px`
  label.style.top = `${y}px`
  fxLayer.appendChild(label)

  if (success) {
    anchorEl.classList.add('game-board-card-wrap--freeze-hit')
  }

  return new Promise((resolve) => {
    gsap.fromTo(
      label,
      { opacity: 0, scale: 0.94, y: 8 },
      { opacity: 1, scale: 1, y: 0, duration: iySec(0.28), ease: 'sine.out' },
    )

    gsap.to(label, {
      opacity: 0,
      y: success ? -22 : -16,
      duration: iySec(0.55),
      delay: iySec(0.75),
      ease: 'sine.in',
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
          filter: 'brightness(1.06) drop-shadow(0 0 12px rgba(184, 220, 232, 0.65))',
          duration: iySec(0.24),
          yoyo: true,
          repeat: 2,
          ease: 'sine.inOut',
        },
      )
    }
  })
}
