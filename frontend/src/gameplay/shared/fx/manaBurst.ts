import { gsap } from 'gsap'

import { getStageMetrics, rectToStagePoint } from './stageMetrics'

export function playManaGainBurst(
  anchorEl: HTMLElement,
  stage: HTMLElement,
  fxLayer: HTMLElement,
  options?: { amount?: number; variant?: 'hero' | 'villain' },
): Promise<void> {
  const { stageRect, scaleX, scaleY } = getStageMetrics(stage, fxLayer)
  const anchorRect = anchorEl.getBoundingClientRect()
  const { x, y } = rectToStagePoint(anchorRect, stageRect, scaleX, scaleY, 'center')

  const burst = document.createElement('div')
  burst.className = `game-fx-mana-burst game-fx-mana-burst--${options?.variant ?? 'hero'}`
  burst.innerHTML = `
    <span class="game-fx-mana-burst__label">+${options?.amount ?? 1}</span>
    <span class="game-fx-mana-burst__sub">MANA</span>
  `
  burst.style.left = `${x}px`
  burst.style.top = `${y}px`
  fxLayer.appendChild(burst)

  const slotPulse = anchorEl.querySelector('.mana-slot-outer.active-slot:last-child')
  if (slotPulse) {
    gsap.fromTo(
      slotPulse,
      { scale: 1, boxShadow: '0 0 0 rgba(56, 189, 248, 0)' },
      {
        scale: 1.2,
        boxShadow: '0 0 18px rgba(56, 189, 248, 0.85)',
        duration: 0.22,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      },
    )
  }

  return new Promise((resolve) => {
    gsap.fromTo(
      burst,
      { opacity: 0, scale: 0.6, y: 8 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.28,
        ease: 'back.out(2)',
      },
    )
    gsap.to(burst, {
      opacity: 0,
      y: -36,
      scale: 1.08,
      duration: 0.65,
      delay: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        burst.remove()
        resolve()
      },
    })
  })
}
