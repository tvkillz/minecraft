'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import './MarketToast.css'

type MarketToastProps = {
  message: string | null
  onDismiss: () => void
  durationMs?: number
}

export default function MarketToast({
  message,
  onDismiss,
  durationMs = 4000,
}: MarketToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, durationMs)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss, durationMs])

  if (!message || typeof document === 'undefined') return null

  return createPortal(
    <div className="market-toast" role="status" aria-live="polite">
      <div className="market-toast__panel">
        <span className="market-toast__icon" aria-hidden="true" />
        <p className="market-toast__message">{message}</p>
        <button type="button" className="market-toast__close" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>,
    document.body,
  )
}
