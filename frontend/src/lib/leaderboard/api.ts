import { buildSupabaseApiHeaders } from '@/lib/supabase/auth-headers'
import { getSupabaseBrowserUrl, isSupabaseConfigured } from '@/lib/supabase/env'

import type { LeaderboardAction, LeaderboardResponse } from './types'

export type { LeaderboardAction, LeaderboardEntry, LeaderboardResponse, LeaderboardViewer } from './types'

async function authHeaders(): Promise<Record<string, string> | null> {
  return buildSupabaseApiHeaders({ requireUser: true })
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const headers = await authHeaders()
  if (!headers) return { top: [], viewer: null, nearby: null, totalRanked: 0, error: 'offline' }

  const res = await fetch(`${getSupabaseBrowserUrl()}/functions/v1/leaderboard`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'get' } satisfies LeaderboardAction),
  })

  const body = (await res.json().catch(() => ({}))) as LeaderboardResponse
  if (!res.ok && !body.error) {
    return { top: [], viewer: null, nearby: null, totalRanked: 0, error: `http_${res.status}` }
  }
  return body
}
