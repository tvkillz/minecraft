import { readFile } from 'node:fs/promises'

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

/** Highest `{domain}_card_{NN}_` index already used in cards.json for a domain. */
export function maxCardIndexForDomain(cards, domainId) {
  const re = new RegExp(`^${domainId}_card_(\\d+)_`)
  let max = 0
  for (const card of cards) {
    const m = card.slug?.match(re)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max
}

function buildDomainConfig(cardgen, domains) {
  const fromFile = cardgen?.domains ?? {}
  return Object.fromEntries(
    domains.map((d) => {
      const entry = fromFile[d.id] ?? {}
      return [
        d.id,
        {
          label: entry.label ?? d.label ?? d.id,
          visualIdentity: entry.visualIdentity ?? 'fantasy elemental realm',
          flavorNotes: entry.flavorNotes ?? '',
        },
      ]
    }),
  )
}

/** @param {object} domainsJson @param {object} [cardgenJson] */
export function defaultCardgenConfig(domainsJson, cardgenJson = {}) {
  const domains = domainsJson.domains ?? []
  return {
    gameTitle: cardgenJson.gameTitle ?? 'TCG Project',
    gamePitch: cardgenJson.gamePitch ?? 'a collectible trading card game',
    world: {
      title: cardgenJson.world?.title ?? '',
      description: cardgenJson.world?.description ?? '',
    },
    domainById: buildDomainConfig(cardgenJson, domains),
    designRules: cardgenJson.designRules ?? [
      'Mana 1–8. attack + health should roughly scale with mana.',
      'Ability text must spell out keyword effects.',
    ],
    statLabels: cardgenJson.statLabels ?? null,
    image: {
      aspectRatio: cardgenJson.image?.aspectRatio ?? '3:4',
      promptGuidelines:
        cardgenJson.image?.promptGuidelines ??
        'single focal subject, fantasy trading card art, no text, no frame, portrait 3:4',
      promptSuffix:
        cardgenJson.image?.promptSuffix ??
        'Fantasy trading card art, detailed, single focal subject, no text, no border, portrait 3:4.',
      notesGuidelines:
        cardgenJson.image?.notesGuidelines ?? 'negative prompts and palette hints',
    },
    generation: {
      maxKeywordsPerCard: cardgenJson.generation?.maxKeywordsPerCard ?? 2,
      exampleCardsPerDomain: cardgenJson.generation?.exampleCardsPerDomain ?? 5,
      maxBatchPerDomain: cardgenJson.generation?.maxBatchPerDomain ?? 50,
    },
  }
}

export async function loadCardgenConfig(paths, domainsJson, dominionsJson) {
  let raw = {}
  try {
    raw = await readJson(paths.cardgen)
  } catch {
    console.warn(`No cardgen.json at ${paths.cardgen} — using defaults from domains.json`)
  }

  const config = defaultCardgenConfig(domainsJson, raw)

  if (!config.world.title && dominionsJson?.title) {
    config.world.title = dominionsJson.title
  }
  if (!config.world.description && dominionsJson?.description) {
    config.world.description = dominionsJson.description
  }

  return config
}

export async function loadProjectContext(projectId, paths) {
  const [cardsJson, domainsJson, keywordsJson, dominionsJson, raritiesJson] = await Promise.all([
    readJson(paths.gameCards),
    readJson(paths.domains),
    readJson(paths.keywords),
    readJson(paths.dominions).catch(() => ({ title: '', description: '' })),
    readJson(paths.rarities).catch(() => null),
  ])

  const cardgen = await loadCardgenConfig(paths, domainsJson, dominionsJson)

  const cards = cardsJson.cards ?? []
  const domains = domainsJson.domains ?? []
  const keywordsGlossary = keywordsJson.keywords_glossary ?? {}

  const domainIds = domains.map((d) => d.id)
  const existingSlugs = new Set(cards.map((c) => c.slug))
  const existingTitles = new Set(cards.map((c) => c.title?.toLowerCase()))
  const nextIndexByDomain = Object.fromEntries(
    domainIds.map((id) => [id, maxCardIndexForDomain(cards, id) + 1]),
  )

  const exampleCount = cardgen.generation.exampleCardsPerDomain
  const examplesByDomain = Object.fromEntries(
    domainIds.map((id) => [
      id,
      cards.filter((c) => c.domain === id).slice(0, exampleCount),
    ]),
  )

  return {
    projectId,
    cards,
    domains,
    domainIds,
    cardgen,
    keywordsGlossary,
    raritiesJson,
    dominions: dominionsJson,
    existingSlugs,
    existingTitles,
    nextIndexByDomain,
    examplesByDomain,
  }
}
