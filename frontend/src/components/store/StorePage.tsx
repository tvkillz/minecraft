'use client'

import { useState } from 'react'

import { useStoreProducts } from '@/hooks/useStoreProducts'
import type { StoreProduct } from '@/lib/commerce/types'

import CurrencySelector from './CurrencySelector'
import ProductCard from './ProductCard'
import ProductDetailsModal from './ProductDetailsModal'
import WalletBalance from './WalletBalance'
import WalletTopUp from './WalletTopUp'
import './store.css'

export default function StorePage() {
  const { products, loading, error, refresh } = useStoreProducts()
  const [selected, setSelected] = useState<StoreProduct | null>(null)
  const [topUpOpen, setTopUpOpen] = useState(false)

  return (
    <div className="store-page">
      <div className="store-toolbar">
        <WalletBalance onTopUp={() => setTopUpOpen(true)} />
        <CurrencySelector />
      </div>

      {loading && <p>Loading store…</p>}
      {error && <p role="alert">Store unavailable ({error}).</p>}

      <div className="store-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onSelect={setSelected} />
        ))}
      </div>

      <ProductDetailsModal
        product={selected}
        onClose={() => setSelected(null)}
        onPurchased={() => void refresh()}
      />

      <WalletTopUp
        open={topUpOpen}
        onClose={() => {
          setTopUpOpen(false)
          void refresh()
        }}
      />
    </div>
  )
}
