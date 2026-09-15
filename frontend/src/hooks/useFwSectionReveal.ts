'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Toggles a section `visible` class whenever it enters / leaves the viewport,
 * so Final Whistle landing sections can re-play reveal transitions each scroll-in.
 */
export function useFwSectionReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduceMotion.matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisible(Boolean(entries[0]?.isIntersecting))
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}
