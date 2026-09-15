'use client'

import type { CSSProperties, ReactNode } from 'react'
import { FANTASY_FRAME_DUST } from './fantasyFrameDust'
import './FantasyFrame.css'

export type FantasyFrameProps = {
  children: ReactNode
  className?: string
  /** Realm / dominion glow hex — same token as DominionsSection cards. */
  glowColor?: string
  /** Floating dust motes — default on. */
  aged?: boolean
}

export default function FantasyFrame({
  children,
  className = '',
  // glowColor,
  aged = true,
}: FantasyFrameProps) {
  // const style = glowColor
  //   ? ({ '--fantasy-frame-glow-color': glowColor } as CSSProperties)
  //   : undefined

  return (
    <div
      className={`fantasy-frame${aged ? ' fantasy-frame--aged' : ''}${className ? ` ${className}` : ''}`}
      // style={style}
    >
      {aged ? (
        <div className="fantasy-frame__age" aria-hidden="true">
          <div className="fantasy-frame__patina" />
          <div className="fantasy-frame__grain" />
          <div className="fantasy-frame__vignette" />
          <div className="fantasy-frame__dust">
            {FANTASY_FRAME_DUST.map((mote) => (
              <span
                key={mote.id}
                className={`fantasy-frame__mote fantasy-frame__mote--${mote.tone}`}
                style={
                  {
                    left: `${mote.left}%`,
                    top: `${mote.top}%`,
                    width: `${mote.size}px`,
                    height: `${mote.size}px`,
                    opacity: mote.opacity,
                    animationDelay: `${mote.delay}s`,
                    animationDuration: `${mote.duration}s`,
                    '--mote-drift': `${mote.drift}px`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="fantasy-frame__inset" aria-hidden="true">
        <span className="fantasy-frame__corner fantasy-frame__corner--tl" />
        <span className="fantasy-frame__corner fantasy-frame__corner--tr" />
        <span className="fantasy-frame__corner fantasy-frame__corner--bl" />
        <span className="fantasy-frame__corner fantasy-frame__corner--br" />
      </div>
      <div className="fantasy-frame__content">{children}</div>
    </div>
  )
}
