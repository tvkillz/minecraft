'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { appConfig, LOCATIONS } from '@/config'
import ImageCrossfade from '@/components/ui/ImageCrossfade/ImageCrossfade'
import './WildreachRangeAtlas.css'

type LocationId = (typeof LOCATIONS)[number]['id']

const RANGE_META: Record<
  string,
  { hunt: string; climate: string; bearing: string }
> = {
  serengeti: { hunt: 'Open Pursuit', climate: 'Golden Hour', bearing: 'S · 02°E' },
  bengal: { hunt: 'River Ambush', climate: 'Monsoon Veil', bearing: 'NE · 14°N' },
  patagonia: { hunt: 'Ledge Stalk', climate: 'Ember Dusk', bearing: 'SW · 41°S' },
  taiga: { hunt: 'Pack Patrol', climate: 'Boreal Quiet', bearing: 'N · 64°N' },
}

export default function WildreachRangeAtlas() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activeId, setActiveId] = useState<LocationId>(LOCATIONS[0]?.id ?? 'serengeti')
  const { locations: copy } = appConfig.descriptions

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

  const active = useMemo(
    () => LOCATIONS.find((l) => l.id === activeId) ?? LOCATIONS[0],
    [activeId],
  )

  if (!active) return null

  const meta = RANGE_META[active.domainId] ?? RANGE_META.serengeti
  const activeIndex = LOCATIONS.findIndex((l) => l.id === active.id)

  return (
    <section
      ref={sectionRef}
      className={`wr-atlas${isVisible ? ' wr-atlas--visible' : ''}`}
      aria-label="Range Atlas"
    >
      <div className="wr-atlas__bg" aria-hidden="true">
        <ImageCrossfade
          src={active.image}
          className="wr-atlas__bg-crossfade"
          imageClassName="wr-atlas__bg-photo"
          durationMs={1100}
          zoom={false}
          loading="lazy"
          decoding="async"
        />
        <div className="wr-atlas__grain" />
        <div className="wr-atlas__wash" />
      </div>

      <div className="landing-shell wr-atlas__shell">
        <header className="wr-atlas__header">
          <p className="wr-atlas__eyebrow">
            RANGE ATLAS · PLATE 0{activeIndex + 1}
          </p>
          <h3 className="wr-atlas__title">{copy.kicker}</h3>
          <p
            className="wr-atlas__lead"
            dangerouslySetInnerHTML={{ __html: copy.paragraphs[0] ?? '' }}
          />
        </header>

        <div className="wr-atlas__board">
          <aside className="wr-atlas__legend" aria-label="Ranges">
            {/* <div className="wr-atlas__trail" aria-hidden="true" /> */}
            {LOCATIONS.map((loc, i) => {
              const isActive = loc.id === activeId
              const locMeta = RANGE_META[loc.domainId] ?? RANGE_META.serengeti
              return (
                <button
                  key={loc.id}
                  type="button"
                  className={`wr-atlas__marker${isActive ? ' wr-atlas__marker--active' : ''}`}
                  style={{ '--range-glow': loc.glowColor } as CSSProperties}
                  onClick={() => setActiveId(loc.id)}
                  onMouseEnter={() => setActiveId(loc.id)}
                  onFocus={() => setActiveId(loc.id)}
                  aria-pressed={isActive}
                >
                  <span className="wr-atlas__marker-blaze" aria-hidden="true">
                    <span className="wr-atlas__marker-index">0{i + 1}</span>
                  </span>
                  <span className="wr-atlas__marker-copy">
                    <span className="wr-atlas__marker-name">{loc.name}</span>
                    <span className="wr-atlas__marker-hunt">{locMeta.hunt}</span>
                  </span>
                  <span className="wr-atlas__marker-bearing">{locMeta.bearing}</span>
                </button>
              )
            })}
          </aside>

          <div className="wr-atlas__plate">
            <div
              className="wr-atlas__frame"
              style={{ '--range-glow': active.glowColor } as CSSProperties}
            >
              <ImageCrossfade
                src={active.image}
                alt={`${active.name} range preview`}
                imageClassName="wr-atlas__feed"
                durationMs={1000}
                loading="lazy"
                decoding="async"
              />
              <div className="wr-atlas__frame-mist" aria-hidden="true" />
              <div className="wr-atlas__frame-ray" aria-hidden="true" />

              <div className="wr-atlas__overlay">
                <p className="wr-atlas__overlay-epithet">{active.epithet}</p>
                <h4 className="wr-atlas__overlay-name">{active.name}</h4>
                <p className="wr-atlas__overlay-short">{active.short}</p>
                <dl className="wr-atlas__telemetry">
                  <div>
                    <dt>Hunt</dt>
                    <dd>{meta.hunt}</dd>
                  </div>
                  <div>
                    <dt>Climate</dt>
                    <dd>{meta.climate}</dd>
                  </div>
                  <div>
                    <dt>Bearing</dt>
                    <dd>{meta.bearing}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
