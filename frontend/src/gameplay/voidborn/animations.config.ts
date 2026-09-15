import type { GameAnimationsConfig } from '@/config/game/schema'
import { orbPresets } from '@/config/game/orbs.config'

/**
 * Arena & battle animation tuning (GSAP, timings, copy).
 * Add new sections here when introducing card attacks, summons, etc.
 */
export const gameAnimationsConfig = {
  battleTransition: {
    loadingLabel: 'Entering the arena...',
    loadingDurationMs: 1600,
    gateDurationMs: 1200,
    panelTransitionDurationSec: 1.1,
    panelTransitionEasing: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },

  turnBanner: {
    enemy: {
      label: 'ENEMY TURN',
      exitPhaseMs: 1500,
      hideMs: 2000,
    },
    your: {
      label: 'YOUR TURN',
      exitPhaseMs: 1500,
      hideMs: 2000,
    },
  },

  particles: {
    durationMin: 0.42,
    durationRandom: 0.2,
    scaleEnd: 0.35,
    ease: 'power2.out',
  },

  fireball: {
    initialOpacity: 0,
    initialScale: 0.05,
    castRing: {
      fromScale: 0.24,
      fromOpacity: 0.8,
      toScale: 1.4,
      toOpacity: 0,
      durationChargeMultiplier: 1.35,
      minDuration: 0.2,
      ease: 'power2.out',
    },
    chargeEase: 'power2.out',
    travelEase: 'power2.in',
    returnTravelMultiplier: 0.78,
    returnEase: 'power1.inOut',
    fadeOut: {
      scale: 0.1,
      opacity: 0,
      duration: 0.18,
      ease: 'power2.out',
    },
    lingerBurst: {
      count: 8,
      spread: 70,
      size: 5,
    },
    targetHit: {
      brightnessDuration: 0.12,
      brightnessRepeat: 1,
    },
    screenShake: {
      duration: 0.045,
      ease: 'power1.inOut',
    },
  },

  orbs: orbPresets,
} satisfies GameAnimationsConfig
