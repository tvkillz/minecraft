'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { appConfig } from '@/config'
import { creditsToEur, formatCredits } from '@/config/selectors'
import { useSyncedMarketCurrency } from '@/hooks/useMarketCurrency'
import { formatEurAmount, MARKET_CURRENCIES } from '@/lib/market/currency'
import {
  MAX_CUSTOM_CREDITS,
  MIN_CUSTOM_CREDITS,
  validateCustomCreditAmount,
} from '@/lib/commerce/creditCheckoutLimits'
import { Button } from '@/components/ui/Button/Button'
import TermsOfSaleAgreement from '@/components/checkout/TermsOfSaleAgreement'
import '@/styles/coin-stack-icon.css'
import './PurchaseCreditsModal.css'

type PurchaseCreditsModalProps = {
  isOpen: boolean
  onClose: () => void
}

function CoinIcon() {
  return <span className="coin-stack-icon" aria-hidden="true" />
}

export default function PurchaseCreditsModal({
  isOpen,
  onClose,
}: PurchaseCreditsModalProps) {
  const copy = appConfig.descriptions.credits
  const { packages, creditsPerEur } = appConfig.credits
  const { legal } = appConfig.domain
  const titleId = useId()
  const router = useRouter()
  const { currency, setCurrency } = useSyncedMarketCurrency()

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [customCredits, setCustomCredits] = useState('')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const termsCheckboxId = useId()

  useEffect(() => {
    if (!isOpen) return
    setSelectedPackId(null)
    setCustomCredits('')
    setAgreedToTerms(false)
    setCheckoutError(null)
  }, [isOpen])

  const customAmount = useMemo(() => {
    const parsed = Number.parseInt(customCredits.replace(/\D/g, ''), 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }, [customCredits])

  const selectedPack = packages.find((p) => p.id === selectedPackId)

  const totalEur = useMemo(() => {
    if (selectedPack) return selectedPack.priceEur
    if (customAmount > 0) return creditsToEur(customAmount)
    return 0
  }, [selectedPack, customAmount])

  const customValidation = useMemo(() => {
    if (selectedPack) return { ok: true as const }
    if (customAmount <= 0) return { ok: false as const, reason: 'empty' as const }
    return validateCustomCreditAmount(customAmount)
  }, [selectedPack, customAmount])

  const canBuy =
    agreedToTerms &&
    totalEur > 0 &&
    (Boolean(selectedPack) || (customAmount > 0 && validateCustomCreditAmount(customAmount).ok))

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
          ? `Minimum purchase is ${formatCredits(MIN_CUSTOM_CREDITS)} credits.`
          : `Maximum custom purchase is ${formatCredits(MAX_CUSTOM_CREDITS)} credits.`,
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

  const handleSelectPack = (packId: string) => {
    const pack = packages.find((p) => p.id === packId)
    if (!pack) {
      setCheckoutError('This pack is unavailable. Try again or enter a custom amount.')
      return
    }
    goToCheckout(pack.credits)
  }

  const handleCustomChange = (value: string) => {
    setCustomCredits(value)
    setSelectedPackId(null)
    setCheckoutError(null)
  }

  const handleBuy = () => {
    if (!canBuy) return
    if (selectedPack) {
      goToCheckout(selectedPack.credits)
    } else if (customAmount > 0) {
      goToCheckout(customAmount)
    }
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
            <span className="credits-modal__title-coins" aria-hidden="true">
              <CoinIcon />
              <CoinIcon />
            </span>
            <h2 id={titleId} className="credits-modal__title">
              {copy.title}
            </h2>
          </div>
          <p className="credits-modal__subtitle">
            {creditsPerEur} credits = {formatEurAmount(1, currency)}
          </p>
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

        <div className="credits-modal__grid">
          {packages.map((pack) => (
            <button
              key={pack.id}
              type="button"
              className={`credits-modal__pack${
                selectedPackId === pack.id ? ' credits-modal__pack--selected' : ''
              }${pack.popular ? ' credits-modal__pack--popular' : ''}`}
              disabled={!agreedToTerms}
              onClick={() => handleSelectPack(pack.id)}
            >
              {pack.popular && (
                <span className="credits-modal__popular">{copy.popularBadge}</span>
              )}
              <div className="credits-modal__pack-top">
                <span className="credits-modal__pack-credits">
                  <CoinIcon />
                  {formatCredits(pack.credits)}
                </span>
                <span className="credits-modal__pack-price">
                  {formatEurAmount(pack.priceEur, currency)}
                </span>
              </div>
              <span className="credits-modal__pack-rate">{copy.standardRate}</span>
            </button>
          ))}
        </div>

        <div className="credits-modal__custom">
          <p className="credits-modal__custom-label">{copy.customAmount}</p>
          <div className="credits-modal__custom-row">
            <label className="credits-modal__custom-field">
              <span className="credits-modal__custom-field-label">{copy.amountToBuy}</span>
              <div className="credits-modal__custom-input-wrap">
                <CoinIcon />
                <input
                  type="number"
                  min={MIN_CUSTOM_CREDITS}
                  max={MAX_CUSTOM_CREDITS}
                  step={1}
                  className="credits-modal__custom-input"
                  placeholder={copy.amountPlaceholder}
                  value={customCredits}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  aria-invalid={customAmount > 0 && !selectedPack && !validateCustomCreditAmount(customAmount).ok}
                  aria-describedby={
                    customAmount > 0 && !selectedPack && !validateCustomCreditAmount(customAmount).ok
                      ? 'credits-custom-limit-hint'
                      : undefined
                  }
                />
              </div>
            </label>
            <div className="credits-modal__total">
              <span className="credits-modal__total-label">{copy.totalLabel}</span>
              <strong className="credits-modal__total-value">
                {formatEurAmount(totalEur, currency)}
              </strong>
            </div>
            <Button
              type="button"
              variant="primary"
              size="md"
              fantasy
              className="credits-modal__buy"
              disabled={!canBuy}
              onClick={handleBuy}
            >
              {copy.buy}
            </Button>
          </div>
          {customAmount > 0 && !selectedPack && !validateCustomCreditAmount(customAmount).ok ? (
            <p
              id="credits-custom-limit-hint"
              className="credits-modal__warning"
              role="alert"
            >
              {customValidation.reason === 'min'
                ? `Minimum custom purchase is ${formatCredits(MIN_CUSTOM_CREDITS)} credits. Choose a pack above or enter at least ${formatCredits(MIN_CUSTOM_CREDITS)}.`
                : `Maximum custom purchase is ${formatCredits(MAX_CUSTOM_CREDITS)} credits.`}
            </p>
          ) : null}
          {customAmount > 0 && (selectedPack || validateCustomCreditAmount(customAmount).ok) && (
            <p className="credits-modal__custom-hint">
              {formatCredits(customAmount)} credits @ {creditsPerEur} / {formatEurAmount(1, currency)}
            </p>
          )}
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
