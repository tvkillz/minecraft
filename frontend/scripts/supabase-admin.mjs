import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

/** Service-role client for admin scripts (Node 20+ without native WebSocket). */
export function createAdminClient(supabaseUrl, serviceKey) {
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
  })
}
