#!/usr/bin/env node
/**
 * Watch projects/{PROJECT}/ and re-run compile-project.mjs (debounced).
 * Used automatically by `npm run dev`; also runnable standalone.
 */
import { spawn } from 'node:child_process'
import { watch } from 'node:fs'

import { FRONTEND_ROOT, projectRoot, resolveProjectId } from './project-paths.mjs'

const DEBOUNCE_MS = 400

const projectId = resolveProjectId()
const watchRoot = projectRoot(projectId)

function shouldIgnoreWatchPath(filename) {
  if (!filename || filename.startsWith('.')) return true
  const normalized = filename.replace(/\\/g, '/')
  return normalized === 'game/_staging' || normalized.startsWith(`game/_staging/`)
}

let debounceTimer = null
let compiling = false
let queued = false

function runCompile() {
  if (compiling) {
    queued = true
    return
  }

  compiling = true
  console.log(`[compile:watch] Recompiling project "${projectId}"…`)

  const child = spawn('node', ['scripts/compile-project.mjs'], {
    cwd: FRONTEND_ROOT,
    stdio: 'inherit',
    env: process.env,
  })

  child.on('exit', (code) => {
    compiling = false
    if (code === 0) {
      console.log('[compile:watch] Done — refresh browser to see content changes')
    } else {
      console.error(`[compile:watch] Compile failed (exit ${code ?? 1})`)
    }
    if (queued) {
      queued = false
      runCompile()
    }
  })
}

function scheduleCompile(label) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    console.log(`[compile:watch] Change detected (${label})`)
    runCompile()
  }, DEBOUNCE_MS)
}

console.log(`[compile:watch] Watching ${watchRoot}`)

try {
  watch(watchRoot, { recursive: true }, (_eventType, filename) => {
    if (shouldIgnoreWatchPath(filename)) return
    scheduleCompile(filename)
  })
} catch (err) {
  console.error('[compile:watch] Failed to start watcher:', err.message)
  process.exit(1)
}

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))
