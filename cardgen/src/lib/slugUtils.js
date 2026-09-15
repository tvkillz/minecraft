const SLUG_INDEX_RE = /^([a-z][a-z0-9]*)_card_(\d+)_/

export function parseCardSlug(slug) {
  const m = slug?.match(SLUG_INDEX_RE)
  if (!m) return null
  return { domain: m[1], index: Number(m[2]) }
}

export function titleToSnake(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 48)
}

export function slugFromTitle(domain, index, title) {
  const pad = String(index).padStart(2, '0')
  const snake = titleToSnake(title) || 'unit'
  return `${domain}_card_${pad}_${snake}`
}
