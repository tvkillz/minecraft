'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState, type CSSProperties } from 'react'
import { appConfig, resolveNavHref, resolveAccountMenuHref } from '@/config'
import type { AccountMenuItemConfig } from '@/config/schema'
import PlayRouteLink from '@/components/auth/PlayRouteLink'
import ProtectedNavLink from '@/components/auth/ProtectedNavLink'
import { useAuth } from '@/components/providers/AuthProvider'
import { routeRequiresAuth } from '@/lib/auth/guards'
import './styles.css'

const PurchaseCreditsModal = dynamic(
  () => import('@/components/credits/PurchaseCreditsModal'),
  { ssr: false },
)

const TICKER_SEGMENT_COUNT = 6

const TICKER_ITEMS = (
  <>
    <span>LEAGUE NIGHT</span>
    <span>·</span>
    <span>FRONT · MID · BOX · BACK</span>
    <span>·</span>
    <span>EVERY MATCH LEAVES A LEGACY</span>
    <span>·</span>
    <span>COLLECT · TRADE · PLAY</span>
    <span>·</span>
  </>
)

export default function FinalWhistleHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)
  const { name, logo, descriptions, theme } = appConfig
  const { session, playerName, openAuthModal, signOut, loading } = useAuth()

  const closeMenu = () => setIsOpen(false)

  const handleAccountAction = (item: AccountMenuItemConfig) => {
    if (item.action === 'purchaseCredits') {
      setCreditsOpen(true)
      closeMenu()
      return
    }
    if (item.action === 'signOut') {
      void signOut()
      closeMenu()
    }
  }

  const renderGuestNavItem = (link: (typeof theme.navigation)[number]) => {
    const href = resolveNavHref(link)
    const needsAuth = link.route ? routeRequiresAuth(link.route) : false

    if (needsAuth && link.route) {
      if (link.route === 'play') {
        return (
          <PlayRouteLink className="fw-header__nav-link" onClick={closeMenu}>
            {link.label}
          </PlayRouteLink>
        )
      }
      return (
        <ProtectedNavLink
          href={href}
          className="fw-header__nav-link"
          onClick={closeMenu}
        >
          {link.label}
        </ProtectedNavLink>
      )
    }
    if (link.route) {
      return (
        <Link href={href} className="fw-header__nav-link" onClick={closeMenu}>
          {link.label}
        </Link>
      )
    }
    return (
      <a href={href} className="fw-header__nav-link" onClick={closeMenu}>
        {link.label}
      </a>
    )
  }

  const renderAccountNavItem = (item: AccountMenuItemConfig) => {
    if (item.action) {
      const isSignOut = item.action === 'signOut'
      return (
        <button
          type="button"
          className={`fw-header__nav-btn${isSignOut ? ' fw-header__nav-btn--sign-out' : ''}`}
          onClick={() => handleAccountAction(item)}
        >
          {item.label}
        </button>
      )
    }

    if (item.route === 'play') {
      return (
        <PlayRouteLink className="fw-header__nav-link" onClick={closeMenu}>
          {item.label}
        </PlayRouteLink>
      )
    }

    if (item.route) {
      return (
        <Link
          href={resolveAccountMenuHref(item.route)}
          className="fw-header__nav-link"
          onClick={closeMenu}
        >
          {item.label}
        </Link>
      )
    }

    return null
  }

  return (
    <>
      <header className="fw-header">
        <div className="fw-header__ticker" aria-hidden="true">
          <div
            className="fw-header__ticker-track"
            style={{ '--ticker-segments': TICKER_SEGMENT_COUNT } as CSSProperties}
          >
            {Array.from({ length: TICKER_SEGMENT_COUNT }, (_, index) => (
              <div
                key={index}
                className="fw-header__ticker-group"
                aria-hidden={index > 0}
              >
                {TICKER_ITEMS}
              </div>
            ))}
          </div>
        </div>

        <div className="fw-header__bar">
          <Link href={appConfig.domain.routes.home} className="fw-header__brand">
            <img
              src={logo.headerLogo ?? logo.src}
              alt={logo.headerLogoAlt ?? logo.alt}
              className={logo.headerLogo ? 'fw-header__wordmark' : 'fw-header__logo'}
            />
            {!logo.headerLogo ? (
              <span className="fw-header__title">{name.display}</span>
            ) : null}
          </Link>

          <div className="fw-header__actions">
            {session ? (
              <span className="fw-header__user-label">
                <p>{descriptions.header.signedInAs}</p>
                <strong>{playerName}</strong>
              </span>
            ) : (
              <button
                type="button"
                className="fw-header__sign-in"
                disabled={loading}
                onClick={() => openAuthModal('signIn')}
              >
                {descriptions.header.signIn}
              </button>
            )}

            <button
              type="button"
              className={`fw-header__menu-toggle${isOpen ? ' fw-header__menu-toggle--open' : ''}`}
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
              onClick={() => setIsOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <nav
            className={`fw-header__accordion${isOpen ? ' fw-header__accordion--open' : ''}`}
            aria-hidden={!isOpen}
          >
            <ul className="fw-header__nav-list">
              {session
                ? theme.accountMenu.map((item) => (
                    <li
                      key={item.id}
                      className={
                        item.action === 'signOut' ? 'fw-header__nav-item--sign-out' : undefined
                      }
                    >
                      {renderAccountNavItem(item)}
                    </li>
                  ))
                : theme.navigation.map((link) => (
                    <li key={link.label}>{renderGuestNavItem(link)}</li>
                  ))}
            </ul>
          </nav>
        </div>

        <div className="fw-header__touchline" aria-hidden="true" />
      </header>

      {creditsOpen ? (
        <PurchaseCreditsModal
          isOpen={creditsOpen}
          onClose={() => setCreditsOpen(false)}
        />
      ) : null}
    </>
  )
}
