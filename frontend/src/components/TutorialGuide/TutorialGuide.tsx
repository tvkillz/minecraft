'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import Card from '@/components/CardPlaceholder/Card'
import '@/components/CardPlaceholder/styles.css'
import CardPreviewPanel from '@/components/cards/CardPreviewPanel'
import PlayRouteLink from '@/components/auth/PlayRouteLink'
import { appConfig, resolveCtaHref } from '@/config'
import type { TutorialSectionConfig, TutorialStatBulletConfig } from '@/config/schema'
import { getCardBySlug, LANDING_CARDS, toCardDisplayProps } from '@/lib/cards'
import { DOMAIN_LABEL } from '@/lib/cards/domains'
import {
  computeCardHoverPreviewPosition,
  type CardHoverPreviewPosition,
} from '@/lib/cards/hoverPreview'
import { preloadImage } from '@/lib/cards/preload'
import './TutorialGuide.css'

type HighlightTarget = 'mana' | 'attack' | 'health' | 'domain'

const CARD_HIGHLIGHT_STATS = new Set<HighlightTarget>(['mana', 'attack', 'health', 'domain'])

function TutorialCardHoverPreview({
  cardProps,
  position,
}: {
  cardProps: ReturnType<typeof toCardDisplayProps>
  position: CardHoverPreviewPosition
}) {
  return (
    <div
      className="tutorial-guide__card-popover"
      style={
        {
          '--glow-color': cardProps.glowColor,
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
        } as CSSProperties
      }
    >
      <CardPreviewPanel card={cardProps} />
    </div>
  )
}

type TutorialRealmsPanelProps = {
  activeRealmId: string | null
  exampleDomainId?: string
  onRealmHover: (domainId: string | null) => void
}

function TutorialRealmsPanel({ activeRealmId, exampleDomainId, onRealmHover }: TutorialRealmsPanelProps) {
  const dominions = appConfig.descriptions.dominions
  const locations = appConfig.theme.locations
  if (!locations.length) return null

  return (
    <section className="tutorial-guide__realms" aria-labelledby="tutorial-realms-title">
      <header className="tutorial-guide__realms-header">
        <h2 id="tutorial-realms-title" className="tutorial-guide__section-title">
          {dominions?.title ?? 'Realms'}
        </h2>
        {dominions?.description ? (
          <p className="tutorial-guide__section-body">{dominions.description}</p>
        ) : null}
      </header>

      <ul className="tutorial-guide__realms-grid" role="list">
        {locations.map((location) => {
          const isActive = activeRealmId === location.domainId
          const isOnExampleCard = exampleDomainId === location.domainId

          return (
            <li key={location.id}>
              <article
                className={`tutorial-guide__realm${
                  isActive ? ' tutorial-guide__realm--active' : ''
                }${isOnExampleCard ? ' tutorial-guide__realm--on-card' : ''}`}
                style={{ '--realm-glow': location.glowColor } as CSSProperties}
                onMouseEnter={() => onRealmHover(location.domainId)}
                onMouseLeave={() => onRealmHover(null)}
              >
                <div className="tutorial-guide__realm-badge-wrap" aria-hidden="true">
                  <div className="card card--compact tutorial-guide__realm-badge-card">
                    <div className="card__frame">
                      <div className={`card__domain card__domain--${location.domainId}`} />
                    </div>
                  </div>
                </div>
                <div className="tutorial-guide__realm-copy">
                  <p className="tutorial-guide__realm-name">{location.name}</p>
                  <p className="tutorial-guide__realm-epithet">{location.epithet}</p>
                  <p className="tutorial-guide__realm-short">{location.short}</p>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function statLabelFor(stat: TutorialStatBulletConfig['stat'], labels: typeof appConfig.descriptions.tutorial.statLabels) {
  switch (stat) {
    case 'mana':
      return labels.mana
    case 'attack':
      return labels.attack
    case 'health':
      return labels.health
    case 'domain':
      return 'Domain'
    case 'ability':
      return 'Ability'
    case 'keywords':
      return 'Keywords'
    default:
      return stat
  }
}

type TutorialSectionProps = {
  section: TutorialSectionConfig
  activeHighlight: HighlightTarget | null
  onHighlightChange: (target: HighlightTarget | null) => void
}

function TutorialSection({ section, activeHighlight, onHighlightChange }: TutorialSectionProps) {
  const { statLabels } = appConfig.descriptions.tutorial

  return (
    <section className="tutorial-guide__section" aria-labelledby={`tutorial-${section.id}`}>
      <h2 id={`tutorial-${section.id}`} className="tutorial-guide__section-title">
        {section.title}
      </h2>
      {section.body ? <p className="tutorial-guide__section-body">{section.body}</p> : null}

      {section.bullets && section.bullets.length > 0 ? (
        <ul className="tutorial-guide__bullets" role="list">
          {section.bullets.map((bullet) => {
            const isCardStat = CARD_HIGHLIGHT_STATS.has(bullet.stat as HighlightTarget)
            const isActive = isCardStat && activeHighlight === bullet.stat

            return (
              <li
                key={`${section.id}-${bullet.stat}`}
                className={`${isActive ? 'tutorial-guide__bullets-item--active' : ''}${
                  isCardStat ? ' tutorial-guide__bullets-item--highlightable' : ''
                }`.trim()}
                onMouseEnter={
                  isCardStat
                    ? () => onHighlightChange(bullet.stat as HighlightTarget)
                    : undefined
                }
                onMouseLeave={isCardStat ? () => onHighlightChange(null) : undefined}
              >
                <strong>{statLabelFor(bullet.stat, statLabels)}</strong>
                <span>{bullet.text}</span>
              </li>
            )
          })}
        </ul>
      ) : null}

      {section.steps && section.steps.length > 0 ? (
        <ol className="tutorial-guide__steps">
          {section.steps.map((step, index) => (
            <li key={`${section.id}-step-${index}`}>{step}</li>
          ))}
        </ol>
      ) : null}

      {section.items && section.items.length > 0 ? (
        <dl className="tutorial-guide__terms">
          {section.items.map((item) => (
            <div key={`${section.id}-${item.term}`} className="tutorial-guide__term">
              <dt>{item.term}</dt>
              <dd>{item.definition}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}

export default function TutorialGuide() {
  const tutorial = appConfig.descriptions.tutorial
  const [activeHighlight, setActiveHighlight] = useState<HighlightTarget | null>(null)
  const [activeRealmId, setActiveRealmId] = useState<string | null>(null)
  const [cardPreviewOpen, setCardPreviewOpen] = useState(false)
  const [previewPos, setPreviewPos] = useState<CardHoverPreviewPosition | null>(null)
  const [mounted, setMounted] = useState(false)
  const cardStageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!tutorial?.sections?.length) return null

  const exampleSlug = tutorial.exampleCardSlug || LANDING_CARDS[0]?.slug
  const exampleCard = exampleSlug ? getCardBySlug(exampleSlug) ?? LANDING_CARDS.find((c) => c.slug === exampleSlug) : LANDING_CARDS[0]
  const exampleCardProps = exampleCard ? toCardDisplayProps(exampleCard, 0) : null
  const domainLabel = exampleCard ? DOMAIN_LABEL[exampleCard.domain] ?? 'Domain' : 'Domain'
  const callouts: { id: HighlightTarget; label: string; hint: string }[] = exampleCard
    ? [
        { id: 'mana', label: tutorial.statLabels.mana, hint: 'Top-left cost' },
        { id: 'attack', label: tutorial.statLabels.attack, hint: 'Bottom-left power' },
        { id: 'health', label: tutorial.statLabels.health, hint: 'Bottom-right durability' },
        { id: 'domain', label: domainLabel, hint: 'Realm affinity' },
      ]
    : []
  const primaryHref = resolveCtaHref({ route: tutorial.cta.primaryRoute })
  const secondaryHref = tutorial.cta.secondaryRoute
    ? resolveCtaHref({ route: tutorial.cta.secondaryRoute })
    : null

  const renderRouteLink = (
    route: keyof typeof appConfig.domain.routes | undefined,
    href: string,
    className: string,
    label: string,
  ) => {
    if (route === 'play') {
      return (
        <PlayRouteLink className={className}>
          {label}
        </PlayRouteLink>
      )
    }
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    )
  }

  const showCardPreview = () => {
    if (!exampleCard) return
    const rect = cardStageRef.current?.getBoundingClientRect()
    if (!rect) return
    setPreviewPos(computeCardHoverPreviewPosition(rect))
    setCardPreviewOpen(true)
    void preloadImage(exampleCard.artUrl)
  }

  const hideCardPreview = () => {
    setCardPreviewOpen(false)
    setPreviewPos(null)
  }

  const handleStatHighlight = (target: HighlightTarget | null) => {
    setActiveHighlight(target)
    if (target === 'domain' && exampleCard) {
      setActiveRealmId(exampleCard.domain)
    } else {
      setActiveRealmId(null)
    }
  }

  const handleRealmHover = (domainId: string | null) => {
    setActiveRealmId(domainId)
    setActiveHighlight(domainId ? 'domain' : null)
  }

  return (
    <article className="tutorial-guide">
      <div className="landing-shell tutorial-guide__inner">
        <header className="tutorial-guide__header">
          {tutorial.eyebrow ? <p className="tutorial-guide__eyebrow">{tutorial.eyebrow}</p> : null}
          <h1 className="tutorial-guide__title">{tutorial.title}</h1>
          {tutorial.lead ? <p className="tutorial-guide__lead">{tutorial.lead}</p> : null}
        </header>

        {exampleCard ? (
          <div
            className={`tutorial-guide__card-panel${
              activeHighlight ? ` tutorial-guide__card-panel--highlight-${activeHighlight}` : ''
            }`}
            data-highlight={activeHighlight ?? undefined}
          >
            <div
              ref={cardStageRef}
              className="tutorial-guide__card-stage"
              onMouseEnter={showCardPreview}
              onMouseLeave={hideCardPreview}
              aria-label={`Preview ${exampleCard.title}`}
            >
              <Card
                {...toCardDisplayProps(exampleCard, 0)}
                totalCards={1}
                layoutMode="hero"
                showAbility={false}
                showKeywords={false}
                className="tutorial-guide__card"
              />
              <p className="tutorial-guide__card-hint">Hover for full card preview</p>
            </div>
            <ul className="tutorial-guide__card-callouts" role="list">
              {callouts.map((callout) => (
                <li
                  key={callout.id}
                  className={`tutorial-guide__callout tutorial-guide__callout--${callout.id}${
                    activeHighlight === callout.id ? ' tutorial-guide__callout--active' : ''
                  }`}
                  onMouseEnter={() => handleStatHighlight(callout.id)}
                  onMouseLeave={() => handleStatHighlight(null)}
                >
                  <span className="tutorial-guide__callout-label">{callout.label}</span>
                  <span className="tutorial-guide__callout-hint">{callout.hint}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {exampleCard ? (
          <TutorialRealmsPanel
            activeRealmId={activeRealmId}
            exampleDomainId={exampleCard.domain}
            onRealmHover={handleRealmHover}
          />
        ) : null}

        <div className="tutorial-guide__sections">
          {tutorial.sections.map((section) => (
            <TutorialSection
              key={section.id}
              section={section}
              activeHighlight={activeHighlight}
              onHighlightChange={handleStatHighlight}
            />
          ))}
        </div>

        <footer className="tutorial-guide__cta">
          {renderRouteLink(
            tutorial.cta.primaryRoute,
            primaryHref,
            'tutorial-guide__cta-primary',
            tutorial.cta.primaryLabel,
          )}
          {tutorial.cta.secondaryLabel && secondaryHref
            ? renderRouteLink(
                tutorial.cta.secondaryRoute,
                secondaryHref,
                'tutorial-guide__cta-secondary',
                tutorial.cta.secondaryLabel,
              )
            : null}
          {tutorial.cta.secondaryNote ? (
            <p className="tutorial-guide__cta-note">{tutorial.cta.secondaryNote}</p>
          ) : null}
        </footer>
      </div>

      {mounted && cardPreviewOpen && previewPos && exampleCardProps
        ? createPortal(
            <TutorialCardHoverPreview cardProps={exampleCardProps} position={previewPos} />,
            document.body,
          )
        : null}
    </article>
  )
}
