'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import ProtectedNavButton from '@/components/auth/ProtectedNavButton'
import { Button } from '@/components/ui/Button/Button'
import { appConfig } from '@/config'
import type { PathwaysFeatureConfig, PathwaysTierConfig } from '@/config/schema'
import { routeRequiresAuth } from '@/lib/auth/guards'
import './PathwaysSection.css'

const MOBILE_BREAKPOINT = 919
const SECTION_THRESHOLD = 0.2
const REVEAL_THRESHOLD = 0.25
const REVEAL_ROOT_MARGIN = '5% 0px 5% 0px'

function PathwaysFeatureItem({
  feature,
  staggerIndex,
  sectionVisible,
}: {
  feature: PathwaysFeatureConfig
  staggerIndex: number
  sectionVisible: boolean
}) {
  const itemRef = useRef<HTMLLIElement>(null)
  const [inView, setInView] = useState(false)
  const isHelix = appConfig.landing?.variant === 'helix'

  useEffect(() => {
    const el = itemRef.current
    if (!el) return

    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)

    let observer: IntersectionObserver | null = null

    const attach = () => {
      observer?.disconnect()

      if (!mq.matches) {
        setInView(false)
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          setInView(Boolean(entries[0]?.isIntersecting))
        },
        { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
      )
      observer.observe(el)
    }

    attach()
    mq.addEventListener('change', attach)
    return () => {
      observer?.disconnect()
      mq.removeEventListener('change', attach)
    }
  }, [])

  const mobileVisible = sectionVisible && inView

  return (
    <li
      ref={itemRef}
      className={`pathways__item${mobileVisible ? ' pathways__item--in-view' : ''}`}
      style={{ '--pathways-stagger': staggerIndex, '--feature-glow': feature.glowColor } as CSSProperties}
    >
      <article className="pathways__card">
        {isHelix ? (
          <span className="pathways__channel" aria-hidden="true">
            CH-{String(staggerIndex + 1).padStart(2, '0')}
          </span>
        ) : null}
        <div className="pathways__media-frame">
          <img
            src={feature.image}
            alt=""
            className="pathways__image"
            loading="lazy"
            decoding="async"
          />
          {isHelix ? null : <span className="pathways__media-shine" aria-hidden="true" />}
        </div>
        <div className="pathways__copy">
          <h3 className="pathways__feature-title">{feature.title}</h3>
          <p className="pathways__feature-desc">{feature.description}</p>
        </div>
      </article>
    </li>
  )
}

function PathwaysTierItem({
  tier,
  staggerIndex,
  sectionVisible,
}: {
  tier: PathwaysTierConfig
  staggerIndex: number
  sectionVisible: boolean
}) {
  const itemRef = useRef<HTMLLIElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = itemRef.current
    if (!el) return

    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)

    let observer: IntersectionObserver | null = null

    const attach = () => {
      observer?.disconnect()

      if (!mq.matches) {
        setInView(false)
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          setInView(Boolean(entries[0]?.isIntersecting))
        },
        { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
      )
      observer.observe(el)
    }

    attach()
    mq.addEventListener('change', attach)
    return () => {
      observer?.disconnect()
      mq.removeEventListener('change', attach)
    }
  }, [])

  const mobileVisible = sectionVisible && inView

  return (
    <li
      ref={itemRef}
      className={`pathways__tier${mobileVisible ? ' pathways__tier--in-view' : ''}`}
      style={{ '--pathways-tier-stagger': staggerIndex, '--tier-glow': tier.glowColor } as CSSProperties}
    >
      <article className="pathways__tier-card">
        <span className="pathways__tier-rarity">{tier.rarityLabel}</span>
        <h3 className="pathways__tier-title">{tier.title}</h3>
        <p className="pathways__tier-desc">{tier.description}</p>
      </article>
    </li>
  )
}

export default function PathwaysSection() {
  const pathways = appConfig.descriptions.pathways
  const sectionRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [ctaInView, setCtaInView] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(Boolean(entries[0]?.isIntersecting))
      },
      { threshold: SECTION_THRESHOLD },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = ctaRef.current
    if (!el) return

    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)

    let observer: IntersectionObserver | null = null

    const attach = () => {
      observer?.disconnect()

      if (!mq.matches) {
        setCtaInView(false)
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          setCtaInView(Boolean(entries[0]?.isIntersecting))
        },
        { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
      )
      observer.observe(el)
    }

    attach()
    mq.addEventListener('change', attach)
    return () => {
      observer?.disconnect()
      mq.removeEventListener('change', attach)
    }
  }, [])

  if (!pathways?.features?.length) return null

  const isHelix = appConfig.landing?.variant === 'helix'
  const marketCta = pathways.marketCta
  const marketHref = marketCta ? appConfig.domain.routes[marketCta.route] : '#'

  return (
    <section
      ref={sectionRef}
      className={`pathways${isVisible ? ' visible' : ''}`}
      aria-label={isHelix ? 'Market ops' : 'Collect, trade, and conquer'}
    >
      <div className="landing-shell pathways__inner">
        <header className="pathways__header">
          {isHelix ? (
            <p className="pathways__eyebrow">MARKET OPS // TRADE PROTOCOL</p>
          ) : null}
          <h2 className="landing-section-title">{pathways.title}</h2>
          <p className="landing-section-lead">{pathways.description}</p>
        </header>

        <ul className="pathways__list" role="list">
          {pathways.features.map((feature, index) => (
            <PathwaysFeatureItem
              key={feature.id}
              feature={feature}
              staggerIndex={index}
              sectionVisible={isVisible}
            />
          ))}
        </ul>

        {pathways.tiers.length > 0 ? (
          <>
            {isHelix ? (
              <p className="pathways__grade-label">PRINT GRADE // SPECTRUM</p>
            ) : (
              <div className="pathways__split" aria-hidden="true" />
            )}
            <ul className="pathways__tiers" role="list">
              {pathways.tiers.map((tier, index) => (
                <PathwaysTierItem
                  key={tier.id}
                  tier={tier}
                  staggerIndex={index}
                  sectionVisible={isVisible}
                />
              ))}
            </ul>
          </>
        ) : null}

        {marketCta ? (
          <div
            ref={ctaRef}
            className={`pathways__cta${isVisible && ctaInView ? ' pathways__cta--in-view' : ''}`}
          >
            {isHelix ? (
              <span className="pathways__cta-tag" aria-hidden="true">
                LIVE FEED
              </span>
            ) : null}
            <p className="pathways__cta-lead">{marketCta.description}</p>
            {routeRequiresAuth(marketCta.route) ? (
              <ProtectedNavButton
                label={marketCta.buttonLabel}
                href={marketHref}
                variant={isHelix ? 'primary' : 'gold'}
                className="pathways__cta-btn"
              />
            ) : (
              <Button
                as="link"
                href={marketHref}
                variant={isHelix ? 'primary' : 'gold'}
                size="lg"
                fantasy={!isHelix}
                className="pathways__cta-btn"
              >
                {marketCta.buttonLabel}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
