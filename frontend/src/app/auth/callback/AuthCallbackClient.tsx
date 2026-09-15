'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { appConfig } from '@/config'
import { Button } from '@/components/ui/Button/Button'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase'
import { isValidPassword } from '@/lib/auth/validation'
import '@/components/auth/AuthModal.css'

type View = 'loading' | 'recovery' | 'success' | 'error'

export default function AuthCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const copy = appConfig.descriptions.auth

  const [view, setView] = useState<View>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const recoveryModeRef = useRef(searchParams.get('type') === 'recovery')

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setView('error')
      setError(copy.errors.supabaseUnavailable)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setView('error')
      setError(copy.errors.supabaseUnavailable)
      return
    }

    let mounted = true

    const showRecovery = () => {
      recoveryModeRef.current = true
      setView('recovery')
    }

    const showSignedIn = () => {
      if (recoveryModeRef.current) return
      setView('success')
      router.replace(appConfig.domain.routes.portalMarket)
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY') {
        showRecovery()
        return
      }

      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        if (recoveryModeRef.current) {
          showRecovery()
          return
        }
        showSignedIn()
      }
    })

    // detectSessionInUrl (PKCE) exchanges ?code= automatically — do not call exchangeCodeForSession again.
    const hasAuthParams =
      searchParams.has('code') ||
      searchParams.has('token_hash') ||
      searchParams.get('type') === 'recovery'

    const resolveFromSession = async () => {
      const settle = async () => {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return

        if (recoveryModeRef.current) {
          if (data.session) showRecovery()
          else {
            setView('error')
            setError(copy.callbackFailed)
          }
          return
        }

        if (data.session) {
          showSignedIn()
          return
        }

        setView('error')
        setError(copy.callbackFailed)
      }

      if (hasAuthParams) {
        // Let detectSessionInUrl + onAuthStateChange classify recovery vs email confirm.
        window.setTimeout(() => {
          void settle()
        }, 750)
        return
      }

      await settle()
    }

    void resolveFromSession()

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [copy, router, searchParams])

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidPassword(password)) {
      setError(copy.errors.invalidPassword)
      return
    }
    if (password !== confirmPassword) {
      setError(copy.errors.passwordMismatch)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError(copy.errors.supabaseUnavailable)
      return
    }

    setSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(copy.callbackFailed)
        return
      }
      recoveryModeRef.current = false
      setView('success')
      router.replace(appConfig.domain.routes.portalMarket)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-callback">
      <div className="auth-callback__panel">
        {view === 'loading' && (
          <p className="auth-callback__message" role="status">
            {copy.callbackLoading}
          </p>
        )}

        {view === 'recovery' && (
          <>
            <h1 className="auth-callback__title">{copy.callbackRecoveryTitle}</h1>
            <p className="auth-callback__subtitle">{copy.callbackRecoverySubtitle}</p>
            <form className="auth-modal__form" onSubmit={handleUpdatePassword} noValidate>
              <label className="auth-modal__field">
                <span className="auth-modal__label">{copy.callbackNewPasswordLabel}</span>
                <input
                  className="auth-modal__input"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  disabled={submitting}
                  required
                />
              </label>
              <label className="auth-modal__field">
                <span className="auth-modal__label">{copy.callbackConfirmPasswordLabel}</span>
                <input
                  className="auth-modal__input"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(ev) => setConfirmPassword(ev.target.value)}
                  disabled={submitting}
                  required
                />
              </label>
              {error && (
                <p className="auth-modal__message auth-modal__message--error" role="alert">
                  {error}
                </p>
              )}
              <div className="auth-modal__actions">
                <Button type="submit" variant="primary" size="md" fantasy disabled={submitting}>
                  {submitting ? copy.loading : copy.callbackUpdatePasswordSubmit}
                </Button>
              </div>
            </form>
          </>
        )}

        {view === 'success' && (
          <p className="auth-callback__message auth-callback__message--ok" role="status">
            {copy.callbackPasswordUpdated}
          </p>
        )}

        {view === 'error' && (
          <>
            <p className="auth-modal__message auth-modal__message--error" role="alert">
              {error ?? copy.callbackFailed}
            </p>
            <Button type="button" variant="secondary" size="md" onClick={() => router.push('/')}>
              {copy.switchBackToSignIn}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
