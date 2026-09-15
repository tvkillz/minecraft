import { gsap } from 'gsap'

export function animateCardToBoard(
  flyingEl: HTMLElement,
  fromRect: DOMRect,
  toRect: DOMRect,
  stageRect: DOMRect,
  stageScaleX: number,
  stageScaleY: number,
): Promise<void> {
  const startX = (fromRect.left - stageRect.left + fromRect.width / 2) / stageScaleX
  const startY = (fromRect.top - stageRect.top + fromRect.height / 2) / stageScaleY
  const endX = (toRect.left - stageRect.left + toRect.width / 2) / stageScaleX
  const endY = (toRect.top - stageRect.top + toRect.height / 2) / stageScaleY

  flyingEl.style.position = 'absolute'
  flyingEl.style.left = `${startX}px`
  flyingEl.style.top = `${startY}px`
  flyingEl.style.transform = 'translate(-50%, -50%)'
  flyingEl.style.zIndex = '50'
  flyingEl.style.pointerEvents = 'none'

  return new Promise((resolve) => {
    gsap.fromTo(
      flyingEl,
      { x: 0, y: 0, scale: 0.85, opacity: 0.9 },
      {
        x: endX - startX,
        y: endY - startY,
        scale: 1,
        opacity: 1,
        duration: 0.45,
        ease: 'power2.inOut',
        onComplete: () => {
          flyingEl.remove()
          resolve()
        },
      },
    )
  })
}
