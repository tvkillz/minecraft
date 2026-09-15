#!/usr/bin/env node
/**
 * Print or update a site's public URL in registry + manifest.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const REGISTRY = path.join(ROOT, 'projects/registry.json')

function arg(flag) {
  const prefix = `${flag}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : ''
}

const id = arg('--id') || process.env.PROJECT
const url = (arg('--url') || '').replace(/\/$/, '')
if (!id) {
  console.error('Usage: node projects/scripts/site-url.mjs --id=coop [--url=https://coop.example.com]')
  process.exit(1)
}

const registry = JSON.parse(await readFile(REGISTRY, 'utf8'))
const site = registry.find((row) => row.id === id)
if (!site) {
  console.error(`${id} is not in registry.json`)
  process.exit(1)
}

const manifestPath = path.join(ROOT, 'projects', id, 'manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

if (!url) {
  console.log(manifest.siteUrl || site.domain)
  process.exit(0)
}

const host = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
manifest.siteUrl = url
site.domain = host
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`)
console.log(`Updated ${id} → ${url}`)
