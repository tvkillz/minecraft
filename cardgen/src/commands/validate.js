import path from 'node:path'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { validateCardBatch } from '../lib/validateCards.js'
import { validateAndRepairCards } from '../lib/repairBatch.js'
import { parseArgs, readJsonFile, writeJsonFile } from '../lib/io.js'

export async function validateBatchFile(filePath, projectId, { repair = true, writeBack = false } = {}) {
  const abs = path.resolve(filePath)
  const batch = await readJsonFile(abs)
  const pid = batch.meta?.project || projectId
  const paths = projectPaths(pid)
  const ctx = await loadProjectContext(pid, paths)
  let cards = batch.cards ?? []

  const { cards: repaired, validation, repairRounds } = await validateAndRepairCards(cards, ctx, {
    repair,
  })
  cards = repaired

  if (writeBack && repairRounds > 0) {
    batch.cards = cards
    batch.meta = {
      ...batch.meta,
      validation: {
        ok: validation.ok,
        error_count: validation.errorCount,
        results: validation.results,
        repaired_at: new Date().toISOString(),
        repair_rounds: repairRounds,
      },
    }
    await writeJsonFile(abs, batch)
    console.log(`  Updated batch file (${repairRounds} repair round(s))`)
  }

  return { abs, batch: { ...batch, cards }, validation, repairRounds, projectId: pid }
}

export async function runValidate(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const file = flags.file
  if (!file) {
    console.error('Usage: npm run validate -- --file=.../kronos_batch_08-20.json [--no-repair]')
    console.error('       npm run validate-round -- --round=round_YYYYMMDD_08-20')
    process.exit(1)
  }

  const repair = !flags['no-repair']
  const projectId = flags.project || resolveProjectId()
  const { abs, validation, repairRounds } = await validateBatchFile(file, projectId, {
    repair,
    writeBack: repair,
  })

  console.log(`File: ${abs}`)
  if (repairRounds > 0) {
    console.log(`Auto-repair: ${repairRounds} Gemini round(s)`)
  }
  console.log(`Cards: ${validation.results.length} | Validation: ${validation.ok ? 'PASS' : 'FAIL'} (${validation.errorCount} issues)`)

  for (const r of validation.results) {
    if (!r.ok) {
      console.log(`  ✗ ${r.slug ?? r.title}: ${r.issues.join('; ')}`)
    }
  }

  if (validation.ok) {
    console.log('All cards passed validation.')
  } else {
    process.exit(1)
  }
}
