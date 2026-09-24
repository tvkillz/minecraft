'use client'

import { useState } from 'react'
import { appConfig } from '@/config'
import MinecraftSection from './MinecraftSection'
import './sections.css'

export default function MinecraftFaq() {
  const { faq } = appConfig.descriptions
  const [openId, setOpenId] = useState<string | null>(null)

  if (!faq?.items?.length) return null

  return (
    <MinecraftSection
      className="mc-section--center"
      eyebrow="Questions"
      title={faq.title}
      label="FAQ"
      background={appConfig.descriptions.finalCta.backgroundImage}
    >
      <ul className="mc-faq" role="list">
        {faq.items.map((item) => {
          const isOpen = openId === item.id
          return (
            <li key={item.id} className={`mc-faq__item${isOpen ? ' mc-faq__item--open' : ''}`}>
              <button
                type="button"
                className="mc-faq__question"
                aria-expanded={isOpen}
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
              >
                <span>{item.question}</span>
                <span className="mc-faq__chevron" aria-hidden="true" />
              </button>
              <div className="mc-faq__answer" id={`${item.id}-answer`}>
                <p>{item.answer}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </MinecraftSection>
  )
}
