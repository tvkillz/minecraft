'use client'

import { useEffect, useId, useState, type FormEvent } from 'react'
import { appConfig } from '@/config'
import { Button } from '@/components/ui/Button/Button'
import { useAuth, type AuthModalMode } from '@/components/providers/AuthProvider'
import { getAuthCallbackUrl } from '@/lib/auth/callback-url'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase'
import { mapSignInError } from '@/lib/auth/errors'
import { resetPasswordWithSiteEmail, signInWithSiteCredentials } from '@/lib/auth/sign-in'
import { toSiteAuthEmail } from '@/lib/auth/site-email'
import { getAuthEmailSuffix, getSiteId } from '@/lib/site'
import { isValidEmail, isValidPassword, isValidUsername } from '@/lib/auth/validation'
import './AuthModal.css'

export default function AuthModal() {
  const {
    modalOpen,
    modalMode,
    closeAuthModal,
    openAuthModal,
  } = useAuth()

  const copy = appConfig.descriptions.auth
  const titleId = useId()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState(false)

  const isRegister = modalMode === 'register'
  const isForgotPassword = modalMode === 'forgotPassword'

  const registerSentMessage =
    copy.registerEmailSent ??
    copy.errors.emailConfirmation ??
    'We sent a confirmation link to your email. Please confirm your account before signing in.'

  useEffect(() => {
    if (!modalOpen) {
      setPendingEmailConfirmation(false)
      return
    }
    setError(null)
    setInfo(null)
    setSubmitting(false)
    setPendingEmailConfirmation(false)
  }, [modalOpen, modalMode])

  const switchMode = (mode: AuthModalMode) => {
    setError(null)
    setInfo(null)
    setPendingEmailConfirmation(false)
    openAuthModal(mode)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!isSupabaseConfigured()) {
      setError(copy.errors.supabaseUnavailable)
      return
    }

    const trimmedEmail = email.trim()
    if (!isValidEmail(trimmedEmail)) {
      setError(copy.errors.invalidEmail)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError(copy.errors.supabaseUnavailable)
      return
    }

    const siteId = getSiteId()
    const authEmail = toSiteAuthEmail(getAuthEmailSuffix(), trimmedEmail)
    const redirectTo = getAuthCallbackUrl()

    if (isForgotPassword) {
      setSubmitting(true)
      try {
        const { error: resetError } = await resetPasswordWithSiteEmail(
          supabase,
          trimmedEmail,
          redirectTo,
        )
        if (resetError) {
          setError(copy.resetFailed)
          return
        }
        setInfo(copy.resetEmailSent)
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (isRegister) {
      if (!isValidPassword(password)) {
        setError(copy.errors.invalidPassword)
        return
      }
      if (!isValidUsername(username)) {
        setError(copy.errors.invalidUsername)
        return
      }
      if (password !== confirmPassword) {
        setError(copy.errors.passwordMismatch)
        return
      }
    } else if (!password) {
      setError(copy.errors.signInEmptyPassword)
      return
    }

    setSubmitting(true)

    try {
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              username: username.trim(),
              site_id: siteId,
              display_email: trimmedEmail,
            },
          },
        })

        if (signUpError) {
          const already =
            /already\s+(been\s+)?registered|already\s+exists|user\s+already/i.test(
              signUpError.message || '',
            )
          if (already) {
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: authEmail,
              options: { emailRedirectTo: redirectTo },
            })
            if (!resendError) {
              setPassword('')
              setConfirmPassword('')
              setPendingEmailConfirmation(true)
              setInfo(registerSentMessage)
              return
            }
          }
          setError(signUpError.message || copy.errors.signUpFailed)
          return
        }

        if (data.session) {
          closeAuthModal()
          return
        }

        setPassword('')
        setConfirmPassword('')
        setPendingEmailConfirmation(true)
        setInfo(registerSentMessage)
        return
      }

      const { error: signInError } = await signInWithSiteCredentials(
        supabase,
        trimmedEmail,
        password,
      )

      if (signInError) {
        setError(mapSignInError(signInError.message))
        return
      }

      closeAuthModal()
    } finally {
      setSubmitting(false)
    }
  }

  const title = isForgotPassword
    ? copy.forgotPasswordTitle
    : isRegister
      ? copy.registerTitle
      : copy.signInTitle
  const subtitle = isForgotPassword
    ? copy.forgotPasswordSubtitle
    : isRegister
      ? copy.registerSubtitle
      : copy.signInSubtitle
  const submitLabel = isForgotPassword
    ? copy.forgotPasswordSubmit
    : isRegister
      ? copy.registerSubmit
      : copy.signInSubmit

  return (
    <div
      className={`auth-modal${modalOpen ? ' auth-modal--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-hidden={!modalOpen}
    >
      <button
        type="button"
        className="auth-modal__backdrop"
        aria-label={copy.closeLabel}
        onClick={closeAuthModal}
      />

      <div className="auth-modal__panel">
        <button
          type="button"
          className="auth-modal__close"
          aria-label={copy.closeLabel}
          onClick={closeAuthModal}
        >
          ×
        </button>

        <h2 id={titleId} className="auth-modal__title">
          {title}
        </h2>
        <p className="auth-modal__subtitle">
          {pendingEmailConfirmation && isRegister ? '' : subtitle}
        </p>

        {pendingEmailConfirmation && isRegister ? (
          <div className="auth-modal__pending">
            <p className="auth-modal__message auth-modal__message--success" role="status">
              {info}
            </p>
            <div className="auth-modal__actions">
              <Button
                type="button"
                variant="primary"
                size="md"
                fantasy
                className="auth-modal__submit"
                onClick={() => switchMode('signIn')}
              >
                {copy.switchToSignIn}
              </Button>
            </div>
          </div>
        ) : (
        <form className="auth-modal__form" onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <label className="auth-modal__field">
              <span className="auth-modal__label">{copy.usernameLabel}</span>
              <input
                className="auth-modal__input"
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
                disabled={submitting}
                required
              />
            </label>
          )}

          <label className="auth-modal__field">
            <span className="auth-modal__label">{copy.emailLabel}</span>
            <input
              className="auth-modal__input"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={submitting}
              required
            />
          </label>

          {!isForgotPassword && (
            <label className="auth-modal__field">
              <span className="auth-modal__label">{copy.passwordLabel}</span>
              <input
                className="auth-modal__input"
                type="password"
                name="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                disabled={submitting}
                required
              />
              {isRegister && (
                <span className="auth-modal__hint">{copy.passwordHint}</span>
              )}
            </label>
          )}

          {isRegister && (
            <label className="auth-modal__field">
              <span className="auth-modal__label">{copy.confirmPasswordLabel}</span>
              <input
                className="auth-modal__input"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(ev) => setConfirmPassword(ev.target.value)}
                disabled={submitting}
                required
              />
            </label>
          )}

          {error && (
            <p className="auth-modal__message auth-modal__message--error" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="auth-modal__message auth-modal__message--info" role="status">
              {info}
            </p>
          )}

          <div className="auth-modal__actions">
            <Button
              type="submit"
              variant="primary"
              size="md"
              fantasy
              disabled={submitting}
              className="auth-modal__submit"
            >
              {submitting ? copy.loading : submitLabel}
            </Button>
          </div>
        </form>
        )}

        {!pendingEmailConfirmation && (
        <p className="auth-modal__switch">
          {isForgotPassword ? (
            <button
              type="button"
              className="auth-modal__switch-btn"
              onClick={() => switchMode('signIn')}
              disabled={submitting}
            >
              {copy.switchBackToSignIn}
            </button>
          ) : isRegister ? (
            <>
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => switchMode('forgotPassword')}
                disabled={submitting}
              >
                {copy.forgotPasswordLink}
              </button>
              <span className="auth-modal__switch-sep" aria-hidden="true">
                {' · '}
              </span>
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => switchMode('signIn')}
                disabled={submitting}
              >
                {copy.switchToSignIn}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => switchMode('forgotPassword')}
                disabled={submitting}
              >
                {copy.forgotPasswordLink}
              </button>
              <span className="auth-modal__switch-sep" aria-hidden="true">
                {' · '}
              </span>
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => switchMode('register')}
                disabled={submitting}
              >
                {copy.switchToRegister}
              </button>
            </>
          )}
        </p>
        )}
      </div>
    </div>
  )
}
