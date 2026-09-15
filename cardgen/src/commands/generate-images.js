import path from 'node:path'
import { writeFile, access } from 'node:fs/promises'
import sharp from 'sharp'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { getGeminiImageModelId } from '../config/gemini.js'
import { buildFullImagePrompt } from '../prompts/buildCardPrompt.js'
import { generateCardImage } from '../lib/geminiImage.js'
import { ensureDir, parseArgs, readJsonFile } from '../lib/io.js'

async function fileExists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

export async function runGenerateImages(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const file = flags.file
  const slug = flags.slug
  const force = Boolean(flags.force)
  const dryRun = Boolean(flags['dry-run'])

  if (!file) {
    console.error('Usage: npm run generate-images -- --file=.../kronos_batch_08-20.json [--slug=...] [--force]')
    console.error('       npm run generate-images-round -- --round=round_YYYYMMDD_08-20')
    process.exit(1)
  }

  const abs = path.resolve(file)
  const batch = await readJsonFile(abs)
  const projectId = batch.meta?.project || flags.project || resolveProjectId()
  const paths = projectPaths(projectId)
  const ctx = await loadProjectContext(projectId, paths)

  let cards = batch.cards ?? []
  if (slug) {
    cards = cards.filter((c) => c.slug === slug)
    if (!cards.length) {
      console.error(`Slug "${slug}" not found in batch`)
      process.exit(1)
    }
  }

  await ensureDir(paths.stagingImages)

  const model = getGeminiImageModelId()
  console.log(`Image model: ${model}`)
  console.log(`Output: ${paths.stagingImages}/`)
  console.log(`Cards: ${cards.length}\n`)

  const results = []

  for (const card of cards) {
    const outPath = path.join(paths.stagingImages, `${card.slug}.png`)
    if (!force && (await fileExists(outPath))) {
      console.log(`Skip (exists): ${card.slug}`)
      results.push({ slug: card.slug, status: 'skipped', path: outPath })
      continue
    }

    const prompt = buildFullImagePrompt(card, ctx)
    if (dryRun) {
      console.log(`[dry-run] ${card.slug}`)
      console.log(`  ${prompt.slice(0, 120)}…`)
      results.push({ slug: card.slug, status: 'dry-run' })
      continue
    }

    console.log(`Generating: ${card.title} (${card.slug})…`)
    try {
      const jpegBuffer = await generateCardImage(prompt)
      const pngBuffer = await sharp(jpegBuffer).png().toBuffer()
      await writeFile(outPath, pngBuffer)
      console.log(`  ✓ ${outPath} (${pngBuffer.length} bytes)`)
      results.push({ slug: card.slug, status: 'ok', path: outPath, bytes: pngBuffer.length })
    } catch (err) {
      console.error(`  ✗ ${card.slug}: ${err.message}`)
      results.push({ slug: card.slug, status: 'error', error: err.message })
    }
  }

  const ok = results.filter((r) => r.status === 'ok').length
  const failed = results.filter((r) => r.status === 'error').length
  console.log(`\nImages: ${ok} generated, ${failed} failed, ${results.length - ok - failed} skipped`)

  if (ok > 0) {
    console.log(`\nNext: npm run apply -- --file=${abs}`)
  }
  if (failed > 0) process.exit(1)
}
