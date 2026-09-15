import { buildSupabaseApiHeaders } from '@/lib/supabase/auth-headers'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getSupabaseBrowserUrl, isSupabaseConfigured } from '@/lib/supabase/env'

import type { PersistedMatchState } from './serialize'
import type { CombatRoundResult, FreezeEvent } from '@/lib/game/match/types'

export type MatchAction =
  | { type: 'create'; deckId: string; mode: string }
  | { type: 'get_active' }
  | { type: 'get'; matchId: string }
  | { type: 'play_card'; matchId: string; instanceId: string; slotIndex: number }
  | { type: 'end_turn'; matchId: string }
  | { type: 'battle'; matchId: string }
  | { type: 'ack_combat'; matchId: string }
  | { type: 'abandon'; matchId: string }

export interface MatchApiResponse {
  matchId?: string
  revision?: number
  state?: PersistedMatchState
  opponentName?: string | null
  combat?: CombatRoundResult | null
  villainPlays?: { instanceId: string; slotIndex: number }[]
  endTurn?: {
    afterMana: PersistedMatchState
    afterVillain: PersistedMatchState
    villainPlays: { instanceId: string; slotIndex: number; freeze?: FreezeEvent | null }[]
    state: PersistedMatchState
    combat: CombatRoundResult
  }
  match?: {
    id: string
    player_deck_id: string | null
    turn: number
    phase: string
    state: PersistedMatchState
    revision: number
    opponent_name?: string | null
  } | null
  error?: string
  message?: string
}

export type MatchApiLogEntry = {
  at: string
  kind: 'invoke' | 'rest'
  label: string
  ok: boolean
  status?: number
  ms: number
  error?: string
}

const apiLog: MatchApiLogEntry[] = []

export function getMatchApiLog(): MatchApiLogEntry[] {
  return [...apiLog]
}

function pushApiLog(entry: MatchApiLogEntry) {
  apiLog.unshift(entry)
  if (apiLog.length > 40) apiLog.length = 40
  if (typeof window !== 'undefined') {
    console.info('[voidborn-match-api]', entry.label, entry.ok ? 'ok' : 'fail', entry)
  }
}

function parseMatchResponse(body: unknown): MatchApiResponse {
  if (!body || typeof body !== 'object') return { error: 'empty response' }
  const data = body as MatchApiResponse
  if (data.error) {
    return {
      error: String(data.error),
      message: typeof data.message === 'string' ? data.message : undefined,
    }
  }
  return data
}

async function authHeaders(): Promise<Record<string, string> | null> {
  return buildSupabaseApiHeaders({ requireUser: true })
}

/** Browser → Supabase (visible in DevTools Network, not in pm2 logs). */
export async function invokeMatchAction(action: MatchAction): Promise<MatchApiResponse> {
  const started = performance.now()
  const label = `POST /functions/v1/match (${action.type})`

  const headers = await authHeaders()
  if (!headers) {
    pushApiLog({
      at: new Date().toISOString(),
      kind: 'invoke',
      label,
      ok: false,
      ms: 0,
      error: 'offline',
    })
    return { error: 'offline' }
  }

  try {
    const res = await fetch(`${getSupabaseBrowserUrl()}/functions/v1/match`, {
      method: 'POST',
      headers,
      body: JSON.stringify(action),
    })

    const body: unknown = await res.json().catch(() => ({}))
    const parsed = parseMatchResponse(body)
    const ms = Math.round(performance.now() - started)

    pushApiLog({
      at: new Date().toISOString(),
      kind: 'invoke',
      label,
      ok: res.ok && !parsed.error,
      status: res.status,
      ms,
      error: parsed.error,
    })

    return parsed
  } catch (err) {
    const ms = Math.round(performance.now() - started)
    const message = err instanceof Error ? err.message : String(err)
    pushApiLog({
      at: new Date().toISOString(),
      kind: 'invoke',
      label,
      ok: false,
      ms,
      error: message,
    })
    return { error: message }
  }
}

export async function fetchMatchRow(matchId: string) {
  const started = performance.now()
  const label = `GET /rest/v1/matches?id=${matchId.slice(0, 8)}…`

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    pushApiLog({
      at: new Date().toISOString(),
      kind: 'rest',
      label,
      ok: false,
      ms: 0,
      error: 'offline',
    })
    return null
  }

  const { data, error } = await supabase
    .from('matches')
    .select(
      'id, player_deck_id, mode, status, turn, phase, winner, state, revision, last_combat, villain_plays, opponent_name',
    )
    .eq('id', matchId)
    .maybeSingle()

  const ms = Math.round(performance.now() - started)
  pushApiLog({
    at: new Date().toISOString(),
    kind: 'rest',
    label,
    ok: !error && Boolean(data),
    ms,
    error: error?.message,
  })

  if (error || !data) return null
  return data
}

export async function fetchActiveMatchRow(userId: string) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('matches')
    .select(
      'id, player_deck_id, mode, status, turn, phase, winner, state, revision, last_combat, villain_plays, opponent_name',
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data
}

export function getMatchApiBaseUrl(): string {
  return isSupabaseConfigured() ? getSupabaseBrowserUrl() : ''
}
