'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { appConfig } from '@/config'
import type { CollectionCardDisplay } from '@/config/schema'
import { useSectionVisible } from './useSectionVisible'
import './sections.css'

function prefersFinePointerHover() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function domainKicker(domain: string): string {
  if (domain === 'ranks') return 'Rank'
  if (domain === 'coins') return 'Coins'
  if (domain === 'games') return 'Minigame'
  return 'Store'
}

function startIndexForItems(items: CollectionCardDisplay[]) {
  const coins = items.findIndex((item) => item.domain === 'coins')
  if (coins >= 0) return coins
  return Math.min(2, Math.max(0, items.length - 1))
}

function firstIndexForHash(items: CollectionCardDisplay[], hash: string): number {
  const id = hash.replace(/^#/, '')
  if (!id) return -1
  const exact = items.findIndex((item) => item.slug === id || item.id === id)
  if (exact >= 0) return exact
  const domain = id === 'ranks' ? 'ranks' : id === 'coins' ? 'coins' : id === 'minigames' ? 'games' : ''
  if (!domain) return -1
  return items.findIndex((item) => item.domain === domain)
}

function GallerySlide({
  item,
  index,
  isActive,
  onActivate,
}: {
  item: CollectionCardDisplay
  index: number
  isActive: boolean
  onActivate: () => void
}) {
  const cardRef = useRef<HTMLElement>(null)
  const image = item.artUrl || item.thumbUrl

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!prefersFinePointerHover() || prefersReducedMotion()) return
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    el.style.setProperty('--tilt-x', `${((0.5 - y) * 8).toFixed(2)}deg`)
    el.style.setProperty('--tilt-y', `${((x - 0.5) * 12).toFixed(2)}deg`)
    el.style.setProperty('--glint-x', `${(x * 100).toFixed(1)}%`)
    el.style.setProperty('--glint-y', `${(y * 100).toFixed(1)}%`)
  }

  const resetTilt = () => {
    const el = cardRef.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
  }

  return (
    <li
      className={`mc-gallery__slide${isActive ? ' mc-gallery__slide--active' : ''}`}
      style={{ '--tile-glow': item.glowColor, '--slide-i': index } as CSSProperties}
    >
      <article
        ref={cardRef}
        className="mc-gallery__card"
        tabIndex={0}
        aria-current={isActive ? 'true' : undefined}
        aria-label={`${item.title}. ${item.ability?.text ?? ''}`}
        onFocus={onActivate}
        onClick={onActivate}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
      >
        <div className="mc-gallery__media">
          {image ? (
            <img
              src={image}
              alt=""
              className="mc-gallery__image"
              loading={isActive ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
            />
          ) : null}
          <div className="mc-gallery__veil" aria-hidden="true" />
          <div className="mc-gallery__glint" aria-hidden="true" />
        </div>
        <div className="mc-gallery__overlay" aria-hidden={!isActive}>
          <span className="mc-gallery__kicker">{domainKicker(item.domain)}</span>
          <h3 className="mc-gallery__name">{item.title}</h3>
          {item.ability?.text ? <p className="mc-gallery__text">{item.ability.text}</p> : null}
        </div>
      </article>
    </li>
  )
}

export default function MinecraftCatalog() {
  const collection = appConfig.descriptions.collection
  const items = collection?.cards ?? []
  const initialIndex = startIndexForItems(items)
  const { ref, visible } = useSectionVisible<HTMLElement>(0.12)
  const trackRef = useRef<HTMLUListElement>(null)
  const ignoreScrollSyncRef = useRef(false)
  const scrollLockTimer = useRef(0)
  const dragRef = useRef<{ pointerId: number; startX: number; startScroll: number; moved: boolean } | null>(null)
  const skipClickRef = useRef(false)
  const activeIndexRef = useRef(initialIndex)
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [trackReady, setTrackReady] = useState(false)
  activeIndexRef.current = activeIndex

  const syncActiveFromScroll = () => {
    if (ignoreScrollSyncRef.current) return
    const track = trackRef.current
    if (!track) return
    const slides = Array.from(track.querySelectorAll<HTMLElement>('.mc-gallery__slide'))
    if (!slides.length) return

    const trackRect = track.getBoundingClientRect()
    const centerX = trackRect.left + trackRect.width / 2
    let bestIndex = 0
    let bestDistance = Number.POSITIVE_INFINITY

    slides.forEach((slide, index) => {
      const rect = slide.getBoundingClientRect()
      const slideCenter = rect.left + rect.width / 2
      const distance = Math.abs(slideCenter - centerX)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })

    activeIndexRef.current = bestIndex
    setActiveIndex((current) => (current === bestIndex ? current : bestIndex))
  }

  const scrollSlideIntoView = (index: number, instant = false) => {
    const track = trackRef.current
    if (!track) return
    const slide = track.querySelectorAll<HTMLElement>('.mc-gallery__slide')[index]
    if (!slide) return

    const target = slide.offsetLeft + slide.offsetWidth / 2 - track.clientWidth / 2
    const behavior = instant || prefersReducedMotion() ? 'auto' : 'smooth'

    ignoreScrollSyncRef.current = true
    window.clearTimeout(scrollLockTimer.current)
    track.scrollTo({ left: Math.max(0, target), behavior })
    const unlock = () => {
      ignoreScrollSyncRef.current = false
      syncActiveFromScroll()
    }
    track.addEventListener('scrollend', unlock, { once: true })
    scrollLockTimer.current = window.setTimeout(unlock, behavior === 'auto' ? 48 : 520)
  }

  const activateIndex = (index: number) => {
    if (skipClickRef.current) return
    const next = Math.min(items.length - 1, Math.max(0, index))
    activeIndexRef.current = next
    setActiveIndex(next)
    scrollSlideIntoView(next)
  }

  useLayoutEffect(() => {
    if (!items.length) return
    const fromHash = firstIndexForHash(items, window.location.hash)
    const start = fromHash >= 0 ? fromHash : startIndexForItems(items)
    activeIndexRef.current = start
    setActiveIndex(start)

    const place = () => scrollSlideIntoView(start, true)
    place()
    const frame = window.requestAnimationFrame(place)
    const later = window.setTimeout(place, 120)
    setTrackReady(true)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(later)
    }
  }, [items.length])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onScroll = () => syncActiveFromScroll()
    const onResize = () => scrollSlideIntoView(activeIndexRef.current, true)

    track.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      track.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.clearTimeout(scrollLockTimer.current)
    }
  }, [items.length])

  useEffect(() => {
    const applyHash = () => {
      const index = firstIndexForHash(items, window.location.hash)
      if (index < 0) return
      ref.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      })
      activateIndex(index)
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [items])

  const onPointerDown = (event: ReactPointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const track = trackRef.current
    if (!track) return
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: track.scrollLeft,
      moved: false,
    }
    ignoreScrollSyncRef.current = true
    track.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLUListElement>) => {
    const drag = dragRef.current
    const track = trackRef.current
    if (!drag || drag.pointerId !== event.pointerId || !track) return
    const delta = event.clientX - drag.startX
    if (Math.abs(delta) > 6) drag.moved = true
    track.scrollLeft = drag.startScroll - delta
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLUListElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const moved = drag.moved
    dragRef.current = null
    ignoreScrollSyncRef.current = false
    if (moved) {
      skipClickRef.current = true
      window.setTimeout(() => {
        skipClickRef.current = false
      }, 80)
      syncActiveFromScroll()
      scrollSlideIntoView(activeIndexRef.current)
    }
  }

  if (!collection || !items.length) return null

  const active = items[activeIndex] ?? items[0]

  return (
    <section
      ref={ref}
      className={`mc-section mc-gallery${visible ? ' mc-section--visible' : ''}`}
      aria-label={collection.title}
      style={{ '--tile-glow': active.glowColor } as CSSProperties}
    >
      <span id="ranks" className="mc-gallery__anchor" />
      <span id="coins" className="mc-gallery__anchor" />
      <span id="minigames" className="mc-gallery__anchor" />

      <div
        className="mc-section__bg"
        aria-hidden="true"
        style={{ '--mc-poster': collection.backgroundImage ? `url(${collection.backgroundImage})` : 'none' } as CSSProperties}
      >
        <div className="mc-section__wash" />
        <div className="mc-section__vignette" />
      </div>

      <div className="landing-shell mc-section__stage">
        <header className="mc-section__copy">
          <p className="mc-section__eyebrow">The shop</p>
          <h2 className="mc-section__title">{collection.title}</h2>
          <p className="mc-section__lead">{collection.description}</p>
        </header>

        <div className="mc-gallery__frame">
          <div className="mc-gallery__rail">
            <button
              type="button"
              className="mc-gallery__nav"
              aria-label="Previous item"
              disabled={activeIndex <= 0}
              onClick={() => activateIndex(activeIndex - 1)}
            >
              ‹
            </button>
            <p className="mc-gallery__counter">
              {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </p>
            <button
              type="button"
              className="mc-gallery__nav"
              aria-label="Next item"
              disabled={activeIndex >= items.length - 1}
              onClick={() => activateIndex(activeIndex + 1)}
            >
              ›
            </button>
          </div>

          <ul
            ref={trackRef}
            className={`mc-gallery__track${trackReady ? ' mc-gallery__track--ready' : ''}`}
            role="list"
            aria-label="Store items"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {items.map((item, index) => (
              <GallerySlide
                key={item.id}
                item={item}
                index={index}
                isActive={index === activeIndex}
                onActivate={() => activateIndex(index)}
              />
            ))}
          </ul>

          <div className="mc-gallery__dots" role="tablist" aria-label="Shop position">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show ${item.title}`}
                className={`mc-gallery__dot${index === activeIndex ? ' mc-gallery__dot--active' : ''}`}
                onClick={() => activateIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
