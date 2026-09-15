'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import ProtectedNavButton from '@/components/auth/ProtectedNavButton'
import { Button } from '@/components/ui/Button/Button'
import { appConfig } from '@/config'
import type { PathwaysFeatureConfig, PathwaysTierConfig } from '@/config/schema'
import { routeRequiresAuth } from '@/lib/auth/guards'
import './WildreachPathways.css'

function prefersFinePointerHover() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function middleIndex(length: number) {
  if (length <= 0) return 0
  return Math.floor((length - 1) / 2)
}

function GalleryCard({
  feature,
  index,
  isActive,
  onActivate,
}: {
  feature: PathwaysFeatureConfig
  index: number
  isActive: boolean
  onActivate: () => void
}) {
  const cardRef = useRef<HTMLElement>(null)
  const plate = String(index + 1).padStart(2, '0')

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!prefersFinePointerHover() || prefersReducedMotion()) return
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    el.style.setProperty('--tilt-x', `${((0.5 - y) * 10).toFixed(2)}deg`)
    el.style.setProperty('--tilt-y', `${((x - 0.5) * 14).toFixed(2)}deg`)
    el.style.setProperty('--glint-x', `${(x * 100).toFixed(1)}%`)
    el.style.setProperty('--glint-y', `${(y * 100).toFixed(1)}%`)
  }

  const resetTilt = () => {
    const el = cardRef.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
  }

  return (
    <li
      className={`wr-pathways__slide${isActive ? ' wr-pathways__slide--active' : ''}`}
      style={{ '--feature-glow': feature.glowColor, '--slide-i': index } as CSSProperties}
    >
      <article
        ref={cardRef}
        className="wr-pathways__card"
        tabIndex={0}
        aria-current={isActive ? 'true' : undefined}
        aria-label={`${feature.title}. ${feature.description}`}
        onFocus={onActivate}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        onClick={onActivate}
      >
        <div className="wr-pathways__card-depth" aria-hidden="true">
          <span className="wr-pathways__card-edge" />
          <span className="wr-pathways__card-edge wr-pathways__card-edge--back" />
        </div>

        <div className="wr-pathways__media">
          <img
            src={feature.image}
            alt=""
            className="wr-pathways__image"
            loading={isActive ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
          />
          <div className="wr-pathways__media-veil" aria-hidden="true" />
          <div className="wr-pathways__glint" aria-hidden="true" />
        </div>

        <span className="wr-pathways__plate" aria-hidden="true">
          {plate}
        </span>

        <div className="wr-pathways__overlay" aria-hidden={!isActive}>
          <h3 className="wr-pathways__feature-title">{feature.title}</h3>
          <p className="wr-pathways__feature-desc">{feature.description}</p>
        </div>
      </article>
    </li>
  )
}

export default function WildreachPathways() {
  const pathways = appConfig.descriptions.pathways
  const featureCount = pathways?.features?.length ?? 0
  const initialIndex = middleIndex(featureCount)

  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const ignoreScrollSyncRef = useRef(false)
  const activeIndexRef = useRef(initialIndex)
  const [isVisible, setIsVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [trackReady, setTrackReady] = useState(false)
  activeIndexRef.current = activeIndex

  const syncActiveFromScroll = () => {
    if (ignoreScrollSyncRef.current) return
    const track = trackRef.current
    if (!track) return
    const slides = Array.from(track.querySelectorAll<HTMLElement>('.wr-pathways__slide'))
    if (!slides.length) return

    const trackRect = track.getBoundingClientRect()
    const centerX = trackRect.left + trackRect.width / 2
    let bestIndex = 0
    let bestDistance = Number.POSITIVE_INFINITY

    slides.forEach((slide, index) => {
      const rect = slide.getBoundingClientRect()
      const slideCenter = rect.left + rect.width / 2
      const distance = Math.abs(slideCenter - centerX)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })

    setActiveIndex((current) => (current === bestIndex ? current : bestIndex))
  }

  const scrollSlideIntoView = (index: number, instant = false) => {
    const track = trackRef.current
    if (!track) return
    const slide = track.querySelectorAll<HTMLElement>('.wr-pathways__slide')[index]
    if (!slide) return

    const trackRect = track.getBoundingClientRect()
    const slideRect = slide.getBoundingClientRect()
    const delta =
      slideRect.left +
      slideRect.width / 2 -
      (trackRect.left + trackRect.width / 2)
    const behavior =
      instant || prefersReducedMotion() ? 'auto' : 'smooth'

    ignoreScrollSyncRef.current = true
    track.scrollTo({
      left: track.scrollLeft + delta,
      behavior,
    })
    window.setTimeout(
      () => {
        ignoreScrollSyncRef.current = false
        syncActiveFromScroll()
      },
      behavior === 'auto' ? 32 : 420,
    )
  }

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => setIsVisible(Boolean(entries[0]?.isIntersecting)),
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (!featureCount) return
    const start = middleIndex(featureCount)
    setActiveIndex(start)
    scrollSlideIntoView(start, true)
    setTrackReady(true)
  }, [featureCount])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onScroll = () => syncActiveFromScroll()
    const onResize = () => {
      scrollSlideIntoView(activeIndexRef.current, true)
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      track.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [featureCount])

  if (!pathways?.features?.length) return null

  const features = pathways.features
  const activeFeature = features[activeIndex] ?? features[initialIndex] ?? features[0]
  const marketCta = pathways.marketCta
  const marketHref = marketCta ? appConfig.domain.routes[marketCta.route] : '#'
  const activeGlow = activeFeature?.glowColor ?? '#c49a3a'

  const activateIndex = (index: number) => {
    setActiveIndex(index)
    scrollSlideIntoView(index)
  }

  const scrollBySlide = (direction: -1 | 1) => {
    const next = Math.min(features.length - 1, Math.max(0, activeIndex + direction))
    activateIndex(next)
  }

  return (
    <section
      ref={sectionRef}
      className={`wr-pathways${isVisible ? ' wr-pathways--visible' : ''}`}
      aria-label="Collect, trade, and shape the hunt"
      style={{ '--ambient-glow': activeGlow } as CSSProperties}
    >
      <div className="wr-pathways__bg" aria-hidden="true">
        <div className="wr-pathways__grain" />
        <div className="wr-pathways__wash" />
        <div className="wr-pathways__ambient" />
      </div>

      <div className="landing-shell wr-pathways__shell">
        <header className="wr-pathways__header">
          <p className="wr-pathways__eyebrow">FIELD MARKET · TRADE RANGE</p>
          <h2 className="wr-pathways__title">{pathways.title}</h2>
          <p className="wr-pathways__lead">{pathways.description}</p>
        </header>

        <div className="wr-pathways__gallery">
          <div className="wr-pathways__rail">
            <div className="wr-pathways__controls">
              <button
                type="button"
                className="wr-pathways__nav"
                aria-label="Previous pathway"
                disabled={activeIndex <= 0}
                onClick={() => scrollBySlide(-1)}
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                className="wr-pathways__nav"
                aria-label="Next pathway"
                disabled={activeIndex >= features.length - 1}
                onClick={() => scrollBySlide(1)}
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>

          <ul
            ref={trackRef}
            className={`wr-pathways__track${trackReady ? ' wr-pathways__track--ready' : ''}`}
            role="list"
            aria-label="Trade pathways gallery"
          >
            {features.map((feature, index) => (
              <GalleryCard
                key={feature.id}
                feature={feature}
                index={index}
                isActive={index === activeIndex}
                onActivate={() => activateIndex(index)}
              />
            ))}
          </ul>

          <div className="wr-pathways__dots" role="tablist" aria-label="Gallery position">
            {features.map((feature, index) => (
              <button
                key={feature.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show ${feature.title}`}
                className={`wr-pathways__dot${index === activeIndex ? ' wr-pathways__dot--active' : ''}`}
                onClick={() => activateIndex(index)}
              />
            ))}
          </div>
        </div>

        {pathways.tiers.length > 0 ? (
          <div className="wr-pathways__spectrum">
            <p className="wr-pathways__spectrum-label">PRINT SPECTRUM · RANGE GRADES</p>
            <ul className="wr-pathways__tiers" role="list" aria-label="Print spectrum">
              {pathways.tiers.map((tier: PathwaysTierConfig, index) => (
                <li
                  key={tier.id}
                  className="wr-pathways__tier"
                  style={{ '--tier-glow': tier.glowColor, '--tier-i': index } as CSSProperties}
                >
                  <article className="wr-pathways__tier-card">
                    <span className="wr-pathways__tier-corner wr-pathways__tier-corner--tl" aria-hidden="true" />
                    <span className="wr-pathways__tier-corner wr-pathways__tier-corner--tr" aria-hidden="true" />
                    <span className="wr-pathways__tier-corner wr-pathways__tier-corner--bl" aria-hidden="true" />
                    <span className="wr-pathways__tier-corner wr-pathways__tier-corner--br" aria-hidden="true" />
                    <span className="wr-pathways__tier-rarity">{tier.rarityLabel}</span>
                    <h3 className="wr-pathways__tier-title">{tier.title}</h3>
                    <p className="wr-pathways__tier-desc">{tier.description}</p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {marketCta ? (
          <aside className="wr-pathways__cta" aria-label="Market call to action">
            <div className="wr-pathways__cta-mist" aria-hidden="true" />
            <div className="wr-pathways__cta-body">
              <p className="wr-pathways__cta-tag">LIVE LISTINGS</p>
              <p className="wr-pathways__cta-lead">{marketCta.description}</p>
            </div>
            {routeRequiresAuth(marketCta.route) ? (
              <ProtectedNavButton
                label={marketCta.buttonLabel}
                href={marketHref}
                variant="gold"
                className="wr-pathways__cta-btn"
              />
            ) : (
              <Button
                as="link"
                href={marketHref}
                variant="gold"
                size="lg"
                fantasy
                className="wr-pathways__cta-btn"
              >
                {marketCta.buttonLabel}
              </Button>
            )}
          </aside>
        ) : null}
      </div>
    </section>
  )
}
