import { getSupabaseBrowserUrl } from '@/lib/supabase/env'
import { getSiteId } from '@/lib/site'

/** Legacy rows omit site id prefix — prepend `{siteId}/` for per-site storage layout. */
export function normalizeStorageObjectPath(path: string, siteId: string): string {
  const trimmed = path.replace(/^\//, '')
  if (!trimmed || !siteId) return trimmed
  if (trimmed.startsWith(`${siteId}/`)) return trimmed
  return `${siteId}/${trimmed}`
}

export function storagePublicUrl(bucket: string, path: string): string {
  const base = getSupabaseBrowserUrl().replace(/\/$/, '')
  if (!base) return ''
  const encoded = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`
}

export function resolveCardArtUrls(
  card: {
    storage_bucket?: string
    storage_path?: string
    thumb_storage_path?: string
    thumbUrl?: string
    artUrl?: string
  },
  siteId = getSiteId(),
): { thumbUrl: string; artUrl: string } {
  const bucket = card.storage_bucket ?? 'cards'

  if (card.storage_path && card.thumb_storage_path) {
    const storage_path = normalizeStorageObjectPath(card.storage_path, siteId)
    const thumb_storage_path = normalizeStorageObjectPath(card.thumb_storage_path, siteId)
    return {
      thumbUrl: storagePublicUrl(bucket, thumb_storage_path),
      artUrl: storagePublicUrl(bucket, storage_path),
    }
  }

  if (card.thumbUrl && card.artUrl) {
    return { thumbUrl: card.thumbUrl, artUrl: card.artUrl }
  }

  return {
    thumbUrl: storagePublicUrl(bucket, card.thumb_storage_path ?? ''),
    artUrl: storagePublicUrl(bucket, card.storage_path ?? ''),
  }
}
