import type { CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import { appConfig, LOCATION_SLIDES } from '@/config'
import FinalWhistleHeroMedia from './FinalWhistleHeroMedia'
import './styles.css'

const FinalWhistleHeroWall = dynamic(() => import('./FinalWhistleHeroWall'), { ssr: true })

export default function FinalWhistleHero() {
  const { hero } = appConfig.descriptions
  const posterUrl = LOCATION_SLIDES[0]?.image ?? ''

  return (
    <section className="fw-hero" aria-label="Hero">
      <div
        className="fw-hero__bg"
        aria-hidden="true"
        style={{ '--hero-poster': `url(${posterUrl})` } as CSSProperties}
      >
        <FinalWhistleHeroMedia />

        <div className="fw-hero__pitch" aria-hidden="true">
          <div className="fw-hero__pitch-stripes" />
          <div className="fw-hero__pitch-circle" />
        </div>

        <div className="fw-hero__floodlights" aria-hidden="true">
          <div className="fw-hero__beam fw-hero__beam--left" />
          <div className="fw-hero__beam fw-hero__beam--right" />
        </div>

        <div className="fw-hero__wash" aria-hidden="true" />
        <div className="fw-hero__vignette" aria-hidden="true" />
        <div className="fw-hero__grain" aria-hidden="true" />
        <div className="fw-hero__transition" aria-hidden="true" />
      </div>

      {/* <div className="fw-hero__scorebug" aria-hidden="true">
        <span className="fw-hero__live-dot" />
        <span className="fw-hero__live-label">LIVE</span>
        <span className="fw-hero__clock">45:00</span>
        <span className="fw-hero__injury">+3</span>
      </div> */}

      <div className="fw-hero__content">
        <div className="fw-hero__lower-third">
          <div className="fw-hero__lower-accent" aria-hidden="true" />
          <p className="fw-hero__eyebrow">FINAL WHISTLE · PITCH REPORT</p>

          <h1 className="fw-hero__headline">
            {hero.headline.map((line, i) => (
              <span key={line} className="fw-hero__headline-line">
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>

          <p className="fw-hero__subheadline">{hero.subheadline}</p>
        </div>
      </div>

      <FinalWhistleHeroWall />
    </section>
  )
}
