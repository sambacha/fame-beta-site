"use client"

import { type RefObject, useEffect, useRef, useState } from "react"

/**
 * IntersectionObserver hook — drives lazy hydration and pauses live feeds
 * when a section scrolls off-screen (main-thread and battery friendly).
 */
export function useInView<T extends Element>(
  rootMargin = "160px",
): {
  ref: RefObject<T | null>
  inView: boolean
} {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
          }
        }
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
    }
  }, [rootMargin])

  return { ref, inView }
}

/** Reactive prefers-reduced-motion — pauses tickers, flashes and pulses. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => {
      setReduced(query.matches)
    }
    update()
    query.addEventListener("change", update)
    return () => {
      query.removeEventListener("change", update)
    }
  }, [])

  return reduced
}
