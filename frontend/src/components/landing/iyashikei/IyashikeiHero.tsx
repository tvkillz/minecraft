import type { CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import { appConfig, LOCATION_SLIDES } from '@/config'
import IyashikeiHeroMedia from './IyashikeiHeroMedia'
import './styles.css'

const IyashikeiHeroCorners = dynamic(() => import('./IyashikeiHeroCorners'), { ssr: true })

const PETAL_COUNT = 14

const HERO_PETALS = Array.from({ length: PETAL_COUNT }, (_, i) => {
  const r1 = ((i * 73 + 17) % 100) / 100
  const r2 = ((i * 47 + 31) % 100) / 100
  const r3 = ((i * 91 + 7) % 100) / 100
  const [c0, c1] = appConfig.theme.particles.colors

  return {
    id: i,
    left: 4 + r1 * 92,
    delay: r3 * 12,
    duration: 16 + r2 * 12,
    color: i % 2 === 0 ? c0 : c1,
    scale: 0.7 + r2 * 0.6,
  }
})

export default function IyashikeiHero() {
  const { hero } = appConfig.descriptions
  const posterUrl = LOCATION_SLIDES[0]?.image ?? ''

  return (
    <section className="iyashikei-hero" aria-label="Hero">
      <div
        className="iyashikei-hero__bg"
        aria-hidden="true"
        style={{ '--hero-poster': `url(${posterUrl})` } as CSSProperties}
      >
        <IyashikeiHeroMedia />

        <div className="iyashikei-hero__petals" aria-hidden="true">
          {HERO_PETALS.map((petal) => (
            <span
              key={petal.id}
              className="iyashikei-hero__petal"
              style={
                {
                  left: `${petal.left}%`,
                  animationDelay: `${petal.delay}s`,
                  animationDuration: `${petal.duration}s`,
                  '--petal-color': petal.color,
                  '--petal-scale': petal.scale,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="iyashikei-hero__wash" aria-hidden="true" />
        <div className="iyashikei-hero__vignette" />
      </div>

      <IyashikeiHeroCorners />

      <div className="iyashikei-hero__content">
        <div className="iyashikei-hero__stage">
          <div className="iyashikei-hero__copy">
            <p className="iyashikei-hero__eyebrow">木漏れ日 · Komorebi</p>

            <h1 className="iyashikei-hero__headline">
              {hero.headline.map((line, i) => (
                <span key={line}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </h1>

            <p className="iyashikei-hero__subheadline">{hero.subheadline}</p>
          </div>
        </div>
      </div>
      <div className="iyashikei-hero__transition" aria-hidden="true" />
    </section>
  )
}
