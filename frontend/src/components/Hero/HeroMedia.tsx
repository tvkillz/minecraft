'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { appConfig, LOCATION_SLIDES } from '@/config'
import ImageCrossfade from '@/components/ui/ImageCrossfade/ImageCrossfade'

const SLIDE_INTERVAL_MS = 6000
const VIDEO_MIN_PLAY_MS = 8000

function preloadSlide(url: string) {
  const img = new Image()
  img.src = url
}

export default function HeroMedia() {
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const transitionedRef = useRef(false)
  const [showVideo, setShowVideo] = useState(true)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [slidesVisible, setSlidesVisible] = useState(false)
  const [isInView, setIsInView] = useState(true)

  const slideCount = LOCATION_SLIDES.length
  const activeImage = LOCATION_SLIDES[activeSlide]?.image ?? ''
  const posterUrl = LOCATION_SLIDES[0]?.image ?? ''

  const transitionToSlides = useCallback(() => {
    if (transitionedRef.current) return
    transitionedRef.current = true
    setShowVideo(false)
    setSlidesVisible(true)
  }, [])

  useEffect(() => {
    preloadSlide(LOCATION_SLIDES[0]?.image ?? '')
    if (slideCount > 1) preloadSlide(LOCATION_SLIDES[1]?.image ?? '')
  }, [slideCount])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        setIsInView(Boolean(entries[0]?.isIntersecting))
      },
      { threshold: 0.05 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isInView) return

    const minTimer = window.setTimeout(() => {
      if (!video.ended) transitionToSlides()
    }, VIDEO_MIN_PLAY_MS)

    const onEnded = () => {
      window.clearTimeout(minTimer)
      transitionToSlides()
    }

    const onPlaying = () => setVideoPlaying(true)

    video.addEventListener('ended', onEnded)
    video.addEventListener('playing', onPlaying)
    if (!video.paused && !video.ended) setVideoPlaying(true)

    void video.play().catch(() => {
      transitionToSlides()
    })

    return () => {
      window.clearTimeout(minTimer)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('playing', onPlaying)
    }
  }, [transitionToSlides, isInView])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isInView && showVideo) {
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isInView, showVideo])

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

  const videoClassName = [
    'hero__video',
    showVideo && 'hero__video--visible',
    videoPlaying && 'hero__video--playing',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={rootRef} className="hero__media-root">
      <video
        ref={videoRef}
        className={videoClassName}
        src={appConfig.arts.introVideo}
        poster={posterUrl}
        autoPlay
        muted
        playsInline
        preload="metadata"
        loop={false}
      />

      {activeImage ? (
        <div className={`hero__slides${slidesVisible ? ' hero__slides--visible' : ''}`}>
          <ImageCrossfade
            src={activeImage}
            imageClassName="hero__slide hero__slide--active"
            durationMs={900}
            decoding="async"
          />
        </div>
      ) : null}
    </div>
  )
}
