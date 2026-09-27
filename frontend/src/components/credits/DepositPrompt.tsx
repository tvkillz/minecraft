'use client'

import { createContext, useContext, type ReactNode } from 'react'

export type DepositRequest = {
  /** Wallet units to prefill. 100 = €1. Raised to the checkout minimum by the caller. */
  cents?: number
  note?: string
}

type OpenDeposit = (request?: DepositRequest) => void

const DepositPromptContext = createContext<OpenDeposit | null>(null)

export function DepositPromptProvider({
  open,
  children,
}: {
  open: OpenDeposit
  children: ReactNode
}) {
  return <DepositPromptContext.Provider value={open}>{children}</DepositPromptContext.Provider>
}

export function useOpenDeposit(): OpenDeposit {
  const open = useContext(DepositPromptContext)
  if (!open) {
    throw new Error('useOpenDeposit must be used within DepositPromptProvider')
  }
  return open
}
