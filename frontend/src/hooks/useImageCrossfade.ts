'use client'

import { useEffect, useRef, useState } from 'react'

export function useImageCrossfade(src: string) {
  const [layerA, setLayerA] = useState(src)
  const [layerB, setLayerB] = useState<string | null>(null)
  const [showA, setShowA] = useState(true)
  const flipFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const visible = showA ? layerA : layerB
    if (visible === src) return

    if (showA) {
      setLayerB(src)
    } else {
      setLayerA(src)
    }
  }, [src, showA, layerA, layerB])

  useEffect(() => {
    if (flipFrameRef.current !== null) {
      cancelAnimationFrame(flipFrameRef.current)
      flipFrameRef.current = null
    }

    const readyToFlip =
      (showA && layerB !== null && layerB === src && layerB !== layerA) ||
      (!showA && layerA === src && layerA !== layerB)

    if (!readyToFlip) return

    flipFrameRef.current = requestAnimationFrame(() => {
      flipFrameRef.current = requestAnimationFrame(() => {
        flipFrameRef.current = null
        setShowA((current) => !current)
      })
    })

    return () => {
      if (flipFrameRef.current !== null) {
        cancelAnimationFrame(flipFrameRef.current)
        flipFrameRef.current = null
      }
    }
  }, [layerA, layerB, showA, src])

  return { layerA, layerB, showA }
}
