/**
 * Scoped production builds for local UI gates (landing / portal / game later).
 *
 * Usage:
 *   BUILD_SCOPE=landing  or  --only-landing
 *
 * Landing scope temporarily stashes non-landing App Router trees so `next build`
 * only compiles the home page (+ shared layout, API, documents, SEO).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APP_DIR = path.join(FRONTEND_ROOT, 'src/app')

/** App Router dirs excluded from a landing-only Next build. */
export const LANDING_EXCLUDED_APP_DIRS = [
  'portal',
  'play',
  'market',
  'checkout',
  'profile',
  'leaderboard',
]

export function resolveBuildScope(argv = process.argv, env = process.env) {
  if (argv.includes('--only-landing') || env.BUILD_SCOPE === 'landing') return 'landing'
  if (argv.includes('--only-portal') || env.BUILD_SCOPE === 'portal') return 'portal'
  if (argv.includes('--only-game') || env.BUILD_SCOPE === 'game') return 'game'
  const scope = (env.BUILD_SCOPE || 'full').trim().toLowerCase()
  if (scope === 'landing' || scope === 'portal' || scope === 'game' || scope === 'full') {
    return scope
  }
  throw new Error(`[build-scope] Unknown BUILD_SCOPE="${env.BUILD_SCOPE}"`)
}

function stashRoot(scope) {
  return path.join(FRONTEND_ROOT, '.cache', `build-scope-${scope}`)
}

/**
 * Move `src/app/<dir>` trees aside for the duration of `fn`, then restore.
 * Safe if a previous crash left a stash: restores first.
 */
export async function withExcludedAppDirs(scope, dirs, fn) {
  const root = stashRoot(scope)
  fs.mkdirSync(root, { recursive: true })

  const moved = []

  function restoreOne(dir) {
    const from = path.join(APP_DIR, dir)
    const to = path.join(root, dir)
    if (fs.existsSync(to) && !fs.existsSync(from)) {
      fs.renameSync(to, from)
    } else if (fs.existsSync(to) && fs.existsSync(from)) {
      fs.rmSync(to, { recursive: true, force: true })
    }
  }

  // Recover from interrupted previous run
  for (const dir of dirs) restoreOne(dir)

  try {
    for (const dir of dirs) {
      const from = path.join(APP_DIR, dir)
      if (!fs.existsSync(from)) continue
      const to = path.join(root, dir)
      if (fs.existsSync(to)) fs.rmSync(to, { recursive: true, force: true })
      fs.renameSync(from, to)
      moved.push(dir)
      console.log(`[build-scope] Stashed src/app/${dir} → .cache/build-scope-${scope}/${dir}`)
    }
    return await fn()
  } finally {
    for (const dir of moved.reverse()) {
      restoreOne(dir)
      console.log(`[build-scope] Restored src/app/${dir}`)
    }
  }
}

export async function withLandingAppScope(fn) {
  return withExcludedAppDirs('landing', LANDING_EXCLUDED_APP_DIRS, fn)
}
