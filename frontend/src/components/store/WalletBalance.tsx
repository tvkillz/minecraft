'use client'

import { formatCredits } from '@/config/selectors'
import { useWallet } from '@/hooks/useWallet'

type WalletBalanceProps = {
  onTopUp?: () => void
}

export default function WalletBalance({ onTopUp }: WalletBalanceProps) {
  const { balanceCredits, loading } = useWallet()

  return (
    <div className="wallet-balance">
      <span>Wallet</span>
      <strong>{loading ? '…' : formatCredits(balanceCredits)}</strong>
      {onTopUp && (
        <button type="button" className="portal__nav-link" onClick={onTopUp}>
          Top up
        </button>
      )}
    </div>
  )
}
