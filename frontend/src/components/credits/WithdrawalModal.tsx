'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { appConfig, formatCredits } from '@/config'
import { creditsToEur } from '@/config/selectors'
import { useWallet } from '@/hooks/useWallet'
import { invokeCommerceAction } from '@/lib/commerce/api'
import { useSyncedMarketCurrency } from '@/hooks/useMarketCurrency'
import { formatEurAmount } from '@/lib/market/currency'
import { Button } from '@/components/ui/Button/Button'
import '@/styles/coin-stack-icon.css'
import './WithdrawalModal.css'

type WithdrawalModalProps = {
  isOpen: boolean
  onClose: () => void
}

type PendingWithdrawal = {
  id: string
  amountCredits: number
}

function CoinIcon() {
  return <span className="coin-stack-icon" aria-hidden="true" />
}

export default function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
  const titleId = useId()
  const router = useRouter()
  const { currency } = useSyncedMarketCurrency()
  const { balanceCredits, loading: walletLoading, refresh: refreshWallet } = useWallet()

  const [amountInput, setAmountInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [testing, setTesting] = useState<'success' | 'failure' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [pending, setPending] = useState<PendingWithdrawal | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setAmountInput('')
    setError(null)
    setPending(null)
    setSubmitting(false)
    setTesting(null)
    setRejectReason('')
    void refreshWallet()
    void invokeCommerceAction({ type: 'profile_get' }).then((res) => {
      setIsAdmin(Boolean(res.isAdmin))
    })
  }, [isOpen, refreshWallet])

  const amountCredits = useMemo(() => {
    const parsed = Number.parseInt(amountInput.replace(/\D/g, ''), 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }, [amountInput])

  const eurEstimate = amountCredits > 0 ? creditsToEur(amountCredits) : 0
  const canSubmit = amountCredits > 0 && !submitting && !pending

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await invokeCommerceAction({
        type: 'withdrawal_create',
        amountCredits,
      })
      if (res.error) {
        setError(res.message ?? res.error)
        return
      }
      const row = res.withdrawal as { id?: string; amount_credits?: number } | undefined
      if (!row?.id) {
        setError('Withdrawal could not be created.')
        return
      }
      setPending({
        id: row.id,
        amountCredits: Number(row.amount_credits ?? amountCredits),
      })
    } catch {
      setError('Withdrawal could not be submitted.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTest = async (outcome: 'success' | 'failure') => {
    if (!pending || testing) return
    setTesting(outcome)
    setError(null)

    try {
      const res = await invokeCommerceAction({
        type: 'withdrawal_test',
        withdrawalId: pending.id,
        outcome,
        ...(outcome === 'failure' && rejectReason.trim()
          ? { rejectReason: rejectReason.trim() }
          : {}),
      })

      if (res.error) {
        setError(res.message ?? res.error)
        return
      }

      if (outcome === 'success') {
        if (res.emailSent === false) {
          const reason = res.emailReason ?? 'unknown'
          const hint =
            reason === 'mail_not_configured'
              ? 'Withdrawal completed, but confirmation email is not configured on the API server.'
              : reason === 'no_email'
                ? 'Withdrawal completed, but no email is on file for this account.'
                : reason === 'send_failed' || reason === 'request_error'
                  ? 'Withdrawal completed, but the confirmation email could not be sent.'
                  : 'Withdrawal completed. Confirmation email was not sent.'
          setError(hint)
          return
        }
        onClose()
        const successPath =
          appConfig.domain.routes.withdrawalSuccess ?? '/portal/withdrawal/success'
        router.push(successPath)
        return
      }

      onClose()
      void refreshWallet()
    } catch {
      setError('Test withdrawal could not be completed.')
    } finally {
      setTesting(null)
    }
  }

  const handleClose = () => {
    if (submitting || testing) return
    onClose()
    void refreshWallet()
  }

  return (
    <div
      className={`withdrawal-modal${isOpen ? ' withdrawal-modal--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="withdrawal-modal__backdrop"
        aria-label="Close withdrawal"
        onClick={handleClose}
      />
      <div className="withdrawal-modal__panel">
        <button
          type="button"
          className="withdrawal-modal__close"
          aria-label="Close"
          onClick={handleClose}
        >
          ×
        </button>

        <header className="withdrawal-modal__header">
          <div className="withdrawal-modal__title-row">
            <CoinIcon />
            <h2 id={titleId} className="withdrawal-modal__title">
              Withdraw Credits
            </h2>
          </div>
          <p className="withdrawal-modal__subtitle">
            Request a payout from your credit balance. Pending requests reserve credits until processed.
          </p>
        </header>

        <p className="withdrawal-modal__balance">
          Available balance:{' '}
          <strong>{walletLoading ? '…' : formatCredits(balanceCredits)}</strong> credits
        </p>

        {!pending ? (
          <>
            <label className="withdrawal-modal__field">
              <span className="withdrawal-modal__label">Amount (credits)</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value)
                  setError(null)
                }}
                placeholder="e.g. 500"
                autoComplete="off"
              />
            </label>

            {amountCredits > 0 ? (
              <p className="withdrawal-modal__estimate">
                Estimated payout: <strong>{formatEurAmount(eurEstimate, currency)}</strong>
              </p>
            ) : null}

            <div className="withdrawal-modal__actions">
              <Button
                type="button"
                variant="gold"
                size="md"
                fantasy
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
              >
                {submitting ? 'Submitting…' : 'Request withdrawal'}
              </Button>
            </div>
          </>
        ) : (
          <div className="withdrawal-modal__pending">
            <p className="withdrawal-modal__pending-lead">
              Withdrawal request submitted for{' '}
              <strong>{formatCredits(pending.amountCredits)}</strong> credits.
            </p>
            <p className="withdrawal-modal__pending-note">
              Your request is pending processing. Credits remain reserved until the payout completes or
              is rejected.
            </p>

            {isAdmin ? (
              <div className="withdrawal-modal__admin-tests" aria-label="Admin withdrawal tests">
                <p className="withdrawal-modal__admin-label">Admin test payouts</p>
                <label className="withdrawal-modal__field withdrawal-modal__field--reject">
                  <span className="withdrawal-modal__label">Reject reason (optional)</span>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Payment verification required"
                    autoComplete="off"
                  />
                </label>
                <div className="withdrawal-modal__admin-actions">
                  <Button
                    type="button"
                    variant="trigger-green"
                    size="sm"
                    disabled={Boolean(testing)}
                    onClick={() => void handleTest('success')}
                  >
                    {testing === 'success' ? 'Processing…' : 'Withdrawal success (test)'}
                  </Button>
                  <Button
                    type="button"
                    variant="trigger-orange"
                    size="sm"
                    disabled={Boolean(testing)}
                    onClick={() => void handleTest('failure')}
                  >
                    {testing === 'failure' ? 'Processing…' : 'Withdrawal reject (test)'}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {error ? (
          <p className="withdrawal-modal__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
