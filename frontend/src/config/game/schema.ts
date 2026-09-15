/** GSAP ease names used by arena VFX (keep as string literals for gsap). */
export type GsapEase =
  | 'power1.inOut'
  | 'power2.in'
  | 'power2.out'
  | 'none'

export type OrbPresetId = 'orange' | 'green' | 'blue'

export interface OrbPresetConfig {
  id: OrbPresetId
  label: string
  buttonVariant: 'trigger-orange' | 'trigger-green' | 'trigger-blue'
  gradient: string
  shadowPrimary: string
  shadowSecondary: string
  chargeFrom: number
  chargeTo: number
  chargeDuration: number
  travelDuration: number
  launchColor: string
  launchCount: number
  launchSpread: number
  launchSize: number
  trailColor: string
  trailChance: number
  trailSpread: number
  trailSize: number
  impactColor: string
  impactCount: number
  impactSpread: number
  impactSize: number
  flashColor: string
  flashCount: number
  flashSpread: number
  flashSize: number
  shakeOffset: number
  shakeRepeat: number
  brightness: number
}

export interface TurnBannerAnimationConfig {
  label: string
  /** Optional primary glyph (e.g. kanji). Screen readers use `label`. */
  glyph?: string
  /** Optional glyph shown during the exit phase (e.g. 終). */
  glyphExit?: string
  /** Optional quiet caption under the glyph on enter. */
  sublabel?: string
  /** Optional caption during exit. */
  sublabelExit?: string
  /** Ms before overlay switches to exit phase. */
  exitPhaseMs: number
  /** Ms before overlay is hidden. */
  hideMs: number
}

export interface ParticleBurstConfig {
  durationMin: number
  durationRandom: number
  scaleEnd: number
  ease: GsapEase
}

export interface FireballAnimationConfig {
  initialOpacity: number
  initialScale: number
  castRing: {
    fromScale: number
    fromOpacity: number
    toScale: number
    toOpacity: number
    durationChargeMultiplier: number
    minDuration: number
    ease: GsapEase
  }
  chargeEase: GsapEase
  travelEase: GsapEase
  returnTravelMultiplier: number
  returnEase: GsapEase
  fadeOut: {
    scale: number
    opacity: number
    duration: number
    ease: GsapEase
  }
  lingerBurst: {
    count: number
    spread: number
    size: number
  }
  targetHit: {
    brightnessDuration: number
    brightnessRepeat: number
  }
  screenShake: {
    duration: number
    ease: GsapEase
  }
}

export interface BattleTransitionAnimationConfig {
  loadingLabel: string
  loadingDurationMs: number
  gateDurationMs: number
  panelTransitionDurationSec: number
  panelTransitionEasing: string
}

/** All arena / battle animation tuning — extend when adding new VFX. */
export interface GameAnimationsConfig {
  battleTransition: BattleTransitionAnimationConfig
  turnBanner: {
    enemy: TurnBannerAnimationConfig
    your: TurnBannerAnimationConfig
  }
  particles: ParticleBurstConfig
  fireball: FireballAnimationConfig
  orbs: OrbPresetConfig[]
}
