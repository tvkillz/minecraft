'use client'

import { useEffect, useState } from 'react'

import { invokeCommerceAction, type InventoryItem } from '@/lib/commerce/api'

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await invokeCommerceAction({ type: 'inventory_list' })
      if (!cancelled) {
        setItems(res.inventory ?? [])
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p>Loading inventory…</p>
  if (items.length === 0) return <p>Your inventory is empty. Purchases will appear here.</p>

  return (
    <ul className="store-grid">
      {items.map((item) => (
        <li key={item.id} className="product-card" style={{ cursor: 'default' }}>
          <span className="product-card__kind">{item.source}</span>
          <h3 className="product-card__title">
            {item.cards?.title ?? item.card_id}
          </h3>
          <span>×{item.quantity}</span>
          <span className="product-card__desc">
            {new Date(item.acquired_at).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  )
}
