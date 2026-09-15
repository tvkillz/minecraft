import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadRegistry } from './project-ports.mjs'

const PROJECTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../projects')

/** Registry row for a project id. */
export function registrySite(projectId) {
  return loadRegistry().find((site) => site.id === projectId) ?? null
}

/** Hostname only (no scheme/path). */
export function normalizeDomain(value) {
  if (!value) return ''
  return value.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim()
}

export function stagingDomainForSite(site) {
  return normalizeDomain(site?.stagingDomain)
}

/** Production hostname from registry.domain or manifest siteUrl. */
export async function productionDomainForSite(site) {
  if (site?.domain) return normalizeDomain(site.domain)

  const manifestPath = path.join(PROJECTS_ROOT, site.id, 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (!manifest.siteUrl) {
    throw new Error(`projects/${site.id}/manifest.json: missing siteUrl`)
  }
  return normalizeDomain(manifest.siteUrl)
}

/** VPS nginx serves production vhost when vpsProd is not explicitly false. */
export function vpsHostsProduction(site) {
  return site?.vpsProd !== false
}

/**
 * siteUrl baked into project-bundle.json (sitemap, robots, metadata, auth redirects).
 * Override only via COMPILE_SITE_URL when you need a non-manifest hostname.
 */
export function resolveCompileSiteUrl(manifest, _site = registrySite(manifest.id)) {
  if (process.env.COMPILE_SITE_URL) {
    return process.env.COMPILE_SITE_URL.replace(/\/$/, '')
  }
  return manifest.siteUrl
}
