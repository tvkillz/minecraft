'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { Session, User } from '@supabase/supabase-js'
import { appConfig } from '@/config'
import { resolvePlayerName } from '@/lib/auth/player'
import { ensureTestDeckProvisioned, resetTestDeckProvisionCache } from '@/lib/decks'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase'

const AuthModal = dynamic(() => import('@/components/auth/AuthModal'), { ssr: false })

export type AuthModalMode = 'signIn' | 'register' | 'forgotPassword'

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  isPlayProtected: boolean
  modalOpen: boolean
  modalMode: AuthModalMode
  openAuthModal: (mode?: AuthModalMode, redirectPath?: string) => void
  closeAuthModal: () => void
  signOut: () => Promise<void>
  /** Navigate when signed in; otherwise open sign-in and redirect after login. */
  requestAuthNavigation: (path: string) => boolean
  /** @deprecated Use requestAuthNavigation(play path). */
  ensurePlayAccess: () => boolean
  playerName: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<AuthModalMode>('signIn')
  const pendingPathRef = useRef<string | null>(null)

  const isPlayProtected =
    appConfig.auth.requireSignInForPlay && isSupabaseConfigured()

  const user = session?.user ?? null
  const playerName = resolvePlayerName(user)

  useEffect(() => {
    let mounted = true
    let subscription: { unsubscribe: () => void } | null = null

    const initAuth = () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      void supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return
        setSession(data.session)
        setLoading(false)
      })

      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((event, nextSession) => {
        setSession(nextSession)
        setLoading(false)
        if (nextSession?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          void ensureTestDeckProvisioned()
        }
        if (nextSession) {
          setModalOpen(false)
          // Only redirect after an explicit sign-in from the auth modal — not on token
          // refresh / tab visibility (Supabase can emit SIGNED_IN again without pendingPath).
          if (event === 'SIGNED_IN' && pendingPathRef.current) {
            const target = pendingPathRef.current
            pendingPathRef.current = null
            router.push(target)
          }
        }
      })

      subscription = authSubscription
    }

    // Defer Supabase client + session read until after first paint / idle time.
    const idleId =
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(initAuth, { timeout: 1500 })
        : null
    const timeoutId = idleId === null ? window.setTimeout(initAuth, 1) : null

    return () => {
      mounted = false
      subscription?.unsubscribe()
      if (idleId !== null) cancelIdleCallback(idleId)
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [router])

  const openAuthModal = useCallback((mode: AuthModalMode = 'signIn', redirectPath?: string) => {
    if (redirectPath !== undefined) {
      pendingPathRef.current = redirectPath
    } else if (pendingPathRef.current === null) {
      pendingPathRef.current = appConfig.domain.routes.portalMarket
    }
    setModalMode(mode)
    setModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setModalOpen(false)
    pendingPathRef.current = null
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    pendingPathRef.current = null
    resetTestDeckProvisionCache()
    await supabase.auth.signOut()
    setSession(null)
  }, [])

  const requestAuthNavigation = useCallback(
    (path: string): boolean => {
      if (!isSupabaseConfigured()) {
        router.push(path)
        return true
      }
      if (loading) return false
      if (session) {
        router.push(path)
        return true
      }
      pendingPathRef.current = path
      openAuthModal('signIn')
      return false
    },
    [loading, session, openAuthModal, router],
  )

  const ensurePlayAccess = useCallback(() => {
    if (!isPlayProtected) return true
    return requestAuthNavigation(appConfig.domain.routes.play)
  }, [isPlayProtected, requestAuthNavigation])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      isPlayProtected,
      modalOpen,
      modalMode,
      openAuthModal,
      closeAuthModal,
      signOut,
      requestAuthNavigation,
      ensurePlayAccess,
      playerName,
    }),
    [
      session,
      user,
      loading,
      isPlayProtected,
      modalOpen,
      modalMode,
      openAuthModal,
      closeAuthModal,
      signOut,
      requestAuthNavigation,
      ensurePlayAccess,
      playerName,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modalOpen ? <AuthModal /> : null}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
