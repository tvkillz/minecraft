export interface StageMetrics {
  stage: HTMLElement
  fxLayer: HTMLElement
  stageRect: DOMRect
  scaleX: number
  scaleY: number
}

export function getStageMetrics(stage: HTMLElement, fxLayer: HTMLElement): StageMetrics {
  const stageRect = stage.getBoundingClientRect()
  return {
    stage,
    fxLayer,
    stageRect,
    scaleX: stageRect.width / stage.clientWidth || 1,
    scaleY: stageRect.height / stage.clientHeight || 1,
  }
}

export function rectToStagePoint(
  rect: DOMRect,
  stageRect: DOMRect,
  scaleX: number,
  scaleY: number,
  anchor: 'center' | 'top-left' = 'center',
) {
  if (anchor === 'top-left') {
    return {
      x: (rect.left - stageRect.left) / scaleX,
      y: (rect.top - stageRect.top) / scaleY,
    }
  }
  return {
    x: (rect.left - stageRect.left + rect.width / 2) / scaleX,
    y: (rect.top - stageRect.top + rect.height / 2) / scaleY,
  }
}
