'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { appConfig, LOCATIONS } from '@/config'
import { Button } from '../ui/Button/Button'
import FantasyFrame from '../ui/FantasyFrame/FantasyFrame'
import ImageCrossfade from '@/components/ui/ImageCrossfade/ImageCrossfade'
import { getLocationBackgroundImage } from './locationImages'
import './LocationsSection.css'

type LocationId = (typeof LOCATIONS)[number]['id']

export default function LocationsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activeLocation, setActiveLocation] = useState<LocationId>(LOCATIONS[0].id)
  const { locations: copy } = appConfig.descriptions

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsVisible(Boolean(entry?.isIntersecting))
      },
      { threshold: 0.2 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const active = useMemo(() => {
    return LOCATIONS.find((l) => l.id === activeLocation) ?? LOCATIONS[0]
  }, [activeLocation])

  return (
    <section
      ref={sectionRef}
      className={`locations${isVisible ? ' visible' : ''}`}
      aria-label="Locations"
    >
      <div className="locations__bg" aria-hidden="true">
        <ImageCrossfade
          src={getLocationBackgroundImage(active)}
          className="locations__bg-crossfade"
          imageClassName="locations__bg-image locations__bg-image--active"
          durationMs={900}
          zoom={false}
          loading="lazy"
          decoding="async"
        />
        <div className="locations__bg-scrim" />
      </div>

      <div className="landing-shell locations__inner">
        <div className="locations__grid">
          <div className="locations__left">
            <div className="locations__copy">
              <h3 className="locations__kicker">{copy.kicker}</h3>
              <div className="locations__body">
                {copy.paragraphs.map((html) => (
                  <p
                    key={html.slice(0, 32)}
                    className="locations__text"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ))}
              </div>
            </div>

            <ul className="locations__menu" role="list">
              {LOCATIONS.map((loc) => {
                const isActive = loc.id === activeLocation
                return (
                  <li key={loc.id}>
                    <Button
                      type="button"
                      variant={isActive ? 'primary' : 'secondary'}
                      size="sm"
                      className={`locations__item${
                        isActive ? ' locations__item--active' : ''
                      }`}
                      onClick={() => setActiveLocation(loc.id)}
                      onMouseEnter={() => setActiveLocation(loc.id)}
                      onFocus={() => setActiveLocation(loc.id)}
                      aria-pressed={isActive}
                    >
                      <span className="locations__item-title">{loc.name}</span>
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="locations__right" aria-label="Location preview">
            <FantasyFrame className="locations__preview" glowColor={active.glowColor}>
              <ImageCrossfade
                src={active.image}
                alt={`${active.name} realm preview`}
                className="locations__preview-crossfade"
                imageClassName="locations__image locations__image--active"
                durationMs={750}
                zoom={false}
                loading="lazy"
                decoding="async"
              />
              <div className="locations__preview-overlay" aria-hidden="true" />
            </FantasyFrame>
          </div>
        </div>
      </div>
    </section>
  )
}
