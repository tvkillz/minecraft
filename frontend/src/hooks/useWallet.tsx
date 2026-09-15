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

import { useAuth } from '@/components/providers/AuthProvider'
import { invokeCommerceAction, type Wallet, type WalletTransaction } from '@/lib/commerce/api'

export function parseBalanceCredits(wallet: Wallet | null | undefined): number {
  if (!wallet) return 0
  const raw = wallet.balance_credits as unknown
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, Math.floor(raw))
  }
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed))
  }
  return 0
}

type WalletContextValue = {
  wallet: Wallet | null
  balanceCredits: number
  transactions: WalletTransaction[]
  loading: boolean
  error: string | null
  refresh: (options?: { silent?: boolean }) => Promise<void>
}

const WalletContext = createContext<WalletContextValue | null>(null)

let cachedUserId: string | null = null
let cachedWallet: Wallet | null = null
let cachedTransactions: WalletTransaction[] = []
let inflight: Promise<void> | null = null

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth()
  const userId = user?.id ?? session?.user?.id

  const [wallet, setWallet] = useState<Wallet | null>(() =>
    userId && cachedUserId === userId ? cachedWallet : null,
  )
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() =>
    userId && cachedUserId === userId ? cachedTransactions : [],
  )
  const [loading, setLoading] = useState(
    () => Boolean(userId) && (cachedUserId !== userId || cachedWallet === null),
  )
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!userId) {
        cachedUserId = null
        cachedWallet = null
        cachedTransactions = []
        setWallet(null)
        setTransactions([])
        setLoading(false)
        return
      }

      if (!options?.silent) setLoading(true)
      setError(null)

      const [walletRes, txRes] = await Promise.all([
        invokeCommerceAction({ type: 'wallet_get' }),
        invokeCommerceAction({ type: 'transactions_list', limit: 20 }),
      ])

      if (walletRes.error) {
        setError(walletRes.error)
      } else {
        const nextWallet = walletRes.wallet ?? null
        cachedUserId = userId
        cachedWallet = nextWallet
        setWallet(nextWallet)
      }

      if (!txRes.error) {
        const nextTx = txRes.transactions ?? []
        cachedTransactions = nextTx
        setTransactions(nextTx)
      }

      if (!options?.silent) setLoading(false)
    },
    [userId],
  )

  useEffect(() => {
    if (!userId) {
      setWallet(null)
      setTransactions([])
      setLoading(false)
      return
    }

    if (cachedUserId === userId && cachedWallet !== null) {
      setWallet(cachedWallet)
      setTransactions(cachedTransactions)
      setLoading(false)
      return
    }

    if (inflight) {
      void inflight.then(() => {
        if (cachedUserId === userId) {
          setWallet(cachedWallet)
          setTransactions(cachedTransactions)
        }
        setLoading(false)
      })
      return
    }

    inflight = refresh()
    void inflight.finally(() => {
      inflight = null
    })
  }, [userId, refresh])

  const balanceCredits = parseBalanceCredits(wallet)

  const value = useMemo(
    () => ({ wallet, balanceCredits, transactions, loading, error, refresh }),
    [wallet, balanceCredits, transactions, loading, error, refresh],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return ctx
}

export function prefetchWallet(userId: string): Promise<void> {
  if (!userId || (cachedUserId === userId && cachedWallet !== null)) {
    return Promise.resolve()
  }
  if (inflight) return inflight

  inflight = (async () => {
    const walletRes = await invokeCommerceAction({ type: 'wallet_get' })
    if (!walletRes.error) {
      cachedUserId = userId
      cachedWallet = walletRes.wallet ?? null
    }
  })().finally(() => {
    inflight = null
  })

  return inflight
}
