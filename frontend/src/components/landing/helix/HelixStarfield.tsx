'use client'

import { useMemo } from 'react'
import './HelixStarfield.css'

type Star = {
  id: number
  left: string
  top: string
  size: number
  delay: string
  duration: string
  hue: 'cyan' | 'violet' | 'white'
}

function seededStars(count: number, seed: number): Star[] {
  let s = seed
  const next = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  const hues: Star['hue'][] = ['white', 'cyan', 'violet', 'white', 'white', 'cyan']
  return Array.from({ length: count }, (_, i) => {
    const r1 = next()
    const r2 = next()
    const r3 = next()
    const r4 = next()
    const r5 = next()
    return {
      id: i,
      left: `${(r1 * 100).toFixed(2)}%`,
      top: `${(r2 * 100).toFixed(2)}%`,
      size: 1 + r3 * 2.2,
      delay: `${(r4 * 6).toFixed(2)}s`,
      duration: `${(2.8 + r5 * 4.5).toFixed(2)}s`,
      hue: hues[i % hues.length],
    }
  })
}

type Props = {
  className?: string
  /** Fewer stars for thin chrome like the header */
  density?: 'sparse' | 'normal' | 'dense'
}

const COUNTS = { sparse: 28, normal: 56, dense: 84 } as const

/** Pure CSS twinkle field — no image assets. */
export default function HelixStarfield({ className = '', density = 'normal' }: Props) {
  const stars = useMemo(() => seededStars(COUNTS[density], density === 'sparse' ? 11 : 42), [density])

  return (
    <div className={`helix-stars ${className}`.trim()} aria-hidden="true">
      <div className="helix-stars__nebula" />
      {stars.map((star) => (
        <span
          key={star.id}
          className={`helix-stars__dot helix-stars__dot--${star.hue}`}
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
    </div>
  )
}
