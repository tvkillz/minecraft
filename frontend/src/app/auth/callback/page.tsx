import { Suspense } from 'react'
import AuthCallbackClient from './AuthCallbackClient'
import './auth-callback.css'

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-callback">
          <p className="auth-callback__message">Loading…</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  )
}
