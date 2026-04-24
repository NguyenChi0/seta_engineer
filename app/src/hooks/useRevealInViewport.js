import { useRef, useState, useEffect } from 'react'

/**
 * Adds `in-viewport` state when the element enters the viewport (for CSS in top.css).
 * @param {{ rootMargin?: string; threshold?: number; once?: boolean }} [options]
 */
export function useRevealInViewport(options = {}) {
  const { rootMargin = '0px 0px -8% 0px', threshold = 0, once = true } = options
  const ref = useRef(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setIsRevealed(true)
        if (once) obs.unobserve(el)
      },
      { root: null, rootMargin, threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin, threshold, once])

  return { ref, isRevealed }
}
