import type { TurnBannerAnimationConfig } from '@/config/game/schema'

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
  const isExit = phase === 'exit'
  const glyph = isExit && config.glyphExit ? config.glyphExit : (config.glyph ?? config.label)
  const sublabel = isExit ? config.sublabelExit : config.sublabel
  const statusLabel = isExit ? `${config.label} — ending` : config.label

  return (
    <div
      className={`game-turn-overlay game-turn-overlay--${variant} game-turn-overlay--${phase}`}
      role="status"
      aria-live="polite"
      aria-label={statusLabel}
    >
      <div className="game-turn-overlay__veil" aria-hidden="true" />
      <div className="game-turn-overlay__strip" aria-hidden="true" />
      <div className="game-turn-overlay__content">
        <span className="game-turn-overlay__glyph" aria-hidden="true">
          {glyph}
        </span>
        {sublabel ? (
          <span className="game-turn-overlay__sublabel" aria-hidden="true">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}
