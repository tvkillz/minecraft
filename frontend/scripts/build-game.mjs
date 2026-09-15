#!/usr/bin/env node
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildPaths, resolveProjectId } from './project-paths.mjs'
import { injectPlayShell } from './inject-play-shell.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectId = resolveProjectId()
const out = buildPaths(projectId)

console.log(`[build:game] Project: ${projectId} → .build/${projectId}/play/`)
execSync('npx vite build --config game/vite.config.ts', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, PROJECT: projectId, VITE_PLAY_OUT_DIR: out.play },
})

for (const name of ['favicon.ico', 'favicon.png']) {
  const src = path.join(out.root, name)
  const dest = path.join(out.play, name)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest)
  }
}

injectPlayShell(projectId)

console.log('[build:game] Done.')
