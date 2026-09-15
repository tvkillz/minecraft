import { resolveProjectId } from '../config/paths.js'
import { projectPaths } from '../config/paths.js'
import { generateShowcaseBatch } from '../lib/generateShowcaseBatch.js'
import { parseArgs } from '../lib/io.js'

export async function runGenerateShowcase(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const force = Boolean(flags.force)

  const { outFile } = await generateShowcaseBatch(projectId, { force })

  console.log('\nNext:')
  console.log(`  npm run validate -- --file=${outFile}`)
  console.log(`  npm run approve -- --file=${outFile}`)
  console.log(`  npm run generate-images -- --file=<approved-path>`)
  console.log(`  npm run apply -- --file=<approved-path>`)
  console.log('\nOr images only (cards already in cards.json):')
  console.log(`  npm run generate-images-showcase -- --project=${projectId}`)
}
