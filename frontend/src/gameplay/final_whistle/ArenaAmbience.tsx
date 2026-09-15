import type { CSSProperties } from 'react'

import { appConfig } from '@/config'

import './ArenaAmbience.css'

const CONFETTI_COUNT = 14

const ARENA_CONFETTI = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
  const r1 = ((i * 73 + 11) % 100) / 100
  const r2 = ((i * 47 + 29) % 100) / 100
  const r3 = ((i * 91 + 5) % 100) / 100
  const [c0, c1] = appConfig.theme.particles.colors

  return {
    id: i,
    left: 4 + r1 * 92,
    delay: r3 * 22,
    duration: 18 + r2 * 16,
    color: i % 2 === 0 ? c0 : c1,
    scale: 0.5 + r2 * 0.55,
  }
})

/** Stadium floodlit night ambience for the Final Whistle arena. */
export function ArenaAmbience() {
  return (
    <div className="game-arena-ambience" aria-hidden="true">
      <div className="game-arena-ambience__wash" />
      <div className="game-arena-ambience__komorebi" />
      <div className="game-arena-ambience__petals">
        {ARENA_CONFETTI.map((p) => (
          <span
            key={p.id}
            className="game-arena-ambience__petal"
            style={
              {
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                '--petal-color': p.color,
                '--petal-scale': p.scale,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="game-arena-ambience__vignette" />
    </div>
  )
}
