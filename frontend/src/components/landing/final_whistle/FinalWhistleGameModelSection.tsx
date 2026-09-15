'use client'

import type { CSSProperties } from 'react'
import { appConfig } from '@/config'
import { useFwSectionReveal } from '@/hooks/useFwSectionReveal'
import './final-whistle-gamemodel.css'

const PAGE_MARKS = ['01 · KICKOFF', '02 · BUILD', '03 · CLIMB']

export default function FinalWhistleGameModelSection() {
  const { ref, visible } = useFwSectionReveal()
  const gameModel = appConfig.descriptions.gameModel

  if (!gameModel?.pillars?.length) return null

  return (
    <section
      ref={ref}
      className={`fw-programme${visible ? ' visible' : ''}`}
      aria-label="Matchday programme"
    >
      <div className="landing-shell fw-programme__shell">
        <header className="fw-programme__header">
          <p className="fw-programme__kicker">MATCHDAY PROGRAMME · SECTION 04</p>
          <h2 className="landing-section-title fw-programme__title">{gameModel.title}</h2>
          <p className="landing-section-lead fw-programme__lead">{gameModel.description}</p>
        </header>

        <div className="fw-programme__spread" role="list" aria-label="How the game works">
          {gameModel.pillars.map((pillar, index) => (
            <article
              key={pillar.id}
              role="listitem"
              className="fw-programme__page"
              style={{ ['--page-glow' as string]: pillar.glowColor } as CSSProperties}
            >
              <p className="fw-programme__page-mark">{PAGE_MARKS[index] ?? `0${index + 1}`}</p>

              <div className="fw-programme__art">
                <img
                  src={pillar.image}
                  alt=""
                  className="fw-programme__image"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <h3 className="fw-programme__page-title">{pillar.title}</h3>
              <p className="fw-programme__page-desc">{pillar.description}</p>
            </article>
          ))}
        </div>

        {gameModel.tags?.length ? (
          <footer className="fw-programme__footer">
            <p className="fw-programme__footer-label">Squad Principles</p>
            <ul className="fw-programme__tags" role="list">
              {gameModel.tags.map((tag) => (
                <li key={tag.id}>
                  <span className="fw-programme__tag">{tag.label}</span>
                </li>
              ))}
            </ul>
          </footer>
        ) : null}
      </div>
    </section>
  )
}
