'use client'

import type { StoreProduct } from '@/lib/commerce/types'

type ProductCardProps = {
  product: StoreProduct
  onSelect: (product: StoreProduct) => void
}

function formatPrice(cents: number, currency: string) {
  const symbol = currency.toLowerCase() === 'eur' ? '€' : currency.toUpperCase()
  return `${symbol}${(cents / 100).toFixed(2)}`
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button type="button" className="product-card" onClick={() => onSelect(product)}>
      <span className="product-card__kind">{product.kind.replace('_', ' ')}</span>
      <h3 className="product-card__title">{product.title}</h3>
      {product.description && <p className="product-card__desc">{product.description}</p>}
      <span className="product-card__price">{formatPrice(product.price_cents, product.currency)}</span>
      {product.credits_amount != null && product.credits_amount > 0 && (
        <span className="product-card__credits">+{product.credits_amount.toLocaleString()} credits</span>
      )}
    </button>
  )
}
