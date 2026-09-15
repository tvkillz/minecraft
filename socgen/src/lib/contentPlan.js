import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { DEFAULT_CAMPAIGN_COUNTS } from './campaignPlans.js'

function postSortKey(id) {
  const n = Number(id.replace(/^post/, ''))
  return Number.isFinite(n) ? n : 9999
}

async function loadStagingPosts(stagingRoot) {
  let entries = []
  try {
    entries = await readdir(stagingRoot)
  } catch {
    return []
  }

  const posts = []
  for (const id of entries.filter((e) => /^post\d+$/.test(e)).sort((a, b) => postSortKey(a) - postSortKey(b))) {
    try {
      const meta = JSON.parse(await readFile(path.join(stagingRoot, id, 'meta.json'), 'utf8'))
      posts.push({ id, meta })
    } catch {
      /* skip incomplete folders */
    }
  }
  return posts
}

function sectionLabel(meta) {
  const kind = meta.campaign?.kind ?? meta.template
  const angle = meta.campaign?.angle
  if (kind === 'welcome') return 'Welcome'
  if (kind === 'domain') {
    const domain = meta.campaign?.domain ?? meta.subject?.domain ?? '?'
    return `Domain — ${domain} (${angle ?? 'spotlight'})`
  }
  if (kind === 'market') return `Market — ${(angle ?? 'feature').replace(/_/g, ' ')}`
  if (kind === 'card' || meta.template === 'card-spotlight') {
    return `Card — ${meta.subject?.card ?? meta.campaign?.card ?? '?'}`
  }
  return kind ?? 'general'
}

function titleLine(meta) {
  return (
    meta.image?.subject_line ||
    meta.subject?.card ||
    meta.brief?.slice(0, 60) ||
    meta.id
  )
}

function imageNote(meta) {
  const mode = meta.image?.render_mode_used ?? meta.image?.mode ?? '—'
  const logo = meta.image?.use_brand_reference ? 'logo in AI art' : mode === 'composite' ? 'gamelogo top-left + city + card' : 'no logo (city/domain/CTA refs)'
  const bg = meta.image?.background_title ?? meta.image?.background_asset ?? '—'
  return `${mode} · ${logo} · bg: ${bg}`
}

function groupPosts(posts) {
  const order = ['Welcome', 'Domain', 'Market', 'Card']
  const groups = { Welcome: [], Domain: [], Market: [], Card: [], Other: [] }

  for (const p of posts) {
    const label = sectionLabel(p.meta)
    if (label.startsWith('Welcome')) groups.Welcome.push({ ...p, label })
    else if (label.startsWith('Domain')) groups.Domain.push({ ...p, label })
    else if (label.startsWith('Market')) groups.Market.push({ ...p, label })
    else if (label.startsWith('Card')) groups.Card.push({ ...p, label })
    else groups.Other.push({ ...p, label })
  }

  return order
    .filter((k) => groups[k].length)
    .map((k) => ({ name: k, items: groups[k] }))
    .concat(groups.Other.length ? [{ name: 'Other', items: groups.Other }] : [])
}

function countByKind(posts) {
  const counts = { welcome: 0, domain: 0, market: 0, card: 0 }
  for (const { meta } of posts) {
    const kind = meta.campaign?.kind ?? (meta.template === 'card-spotlight' ? 'card' : meta.template)
    if (kind === 'welcome') counts.welcome++
    else if (kind === 'domain') counts.domain++
    else if (kind === 'market') counts.market++
    else if (kind === 'card' || meta.template === 'card-spotlight') counts.card++
  }
  return counts
}

function gapsLine(counts) {
  const target = DEFAULT_CAMPAIGN_COUNTS
  const parts = []
  if (counts.welcome < target.welcome) parts.push(`welcome ${counts.welcome}/${target.welcome}`)
  if (counts.domain < target.domain) parts.push(`domain ${counts.domain}/${target.domain}`)
  if (counts.market < target.market) parts.push(`market ${counts.market}/${target.market}`)
  if (counts.card < target.cards) parts.push(`cards ${counts.card}/${target.cards}`)
  return parts.length ? parts.join(' · ') : 'All target sections filled'
}

/**
 * Write or refresh `_staging/content-plan.md` from current post folders.
 */
export async function writeContentPlan(stagingRoot, { siteUrl = 'https://voidborn.fun' } = {}) {
  const posts = await loadStagingPosts(stagingRoot)
  const counts = countByKind(posts)
  const groups = groupPosts(posts)
  const total = posts.length
  const rendered = posts.filter((p) => p.meta.status === 'rendered').length
  const now = new Date().toISOString().slice(0, 10)

  let md = `# VOIDBORN — Social content plan

> Staging overview · updated ${now}  
> Site: ${siteUrl}  
> **${total} posts** in \`_staging/\` (${rendered} rendered)

---

## Campaign target

| Section | Target | Staged | Image approach |
|---------|--------|--------|----------------|
| Welcome | ${DEFAULT_CAMPAIGN_COUNTS.welcome} | ${counts.welcome} | Gemini AI · random city ref · **no logo** |
| Domain | ${DEFAULT_CAMPAIGN_COUNTS.domain} (2× per realm) | ${counts.domain} | Gemini AI · domain + city ref · **no logo** |
| Market | ${DEFAULT_CAMPAIGN_COUNTS.market} | ${counts.market} | Gemini AI · CTA asset ref · **no logo** |
| Card spotlight | ${DEFAULT_CAMPAIGN_COUNTS.cards} | ${counts.card} | **Composite** · \`gamelogo.png\` top-left · random realm city · full card art |

**Gap check:** ${gapsLine(counts)}

---

## Realms (domain posts)

| Realm | Lore post | Playstyle post |
|-------|-----------|----------------|
| **Kronos** (earth / stone) | Culture, bastions, siege & tanks | Deck identity, curve, ranked tips |
| **Thalassa** (water / abyss) | Drowned depths, coral ruins | Freeze, control, sirens & undead |
| **Infernus** (fire / forge) | Volcanic hellscape, demons | Burn, aggression, forge synergies |
| **Anemos** (air / storm) | Sky sanctuaries, wind spirits | Flying units, tempo, storm magic |

---

## Market posts (Portal)

| Angle | Focus |
|-------|-------|
| Surgical shopping | Browse listings, filter catalog, buy with credits |
| Cash the excess | List duplicates, earn credits, cancel anytime |
| Grow your arsenal | Collection depth via packs + market |
| Crack the vaults | Sealed products, rip & chase |
| Chase the apex | Rare / epic / foil hunt |

---

## Per-post checklist

Each \`postN/\` folder contains:

- \`post.json\` — Instagram, Facebook, Discord copy
- \`meta.json\` — brief, status, image pipeline
- \`post.txt\` — all networks in one paste file
- \`image.png\` — square 1080×1080 (after \`generate-images\`)

**Workflow:** validate → approve (cards log to \`card-log.json\`) → generate-images → publish → \`posts/{slug}/\`

---

## Staged posts

`

  for (const group of groups) {
    md += `### ${group.name} (${group.items.length})\n\n`
    md += '| Post | Status | Title / subject | Image |\n'
    md += '|------|--------|-----------------|-------|\n'
    for (const { id, meta, label } of group.items) {
      const status = meta.status ?? 'draft'
      const title = titleLine(meta).replace(/\|/g, '\\|')
      const img = imageNote(meta).replace(/\|/g, '\\|')
      md += `| [\`${id}/\`](./${id}/) | ${status} | ${title} | ${img} |\n`
    }
    md += '\n'
  }

  md += `---

## Suggested publish order

1. **Welcome** (1–2) — hook new followers  
2. **Domain lore** (Kronos → Thalassa → Infernus → Anemos) — world building  
3. **Card spotlights** — mix realms, 2–3× per week  
4. **Domain playstyle** — deck-building depth  
5. **Market** — once players know the game loop  
6. **More cards** — ongoing cadence  

---

## Commands (socgen)

\`\`\`bash
cd socgen
npm run list
npm run test-card                    # one card composite for layout review
npm run full-campaign -- --clean     # regenerate full plan
npm run generate-images -- --post=postN
npm run publish -- --post=postN
npm run export
\`\`\`
`

  const outPath = path.join(stagingRoot, 'content-plan.md')
  await writeFile(outPath, md, 'utf8')
  return outPath
}
