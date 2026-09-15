#!/usr/bin/env node
/**
 * Reassign rarity (by stat-value rank) and priceCents (stat formula + band clamp)
 * for all cards in projects/{id}/game/cards.json.
 *
 * Usage:
 *   node scripts/rebalance-card-economy.mjs --all
 *   node scripts/rebalance-card-economy.mjs --project=voidborn
 *   node scripts/rebalance-card-economy.mjs --all --dry-run
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  assignRarityByQuota,
  computeRawValue,
  loadEconomy,
  RARITY_ORDER,
} from './card-economy.mjs'
import { loadRegistry } from './project-ports.mjs'
import { projectRoot, resolveProjectId } from './project-paths.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const all = argv.includes('--all')
  const dryRun = argv.includes('--dry-run')
  const project = argv.find((a) => a.startsWith('--project='))?.slice('--project='.length)
  return { all, dryRun, project: project ?? (all ? null : resolveProjectId(argv)) }
}

function cardsPath(projectId) {
  return path.join(projectRoot(projectId), 'game/cards.json')
}

function summarize(cards) {
  const byRarity = Object.fromEntries(RARITY_ORDER.map((t) => [t, 0]))
  const prices = { min: Infinity, max: 0, sum: 0 }

  for (const card of cards) {
    byRarity[card.rarity] = (byRarity[card.rarity] ?? 0) + 1
    const p = card.priceCents ?? 0
    prices.min = Math.min(prices.min, p)
    prices.max = Math.max(prices.max, p)
    prices.sum += p
  }

  return {
    total: cards.length,
    byRarity,
    priceMin: cards.length ? prices.min : 0,
    priceMax: cards.length ? prices.max : 0,
    priceAvg: cards.length ? Math.round(prices.sum / cards.length) : 0,
  }
}

async function rebalanceProject(projectId, economy, dryRun) {
  const file = cardsPath(projectId)
  let parsed
  try {
    parsed = JSON.parse(await readFile(file, 'utf8'))
  } catch (err) {
    console.warn(`[skip] ${projectId}: ${err.message}`)
    return false
  }

  const cards = parsed.cards ?? []
  if (!cards.length) {
    console.warn(`[skip] ${projectId}: no cards`)
    return false
  }

  assignRarityByQuota(cards, economy, { groupBy: 'domain' })

  const stats = summarize(cards)
  console.log(`\n[${projectId}] ${stats.total} cards`)
  console.log('  rarity:', stats.byRarity)
  console.log(`  price: min ${stats.priceMin} · avg ${stats.priceAvg} · max ${stats.priceMax}`)

  if (!dryRun) {
    parsed.cards = cards
    await writeFile(file, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')
    console.log(`  wrote ${file}`)
  } else {
    console.log('  (dry-run — not written)')
  }

  return true
}

async function main() {
  const { all, dryRun, project } = parseArgs(process.argv)
  const economy = loadEconomy()
  const projects = all ? loadRegistry().map((s) => s.id) : [project]

  console.log(
    `[rebalance-card-economy] ${dryRun ? 'DRY RUN · ' : ''}${projects.length} project(s)`,
  )

  let ok = 0
  for (const id of projects) {
    if (await rebalanceProject(id, economy, dryRun)) ok += 1
  }

  if (!dryRun && ok > 0) {
    console.log('\nNext: push to Postgres from frontend/')
    console.log('  npm run upload:all')
  }

  process.exit(ok > 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('[rebalance-card-economy]', err.message ?? err)
  process.exit(1)
})
