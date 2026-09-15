import { buildSupabaseApiHeaders } from '@/lib/supabase/auth-headers'
import { getSupabaseBrowserUrl } from '@/lib/supabase/env'

import type { CommerceAction, CommerceResponse } from './types'

export type { CommerceAction, CommerceResponse } from './types'
export type { StoreProduct, Wallet, WalletTransaction, InventoryItem } from './types'

export async function invokeCommerceAction(action: CommerceAction): Promise<CommerceResponse> {
  const headers = await buildSupabaseApiHeaders({ requireUser: action.type !== 'products_list' })
  if (!headers) {
    return { error: action.type !== 'products_list' ? 'unauthorized' : 'offline' }
  }

  const res = await fetch(`${getSupabaseBrowserUrl()}/functions/v1/commerce`, {
    method: 'POST',
    headers,
    body: JSON.stringify(action),
  })

  const body = (await res.json().catch(() => ({}))) as CommerceResponse
  if (!res.ok && !body.error) {
    return { error: `http_${res.status}` }
  }
  return body
}

/** Stripe webhook is server-only — POST /functions/v1/stripe-webhook */
