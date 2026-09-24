'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useSectionVisible } from './useSectionVisible'

export default function MinecraftSection({
  id,
  eyebrow,
  title,
  lead,
  background,
  children,
  className = '',
  label,
}: {
  id?: string
  eyebrow: string
  title: string
  lead?: string
  background?: string
  children: ReactNode
  className?: string
  label?: string
}) {
  const { ref, visible } = useSectionVisible<HTMLElement>()

  return (
    <section
      ref={ref}
      id={id}
      className={`mc-section${visible ? ' mc-section--visible' : ''}${className ? ` ${className}` : ''}`}
      aria-label={label ?? title}
    >
      <div
        className="mc-section__bg"
        aria-hidden="true"
        style={{ '--mc-poster': background ? `url(${background})` : 'none' } as CSSProperties}
      >
        <div className="mc-section__wash" />
        <div className="mc-section__vignette" />
      </div>
      <div className="landing-shell mc-section__stage">
        <header className="mc-section__copy">
          <p className="mc-section__eyebrow">{eyebrow}</p>
          <h2 className="mc-section__title">{title}</h2>
          {lead ? <p className="mc-section__lead">{lead}</p> : null}
        </header>
        {children}
      </div>
    </section>
  )
}
