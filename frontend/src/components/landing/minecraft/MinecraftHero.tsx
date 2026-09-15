import type { CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import { appConfig, LOCATION_SLIDES } from '@/config'
import MinecraftHeroMedia from './MinecraftHeroMedia'
import './styles.css'

const MinecraftHeroBar = dynamic(() => import('./MinecraftHeroBar'), { ssr: true })
const MinecraftHeroShowcase = dynamic(() => import('./MinecraftHeroShowcase'), { ssr: true })

export default function MinecraftHero() {
  const { hero } = appConfig.descriptions
  const posterUrl = LOCATION_SLIDES[0]?.image ?? ''

  return (
    <section className="mc-hero" aria-label="Hero">
      <div
        className="mc-hero__bg"
        aria-hidden="true"
        style={{ '--hero-poster': posterUrl ? `url(${posterUrl})` : 'none' } as CSSProperties}
      >
        <MinecraftHeroMedia />
        <div className="mc-hero__wash" />
        <div className="mc-hero__vignette" />
      </div>

      <div className="mc-hero__stage">
        <MinecraftHeroBar />

        <div className="mc-hero__copy">
          <p className="mc-hero__eyebrow">{hero.joinHint ?? 'Official store'}</p>
          <h1 className="mc-hero__headline">
            {hero.headline.map((line) => (
              <span key={line} className="mc-hero__headline-line">
                {line}
              </span>
            ))}
          </h1>
          <p className="mc-hero__subheadline">{hero.subheadline}</p>
        </div>

        <MinecraftHeroShowcase />
      </div>
    </section>
  )
}
