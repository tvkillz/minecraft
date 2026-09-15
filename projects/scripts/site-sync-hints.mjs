#!/usr/bin/env node
/**
 * Print backend redirect + sites-table hints for every registered store.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const REGISTRY = path.join(ROOT, 'projects/registry.json')

const registry = JSON.parse(await readFile(REGISTRY, 'utf8'))
const urls = []

for (const site of registry) {
  const manifestPath = path.join(ROOT, 'projects', site.id, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const origin = manifest.siteUrl.replace(/\/$/, '')
  urls.push(`${origin}/**`)
  if (site.stagingDomain) {
    urls.push(`https://${site.stagingDomain}/**`)
  }
}

console.log('--- ADDITIONAL_REDIRECT_URLS (backend/.env) ---')
console.log(urls.join(','))
console.log('')
console.log('--- sites table ---')
for (const site of registry) {
  const domain = site.domain || site.id
  console.log(
    `insert into public.sites (id, name, domain, status) values ('${site.id}', '${site.name}', '${domain}', '${site.status || 'demo'}') on conflict (id) do update set domain = excluded.domain, status = excluded.status;`,
  )
}
