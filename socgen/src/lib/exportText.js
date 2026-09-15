export function formatPostText(post, { postId = '', title = '' } = {}) {
  const ig = post.instagram ?? {}
  const fb = post.facebook ?? {}
  const dc = post.discord ?? {}
  const tags = (ig.hashtags ?? []).join(' ')
  const header = title || postId ? `# ${title || postId}\n\n` : ''

  return `${header}=== INSTAGRAM ===

${ig.header ?? ''}

${ig.caption ?? ''}

${tags}

Alt text: ${ig.alt_text ?? ''}

=== FACEBOOK ===

${fb.body ?? ''}

${fb.link_cta ?? ''}
${fb.link_url ?? ''}

=== DISCORD ===

${dc.content ?? ''}
`.trimEnd() + '\n'
}
