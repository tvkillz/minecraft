'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/Button/Button'
import { TERMS_OF_SALE_POLICY } from '@/lib/commerce/termsOfSalePolicy'
import './TermsOfSalePolicyModal.css'

type TermsOfSalePolicyModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function TermsOfSalePolicyModal({ isOpen, onClose }: TermsOfSalePolicyModalProps) {
  const titleId = useId()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      className="terms-sale-modal terms-sale-modal--open"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="terms-sale-modal__backdrop"
        aria-label="Close policy"
        onClick={onClose}
      />

      <div className="terms-sale-modal__panel">
        <button
          type="button"
          className="terms-sale-modal__close"
          aria-label="Close policy"
          onClick={onClose}
        >
          ×
        </button>

        <header className="terms-sale-modal__header">
          <h2 id={titleId} className="terms-sale-modal__title">
            {TERMS_OF_SALE_POLICY.title}
          </h2>
          <p className="terms-sale-modal__updated">
            Last Updated: {TERMS_OF_SALE_POLICY.lastUpdated}
          </p>
        </header>

        <div className="terms-sale-modal__body">
          <p className="terms-sale-modal__intro">{TERMS_OF_SALE_POLICY.intro}</p>

          {TERMS_OF_SALE_POLICY.sections.map((section) => (
            <section key={section.title} className="terms-sale-modal__section">
              <h3 className="terms-sale-modal__section-title">{section.title}</h3>
              <ul className="terms-sale-modal__list">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}:</strong> {item.text}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="terms-sale-modal__footer">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
