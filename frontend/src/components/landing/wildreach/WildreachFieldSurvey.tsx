'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { appConfig, LOCATIONS } from '@/config'
import type { DominionCitySlide, LocationConfig } from '@/config/schema'
import ImageCrossfade from '@/components/ui/ImageCrossfade/ImageCrossfade'
import './WildreachFieldSurvey.css'

const SLIDE_INTERVAL_MS = 5600

const RANGE_SIGNAL: Record<string, { signal: string; cover: string }> = {
  serengeti: { signal: 'Pride pressure', cover: 'Open grass' },
  bengal: { signal: 'Ambush patience', cover: 'Monsoon shade' },
  patagonia: { signal: 'Ledge stalking', cover: 'Granite wind' },
  taiga: { signal: 'Pack silence', cover: 'Boreal cold' },
}

function resolveSlides(loc: LocationConfig): DominionCitySlide[] {
  if (loc.cities?.length) return loc.cities
  const images = loc.images?.length ? loc.images : [loc.image]
  return images.map((image, index) => ({
    image,
    name: loc.name,
    description: index === 0 ? loc.short : '',
  }))
}

function preload(url: string) {
  const img = new Image()
  img.src = url
}

export default function WildreachFieldSurvey() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activeRangeId, setActiveRangeId] = useState(LOCATIONS[0]?.id ?? 'serengeti')
  const [siteIndex, setSiteIndex] = useState(0)
  const [pauseAuto, setPauseAuto] = useState(false)

  const { dominions } = appConfig.descriptions
  const activeRange =
    LOCATIONS.find((loc) => loc.id === activeRangeId) ?? LOCATIONS[0]

  const slides = useMemo(
    () => (activeRange ? resolveSlides(activeRange) : []),
    [activeRange],
  )
  const activeSite = slides[siteIndex] ?? slides[0]
  const rangeMeta =
    RANGE_SIGNAL[activeRange?.domainId ?? ''] ?? RANGE_SIGNAL.serengeti
  const rangeIndex = Math.max(
    0,
    LOCATIONS.findIndex((loc) => loc.id === activeRange?.id),
  )

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

  useEffect(() => {
    setSiteIndex(0)
    setPauseAuto(false)
  }, [activeRangeId])

  useEffect(() => {
    if (!isVisible || pauseAuto || slides.length <= 1) return
    const timer = window.setInterval(() => {
      setSiteIndex((current) => (current + 1) % slides.length)
    }, SLIDE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [isVisible, pauseAuto, slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const next = slides[(siteIndex + 1) % slides.length]?.image
    if (next) preload(next)
  }, [siteIndex, slides])

  if (!activeRange || !activeSite) return null

  const siteCount = LOCATIONS.reduce(
    (sum, loc) => sum + Math.max(1, loc.cities?.length ?? loc.images?.length ?? 1),
    0,
  )

  const stepRange = (delta: number) => {
    const next =
      (rangeIndex + delta + LOCATIONS.length) % LOCATIONS.length
    const loc = LOCATIONS[next]
    if (loc) setActiveRangeId(loc.id)
  }

  return (
    <section
      ref={sectionRef}
      className={`wr-survey${isVisible ? ' wr-survey--visible' : ''}`}
      aria-label="Field Survey"
    >
      <div className="wr-survey__bg" aria-hidden="true">
        <ImageCrossfade
          src={activeSite.image}
          className="wr-survey__bg-crossfade"
          imageClassName="wr-survey__bg-photo"
          durationMs={1100}
          zoom={false}
          loading="lazy"
          decoding="async"
        />
        <div className="wr-survey__topo" />
        <div className="wr-survey__wash" />
      </div>

      <div className="landing-shell wr-survey__shell">
        <header className="wr-survey__header">
          <p className="wr-survey__eyebrow">FIELD SURVEY · HABITAT LOG 0{rangeIndex + 1}</p>
          <h2 className="wr-survey__title">{dominions.title}</h2>
          <p className="wr-survey__lead">{dominions.description}</p>
        </header>

        <div
          className="wr-survey__stage"
          style={{ '--range-glow': activeRange.glowColor } as CSSProperties}
          onMouseEnter={() => setPauseAuto(true)}
          onMouseLeave={() => setPauseAuto(false)}
        >
          <div className="wr-survey__hide">
            <ImageCrossfade
              src={activeSite.image}
              alt={`${activeSite.name} in ${activeRange.name}`}
              imageClassName="wr-survey__feed"
              durationMs={1100}
              loading="lazy"
              decoding="async"
            />

            <div className="wr-survey__scrim" aria-hidden="true" />
            <div className="wr-survey__scan" aria-hidden="true" />

            <div className="wr-survey__hud">
              <div className="wr-survey__hud-top">
                <span className="wr-survey__hud-tag">HIDE CAM</span>
                <span className="wr-survey__hud-code">
                  {activeRange.domainId.toUpperCase()} · SITE{' '}
                  {String(siteIndex + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="wr-survey__hud-bottom">
                <p className="wr-survey__site-epithet">{activeRange.epithet}</p>
                <h3 className="wr-survey__site-name">{activeSite.name}</h3>
                <p className="wr-survey__site-desc">
                  {activeSite.description || activeRange.short}
                </p>
              </div>
            </div>
          </div>

          <aside className="wr-survey__ledger" aria-label={`${activeRange.name} sites`}>
            <div className="wr-survey__ledger-head">
              <p className="wr-survey__ledger-kicker">Site ledger</p>
              <h3 className="wr-survey__ledger-range">{activeRange.name}</h3>
              <p className="wr-survey__ledger-meta">
                {activeRange.categoryLabel} · {rangeMeta.signal}
              </p>
            </div>

            <ol className="wr-survey__sites" role="list">
              {slides.map((slide, index) => {
                const isActive = index === siteIndex
                return (
                  <li key={slide.image}>
                    <button
                      type="button"
                      className={`wr-survey__site${isActive ? ' wr-survey__site--active' : ''}`}
                      aria-pressed={isActive}
                      onClick={() => {
                        setSiteIndex(index)
                        setPauseAuto(true)
                      }}
                      onMouseEnter={() => setSiteIndex(index)}
                    >
                      <span className="wr-survey__site-index" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="wr-survey__site-copy">
                        <span className="wr-survey__site-label">{slide.name}</span>
                        <span className="wr-survey__site-note">
                          {slide.description || activeRange.short}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <dl className="wr-survey__stats">
              <div>
                <dt>Cover</dt>
                <dd>{rangeMeta.cover}</dd>
              </div>
              <div>
                <dt>Ranges</dt>
                <dd>04</dd>
              </div>
              <div>
                <dt>Sites</dt>
                <dd>{String(siteCount).padStart(2, '0')}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <nav className="wr-survey__transect" aria-label="Select range">
          <button
            type="button"
            className="wr-survey__transect-arrow wr-survey__transect-arrow--prev"
            aria-label="Previous range"
            onClick={() => stepRange(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>

          <div className="wr-survey__transect-track">
            {LOCATIONS.map((loc, index) => {
              const isActive = loc.id === activeRangeId
              const meta = RANGE_SIGNAL[loc.domainId] ?? RANGE_SIGNAL.serengeti
              return (
                <button
                  key={loc.id}
                  type="button"
                  className={`wr-survey__blaze${isActive ? ' wr-survey__blaze--active' : ''}`}
                  style={{ '--range-glow': loc.glowColor } as CSSProperties}
                  aria-pressed={isActive}
                  onClick={() => setActiveRangeId(loc.id)}
                  onMouseEnter={() => setActiveRangeId(loc.id)}
                  onFocus={() => setActiveRangeId(loc.id)}
                >
                  <span className="wr-survey__blaze-index" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <span className="wr-survey__blaze-copy">
                    <span className="wr-survey__blaze-name">{loc.name}</span>
                    <span className="wr-survey__blaze-signal">{meta.signal}</span>
                  </span>
                  <span className="wr-survey__blaze-cat">{loc.categoryLabel}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="wr-survey__transect-arrow wr-survey__transect-arrow--next"
            aria-label="Next range"
            onClick={() => stepRange(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </nav>
      </div>
    </section>
  )
}
