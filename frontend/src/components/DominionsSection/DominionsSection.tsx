'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { appConfig, LOCATIONS } from '@/config'
import type { DominionCitySlide, LocationConfig } from '@/config/schema'
import ImageCrossfade from '@/components/ui/ImageCrossfade/ImageCrossfade'
import './DominionsSection.css'

const SLIDE_INTERVAL_MS = 5500
const MOBILE_BREAKPOINT = 919
const CARD_REVEAL_THRESHOLD = 0.25
const CARD_REVEAL_ROOT_MARGIN = '5% 0px 5% 0px'

function resolveSlides(loc: LocationConfig): DominionCitySlide[] {
  if (loc.cities?.length) return loc.cities
  const images = loc.images?.length ? loc.images : [loc.image]
  return images.map((image, index) => ({
    image,
    name: loc.name,
    description: index === 0 ? loc.short : '',
  }))
}

function preloadSlide(url: string) {
  const img = new Image()
  img.src = url
}

function DominionCard({ loc, bayIndex }: { loc: LocationConfig; bayIndex: number }) {
  const cardRef = useRef<HTMLElement>(null)
  const slides = useMemo(() => resolveSlides(loc), [loc])
  const slideCount = slides.length
  const [index, setIndex] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const activeCity = slides[index] ?? slides[0]
  const variant = appConfig.landing?.variant
  const typeNoun =
    variant === 'iyashikei' ? 'Location' : variant === 'helix' ? 'Lab' : 'Dominion'

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slideCount) + slideCount) % slideCount)
    },
    [slideCount],
  )

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index])
  const goNext = useCallback(() => goTo(index + 1), [goTo, index])

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        setIsInView(Boolean(entries[0]?.isIntersecting))
      },
      { threshold: 0.12 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (slideCount <= 1 || !isInView) return

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slideCount)
    }, SLIDE_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [slideCount, isInView])

  useEffect(() => {
    if (slideCount <= 1) return
    const nextImage = slides[(index + 1) % slideCount]?.image ?? ''
    if (nextImage) preloadSlide(nextImage)
  }, [index, slideCount, slides])

  return (
    <article
      ref={cardRef}
      className="dominions__card"
      style={{ '--dominion-glow': loc.glowColor } as CSSProperties}
    >
      {variant === 'helix' ? (
        <>
          <span className="dominions__bay-index" aria-hidden="true">
            BAY {String(bayIndex + 1).padStart(2, '0')}
          </span>
          <span className="dominions__bracket dominions__bracket--tl" aria-hidden="true" />
          <span className="dominions__bracket dominions__bracket--tr" aria-hidden="true" />
          <span className="dominions__bracket dominions__bracket--bl" aria-hidden="true" />
          <span className="dominions__bracket dominions__bracket--br" aria-hidden="true" />
          <div className="dominions__scanline" aria-hidden="true" />
        </>
      ) : null}

      <div className="dominions__slides" aria-hidden={slideCount <= 1}>
        <ImageCrossfade
          src={activeCity.image}
          imageClassName="dominions__slide dominions__slide--active"
          durationMs={750}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="dominions__card-overlay" aria-hidden="true" />

      <div className="dominions__card-copy">
        <h3 className="dominions__card-name">{loc.name}</h3>
        <p className="dominions__card-type">
          {loc.categoryLabel} {typeNoun}
        </p>

        <div className="dominions__city-copy" key={`${loc.id}-${index}`}>
          <h4 className="dominions__city-name">{activeCity.name}</h4>
          {activeCity.description ? (
            <p className="dominions__city-desc">{activeCity.description}</p>
          ) : null}
        </div>
      </div>

      {slideCount > 1 && (
        <div className="dominions__footer">
          <div className="dominions__dots" role="tablist" aria-label={`${loc.name} sites`}>
            {slides.map((slide, dotIndex) => (
              <button
                key={slide.image}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`${slide.name} (${dotIndex + 1} of ${slideCount})`}
                className={`dominions__dot${
                  dotIndex === index ? ' dominions__dot--active' : ''
                }`}
                onClick={() => goTo(dotIndex)}
              />
            ))}
          </div>

          <div className="dominions__arrows">
            <button
              type="button"
              className="dominions__arrow"
              aria-label={`Previous site in ${loc.name}`}
              onClick={goPrev}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="dominions__arrow"
              aria-label={`Next site in ${loc.name}`}
              onClick={goNext}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

function DominionCardItem({
  loc,
  staggerIndex,
  sectionVisible,
}: {
  loc: LocationConfig
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
          const entry = entries[0]
          setInView(Boolean(entry?.isIntersecting))
        },
        { threshold: CARD_REVEAL_THRESHOLD, rootMargin: CARD_REVEAL_ROOT_MARGIN },
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
      className={`dominions__item${mobileVisible ? ' dominions__item--in-view' : ''}`}
      style={{ '--dominions-stagger': staggerIndex } as CSSProperties}
    >
      <DominionCard loc={loc} bayIndex={staggerIndex} />
    </li>
  )
}

export default function DominionsSection() {
  const { dominions } = appConfig.descriptions
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [isSectionVisible, setIsSectionVisible] = useState(false)
  const [isHeaderInView, setIsHeaderInView] = useState(false)
  const sectionLabel =
    appConfig.landing?.variant === 'helix'
      ? 'Labs'
      : appConfig.landing?.variant === 'iyashikei'
        ? 'Locations'
        : 'Dominions'

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsSectionVisible(Boolean(entry?.isIntersecting))
      },
      { threshold: 0.12 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)

    let observer: IntersectionObserver | null = null

    const attach = () => {
      observer?.disconnect()

      if (!mq.matches) {
        setIsHeaderInView(true)
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          setIsHeaderInView(Boolean(entry?.isIntersecting))
        },
        { threshold: 0.2, rootMargin: '0px 0px 5% 0px' },
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

  const showHeader = isSectionVisible && isHeaderInView

  return (
    <section
      ref={sectionRef}
      className={`dominions${isSectionVisible ? ' visible' : ''}`}
      aria-label={sectionLabel}
    >
      <div className="landing-shell dominions__inner">
        <header
          ref={headerRef}
          className={`dominions__header${showHeader ? ' dominions__header--visible' : ''}`}
        >
          <h2 className="landing-section-title">{dominions.title}</h2>
          <p
            className="landing-section-lead"
            dangerouslySetInnerHTML={{ __html: dominions.description }}
          />
        </header>

        <ul className="dominions__grid" role="list">
          {LOCATIONS.map((loc, index) => (
            <DominionCardItem
              key={loc.id}
              loc={loc}
              staggerIndex={index}
              sectionVisible={isSectionVisible}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
