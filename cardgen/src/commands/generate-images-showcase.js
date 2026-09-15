import path from 'node:path'
import { writeFile, copyFile, access } from 'node:fs/promises'
import sharp from 'sharp'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { loadShowcaseSlugs } from '../lib/showcaseSlugs.js'
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

/** Generate art for landing showcase slugs already present in cards.json. */
export async function runGenerateImagesShowcase(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const slug = flags.slug
  const force = Boolean(flags.force)
  const dryRun = Boolean(flags['dry-run'])

  const paths = projectPaths(projectId)
  const ctx = await loadProjectContext(projectId, paths)
  const showcaseSlugs = await loadShowcaseSlugs(paths)

  const cardsDoc = await readJsonFile(paths.gameCards)
  const bySlug = new Map((cardsDoc.cards ?? []).map((c) => [c.slug, c]))

  let slugs = showcaseSlugs
  if (slug) {
    slugs = showcaseSlugs.filter((s) => s === slug)
    if (!slugs.length) {
      console.error(`Slug "${slug}" is not a landing showcase slug`)
      process.exit(1)
    }
  }

  const cards = slugs
    .map((s) => bySlug.get(s))
    .filter(Boolean)

  const missingMeta = slugs.filter((s) => !bySlug.has(s))
  if (missingMeta.length) {
    console.error(`Missing from cards.json (${missingMeta.length}):`)
    missingMeta.forEach((s) => console.error(`  ${s}`))
    console.error('\nRun: npm run generate-showcase -- --project=' + projectId)
    process.exit(1)
  }

  await ensureDir(paths.stagingImages)

  const model = getGeminiImageModelId()
  console.log(`Image model: ${model}`)
  console.log(`Showcase cards: ${cards.length}\n`)

  for (const card of cards) {
    const staged = path.join(paths.stagingImages, `${card.slug}.png`)
    const dest = path.join(paths.assets, card.path)

    if (!force && (await fileExists(dest))) {
      console.log(`Skip (exists): ${card.path}`)
      continue
    }

    const draft = {
      ...card,
      image_prompt: card.image_prompt || card.notes || `${card.title}, ${card.domain} ward spirit`,
      image_notes: card.notes ?? '',
    }
    const prompt = buildFullImagePrompt(draft, ctx)

    if (dryRun) {
      console.log(`[dry-run] ${card.slug}`)
      console.log(`  → ${card.path}`)
      continue
    }

    console.log(`Generating: ${card.title} (${card.slug})…`)
    try {
      const jpegBuffer = await generateCardImage(prompt)
      const pngBuffer = await sharp(jpegBuffer).png().toBuffer()
      await writeFile(staged, pngBuffer)
      await ensureDir(path.dirname(dest))
      await copyFile(staged, dest)
      console.log(`  ✓ ${dest}`)
    } catch (err) {
      console.error(`  ✗ ${card.slug}: ${err.message}`)
    }
  }

  console.log('\nNext: PROJECT=' + projectId + ' npm run compile  (from frontend/)')
}
