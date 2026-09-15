import { stripLogoReferences } from '../lib/postFiles.js'

/**
 * @param {object} opts
 * @param {string} opts.brief
 * @param {string} [opts.template]
 * @param {object} [opts.card]
 * @param {string} [opts.domain]
 * @param {object} opts.ctx — loadSocialContext result
 */
export function buildPostGenerationPrompt({ brief, template = 'general', card, domain, ctx }) {
  const { socialgen, cardgen, manifest, descriptions } = ctx
  const siteUrl = socialgen.siteUrl || manifest.siteUrl || 'https://example.com'
  const domainMeta = domain ? cardgen.domainById[domain] : null

  const heroHeadline = descriptions.hero?.headline?.join(' ') ?? ''
  const heroSub = descriptions.hero?.subheadline ?? ''

  let subjectBlock = `Creative brief: ${brief}`
  if (card) {
    subjectBlock = `## Subject card
- title: ${card.title}
- slug: ${card.slug}
- domain: ${card.domain}
- role: ${card.role}
- stats: ${card.stats.mana} mana, ${card.stats.attack}/${card.stats.health}
- keywords: ${(card.keywords ?? []).join(', ') || 'none'}
- ability: ${card.ability.name} — ${card.ability.text}
- art path: ${card.path}

Creative brief: ${brief}`
  } else if (domain && domainMeta) {
    subjectBlock = `## Subject domain
- id: ${domain}
- label: ${domainMeta.label}
- visual identity: ${domainMeta.visualIdentity}
- flavor: ${domainMeta.flavorNotes}

Creative brief: ${brief}`
  }

  const defaultTags = socialgen.platforms.instagram.defaultHashtags.join(' ')

  return `You are the social media copywriter for ${cardgen.gameTitle}, ${cardgen.gamePitch}.

## Brand voice
${socialgen.brandVoice}
Audience: ${socialgen.audience}
Site URL (for links): ${siteUrl}

## World context
${cardgen.world.title}
${cardgen.world.description}

## Hero copy reference
${heroHeadline}
${heroSub}

Template: ${template}

${subjectBlock}

## Platform rules (STRICT)

### Instagram
- Put links ONLY in \`header\` (the “шапка” / top block) as a link-in-bio note like: "🔗 Link in bio → play free"
- \`caption\` must NOT contain http/https URLs
- Add emojis naturally
- Include ${socialgen.platforms.instagram.minHashtags}–${socialgen.platforms.instagram.maxHashtags} hashtags in the hashtags array
- Suggested brand tags: ${defaultTags || '(none configured)'}

### Facebook
- \`body\` must be long-form (at least ${socialgen.platforms.facebook.minBodyLength} characters): lore, card story, community question
- End with \`link_cta\` then put full URL in \`link_url\` (${siteUrl} or a deep path)
- Emojis sparingly

### Discord
- Use Markdown: **bold** for headlines, bullet lists with - or *
- Include exactly one clickable markdown link: [Play VOIDBORN](${siteUrl}) or similar
- Keep scannable; emojis ok

### Image (stored in meta.json only — not in post.json)
- \`prompt\`: square 1:1 social promo scene; NO text, NO logo, NO watermark in the generated image
- \`reference_assets\`: 1–3 project asset paths for style/subject — use card art or domain scenes, NEVER brand/gamelogo.png or logos
- \`subject_line\`: card title for composite overlay (Cinzel font in production)

Do not invent game mechanics not present in the card/subject data.
Return JSON matching the schema.`
}

export function buildFullImagePrompt({ meta }, ctx) {
  const suffix = ctx.socialgen.image.promptSuffix
  const base = meta?.image?.prompt?.trim() ?? ''
  const refs = stripLogoReferences(meta?.image?.reference_assets ?? [])
    .map((r) => `- ${r}`)
    .join('\n')
  const refBlock = refs ? `\nReference assets from the project (style/mood only, no logos):\n${refs}` : ''
  return `${base}${refBlock}. ${suffix}`.trim()
}
