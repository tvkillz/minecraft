#!/usr/bin/env node
/**
 * @deprecated Use `npm run compile` or `npm run compile:upload` instead.
 * Thin wrapper around compile-project.mjs for backwards compatibility.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const args = ['scripts/compile-project.mjs']
if (process.argv.includes('--upload')) args.push('--upload')

const result = spawnSync('node', args, {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: process.env,
})

process.exit(result.status ?? 1)
