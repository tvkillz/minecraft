#!/usr/bin/env node
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveBuildScope, withLandingAppScope } from './build-scope.mjs'
import { hybridBuildEnv, siteHybridMarker } from './site-hybrid.mjs'
import { buildPaths, resolveProjectId } from './project-paths.mjs'
import { projectDistDir } from './project-next.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectId = resolveProjectId()
const scope = resolveBuildScope()
const out = buildPaths(projectId)
const playPagePath = path.join(root, 'src/app/play/page.tsx')
const playPageBackup = path.join(root, '.cache/play-page.dev-backup.tsx')
const landingOnly = scope === 'landing'

function removePlayPageForHybridBuild() {
  if (!fs.existsSync(playPagePath)) return
  fs.mkdirSync(path.dirname(playPageBackup), { recursive: true })
  fs.copyFileSync(playPagePath, playPageBackup)
  fs.unlinkSync(playPagePath)
  console.log('[build:web] Removed src/app/play/page.tsx (hybrid serves Vite bundle)')
}

function restorePlayPage() {
  if (!fs.existsSync(playPageBackup)) return
  fs.copyFileSync(playPageBackup, playPagePath)
  fs.unlinkSync(playPageBackup)
  console.log('[build:web] Restored src/app/play/page.tsx for development')
}

function cleanNextOutput() {
  const nextDir = path.join(root, out.next)
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true })
    console.log(`[build:web] Cleared .build/${projectId}/.next`)
  }

  const webpackCacheDir = path.join(root, '.build', projectId, '.webpack-cache')
  if (fs.existsSync(webpackCacheDir)) {
    fs.rmSync(webpackCacheDir, { recursive: true, force: true })
    console.log(`[build:web] Cleared .build/${projectId}/.webpack-cache`)
  }
}

function markHybridProduction() {
  fs.writeFileSync(siteHybridMarker(projectId, root), `${new Date().toISOString()}\n`, 'utf8')
  console.log(`[build:web] Wrote .build/${projectId}/.site-hybrid`)
}

function verifyPortalRoutes() {
  const manifestPath = path.join(root, projectDistDir(projectId), 'app-path-routes-manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.warn('[build:web] No app-path-routes-manifest.json — skip route verify')
    return
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const routes = Object.keys(manifest)
  const portalRoutes = routes.filter((r) => r.startsWith('/portal'))
  if (portalRoutes.length === 0) {
    throw new Error(
      '[build:web] Portal routes missing from Next build. Expected /portal/* in app-path-routes-manifest.json',
    )
  }
  console.log(`[build:web] Verified ${portalRoutes.length} portal route(s): ${portalRoutes.join(', ')}`)
}

function verifyLandingRoute() {
  const manifestPath = path.join(root, projectDistDir(projectId), 'app-path-routes-manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.warn('[build:web] No app-path-routes-manifest.json — skip landing verify')
    return
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const routes = Object.keys(manifest)
  if (!routes.some((r) => r === '/' || r === '/page')) {
    throw new Error('[build:web] Landing route "/" missing from Next build')
  }
  const portalRoutes = routes.filter((r) => r.startsWith('/portal'))
  if (portalRoutes.length > 0) {
    throw new Error(
      `[build:web] Landing scope still includes portal routes: ${portalRoutes.join(', ')}`,
    )
  }
  console.log('[build:web] Verified landing route "/" (portal excluded)')
}

function verifyPlayBundle() {
  const indexHtml = path.join(out.play, 'index.html')
  if (!fs.existsSync(indexHtml)) {
    throw new Error(`[build:web] ${indexHtml} missing — run build:game first`)
  }
  const html = fs.readFileSync(indexHtml, 'utf8')
  if (!html.includes('/play/assets/') && !html.includes('src="/play/')) {
    console.warn('[build:web] index.html may have wrong asset paths — check vite base')
  }
  if (routesIncludePlayAppRoute()) {
    throw new Error(
      '[build:web] /play is still an App Router page — it will black-screen instead of loading the Vite bundle',
    )
  }
  console.log(`[build:web] Verified .build/${projectId}/play/index.html`)
}

function routesIncludePlayAppRoute() {
  const manifestPath = path.join(root, projectDistDir(projectId), 'app-path-routes-manifest.json')
  if (!fs.existsSync(manifestPath)) return false
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  return Object.keys(manifest).some((r) => r === '/play' || r === '/play/page')
}

async function runNextBuild() {
  cleanNextOutput()
  // Landing already stashes play/; full hybrid still removes play page.tsx.
  if (!landingOnly) removePlayPageForHybridBuild()

  try {
    execSync('npx next build', {
      cwd: root,
      stdio: 'inherit',
      env: hybridBuildEnv({ ...process.env, PROJECT: projectId, BUILD_SCOPE: scope }),
    })
    execSync('node scripts/verify-next-build.mjs', {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, PROJECT: projectId },
    })
    const devStaticDir = path.join(root, out.next, 'static/development')
    if (fs.existsSync(devStaticDir)) {
      fs.rmSync(devStaticDir, { recursive: true, force: true })
      console.log(`[build:web] Removed stray ${projectDistDir(projectId)}/static/development`)
    }
    markHybridProduction()
    if (landingOnly) {
      verifyLandingRoute()
    } else {
      verifyPortalRoutes()
      verifyPlayBundle()
    }
  } finally {
    if (!landingOnly) restorePlayPage()
  }
}

console.log(`[build:web] Project: ${projectId}${landingOnly ? ' (landing only)' : ''}`)

if (landingOnly) {
  await withLandingAppScope(runNextBuild)
} else {
  await runNextBuild()
}
