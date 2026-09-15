import type { Ref } from 'react'

import './Avatar.css'

interface AvatarProps {
  name: string
  health: number
  currentMana: number
  maxMana: number
  colorPalette?: 'default' | 'darkRed'
  manaRef?: Ref<HTMLDivElement>
  containerRef?: Ref<HTMLDivElement>
}

/** Helix operator HUD — hex ring, signal cells, integrity chip. */
export const Avatar = ({
  name,
  health,
  currentMana,
  maxMana,
  colorPalette = 'default',
  manaRef,
  containerRef,
}: AvatarProps) => {
  const manaScale =
    maxMana > 6
      ? Math.max(0.62, (6 * 22 + 5 * 4) / (maxMana * 22 + (maxMana - 1) * 4))
      : 1

  return (
    <div
      className={`helix-avatar helix-avatar--${colorPalette === 'darkRed' ? 'static' : 'signal'}`}
      ref={containerRef}
    >
      <div className="helix-avatar__mana" ref={manaRef}>
        <div
          className="helix-avatar__mana-rail"
          style={{ '--mana-scale': manaScale } as Record<string, string | number>}
        >
          {Array.from({ length: maxMana }).map((_, index) => {
            const isActive = index < currentMana
            return (
              <span
                key={index}
                className={`helix-avatar__mana-cell${isActive ? ' helix-avatar__mana-cell--live' : ''}`}
                aria-hidden="true"
              />
            )
          })}
        </div>
        <span className="helix-avatar__mana-readout">
          {currentMana}/{maxMana}
        </span>
        <span className="helix-avatar__mana-label">SIGNAL</span>
      </div>

      <div className="helix-avatar__core">
        <div className="helix-avatar__hex" aria-hidden="true">
          <span className="helix-avatar__hex-ring" />
          <span className="helix-avatar__scan" />
          <span className="helix-avatar__glyph">◈</span>
        </div>
        <div className="helix-avatar__integrity" title="Integrity">
          <span className="helix-avatar__integrity-val">{health}</span>
        </div>
      </div>

      <div className="helix-avatar__callsign">
        <span className="helix-avatar__callsign-tag">OP</span>
        <span className="helix-avatar__callsign-name">{name}</span>
      </div>
    </div>
  )
}
