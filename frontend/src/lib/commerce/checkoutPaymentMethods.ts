import { appConfig } from '@/config'

export type CheckoutPaymentMethodId = 'card' | 'apple_pay' | 'google_pay' | 'bank_transfer'

export type CheckoutPaymentMethodIcon = {
  src: string
  alt: string
}

export type CheckoutPaymentMethod = {
  id: CheckoutPaymentMethodId
  label: string
  description: string
  icons: CheckoutPaymentMethodIcon[]
}

/** Compiled shared icons land in `.build/{project}/assets/shared/` → `/assets/shared/…` */
function sharedIcon(filename: string): string {
  return `/assets/shared/${filename}`
}

function footerPaymentIcon(id: string, fallbackFilename: string): string {
  const match = appConfig.descriptions.footer.payments.find((item) => item.id === id)
  return match?.icon || sharedIcon(fallbackFilename)
}

export const CHECKOUT_PAYMENT_METHODS: CheckoutPaymentMethod[] = [
  {
    id: 'card',
    label: 'Credit / debit card',
    description: 'Visa and Mastercard',
    icons: [
      { src: footerPaymentIcon('visa', 'visa.svg'), alt: 'Visa' },
      { src: footerPaymentIcon('mastercard', 'mastercard.svg'), alt: 'Mastercard' },
    ],
  },
  {
    id: 'apple_pay',
    label: 'Apple Pay',
    description: 'Pay with Apple Wallet',
    icons: [{ src: sharedIcon('apple-pay.svg'), alt: 'Apple Pay' }],
  },
  {
    id: 'google_pay',
    label: 'Google Pay',
    description: 'Pay with Google Wallet',
    icons: [{ src: sharedIcon('google-pay.svg'), alt: 'Google Pay' }],
  },
  {
    id: 'bank_transfer',
    label: 'Bank transfer',
    description: 'Manual bank payment',
    icons: [{ src: sharedIcon('bank-transfer.svg'), alt: 'Bank transfer' }],
  },
]
