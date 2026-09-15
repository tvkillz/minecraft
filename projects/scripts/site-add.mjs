#!/usr/bin/env node
/**
 * Scaffold a new Minecraft store pack from _template (or another pack).
 *
 *   node projects/scripts/site-add.mjs --id=coop --url=https://coop.example.com --name="The Coop"
 */
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { writeStorePack } from './write-store-pack.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PROJECTS = path.join(ROOT, 'projects')
const REGISTRY = path.join(PROJECTS, 'registry.json')

function arg(flag, fallback = '') {
  const prefix = `${flag}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : fallback
}

function hostFromUrl(url) {
  return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

async function readRegistry() {
  try {
    return JSON.parse(await readFile(REGISTRY, 'utf8'))
  } catch {
    return []
  }
}

async function pathExists(p) {
  try {
    await readFile(p)
    return true
  } catch {
    return false
  }
}

const id = arg('--id')
const url = (arg('--url') || `https://${id}.example.com`).replace(/\/$/, '')
const name = arg('--name') || id
const short = arg('--short') || name
const from = arg('--from', '_template')
const status = arg('--status', 'demo')

if (!id) {
  console.error('Usage: node projects/scripts/site-add.mjs --id=mysite --url=https://mysite.example.com --name=MySite')
  process.exit(1)
}

const dest = path.join(PROJECTS, id)
if (await pathExists(path.join(dest, 'manifest.json'))) {
  console.error(`projects/${id} already exists`)
  process.exit(1)
}

const sourceRoot = path.join(PROJECTS, from)
const sourceManifest = path.join(sourceRoot, 'manifest.json')

if (from === '_template' && !(await pathExists(sourceManifest))) {
  await writeStorePack({ id: '_template', name: 'STORE', short: 'Store', url: 'https://store.example.com' })
  console.log('Seeded projects/_template')
}

if (await pathExists(sourceManifest) && from !== id) {
  await mkdir(dest, { recursive: true })
  await cp(sourceRoot, dest, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}assets${path.sep}_staging`),
  })
  const manifestPath = path.join(dest, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  manifest.id = id
  manifest.siteUrl = url
  manifest.name = {
    display: name.toUpperCase() === name ? name : name,
    short,
    documentTitle: name,
  }
  if (manifest.brand) {
    manifest.brand.logoAlt = short
    manifest.brand.headerLogoAlt = short
    manifest.brand.playLogoAlt = short
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Copied projects/${from} → projects/${id}`)
} else {
  await writeStorePack({ id, name, short, url })
  console.log(`Generated projects/${id}`)
}

const registry = await readRegistry()
if (registry.some((site) => site.id === id)) {
  console.log(`Registry already has ${id}`)
} else {
  registry.push({
    id,
    name,
    domain: hostFromUrl(url),
    status,
    stagingDomain: `staging.${hostFromUrl(url)}`,
  })
  await writeFile(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`)
  console.log(`Registered ${id} in projects/registry.json`)
}

console.log(`
Next:
  cd frontend
  PROJECT=${id} npm run compile
  PROJECT=${id} npm run dev:host
`)
