'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { HERO_CARDS, LOCATIONS, appConfig } from '@/config'
import type { CardDisplayProps } from '@/components/CardPlaceholder/Card'
import type { LocationConfig } from '@/config/schema'
import ImageCrossfade from '@/components/ui/ImageCrossfade/ImageCrossfade'
import { useSectionVisible } from './useSectionVisible'
import './styles.css'
import './sections.css'

type LocationId = (typeof LOCATIONS)[number]['id']

type PerkRow = {
  id: string
  kicker: string
  title: string
  text: string
  glow: string
  image?: string
}

function artForCard(card: CardDisplayProps): string {
  return card.artUrl || card.thumbUrl || ''
}

function pathwayArt(id: string): string {
  return appConfig.descriptions.pathways?.features.find((feature) => feature.id === id)?.image ?? ''
}

function perksForLocation(location: LocationConfig): PerkRow[] {
  const cards = HERO_CARDS.filter((card) => card.domain === location.domainId)
  if (cards.length) {
    return cards.map((card) => ({
      id: card.id,
      kicker: card.ability?.name ?? card.keywords?.[0] ?? location.epithet,
      title: card.title,
      text: card.ability?.text ?? location.short,
      glow: card.glowColor || location.glowColor,
      image: artForCard(card),
    }))
  }

  const { hero } = appConfig.descriptions
  const discord = appConfig.descriptions.footer?.social?.find((item) => item.id === 'discord')
  const rows: PerkRow[] = []

  if (hero.joinIp) {
    rows.push({
      id: 'join-ip',
      kicker: hero.joinHint ?? 'Java',
      title: hero.joinIp,
      text: hero.joinHint ?? 'Minecraft Java server address',
      glow: location.glowColor,
      image: pathwayArt('copy-ip') || '/assets/cta1/copy-ip.png',
    })
  }

  if (discord?.href) {
    rows.push({
      id: 'discord',
      kicker: 'Community',
      title: hero.discordLabel ?? discord.label,
      text: 'Ranked chat, priority feedback, and patch notes.',
      glow: location.glowColor,
      image: pathwayArt('join-discord') || '/assets/cta1/join-discord.png',
    })
  }

  rows.push({
    id: 'minigames',
    kicker: location.epithet,
    title: location.name,
    text: location.short,
    glow: location.glowColor,
    image: location.image || '/assets/perks/spawn-lobby.png',
  })

  return rows
}

function initialLocationId(): LocationId {
  return LOCATIONS.find((item) => item.domainId === 'ranks')?.id ?? LOCATIONS[0]?.id
}

export default function MinecraftPerks() {
  const { ref, visible } = useSectionVisible<HTMLElement>()
  const hoverTimer = useRef<number>(0)
  const [activeId, setActiveId] = useState<LocationId | undefined>(initialLocationId)
  const { locations: copy } = appConfig.descriptions
  const storeCta = appConfig.theme.heroCtas.find((cta) => cta.id === 'store')

  useEffect(() => () => window.clearTimeout(hoverTimer.current), [])

  const select = (id: LocationId, immediate = false) => {
    window.clearTimeout(hoverTimer.current)
    if (immediate) {
      setActiveId(id)
      return
    }
    hoverTimer.current = window.setTimeout(() => setActiveId(id), 160)
  }

  const active = useMemo(
    () => LOCATIONS.find((item) => item.id === activeId) ?? LOCATIONS[0],
    [activeId],
  )

  if (!active) return null

  const perks = perksForLocation(active)
  const featureArt = active.image || perks.find((row) => row.image)?.image || ''

  return (
    <section
      ref={ref}
      className={`mc-perks${visible ? ' mc-perks--visible' : ''}`}
      aria-label="Store perks"
    >
      <div className="mc-perks__bg" aria-hidden="true">
        {featureArt ? (
          <div key={active.id} className="mc-perks__bg-zoom">
            <ImageCrossfade
              src={featureArt}
              className="mc-perks__bg-fade"
              imageClassName="mc-perks__bg-image"
              durationMs={820}
              zoom={false}
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}
        <div className="mc-perks__wash" />
        <div className="mc-perks__vignette" />
      </div>

      <div className="landing-shell mc-perks__stage">
        <header className="mc-perks__copy">
          <p className="mc-perks__eyebrow">Unlock the perks</p>
          <h2 className="mc-perks__title">{copy.kicker}</h2>
          <div className="mc-perks__lead">
            {copy.paragraphs.map((html) => (
              <p key={html.slice(0, 32)} dangerouslySetInnerHTML={{ __html: html }} />
            ))}
          </div>
        </header>

        <div className="mc-perks__chips" role="group" aria-label="Perk categories">
          {LOCATIONS.map((location) => {
            const isActive = location.id === active.id
            return (
              <button
                key={location.id}
                type="button"
                aria-pressed={isActive}
                className={`mc-perks__chip${isActive ? ' mc-perks__chip--active' : ''}`}
                style={{ '--tile-glow': location.glowColor } as CSSProperties}
                onClick={() => select(location.id, true)}
                onMouseEnter={() => select(location.id)}
                onFocus={() => select(location.id, true)}
              >
                <span className="mc-perks__chip-title">{location.name}</span>
                <span className="mc-perks__chip-hint">{location.epithet}</span>
              </button>
            )
          })}
        </div>

        <div className="mc-perks__board">
          <article
            className="mc-perks__feature"
            style={{ '--tile-glow': active.glowColor } as CSSProperties}
          >
            <span className="mc-perks__feature-art">
              {featureArt ? (
                <ImageCrossfade
                  src={featureArt}
                  className="mc-perks__feature-fade"
                  imageClassName="mc-perks__feature-image"
                  durationMs={720}
                  zoom={false}
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
            </span>
            <span className="mc-perks__feature-body" key={`copy-${active.id}`}>
              <span className="mc-perks__feature-kicker">{active.epithet}</span>
              <strong className="mc-perks__feature-title">{active.name}</strong>
              <span className="mc-perks__feature-text">{active.short}</span>
            </span>
          </article>

          <div className="mc-perks__locker">
            <p className="mc-perks__locker-kicker">What you unlock</p>
            <ul className="mc-perks__slots" role="list" key={active.id}>
              {perks.map((perk) => (
                <li key={perk.id}>
                  <div className="mc-perks__slot" style={{ '--tile-glow': perk.glow } as CSSProperties}>
                    <span
                      className="mc-perks__slot-art"
                      style={{ backgroundImage: perk.image ? `url(${perk.image})` : undefined }}
                      aria-hidden="true"
                    />
                    <span className="mc-perks__slot-copy">
                      <span className="mc-perks__slot-kicker">{perk.kicker}</span>
                      <strong className="mc-perks__slot-title">{perk.title}</strong>
                      <span className="mc-perks__slot-text">{perk.text}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {storeCta ? (
              <span className="mc-perks__store">{storeCta.label}</span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
