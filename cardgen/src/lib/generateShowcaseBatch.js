import path from 'node:path'
import { getGenerativeModel, getGeminiTextModelId } from '../config/gemini.js'
import { cardBatchSchema } from '../schema/cardSchema.js'
import { projectPaths } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { validateAndRepairCards } from '../lib/repairBatch.js'
import { buildShowcasePrompt } from '../prompts/buildShowcasePrompt.js'
import { groupShowcaseByDomain, loadShowcaseSlugs } from '../lib/showcaseSlugs.js'
import { ensureDir, writeJsonFile } from '../lib/io.js'
import { withGeminiRetries } from './geminiRetry.js'
import { assignRarityByQuota, loadEconomy } from './cardEconomy.js'

function normalizeShowcaseSlugs(cards, requiredSlugs) {
  const byIndex = new Map()
  for (const slug of requiredSlugs) {
    const m = slug.match(/_card_(\d{2})_/)
    if (m) byIndex.set(Number(m[1]), slug)
  }

  const sorted = [...cards].sort((a, b) => {
    const ia = Number(a.slug?.match(/_card_(\d{2})_/)?.[1] ?? 99)
    const ib = Number(b.slug?.match(/_card_(\d{2})_/)?.[1] ?? 99)
    return ia - ib
  })

  return sorted.map((card, i) => {
    const required = requiredSlugs[i] ?? [...byIndex.values()][i]
    if (!required) return card
    const domain = required.split('_card_')[0]
    return { ...card, slug: required, domain }
  })
}

/**
 * Generate landing showcase cards (featured + collection slugs) via Gemini.
 */
export async function generateShowcaseBatch(projectId, { force = false } = {}) {
  const paths = projectPaths(projectId)
  const ctx = await loadProjectContext(projectId, paths)
  const allSlugs = await loadShowcaseSlugs(paths)

  if (!allSlugs.length) {
    throw new Error('No showcase slugs in locations.json / copy/collection.json')
  }

  const missing = allSlugs.filter((s) => !ctx.existingSlugs.has(s))
  const existing = allSlugs.filter((s) => ctx.existingSlugs.has(s))

  if (existing.length && !force) {
    console.log(`Already in cards.json (${existing.length}): ${existing.join(', ')}`)
    if (!missing.length) {
      throw new Error('All showcase slugs exist — use --force to regenerate batch')
    }
    console.log(`Will generate batch for missing only: ${missing.join(', ')}`)
  }

  const targetSlugs = force ? allSlugs : missing.length ? missing : allSlugs
  const byDomain = groupShowcaseByDomain(targetSlugs)
  const allCards = []

  for (const domain of ctx.domainIds) {
    const requiredSlugs = byDomain[domain]
    if (!requiredSlugs?.length) continue

    console.log(`\nShowcase: ${domain} (${requiredSlugs.length} cards)…`)
    const prompt = buildShowcasePrompt(domain, requiredSlugs, ctx)
    const model = getGenerativeModel(cardBatchSchema())

    const raw = await withGeminiRetries(async () => {
      const result = await model.generateContent(prompt)
      return result.response.text()
    }, { label: `Gemini showcase/${domain}` })

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      throw new Error(`Gemini returned invalid JSON for ${domain}: ${e.message}`)
    }

    let cards = normalizeShowcaseSlugs(parsed.cards ?? [], requiredSlugs)
    if (cards.length !== requiredSlugs.length) {
      console.warn(`Expected ${requiredSlugs.length} cards for ${domain}, got ${cards.length}`)
    }

    const repaired = await validateAndRepairCards(cards, ctx, { repair: true })
    cards = normalizeShowcaseSlugs(repaired.cards, requiredSlugs)

    for (const card of cards) {
      allCards.push(card)
    }
  }

  const economy = loadEconomy()
  assignRarityByQuota(allCards, economy, { groupBy: 'domain' })

  const batch = {
    meta: {
      project: projectId,
      kind: 'showcase',
      status: 'draft',
      generated_at: new Date().toISOString(),
      model: getGeminiTextModelId(),
      slugs: targetSlugs,
    },
    cards: allCards,
  }

  await ensureDir(paths.stagingShowcase)
  const outFile = path.join(paths.stagingShowcase, 'showcase_batch.json')
  await writeJsonFile(outFile, batch)

  console.log(`\nWrote ${outFile} (${allCards.length} cards)`)
  return { outFile, batch }
}
