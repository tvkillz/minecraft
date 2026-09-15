'use client'

import { formatCredits } from '@/config'
import { Button } from '@/components/ui/Button/Button'
import { useWallet } from '@/hooks/useWallet'

export default function WithdrawalSuccess() {
  const { balanceCredits, refresh, loading } = useWallet()

  return (
    <div className="checkout-result">
      <h1>Withdrawal confirmed</h1>
      <span className="checkout-result__icon" aria-hidden="true" />
      <p className="checkout-result__lead">
        A confirmation email has been sent with your withdrawal details.
      </p>
      {!loading && (
        <p className="checkout-result__balance">
          Current balance: <strong>{formatCredits(balanceCredits)}</strong> credits
        </p>
      )}
      <Button
        type="button"
        variant="secondary"
        size="md"
        fantasy
        className="checkout-result__refresh"
        disabled={loading}
        onClick={() => void refresh()}
      >
        Refresh balance
      </Button>
    </div>
  )
}
