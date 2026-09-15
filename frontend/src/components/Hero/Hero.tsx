import type { CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import { appConfig, LOCATION_SLIDES } from '@/config'
import HeroMedia from './HeroMedia'
import { HERO_PARTICLES } from './heroParticles'
import './styles.css'

const HeroInteractive = dynamic(() => import('./HeroInteractive'), { ssr: true })

export default function Hero() {
  const { hero } = appConfig.descriptions
  const posterUrl = LOCATION_SLIDES[0]?.image ?? ''

  return (
    <section className="hero" aria-label="Hero">
      <div
        className="hero__bg"
        aria-hidden="true"
        style={{ '--hero-poster': `url(${posterUrl})` } as CSSProperties}
      >
        <div className="hero__glow" />

        <div className="hero__particles" aria-hidden="true">
          {HERO_PARTICLES.map((particle) => (
            <span
              key={particle.id}
              className="hero__particle"
              style={
                {
                  left: `${particle.left}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                  '--particle-color': particle.color,
                  '--particle-drift': `${particle.drift}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <HeroMedia />

        <div className="hero__vignette" />
      </div>

      <div className="hero__content">
        <h1 className="hero__headline">
          {hero.headline.map((line, i) => (
            <span key={line}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h1>

        <p className="hero__subheadline">{hero.subheadline}</p>

        <HeroInteractive />
      </div>
    </section>
  )
}
