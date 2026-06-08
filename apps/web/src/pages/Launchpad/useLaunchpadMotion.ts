import { useCallback, useEffect, useState } from 'react'

/**
 * Tracks the OS/browser "reduce motion" accessibility setting. Low-end
 * phones in battery-saver mode commonly enable this, so honouring it is
 * both an a11y win and a performance win — it lets us drop the
 * launchpad's continuous marquee/shimmer/sheen animations entirely.
 *
 * SSR-safe (returns false until mounted) and listens for live changes.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = (): void => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

/**
 * Gate for the launchpad's continuous (infinite) animations.
 *
 * Returns a callback `ref` to attach to the animated element plus an
 * `active` flag that is true only when it is actually worth spending
 * frames: the user does not prefer reduced motion, the tab is visible,
 * and the element is on screen. Off-screen marquees/shimmers on an old
 * GPU burn battery for nothing — callers pause via `animationPlayState`
 * (or skip rendering decorative overlays) when `active` is false.
 *
 * A callback ref (not a ref object) so elements that mount late — e.g.
 * the ticker, which renders nothing until trades arrive — still get
 * observed the moment they appear.
 *
 * `reduced` is surfaced separately so callers can fully remove a
 * decorative element (rather than just freeze it mid-frame) when the
 * user opts out of motion.
 */
export function useLaunchpadAnimation(): {
  ref: (el: unknown) => void
  active: boolean
  reduced: boolean
} {
  const [node, setNode] = useState<Element | null>(null)
  const reduced = usePrefersReducedMotion()
  const [inView, setInView] = useState(true)
  const [visible, setVisible] = useState(true)

  // `unknown` keeps the callback assignable to any host ref type
  // (Tamagui types refs as TamaguiElement); narrowed at runtime.
  const ref = useCallback((el: unknown) => {
    setNode(el instanceof Element ? el : null)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }
    const onVisibility = (): void => setVisible(!document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (!node) {
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.length) {
          return
        }
        const [entry] = entries
        setInView(entry.isIntersecting)
      },
      { threshold: 0 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [node])

  return { ref, active: !reduced && inView && visible, reduced }
}
