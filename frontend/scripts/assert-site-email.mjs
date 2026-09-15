#!/usr/bin/env node
/** Fail build if site auth email format regresses to GoTrue-invalid "::" separator. */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'src/lib/auth/site-email.ts'), 'utf8')

if (/SEP\s*=\s*['"]::['"]/.test(src)) {
  console.error('[assert-site-email] site-email.ts must use + not :: (GoTrue rejects ::)')
  process.exit(1)
}

if (!/SEP\s*=\s*['"]\+['"]/.test(src)) {
  console.error('[assert-site-email] site-email.ts must define SEP = "+"')
  process.exit(1)
}
