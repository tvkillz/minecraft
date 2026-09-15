import { readJsonFile, writeJsonFile, fileExists } from './io.js'

const EMPTY = { approved: [] }

export async function loadCardLog(paths) {
  if (!(await fileExists(paths.cardLog))) return { ...EMPTY, approved: [] }
  const raw = await readJsonFile(paths.cardLog)
  return { approved: raw.approved ?? [] }
}

export async function saveCardLog(paths, log) {
  await writeJsonFile(paths.cardLog, log)
}

export function loggedCardSlugs(log, { includeStaging = true, stagingSlugs = [] } = {}) {
  const slugs = new Set(log.approved.map((e) => e.slug))
  if (includeStaging) {
    for (const s of stagingSlugs) slugs.add(s)
  }
  return slugs
}

export function appendApprovedCard(log, entry) {
  const existing = log.approved.findIndex((e) => e.slug === entry.slug)
  const row = {
    slug: entry.slug,
    title: entry.title,
    domain: entry.domain,
    staging_id: entry.staging_id ?? null,
    published_id: entry.published_id ?? null,
    background_asset: entry.background_asset ?? null,
    approved_at: entry.approved_at ?? new Date().toISOString(),
    published_at: entry.published_at ?? null,
  }
  if (existing >= 0) log.approved[existing] = { ...log.approved[existing], ...row }
  else log.approved.push(row)
  return log
}

export function markCardPublished(log, slug, publishedId) {
  const row = log.approved.find((e) => e.slug === slug)
  if (row) {
    row.published_id = publishedId
    row.published_at = new Date().toISOString()
  }
  return log
}
