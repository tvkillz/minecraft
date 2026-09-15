'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export type CollectionMode = 'forge' | 'sell'

type CollectionModeContextValue = {
  mode: CollectionMode
  setMode: (mode: CollectionMode) => void
}

const CollectionModeContext = createContext<CollectionModeContextValue | null>(null)

export function CollectionModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CollectionMode>('forge')
  return (
    <CollectionModeContext.Provider value={{ mode, setMode }}>
      {children}
    </CollectionModeContext.Provider>
  )
}

export function useCollectionMode(): CollectionModeContextValue {
  const ctx = useContext(CollectionModeContext)
  if (!ctx) {
    return { mode: 'forge', setMode: () => {} }
  }
  return ctx
}
