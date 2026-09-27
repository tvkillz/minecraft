'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { appConfig } from '@/config'
import type { PortalSectionConfig } from '@/config/schema'
import PortalAuthGate from '@/components/auth/PortalAuthGate'
import { CollectionModeProvider } from '@/components/collection/CollectionModeContext'
import Footer from '@/components/Footer/Footer'
import PurchaseCreditsModal from '@/components/credits/PurchaseCreditsModal'
import { DepositPromptProvider, type DepositRequest } from '@/components/credits/DepositPrompt'
import { useAuth } from '@/components/providers/AuthProvider'
import { MarketCurrencyProvider, useMarketCurrency } from '@/hooks/useMarketCurrency'
import { prefetchWallet, useWallet, WalletProvider } from '@/hooks/useWallet'
import { formatMarketMoney, MARKET_CURRENCIES } from '@/lib/market/currency'
import { Button } from '@/components/ui/Button/Button'
import PortalHeader from '@/screens/Portal/PortalHeader'
import './PortalShell.css'

function resolveSectionHref(section: PortalSectionConfig): string {
  return appConfig.domain.routes[section.route]
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthGate>
      <CollectionModeProvider>
        <WalletProvider>
          <MarketCurrencyProvider>
            <PortalShellInner>{children}</PortalShellInner>
          </MarketCurrencyProvider>
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
  const [depositCents, setDepositCents] = useState<number | null>(null)
  const [depositNote, setDepositNote] = useState<string | null>(null)

  const openDeposit = useCallback((request?: DepositRequest) => {
    setDepositCents(request?.cents ?? null)
    setDepositNote(request?.note ?? null)
    setCreditsOpen(true)
  }, [])

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
  const { currency, setCurrency } = useMarketCurrency()
  const balanceLabel = walletLoading ? '…' : formatMarketMoney(balanceCredits, currency)
  const userId = user?.id ?? session?.user?.id ?? 'guest'

  useEffect(() => {
    void prefetchWallet(userId)
  }, [userId])

  return (
    <DepositPromptProvider open={openDeposit}>
      <div className="portal">
        <div className="portal__sticky-top">
          <PortalHeader onPurchaseCredits={() => openDeposit()} />
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
              <span className="portal__toolbar-balance">{balanceLabel}</span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                fantasy
                className="portal__buy-credits-btn"
                onClick={() => openDeposit()}
              >
                {portalCopy.buyCredits}
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
        initialCents={depositCents}
        note={depositNote}
        onClose={() => {
          setCreditsOpen(false)
          void refreshWallet()
        }}
      />
    </DepositPromptProvider>
  )
}
