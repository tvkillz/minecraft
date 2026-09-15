'use client'

import { useLayoutEffect, type ReactNode } from 'react'
import { applyTheme } from '@/config'

export function ThemeProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    applyTheme()
  }, [])

  return children
}
