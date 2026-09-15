/**
 * Realm city backgrounds from game/scenes.json (kind: city).
 */

export function cityScenesForDomain(scenesJson, domainId) {
  const assets = scenesJson?.assets ?? []
  return assets.filter((a) => a.kind === 'city' && a.domain === domainId && a.path)
}

export function allCityScenes(scenesJson) {
  const assets = scenesJson?.assets ?? []
  return assets.filter((a) => a.kind === 'city' && a.path)
}

export function pickRandomCity(scenesJson, domainId, rng = Math.random) {
  const cities = cityScenesForDomain(scenesJson, domainId)
  if (!cities.length) return null
  const pick = cities[Math.floor(rng() * cities.length)]
  return { path: pick.path, title: pick.title, slug: pick.slug, domain: pick.domain }
}

export function pickRandomCityAny(scenesJson, rng = Math.random) {
  const cities = allCityScenes(scenesJson)
  if (!cities.length) return null
  const pick = cities[Math.floor(rng() * cities.length)]
  return { path: pick.path, title: pick.title, slug: pick.slug, domain: pick.domain }
}

export function pickCityForCard(ctx, card, rng = Math.random) {
  if (!ctx.scenes) return null
  return pickRandomCity(ctx.scenes, card.domain, rng)
}
