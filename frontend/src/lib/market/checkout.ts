import { invokeCommerceAction } from '@/lib/commerce/api'
import type { MarketCurrency } from '@/lib/market/currency'

export async function checkoutCardWithCash(
  cardId: string,
  currency: MarketCurrency,
): Promise<{ ok: boolean; error?: string; message?: string; checkoutUrl?: string }> {
  const res = await invokeCommerceAction({
    type: 'checkout_create',
    cardId,
    currency: currency.toLowerCase(),
  })

  if (res.error || !res.checkoutUrl) {
    return { ok: false, error: res.error, message: res.message ?? res.error ?? 'Checkout failed' }
  }

  return { ok: true, checkoutUrl: res.checkoutUrl }
}
