import type { CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import { appConfig, LOCATION_SLIDES } from '@/config'
import HelixHeroMedia from './HelixHeroMedia'
import HelixStarfield from './HelixStarfield'
import './styles.css'

const HelixHeroRail = dynamic(() => import('./HelixHeroRail'), { ssr: true })

export default function HelixHero() {
  const { hero } = appConfig.descriptions
  const posterUrl = LOCATION_SLIDES[0]?.image ?? ''

  return (
    <section className="helix-hero" aria-label="Hero">
      <div
        className="helix-hero__bg"
        aria-hidden="true"
        style={{ '--hero-poster': `url(${posterUrl})` } as CSSProperties}
      >
        <HelixHeroMedia />
        <div className="helix-hero__grid" aria-hidden="true" />
        <div className="helix-hero__scan" aria-hidden="true" />
        <div className="helix-hero__wash" aria-hidden="true" />
        <HelixStarfield className="helix-hero__stars" density="normal" />
        <div className="helix-hero__vignette" />
      </div>

      <div className="helix-hero__content">
        <div className="helix-hero__stage">
          <div className="helix-hero__copy">
            <p className="helix-hero__eyebrow">HELIX · SIGNAL GRID</p>

            <h1 className="helix-hero__headline">
              {hero.headline.map((line, i) => (
                <span key={line}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </h1>

            <p className="helix-hero__subheadline">{hero.subheadline}</p>
          </div>
        </div>
      </div>

      <HelixHeroRail />

      <div className="helix-hero__transition" aria-hidden="true" />
    </section>
  )
}
