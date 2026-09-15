import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REGISTRY_PATH = path.join(__dirname, '../../projects/registry.json')

export const DEV_PORT_BASE = Number(process.env.PM2_DEV_PORT_BASE || 3000)
export const PROD_PORT_BASE = Number(process.env.PM2_PROD_PORT_BASE || 3100)

let registryCache = null

export function loadRegistry() {
  if (!registryCache) {
    registryCache = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
  }
  return registryCache
}

/** Registry index for a project id (0-based). Throws if not registered. */
export function projectIndex(projectId) {
  const registry = loadRegistry()
  const index = registry.findIndex((site) => site.id === projectId)
  if (index < 0) {
    throw new Error(
      `Project "${projectId}" is not in projects/registry.json. Registered: ${registry.map((s) => s.id).join(', ') || '(none)'}`,
    )
  }
  return index
}

export function prodPort(projectId, index = projectIndex(projectId)) {
  return PROD_PORT_BASE + index
}

/** Dev pm2 uses the same port as prod (only one should run at a time). */
export function devPort(projectId, index = projectIndex(projectId)) {
  return prodPort(projectId, index)
}

/** Resolve PORT for dev when env PORT is unset. */
export function resolveDevPort(projectId, env = process.env) {
  if (env.PORT) return Number(env.PORT)
  return devPort(projectId)
}

export function portMap() {
  return loadRegistry().map((site, index) => ({
    id: site.id,
    index,
    port: prodPort(site.id, index),
    dev: prodPort(site.id, index),
    prod: prodPort(site.id, index),
  }))
}
