import type { CSSProperties } from 'react'

import { appConfig } from '@/config'

import './ArenaAmbience.css'

const PETAL_COUNT = 10

const ARENA_PETALS = Array.from({ length: PETAL_COUNT }, (_, i) => {
  const r1 = ((i * 73 + 11) % 100) / 100
  const r2 = ((i * 47 + 29) % 100) / 100
  const r3 = ((i * 91 + 5) % 100) / 100
  const [c0, c1] = appConfig.theme.particles.colors

  return {
    id: i,
    left: 6 + r1 * 88,
    delay: r3 * 18,
    duration: 22 + r2 * 14,
    color: i % 2 === 0 ? c0 : c1,
    scale: 0.55 + r2 * 0.45,
  }
})

/** Soft landing-style ambience for the play arena (petals + wash, no interaction). */
export function ArenaAmbience() {
  return (
    <div className="game-arena-ambience" aria-hidden="true">
      <div className="game-arena-ambience__wash" />
      <div className="game-arena-ambience__komorebi" />
      <div className="game-arena-ambience__petals">
        {ARENA_PETALS.map((petal) => (
          <span
            key={petal.id}
            className="game-arena-ambience__petal"
            style={
              {
                left: `${petal.left}%`,
                animationDelay: `${petal.delay}s`,
                animationDuration: `${petal.duration}s`,
                '--petal-color': petal.color,
                '--petal-scale': petal.scale,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="game-arena-ambience__vignette" />
    </div>
  )
}
