import { useState, useEffect, useRef } from 'react'

/**
 * Rolling FPS counter — 60-frame window, rAF-driven.
 * Returns null until enough frames to compute, then an integer.
 */
export function useFps() {
  const [fps, setFps] = useState(null)
  const tsRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    const tick = (ts) => {
      rafRef.current = requestAnimationFrame(tick)
      const arr = tsRef.current
      arr.push(ts)
      if (arr.length > 60) arr.shift()
      if (arr.length >= 10) {
        const elapsed = arr[arr.length - 1] - arr[0]
        if (elapsed > 0) {
          setFps(Math.round((arr.length - 1) / (elapsed / 1000)))
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return fps
}
