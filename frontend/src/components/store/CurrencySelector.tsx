'use client'

/** Checkout currency is driven by Stripe product rows (EUR today). */
export default function CurrencySelector() {
  return (
    <label className="store-currency">
      <span>Currency</span>
      <select disabled value="eur" aria-label="Currency (EUR)">
        <option value="eur">EUR (€)</option>
      </select>
    </label>
  )
}
