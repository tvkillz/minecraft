'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  appConfig,
  formatCredits,
} from '@/config'
import type { PortalSectionConfig } from '@/config/schema'
import PortalAuthGate from '@/components/auth/PortalAuthGate'
import {
  CollectionModeProvider,
  useCollectionMode,
} from '@/components/collection/CollectionModeContext'
import Footer from '@/components/Footer/Footer'
import PurchaseCreditsModal from '@/components/credits/PurchaseCreditsModal'
import WithdrawalModal from '@/components/credits/WithdrawalModal'
import MarketCartDrawer from '@/components/market/MarketCartDrawer'
import { useAuth } from '@/components/providers/AuthProvider'
import { prefetchCardCatalog } from '@/hooks/useCardCatalog'
import { MarketCartProvider, useMarketCart } from '@/hooks/useMarketCart'
import { MarketCurrencyProvider, useMarketCurrency } from '@/hooks/useMarketCurrency'
import { prefetchMarketListings } from '@/hooks/useMarketListings'
import { prefetchPlayerInventory } from '@/hooks/usePlayerInventory'
import { prefetchWallet, useWallet, WalletProvider } from '@/hooks/useWallet'
import { MARKET_CURRENCIES } from '@/lib/market/currency'
import { Button } from '@/components/ui/Button/Button'
import PortalHeader from '@/screens/Portal/PortalHeader'
import './PortalShell.css'
import '@/styles/coin-stack-icon.css'
import '@/styles/cart-icon.css'

function resolveSectionHref(section: PortalSectionConfig): string {
  return appConfig.domain.routes[section.route]
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthGate>
      <CollectionModeProvider>
        <WalletProvider>
          <MarketCartProvider>
            <MarketCurrencyProvider>
              <PortalShellInner>{children}</PortalShellInner>
            </MarketCurrencyProvider>
          </MarketCartProvider>
        </WalletProvider>
      </CollectionModeProvider>
    </PortalAuthGate>
  )
}

function PortalShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const portalCopy = appConfig.descriptions.portal
  const { user, session } = useAuth()
  const [creditsOpen, setCreditsOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const { mode: collectionMode, setMode: setCollectionMode } = useCollectionMode()
  const isCollectionPage = pathname === appConfig.domain.routes.portalCollection

  const activeSection = useMemo(
    () =>
      appConfig.portal.sections.find(
        (section) => resolveSectionHref(section) === pathname,
      ) ?? appConfig.portal.sections[0],
    [pathname],
  )

  const checkoutPath = appConfig.domain.routes.checkout ?? '/checkout'
  const checkoutSuccessPath = appConfig.domain.routes.checkoutSuccess ?? '/portal/checkout/success'
  const checkoutCancelPath = appConfig.domain.routes.checkoutCancel ?? '/portal/checkout/cancel'
  const withdrawalSuccessPath =
    appConfig.domain.routes.withdrawalSuccess ?? '/portal/withdrawal/success'
  const isCheckoutFlowPage =
    pathname === checkoutPath ||
    pathname === checkoutSuccessPath ||
    pathname === checkoutCancelPath ||
    pathname === withdrawalSuccessPath

  const { balanceCredits, loading: walletLoading, refresh: refreshWallet } = useWallet()
  const creditsLabel = walletLoading ? '…' : formatCredits(balanceCredits)
  const { currency, setCurrency } = useMarketCurrency()
  const { itemCount, openDrawer } = useMarketCart()
  const userId = user?.id ?? session?.user?.id ?? 'guest'

  useEffect(() => {
    void prefetchCardCatalog()
    void prefetchPlayerInventory(userId)
    void prefetchWallet(userId)
    void prefetchMarketListings('all')
  }, [userId])

  return (
    <>
      <div className="portal">
        <div className="portal__sticky-top">
          <PortalHeader onPurchaseCredits={() => setCreditsOpen(true)} />
        </div>

        <nav className="portal__tabs" aria-label="Player portal">
            {appConfig.portal.sections.map((section) => {
              const href = resolveSectionHref(section)
              const isActive = pathname === href
              return (
                <Link
                  key={section.id}
                  href={href}
                  className={`portal__tab${isActive ? ' portal__tab--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {section.label}
                </Link>
              )
            })}
          </nav>

        <div className={`portal__toolbar${isCheckoutFlowPage ? ' portal__toolbar--checkout' : ''}`}>
            {!isCheckoutFlowPage ? (
            <div className="portal__toolbar-copy">
              <h1 className="portal__section-title">{activeSection.title}</h1>
              <p className="portal__section-subtitle">{activeSection.subtitle}</p>
            </div>
            ) : null}
            <div className="portal__toolbar-actions">
              {isCollectionPage ? (
                <div className="portal__mode-switch" role="group" aria-label="Collection mode">
                  <button
                    type="button"
                    className={`portal__mode-btn${collectionMode === 'forge' ? ' portal__mode-btn--active' : ''}`}
                    aria-pressed={collectionMode === 'forge'}
                    onClick={() => setCollectionMode('forge')}
                  >
                    Forge
                  </button>
                  <button
                    type="button"
                    className={`portal__mode-btn${collectionMode === 'sell' ? ' portal__mode-btn--active' : ''}`}
                    aria-pressed={collectionMode === 'sell'}
                    onClick={() => setCollectionMode('sell')}
                  >
                    Sell
                  </button>
                </div>
              ) : null}
              <span className="portal__toolbar-balance">
                <span className="coin-stack-icon coin-stack-icon--sm" aria-hidden="true" />
                {creditsLabel}
              </span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                fantasy
                className="portal__buy-credits-btn"
                onClick={() => setCreditsOpen(true)}
              >
                {portalCopy.buyCredits}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setWithdrawOpen(true)}
              >
                {portalCopy.withdraw}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={openDrawer} className="portal__cart-btn">
                <span className="cart-icon cart-icon--toolbar" aria-hidden="true" />
                <span className="portal__cart-label">{portalCopy.cart}</span>
                {itemCount > 0 ? (
                  <span className="portal__cart-badge" aria-label={`${itemCount} items in cart`}>
                    {itemCount}
                  </span>
                ) : null}
              </Button>
              <label className="portal__currency">
                <span className="visually-hidden">Currency</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as typeof currency)}
                  aria-label="Display currency"
                >
                  {MARKET_CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

        <main className={`portal__main${isCheckoutFlowPage ? ' portal__main--checkout' : ''}`}>{children}</main>
        <div className="portal__footer">
          <Footer />
        </div>
      </div>

      <PurchaseCreditsModal
        isOpen={creditsOpen}
        onClose={() => {
          setCreditsOpen(false)
          void refreshWallet()
        }}
      />
      <WithdrawalModal
        isOpen={withdrawOpen}
        onClose={() => {
          setWithdrawOpen(false)
          void refreshWallet()
        }}
      />
      <MarketCartDrawer />
    </>
  )
}
