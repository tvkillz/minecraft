import { appConfig } from '@/config/app.config'
import type { LandingVariant } from '@/config/schema'

/** In-arena UI + animation pack id (one tree per project). */
export type GameplayVariant = LandingVariant

export function getGameplayVariant(): GameplayVariant {
  return appConfig.landing?.variant ?? 'voidborn'
}
