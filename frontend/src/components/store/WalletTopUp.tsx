'use client'

import PurchaseCreditsModal from '@/components/credits/PurchaseCreditsModal'

type WalletTopUpProps = {
  open: boolean
  onClose: () => void
}

/** Thin wrapper — top-up uses the same Stripe checkout flow as credit packs. */
export default function WalletTopUp({ open, onClose }: WalletTopUpProps) {
  return <PurchaseCreditsModal isOpen={open} onClose={onClose} />
}
