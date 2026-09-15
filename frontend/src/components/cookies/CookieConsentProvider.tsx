'use client'

import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { appConfig } from '@/config'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import { getGaMeasurementId } from '@/lib/analytics/measurementIds'
import { Button } from '@/components/ui/Button/Button'
import {
  DEFAULT_COOKIE_PREFERENCES,
  readCookiePreferences,
  writeCookiePreferences,
  type CookiePreferences,
} from './cookieConsent'
import './CookieConsent.css'

type CookieView = 'banner' | 'manage'

type CookieConsentContextValue = {
  openSettings: () => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider')
  }
  return ctx
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const copy = appConfig.descriptions.footer.cookies
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_COOKIE_PREFERENCES)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<CookieView>('banner')
  const [draft, setDraft] = useState({ functional: false, analytics: false })

  useEffect(() => {
    const stored = readCookiePreferences()
    setPrefs(stored)
    setDraft({ functional: stored.functional, analytics: stored.analytics })
    if (!stored.decided) {
      setView('banner')
      setOpen(true)
    }
  }, [])

  const cookiePolicyHref =
    appConfig.descriptions.footer.legal.find((link) => link.id === 'cookies')?.href ??
    '/cookie-policy'

  const persist = useCallback((next: CookiePreferences) => {
    writeCookiePreferences(next)
    setPrefs(next)
    setDraft({ functional: next.functional, analytics: next.analytics })
    setOpen(false)
  }, [])

  const acceptAll = useCallback(() => {
    persist({ necessary: true, functional: true, analytics: true, decided: true })
  }, [persist])

  const rejectNonEssential = useCallback(() => {
    persist({ necessary: true, functional: false, analytics: false, decided: true })
  }, [persist])

  const savePreferences = useCallback(() => {
    persist({
      necessary: true,
      functional: draft.functional,
      analytics: draft.analytics,
      decided: true,
    })
  }, [draft, persist])

  const openSettings = useCallback(() => {
    setDraft({ functional: prefs.functional, analytics: prefs.analytics })
    setView('manage')
    setOpen(true)
  }, [prefs])

  const contextValue = useMemo(() => ({ openSettings }), [openSettings])

  const measurementId = getGaMeasurementId(appConfig.siteId)
  const analyticsEnabled = Boolean(prefs.decided && prefs.analytics && measurementId)
  const analyticsNode =
    measurementId != null ? (
      <Suspense fallback={null}>
        <GoogleAnalytics measurementId={measurementId} enabled={analyticsEnabled} />
      </Suspense>
    ) : null

  if (!copy) {
    return (
      <>
        {children}
        {analyticsNode}
      </>
    )
  }

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
      {analyticsNode}

      {open ? (
        <div className="cookie-consent" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title">
          <button
            type="button"
            className="cookie-consent__backdrop"
            aria-label={copy.closeLabel}
            onClick={() => setOpen(false)}
          />

          <div className="cookie-consent__panel">
            <h2 id="cookie-consent-title" className="cookie-consent__title">
              {copy.title}
            </h2>

            {view === 'banner' ? (
              <>
                <p className="cookie-consent__text">{copy.intro}</p>
                <p className="cookie-consent__text cookie-consent__text--muted">
                  {copy.policyNote}{' '}
                  <Link href={cookiePolicyHref} className="cookie-consent__link">
                    Cookie Policy
                  </Link>
                  .
                </p>
                <p className="cookie-consent__text cookie-consent__text--muted">{copy.consentNote}</p>

                <div className="cookie-consent__actions">
                  <Button type="button" variant="gold" size="md" onClick={acceptAll}>
                    {copy.acceptAll}
                  </Button>
                  <Button type="button" variant="secondary" size="md" onClick={() => setView('manage')}>
                    {copy.managePreferences}
                  </Button>
                  <Button type="button" variant="ghost" size="md" onClick={rejectNonEssential}>
                    {copy.rejectNonEssential}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="cookie-consent__text">{copy.manageIntro}</p>

                <ul className="cookie-consent__categories" role="list">
                  {copy.categories.map((category) => {
                    const isRequired = Boolean(category.required)
                    const enabled =
                      isRequired ||
                      (category.id === 'functional'
                        ? draft.functional
                        : category.id === 'analytics'
                          ? draft.analytics
                          : true)

                    return (
                      <li key={category.id} className="cookie-consent__category">
                        <div className="cookie-consent__category-head">
                          <span className="cookie-consent__category-label">{category.label}</span>
                          <label className="cookie-consent__toggle">
                            <input
                              type="checkbox"
                              checked={enabled}
                              disabled={isRequired}
                              onChange={(event) => {
                                if (category.id === 'functional') {
                                  setDraft((current) => ({
                                    ...current,
                                    functional: event.target.checked,
                                  }))
                                }
                                if (category.id === 'analytics') {
                                  setDraft((current) => ({
                                    ...current,
                                    analytics: event.target.checked,
                                  }))
                                }
                              }}
                            />
                            <span className="cookie-consent__toggle-ui" aria-hidden="true" />
                          </label>
                        </div>
                        <p className="cookie-consent__category-desc">{category.description}</p>
                      </li>
                    )
                  })}
                </ul>

                <div className="cookie-consent__actions">
                  <Button type="button" variant="gold" size="md" onClick={savePreferences}>
                    {copy.savePreferences}
                  </Button>
                  <Button type="button" variant="secondary" size="md" onClick={acceptAll}>
                    {copy.acceptAll}
                  </Button>
                  <Button type="button" variant="ghost" size="md" onClick={rejectNonEssential}>
                    {copy.rejectNonEssential}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </CookieConsentContext.Provider>
  )
}
