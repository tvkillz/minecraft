import path from 'node:path'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { listJsonFiles, parseArgs } from '../lib/io.js'
import { listRoundIds, loadRound } from '../lib/round.js'

export async function runList(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const paths = projectPaths(projectId)

  const draft = await listJsonFiles(paths.stagingCards)
  const approved = await listJsonFiles(paths.stagingApproved)
  const rounds = await listRoundIds(paths)

  console.log(`Project: ${projectId}`)
  console.log(`Config: ${paths.cardgen}`)

  console.log(`\nRounds (${paths.stagingRounds}):`)
  if (!rounds.length) console.log('  (none)')
  else {
    for (const id of rounds) {
      try {
        const { manifest } = await loadRound(paths, id)
        const m = manifest.meta
        console.log(`  ${id}  [${m?.status}]  ${m?.total_cards} cards`)
      } catch {
        console.log(`  ${id}`)
      }
    }
  }

  console.log(`\nLegacy draft batches (${paths.stagingCards}):`)
  if (!draft.length) console.log('  (none)')
  else draft.forEach((f) => console.log(`  ${path.basename(f)}`))

  console.log(`\nLegacy approved batches (${paths.stagingApproved}):`)
  if (!approved.length) console.log('  (none)')
  else approved.forEach((f) => console.log(`  ${path.basename(f)}`))
}
