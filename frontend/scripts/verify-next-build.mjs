#!/usr/bin/env node
/**
 * Ensure every server chunk referenced by the Next build exists on disk.
 * Catches incomplete builds before deploy (missing e.g. server/chunks/331.js).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { projectDistDir } from './project-next.mjs'
import { resolveProjectId } from './project-paths.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectId = resolveProjectId()
const nextDir = path.join(root, projectDistDir(projectId))
const serverDir = path.join(nextDir, 'server')
const chunksDir = path.join(serverDir, 'chunks')

const CHUNK_REF = /require\(["']\.\/(\d+)\.js["']\)/g
const WEBPACK_CHUNK_LIST = /\.X\(\d+,\[([^\]]+)\]/g

function collectJsFiles(dir) {
  const files = []
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectJsFiles(full))
    else if (entry.name.endsWith('.js')) files.push(full)
  }
  return files
}

function main() {
  if (!fs.existsSync(nextDir)) {
    console.error(`[verify-next] Missing ${nextDir}`)
    process.exit(1)
  }
  if (!fs.existsSync(chunksDir)) {
    console.error(`[verify-next] Missing ${chunksDir}`)
    process.exit(1)
  }

  const missing = new Map()
  for (const file of collectJsFiles(serverDir)) {
    if (file.startsWith(chunksDir)) continue
    const content = fs.readFileSync(file, 'utf8')
    for (const match of content.matchAll(CHUNK_REF)) {
      const id = match[1]
      const chunkPath = path.join(chunksDir, `${id}.js`)
      if (!fs.existsSync(chunkPath)) {
        missing.set(id, { chunkPath, referencedBy: file })
      }
    }
    for (const match of content.matchAll(WEBPACK_CHUNK_LIST)) {
      for (const rawId of match[1].split(',')) {
        const id = rawId.trim()
        if (!/^\d+$/.test(id)) continue
        const chunkPath = path.join(chunksDir, `${id}.js`)
        if (!fs.existsSync(chunkPath)) {
          missing.set(id, { chunkPath, referencedBy: file })
        }
      }
    }
  }

  if (missing.size > 0) {
    console.error(`[verify-next] Incomplete Next build for ${projectId}:`)
    for (const [id, info] of missing) {
      console.error(`  - chunk ${id}.js missing (referenced by ${path.relative(root, info.referencedBy)})`)
    }
    console.error('[verify-next] Re-run: PROJECT=%s npm run build', projectId)
    process.exit(1)
  }

  const chunkCount = fs.readdirSync(chunksDir).filter((f) => f.endsWith('.js')).length
  console.log(`[verify-next] OK — ${chunkCount} server chunk(s), references verified`)
}

main()
