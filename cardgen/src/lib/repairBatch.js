import { getGenerativeModel } from '../config/gemini.js'
import { cardRepairBatchSchema } from '../schema/cardSchema.js'
import { validateCardBatch } from './validateCards.js'
import { slugsNeedingTitleRepair } from '../prompts/buildRepairPrompt.js'
import { buildTitleRepairPrompt } from '../prompts/buildRepairPrompt.js'
import { parseCardSlug, slugFromTitle } from './slugUtils.js'
import { withGeminiRetries } from './geminiRetry.js'

/**
 * @param {object[]} cards
 * @param {{ repairs: object[] }} parsed
 */
export function applyTitleRepairs(cards, parsed) {
  const bySlug = new Map(cards.map((c) => [c.slug, { ...c }]))
  const repairs = parsed.repairs ?? []

  for (const fix of repairs) {
    const card = bySlug.get(fix.slug)
    if (!card) continue

    const parsedSlug = parseCardSlug(fix.slug)
    const newTitle = fix.title?.trim()
    if (!newTitle) continue

    card.title = newTitle
    if (parsedSlug) {
      card.slug = slugFromTitle(parsedSlug.domain, parsedSlug.index, newTitle)
    }
    if (fix.ability_name?.trim()) {
      card.ability = { ...card.ability, name: fix.ability_name.trim() }
    }
    if (fix.image_prompt?.trim()) {
      card.image_prompt = fix.image_prompt.trim()
    }

    bySlug.delete(fix.slug)
    bySlug.set(card.slug, card)
  }

  return [...bySlug.values()]
}

/**
 * Reprompt Gemini to fix title/slug conflicts; re-validate until clean or max rounds.
 * @param {object[]} cards
 * @param {object} ctx — loadProjectContext
 * @param {{ maxRounds?: number }} [opts]
 */
export async function repairTitleConflicts(cards, ctx, { maxRounds = 3 } = {}) {
  let current = cards.map((c) => ({ ...c }))
  let validation = validateCardBatch(current, ctx)
  let repairRounds = 0

  if (validation.ok) {
    return { cards: current, validation, repairRounds: 0 }
  }

  for (let round = 0; round < maxRounds; round++) {
    const needRepair = slugsNeedingTitleRepair(validation)
    if (!needRepair.size) break

    console.log(`  Repair round ${round + 1}: reprompting Gemini for ${needRepair.size} card(s)…`)

    const prompt = buildTitleRepairPrompt(current, needRepair, ctx)
    const model = getGenerativeModel(cardRepairBatchSchema())

    const raw = await withGeminiRetries(async () => {
      const result = await model.generateContent(prompt)
      return result.response.text()
    }, { label: 'Gemini repair' })

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      console.warn(`  Repair JSON parse failed: ${e.message}`)
      break
    }

    const before = current.map((c) => c.slug).join(',')
    current = applyTitleRepairs(current, parsed)
    const after = current.map((c) => c.slug).join(',')
    repairRounds++

    for (const fix of parsed.repairs ?? []) {
      const updated = current.find(
        (c) => c.slug === fix.slug || c.title === fix.title?.trim(),
      )
      if (updated) {
        console.log(`    ${fix.slug} → "${updated.title}" (${updated.slug})`)
      }
    }

    validation = validateCardBatch(current, ctx)
    if (validation.ok) break

    const stillNeed = slugsNeedingTitleRepair(validation)
    if (!stillNeed.size && before === after) break
  }

  return { cards: current, validation, repairRounds }
}

/**
 * Validate batch; auto-repair title/slug conflicts when enabled.
 * @param {object[]} cards
 * @param {object} ctx
 * @param {{ repair?: boolean, maxRepairRounds?: number }} [opts]
 */
export async function validateAndRepairCards(cards, ctx, { repair = true, maxRepairRounds = 3 } = {}) {
  let current = cards
  let validation = validateCardBatch(current, ctx)
  let repairRounds = 0

  if (!validation.ok && repair && slugsNeedingTitleRepair(validation).size > 0) {
    const result = await repairTitleConflicts(current, ctx, { maxRounds: maxRepairRounds })
    current = result.cards
    validation = result.validation
    repairRounds = result.repairRounds
  }

  return { cards: current, validation, repairRounds }
}
