import { getGameplayVariant } from '@/gameplay/resolve'
import { gameAnimationsConfig as helixAnimations } from '@/gameplay/helix/animations.config'
import { gameAnimationsConfig as iyashikeiAnimations } from '@/gameplay/iyashikei/animations.config'
import { gameAnimationsConfig as finalWhistleAnimations } from '@/gameplay/final_whistle/animations.config'
import { gameAnimationsConfig as wildreachAnimations } from '@/gameplay/wildreach/animations.config'
import { gameAnimationsConfig as voidbornAnimations } from '@/gameplay/voidborn/animations.config'

const variant = getGameplayVariant()

/** Per-project arena animation tuning — edit under `src/gameplay/{variant}/`. */
export const gameAnimationsConfig =
  variant === 'iyashikei'
    ? iyashikeiAnimations
    : variant === 'helix'
      ? helixAnimations
      : variant === 'final_whistle'
        ? finalWhistleAnimations
        : variant === 'wildreach'
          ? wildreachAnimations
          : voidbornAnimations
