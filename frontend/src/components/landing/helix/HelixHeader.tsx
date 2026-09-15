'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import { appConfig, resolveNavHref, resolveAccountMenuHref } from '@/config'
import type { AccountMenuItemConfig } from '@/config/schema'
import PlayRouteLink from '@/components/auth/PlayRouteLink'
import ProtectedNavLink from '@/components/auth/ProtectedNavLink'
import { useAuth } from '@/components/providers/AuthProvider'
import { routeRequiresAuth } from '@/lib/auth/guards'
import HelixStarfield from './HelixStarfield'
import './styles.css'

const PurchaseCreditsModal = dynamic(
  () => import('@/components/credits/PurchaseCreditsModal'),
  { ssr: false },
)

export default function HelixHeader() {
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
          <PlayRouteLink className="helix-header__nav-link" onClick={closeMenu}>
            {link.label}
          </PlayRouteLink>
        )
      }
      return (
        <ProtectedNavLink
          href={href}
          className="helix-header__nav-link"
          onClick={closeMenu}
        >
          {link.label}
        </ProtectedNavLink>
      )
    }
    if (link.route) {
      return (
        <Link href={href} className="helix-header__nav-link" onClick={closeMenu}>
          {link.label}
        </Link>
      )
    }
    return (
      <a href={href} className="helix-header__nav-link" onClick={closeMenu}>
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
          className={`helix-header__nav-btn${isSignOut ? ' helix-header__nav-btn--sign-out' : ''}`}
          onClick={() => handleAccountAction(item)}
        >
          {item.label}
        </button>
      )
    }

    if (item.route === 'play') {
      return (
        <PlayRouteLink className="helix-header__nav-link" onClick={closeMenu}>
          {item.label}
        </PlayRouteLink>
      )
    }

    if (item.route) {
      return (
        <Link
          href={resolveAccountMenuHref(item.route)}
          className="helix-header__nav-link"
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
      <header className="helix-header">
        <HelixStarfield className="helix-header__stars" density="sparse" />
        <Link href={appConfig.domain.routes.home} className="helix-header__brand">
          <img
            src={logo.headerLogo ?? logo.src}
            alt={logo.headerLogoAlt ?? logo.alt}
            className={logo.headerLogo ? 'helix-header__wordmark' : 'helix-header__logo'}
          />
          {!logo.headerLogo ? (
            <span className="helix-header__title">{name.display}</span>
          ) : null}
        </Link>

        <div className="helix-header__actions">
          {session ? (
            <span className="helix-header__user-label">
              <p>{descriptions.header.signedInAs}</p>
              <strong>{playerName}</strong>
            </span>
          ) : (
            <button
              type="button"
              className="helix-header__sign-in"
              disabled={loading}
              onClick={() => openAuthModal('signIn')}
            >
              {descriptions.header.signIn}
            </button>
          )}

          <button
            type="button"
            className={`helix-header__menu-toggle${isOpen ? ' helix-header__menu-toggle--open' : ''}`}
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
          className={`helix-header__accordion${isOpen ? ' helix-header__accordion--open' : ''}`}
          aria-hidden={!isOpen}
        >
          <ul className="helix-header__nav-list">
            {session
              ? theme.accountMenu.map((item) => (
                  <li
                    key={item.id}
                    className={
                      item.action === 'signOut' ? 'helix-header__nav-item--sign-out' : undefined
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
