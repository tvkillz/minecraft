export function parseRetryMs(err) {
  const msg = String(err.message ?? err)
  const delayMatch = msg.match(/retry in ([\d.]+)s/i)
  if (delayMatch) return Math.ceil(Number(delayMatch[1]) * 1000) + 500
  const retryable = /503|429|high demand|rate|quota|unavailable/i.test(msg)
  return retryable ? null : 0
}

export async function withGeminiRetries(fn, { label = 'Gemini', attempts = 4 } = {}) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const wait = parseRetryMs(err)
      if (wait === 0 || attempt === attempts) throw err
      const delay = wait ?? attempt * 3000
      console.warn(`${label} busy (attempt ${attempt}/${attempts}), retrying in ${Math.round(delay / 1000)}s…`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}
