'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { LOCATIONS, appConfig } from '@/config'
import { useFwSectionReveal } from '@/hooks/useFwSectionReveal'
import './pressure-map.css'

const DOMAIN_ORDER = ['striker', 'midfield', 'box', 'backline'] as const

const DOMAIN_META: Record<string, { role: string; feed: string; tempo: string; intensity: number }> = {
  striker: {
    role: 'Front line runs and final touch',
    feed: 'Front line attacking lanes open between center back shoulders.',
    tempo: 'Vertical Surges',
    intensity: 82,
  },
  midfield: {
    role: 'Tempo control and switch engine',
    feed: 'Midfield screens second balls and decides transition rhythm.',
    tempo: 'Controlled Pulse',
    intensity: 68,
  },
  box: {
    role: 'Chaos area and set piece edge',
    feed: 'Box pressure spikes from cutbacks, rebounds, and dead-ball setups.',
    tempo: 'Second-Phase Scramble',
    intensity: 75,
  },
  backline: {
    role: 'Shape anchor and last recovery',
    feed: 'Back line compacts shape and protects legacy under late pressure.',
    tempo: 'Deep Block Hold',
    intensity: 61,
  },
}

export default function FinalWhistlePressureMap() {
  const { ref, visible } = useFwSectionReveal()
  const domains = useMemo(() => {
    return [...LOCATIONS]
      .sort(
        (a, b) =>
          DOMAIN_ORDER.indexOf(a.domainId as (typeof DOMAIN_ORDER)[number]) -
          DOMAIN_ORDER.indexOf(b.domainId as (typeof DOMAIN_ORDER)[number]),
      )
      .slice(0, 4)
  }, [])
  const [activeId, setActiveId] = useState(domains[0]?.id ?? '')
  const active = domains.find((location) => location.id === activeId) ?? domains[0]
  if (!active) return null
  const activeMeta = DOMAIN_META[active.domainId] ?? DOMAIN_META.midfield

  return (
    <section
      ref={ref}
      className={`fw-pressure${visible ? ' visible' : ''}`}
      aria-label="Legacy Pressure Map"
    >
      <div className="landing-shell fw-pressure__shell">
        <header className="fw-pressure__header">
          <p className="fw-pressure__eyebrow">LIVE TACTIC FEED · 73:19</p>
          <h3 className="fw-pressure__title">Legacy Pressure Map</h3>
          <p
            className="fw-pressure__lead"
            dangerouslySetInnerHTML={{ __html: appConfig.descriptions.locations.paragraphs[0] ?? '' }}
          />
        </header>

        <div className="fw-pressure__board-wrap">
          <div className="fw-pressure__board">
            <div className="fw-pressure__pitch-lines">
              <img
                key={active.id}
                src={active.image}
                alt={`${active.name} location preview`}
                className="fw-pressure__pitch-image"
                loading="lazy"
                decoding="async"
              />
              <div className="fw-pressure__pitch-scrim" aria-hidden="true" />
            </div>
            <div className="fw-pressure__center-circle" />

            <ul className="fw-pressure__nodes" role="list" aria-label="Location channels">
              {domains.map((location, index) => {
                const isActive = location.id === active.id
                return (
                  <li
                    key={location.id}
                    className={`fw-pressure__node-slot${isActive ? ' is-active' : ''}`}
                  >
                    <button
                      type="button"
                      className={`fw-pressure__node${isActive ? ' is-active' : ''}`}
                      onMouseEnter={() => setActiveId(location.id)}
                      onFocus={() => setActiveId(location.id)}
                      onClick={() => setActiveId(location.id)}
                      aria-pressed={isActive}
                    >
                      <span className="fw-pressure__node-mark">{index + 1}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <aside className="fw-pressure__feed" aria-live="polite">
            <p className="fw-pressure__feed-label">Pressure Channel</p>
            <h4 className="fw-pressure__feed-title">{active.name}</h4>
            <p className="fw-pressure__feed-copy">{activeMeta.feed}</p>
            <dl className="fw-pressure__stats">
              <div>
                <dt>Role</dt>
                <dd>{activeMeta.role}</dd>
              </div>
              <div>
                <dt>Match Tempo</dt>
                <dd>{activeMeta.tempo}</dd>
              </div>
              <div>
                <dt>Intensity</dt>
                <dd>{activeMeta.intensity}%</dd>
              </div>
            </dl>
            <Link href={appConfig.domain.routes.play} className="fw-pressure__cta">
              Set Your Formation
            </Link>
          </aside>
        </div>
      </div>
    </section>
  )
}
