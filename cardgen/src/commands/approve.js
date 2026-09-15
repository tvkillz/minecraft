import path from 'node:path'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { parseArgs, readJsonFile, moveToApproved, writeJsonFile } from '../lib/io.js'

export async function runApprove(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const file = flags.file
  if (!file) {
    console.error('Usage: npm run approve -- --file=projects/voidborn/game/_staging/cards/kronos_batch_06-15.json')
    process.exit(1)
  }

  const abs = path.resolve(file)
  const batch = await readJsonFile(abs)
  const projectId = batch.meta?.project || flags.project || resolveProjectId()
  const paths = projectPaths(projectId)

  batch.meta = {
    ...batch.meta,
    status: 'approved',
    approved_at: new Date().toISOString(),
  }

  const dest = await moveToApproved(abs, paths.stagingApproved)
  await writeJsonFile(dest, batch)

  console.log(`Approved batch → ${dest}`)
  console.log('Next: npm run image-manifest -- --file=' + dest)
  console.log('      (generate images externally, place PNGs in game/_staging/images/{slug}.png)')
  console.log('      npm run apply -- --file=' + dest)
}
