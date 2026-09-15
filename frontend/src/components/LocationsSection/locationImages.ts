import type { LocationConfig } from '@/config/schema'
import { LOCATIONS } from '@/config'

const OBSIDIAN_DEEP_PATH = 'cities/terra/terra_city_02_obsidian_deep.webp'

/** Decorative backdrop — explicit compile field, else second city in realm. */
export function getLocationBackgroundImage(loc: LocationConfig): string {
  if (loc.backgroundImage) return loc.backgroundImage

  const alternate = loc.cities?.find((city) => city.image !== loc.image)
  if (alternate) return alternate.image

  if (loc.cities && loc.cities.length > 1) return loc.cities[1].image

  const city02Fallback = loc.image.replace(/_city_01_/, '_city_02_')
  if (city02Fallback !== loc.image) return city02Fallback

  return loc.image
}

/** Static Locations section backdrop (Obsidian Deep). */
export function getLocationsSectionBackground(): string {
  for (const loc of LOCATIONS) {
    if (loc.backgroundImage?.includes('obsidian_deep')) return loc.backgroundImage

    const city = loc.cities?.find(
      (c) => c.image.includes('obsidian_deep') || c.name === 'Obsidian Deep',
    )
    if (city) return city.image
  }

  const kronos = LOCATIONS.find((l) => l.id === 'kronos')
  if (kronos) return getLocationBackgroundImage(kronos)

  return `/assets/${OBSIDIAN_DEEP_PATH}`
}
