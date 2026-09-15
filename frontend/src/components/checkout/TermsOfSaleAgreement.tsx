'use client'

import { useState } from 'react'

import TermsOfSalePolicyModal from '@/components/checkout/TermsOfSalePolicyModal'
import './TermsOfSaleAgreement.css'

type TermsOfSaleAgreementProps = {
  agreed: boolean
  onAgreedChange: (agreed: boolean) => void
  className?: string
  checkboxId?: string
}

export default function TermsOfSaleAgreement({
  agreed,
  onAgreedChange,
  className,
  checkboxId = 'terms-of-sale-agreement',
}: TermsOfSaleAgreementProps) {
  const [policyOpen, setPolicyOpen] = useState(false)

  return (
    <>
      <label className={`terms-sale-agreement${className ? ` ${className}` : ''}`} htmlFor={checkboxId}>
        <input
          id={checkboxId}
          type="checkbox"
          className="terms-sale-agreement__checkbox"
          checked={agreed}
          onChange={(event) => onAgreedChange(event.target.checked)}
        />
        <span className="terms-sale-agreement__copy">
          I agree to the{' '}
          <button
            type="button"
            className="terms-sale-agreement__link"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setPolicyOpen(true)
            }}
          >
            Terms of Sale &amp; Digital Purchase Policy
          </button>
        </span>
      </label>

      <TermsOfSalePolicyModal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />
    </>
  )
}
