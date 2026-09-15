'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { appConfig } from '@/config'
import type { FaqItemConfig } from '@/config/schema'
import './FaqSection.css'

const MOBILE_BREAKPOINT = 919
const SECTION_THRESHOLD = 0.2
const REVEAL_THRESHOLD = 0.25
const REVEAL_ROOT_MARGIN = '5% 0px 5% 0px'

function FaqItem({
  item,
  staggerIndex,
  sectionVisible,
  isOpen,
  onToggle,
}: {
  item: FaqItemConfig
  staggerIndex: number
  sectionVisible: boolean
  isOpen: boolean
  onToggle: () => void
}) {
  const itemRef = useRef<HTMLLIElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = itemRef.current
    if (!el) return

    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    let observer: IntersectionObserver | null = null

    const attach = () => {
      observer?.disconnect()
      if (!mq.matches) {
        setInView(false)
        return
      }
      observer = new IntersectionObserver(
        (entries) => setInView(Boolean(entries[0]?.isIntersecting)),
        { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
      )
      observer.observe(el)
    }

    attach()
    mq.addEventListener('change', attach)
    return () => {
      observer?.disconnect()
      mq.removeEventListener('change', attach)
    }
  }, [])

  const mobileVisible = sectionVisible && inView

  return (
    <li
      ref={itemRef}
      className={`faq__item${mobileVisible ? ' faq__item--in-view' : ''}${
        isOpen ? ' faq__item--open' : ''
      }`}
      style={{ '--faq-stagger': staggerIndex } as CSSProperties}
    >
      <button
        type="button"
        className="faq__question"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="faq__question-text">{item.question}</span>
        <span className="faq__chevron" aria-hidden="true" />
      </button>
      <div className="faq__answer-wrap" hidden={!isOpen}>
        <p className="faq__answer">{item.answer}</p>
      </div>
    </li>
  )
}

export default function FaqSection() {
  const { faq } = appConfig.descriptions
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => setIsVisible(Boolean(entries[0]?.isIntersecting)),
      { threshold: SECTION_THRESHOLD },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!faq?.items?.length) return null

  return (
    <section ref={sectionRef} className={`faq${isVisible ? ' visible' : ''}`} aria-label="FAQ">
      <div className="landing-shell faq__inner">
        <header className="faq__header">
          <h2 className="landing-section-title">{faq.title}</h2>
        </header>

        <ul className="faq__list" role="list">
          {faq.items.map((item, index) => (
            <FaqItem
              key={item.id}
              item={item}
              staggerIndex={index}
              sectionVisible={isVisible}
              isOpen={openId === item.id}
              onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
