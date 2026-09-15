'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  loadStoredCurrency,
  saveStoredCurrency,
  type MarketCurrency,
} from '@/lib/market/currency'

type MarketCurrencyContextValue = {
  currency: MarketCurrency
  setCurrency: (currency: MarketCurrency) => void
}

const MarketCurrencyContext = createContext<MarketCurrencyContextValue | null>(null)

export function MarketCurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<MarketCurrency>('EUR')

  useEffect(() => {
    setCurrencyState(loadStoredCurrency())
  }, [])

  const setCurrency = useCallback((next: MarketCurrency) => {
    setCurrencyState(next)
    saveStoredCurrency(next)
  }, [])

  const value = useMemo(
    () => ({ currency, setCurrency }),
    [currency, setCurrency],
  )

  return (
    <MarketCurrencyContext.Provider value={value}>{children}</MarketCurrencyContext.Provider>
  )
}

export function useMarketCurrency(): MarketCurrencyContextValue {
  const ctx = useContext(MarketCurrencyContext)
  if (!ctx) {
    throw new Error('useMarketCurrency must be used within MarketCurrencyProvider')
  }
  return ctx
}

/** Same storage as the portal toolbar; works inside or outside MarketCurrencyProvider. */
export function useSyncedMarketCurrency(): MarketCurrencyContextValue {
  const ctx = useContext(MarketCurrencyContext)
  const [localCurrency, setLocalCurrency] = useState<MarketCurrency>('EUR')

  useEffect(() => {
    if (ctx) return
    setLocalCurrency(loadStoredCurrency())
  }, [ctx])

  const setLocal = useCallback((next: MarketCurrency) => {
    setLocalCurrency(next)
    saveStoredCurrency(next)
  }, [])

  return useMemo(
    () => ctx ?? { currency: localCurrency, setCurrency: setLocal },
    [ctx, localCurrency, setLocal],
  )
}
