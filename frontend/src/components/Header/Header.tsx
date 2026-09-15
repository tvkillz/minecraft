'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import { appConfig, resolveNavHref, resolveAccountMenuHref } from '@/config'
import type { AccountMenuItemConfig } from '@/config/schema'
import PlayRouteLink from '@/components/auth/PlayRouteLink'
import ProtectedNavLink from '@/components/auth/ProtectedNavLink'
import { useAuth } from '@/components/providers/AuthProvider'

const PurchaseCreditsModal = dynamic(
  () => import('@/components/credits/PurchaseCreditsModal'),
  { ssr: false },
)
import { routeRequiresAuth } from '@/lib/auth/guards'
import './styles.css'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
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
          <PlayRouteLink className="header__nav-link" onClick={closeMenu}>
            {link.label}
          </PlayRouteLink>
        )
      }
      return (
        <ProtectedNavLink
          href={href}
          className="header__nav-link"
          onClick={closeMenu}
        >
          {link.label}
        </ProtectedNavLink>
      )
    }
    if (link.route) {
      return (
        <Link href={href} className="header__nav-link" onClick={closeMenu}>
          {link.label}
        </Link>
      )
    }
    return (
      <a href={href} onClick={closeMenu}>
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
          className={`header__nav-btn${isSignOut ? ' header__nav-btn--sign-out' : ''}`}
          onClick={() => handleAccountAction(item)}
        >
          {item.label}
        </button>
      )
    }

    if (item.route === 'play') {
      return (
        <PlayRouteLink className="header__nav-link" onClick={closeMenu}>
          {item.label}
        </PlayRouteLink>
      )
    }

    if (item.route) {
      return (
        <Link
          href={resolveAccountMenuHref(item.route)}
          className="header__nav-link"
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
      <header className="header">
        <Link href={appConfig.domain.routes.home} className="header__brand">
          {logo.headerLogo && !logoFailed ? (
            <img
              src={logo.headerLogo}
              alt={logo.headerLogoAlt ?? logo.alt}
              className="header__wordmark"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <>
              {logo.src && !logo.headerLogo ? (
                <img src={logo.src} alt={logo.alt} className="header__logo" />
              ) : null}
              <span className="header__title">{name.display}</span>
            </>
          )}
        </Link>

        <div className="header__actions">
          {session ? (
            <span className="header__user-label">
              <p>{descriptions.header.signedInAs}{' '}</p>
              <strong>{playerName}</strong>
            </span>
          ) : (
            <button
              type="button"
              className="header__sign-in"
              disabled={loading}
              onClick={() => openAuthModal('signIn')}
            >
              <span className="header__sign-in-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </span>
              {descriptions.header.signIn}
            </button>
          )}

          <button
            type="button"
            className={`header__menu-toggle${isOpen ? ' header__menu-toggle--open' : ''}`}
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
          className={`header__accordion${isOpen ? ' header__accordion--open' : ''}`}
          aria-hidden={!isOpen}
        >
          <ul className="header__nav-list">
            {session
              ? theme.accountMenu.map((item) => (
                  <li
                    key={item.id}
                    className={
                      item.action === 'signOut' ? 'header__nav-item--sign-out' : undefined
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
