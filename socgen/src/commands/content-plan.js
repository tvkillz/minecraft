import { projectPaths, resolveProjectId } from '../config/paths.js'
import { resolveStagingRoot, parseArgs } from '../lib/io.js'
import { loadSocialContext } from '../lib/loadSocialContext.js'
import { writeContentPlan } from '../lib/contentPlan.js'

export async function runContentPlan(argv) {
  const { flags } = parseArgs(argv)
  const projectId = flags.project || resolveProjectId(['node', 'cli', ...argv])
  const paths = projectPaths(projectId)
  const stagingRoot = await resolveStagingRoot(paths, flags)
  const ctx = await loadSocialContext(projectId, paths)

  const outPath = await writeContentPlan(stagingRoot, { siteUrl: ctx.socialgen.siteUrl })
  console.log(`Wrote ${outPath}`)
}
