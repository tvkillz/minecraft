'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { appConfig } from '@/config'
import type { GameModelPillarConfig } from '@/config/schema'
import './GameModelSection.css'

const MOBILE_BREAKPOINT = 919
const SECTION_THRESHOLD = 0.2
const REVEAL_THRESHOLD = 0.25
const REVEAL_ROOT_MARGIN = '5% 0px 5% 0px'

function GameModelPillarItem({
  pillar,
  staggerIndex,
  sectionVisible,
}: {
  pillar: GameModelPillarConfig
  staggerIndex: number
  sectionVisible: boolean
}) {
  const itemRef = useRef<HTMLLIElement>(null)
  const [inView, setInView] = useState(false)
  const isHelix = appConfig.landing?.variant === 'helix'

  useEffect(() => {
    const el = itemRef.current
    if (!el) return

    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)

    let observer: IntersectionObserver | null = null

    const attach = () => {
      observer?.disconnect()

      if (!mq.matches) {
        setInView(false)
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          setInView(Boolean(entries[0]?.isIntersecting))
        },
        { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
      )
      observer.observe(el)
    }

    attach()
    mq.addEventListener('change', attach)
    return () => {
      observer?.disconnect()
      mq.removeEventListener('change', attach)
    }
  }, [])

  const mobileVisible = sectionVisible && inView

  return (
    <li
      ref={itemRef}
      className={`gamemodel__item${mobileVisible ? ' gamemodel__item--in-view' : ''}`}
      style={{ '--gamemodel-stagger': staggerIndex } as CSSProperties}
    >
      <article
        className="gamemodel__card"
        style={{ '--pillar-glow': pillar.glowColor } as CSSProperties}
      >
        {isHelix ? (
          <span className="gamemodel__step" aria-hidden="true">
            STEP {String(staggerIndex + 1).padStart(2, '0')}
          </span>
        ) : null}
        <div className="gamemodel__icon-wrap">
          <img
            src={pillar.image}
            alt=""
            className="gamemodel__icon"
            loading="lazy"
            decoding="async"
          />
          <span className="gamemodel__icon-shine" aria-hidden="true" />
        </div>
        <div className="gamemodel__copy">
          <h3 className="gamemodel__card-title">{pillar.title}</h3>
          <p className="gamemodel__card-desc">{pillar.description}</p>
        </div>
      </article>
    </li>
  )
}

export default function GameModelSection() {
  const gameModel = appConfig.descriptions.gameModel
  const sectionRef = useRef<HTMLElement>(null)
  const tagsRef = useRef<HTMLUListElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [tagsInView, setTagsInView] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(Boolean(entries[0]?.isIntersecting))
      },
      { threshold: SECTION_THRESHOLD },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = tagsRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        setTagsInView(Boolean(entries[0]?.isIntersecting))
      },
      { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!gameModel?.pillars?.length) return null

  const isHelix = appConfig.landing?.variant === 'helix'

  return (
    <section
      ref={sectionRef}
      className={`gamemodel${isVisible ? ' visible' : ''}`}
      aria-label={isHelix ? 'Ops protocol' : 'Game model'}
    >
      <div className="landing-shell gamemodel__inner">
        <header className="gamemodel__header">
          {isHelix ? (
            <p className="gamemodel__eyebrow">OPS PROTOCOL // SIGNAL LOOP</p>
          ) : null}
          <h2 className="landing-section-title">{gameModel.title}</h2>
          <p className="landing-section-lead">{gameModel.description}</p>
        </header>

        <ul className="gamemodel__grid" role="list">
          {gameModel.pillars.map((pillar, index) => (
            <GameModelPillarItem
              key={pillar.id}
              pillar={pillar}
              staggerIndex={index}
              sectionVisible={isVisible}
            />
          ))}
        </ul>

        <ul
          ref={tagsRef}
          className={`gamemodel__tags${tagsInView ? ' gamemodel__tags--in-view' : ''}`}
          role="list"
        >
          {gameModel.tags.map((tag, index) => (
            <li
              key={tag.id}
              className={`gamemodel__tag-item${
                index % 2 === 0
                  ? ' gamemodel__tag-item--from-left'
                  : ' gamemodel__tag-item--from-right'
              }`}
              style={
                {
                  '--tag-stagger': index,
                  '--tag-stagger-exit': gameModel.tags.length - 1 - index,
                } as CSSProperties
              }
            >
              <span className="gamemodel__tag">
                <span className="gamemodel__tag-marker" aria-hidden="true">
                  {isHelix ? '◇' : '◆'}
                </span>
                {tag.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
