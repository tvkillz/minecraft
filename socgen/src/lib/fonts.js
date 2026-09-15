import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const CINZEL_FONT = path.resolve(
  __dirname,
  '../../node_modules/@fontsource/cinzel/files/cinzel-latin-600-normal.woff',
)

let cinzelBase64Cache = null

export async function cinzelFontBase64() {
  if (cinzelBase64Cache) return cinzelBase64Cache
  const buf = await readFile(CINZEL_FONT)
  cinzelBase64Cache = buf.toString('base64')
  return cinzelBase64Cache
}
