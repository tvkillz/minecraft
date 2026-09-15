import path from 'node:path'
import { unlink } from 'node:fs/promises'
import { projectPaths, roundDir, roundManifestPath, resolveProjectId } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { generateCardBatch } from '../lib/generateBatch.js'
import {
  resolvePerDomain,
  buildRoundId,
  loadRound,
  resolveRoundRef,
  listRoundIds,
} from '../lib/round.js'
import { parseArgs, readJsonFile, writeJsonFile, ensureDir } from '../lib/io.js'
import { validateBatchFile } from './validate.js'
import { applyBatch } from './apply.js'
import { runGenerateImages } from './generate-images.js'
import { cleanupAfterApply } from '../lib/stagingCleanup.js'

export async function runGenerateRound(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const paths = projectPaths(projectId)
  const ctx = await loadProjectContext(projectId, paths)
  const domainCount = ctx.domainIds.length

  if (domainCount < 1) {
    console.error('No domains in game/domains.json')
    process.exit(1)
  }

  const perDomain = resolvePerDomain(flags, domainCount, ctx.cardgen.generation.maxBatchPerDomain)
  const total = perDomain * domainCount
  const fromIndex = Math.min(...ctx.domainIds.map((d) => ctx.nextIndexByDomain[d]))
  const roundId = flags['round-id'] || buildRoundId(perDomain, fromIndex)
  const outDir = roundDir(paths, roundId)

  console.log(`Project: ${projectId}`)
  console.log(`Round: ${roundId}`)
  console.log(`Domains: ${domainCount} × ${perDomain} = ${total} cards\n`)

  await ensureDir(outDir)
  const batchEntries = []

  for (const domain of ctx.domainIds) {
    console.log(`── ${domain} ──`)
    const from = ctx.nextIndexByDomain[domain]
    const result = await generateCardBatch({
      projectId,
      domain,
      count: perDomain,
      from,
      outDir,
      roundId,
    })
    batchEntries.push({
      domain,
      file: path.basename(result.outFile),
      from,
      to: from + perDomain - 1,
      count: perDomain,
      validation_ok: result.validation.ok,
    })
  }

  const roundManifest = {
    meta: {
      project: projectId,
      round_id: roundId,
      status: 'draft',
      per_domain: perDomain,
      domain_count: domainCount,
      total_cards: total,
      created_at: new Date().toISOString(),
      domains: ctx.domainIds,
      batches: batchEntries,
    },
  }

  await writeJsonFile(roundManifestPath(paths, roundId), roundManifest)

  console.log(`\nRound manifest → ${roundManifestPath(paths, roundId)}`)
  console.log(`Total: ${total} cards in ${batchEntries.length} batch files`)
  console.log('\nNext:')
  console.log(`  npm run validate-round -- --round=${roundId} --project=${projectId}`)
}

async function requireRound(flags, projectId) {
  const paths = projectPaths(projectId)
  const ref = resolveRoundRef(flags, paths)
  if (!ref) {
    console.error('Usage: --round=round_YYYYMMDD_08-20  (or --round-dir=path/to/round)')
    process.exit(1)
  }
  const { dir, manifest, roundId } = await loadRound(paths, ref.roundId)
  return { paths, dir, manifest, roundId, projectId: manifest.meta?.project || projectId }
}

export async function runValidateRound(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const { dir, manifest, roundId } = await requireRound(flags, projectId)

  console.log(`Round: ${roundId} (${manifest.meta?.total_cards} cards)\n`)
  let failed = 0

  for (const entry of manifest.meta.batches) {
    const file = path.join(dir, entry.file)
    console.log(`── ${entry.file} ──`)
    const { abs, validation, repairRounds } = await validateBatchFile(file, projectId, {
      repair: !flags['no-repair'],
      writeBack: !flags['no-repair'],
    })
    console.log(`File: ${abs}`)
    if (repairRounds > 0) {
      console.log(`Auto-repair: ${repairRounds} Gemini round(s)`)
    }
    console.log(`Validation: ${validation.ok ? 'PASS' : 'FAIL'} (${validation.errorCount} issues)`)
    for (const r of validation.results.filter((x) => !x.ok)) {
      console.log(`  ✗ ${r.slug}: ${r.issues.join('; ')}`)
    }
    if (!validation.ok) failed++
    console.log('')
  }

  if (failed) {
    console.error(`${failed} batch(es) failed validation.`)
    process.exit(1)
  }
  console.log('Round validation passed.')
}

export async function runApproveRound(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const { paths, dir, manifest, roundId } = await requireRound(flags, projectId)
  const approvedDir = path.join(dir, 'approved')
  await ensureDir(approvedDir)

  const updatedBatches = []
  for (const entry of manifest.meta.batches) {
    const src = path.join(dir, entry.file)
    const batch = await readJsonFile(src)
    batch.meta = { ...batch.meta, status: 'approved', approved_at: new Date().toISOString() }
    const dest = path.join(approvedDir, entry.file)
    await writeJsonFile(dest, batch)
    if (path.resolve(src) !== path.resolve(dest)) {
      await unlink(src).catch(() => {})
    }
    updatedBatches.push({ ...entry, file: `approved/${entry.file}` })
  }

  manifest.meta = {
    ...manifest.meta,
    status: 'approved',
    approved_at: new Date().toISOString(),
    batches: updatedBatches,
  }
  await writeJsonFile(roundManifestPath(paths, roundId), manifest)

  console.log(`Round ${roundId} approved.`)
  console.log(`Next: npm run generate-images-round -- --round=${roundId}`)
}

export async function runGenerateImagesRound(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const { paths, dir, manifest, roundId } = await requireRound(flags, projectId)

  if (manifest.meta?.status !== 'approved') {
    console.warn('Round is not approved yet — continuing anyway.')
  }

  for (const entry of manifest.meta.batches) {
    const file = path.join(dir, entry.file)
    console.log(`\n=== Images: ${entry.file} ===`)
    await runGenerateImages([
      'generate-images',
      `--file=${file}`,
      `--project=${projectId}`,
      ...(flags.slug ? [`--slug=${flags.slug}`] : []),
      ...(flags.force ? ['--force'] : []),
      ...(flags['dry-run'] ? ['--dry-run'] : []),
    ])
  }

  console.log(`\nRound ${roundId} images done.`)
  console.log(`Next: npm run apply-round -- --round=${roundId}`)
}

export async function runApplyRound(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const { paths, dir, manifest, roundId } = await requireRound(flags, projectId)
  const dryRun = Boolean(flags['dry-run'])
  const keepStaging = Boolean(flags['keep-staging'])

  let applied = 0
  const allSlugs = []

  for (const entry of manifest.meta.batches) {
    const file = path.join(dir, entry.file)
    console.log(`\n=== Apply: ${entry.file} ===`)
    const result = await applyBatch(file, {
      projectId,
      dryRun,
      keepStaging: true,
    })
    applied += result.added
    allSlugs.push(...result.appliedSlugs)
  }

  if (dryRun) {
    console.log(`\nDry run: would apply ${applied} cards across round ${roundId}.`)
    return
  }

  if (!keepStaging && applied > 0) {
    const { imagesRemoved } = await cleanupAfterApply(paths, {
      appliedSlugs: allSlugs,
      batchFile: roundManifestPath(paths, roundId),
      roundDir: dir,
    })
    console.log(`\nRound staging cleared: ${roundId}/ + ${imagesRemoved} staged image(s)`)
  } else if (!dryRun && applied > 0 && keepStaging) {
    manifest.meta = {
      ...manifest.meta,
      status: 'applied',
      applied_at: new Date().toISOString(),
      applied_count: applied,
    }
    await writeJsonFile(roundManifestPath(paths, roundId), manifest)
  }

  console.log(`\nRound ${roundId}: applied ${applied} cards.`)
  console.log(`Upload: cd ../frontend && PROJECT=${projectId} npm run upload:site`)
}

export async function runListRounds(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const paths = projectPaths(projectId)
  const rounds = await listRoundIds(paths)

  console.log(`Project: ${projectId}`)
  console.log(`Config: ${paths.cardgen}`)
  console.log(`\nRounds (${paths.stagingRounds}):`)
  if (!rounds.length) {
    console.log('  (none)')
    return
  }

  for (const id of rounds) {
    try {
      const { manifest } = await loadRound(paths, id)
      const m = manifest.meta
      console.log(`  ${id}  [${m?.status}]  ${m?.total_cards} cards (${m?.per_domain}/domain)`)
    } catch {
      console.log(`  ${id}  (invalid manifest)`)
    }
  }
}

/** @deprecated use generate-round */
export async function runGenerateDomains(argv) {
  console.warn('generate-domains is deprecated — use generate-round (--per-domain or --total)\n')
  return runGenerateRound(argv)
}
