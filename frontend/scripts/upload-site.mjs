#!/usr/bin/env node
/**
 * Seed one site's catalog over the Supabase API (HTTPS — not direct Postgres):
 * compiles projects/{id}/, uploads card art to Storage, upserts cards + featured rows.
 * Needs backend/.env SERVICE_ROLE_KEY (or equivalent) and API URL → sportsydeals.com.
 *
 * Usage (from frontend/):
 *   npm run upload:site
 *   PROJECT=project2 npm run upload:site
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveProjectId } from './project-paths.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectId = resolveProjectId()

console.log(`[upload:site] ${projectId}`)
const result = spawnSync('node', ['scripts/compile-project.mjs', '--upload'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, PROJECT: projectId },
})

process.exit(result.status ?? 1)
