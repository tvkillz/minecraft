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

/** Wildreach observer HUD — trail-blaze mana, paw core, stamina chip. */
export const Avatar = ({
  name,
  health,
  currentMana,
  maxMana,
  colorPalette = 'default',
  manaRef,
  containerRef,
}: AvatarProps) => {
  const isRival = colorPalette === 'darkRed'
  const manaScale =
    maxMana > 6
      ? Math.max(0.62, (6 * 22 + 5 * 4) / (maxMana * 22 + (maxMana - 1) * 4))
      : 1

  return (
    <div
      className={`wr-avatar wr-avatar--${isRival ? 'rival' : 'observer'}`}
      ref={containerRef}
    >
      <div className="wr-avatar__mana" ref={manaRef}>
        <div
          className="wr-avatar__mana-rail"
          style={{ '--mana-scale': manaScale } as Record<string, string | number>}
        >
          {Array.from({ length: maxMana }).map((_, index) => {
            const isActive = index < currentMana
            return (
              <span
                key={index}
                className={`wr-avatar__mana-blaze${isActive ? ' wr-avatar__mana-blaze--lit' : ''}`}
                aria-hidden="true"
              />
            )
          })}
        </div>
        <span className="wr-avatar__mana-readout">
          {currentMana}/{maxMana}
        </span>
        <span className="wr-avatar__mana-label">STRIKE</span>
      </div>

      <div className="wr-avatar__core">
        <div className="wr-avatar__ring" aria-hidden="true">
          <span className="wr-avatar__paw" />
        </div>
        <div className="wr-avatar__stamina" title="Stamina">
          <span className="wr-avatar__stamina-val">{health}</span>
        </div>
      </div>

      <div className="wr-avatar__callsign">
        <span className="wr-avatar__callsign-tag">{isRival ? 'RIV' : 'OBS'}</span>
        <span className="wr-avatar__callsign-name">{name}</span>
      </div>
    </div>
  )
}
