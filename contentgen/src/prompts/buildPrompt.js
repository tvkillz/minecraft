function domainFlavor(ctx, domainId) {
  if (!domainId) return ''
  const d = ctx.contentgen.domains[domainId]
  if (!d) return ''
  return [d.visualIdentity, d.palette ? `Palette: ${d.palette}.` : '', d.mood ? `Mood: ${d.mood}.` : '']
    .filter(Boolean)
    .join(' ')
}

function baseParts(ctx) {
  const { contentgen } = ctx
  return [contentgen.style.aesthetic, contentgen.style.avoid ? `Avoid: ${contentgen.style.avoid}.` : '']
}

export function buildScenePrompt(asset, ctx) {
  const { contentgen } = ctx
  const body = asset.notes?.trim() || asset.title || asset.slug
  return [
    contentgen.image.promptPrefix,
    body,
    domainFlavor(ctx, asset.domain),
    ...baseParts(ctx),
    contentgen.image.promptSuffix,
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildCtaPrompt(feature, ctx) {
  const { contentgen } = ctx
  const override = contentgen.cta?.[feature.id]?.prompt
  if (override) {
    return [contentgen.image.promptPrefix, override, contentgen.image.ctaSuffix].join(' ')
  }
  return [
    contentgen.image.promptPrefix,
    `${feature.title}: ${feature.description}`,
    feature.glowColor ? `Accent glow color ${feature.glowColor}.` : '',
    ...baseParts(ctx),
    contentgen.image.ctaSuffix,
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildGamemodelPrompt(pillar, ctx) {
  const { contentgen } = ctx
  const override = contentgen.gamemodel?.[pillar.id]?.prompt
  if (override) {
    return [contentgen.image.promptPrefix, override, contentgen.image.gamemodelSuffix].join(' ')
  }
  return [
    contentgen.image.promptPrefix,
    `${pillar.title}: ${pillar.description}`,
    pillar.glowColor ? `Accent glow color ${pillar.glowColor}.` : '',
    ...baseParts(ctx),
    contentgen.image.gamemodelSuffix,
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildCardTypePrompt(typeId, ctx) {
  const { contentgen } = ctx
  const spec = contentgen.cardTypes?.[typeId] ?? { label: typeId }
  const override = spec.prompt
  if (override) {
    return [override, contentgen.image.cardTypeSuffix].join(' ')
  }
  return [
    `Rarity emblem for ${spec.label} cards in a trading card game.`,
    spec.accent ? `Primary accent color ${spec.accent}.` : '',
    contentgen.style.aesthetic,
    contentgen.image.cardTypeSuffix,
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildPromptForAsset(asset, ctx) {
  switch (asset.kind) {
    case 'domain':
    case 'city':
      return buildScenePrompt(asset, ctx)
    case 'cta':
      return asset.prompt ?? buildCtaPrompt(asset.source ?? asset, ctx)
    case 'gamemodel':
      return asset.prompt ?? buildGamemodelPrompt(asset.source ?? asset, ctx)
    case 'card_type':
      return buildCardTypePrompt(asset.id, ctx)
    default:
      return asset.prompt ?? asset.title ?? ''
  }
}
