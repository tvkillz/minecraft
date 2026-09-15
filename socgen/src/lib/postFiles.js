import path from 'node:path'
import {
  ensureDir,
  readJsonFile,
  writeJsonFile,
  fileExists,
} from './io.js'
import { postJsonPath, postDir } from '../config/paths.js'

/** @typedef {{ instagram: object, facebook: object, discord: object }} PostContent */

export function metaJsonPath(campaignRoot, postId) {
  return path.join(postDir(campaignRoot, postId), 'meta.json')
}

export async function loadPostBundle(campaignRoot, postId) {
  const contentPath = postJsonPath(campaignRoot, postId)
  const metaPath = metaJsonPath(campaignRoot, postId)

  if (!(await fileExists(contentPath)) && !(await fileExists(metaPath))) {
    throw new Error(`Missing post folder data for ${postId}`)
  }

  /** @type {PostContent} */
  let content = { instagram: {}, facebook: {}, discord: {} }
  let meta = {}

  if (await fileExists(contentPath)) {
    const raw = await readJsonFile(contentPath)
    if (raw.meta && !raw.instagram) {
      throw new Error(`${contentPath} is legacy combined format — regenerate or split manually`)
    }
    content = {
      instagram: raw.instagram ?? {},
      facebook: raw.facebook ?? {},
      discord: raw.discord ?? {},
    }
    if (raw.meta) meta = raw.meta
  }

  if (await fileExists(metaPath)) {
    meta = await readJsonFile(metaPath)
  }

  return { postId, content, meta }
}

export async function savePostBundle(campaignRoot, postId, { content, meta }) {
  await ensureDir(postDir(campaignRoot, postId))
  await writeJsonFile(postJsonPath(campaignRoot, postId), {
    instagram: content.instagram,
    facebook: content.facebook,
    discord: content.discord,
  })
  await writeJsonFile(metaJsonPath(campaignRoot, postId), meta)
}

export function mergePostBundle({ content, meta }) {
  return { instagram: content.instagram, facebook: content.facebook, discord: content.discord, meta }
}

export function defaultMeta({ postId, brief, template, card, domain, imageMode, imageDraft }) {
  return {
    id: postId,
    status: 'draft',
    created_at: new Date().toISOString(),
    brief,
    template,
    subject: {
      card: card?.slug ?? null,
      domain: domain ?? card?.domain ?? null,
    },
    image: {
      mode: imageMode,
      prompt: imageDraft?.prompt ?? '',
      reference_assets: imageDraft?.reference_assets ?? [],
      subject_line: imageDraft?.subject_line ?? '',
      background_asset: imageDraft?.background_asset ?? null,
      background_title: imageDraft?.background_title ?? null,
      use_brand_reference: imageDraft?.use_brand_reference ?? false,
      size: 1080,
      rendered_at: null,
      render_mode_used: null,
    },
    validation: { ok: false, issues: [], validated_at: null },
    approved_at: null,
  }
}

export function stripLogoReferences(assets = []) {
  return assets.filter((rel) => !/(^|\/)brand\/(gamelogo|logo|header)/i.test(rel))
}
