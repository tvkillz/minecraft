#!/usr/bin/env node
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveBuildScope } from './build-scope.mjs'
import { resolveProjectId } from './project-paths.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectId = resolveProjectId()
const scope = resolveBuildScope()
const skipGame =
  scope === 'landing' ||
  scope === 'portal' ||
  process.argv.includes('--skip-game') ||
  process.env.SKIP_GAME === '1'

if (scope === 'portal' || scope === 'game') {
  console.error(
    `[build] BUILD_SCOPE=${scope} is not implemented yet — use landing or full.`,
  )
  process.exit(1)
}

const scopeLabel = scope === 'landing' ? ' (landing only)' : skipGame ? ' (skip game)' : ''
console.log(`[build] Production hybrid: project=${projectId}${scopeLabel}`)

execSync('node scripts/assert-site-email.mjs', { cwd: root, stdio: 'inherit' })
if (!process.argv.includes('--skip-compile')) {
  execSync('node scripts/compile-project.mjs', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, PROJECT: projectId },
  })
}
if (!skipGame) {
  execSync('node scripts/build-game.mjs', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, PROJECT: projectId },
  })
}
if (!process.argv.includes('--skip-web')) {
  execSync('node scripts/build-web.mjs', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, PROJECT: projectId, BUILD_SCOPE: scope },
  })
}
console.log('[build] Complete.')
