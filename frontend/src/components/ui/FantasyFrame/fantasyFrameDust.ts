export type FantasyFrameDust = {
  id: number
  left: number
  top: number
  size: number
  delay: number
  duration: number
  drift: number
  opacity: number
  tone: 'dust' | 'ember' | 'ash'
}

const DUST_COUNT = 16

/** Deterministic motes — stable across renders, no random(). */
export const FANTASY_FRAME_DUST: FantasyFrameDust[] = Array.from({ length: DUST_COUNT }, (_, i) => {
  const r1 = ((i * 73 + 11) % 100) / 100
  const r2 = ((i * 47 + 29) % 100) / 100
  const r3 = ((i * 91 + 7) % 100) / 100
  const r4 = ((i * 59 + 41) % 100) / 100
  const r5 = ((i * 37 + 53) % 100) / 100

  return {
    id: i,
    left: 4 + r1 * 92,
    top: 6 + r2 * 88,
    size: 1 + r3 * 2.5,
    delay: r4 * 8,
    duration: 9 + r5 * 14,
    drift: -18 + r2 * 36,
    opacity: 0.18 + r3 * 0.42,
    tone: i % 5 === 0 ? 'ember' : i % 7 === 0 ? 'ash' : 'dust',
  }
})
