import type { TurnBannerAnimationConfig } from '@/config/game/schema'

import './TurnBanner.css'

type BannerPhase = 'enter' | 'exit'

export function TurnBanner({
  variant,
  phase,
  config,
}: {
  variant: 'your' | 'enemy'
  phase: BannerPhase
  config: TurnBannerAnimationConfig
}) {
  const isHome = variant === 'your'
  const sideClass = isHome ? 'home' : 'away'
  const headline = config.glyph ?? config.label
  const sublabel = phase === 'exit' ? (config.sublabelExit ?? config.sublabel) : config.sublabel
  const statusLabel = phase === 'exit' ? `${config.label} — ending` : config.label

  return (
    <div
      className={`fw-turn-board fw-turn-board--${sideClass} fw-turn-board--${phase}`}
      role="status"
      aria-live="polite"
      aria-label={statusLabel}
    >
      <div className="fw-turn-board__shade" aria-hidden="true" />
      <div className="fw-turn-board__pitch-line" aria-hidden="true" />
      <div className="fw-turn-board__panel">
        <span className="fw-turn-board__tag">{isHome ? 'HOME SIDE' : 'AWAY SIDE'}</span>
        <p className="fw-turn-board__headline">{headline}</p>
        {sublabel ? <p className="fw-turn-board__sub">{sublabel}</p> : null}
      </div>
    </div>
  )
}
