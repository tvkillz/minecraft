'use client'

import { useCallback, useEffect, useState } from 'react'

import { invokeCommerceAction } from '@/lib/commerce/api'
import type { CoopEntitlement } from '@/lib/commerce/types'
import { formatMarketMoney } from '@/lib/market/currency'
import { useMarketCurrency } from '@/hooks/useMarketCurrency'
import './CoopStore.css'

export default function CoopUnlocks() {
  const { currency } = useMarketCurrency()
  const [rows, setRows] = useState<CoopEntitlement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await invokeCommerceAction({ type: 'coop_entitlements_list' })
    setLoading(false)
    if (result.error) {
      setError(result.message ?? result.error)
      setRows([])
      return
    }
    setError(null)
    setRows(result.entitlements ?? [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="coop-store__notice">Loading unlocks…</p>
  }

  if (error) {
    return (
      <p className="coop-store__error" role="alert">
        {error}
      </p>
    )
  }

  if (!rows.length) {
    return <p className="coop-store__notice">Nothing on this account yet. Buy something in the store.</p>
  }

  return (
    <ul className="coop-store__grid">
      {rows.map((row) => (
        <li key={row.id} className="coop-store__item">
          <article className="coop-store__card">
            <div className="coop-store__body">
              <p className="coop-store__kicker">
                {new Date(row.created_at).toLocaleDateString()} · {formatMarketMoney(row.price_cents, currency)}
              </p>
              <h2 className="coop-store__title">{row.title}</h2>
              {Array.isArray(row.features) && row.features.length ? (
                <ul className="coop-store__features">
                  {row.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        </li>
      ))}
    </ul>
  )
}
