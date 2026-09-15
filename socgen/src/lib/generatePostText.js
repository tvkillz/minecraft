import { getGenerativeModel, getGeminiTextModelId } from '../config/gemini.js'
import { postContentSchema } from '../schema/postSchema.js'
import { buildPostGenerationPrompt } from '../prompts/buildPostPrompt.js'
import { withGeminiRetries } from './geminiRetry.js'
import { defaultMeta, stripLogoReferences } from './postFiles.js'
import { pickCityForCard } from './cityBackground.js'

export async function generatePostContent({ brief, template, card, domain, ctx }) {
  const prompt = buildPostGenerationPrompt({ brief, template, card, domain, ctx })
  const model = getGenerativeModel(postContentSchema())

  const raw = await withGeminiRetries(async () => {
    const result = await model.generateContent(prompt)
    return result.response.text()
  }, { label: 'Gemini text' })

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    throw new Error(`Gemini returned invalid JSON: ${e.message}\n${raw.slice(0, 1500)}`)
  }

  return { content: parsed, model: getGeminiTextModelId() }
}

export function assemblePostBundle({
  postId,
  brief,
  template,
  card,
  domain,
  generated,
  imageMode = 'auto',
  ctx = null,
  cityPick = null,
}) {
  const { content, model } = generated

  const refs = stripLogoReferences(content.image?.reference_assets ?? [])
  if (card?.path && !refs.includes(card.path)) {
    refs.unshift(card.path)
  }

  const city = cityPick ?? (card && ctx ? pickCityForCard(ctx, card) : null)

  const meta = defaultMeta({
    postId,
    brief,
    template,
    card,
    domain,
    imageMode,
    imageDraft: {
      prompt: content.image?.prompt ?? '',
      reference_assets: refs,
      subject_line: content.image?.subject_line ?? card?.title ?? '',
      background_asset: city?.path ?? null,
      background_title: city?.title ?? null,
    },
  })
  meta.model = model

  return {
    content: {
      instagram: content.instagram,
      facebook: content.facebook,
      discord: content.discord,
    },
    meta,
  }
}
