import type { CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import { appConfig } from '@/config'
import WildreachHeroMedia from './WildreachHeroMedia'
import './styles.css'

const WildreachHeroShowcase = dynamic(() => import('./WildreachHeroShowcase'), {
  ssr: true,
})

const DUST_COUNT = 14

const DUST_MOTES = Array.from({ length: DUST_COUNT }, (_, i) => {
  const r1 = ((i * 67 + 11) % 100) / 100
  const r2 = ((i * 41 + 23) % 100) / 100
  const r3 = ((i * 89 + 5) % 100) / 100
  return {
    id: i,
    left: 8 + r1 * 84,
    delay: r3 * 10,
    duration: 14 + r2 * 10,
    size: 2 + r2 * 3,
  }
})

export default function WildreachHero() {
  const { hero } = appConfig.descriptions
  const brand = appConfig.name.display

  return (
    <section className="wr-hero" aria-label="Hero">
      <div className="wr-hero__bg" aria-hidden="true">
        <WildreachHeroMedia />

        <div className="wr-hero__canopy" aria-hidden="true" />
        <div className="wr-hero__godrays" aria-hidden="true">
          <span className="wr-hero__ray wr-hero__ray--a" />
          <span className="wr-hero__ray wr-hero__ray--b" />
          <span className="wr-hero__ray wr-hero__ray--c" />
        </div>
        <div className="wr-hero__haze" aria-hidden="true" />
        <div className="wr-hero__dust" aria-hidden="true">
          {DUST_MOTES.map((mote) => (
            <span
              key={mote.id}
              className="wr-hero__mote"
              style={
                {
                  left: `${mote.left}%`,
                  animationDelay: `${mote.delay}s`,
                  animationDuration: `${mote.duration}s`,
                  width: `${mote.size}px`,
                  height: `${mote.size}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="wr-hero__wash" aria-hidden="true" />
        <div className="wr-hero__vignette" aria-hidden="true" />
      </div>

      <div className="wr-hero__stage">
        <div className="wr-hero__copy">
          <p className="wr-hero__eyebrow">EXPEDITION LOG · HIGH FRONTIER</p>

          <p className="wr-hero__brand">
            <span className="wr-hero__brand-glow" aria-hidden="true" />
            <span className="wr-hero__brand-text">{brand}</span>
          </p>

          <h1 className="wr-hero__headline">
            {hero.headline.map((line) => (
              <span key={line} className="wr-hero__headline-line">
                {line}
              </span>
            ))}
          </h1>

          <p className="wr-hero__subheadline">{hero.subheadline}</p>
        </div>

        <WildreachHeroShowcase />
      </div>

      <div className="wr-hero__transition" aria-hidden="true" />
    </section>
  )
}
