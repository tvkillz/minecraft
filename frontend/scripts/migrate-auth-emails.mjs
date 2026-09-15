#!/usr/bin/env node
/**
 * Prefix legacy auth emails with +siteId (e.g. jane@x.com → jane+voidborn@x.com).
 * Skips rows that already have a site suffix. Uses Supabase Admin API (not direct Postgres).
 *
 * Usage (from frontend/):
 *   npm run migrate:auth-emails
 *   SITE_ID=voidborn npm run migrate:auth-emails
 *   npm run migrate:auth-emails -- --dry-run
 */
import {
  formatAdminEnvHint,
  loadProjectEnv,
  resolveSupabaseAdminEnv,
} from './load-project-env.mjs'
import { parseSiteAuthEmail, toSiteAuthEmail } from '../src/lib/auth/site-email.ts'
import { createAdminClient } from './supabase-admin.mjs'

const siteId = process.env.SITE_ID || 'voidborn'
const dryRun = process.argv.includes('--dry-run')

async function listAllUsers(supabase) {
  const users = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    users.push(...(data.users ?? []))
    if ((data.users?.length ?? 0) < perPage) break
    page += 1
  }

  return users
}

function isMissingTableError(message = '') {
  return /schema cache|does not exist|relation.*does not exist/i.test(message)
}

async function upsertOptional(supabase, table, row, onConflict, label, oldEmail, warnings) {
  const { error } = await supabase.from(table).upsert(row, { onConflict })
  if (!error) return true
  if (isMissingTableError(error.message)) {
    warnings.add(`${table} table missing — run backend/volumes/db/sites-bootstrap.sql on the API VPS`)
    return false
  }
  throw new Error(`${oldEmail} ${label}: ${error.message}`)
}

async function main() {
  const loaded = await loadProjectEnv()
  const { supabaseUrl, serviceKey } = resolveSupabaseAdminEnv()
  if (!supabaseUrl || !serviceKey) {
    throw new Error(formatAdminEnvHint(loaded))
  }

  const supabase = createAdminClient(supabaseUrl, serviceKey)

  const users = await listAllUsers(supabase)
  const legacy = users.filter((u) => u.email && !parseSiteAuthEmail(u.email).siteId)

  console.log(`[migrate:auth-emails] site=${siteId} dryRun=${dryRun}`)
  console.log(`[migrate:auth-emails] ${legacy.length} legacy user(s) without +site suffix`)

  if (legacy.length === 0) return

  const warnings = new Set()
  let updated = 0

  for (const user of legacy) {
    const oldEmail = user.email
    const newEmail = toSiteAuthEmail(siteId, oldEmail)
    const displayEmail = parseSiteAuthEmail(newEmail).displayEmail
    const username =
      user.user_metadata?.username ?? displayEmail.split('@')[0] ?? 'player'

    console.log(`  ${oldEmail} → ${newEmail}`)

    if (dryRun) continue

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email: newEmail,
      user_metadata: {
        ...user.user_metadata,
        site_id: siteId,
        display_email: displayEmail,
      },
    })
    if (updateError) throw new Error(`${oldEmail}: ${updateError.message}`)

    updated += 1

    await upsertOptional(
      supabase,
      'site_members',
      { user_id: user.id, site_id: siteId },
      'user_id,site_id',
      'site_members',
      oldEmail,
      warnings,
    )

    await upsertOptional(
      supabase,
      'profiles',
      {
        id: user.id,
        site_id: siteId,
        display_email: displayEmail,
        username,
        updated_at: new Date().toISOString(),
      },
      'id',
      'profiles',
      oldEmail,
      warnings,
    )
  }

  if (dryRun) {
    console.log('[migrate:auth-emails] dry run — no changes written')
  } else {
    console.log(`[migrate:auth-emails] updated ${updated} auth email(s)`)
  }

  for (const w of warnings) {
    console.warn(`[migrate:auth-emails] WARN: ${w}`)
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
