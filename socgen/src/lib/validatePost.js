const URL_RE = /https?:\/\/[^\s]+/i
const DISCORD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/
const DISCORD_BOLD_RE = /\*\*[^*]+\*\*/

/** @param {object} post — mergePostBundle shape */
export function validatePost(post, ctx) {
  const issues = []
  const { socialgen } = ctx
  const ig = post.instagram ?? {}
  const fb = post.facebook ?? {}
  const dc = post.discord ?? {}

  if (!ig.header?.trim()) issues.push('instagram.header missing')
  if (!ig.caption?.trim()) issues.push('instagram.caption missing')
  if (!Array.isArray(ig.hashtags) || ig.hashtags.length < socialgen.platforms.instagram.minHashtags) {
    issues.push(
      `instagram.hashtags: need at least ${socialgen.platforms.instagram.minHashtags} (got ${ig.hashtags?.length ?? 0})`,
    )
  }
  if (ig.hashtags?.length > socialgen.platforms.instagram.maxHashtags) {
    issues.push(`instagram.hashtags: max ${socialgen.platforms.instagram.maxHashtags}`)
  }
  for (const tag of ig.hashtags ?? []) {
    if (!tag.startsWith('#')) issues.push(`instagram hashtag must start with #: ${tag}`)
  }
  if (URL_RE.test(ig.caption ?? '')) {
    issues.push('instagram.caption must not contain URLs — use header link-in-bio note')
  }
  if (!/link in bio|шапк|bio/i.test(ig.header ?? '') && !/🔗/.test(ig.header ?? '')) {
    issues.push('instagram.header should include link-in-bio note (🔗 Link in bio …)')
  }
  if (!ig.alt_text?.trim()) issues.push('instagram.alt_text missing')

  if (!fb.body?.trim()) issues.push('facebook.body missing')
  if ((fb.body?.length ?? 0) < socialgen.platforms.facebook.minBodyLength) {
    issues.push(
      `facebook.body too short (${fb.body?.length ?? 0} chars, min ${socialgen.platforms.facebook.minBodyLength})`,
    )
  }
  if (!fb.link_url?.trim() || !URL_RE.test(fb.link_url)) {
    issues.push('facebook.link_url must be a valid URL')
  }
  if (!fb.link_cta?.trim()) issues.push('facebook.link_cta missing')
  const fbCombined = `${fb.body}\n${fb.link_cta}\n${fb.link_url}`
  if (!fbCombined.trim().endsWith(fb.link_url.trim())) {
    issues.push('facebook: link_url should appear at the very end of the post')
  }

  if (!dc.content?.trim()) issues.push('discord.content missing')
  if (!DISCORD_BOLD_RE.test(dc.content ?? '')) {
    issues.push('discord.content must include **bold** markdown')
  }
  if (!/^\s*[-*]\s/m.test(dc.content ?? '') && !/\n[-*]\s/m.test(dc.content ?? '')) {
    issues.push('discord.content must include a markdown bullet list (- or *)')
  }
  if (!DISCORD_LINK_RE.test(dc.content ?? '')) {
    issues.push('discord.content must include a clickable markdown link [text](url)')
  }

  const imgPrompt = post.meta?.image?.prompt
  if (!imgPrompt?.trim()) issues.push('meta.image.prompt missing')

  return { ok: issues.length === 0, issues }
}

export function applyValidationMeta(meta, validation) {
  meta.validation = {
    ok: validation.ok,
    issues: validation.issues,
    validated_at: new Date().toISOString(),
  }
  meta.status = validation.ok ? 'validated' : 'draft'
  return meta
}
