'use client'

import type { CSSProperties } from 'react'
import { useImageCrossfade } from '@/hooks/useImageCrossfade'
import './ImageCrossfade.css'

export type ImageCrossfadeProps = {
  src: string
  alt?: string
  className?: string
  imageClassName?: string
  durationMs?: number
  /** When false, only crossfades opacity (keeps static transforms on imageClassName). */
  zoom?: boolean
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
}

export default function ImageCrossfade({
  src,
  alt = '',
  className = '',
  imageClassName = '',
  durationMs = 850,
  zoom = true,
  loading,
  decoding = 'async',
}: ImageCrossfadeProps) {
  const { layerA, layerB, showA } = useImageCrossfade(src)

  const style = {
    '--crossfade-ms': `${durationMs}ms`,
  } as CSSProperties

  const layerClass = (active: boolean) =>
    ['image-crossfade__layer', imageClassName, active ? 'image-crossfade__layer--active' : '']
      .filter(Boolean)
      .join(' ')

  return (
    <div
      className={`image-crossfade${zoom ? '' : ' image-crossfade--opacity-only'} ${className}`.trim()}
      style={style}
    >
      <img
        src={layerA}
        alt={alt}
        className={layerClass(showA)}
        loading={loading}
        decoding={decoding}
      />
      {layerB ? (
        <img
          src={layerB}
          alt={alt}
          className={layerClass(!showA)}
          loading={loading}
          decoding={decoding}
          aria-hidden
        />
      ) : null}
    </div>
  )
}
