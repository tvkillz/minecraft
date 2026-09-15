'use client'

import { useCallback, useEffect, useState } from 'react'

import { invokeCommerceAction, type StoreProduct } from '@/lib/commerce/api'

export function useStoreProducts() {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await invokeCommerceAction({ type: 'products_list' })
    if (res.error) setError(res.error)
    else setProducts(res.products ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { products, loading, error, refresh }
}
