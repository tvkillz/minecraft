import path from 'node:path'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { buildFullImagePrompt } from '../prompts/buildCardPrompt.js'
import { ensureDir, parseArgs, readJsonFile, writeJsonFile } from '../lib/io.js'

/**
 * Export a manifest for an external image platform (Midjourney, Flux, etc.).
 * Each entry includes slug, output path, prompt, and notes.
 */
export async function runImageManifest(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const file = flags.file
  if (!file) {
    console.error('Usage: npm run image-manifest -- --file=projects/voidborn/game/_staging/cards/approved/kronos_batch_06-15.json')
    process.exit(1)
  }

  const abs = path.resolve(file)
  const batch = await readJsonFile(abs)
  const projectId = batch.meta?.project || flags.project || resolveProjectId()
  const paths = projectPaths(projectId)
  const ctx = await loadProjectContext(projectId, paths)

  if (batch.meta?.status !== 'approved') {
    console.warn('Warning: batch status is not "approved" — run approve first if this is intentional.')
  }

  const entries = (batch.cards ?? []).map((card) => {
    const slug = card.slug
    const domain = card.domain
    return {
      slug,
      title: card.title,
      domain,
      aspect_ratio: ctx.cardgen.image.aspectRatio,
      prompt: buildFullImagePrompt(card, ctx),
      image_notes: card.image_notes ?? '',
      negative_prompt:
        'text, watermark, logo, card frame, border, UI, split image, collage, blurry, low quality',
      output_filename: `${slug}.png`,
      staging_path: `game/_staging/images/${slug}.png`,
      final_asset_path: `assets/cards/${domain}/${slug}.png`,
      cards_json_path: `cards/${domain}/${slug}.png`,
    }
  })

  const manifest = {
    meta: {
      project: projectId,
      source_batch: path.basename(abs),
      created_at: new Date().toISOString(),
      purpose: 'Feed prompts to your image platform; save results to game/_staging/images/{slug}.png',
      entry_count: entries.length,
    },
    entries,
  }

  await ensureDir(paths.stagingManifests)
  const base = path.basename(abs, '.json')
  const outFile = path.join(paths.stagingManifests, `${base}.image-manifest.json`)
  await writeJsonFile(outFile, manifest)

  console.log(`Image manifest (${entries.length} entries) → ${outFile}`)
  console.log(`Place generated PNGs in: ${paths.stagingImages}/`)
  console.log('Then: npm run apply -- --file=' + abs)
}
