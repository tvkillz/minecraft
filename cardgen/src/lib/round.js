import path from 'node:path'
import { readdir } from 'node:fs/promises'
import { projectPaths, roundDir, roundManifestPath } from '../config/paths.js'
import { loadProjectContext } from './loadProject.js'
import { readJsonFile, writeJsonFile, ensureDir, batchFileName } from './io.js'

const pad = (n) => String(n).padStart(2, '0')

/**
 * Resolve cards per domain from --per-domain or --total (must divide evenly).
 * @param {object} flags
 * @param {number} domainCount
 * @param {number} maxBatch
 */
export function resolvePerDomain(flags, domainCount, maxBatch = 50) {
  if (flags['per-domain'] != null) {
    const n = Number(flags['per-domain'])
    if (!Number.isInteger(n) || n < 1) {
      throw new Error('--per-domain must be a positive integer')
    }
    if (n > maxBatch) throw new Error(`--per-domain max is ${maxBatch}`)
    return n
  }

  if (flags.total != null) {
    const total = Number(flags.total)
    if (!Number.isInteger(total) || total < domainCount) {
      throw new Error(`--total must be an integer >= domain count (${domainCount})`)
    }
    if (total % domainCount !== 0) {
      throw new Error(
        `--total=${total} must be divisible by domain count (${domainCount}). ` +
          `Try --total=${Math.floor(total / domainCount) * domainCount} or --per-domain=${Math.floor(total / domainCount)}`,
      )
    }
    const per = total / domainCount
    if (per > maxBatch) throw new Error(`per-domain ${per} exceeds max batch size ${maxBatch}`)
    return per
  }

  return 1
}

export function buildRoundId(perDomain, fromIndex) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const to = fromIndex + perDomain - 1
  return `round_${date}_${pad(fromIndex)}-${pad(to)}`
}

export async function listRoundIds(paths) {
  try {
    const names = await readdir(paths.stagingRounds)
    return names.filter((n) => n.startsWith('round_')).sort()
  } catch {
    return []
  }
}

export async function loadRound(paths, roundId) {
  const dir = roundDir(paths, roundId)
  const manifest = await readJsonFile(roundManifestPath(paths, roundId))
  return { dir, manifest, roundId }
}

export function resolveRoundRef(flags, paths) {
  if (flags.round) {
    return { roundId: flags.round, dir: roundDir(paths, flags.round) }
  }
  if (flags['round-dir']) {
    const dir = path.resolve(flags['round-dir'])
    const roundId = path.basename(dir)
    return { roundId, dir }
  }
  return null
}

/**
 * @param {object} opts
 * @param {string} opts.projectId
 * @param {number} opts.perDomain
 * @param {string[]} opts.domainIds
 * @param {Record<string, number>} opts.nextIndexByDomain
 */
export function batchPathInRound(roundDirectory, domain, from, count) {
  return path.join(roundDirectory, batchFileName(domain, from, count))
}
