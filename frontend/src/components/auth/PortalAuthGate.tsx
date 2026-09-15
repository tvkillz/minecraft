'use client'

import { usePathname } from 'next/navigation'
import { appConfig } from '@/config'
import { Button } from '@/components/ui/Button/Button'
import { useAuth } from '@/components/providers/AuthProvider'
import { isAuthRequired } from '@/lib/auth/guards'
import './AuthGate.css'

type PortalAuthGateProps = {
  children: React.ReactNode
}

export default function PortalAuthGate({ children }: PortalAuthGateProps) {
  const pathname = usePathname()
  const { session, loading, requestAuthNavigation, openAuthModal } = useAuth()
  const promptSignIn = () => requestAuthNavigation(pathname)
  const copy = appConfig.descriptions.portal

  if (!isAuthRequired()) {
    return children
  }

  if (loading) {
    return (
      <div className="auth-gate auth-gate--portal" role="status" aria-live="polite">
        <p className="auth-gate__loading">{appConfig.descriptions.auth.loading}</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div
        className="auth-gate auth-gate--portal"
        role="region"
        aria-labelledby="portal-auth-gate-title"
      >
        <div className="auth-gate__panel">
          <h1 id="portal-auth-gate-title" className="auth-gate__title">
            {copy.gateTitle}
          </h1>
          <p className="auth-gate__message">{copy.gateMessage}</p>
          <Button
            type="button"
            variant="primary"
            size="lg"
            fantasy
            onClick={promptSignIn}
          >
            {appConfig.descriptions.auth.playGateCta}
          </Button>
          <button
            type="button"
            className="auth-gate__register"
            onClick={() => openAuthModal('register', pathname)}
          >
            {appConfig.descriptions.auth.switchToRegister}
          </button>
        </div>
      </div>
    )
  }

  return children
}
