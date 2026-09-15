const KANJI_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const

/** Arabic digits → traditional kanji numerals for iyashikei card badges. */
export function formatCardStat(value: number, style: 'arabic' | 'kanji' = 'arabic'): string {
  if (style !== 'kanji') return String(value)
  if (!Number.isFinite(value)) return String(value)

  const n = Math.max(0, Math.floor(value))
  if (n < 10) return KANJI_DIGITS[n] ?? String(n)
  if (n === 10) return '十'
  if (n < 20) return `十${KANJI_DIGITS[n - 10]}`
  if (n < 100) {
    const tens = Math.floor(n / 10)
    const ones = n % 10
    return ones === 0 ? `${KANJI_DIGITS[tens]}十` : `${KANJI_DIGITS[tens]}十${KANJI_DIGITS[ones]}`
  }

  return String(n)
}
