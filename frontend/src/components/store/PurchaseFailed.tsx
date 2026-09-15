'use client'

export default function PurchaseFailed() {
  return (
    <div className="checkout-result">
      <h1>Checkout cancelled</h1>
      <span className="checkout-result__icon checkout-result__icon--error" aria-hidden="true" />
      <p className="checkout-result__lead">
        No charge was made. You can try again.
      </p>
    </div>
  )
}
