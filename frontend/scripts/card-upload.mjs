/**
 * Card storage + DB upload helpers.
 * Skips re-upload when objects already exist; migrates legacy paths/slugs from manifest config.
 */
import { readFile } from 'node:fs/promises'

/** @typedef {{ realmToLegacyElement?: Record<string, string> }} CardSlugMigration */

/**
 * Optional manifest.cardSlugMigration.realmToLegacyElement maps realm id → old elemental
 * folder/slug prefix (voidborn: kronos→terra). Used once to rename without re-uploading bytes.
 */
export function legacyCardSlug(slug, migration) {
  const map = migration?.realmToLegacyElement
  if (!map) return null
  for (const [realm, elem] of Object.entries(map)) {
    const prefix = `${realm}_card_`
    if (slug.startsWith(prefix)) {
      return `${elem}_card_${slug.slice(prefix.length)}`
    }
  }
  return null
}

export function legacyFullStoragePath(projectId, slug, migration) {
  const legacySlug = legacyCardSlug(slug, migration)
  if (!legacySlug) return null
  const map = migration.realmToLegacyElement
  for (const [realm, elem] of Object.entries(map)) {
    if (slug.startsWith(`${realm}_card_`)) {
      return `${projectId}/cards/${elem}/${legacySlug}.png`
    }
  }
  return null
}

export function legacyThumbStoragePath(projectId, slug, domain, thumbExt, migration) {
  const legacySlug = legacyCardSlug(slug, migration)
  if (!legacySlug) return null
  return `${projectId}/thumbs/${domain}/${legacySlug}.${thumbExt}`
}

const RASTER_SUFFIXES = ['.png', '.jpg', '.jpeg']

/** Storage keys that may exist before WebP migration (same basename, raster ext). */
export function supersededRasterPaths(webpPath) {
  const base = webpPath.replace(/\.webp$/i, '')
  return RASTER_SUFFIXES.map((ext) => `${base}${ext}`)
}

export async function removeStorageObject(supabase, bucket, objectPath) {
  if (!(await storageObjectExists(supabase, bucket, objectPath))) return false
  const { error } = await supabase.storage.from(bucket).remove([objectPath])
  if (error) {
    console.warn(`[upload] remove failed (${objectPath}): ${error.message}`)
    return false
  }
  return true
}

function splitStoragePath(objectPath) {
  const normalized = String(objectPath).replace(/^\/+/, '')
  const slash = normalized.lastIndexOf('/')
  if (slash === -1) return { folder: '', name: normalized }
  return { folder: normalized.slice(0, slash), name: normalized.slice(slash + 1) }
}

/** List-based existence check (no full object download). */
export async function storageObjectExists(supabase, bucket, objectPath) {
  const { folder, name } = splitStoragePath(objectPath)
  if (!name) return false

  const { data, error } = await supabase.storage.from(bucket).list(folder || '', {
    limit: 100,
    search: name,
  })

  if (error) {
    const msg = String(error.message ?? '')
    if (msg.includes('not found') || msg.includes('Object not found')) return false
    console.warn(`[upload] storage list failed (${objectPath}): ${msg}`)
    return false
  }

  return (data ?? []).some((entry) => entry.name === name && entry.id != null)
}

export async function storageObjectsExist(supabase, bucket, objectPaths) {
  const results = await Promise.all(
    objectPaths.map((objectPath) => storageObjectExists(supabase, bucket, objectPath)),
  )
  return results.every(Boolean)
}

/**
 * Upload full card art as WebP and delete superseded raster objects (PNG/JPG at same path or legacy realm path).
 * @returns {{ storagePath: string, action: 'skip' | 'upload', removedRaster: number }}
 */
export async function ensureFullArtStorage(
  supabase,
  { bucket, targetWebpPath, legacyRasterPaths = [], webpLocalPath, force = false },
) {
  const webpExists = !force && (await storageObjectExists(supabase, bucket, targetWebpPath))
  let action = 'skip'

  if (!webpExists) {
    const buf = await readFile(webpLocalPath)
    const { error } = await supabase.storage.from(bucket).upload(targetWebpPath, buf, {
      contentType: 'image/webp',
      upsert: true,
    })
    if (error) throw new Error(`Upload ${targetWebpPath}: ${error.message}`)
    action = 'upload'
  }

  const rasterCandidates = new Set([
    ...supersededRasterPaths(targetWebpPath),
    ...legacyRasterPaths,
  ])

  let removedRaster = 0
  for (const rasterPath of rasterCandidates) {
    if (rasterPath === targetWebpPath) continue
    if (await removeStorageObject(supabase, bucket, rasterPath)) removedRaster += 1
  }

  return { storagePath: targetWebpPath, action, removedRaster }
}

/**
 * Ensure object at targetPath: skip if exists, move from legacy, or upload local file.
 * @returns {{ storagePath: string, action: 'skip' | 'move' | 'upload' }}
 */
export async function ensureStorageObject(
  supabase,
  { bucket, targetPath, legacyPath, localPath, contentType, force = false },
) {
  if (!force && (await storageObjectExists(supabase, bucket, targetPath))) {
    return { storagePath: targetPath, action: 'skip' }
  }

  if (!force && legacyPath && legacyPath !== targetPath) {
    if (await storageObjectExists(supabase, bucket, legacyPath)) {
      if (!(await storageObjectExists(supabase, bucket, targetPath))) {
        const { error } = await supabase.storage.from(bucket).move(legacyPath, targetPath)
        if (!error) {
          return { storagePath: targetPath, action: 'move' }
        }
        console.warn(`[upload] storage move failed (${legacyPath}): ${error.message} — keeping legacy path`)
      }
      return { storagePath: legacyPath, action: 'skip' }
    }
  }

  const buf = await readFile(localPath)
  const { error } = await supabase.storage.from(bucket).upload(targetPath, buf, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error(`Upload ${targetPath}: ${error.message}`)
  return { storagePath: targetPath, action: 'upload' }
}

/**
 * Upsert card row; if legacy slug exists, update that row in place (preserves uuid / inventory refs).
 */
export async function upsertCardRow(supabase, projectId, row, migration) {
  const legacy = legacyCardSlug(row.slug, migration)
  if (legacy) {
    const { data: existing } = await supabase
      .from('cards')
      .select('id')
      .eq('site_id', projectId)
      .eq('slug', legacy)
      .maybeSingle()

    if (existing?.id) {
      const { data, error } = await supabase
        .from('cards')
        .update({ ...row, updated_at: row.updated_at })
        .eq('id', existing.id)
        .select('id')
        .single()
      if (error) throw new Error(`DB migrate ${legacy} → ${row.slug}: ${error.message}`)
      return { id: data.id, migrated: true }
    }
  }

  const { data, error } = await supabase
    .from('cards')
    .upsert(row, { onConflict: 'site_id,slug' })
    .select('id')
    .single()

  if (error) throw new Error(`DB upsert ${row.slug}: ${error.message}`)
  return { id: data.id, migrated: false }
}

/**
 * Sync location_featured_cards without ON CONFLICT — older DBs only have PK (location_id).
 */
export async function upsertFeaturedCard(supabase, projectId, locationId, cardId) {
  const updatedAt = new Date().toISOString()
  const payload = {
    site_id: projectId,
    location_id: locationId,
    card_id: cardId,
    updated_at: updatedAt,
  }

  const { data: bySite, error: siteErr } = await supabase
    .from('location_featured_cards')
    .select('location_id')
    .eq('site_id', projectId)
    .eq('location_id', locationId)
    .maybeSingle()

  if (siteErr) throw new Error(`Featured select ${locationId}: ${siteErr.message}`)

  if (bySite) {
    const { error } = await supabase
      .from('location_featured_cards')
      .update({ card_id: cardId, updated_at: updatedAt })
      .eq('site_id', projectId)
      .eq('location_id', locationId)
    if (error) throw new Error(`Featured update ${locationId}: ${error.message}`)
    return
  }

  const { data: byLocation, error: locErr } = await supabase
    .from('location_featured_cards')
    .select('location_id')
    .eq('location_id', locationId)
    .maybeSingle()

  if (locErr) throw new Error(`Featured legacy select ${locationId}: ${locErr.message}`)

  if (byLocation) {
    const { error } = await supabase
      .from('location_featured_cards')
      .update({ site_id: projectId, card_id: cardId, updated_at: updatedAt })
      .eq('location_id', locationId)
    if (error) throw new Error(`Featured legacy update ${locationId}: ${error.message}`)
    return
  }

  const { error: insertErr } = await supabase.from('location_featured_cards').insert(payload)
  if (insertErr) throw new Error(`Featured insert ${locationId}: ${insertErr.message}`)
}
