'use client'

import { LOCATIONS, appConfig } from '@/config'
import { useFwSectionReveal } from '@/hooks/useFwSectionReveal'
import FinalWhistleZoneSlot from './FinalWhistleZoneSlot'
import './final-whistle-dominions.css'

const DOMAIN_ORDER = ['striker', 'midfield', 'box', 'backline'] as const

const zones = [...LOCATIONS].sort(
  (a, b) =>
    DOMAIN_ORDER.indexOf(a.domainId as (typeof DOMAIN_ORDER)[number]) -
    DOMAIN_ORDER.indexOf(b.domainId as (typeof DOMAIN_ORDER)[number]),
)

export default function FinalWhistleDominionsSection() {
  const { ref, visible } = useFwSectionReveal()
  const dominions = appConfig.descriptions.dominions
  const locationsCopy = appConfig.descriptions.locations

  return (
    <section
      ref={ref}
      className={`fw-dominions${visible ? ' visible' : ''}`}
      aria-label="Pitch zones"
    >
      <div className="landing-shell fw-dominions__shell">
        <div className="fw-dominions__layout">
          <aside className="fw-dominions__panel">
            <p className="fw-dominions__kicker">MATCHDAY BOARD · SECTION 03</p>
            <h2 className="landing-section-title fw-dominions__title">{dominions.title}</h2>
            <p className="landing-section-lead fw-dominions__lead">{dominions.description}</p>

            <div className="fw-dominions__panel-body">
              {locationsCopy.paragraphs.map((html) => (
                <p
                  key={html.slice(0, 32)}
                  className="fw-dominions__panel-text"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ))}
            </div>

            <dl className="fw-dominions__panel-stats">
              <div>
                <dt>Pitch Zones</dt>
                <dd>04</dd>
              </div>
              <div>
                <dt>Match Zones</dt>
                <dd>{zones.reduce((sum, zone) => sum + (zone.cities?.length ?? 1), 0)}</dd>
              </div>
            </dl>
          </aside>

          <div className="fw-dominions__zones" role="list" aria-label="All pitch zones">
            {zones.map((location, index) => (
              <FinalWhistleZoneSlot key={location.id} location={location} zoneIndex={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
