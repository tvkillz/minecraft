import fs from 'node:fs'
import path from 'node:path'

/** Load `ui-tests/.env` into process.env without overriding existing vars. */
export function loadUiTestEnv(): void {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return

  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

export type UiTestCredentials = {
  email: string
  password: string
}

/**
 * Display email (no `+site` tag) — AuthModal appends the site suffix.
 * Optional per-site overrides: UI_TEST_EMAIL_VOIDBORN / UI_TEST_EMAIL_IYASHIKEI
 */
export function getCredentials(authSuffix: string): UiTestCredentials | null {
  loadUiTestEnv()
  const suffixKey = `UI_TEST_EMAIL_${authSuffix.toUpperCase()}`
  const email =
    process.env[suffixKey]?.trim() ||
    process.env.UI_TEST_EMAIL?.trim() ||
    ''
  const password = process.env.UI_TEST_PASSWORD?.trim() || ''
  if (!email || !password) return null
  return { email, password }
}
