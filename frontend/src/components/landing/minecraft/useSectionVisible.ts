import { useEffect, useRef, useState } from 'react'

export function useSectionVisible<T extends HTMLElement>(threshold = 0.14) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => setVisible(Boolean(entries[0]?.isIntersecting)),
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}
