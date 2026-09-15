'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { appConfig, LOCATIONS } from '@/config'
import HelixStarfield from './HelixStarfield'
import './HelixLocations.css'

type LocationId = (typeof LOCATIONS)[number]['id']

export default function HelixLocations() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activeLocation, setActiveLocation] = useState<LocationId>(LOCATIONS[0].id)
  const { locations: copy } = appConfig.descriptions

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => setIsVisible(Boolean(entries[0]?.isIntersecting)),
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const active = useMemo(
    () => LOCATIONS.find((l) => l.id === activeLocation) ?? LOCATIONS[0],
    [activeLocation],
  )

  const activeIndex = LOCATIONS.findIndex((l) => l.id === active.id)

  return (
    <section
      ref={sectionRef}
      className={`helix-locations${isVisible ? ' helix-locations--visible' : ''}`}
      aria-label="Labs"
    >
      <div className="helix-locations__cosmos" aria-hidden="true">
        <div className="helix-locations__cosmos-base" />
        <HelixStarfield density="dense" />
        <div className="helix-locations__cosmos-veil" />
      </div>

      <div className="landing-shell helix-locations__shell">
        <header className="helix-locations__header">
          <p className="helix-locations__eyebrow">GRID INDEX // 0{activeIndex + 1}</p>
          <h3 className="helix-locations__kicker">{copy.kicker}</h3>
          <p
            className="helix-locations__lead"
            dangerouslySetInnerHTML={{ __html: copy.paragraphs[0] ?? '' }}
          />
        </header>

        <div className="helix-locations__console">
          <aside className="helix-locations__rail" aria-label="Lab channels">
            {LOCATIONS.map((loc, i) => {
              const isActive = loc.id === activeLocation
              return (
                <button
                  key={loc.id}
                  type="button"
                  className={`helix-locations__channel${
                    isActive ? ' helix-locations__channel--active' : ''
                  }`}
                  style={{ '--channel-glow': loc.glowColor } as CSSProperties}
                  onClick={() => setActiveLocation(loc.id)}
                  onMouseEnter={() => setActiveLocation(loc.id)}
                  onFocus={() => setActiveLocation(loc.id)}
                  aria-pressed={isActive}
                >
                  <span className="helix-locations__channel-index">0{i + 1}</span>
                  <span className="helix-locations__channel-name">{loc.name}</span>
                  <span className="helix-locations__channel-dot" aria-hidden="true" />
                </button>
              )
            })}
          </aside>

          <div className="helix-locations__viewport">
            <div className="helix-locations__bezel">
              <span className="helix-locations__bracket helix-locations__bracket--tl" />
              <span className="helix-locations__bracket helix-locations__bracket--tr" />
              <span className="helix-locations__bracket helix-locations__bracket--bl" />
              <span className="helix-locations__bracket helix-locations__bracket--br" />

              <img
                key={active.id}
                src={active.image}
                alt={`${active.name} lab preview`}
                className="helix-locations__feed"
                loading="lazy"
                decoding="async"
              />

              <div className="helix-locations__telemetry">
                <span className="helix-locations__tele-label">CHANNEL</span>
                <strong className="helix-locations__tele-value">{active.name}</strong>
                <span className="helix-locations__tele-epithet">{active.epithet}</span>
              </div>

              <div className="helix-locations__scanline" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
