import { useEffect, useState } from 'react'

/** Ticks every second — for live running timers. */
export function useNow(active = true): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [active])

  return now
}
