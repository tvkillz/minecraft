/** Fixed hover preview size — matches full-width collection sell grid at 1.25× scale. */
export const CARD_HOVER_PREVIEW_WIDTH_PX = 330
export const CARD_HOVER_PREVIEW_GAP_PX = 12

export type CardHoverPreviewPosition = {
  top: number
  left: number
  width: number
  height: number
}

export function computeCardHoverPreviewPosition(
  anchorRect: DOMRect,
): CardHoverPreviewPosition {
  const width = CARD_HOVER_PREVIEW_WIDTH_PX
  const height = width * 1.5
  const top = anchorRect.top + (anchorRect.height - height) / 2
  let left = anchorRect.left - width - CARD_HOVER_PREVIEW_GAP_PX

  if (left < 8) {
    left = anchorRect.right + CARD_HOVER_PREVIEW_GAP_PX
  }

  const maxLeft = window.innerWidth - width - 8
  if (left > maxLeft) left = maxLeft

  return { top, left, width, height }
}
