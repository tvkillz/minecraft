'use client'

import ProtectedNavButton from '@/components/auth/ProtectedNavButton'
import { Button } from '@/components/ui/Button/Button'
import { appConfig } from '@/config'
import { useFwSectionReveal } from '@/hooks/useFwSectionReveal'
import { routeRequiresAuth } from '@/lib/auth/guards'
import './final-whistle-shape.css'

export default function FinalWhistleShapeSection() {
  const { ref, visible } = useFwSectionReveal()
  const { finalCta } = appConfig.descriptions

  if (!finalCta?.title) return null

  const href = appConfig.domain.routes[finalCta.route]

  const playButton = routeRequiresAuth(finalCta.route) ? (
    <ProtectedNavButton
      label={finalCta.buttonLabel}
      href={href}
      variant="primary"
      className="fw-shape__btn"
    />
  ) : (
    <Button as="link" href={href} variant="primary" size="lg" className="fw-shape__btn">
      {finalCta.buttonLabel}
    </Button>
  )

  return (
    <section
      ref={ref}
      className={`fw-shape${visible ? ' visible' : ''}`}
      aria-label="Hold the shape — play now"
    >
      {finalCta.backgroundImage ? (
        <div className="fw-shape__bg" aria-hidden="true">
          <img
            src={finalCta.backgroundImage}
            alt=""
            className="fw-shape__bg-image"
            loading="lazy"
            decoding="async"
          />
          <div className="fw-shape__bg-scrim" />
        </div>
      ) : null}

      <div className="fw-shape__pitch" aria-hidden="true">
        <div className="fw-shape__pitch-line fw-shape__pitch-line--center" />
        <div className="fw-shape__pitch-line fw-shape__pitch-line--box-left" />
        <div className="fw-shape__pitch-line fw-shape__pitch-line--box-right" />
      </div>

      <div className="landing-shell fw-shape__shell">
        <div className="fw-shape__board">
          <span className="fw-shape__corner fw-shape__corner--tl" aria-hidden="true" />
          <span className="fw-shape__corner fw-shape__corner--tr" aria-hidden="true" />
          <span className="fw-shape__corner fw-shape__corner--bl" aria-hidden="true" />
          <span className="fw-shape__corner fw-shape__corner--br" aria-hidden="true" />

          <div className="fw-shape__main">
            <p className="fw-shape__kicker">FULL-TIME CALL · SECTION 08</p>
            <h2 className="landing-section-title fw-shape__title">{finalCta.title}</h2>
            <p className="fw-shape__subtitle">{finalCta.subtitle}</p>
            <p className="fw-shape__desc">{finalCta.description}</p>

            <div className="fw-shape__launch">
              <span className="fw-shape__launch-tag" aria-hidden="true">
                KICKOFF
              </span>
              {playButton}
            </div>
          </div>

          {finalCta.siege.stats.length > 0 ? (
            <aside className="fw-shape__scoreboard" aria-label={finalCta.siege.title}>
              <p className="fw-shape__scoreboard-label">{finalCta.siege.title}</p>
              <ul className="fw-shape__stats" role="list">
                {finalCta.siege.stats.map((stat, index) => (
                  <li key={stat.id} className="fw-shape__stat">
                    <span className="fw-shape__stat-mark" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="fw-shape__stat-value">{stat.value}</span>
                    <span className="fw-shape__stat-label">{stat.label}</span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  )
}
