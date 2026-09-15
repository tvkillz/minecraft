import { formatRarityGlossary } from '../lib/rarity.js'
import { formatEconomyPromptSection } from '../lib/cardEconomy.js'

function statLabel(cardgen, key) {
  return cardgen?.statLabels?.[key] ?? key
}

function formatExamples(examples, cardgen) {
  if (!examples?.length) return '(no examples)'
  const spirit = statLabel(cardgen, 'attack')
  const calm = statLabel(cardgen, 'health')
  return examples
    .map(
      (c) =>
        `- ${c.title} (${c.slug}) mana ${c.stats.mana} ${spirit.toLowerCase()} ${c.stats.attack} ${calm.toLowerCase()} ${c.stats.health}${c.rarity ? ` | rarity ${c.rarity}` : ''} | ${c.role} | keywords: ${(c.keywords ?? []).join(', ') || 'none'} | ${c.ability.name}: ${c.ability.text}`,
    )
    .join('\n')
}

function formatKeywords(glossary) {
  return Object.entries(glossary)
    .map(([name, desc]) => `- ${name}: ${desc}`)
    .join('\n')
}

/**
 * @param {object} opts
 * @param {string} opts.domain
 * @param {number} opts.count
 * @param {number} opts.startIndex
 * @param {object} opts.ctx — from loadProjectContext
 */
export function buildCardGenerationPrompt({ domain, count, startIndex, ctx }) {
  const { cardgen } = ctx
  const domainMeta = cardgen.domainById[domain] ?? {}
  const examples = ctx.examplesByDomain[domain] ?? []
  const endIndex = startIndex + count - 1
  const pad = (n) => String(n).padStart(2, '0')
  const maxKw = cardgen.generation.maxKeywordsPerCard

  const reservedSlugs = [...ctx.existingSlugs].filter((s) => s.startsWith(`${domain}_card_`))

  const designRules = cardgen.designRules.map((r) => `- ${r}`).join('\n')
  const img = cardgen.image
  const spirit = statLabel(cardgen, 'attack')
  const calm = statLabel(cardgen, 'health')
  const statNote =
    spirit !== 'attack' || calm !== 'health'
      ? `\n## Card stats\n- JSON fields: stats.mana, stats.attack (${spirit}), stats.health (${calm})\n- Ability copy uses "${spirit}" and "${calm}" — never attack, damage, or health in player-facing text.\n`
      : ''

  return `You are designing collectible TCG unit cards for ${cardgen.gameTitle}, ${cardgen.gamePitch}.

## World context
${cardgen.world.title || 'The realms'}
${cardgen.world.description || ''}

## Target domain
- id: ${domain}
- label: ${domainMeta.label ?? domain}
- visual identity: ${domainMeta.visualIdentity}
- flavor archetypes: ${domainMeta.flavorNotes || 'varied unit types'}

## Task
Generate exactly ${count} NEW unit cards for domain "${domain}" only.

Slug numbering MUST use indices ${pad(startIndex)} through ${pad(endIndex)} inclusive:
  pattern: ${domain}_card_${pad(startIndex)}_{snake_case_title}
  example: ${domain}_card_${pad(startIndex)}_obsidian_sentinel

Do NOT reuse any existing slug or title. Reserved slugs in this domain include:
${reservedSlugs.slice(0, 30).join(', ') || '(none yet)'}${reservedSlugs.length > 30 ? '…' : ''}
${statNote}## Rarity tiers (mana bands — rarity and price are assigned from stats after generation)
${formatRarityGlossary(ctx.raritiesJson)}

${formatEconomyPromptSection()}

## Allowed keywords (use 0–${maxKw} per card, glossary only)
${formatKeywords(ctx.keywordsGlossary)}

## Design rules
${designRules}
- image_prompt: ${img.promptGuidelines}
- image_notes: ${img.notesGuidelines}

## Example cards from this domain (match tone and complexity)
${formatExamples(examples, cardgen)}

Return JSON: { "cards": [ ... exactly ${count} cards ... ] }`
}

export function buildFullImagePrompt(card, ctx) {
  const suffix = ctx?.cardgen?.image?.promptSuffix ?? ''
  const base = card.image_prompt?.trim() ?? ''
  return suffix ? `${base}. ${suffix}` : base
}
