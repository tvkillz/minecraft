'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { appConfig } from '@/config'
import { creditsToEur } from '@/config/selectors'
import { formatMarketMoney } from '@/lib/market/currency'
import { useSyncedMarketCurrency } from '@/hooks/useMarketCurrency'
import { MARKET_CURRENCIES } from '@/lib/market/currency'
import {
  MAX_CUSTOM_CREDITS,
  MIN_CUSTOM_CREDITS,
  validateCustomCreditAmount,
} from '@/lib/commerce/creditCheckoutLimits'
import { Button } from '@/components/ui/Button/Button'
import TermsOfSaleAgreement from '@/components/checkout/TermsOfSaleAgreement'
import './PurchaseCreditsModal.css'

const DEPOSIT_CENTS = [500, 1000, 2000, 5000]

type PurchaseCreditsModalProps = {
  isOpen: boolean
  onClose: () => void
  /** Wallet units to prefill. 100 = €1. */
  initialCents?: number | null
  note?: string | null
}

export default function PurchaseCreditsModal({
  isOpen,
  onClose,
  initialCents = null,
  note = null,
}: PurchaseCreditsModalProps) {
  const copy = appConfig.descriptions.credits
  const { creditsPerEur } = appConfig.credits
  const { legal } = appConfig.domain
  const titleId = useId()
  const router = useRouter()
  const { currency, setCurrency } = useSyncedMarketCurrency()

  const [customCredits, setCustomCredits] = useState('')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const termsCheckboxId = useId()

  useEffect(() => {
    if (!isOpen) return
    setAgreedToTerms(false)
    setCheckoutError(null)
    if (initialCents && initialCents > 0) {
      setCustomCredits((initialCents / creditsPerEur).toFixed(2))
    } else {
      setCustomCredits('')
    }
  }, [isOpen, initialCents, creditsPerEur])

  const customAmount = useMemo(() => {
    const euros = Number.parseFloat(customCredits.replace(/[^\d.]/g, ''))
    if (!Number.isFinite(euros) || euros <= 0) return 0
    return Math.round(euros * creditsPerEur)
  }, [customCredits, creditsPerEur])

  const totalEur = customAmount > 0 ? creditsToEur(customAmount) : 0
  const customValidation =
    customAmount <= 0
      ? ({ ok: false as const, reason: 'empty' as const })
      : validateCustomCreditAmount(customAmount)

  const goToCheckout = (creditAmount: number) => {
    if (!agreedToTerms) {
      setCheckoutError('Please agree to the Terms of Sale & Digital Purchase Policy to continue.')
      return
    }
    if (!creditAmount || creditAmount <= 0) return
    const check = validateCustomCreditAmount(creditAmount)
    if (!check.ok) {
      setCheckoutError(
        check.reason === 'min'
          ? `Minimum top-up is ${formatMarketMoney(MIN_CUSTOM_CREDITS, currency)}.`
          : `Maximum top-up is ${formatMarketMoney(MAX_CUSTOM_CREDITS, currency)}.`,
      )
      return
    }
    setCheckoutError(null)

    const params = new URLSearchParams()
    params.set('currency', currency)
    params.set('credits', String(creditAmount))

    onClose()
    const checkoutPath = appConfig.domain.routes.checkout ?? '/checkout'
    router.push(`${checkoutPath}?${params.toString()}`)
  }

  return (
    <div
      className={`credits-modal${isOpen ? ' credits-modal--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="credits-modal__backdrop"
        aria-label={copy.closeLabel}
        onClick={onClose}
      />

      <div className="credits-modal__panel">
        <button
          type="button"
          className="credits-modal__close"
          aria-label={copy.closeLabel}
          onClick={onClose}
        >
          ×
        </button>

        <header className="credits-modal__header">
          <div className="credits-modal__title-row">
            <h2 id={titleId} className="credits-modal__title">
              {copy.title}
            </h2>
          </div>
          <p className="credits-modal__subtitle">{copy.subtitle}</p>
          <label className="credits-modal__currency">
            <span className="credits-modal__currency-label">Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as typeof currency)}
              aria-label="Display currency"
            >
              {MARKET_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </header>

        {note ? <p className="credits-modal__note">{note}</p> : null}

        <div className="credits-modal__amounts">
          {DEPOSIT_CENTS.map((cents) => (
            <button
              key={cents}
              type="button"
              className="credits-modal__amount"
              onClick={() => {
                setCustomCredits((cents / creditsPerEur).toFixed(2))
                setCheckoutError(null)
              }}
            >
              {formatMarketMoney(cents, currency)}
            </button>
          ))}
        </div>

        <div className="credits-modal__custom">
          <p className="credits-modal__custom-label">{copy.customAmount}</p>
          <div className="credits-modal__custom-row">
            <label className="credits-modal__custom-field">
              <span className="credits-modal__custom-field-label">{copy.amountToBuy}</span>
              <div className="credits-modal__custom-input-wrap">
                <input
                  type="number"
                  min={MIN_CUSTOM_CREDITS / creditsPerEur}
                  max={MAX_CUSTOM_CREDITS / creditsPerEur}
                  step="0.01"
                  className="credits-modal__custom-input"
                  placeholder={copy.amountPlaceholder}
                  value={customCredits}
                  onChange={(e) => {
                    setCustomCredits(e.target.value)
                    setCheckoutError(null)
                  }}
                  aria-invalid={customAmount > 0 && !customValidation.ok}
                  aria-describedby={
                    customAmount > 0 && !customValidation.ok ? 'credits-custom-limit-hint' : undefined
                  }
                />
              </div>
            </label>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="credits-modal__buy"
              disabled={customAmount <= 0 || !customValidation.ok || !agreedToTerms}
              onClick={() => goToCheckout(customAmount)}
            >
              {customAmount > 0 ? `Add ${formatMarketMoney(customAmount, currency)}` : copy.buy}
            </Button>
          </div>
          {customAmount > 0 && !customValidation.ok ? (
            <p id="credits-custom-limit-hint" className="credits-modal__warning" role="alert">
              {customValidation.reason === 'min'
                ? `Minimum top-up is ${formatMarketMoney(MIN_CUSTOM_CREDITS, currency)}.`
                : `Maximum top-up is ${formatMarketMoney(MAX_CUSTOM_CREDITS, currency)}.`}
            </p>
          ) : null}
        </div>

        <TermsOfSaleAgreement
          agreed={agreedToTerms}
          onAgreedChange={(next) => {
            setAgreedToTerms(next)
            if (next) setCheckoutError(null)
          }}
          className="credits-modal__terms"
          checkboxId={termsCheckboxId}
        />

        <p className="credits-modal__legal">
          By purchasing you agree to our{' '}
          <a href={legal.termsUrl} target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>
          ,{' '}
          <a href={legal.refundPolicyUrl} target="_blank" rel="noopener noreferrer">
            Cancellation &amp; Refund Policy
          </a>{' '}
          and{' '}
          <a href={legal.privacyUrl} target="_blank" rel="noopener noreferrer">
            Privacy Notice
          </a>
          .
        </p>

        {checkoutError && (
          <p className="credits-modal__error" role="alert">
            {checkoutError}
          </p>
        )}
      </div>
    </div>
  )
}
