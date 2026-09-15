#!/usr/bin/env node
/**
 * Compile every site listed in projects/registry.json.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadRegistry } from './project-ports.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const registry = loadRegistry()

let failed = false

for (const site of registry) {
  console.log(`\n[compile:all] === ${site.id} ===`)
  const result = spawnSync('node', ['scripts/compile-project.mjs'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, PROJECT: site.id },
  })
  if (result.status !== 0) failed = true
}

process.exit(failed ? 1 : 0)
