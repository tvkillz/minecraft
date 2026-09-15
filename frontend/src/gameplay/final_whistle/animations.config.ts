import type { GameAnimationsConfig } from '@/config/game/schema'
import { iyashikeiOrbPresets } from './orbs.config'

/**
 * FINAL WHISTLE arena animation tuning — stadium night, football terminology.
 */
export const gameAnimationsConfig = {
  battleTransition: {
    loadingLabel: 'Teams taking the pitch…',
    loadingDurationMs: 1840,
    gateDurationMs: 1380,
    panelTransitionDurationSec: 1.265,
    panelTransitionEasing: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },

  turnBanner: {
    enemy: {
      label: "Opponent's turn",
      glyph: 'AWAY',
      sublabel: 'opposition in possession',
      sublabelExit: 'changing ends',
      exitPhaseMs: 900,
      hideMs: 1600,
    },
    your: {
      label: 'Your turn',
      glyph: 'HOME',
      sublabel: 'your possession',
      sublabelExit: 'kick off',
      exitPhaseMs: 900,
      hideMs: 1600,
    },
  },

  particles: {
    durationMin: 0.63,
    durationRandom: 0.4,
    scaleEnd: 0.15,
    ease: 'power2.out',
  },

  fireball: {
    initialOpacity: 0,
    initialScale: 0.35,
    castRing: {
      fromScale: 0.5,
      fromOpacity: 0.45,
      toScale: 1.15,
      toOpacity: 0,
      durationChargeMultiplier: 1.1,
      minDuration: 0.28,
      ease: 'power1.out',
    },
    chargeEase: 'sine.out',
    travelEase: 'sine.inOut',
    returnTravelMultiplier: 0.85,
    returnEase: 'sine.inOut',
    fadeOut: {
      scale: 0.2,
      opacity: 0,
      duration: 0.28,
      ease: 'sine.in',
    },
    lingerBurst: {
      count: 5,
      spread: 48,
      size: 4,
    },
    targetHit: {
      brightnessDuration: 0.18,
      brightnessRepeat: 1,
    },
    screenShake: {
      duration: 0,
      ease: 'power1.inOut',
    },
  },

  orbs: iyashikeiOrbPresets,
} satisfies GameAnimationsConfig
