'use client'

import { useEffect, useRef, useState } from 'react'
import { LOCATION_SLIDES } from '@/config'

const SLIDE_INTERVAL_MS = 7200

function preloadSlide(url: string) {
  const img = new Image()
  img.src = url
}

export default function HelixHeroMedia() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [isInView, setIsInView] = useState(true)

  const slideCount = LOCATION_SLIDES.length
  const activeImage = LOCATION_SLIDES[activeSlide]?.image ?? ''

  useEffect(() => {
    preloadSlide(LOCATION_SLIDES[0]?.image ?? '')
    if (slideCount > 1) preloadSlide(LOCATION_SLIDES[1]?.image ?? '')
  }, [slideCount])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => setIsInView(Boolean(entries[0]?.isIntersecting)),
      { threshold: 0.05 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView || slideCount <= 1) return

    const interval = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideCount)
    }, SLIDE_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [isInView, slideCount])

  useEffect(() => {
    if (slideCount <= 1) return
    const next = (activeSlide + 1) % slideCount
    preloadSlide(LOCATION_SLIDES[next]?.image ?? '')
  }, [activeSlide, slideCount])

  return (
    <div ref={rootRef} className="helix-hero__media-root">
      {activeImage ? (
        <div className="helix-hero__slides">
          <img
            key={activeImage}
            src={activeImage}
            alt=""
            className="helix-hero__slide"
            decoding="async"
          />
        </div>
      ) : null}
    </div>
  )
}
