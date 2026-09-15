import { slugToTitle } from '../lib/showcaseSlugs.js'
import { formatRarityGlossary } from '../lib/rarity.js'
import { formatEconomyPromptSection } from '../lib/cardEconomy.js'

function statLabel(cardgen, key) {
  return cardgen?.statLabels?.[key] ?? key
}

function formatKeywords(glossary) {
  return Object.entries(glossary)
    .map(([name, desc]) => `- ${name}: ${desc}`)
    .join('\n')
}

/**
 * @param {string} domain
 * @param {string[]} requiredSlugs — exact slugs Gemini must output
 * @param {object} ctx
 */
export function buildShowcasePrompt(domain, requiredSlugs, ctx) {
  const { cardgen } = ctx
  const domainMeta = cardgen.domainById[domain] ?? {}
  const maxKw = cardgen.generation.maxKeywordsPerCard
  const designRules = cardgen.designRules.map((r) => `- ${r}`).join('\n')
  const img = cardgen.image
  const spirit = statLabel(cardgen, 'attack')
  const calm = statLabel(cardgen, 'health')
  const statNote =
    spirit !== 'attack' || calm !== 'health'
      ? `\n## Card stats\n- JSON fields: stats.mana, stats.attack (${spirit}), stats.health (${calm})\n- Ability copy uses "${spirit}" and "${calm}" — never attack, damage, or health in player-facing text.\n`
      : ''

  const slugLines = requiredSlugs
    .map((slug) => {
      const titleHint = slugToTitle(slug)
      return `  - slug MUST be exactly "${slug}" (title around "${titleHint}")`
    })
    .join('\n')

  return `You are designing collectible TCG unit cards for ${cardgen.gameTitle}, ${cardgen.gamePitch}.

## World context
${cardgen.world.title || 'The realms'}
${cardgen.world.description || ''}

## Target domain
- id: ${domain}
- label: ${domainMeta.label ?? domain}
- visual identity: ${domainMeta.visualIdentity}
- flavor archetypes: ${domainMeta.flavorNotes || 'varied unit types'}

## Task — landing showcase cards
Generate exactly ${requiredSlugs.length} cards for domain "${domain}".
These cards appear on the public landing page. Use the EXACT slugs below (do not invent different indices or suffixes):

${slugLines}
${statNote}## Rarity tiers (mana bands — rarity and price are assigned from stats after generation)
${formatRarityGlossary(ctx.raritiesJson)}

${formatEconomyPromptSection()}

## Allowed keywords (use 0–${maxKw} per card, glossary only)
${formatKeywords(ctx.keywordsGlossary)}

## Design rules
${designRules}
- image_prompt: ${img.promptGuidelines}
- image_notes: ${img.notesGuidelines}

Return JSON: { "cards": [ ... exactly ${requiredSlugs.length} cards with the exact slugs listed ... ] }`
}
