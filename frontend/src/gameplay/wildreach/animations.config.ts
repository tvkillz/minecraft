import type { GameAnimationsConfig } from '@/config/game/schema'
import { wildreachOrbPresets } from './orbs.config'

/** Wildreach arena animation tuning — claw slash turn gates, trail strikes. */
export const gameAnimationsConfig = {
  battleTransition: {
    loadingLabel: 'Opening the range…',
    loadingDurationMs: 1500,
    gateDurationMs: 1100,
    panelTransitionDurationSec: 1.0,
    panelTransitionEasing: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },

  turnBanner: {
    enemy: {
      label: 'RIVAL TRAIL',
      exitPhaseMs: 1400,
      hideMs: 1900,
    },
    your: {
      label: 'YOUR TRAIL',
      exitPhaseMs: 1400,
      hideMs: 1900,
    },
  },

  particles: {
    durationMin: 0.28,
    durationRandom: 0.16,
    scaleEnd: 0.2,
    ease: 'power2.out',
  },

  fireball: {
    initialOpacity: 0,
    initialScale: 0.4,
    castRing: {
      fromScale: 0.3,
      fromOpacity: 0.75,
      toScale: 1.55,
      toOpacity: 0,
      durationChargeMultiplier: 1.1,
      minDuration: 0.12,
      ease: 'power2.out',
    },
    chargeEase: 'power2.out',
    travelEase: 'power2.in',
    returnTravelMultiplier: 0,
    returnEase: 'power1.inOut',
    fadeOut: {
      scale: 0.15,
      opacity: 0,
      duration: 0.12,
      ease: 'power2.out',
    },
    lingerBurst: {
      count: 6,
      spread: 48,
      size: 3,
    },
    targetHit: {
      brightnessDuration: 0.1,
      brightnessRepeat: 1,
    },
    screenShake: {
      duration: 0.04,
      ease: 'power1.inOut',
    },
  },

  orbs: wildreachOrbPresets,
} satisfies GameAnimationsConfig
