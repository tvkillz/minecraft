import { projectPaths, resolveProjectId } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { buildContentManifest } from '../lib/buildManifest.js'
import { ensureDir, parseArgs, writeJsonFile } from '../lib/io.js'

export async function runManifest(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const paths = projectPaths(projectId)
  const ctx = await loadProjectContext(projectId, paths)
  const manifest = buildContentManifest(ctx)

  await ensureDir(paths.stagingRoot)
  await writeJsonFile(paths.stagingManifest, manifest)

  console.log(`[contentgen] Wrote ${paths.stagingManifest}`)
  console.log(`  Generated assets: ${manifest.assets.length}`)
  console.log(`  Showcase cards (cardgen): ${manifest.showcaseCards.length}`)
  console.log(`\nKinds:`)
  const byKind = {}
  for (const a of manifest.assets) {
    byKind[a.kind] = (byKind[a.kind] ?? 0) + 1
  }
  for (const [kind, count] of Object.entries(byKind)) {
    console.log(`  ${kind}: ${count}`)
  }
  console.log(`\nNext: npm run generate-images -- --project=${projectId}`)
}
