import { createGeminiImageClient, getGeminiImageModelId } from '../config/gemini.js'

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

/** Generate image via Gemini image model (Interactions API v2). */
export async function generateImage(prompt) {
  const ai = createGeminiImageClient()
  const model = getGeminiImageModelId()

  let lastError
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const interaction = await ai.interactions.create({
        model,
        input: prompt,
        response_modalities: ['image'],
      })

      const buffer = extractImageBuffer(interaction)
      if (!buffer?.length) {
        throw new Error('Gemini returned no image data')
      }
      return buffer
    } catch (err) {
      lastError = err
      const wait = parseRetryMs(err)
      if (wait === 0 || attempt === 4) throw err
      const delay = wait ?? attempt * 3000
      console.warn(`  Image API busy (attempt ${attempt}/4), retrying in ${Math.round(delay / 1000)}s…`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  throw lastError
}
