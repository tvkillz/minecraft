/** VOIDBORN header logo — allowed as AI reference for promo/welcome art. */
export const BRAND_LOGO_HEADER = 'brand/header.png'

export const WELCOME_HOOKS = [
  'Beyond the Fracture',
  'Born of the Void',
  'Four Realms Awaken',
  'Deck the Abyss',
  'Enter the Elemental War',
  'The Aether Bleed Rises',
  'Conquer the Null Zones',
  'Wielders of the Realms',
  'Shattered Balance',
  'Call of the Voidborn',
]

export function pickRandomHook(rng = Math.random) {
  return WELCOME_HOOKS[Math.floor(rng() * WELCOME_HOOKS.length)]
}
