import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

function projectId(): string {
  return process.env.PROJECT || 'voidborn'
}

/** Next.js native /apple-icon route */
export default async function AppleIcon() {
  const file = path.join(process.cwd(), '.build', projectId(), 'apple-touch-icon.png')
  const buffer = await readFile(file)
  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
    },
  })
}
