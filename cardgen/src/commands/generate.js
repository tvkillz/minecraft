import { resolveProjectId } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { projectPaths } from '../config/paths.js'
import { generateCardBatch } from '../lib/generateBatch.js'
import { parseArgs } from '../lib/io.js'

export async function runGenerate(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const domain = flags.domain
  const count = Number(flags.count ?? 10)
  const startIndex = flags.from != null ? Number(flags.from) : null

  if (!domain) {
    console.error('Usage: npm run generate -- --domain=kronos [--count=10] [--from=8] [--project=voidborn]')
    console.error('       npm run generate-round -- --per-domain=13   # balanced all domains')
    console.error('       npm run generate-round -- --total=52        # must divide by domain count')
    process.exit(1)
  }

  const paths = projectPaths(projectId)
  const ctx = await loadProjectContext(projectId, paths)
  const maxBatch = ctx.cardgen.generation.maxBatchPerDomain

  if (!Number.isInteger(count) || count < 1 || count > maxBatch) {
    console.error(`--count must be an integer between 1 and ${maxBatch}`)
    process.exit(1)
  }

  const from = startIndex ?? ctx.nextIndexByDomain[domain]

  await generateCardBatch({ projectId, domain, count, from })

  console.log('Next: npm run validate -- --file=<path>')
  console.log('      npm run approve -- --file=<path>')
  console.log('      npm run generate-images -- --file=<approved-path>')
}

export { runGenerateRound, runGenerateDomains } from './round.js'
