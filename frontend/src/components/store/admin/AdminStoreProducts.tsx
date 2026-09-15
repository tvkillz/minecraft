'use client'

import { useEffect, useState } from 'react'

import { invokeCommerceAction, type StoreProduct } from '@/lib/commerce/api'

export default function AdminStoreProducts() {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const list = await invokeCommerceAction({ type: 'products_list' })
      setProducts(list.products ?? [])
    })()
  }, [])

  return (
    <div>
      <h2>Store products (admin)</h2>
      {error && <p role="alert">{error}</p>}
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.slug} — {p.title} — {p.active ? 'active' : 'inactive'}
          </li>
        ))}
      </ul>
      <p>Product create/edit via commerce action <code>admin_products_upsert</code>.</p>
    </div>
  )
}
