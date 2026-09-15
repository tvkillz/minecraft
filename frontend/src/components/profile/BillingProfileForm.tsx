'use client'

import type { FormEvent, ReactNode } from 'react'
import type { BillingProfile } from '@/lib/profile/billing'
import './BillingProfileForm.css'

export type BillingField = keyof BillingProfile

type BillingProfileFormProps = {
  formId: string
  billing: BillingProfile
  onChange: (field: BillingField, value: string) => void
  onSubmit?: (event: FormEvent) => void
  footer?: ReactNode
  disabled?: boolean
  /** Fields that show a required marker (e.g. checkout). */
  requiredFields?: readonly BillingField[]
}

function ProfileField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  required = false,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  disabled?: boolean
  required?: boolean
}) {
  return (
    <label className="billing-form__field" htmlFor={id}>
      <span className="billing-form__label">
        {label}
        {required ? <span className="billing-form__required" aria-hidden="true"> *</span> : null}
      </span>
      <input
        id={id}
        className="billing-form__input"
        type="text"
        value={value}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        aria-required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export default function BillingProfileForm({
  formId,
  billing,
  onChange,
  onSubmit,
  footer,
  disabled = false,
  requiredFields = [],
}: BillingProfileFormProps) {
  const isRequired = (field: BillingField) => requiredFields.includes(field)

  const fields = (
  <>
    <div className="billing-form__grid billing-form__grid--pair">
      <ProfileField
        id={`${formId}-first-name`}
        label="First Name"
        value={billing.firstName}
        autoComplete="given-name"
        disabled={disabled}
        required={isRequired('firstName')}
        onChange={(value) => onChange('firstName', value)}
      />
      <ProfileField
        id={`${formId}-last-name`}
        label="Last Name"
        value={billing.lastName}
        autoComplete="family-name"
        disabled={disabled}
        required={isRequired('lastName')}
        onChange={(value) => onChange('lastName', value)}
      />
    </div>

    <ProfileField
      id={`${formId}-address-1`}
      label="Address Line 1"
      value={billing.addressLine1}
      autoComplete="address-line1"
      disabled={disabled}
      onChange={(value) => onChange('addressLine1', value)}
    />
    <ProfileField
      id={`${formId}-address-2`}
      label="Address Line 2"
      value={billing.addressLine2}
      autoComplete="address-line2"
      disabled={disabled}
      onChange={(value) => onChange('addressLine2', value)}
    />

    <div className="billing-form__grid billing-form__grid--pair">
      <ProfileField
        id={`${formId}-city`}
        label="City"
        value={billing.city}
        autoComplete="address-level2"
        disabled={disabled}
        required={isRequired('city')}
        onChange={(value) => onChange('city', value)}
      />
      <ProfileField
        id={`${formId}-state`}
        label="State / Province"
        value={billing.stateProvince}
        autoComplete="address-level1"
        disabled={disabled}
        onChange={(value) => onChange('stateProvince', value)}
      />
    </div>

    <div className="billing-form__grid billing-form__grid--pair">
      <ProfileField
        id={`${formId}-postal`}
        label="Postal Code"
        value={billing.postalCode}
        autoComplete="postal-code"
        disabled={disabled}
        required={isRequired('postalCode')}
        onChange={(value) => onChange('postalCode', value)}
      />
      <ProfileField
        id={`${formId}-country`}
        label="Country"
        value={billing.country}
        autoComplete="country-name"
        disabled={disabled}
        required={isRequired('country')}
        onChange={(value) => onChange('country', value)}
      />
    </div>

    <ProfileField
      id={`${formId}-phone`}
      label="Phone"
      value={billing.phone}
      autoComplete="tel"
      disabled={disabled}
      onChange={(value) => onChange('phone', value)}
    />
  </>
  )

  if (onSubmit) {
    return (
      <form className="billing-form" onSubmit={onSubmit}>
        <div className="billing-form__body">{fields}</div>
        {footer ? <div className="billing-form__footer">{footer}</div> : null}
      </form>
    )
  }

  return (
    <div className="billing-form">
      <div className="billing-form__body">{fields}</div>
      {footer ? <div className="billing-form__footer">{footer}</div> : null}
    </div>
  )
}
