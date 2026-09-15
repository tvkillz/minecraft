import type { GameAnimationsConfig } from '@/config/game/schema'
import { iyashikeiOrbPresets } from './orbs.config'

/**
 * KOMOREBI arena animation tuning — ambient field combat, gentle particles.
 */
export const gameAnimationsConfig = {
  battleTransition: {
    loadingLabel: 'Stepping into the garden…',
    loadingDurationMs: 1840,
    gateDurationMs: 1380,
    panelTransitionDurationSec: 1.265,
    panelTransitionEasing: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },

  turnBanner: {
    enemy: {
      label: "Opponent's turn",
      glyph: '風',
      glyphExit: '終',
      sublabel: 'their moment',
      sublabelExit: 'stillness',
      exitPhaseMs: 1840,
      hideMs: 2760,
    },
    your: {
      label: 'Your turn',
      glyph: '手',
      glyphExit: '終',
      sublabel: 'your move',
      sublabelExit: 'stillness',
      exitPhaseMs: 1840,
      hideMs: 2760,
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
