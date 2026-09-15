import { createReadStream, readFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.json': 'application/json',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
}

type RegistrySite = { id: string }

function loadRegistry(): RegistrySite[] {
  const registryPath = path.join(process.cwd(), '../projects/registry.json')
  return JSON.parse(readFileSync(registryPath, 'utf8')) as RegistrySite[]
}

/** Resolve site id at request time (parallel pm2 must not bake PROJECT into the bundle). */
function resolveProjectId(request?: NextRequest): string {
  // pm2 sets PROJECT per process — prefer it over port→registry index so a
  // dedicated VPS (single registry entry on 3100) still serves the right .build/.
  const projectEnv = process.env['PROJECT']?.trim()
  if (projectEnv) return projectEnv

  const host = request?.headers.get('host') ?? ''
  const hostPort = Number(host.split(':')[1] || 0)
  const port = hostPort || Number(process.env['PORT'] || 0)

  if (port > 0) {
    try {
      const registry = loadRegistry()
      const devBase = Number(process.env['PM2_DEV_PORT_BASE'] || 3000)
      const prodBase = Number(process.env['PM2_PROD_PORT_BASE'] || 3100)
      const devIdx = port - devBase
      if (devIdx >= 0 && devIdx < registry.length) return registry[devIdx].id
      const prodIdx = port - prodBase
      if (prodIdx >= 0 && prodIdx < registry.length) return registry[prodIdx].id
    } catch {
      /* registry optional in odd setups */
    }
  }

  return process.env['PROJECT'] || 'voidborn'
}

function buildRoot(request?: NextRequest): string {
  return path.join(process.cwd(), '.build', resolveProjectId(request))
}

function contentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME[ext] ?? 'application/octet-stream'
}

/** Vite/Rollup content-hashed filenames, e.g. index-a1b2c3d4.js */
const HASHED_ASSET_RE = /-[a-zA-Z0-9_-]{8,}\.[a-z0-9]+$/i

/** Matches deploy/nginx/site.conf.tpl — documents must not stick on old mobile browsers. */
const DOCUMENT_CACHE =
  'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'

const HASHED_ASSET_CACHE = 'public, max-age=31536000, immutable'

/**
 * SPA shells must revalidate so deploys pick up new chunk hashes.
 * Hashed /play/assets/* (and similar) are safe to cache immutably.
 */
function cacheControlForFile(filePath: string): string {
  const base = path.basename(filePath)
  const ext = path.extname(filePath).toLowerCase()

  if (ext === '.html') {
    return DOCUMENT_CACHE
  }

  if (base === 'manifest.json' || base.endsWith('.manifest.json')) {
    return DOCUMENT_CACHE
  }

  if (HASHED_ASSET_RE.test(base)) {
    return HASHED_ASSET_CACHE
  }

  return 'no-cache, must-revalidate, max-age=0'
}

async function resolveFile(segments: string[], request?: NextRequest): Promise<string | null> {
  const root = buildRoot(request)
  const rootResolved = path.resolve(root)

  let filePath: string
  if (segments.length === 1 && segments[0] === '__favicon__') {
    for (const name of ['favicon.ico', 'favicon.png', 'favicon.svg']) {
      const candidate = path.join(root, name)
      try {
        const info = await stat(candidate)
        if (info.isFile()) return path.resolve(candidate)
      } catch {
        /* try next */
      }
    }
    return null
  } else if (segments.length === 1 && segments[0] === '__apple-touch-icon__') {
    filePath = path.join(root, 'apple-touch-icon.png')
  } else if (segments.length === 1 && segments[0] === '__og-image__') {
    filePath = path.join(root, 'og-image.jpg')
  } else {
    filePath = path.join(root, ...segments)
  }

  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(rootResolved)) return null

  try {
    const info = await stat(resolved)
    if (!info.isFile()) return null
    return resolved
  } catch {
    if (/\.png$/i.test(resolved)) {
      const webpCandidate = resolved.replace(/\.png$/i, '.webp')
      try {
        const webpInfo = await stat(webpCandidate)
        if (webpInfo.isFile()) return webpCandidate
      } catch {
        /* fall through */
      }
    }
    return null
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ assetPath?: string[] }> },
) {
  const { assetPath = [] } = await context.params
  const file = await resolveFile(assetPath, request)

  if (!file) {
    return new NextResponse('Not found', { status: 404 })
  }

  const body = createReadStream(file)
  const headers = new Headers({
    'Content-Type': contentType(file),
    'Cache-Control': cacheControlForFile(file),
  })

  return new NextResponse(body as unknown as BodyInit, { status: 200, headers })
}
