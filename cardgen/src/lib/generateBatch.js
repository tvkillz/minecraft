import path from 'node:path'
import { getGenerativeModel, getGeminiTextModelId } from '../config/gemini.js'
import { cardBatchSchema } from '../schema/cardSchema.js'
import { projectPaths } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { validateAndRepairCards } from '../lib/repairBatch.js'
import { buildCardGenerationPrompt } from '../prompts/buildCardPrompt.js'
import { batchFileName, ensureDir, writeJsonFile } from '../lib/io.js'
import { withGeminiRetries } from './geminiRetry.js'
import { assignRarityByQuota, loadEconomy } from './cardEconomy.js'

/**
 * @param {{ projectId: string, domain: string, count: number, from?: number, outDir?: string, roundId?: string }} opts
 * @returns {Promise<{ outFile: string, batch: object, validation: object }>}
 */
export async function generateCardBatch({ projectId, domain, count, from: startIndex, outDir, roundId }) {
  const paths = projectPaths(projectId)
  const ctx = await loadProjectContext(projectId, paths)
  const maxBatch = ctx.cardgen.generation.maxBatchPerDomain

  if (!ctx.domainIds.includes(domain)) {
    throw new Error(`Unknown domain "${domain}". Registered: ${ctx.domainIds.join(', ')}`)
  }
  if (count > maxBatch) {
    throw new Error(`count ${count} exceeds project maxBatchPerDomain (${maxBatch})`)
  }

  const from = startIndex ?? ctx.nextIndexByDomain[domain]
  if (!Number.isInteger(from) || from < 1) {
    throw new Error(`Could not resolve start index for ${domain}; pass --from=NN`)
  }

  console.log(`Generating ${count} cards for ${projectId}/${domain} (indices ${from}–${from + count - 1})…`)

  const prompt = buildCardGenerationPrompt({ domain, count, startIndex: from, ctx })
  const model = getGenerativeModel(cardBatchSchema())

  const raw = await withGeminiRetries(async () => {
    const result = await model.generateContent(prompt)
    return result.response.text()
  }, { label: 'Gemini text' })

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    throw new Error(`Gemini returned invalid JSON: ${e.message}\n${raw.slice(0, 1500)}`)
  }

  let cards = parsed.cards ?? []
  if (cards.length !== count) {
    console.warn(`Expected ${count} cards, got ${cards.length}`)
  }

  const repaired = await validateAndRepairCards(cards, ctx, { repair: true })
  cards = repaired.cards
  const validation = repaired.validation
  if (repaired.repairRounds > 0) {
    console.log(`Auto-repaired titles: ${repaired.repairRounds} Gemini round(s)`)
  }
  if (!validation.ok) {
    console.warn(`Validation: ${validation.errorCount} card(s) have issues (batch still written for review)`)
    for (const r of validation.results.filter((x) => !x.ok)) {
      console.warn(`  ${r.slug}: ${r.issues.join('; ')}`)
    }
  }

  const economy = loadEconomy()
  assignRarityByQuota(cards, economy, { groupBy: 'all' })

  const batch = {
    meta: {
      project: projectId,
      domain,
      round_id: roundId ?? null,
      status: 'draft',
      generated_at: new Date().toISOString(),
      model: getGeminiTextModelId(),
      slug_range: {
        from,
        to: from + count - 1,
        count: cards.length,
      },
      validation: {
        ok: validation.ok,
        error_count: validation.errorCount,
        results: validation.results,
        repair_rounds: repaired.repairRounds,
      },
    },
    cards,
  }

  const destDir = outDir ?? paths.stagingCards
  await ensureDir(destDir)
  const outFile = path.join(destDir, batchFileName(domain, from, count))
  await writeJsonFile(outFile, batch)

  console.log(`Wrote ${cards.length} cards → ${outFile}`)
  return { outFile, batch, validation }
}
