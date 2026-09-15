/** Display/checkout currencies for the card market. Card prices are stored as EUR cents. */
export type MarketCurrency = 'EUR' | 'GBP' | 'USD'

export const MARKET_CURRENCIES: MarketCurrency[] = ['EUR', 'GBP', 'USD']

/** Static display rates from EUR (checkout may still settle in EUR until multi-currency Stripe). */
const RATE_FROM_EUR: Record<MarketCurrency, number> = {
  EUR: 1,
  GBP: 0.86,
  USD: 1.08,
}

export function convertFromEurCents(eurCents: number, currency: MarketCurrency): number {
  return Math.round(eurCents * RATE_FROM_EUR[currency])
}

export function formatMarketMoney(eurCents: number, currency: MarketCurrency): string {
  const amount = convertFromEurCents(eurCents, currency) / 100
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount)
}

/** Convert a EUR decimal amount (e.g. 10.00) to display currency using the same rates as the market. */
export function formatEurAmount(eurAmount: number, currency: MarketCurrency): string {
  const eurCents = Math.round(eurAmount * 100)
  return formatMarketMoney(eurCents, currency)
}

export function isMarketCurrency(value: string): value is MarketCurrency {
  return MARKET_CURRENCIES.includes(value as MarketCurrency)
}

export function loadStoredCurrency(): MarketCurrency {
  if (typeof window === 'undefined') return 'EUR'
  try {
    const raw = localStorage.getItem('market-currency')
    return raw && isMarketCurrency(raw) ? raw : 'EUR'
  } catch {
    return 'EUR'
  }
}

export function saveStoredCurrency(currency: MarketCurrency): void {
  try {
    localStorage.setItem('market-currency', currency)
  } catch {
    /* ignore */
  }
}
