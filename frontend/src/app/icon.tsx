import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

function projectId(): string {
  return process.env.PROJECT || 'voidborn'
}

async function loadFaviconPng(): Promise<Buffer> {
  const root = path.join(process.cwd(), '.build', projectId())
  for (const name of ['favicon.png', 'favicon.ico']) {
    try {
      return await readFile(path.join(root, name))
    } catch {
      /* try next */
    }
  }
  throw new Error(`Missing favicon in .build/${projectId()}/ — run compile`)
}

/** Next.js native /icon route — reads compiled favicon from .build/{project}/ */
export default async function Icon() {
  const buffer = await loadFaviconPng()
  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
    },
  })
}
