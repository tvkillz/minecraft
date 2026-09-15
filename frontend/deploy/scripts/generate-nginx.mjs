#!/usr/bin/env node
/**
 * Generate HTTP-only nginx config for frontend VPS from projects/registry.json.
 * TLS is manual: certbot --nginx (do not re-run --install after certbot without re-running certbot).
 *
 * Per site:
 *   - stagingDomain → staging vhost (always on VPS when set)
 *   - vpsProd !== false → production manifest domain on VPS
 *   - vpsProd: false → production lives elsewhere (e.g. cPanel); only staging on VPS
 *
 * Usage (from frontend/):
 *   node deploy/scripts/generate-nginx.mjs
 *   node deploy/scripts/generate-nginx.mjs --site final_whistle
 *   node deploy/scripts/generate-nginx.mjs --install
 *   node deploy/scripts/generate-nginx.mjs --cors-origins
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadRegistry, prodPort, DEV_PORT_BASE } from '../../scripts/project-ports.mjs'
import {
  productionDomainForSite,
  stagingDomainForSite,
  vpsHostsProduction,
} from '../../scripts/registry-sites.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEPLOY_ROOT = path.resolve(__dirname, '..')
const TEMPLATE_PATH = path.join(DEPLOY_ROOT, 'nginx/site.conf.tpl')
const OUTPUT_DIR = path.join(DEPLOY_ROOT, 'output')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'frontend-sites.conf')
const CORS_FILE = path.join(OUTPUT_DIR, 'cors-origins.txt')
const INSTALL_PATH = '/etc/nginx/sites-available/constructor-frontend.conf'
const ENABLED_LINK = '/etc/nginx/sites-enabled/constructor-frontend.conf'

const install = process.argv.includes('--install')
const corsOnly = process.argv.includes('--cors-origins')
const includeWww = !process.argv.includes('--no-www')

function siteFilterFromArgv() {
  const idx = process.argv.indexOf('--site')
  if (idx >= 0 && process.argv[idx + 1]) {
    return process.argv[idx + 1].split(',').map((s) => s.trim()).filter(Boolean)
  }
  const fromEnv = (process.env.NGINX_SITES || '').trim()
  if (fromEnv) return fromEnv.split(',').map((s) => s.trim()).filter(Boolean)
  return null
}

const SITE_FILTER = siteFilterFromArgv()

function render(template, vars) {
  let out = template
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, String(val))
  }
  let prev
  do {
    prev = out
    out = out.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, flag, body) =>
      vars[flag] ? body : '',
    )
    out = out.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, flag, body) =>
      vars[flag] ? '' : body,
    )
  } while (out !== prev)
  return out
}

function renderBlock(template, { site, domain, port, role }) {
  return render(template, {
    PROJECT: site.id,
    DOMAIN: domain,
    ROLE: role,
    PORT: port,
    WWW: role === 'production' && includeWww ? '1' : '',
    STAGING_AUTH: role === 'staging' ? '1' : '',
    SENDMAIL_PROXY: role === 'production' && vpsHostsProduction(site) && site.sendmailProxy ? '1' : '',
  })
}

async function buildSiteBlocks(template) {
  const registry = loadRegistry()
  const blocks = []
  const routes = []

  for (let index = 0; index < registry.length; index++) {
    const site = registry[index]
    if (SITE_FILTER && !SITE_FILTER.includes(site.id)) continue

    const port = prodPort(site.id, index)
    const staging = stagingDomainForSite(site)

    if (staging) {
      blocks.push(renderBlock(template, { site, domain: staging, port, role: 'staging' }))
      routes.push({ siteId: site.id, domain: staging, port, role: 'staging' })
    }

    if (vpsHostsProduction(site)) {
      const prod = await productionDomainForSite(site)
      blocks.push(renderBlock(template, { site, domain: prod, port, role: 'production' }))
      routes.push({ siteId: site.id, domain: prod, port, role: 'production' })
    }

    const prodCors = await productionDomainForSite(site)
    if (!routes.some((r) => r.domain === prodCors && r.role === 'production')) {
      routes.push({ siteId: site.id, domain: prodCors, port, role: 'cors-prod' })
    }
  }

  return { blocks, registry, routes }
}

async function writeCorsOrigins(routes) {
  const lines = [
    '# Allowed browser origins for platform backend CORS (Supabase/Kong).',
    '# Configure these on the backend API — not on the frontend VPS nginx.',
    '# Includes staging VPS + production domains (including cPanel-only sites):',
    '',
  ]
  const seen = new Set()
  for (const route of routes) {
    if (seen.has(route.domain)) continue
    seen.add(route.domain)
    const label =
      route.role === 'cors-prod' ? `${route.siteId} (production / cPanel)`
      : `${route.siteId} (${route.role})`
    lines.push(`https://${route.domain}  # ${label}`)
    if (route.role === 'production' && includeWww) {
      lines.push(`https://www.${route.domain}  # ${route.siteId} (www)`)
    }
  }
  lines.push('')
  lines.push('# Local pm2 (optional — frontend proxies API on localhost by default)')
  for (let port = DEV_PORT_BASE; port < DEV_PORT_BASE + 8; port++) {
    lines.push(`http://localhost:${port}`)
  }
  lines.push('')
  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(CORS_FILE, lines.join('\n'))
  return CORS_FILE
}

async function main() {
  const template = await readFile(TEMPLATE_PATH, 'utf8')
  const { blocks, routes } = await buildSiteBlocks(template)

  const header = `# Generated by deploy/scripts/generate-nginx.mjs — HTTP only (TLS via certbot --nginx)
# Regenerate: cd frontend && node deploy/scripts/generate-nginx.mjs
# WARNING: --install overwrites /etc/nginx/... and removes certbot SSL blocks — re-run certbot after.

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

`
  const body = header + blocks.join('\n')

  if (corsOnly) {
    const corsPath = await writeCorsOrigins(routes)
    console.log(`[nginx] Wrote ${corsPath}`)
    return
  }

  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(OUTPUT_FILE, body)
  await writeCorsOrigins(routes)

  console.log(`[nginx] Wrote ${OUTPUT_FILE}`)
  console.log(`[nginx] Wrote ${CORS_FILE}`)
  if (SITE_FILTER) console.log(`[nginx] Site filter: ${SITE_FILTER.join(', ')}`)
  console.log('[nginx] VPS site map (HTTP; TLS = manual certbot):')
  for (const route of routes) {
    if (route.role === 'cors-prod') continue
    console.log(
      `  http://${route.domain} → 127.0.0.1:${route.port} (${route.siteId}-prod, ${route.role})`,
    )
  }

  if (install) {
    await writeFile(INSTALL_PATH, body)
    console.log(`[nginx] Installed ${INSTALL_PATH}`)
    console.log(`[nginx] Enable: ln -sf ${INSTALL_PATH} ${ENABLED_LINK}`)
    console.log('[nginx] If certbot already configured TLS, re-run certbot --nginx for affected domains.')
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
