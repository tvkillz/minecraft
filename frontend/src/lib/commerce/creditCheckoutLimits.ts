/** Keep in sync with commerce edge function MIN_CUSTOM_CREDITS / MAX_CUSTOM_CREDITS. */
export const MIN_CUSTOM_CREDITS = 500
export const MAX_CUSTOM_CREDITS = 1_000_000

export function validateCustomCreditAmount(
  credits: number,
): { ok: true } | { ok: false; reason: 'min' | 'max' } {
  if (credits < MIN_CUSTOM_CREDITS) return { ok: false, reason: 'min' }
  if (credits > MAX_CUSTOM_CREDITS) return { ok: false, reason: 'max' }
  return { ok: true }
}
