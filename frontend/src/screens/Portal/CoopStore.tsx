'use client'

import { useMemo, useState } from 'react'

import gameConfig from '@project/game-config'
import { CARDS_CATALOG } from '@/lib/cards'
import type { CardRecord } from '@/lib/cards/types'
import { invokeCommerceAction } from '@/lib/commerce/api'
import { MIN_CUSTOM_CREDITS } from '@/lib/commerce/creditCheckoutLimits'
import { formatMarketMoney } from '@/lib/market/currency'
import { useOpenDeposit } from '@/components/credits/DepositPrompt'
import { useMarketCurrency } from '@/hooks/useMarketCurrency'
import { useWallet } from '@/hooks/useWallet'
import './CoopStore.css'

function productFeatures(card: CardRecord): string[] {
  if (card.features?.length) return card.features
  const text = card.ability?.text?.trim()
  if (!text) return []
  return text
    .split(',')
    .map((line) => line.trim().replace(/\.$/, ''))
    .filter(Boolean)
}

export default function CoopStore() {
  const { currency } = useMarketCurrency()
  const openDeposit = useOpenDeposit()
  const { balanceCredits, loading: walletLoading, refresh: refreshWallet } = useWallet()
  const [domainFilter, setDomainFilter] = useState('all')
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const domainLabels = (gameConfig.domainLabels as Record<string, string>) ?? {}
  const domains = useMemo(() => {
    const used = new Set(CARDS_CATALOG.map((card) => card.domain))
    const fromConfig = (gameConfig.domains ?? [])
      .map((domain: { id: string }) => domain.id)
      .filter((id: string) => used.has(id))
    return fromConfig.length ? fromConfig : [...used]
  }, [])

  const products = useMemo(() => {
    return CARDS_CATALOG.filter((card) => domainFilter === 'all' || card.domain === domainFilter)
  }, [domainFilter])

  const askForPrice = (card: CardRecord, price: number) => {
    const deposit = Math.max(price, MIN_CUSTOM_CREDITS)
    const priceLabel = formatMarketMoney(price, currency)
    openDeposit({
      cents: deposit,
      note:
        deposit > price
          ? `${card.title} is ${priceLabel}. The smallest deposit is ${formatMarketMoney(MIN_CUSTOM_CREDITS, currency)}.`
          : `${card.title} is ${priceLabel}.`,
    })
  }

  const buy = async (card: CardRecord) => {
    if (busySlug) return
    const price = card.priceCents ?? 0
    if (price <= 0) return
    if (!walletLoading && balanceCredits < price) {
      askForPrice(card, price)
      setError(null)
      setNotice(null)
      return
    }
    setBusySlug(card.slug)
    setError(null)
    setNotice(null)
    const result = await invokeCommerceAction({ type: 'coop_purchase', slug: card.slug })
    setBusySlug(null)
    if (result.error) {
      if (result.error === 'insufficient_balance') {
        askForPrice(card, price)
        return
      }
      setError(result.message ?? result.error)
      return
    }
    await refreshWallet({ silent: true })
    setNotice(`${card.title} is on your account. It will show under Unlocks.`)
  }

  return (
    <div className="coop-store">
      {notice ? (
        <p className="coop-store__notice" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="coop-store__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="coop-store__filters" role="group" aria-label="Store categories">
        <button
          type="button"
          className={`coop-store__filter${domainFilter === 'all' ? ' coop-store__filter--active' : ''}`}
          aria-pressed={domainFilter === 'all'}
          onClick={() => setDomainFilter('all')}
        >
          All
        </button>
        {domains.map((domainId) => (
          <button
            key={domainId}
            type="button"
            className={`coop-store__filter${domainFilter === domainId ? ' coop-store__filter--active' : ''}`}
            aria-pressed={domainFilter === domainId}
            onClick={() => setDomainFilter(domainId)}
          >
            {domainLabels[domainId] ?? domainId}
          </button>
        ))}
      </div>

      <ul className="coop-store__grid">
        {products.map((card) => {
          const price = card.priceCents ?? 0
          const features = productFeatures(card)
          const image = card.artUrl || card.thumbUrl
          return (
            <li key={card.slug} className="coop-store__item">
              <article className="coop-store__card">
                {image ? (
                  <img src={image} alt="" className="coop-store__art" />
                ) : (
                  <div className="coop-store__art coop-store__art--empty" />
                )}
                <div className="coop-store__body">
                  <p className="coop-store__kicker">{domainLabels[card.domain] ?? card.domain}</p>
                  <h2 className="coop-store__title">{card.title}</h2>
                  {features.length ? (
                    <ul className="coop-store__features">
                      {features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  ) : null}
                  <button
                    type="button"
                    className="coop-store__buy"
                    disabled={price <= 0 || busySlug === card.slug}
                    onClick={() => void buy(card)}
                  >
                    {busySlug === card.slug
                      ? 'Buying…'
                      : price > 0
                        ? formatMarketMoney(price, currency)
                        : 'Unavailable'}
                  </button>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
