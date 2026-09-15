'use client'

import { appConfig } from '@/config'
import { Button } from '@/components/ui/Button/Button'
import { useAuth } from '@/components/providers/AuthProvider'
import './AuthGate.css'

type AuthGateProps = {
  children: React.ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const { session, loading, isPlayProtected, openAuthModal } = useAuth()
  const copy = appConfig.descriptions.auth

  if (!isPlayProtected) {
    return children
  }

  if (loading) {
    return (
      <div className="auth-gate" role="status" aria-live="polite">
        <p className="auth-gate__loading">{copy.loading}</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="auth-gate" role="region" aria-labelledby="auth-gate-title">
        <div className="auth-gate__panel">
          <h1 id="auth-gate-title" className="auth-gate__title">
            {copy.playGateTitle}
          </h1>
          <p className="auth-gate__message">{copy.playGateMessage}</p>
          <Button
            type="button"
            variant="primary"
            size="lg"
            fantasy
            onClick={() => openAuthModal('signIn', appConfig.domain.routes.play)}
          >
            {copy.playGateCta}
          </Button>
          <button
            type="button"
            className="auth-gate__register"
            onClick={() => openAuthModal('register', appConfig.domain.routes.play)}
          >
            {appConfig.descriptions.auth.switchToRegister}
          </button>
        </div>
      </div>
    )
  }

  return children
}
