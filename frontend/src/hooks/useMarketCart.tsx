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

import type { CardRecord } from '@/lib/cards/types'

export type CartLine = {
  cardId: string
  slug: string
  title: string
  thumbUrl: string
  priceCents: number
  quantity: number
}

type MarketCartContextValue = {
  items: CartLine[]
  itemCount: number
  addItem: (card: CardRecord) => void
  removeItem: (cardId: string) => void
  setQuantity: (cardId: string, quantity: number) => void
  clearCart: () => void
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
  subtotalEurCents: number
}

const MarketCartContext = createContext<MarketCartContextValue | null>(null)

const CART_STORAGE_KEY = 'market-cart'

function loadCart(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCart(items: CartLine[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

export function MarketCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(loadCart())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveCart(items)
  }, [items, hydrated])

  const addItem = useCallback((card: CardRecord) => {
    const priceCents = card.priceCents ?? 0
    if (priceCents <= 0) return
    setItems((prev) => {
      const existing = prev.find((line) => line.cardId === card.id)
      if (existing) {
        return prev.map((line) =>
          line.cardId === card.id ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }
      return [
        ...prev,
        {
          cardId: card.id,
          slug: card.slug,
          title: card.title,
          thumbUrl: card.thumbUrl,
          priceCents,
          quantity: 1,
        },
      ]
    })
    setDrawerOpen(true)
  }, [])

  const removeItem = useCallback((cardId: string) => {
    setItems((prev) => prev.filter((line) => line.cardId !== cardId))
  }, [])

  const setQuantity = useCallback((cardId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((line) => line.cardId !== cardId))
      return
    }
    setItems((prev) =>
      prev.map((line) => (line.cardId === cardId ? { ...line, quantity } : line)),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = useMemo(
    () => items.reduce((sum, line) => sum + line.quantity, 0),
    [items],
  )

  const subtotalEurCents = useMemo(
    () => items.reduce((sum, line) => sum + line.priceCents * line.quantity, 0),
    [items],
  )

  const value = useMemo<MarketCartContextValue>(
    () => ({
      items,
      itemCount,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      toggleDrawer: () => setDrawerOpen((open) => !open),
      subtotalEurCents,
    }),
    [
      items,
      itemCount,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      drawerOpen,
      subtotalEurCents,
    ],
  )

  return <MarketCartContext.Provider value={value}>{children}</MarketCartContext.Provider>
}

export function useMarketCart(): MarketCartContextValue {
  const ctx = useContext(MarketCartContext)
  if (!ctx) {
    throw new Error('useMarketCart must be used within MarketCartProvider')
  }
  return ctx
}
