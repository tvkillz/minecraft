'use client'

import { useEffect, useId, useState, type FormEvent } from 'react'
import { appConfig } from '@/config'
import BillingProfileForm from '@/components/profile/BillingProfileForm'
import PaymentCardsSection from '@/components/profile/PaymentCardsSection'
import { Button } from '@/components/ui/Button/Button'
import { useAuth } from '@/components/providers/AuthProvider'
import { isValidPassword } from '@/lib/auth/validation'
import {
  CHECKOUT_REQUIRED_BILLING_FIELDS,
  EMPTY_BILLING_PROFILE,
  fetchBillingProfile,
  saveBillingProfile,
  validateBillingProfileForCheckout,
  type BillingProfile,
} from '@/lib/profile/billing'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase'
import './PortalProfile.css'

export default function PortalProfile() {
  const formId = useId()
  const { user } = useAuth()
  const authCopy = appConfig.descriptions.auth

  const [billing, setBilling] = useState<BillingProfile>(EMPTY_BILLING_PROFILE)
  const [billingLoading, setBillingLoading] = useState(true)
  const [billingSaving, setBillingSaving] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingSuccess, setBillingSuccess] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setBillingLoading(false)
      return
    }

    let cancelled = false
    void fetchBillingProfile(user.id).then((saved) => {
      if (cancelled) return
      if (saved) setBilling(saved)
      setBillingLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const setBillingField = (field: keyof BillingProfile, value: string) => {
    setBilling((prev) => ({ ...prev, [field]: value }))
    setBillingSuccess(null)
  }

  const handleSaveBilling = async (event: FormEvent) => {
    event.preventDefault()
    setBillingError(null)
    setBillingSuccess(null)

    if (!user?.id) {
      setBillingError('Sign in to save your information.')
      return
    }

    const validation = validateBillingProfileForCheckout(billing)
    if (!validation.ok) {
      setBillingError(validation.message)
      return
    }

    setBillingSaving(true)
    try {
      const result = await saveBillingProfile(user.id, billing)
      if (!result.ok) {
        setBillingError(result.message)
        return
      }
      setBillingSuccess('Information saved.')
    } finally {
      setBillingSaving(false)
    }
  }

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!isSupabaseConfigured() || !user?.email) {
      setPasswordError(authCopy.errors.supabaseUnavailable)
      return
    }

    if (!currentPassword) {
      setPasswordError(authCopy.errors.signInEmptyPassword)
      return
    }

    if (!isValidPassword(newPassword)) {
      setPasswordError(authCopy.errors.invalidPassword)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(authCopy.errors.passwordMismatch)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setPasswordError(authCopy.errors.supabaseUnavailable)
      return
    }

    setPasswordSaving(true)
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (verifyError) {
        setPasswordError('Current password is incorrect.')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setPasswordError(updateError.message || authCopy.errors.signUpFailed)
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Password updated.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="portal-profile">
      <form className="portal-profile__card portal-profile__card--billing" onSubmit={handleSaveBilling}>
        <h2 className="portal-profile__card-title">Billing Profile</h2>

        {billingLoading ? (
          <p className="portal-profile__status">{authCopy.loading}</p>
        ) : (
          <BillingProfileForm
            formId={formId}
            billing={billing}
            requiredFields={CHECKOUT_REQUIRED_BILLING_FIELDS}
            onChange={setBillingField}
            footer={
              <>
                {billingError ? (
                  <p className="portal-profile__message portal-profile__message--error" role="alert">
                    {billingError}
                  </p>
                ) : null}
                {billingSuccess ? (
                  <p className="portal-profile__message portal-profile__message--success" role="status">
                    {billingSuccess}
                  </p>
                ) : null}
                <div className="portal-profile__actions">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="md"
                    fantasy
                    disabled={billingSaving || billingLoading}
                  >
                    {billingSaving ? 'Saving…' : 'Save information'}
                  </Button>
                </div>
              </>
            }
          />
        )}
      </form>

      <div className="portal-profile__side">
        <PaymentCardsSection userId={user?.id} />

        <form
          className="portal-profile__card portal-profile__card--compact portal-profile__card--password"
          onSubmit={handleChangePassword}
        >
          <h2 className="portal-profile__card-title">Change Password</h2>

          <div className="portal-profile__card-body">
          <label className="portal-profile__field" htmlFor={`${formId}-current-password`}>
            <span className="portal-profile__label">Current Password</span>
            <input
              id={`${formId}-current-password`}
              className="portal-profile__input"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>

          <label className="portal-profile__field" htmlFor={`${formId}-new-password`}>
            <span className="portal-profile__label">New Password</span>
            <input
              id={`${formId}-new-password`}
              className="portal-profile__input"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>

          <label className="portal-profile__field" htmlFor={`${formId}-confirm-password`}>
            <span className="portal-profile__label">Confirm New Password</span>
            <input
              id={`${formId}-confirm-password`}
              className="portal-profile__input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          <p className="portal-profile__hint">{authCopy.passwordHint}</p>
          </div>

          <div className="portal-profile__card-footer">
          {passwordError ? (
            <p className="portal-profile__message portal-profile__message--error" role="alert">
              {passwordError}
            </p>
          ) : null}
          {passwordSuccess ? (
            <p className="portal-profile__message portal-profile__message--success" role="status">
              {passwordSuccess}
            </p>
          ) : null}

          <div className="portal-profile__actions portal-profile__actions--center">
            <Button type="submit" variant="secondary" size="md" fantasy disabled={passwordSaving}>
              {passwordSaving ? 'Updating…' : 'Change Password'}
            </Button>
          </div>
          </div>
        </form>
      </div>
    </div>
  )
}
