'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import ProtectedNavButton from '@/components/auth/ProtectedNavButton'
import { Button } from '@/components/ui/Button/Button'
import { appConfig } from '@/config'
import { routeRequiresAuth } from '@/lib/auth/guards'
import { FINAL_CTA_PARTICLES } from './finalCtaParticles'
import './FinalCtaSection.css'

const SECTION_THRESHOLD = 0.2

export default function FinalCtaSection() {
  const { finalCta } = appConfig.descriptions
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const isHelix = appConfig.landing?.variant === 'helix'

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => setIsVisible(Boolean(entries[0]?.isIntersecting)),
      { threshold: SECTION_THRESHOLD },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const href = appConfig.domain.routes[finalCta.route]
  const btnVariant = isHelix ? 'primary' : 'gold'

  const playButton = routeRequiresAuth(finalCta.route) ? (
    <ProtectedNavButton
      label={finalCta.buttonLabel}
      href={href}
      variant={btnVariant}
      className="final-cta__btn"
    />
  ) : (
    <Button
      as="link"
      href={href}
      variant={btnVariant}
      size="lg"
      fantasy={!isHelix}
      className="final-cta__btn"
    >
      {finalCta.buttonLabel}
    </Button>
  )

  return (
    <section
      ref={sectionRef}
      className={`final-cta${isVisible ? ' visible' : ''}`}
      aria-label={isHelix ? 'Deploy gate' : 'Join the void'}
    >
      {finalCta.backgroundImage ? (
        <div className="final-cta__bg" aria-hidden="true">
          <img
            src={finalCta.backgroundImage}
            alt=""
            className="final-cta__bg-image"
            loading="lazy"
            decoding="async"
          />
          <div className="final-cta__bg-scrim" />
        </div>
      ) : null}

      {isHelix ? null : (
        <div className="final-cta__particles" aria-hidden="true">
          {FINAL_CTA_PARTICLES.map((particle) => (
            <span
              key={particle.id}
              className="final-cta__particle"
              style={
                {
                  left: `${particle.left}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                  '--particle-color': particle.color,
                  '--particle-drift': `${particle.drift}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className="landing-shell final-cta__inner">
        {isHelix ? (
          <div className="final-cta__gate">
            <span className="final-cta__bracket final-cta__bracket--tl" aria-hidden="true" />
            <span className="final-cta__bracket final-cta__bracket--tr" aria-hidden="true" />
            <span className="final-cta__bracket final-cta__bracket--bl" aria-hidden="true" />
            <span className="final-cta__bracket final-cta__bracket--br" aria-hidden="true" />

            <p className="final-cta__eyebrow">DEPLOY // MATCH READY</p>

            <div className="final-cta__copy">
              <h2 className="final-cta__title">{finalCta.title}</h2>
              <p className="final-cta__subtitle">{finalCta.subtitle}</p>
              <p className="final-cta__desc">{finalCta.description}</p>
            </div>

            {finalCta.siege.stats.length > 0 ? (
              <div className="final-cta__siege">
                <h3 className="final-cta__siege-title">{finalCta.siege.title}</h3>
                <ul className="final-cta__siege-stats" role="list">
                  {finalCta.siege.stats.map((stat, index) => (
                    <li key={stat.id} className="final-cta__siege-stat">
                      <span className="final-cta__siege-index" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="final-cta__siege-label">{stat.label}</span>
                      <span className="final-cta__siege-value">{stat.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="final-cta__launch">
              <span className="final-cta__launch-tag" aria-hidden="true">
                READY
              </span>
              <p className="final-cta__launch-note">Open a match and hold the Signal.</p>
              {playButton}
            </div>
          </div>
        ) : (
          <>
            <div className="final-cta__copy">
              <h2 className="final-cta__title">{finalCta.title}</h2>
              <p className="final-cta__subtitle">{finalCta.subtitle}</p>
              <p className="final-cta__desc">{finalCta.description}</p>
              {playButton}
            </div>

            {finalCta.siege.stats.length > 0 ? (
              <div className="final-cta__siege">
                <h3 className="final-cta__siege-title">{finalCta.siege.title}</h3>
                <ul className="final-cta__siege-stats" role="list">
                  {finalCta.siege.stats.map((stat) => (
                    <li key={stat.id} className="final-cta__siege-stat">
                      <span className="final-cta__siege-value">{stat.value}</span>
                      <span className="final-cta__siege-label">{stat.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
