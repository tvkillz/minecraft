'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { appConfig } from '@/config'
import './WildreachHuntProtocol.css'

const PASS_META: Record<string, { pass: string; verb: string }> = {
  'tactical-battles': { pass: 'STALK', verb: 'Read the range' },
  'collectible-cards': { pass: 'ASSEMBLE', verb: 'Choose your predators' },
  'ranked-climb': { pass: 'ASCEND', verb: 'Hold the season' },
}

export default function WildreachHuntProtocol() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const gameModel = appConfig.descriptions.gameModel

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

  if (!gameModel?.pillars?.length) return null

  return (
    <section
      ref={sectionRef}
      className={`wr-protocol${isVisible ? ' wr-protocol--visible' : ''}`}
      aria-label="Hunt Protocol"
    >
      <div className="wr-protocol__bg" aria-hidden="true">
        <div className="wr-protocol__grain" />
        <div className="wr-protocol__wash" />
        <div className="wr-protocol__trail-line" />
      </div>

      <div className="landing-shell wr-protocol__shell">
        <header className="wr-protocol__header">
          <p className="wr-protocol__eyebrow">FIELD BRIEF · HUNT PROTOCOL</p>
          <h2 className="wr-protocol__title">{gameModel.title}</h2>
          <p className="wr-protocol__lead">{gameModel.description}</p>
        </header>

        <ol className="wr-protocol__passes" role="list" aria-label="How Wildreach plays">
          {gameModel.pillars.map((pillar, index) => {
            const meta = PASS_META[pillar.id] ?? {
              pass: 'PASS',
              verb: pillar.title,
            }
            return (
              <li
                key={pillar.id}
                className="wr-protocol__pass"
                style={
                  {
                    '--pass-glow': pillar.glowColor,
                    '--pass-i': index,
                  } as CSSProperties
                }
              >
                <article className="wr-protocol__pass-hit">
                  <div className="wr-protocol__pass-art">
                    <img
                      src={pillar.image}
                      alt=""
                      className="wr-protocol__pass-image"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="wr-protocol__pass-mist" aria-hidden="true" />
                    <span className="wr-protocol__pass-index" aria-hidden="true">
                      0{index + 1}
                    </span>
                  </div>

                  <div className="wr-protocol__pass-copy">
                    <p className="wr-protocol__pass-phase">
                      PASS 0{index + 1} · {meta.pass}
                    </p>
                    <h3 className="wr-protocol__pass-title">{pillar.title}</h3>
                    <p className="wr-protocol__pass-verb">{meta.verb}</p>
                    <p className="wr-protocol__pass-desc">{pillar.description}</p>
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
