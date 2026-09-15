'use client'

import { useState } from 'react'
import { appConfig } from '@/config'
import type { FaqItemConfig } from '@/config/schema'
import { useFwSectionReveal } from '@/hooks/useFwSectionReveal'
import './final-whistle-faq.css'

function FaqBriefingItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: FaqItemConfig
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  const mark = String(index + 1).padStart(2, '0')

  return (
    <li className={`fw-faq__item${isOpen ? ' fw-faq__item--open' : ''}`}>
      <button
        type="button"
        className="fw-faq__question"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="fw-faq__mark" aria-hidden="true">
          Q{mark}
        </span>
        <span className="fw-faq__question-text">{item.question}</span>
        <span className="fw-faq__toggle" aria-hidden="true" />
      </button>

      <div className="fw-faq__answer-wrap" hidden={!isOpen}>
        <p className="fw-faq__answer">{item.answer}</p>
      </div>
    </li>
  )
}

export default function FinalWhistleFaqSection() {
  const { ref, visible } = useFwSectionReveal()
  const { faq } = appConfig.descriptions
  const [openId, setOpenId] = useState<string | null>(faq?.items?.[0]?.id ?? null)

  if (!faq?.items?.length) return null

  return (
    <section
      ref={ref}
      className={`fw-faq${visible ? ' visible' : ''}`}
      aria-label="Frequently asked questions"
    >
      <div className="landing-shell fw-faq__shell">
        <div className="fw-faq__layout">
          <aside className="fw-faq__panel">
            <p className="fw-faq__kicker">MATCHDAY BRIEFING · SECTION 07</p>
            <h2 className="landing-section-title fw-faq__title">{faq.title}</h2>
            <p className="fw-faq__lead">
              Straight answers for new managers — rules, credits, market access, and how to get on
              the pitch without the noise.
            </p>

            <dl className="fw-faq__meta">
              <div>
                <dt>Topics</dt>
                <dd>{String(faq.items.length).padStart(2, '0')}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>Club Notes</dd>
              </div>
            </dl>
          </aside>

          <ul className="fw-faq__list" role="list">
            {faq.items.map((item, index) => (
              <FaqBriefingItem
                key={item.id}
                item={item}
                index={index}
                isOpen={openId === item.id}
                onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
