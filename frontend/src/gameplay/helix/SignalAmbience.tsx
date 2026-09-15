import type { CSSProperties } from 'react'

import { appConfig } from '@/config'

import './SignalAmbience.css'

const MOTE_COUNT = 14

const ARENA_MOTES = Array.from({ length: MOTE_COUNT }, (_, i) => {
  const r1 = ((i * 73 + 11) % 100) / 100
  const r2 = ((i * 47 + 29) % 100) / 100
  const r3 = ((i * 91 + 5) % 100) / 100
  const [c0, c1] = appConfig.theme.particles.colors

  return {
    id: i,
    left: 4 + r1 * 92,
    top: 8 + r2 * 84,
    delay: r3 * 12,
    duration: 16 + r2 * 10,
    color: i % 2 === 0 ? c0 : c1,
    scale: 0.45 + r2 * 0.55,
  }
})

/** Helix relay-field ambience — scan wash + signal motes. */
export function SignalAmbience() {
  return (
    <div className="game-signal-ambience" aria-hidden="true">
      <div className="game-signal-ambience__wash" />
      <div className="game-signal-ambience__grid" />
      <div className="game-signal-ambience__motes">
        {ARENA_MOTES.map((mote) => (
          <span
            key={mote.id}
            className="game-signal-ambience__mote"
            style={
              {
                left: `${mote.left}%`,
                top: `${mote.top}%`,
                animationDelay: `${mote.delay}s`,
                animationDuration: `${mote.duration}s`,
                '--mote-color': mote.color,
                '--mote-scale': mote.scale,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="game-signal-ambience__vignette" />
    </div>
  )
}
