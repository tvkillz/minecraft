import { readJsonFile } from './io.js'

/** Slugs required on the landing page (featured + collection). */
export function buildShowcaseSlugs(locationsJson, collectionJson) {
  const slugs = new Set()
  for (const loc of locationsJson?.locations ?? []) {
    if (loc.featuredCardSlug) slugs.add(loc.featuredCardSlug)
  }
  for (const slug of collectionJson?.cardSlugs ?? []) {
    if (slug) slugs.add(slug)
  }
  return [...slugs].sort()
}

export function slugToTitle(slug) {
  const tail = slug.replace(/^[a-z][a-z0-9]*_card_\d{2}_/, '')
  return tail
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function groupShowcaseByDomain(slugs) {
  const byDomain = {}
  for (const slug of slugs) {
    const m = slug.match(/^([a-z][a-z0-9]*)_card_(\d{2})_/)
    if (!m) continue
    const domain = m[1]
    byDomain[domain] ??= []
    byDomain[domain].push(slug)
  }
  for (const domain of Object.keys(byDomain)) {
    byDomain[domain].sort()
  }
  return byDomain
}

export async function loadShowcaseSlugs(paths) {
  const [locationsJson, collectionJson] = await Promise.all([
    readJsonFile(paths.locations),
    readJsonFile(paths.collection),
  ])
  return buildShowcaseSlugs(locationsJson, collectionJson)
}
