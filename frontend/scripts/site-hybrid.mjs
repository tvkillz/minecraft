import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildPaths, resolveProjectId } from './project-paths.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const FRONTEND_ROOT = path.resolve(__dirname, '..')

/** Per-project hybrid marker under .build/{PROJECT}/.site-hybrid */
export function siteHybridMarker(projectId = resolveProjectId(), root = FRONTEND_ROOT) {
  return buildPaths(projectId).siteHybridMarker
}

/** @deprecated Legacy markers at repo root */
export const LEGACY_SITE_HYBRID_MARKER = path.join(FRONTEND_ROOT, '.site-hybrid')
export const LEGACY_HYBRID_MARKER = path.join(FRONTEND_ROOT, '.hybrid-production')

export function isHybridEnv(env = process.env) {
  return (
    env.SITE_HYBRID === '1' ||
    env.NEXT_PUBLIC_SITE_HYBRID === '1' ||
    env.VOIDBORN_HYBRID === '1' ||
    env.NEXT_PUBLIC_VOIDBORN_HYBRID === '1'
  )
}

export function isHybridProduction(env = process.env, root = FRONTEND_ROOT) {
  if (env.NODE_ENV !== 'production') return false
  if (isHybridEnv(env)) return true
  const projectId = env.PROJECT || 'voidborn'
  try {
    return (
      fs.existsSync(siteHybridMarker(projectId, root)) ||
      fs.existsSync(LEGACY_SITE_HYBRID_MARKER) ||
      fs.existsSync(LEGACY_HYBRID_MARKER)
    )
  } catch {
    return false
  }
}

export function clearHybridEnv(env) {
  const next = { ...env }
  delete next.SITE_HYBRID
  delete next.NEXT_PUBLIC_SITE_HYBRID
  delete next.VOIDBORN_HYBRID
  delete next.NEXT_PUBLIC_VOIDBORN_HYBRID
  return next
}

export function hybridBuildEnv(base = process.env) {
  return { ...base, SITE_HYBRID: '1' }
}
