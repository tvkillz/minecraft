#!/usr/bin/env node
/**
 * Dev server: compile + watch content pack, then Next dev (App Router /play).
 * Uses per-project artifacts under .build/{PROJECT}/.
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildPaths, resolveProjectId } from './project-paths.mjs'
import { resolveDevPort } from './project-ports.mjs'
import { clearHybridEnv } from './site-hybrid.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectId = resolveProjectId()
const out = buildPaths(projectId)
const playDist = out.play
const playDistBackup = path.join(out.root, '_play_dist_backup')

let movedDist = false
let watchChild = null
let nextChild = null

function movePlayDistAside() {
  if (!fs.existsSync(playDist)) return
  if (fs.existsSync(playDistBackup)) {
    fs.rmSync(playDistBackup, { recursive: true, force: true })
  }
  fs.renameSync(playDist, playDistBackup)
  movedDist = true
  console.log(`[dev] Moved .build/${projectId}/play/ aside — /play uses App Router`)
}

function restorePlayDist() {
  if (!movedDist || !fs.existsSync(playDistBackup)) return
  if (fs.existsSync(playDist)) {
    fs.rmSync(playDist, { recursive: true, force: true })
  }
  fs.renameSync(playDistBackup, playDist)
  console.log(`[dev] Restored .build/${projectId}/play/`)
}

function killChild(child) {
  if (child && !child.killed) child.kill('SIGTERM')
}

movePlayDistAside()

console.log(`[dev] Project: ${projectId} → .build/${projectId}/`)

const devPort = resolveDevPort(projectId)
if (!process.env.PORT) {
  console.log(`[dev] Port: ${devPort} (same as prod; registry index + ${process.env.PM2_PROD_PORT_BASE || 3100})`)
}

const compile = spawnSync('node', ['scripts/compile-project.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})
if (compile.status !== 0) {
  restorePlayDist()
  process.exit(compile.status ?? 1)
}

watchChild = spawn('node', ['scripts/compile-watch.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

const env = clearHybridEnv({
  ...process.env,
  PROJECT: projectId,
  PORT: String(process.env.PORT || devPort),
})

nextChild = spawn('npx', ['next', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  env,
  shell: true,
})

const cleanup = () => {
  killChild(watchChild)
  killChild(nextChild)
  restorePlayDist()
}

process.on('SIGINT', () => {
  cleanup()
  process.exit(0)
})
process.on('SIGTERM', () => {
  cleanup()
  process.exit(0)
})

watchChild.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error('[dev] compile:watch exited unexpectedly')
    killChild(nextChild)
    restorePlayDist()
    process.exit(code ?? 1)
  }
})

nextChild.on('exit', (code) => {
  killChild(watchChild)
  restorePlayDist()
  process.exit(code ?? 0)
})
