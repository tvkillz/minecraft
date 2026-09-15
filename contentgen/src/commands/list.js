import path from 'node:path'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { buildContentManifest } from '../lib/buildManifest.js'
import { fileExists, parseArgs, readJsonFile } from '../lib/io.js'

function statusIcon(ok) {
  return ok ? '✓' : '○'
}

export async function runList(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const paths = projectPaths(projectId)

  const ctx = await loadProjectContext(projectId, paths)
  const manifest = (await fileExists(paths.stagingManifest))
    ? await readJsonFile(paths.stagingManifest)
    : buildContentManifest(ctx)

  console.log(`[contentgen] ${projectId} — landing asset status\n`)

  const groups = {}
  for (const asset of manifest.assets ?? []) {
    groups[asset.kind] ??= []
    groups[asset.kind].push(asset)
  }

  for (const [kind, items] of Object.entries(groups)) {
    console.log(`${kind} (${items.length})`)
    for (const asset of items) {
      const dest = path.join(paths.assets, asset.path)
      const staged = path.join(paths.stagingImages, asset.stagingFile)
      const hasDest = await fileExists(dest)
      const hasStaged = await fileExists(staged)
      const stagedNote = hasStaged ? ' staged' : ''
      console.log(`  ${statusIcon(hasDest)} ${asset.path}${hasDest ? '' : stagedNote}`)
    }
    console.log('')
  }

  console.log(`showcase_cards (${manifest.showcaseCards?.length ?? 0}) — cardgen + FRONTEND_SHOWCASE_ONLY`)
  for (const ref of manifest.showcaseCards ?? []) {
    const card = (ctx.cardsJson.cards ?? []).find((c) => c.slug === ref.id)
    const cardPath = card?.path ?? ref.path
    const resolved = cardPath.includes('{domain}')
      ? null
      : path.join(paths.assets, cardPath)
    const hasDest = resolved ? await fileExists(resolved) : false
    const inCards = Boolean(card)
    console.log(
      `  ${statusIcon(hasDest)} ${ref.id}${inCards ? '' : ' (missing cards.json entry)'}`,
    )
  }

  console.log('\nmanual (brand)')
  for (const rel of manifest.manualAssets?.[0]?.paths ?? []) {
    const hasDest = await fileExists(path.join(paths.assets, rel))
    console.log(`  ${statusIcon(hasDest)} ${rel}`)
  }
}
