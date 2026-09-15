'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { DominionCitySlide, LocationConfig } from '@/config/schema'

const SLIDE_INTERVAL_MS = 5500
const STAGGER_MS = 900

function resolveSlides(location: LocationConfig): DominionCitySlide[] {
  if (location.cities?.length) return location.cities
  const images = location.images?.length ? location.images : [location.image]
  return images.map((image, index) => ({
    image,
    name: location.name,
    description: index === 0 ? location.short : '',
  }))
}

function preloadSlide(url: string) {
  const img = new Image()
  img.src = url
}

export default function FinalWhistleZoneSlot({
  location,
  zoneIndex,
}: {
  location: LocationConfig
  zoneIndex: number
}) {
  const slotRef = useRef<HTMLElement>(null)
  const slides = useMemo(() => resolveSlides(location), [location])
  const slideCount = slides.length
  const [index, setIndex] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const manualUntilRef = useRef(0)
  const activeCity = slides[index] ?? slides[0]

  const goTo = useCallback(
    (next: number) => {
      manualUntilRef.current = Date.now() + SLIDE_INTERVAL_MS * 2
      setIndex(((next % slideCount) + slideCount) % slideCount)
    },
    [slideCount],
  )

  useEffect(() => {
    const el = slotRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => setIsInView(Boolean(entries[0]?.isIntersecting)),
      { threshold: 0.2 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (slideCount <= 1 || !isInView) return

    let timer: ReturnType<typeof window.setInterval> | undefined

    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        if (Date.now() < manualUntilRef.current) return
        setIndex((current) => (current + 1) % slideCount)
      }, SLIDE_INTERVAL_MS)
    }, zoneIndex * STAGGER_MS)

    return () => {
      window.clearTimeout(start)
      if (timer) window.clearInterval(timer)
    }
  }, [slideCount, isInView, zoneIndex])

  useEffect(() => {
    if (slideCount <= 1) return
    const nextImage = slides[(index + 1) % slideCount]?.image ?? ''
    if (nextImage) preloadSlide(nextImage)
  }, [index, slideCount, slides])

  return (
    <article
      ref={slotRef}
      className="fw-dominions__zone"
      style={{ ['--zone-glow' as string]: location.glowColor } as CSSProperties}
    >
      <div className="fw-dominions__zone-art">
        <img
          key={activeCity.image}
          src={activeCity.image}
          alt={`${activeCity.name} in ${location.name}`}
          className="fw-dominions__zone-image"
          loading="lazy"
          decoding="async"
        />
        <div className="fw-dominions__zone-scrim" aria-hidden="true" />
        <span className="fw-dominions__zone-index">{String(zoneIndex + 1).padStart(2, '0')}</span>

        {slideCount > 1 ? (
          <div
            className="fw-dominions__zone-dots"
            role="tablist"
            aria-label={`${location.name} match zones`}
          >
            {slides.map((slide, dotIndex) => (
              <button
                key={slide.image}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`${slide.name} (${dotIndex + 1} of ${slideCount})`}
                className={`fw-dominions__zone-dot${
                  dotIndex === index ? ' fw-dominions__zone-dot--active' : ''
                }`}
                onClick={() => goTo(dotIndex)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="fw-dominions__zone-copy">
        <p className="fw-dominions__zone-label">{location.categoryLabel}</p>
        <h3>{location.name}</h3>
        <p className="fw-dominions__zone-epithet">{location.epithet}</p>

        <div key={`${location.id}-${index}`} className="fw-dominions__zone-city">
          <p className="fw-dominions__zone-city-name">{activeCity.name}</p>
          <p className="fw-dominions__zone-desc">
            {activeCity.description || location.short}
          </p>
        </div>

        <p className="fw-dominions__zone-code">{location.domainId.toUpperCase()}</p>
      </div>
    </article>
  )
}
