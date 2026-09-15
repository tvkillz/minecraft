import type { NextConfig } from 'next'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)))
const require = createRequire(import.meta.url)
const { getProjectId, projectDistDir, projectWebpackAliases } = require('./scripts/project-next.mjs')
const { siteHybridMarker, isHybridEnv, LEGACY_HYBRID_MARKER, LEGACY_SITE_HYBRID_MARKER } =
  require('./scripts/site-hybrid.mjs')

function readProjectId(): string {
  return getProjectId()
}

function hybridMarkerExists(projectId: string): boolean {
  try {
    return (
      fs.existsSync(siteHybridMarker(projectId, root)) ||
      fs.existsSync(LEGACY_SITE_HYBRID_MARKER) ||
      fs.existsSync(LEGACY_HYBRID_MARKER)
    )
  } catch {
    return false
  }
}

function isHybridProduction(projectId: string): boolean {
  if (process.env.NODE_ENV !== 'production') return false
  if (isHybridEnv()) return true
  return hybridMarkerExists(projectId)
}

const staticRewrites = [
  { source: '/assets/:path*', destination: '/api/site-static/assets/:path*' },
  { source: '/data/:path*', destination: '/api/site-static/data/:path*' },
  { source: '/favicon.ico', destination: '/api/site-static/__favicon__' },
  { source: '/favicon.png', destination: '/api/site-static/__favicon__' },
  { source: '/favicon.svg', destination: '/api/site-static/__favicon__' },
  { source: '/play/favicon.ico', destination: '/api/site-static/play/favicon.ico' },
  { source: '/play/favicon.png', destination: '/api/site-static/play/favicon.png' },
  { source: '/apple-touch-icon.png', destination: '/api/site-static/__apple-touch-icon__' },
  { source: '/og-image.jpg', destination: '/api/site-static/__og-image__' },
]

/** Proxy Supabase API paths through Next (avoids CORS when developing on localhost). */
function supabaseProxyRewrites(upstream: string) {
  const base = upstream.replace(/\/$/, '')
  if (!base.startsWith('http')) return []

  return ['auth', 'rest', 'functions', 'storage', 'realtime'].map((segment) => ({
    source: `/${segment}/v1/:path*`,
    destination: `${base}/${segment}/v1/:path*`,
  }))
}

const hybridPlayRewrites = [
  { source: '/play/assets/:path*', destination: '/api/site-static/play/assets/:path*' },
  { source: '/play', destination: '/api/site-static/play/index.html' },
  { source: '/play/', destination: '/api/site-static/play/index.html' },
  {
    source: '/play/:path((?!.*\\.).*)',
    destination: '/api/site-static/play/index.html',
  },
]

function createNextConfig(): NextConfig {
  const projectId = readProjectId()
  const hybridActive = isHybridProduction(projectId)

  return {
    reactStrictMode: true,
    distDir: projectDistDir(projectId),
    outputFileTracingRoot: root,
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    env: {
      SITE_HYBRID: hybridActive ? '1' : (process.env.SITE_HYBRID ?? '0'),
      NEXT_PUBLIC_SITE_HYBRID: hybridActive ? '1' : (process.env.NEXT_PUBLIC_SITE_HYBRID ?? '0'),
    },
    webpack(config, { dev }) {
      const aliases = projectWebpackAliases(projectId, root)
      for (const key of Object.keys(config.resolve.alias)) {
        if (key === '@project/bundle' || key.startsWith('@project/')) {
          delete config.resolve.alias[key]
        }
      }
      Object.assign(config.resolve.alias, aliases)

      // Persistent cache must not survive a cleared distDir — stale graphs cause missing chunk errors.
      if (dev && config.cache && typeof config.cache === 'object') {
        config.cache.cacheDirectory = path.join(root, '.build', projectId, '.webpack-cache')
      } else {
        config.cache = false
      }

      return config
    },
    async rewrites() {
      const rules = [...staticRewrites]
      const upstream = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
      rules.push(...supabaseProxyRewrites(upstream))
      if (isHybridProduction(projectId)) {
        rules.push(...hybridPlayRewrites)
      }
      return rules
    },
  }
}

export default createNextConfig()
