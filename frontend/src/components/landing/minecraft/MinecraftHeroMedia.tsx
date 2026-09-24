'use client'

import { useEffect, useRef, useState } from 'react'
import ImageCrossfade from '@/components/ui/ImageCrossfade/ImageCrossfade'
import { LOCATION_SLIDES } from '@/config'

const SLIDE_INTERVAL_MS = 7000

function preloadSlide(url: string) {
  const img = new Image()
  img.src = url
}

export default function MinecraftHeroMedia() {
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
    preloadSlide(LOCATION_SLIDES[(activeSlide + 1) % slideCount]?.image ?? '')
  }, [activeSlide, slideCount])

  return (
    <div ref={rootRef} className="mc-hero__media-root">
      {activeImage ? (
        <ImageCrossfade
          src={activeImage}
          className="mc-hero__slides"
          imageClassName="mc-hero__slide"
          durationMs={900}
          zoom={false}
          decoding="async"
        />
      ) : null}
    </div>
  )
}
