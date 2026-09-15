import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { createGeminiImageClient, getGeminiImageModelId } from '../config/gemini.js'
import { buildFullImagePrompt } from '../prompts/buildPostPrompt.js'
import { stripLogoReferences } from './postFiles.js'
import { BRAND_LOGO_HEADER } from './brandAssets.js'
import { resolveAssetPath } from './loadSocialContext.js'
import { renderCompositeImage, normalizeSquareImage } from './renderComposite.js'

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

function parseRetryMs(err) {
  const msg = String(err.message ?? err)
  const delayMatch = msg.match(/retry in ([\d.]+)s/i)
  if (delayMatch) return Math.ceil(Number(delayMatch[1]) * 1000) + 500
  const retryable = /503|429|high demand|rate|quota|unavailable/i.test(msg)
  return retryable ? null : 0
}

function extractImageBuffer(interaction) {
  if (interaction.output_image?.data) {
    return Buffer.from(interaction.output_image.data, 'base64')
  }
  for (const step of interaction.steps ?? []) {
    if (step.type !== 'model_output') continue
    for (const block of step.content ?? []) {
      if (block.type === 'image' && block.data) {
        return Buffer.from(block.data, 'base64')
      }
    }
  }
  for (const output of interaction.outputs ?? []) {
    if (output.type === 'image' && output.data) {
      return Buffer.from(output.data, 'base64')
    }
  }
  return null
}

async function loadReferenceParts(ctx, relPaths, { allowBrand = false } = {}) {
  const parts = []
  let paths = relPaths ?? []
  if (!allowBrand) paths = stripLogoReferences(paths)

  for (const rel of paths) {
    const abs = resolveAssetPath(ctx.paths, rel)
    if (!abs) continue
    try {
      const buf = await readFile(abs)
      const ext = path.extname(abs).toLowerCase()
      if (ext === '.svg') {
        const raster = await sharp(buf).png().toBuffer()
        parts.push({ inlineData: { mimeType: 'image/png', data: raster.toString('base64') } })
      } else {
        parts.push({
          inlineData: { mimeType: MIME[ext] ?? 'image/png', data: buf.toString('base64') },
        })
      }
    } catch {
      console.warn(`  Reference asset not found: ${rel}`)
    }
  }
  return parts
}

function promoReferencePaths(meta) {
  const refs = [...(meta.image?.reference_assets ?? [])]
  if (meta.image?.background_asset && !refs.includes(meta.image.background_asset)) {
    refs.push(meta.image.background_asset)
  }
  if (meta.image?.use_brand_reference && !refs.includes(BRAND_LOGO_HEADER)) {
    refs.unshift(BRAND_LOGO_HEADER)
  }
  return refs
}

const NO_LOGO_RULE =
  'Do NOT render any logo, watermark, brand mark, or readable text in the image. No corner badges.'

const PROMO_LOGO_RULE =
  'Incorporate the VOIDBORN logo from the attached header reference prominently (top center). ' +
  'Use the city/landscape reference for atmosphere and palette. ' +
  'Square 1:1 promo — cinematic dark fantasy, no other readable text or watermarks.'

async function runGeminiImageRequest(ctx, meta, { allowBrand = false, promoLogo = false } = {}) {
  const ai = createGeminiImageClient()
  const model = getGeminiImageModelId()
  const refs = promoReferencePaths(meta)
  const basePrompt = buildFullImagePrompt({ meta }, ctx)
  const rule = promoLogo ? PROMO_LOGO_RULE : NO_LOGO_RULE
  const prompt = `${basePrompt}\n${rule}`
  const refParts = await loadReferenceParts(ctx, refs, { allowBrand: allowBrand || promoLogo })

  const instruction =
    refParts.length > 0
      ? promoLogo
        ? `${prompt}\n\nAttached: (1) VOIDBORN logo header — place in composition. (2) City/landscape — mood and background inspiration. Create NEW square promo art.`
        : `${prompt}\n\nAttached references are for palette and mood only — create a NEW square scene. Do not paste logos from references unless instructed.`
      : prompt

  let lastError
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      let buffer = null

      if (refParts.length > 0) {
        try {
          const result = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [...refParts, { text: instruction }] }],
            config: { responseModalities: ['IMAGE'] },
          })
          const part = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
          if (part?.inlineData?.data) {
            buffer = Buffer.from(part.inlineData.data, 'base64')
          }
        } catch (multimodalErr) {
          console.warn(`  Multimodal image gen unavailable (${multimodalErr.message}) — text-only fallback`)
        }
      }

      if (!buffer) {
        const interaction = await ai.interactions.create({
          model,
          input: instruction,
          response_modalities: ['image'],
        })
        buffer = extractImageBuffer(interaction)
      }

      if (!buffer?.length) throw new Error('Gemini returned no image data')
      const png = await normalizeSquareImage(await sharp(buffer).png().toBuffer())
      return { buffer: png, modeUsed: 'gemini' }
    } catch (err) {
      lastError = err
      const wait = parseRetryMs(err)
      if (wait === 0 || attempt === 4) break
      const delay = wait ?? attempt * 3000
      console.warn(`  Image API busy (attempt ${attempt}/4), retrying in ${Math.round(delay / 1000)}s…`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  throw lastError
}

export async function generateGeminiImage({ post, ctx, card }) {
  if (card) {
    console.warn('  Card post → composite layout (full card art, no crop)')
    return { buffer: await renderCompositeImage({ post, ctx, card }), modeUsed: 'composite' }
  }

  const meta = post.meta
  const promoLogo = Boolean(meta.image?.use_brand_reference)
  return runGeminiImageRequest(ctx, meta, { allowBrand: promoLogo, promoLogo })
}

/**
 * @param {'composite'|'gemini'|'auto'} mode
 */
export async function renderPostImage({ post, ctx, card, mode = 'auto' }) {
  const requested = mode || post.meta.image.mode || 'auto'

  if (card) {
    return {
      buffer: await renderCompositeImage({ post, ctx, card }),
      modeUsed: 'composite',
    }
  }

  if (requested === 'composite') {
    return {
      buffer: await renderCompositeImage({ post, ctx, card }),
      modeUsed: 'composite',
    }
  }

  if (requested === 'gemini') {
    return generateGeminiImage({ post, ctx, card })
  }

  try {
    return await generateGeminiImage({ post, ctx, card })
  } catch (err) {
    console.warn(`  Gemini image failed (${err.message}) — falling back to sharp composite`)
    return {
      buffer: await renderCompositeImage({ post, ctx, card }),
      modeUsed: 'composite',
    }
  }
}
