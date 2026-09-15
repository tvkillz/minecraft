'use client'

import { Suspense } from 'react'
import CheckoutPage from '@/components/checkout/CheckoutPage'
import '@/components/checkout/CheckoutPage.css'

export default function Page() {
  return (
    <Suspense fallback={<p>Loading checkout…</p>}>
      <CheckoutPage />
    </Suspense>
  )
}
