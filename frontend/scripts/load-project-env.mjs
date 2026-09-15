import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(FRONTEND_ROOT, '..')

/**
 * Parse a dotenv file into process.env (does not override existing vars).
 */
export async function loadEnvFile(filePath) {
  let text
  try {
    text = await readFile(filePath, 'utf8')
  } catch {
    return false
  }

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
  return true
}

/** Load Supabase-related vars from repo env files (backend + frontend). */
export async function loadProjectEnv() {
  const files = [
    path.join(REPO_ROOT, 'backend/.env'),
    path.join(FRONTEND_ROOT, '.env.admin'),
    path.join(FRONTEND_ROOT, '.env.local'),
    path.join(FRONTEND_ROOT, '.env.development'),
    path.join(FRONTEND_ROOT, '.env.production'),
  ]

  const loaded = []
  for (const file of files) {
    if (await loadEnvFile(file)) loaded.push(path.relative(REPO_ROOT, file))
  }
  return loaded
}

/** Human hint when admin scripts lack API URL or service role key. */
export function formatAdminEnvHint(loaded = []) {
  const lines = [
    'Missing Supabase admin credentials (API URL + SERVICE_ROLE_KEY).',
    '',
    'On the frontend VPS (no backend/.env mount), create frontend/.env.admin:',
    '  cp frontend/.env.admin.example frontend/.env.admin',
    '  # paste SERVICE_ROLE_KEY from backend VPS backend/.env',
    '',
    'Loaded env files:',
    ...(loaded.length ? loaded.map((f) => `  - ${f}`) : ['  (none)']),
  ]
  return lines.join('\n')
}

/** Resolve URL + service key for admin scripts (seed upload). */
export function resolveSupabaseAdminEnv() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_PUBLIC_URL ||
    ''

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''

  return { supabaseUrl, serviceKey }
}
