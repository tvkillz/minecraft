import { getSiteId } from '@/lib/site'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export const MAX_PAYMENT_CARDS = 16
export const PAYMENT_CARDS_PER_PAGE = 4

export type PaymentCard = {
  id: string
  brand: string
  first4: string
  last4: string
  expMonth: number
  expYear: number
  isDemo: boolean
  createdAt: string
}

type PaymentCardRow = {
  id: string
  brand: string
  first4: string
  last4: string
  exp_month: number
  exp_year: number
  is_demo: boolean
  created_at: string
}

function mapRow(row: PaymentCardRow): PaymentCard {
  return {
    id: row.id,
    brand: row.brand,
    first4: row.first4,
    last4: row.last4,
    expMonth: row.exp_month,
    expYear: row.exp_year,
    isDemo: row.is_demo,
    createdAt: row.created_at,
  }
}

export function formatMaskedPan(first4: string, last4: string): string {
  return `${first4} •••• •••• ${last4}`
}

export function formatCardExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`
}

export async function fetchPaymentCards(userId: string): Promise<PaymentCard[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const siteId = getSiteId()
  const { data, error } = await supabase
    .from('user_payment_cards')
    .select('id, brand, first4, last4, exp_month, exp_year, is_demo, created_at')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(MAX_PAYMENT_CARDS)

  if (error || !data) return []
  return (data as PaymentCardRow[]).map(mapRow)
}
