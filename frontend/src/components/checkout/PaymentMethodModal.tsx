'use client'

import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/Button/Button'
import {
  CHECKOUT_PAYMENT_METHODS,
  type CheckoutPaymentMethodId,
} from '@/lib/commerce/checkoutPaymentMethods'
import './PaymentMethodModal.css'

type PaymentMethodModalProps = {
  isOpen: boolean
  selectedId: CheckoutPaymentMethodId | null
  onSelect: (methodId: CheckoutPaymentMethodId) => void
  onConfirm: () => void
  onClose: () => void
  confirming?: boolean
}

export default function PaymentMethodModal({
  isOpen,
  selectedId,
  onSelect,
  onConfirm,
  onClose,
  confirming = false,
}: PaymentMethodModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirming) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, confirming])

  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div className="payment-method-modal payment-method-modal--open" role="presentation">
      <button
        type="button"
        className="payment-method-modal__backdrop"
        aria-label="Close payment methods"
        onClick={onClose}
        disabled={confirming}
      />

      <div
        className="payment-method-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className="payment-method-modal__close"
          aria-label="Close payment methods"
          onClick={onClose}
          disabled={confirming}
        >
          ×
        </button>

        <header className="payment-method-modal__header">
          <h2 id={titleId} className="payment-method-modal__title">
            Choose payment method
          </h2>
          <p className="payment-method-modal__lead">
            Select how you would like to pay. You will be redirected to a secure payment page.
          </p>
        </header>

        <ul className="payment-method-modal__list" role="listbox" aria-label="Payment methods">
          {CHECKOUT_PAYMENT_METHODS.map((method) => {
            const isSelected = selectedId === method.id
            return (
              <li key={method.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`payment-method-modal__option payment-method-modal__option--${method.id}${
                    isSelected ? ' payment-method-modal__option--selected' : ''
                  }`}
                  disabled={confirming}
                  onClick={() => onSelect(method.id)}
                >
                  <span className="payment-method-modal__option-icons" aria-hidden="true">
                    {method.icons.map((icon) => (
                      <img
                        key={`${method.id}-${icon.alt}`}
                        className="payment-method-modal__icon"
                        src={icon.src}
                        alt=""
                      />
                    ))}
                  </span>
                  <span className="payment-method-modal__option-copy">
                    <span className="payment-method-modal__option-label">{method.label}</span>
                    <span className="payment-method-modal__option-description">
                      {method.description}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <footer className="payment-method-modal__footer">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={confirming}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="gold"
            size="md"
            fantasy
            disabled={!selectedId || confirming}
            onClick={onConfirm}
          >
            {confirming ? 'Processing…' : 'Continue'}
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
