import { useEffect, useState } from 'react'

export type CompassStatus = 'idle' | 'live' | 'denied' | 'unsupported'

type OrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number }

export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null)
  const [status, setStatus] = useState<CompassStatus>('idle')
  const supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
  const needsPermission =
    typeof window !== 'undefined' &&
    typeof (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } })
      .DeviceOrientationEvent?.requestPermission === 'function'

  useEffect(() => {
    if (!supported) {
      setStatus('unsupported')
      return
    }
    let got = false
    const handler = (event: Event) => {
      const e = event as OrientationEvent
      let value: number | null = null
      if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
        value = e.webkitCompassHeading
      } else if (typeof e.alpha === 'number' && !Number.isNaN(e.alpha)) {
        value = (360 - e.alpha) % 360
      }
      if (value !== null) {
        got = true
        setHeading(value)
        setStatus('live')
      }
    }
    window.addEventListener('deviceorientationabsolute', handler, true)
    window.addEventListener('deviceorientation', handler, true)
    const timer = window.setTimeout(() => {
      if (!got) setStatus((s) => (s === 'live' ? s : 'unsupported'))
    }, 3500)
    return () => {
      window.removeEventListener('deviceorientationabsolute', handler, true)
      window.removeEventListener('deviceorientation', handler, true)
      window.clearTimeout(timer)
    }
  }, [supported])

  const request = async () => {
    const D = (
      window as unknown as {
        DeviceOrientationEvent?: { requestPermission?: () => Promise<string> }
      }
    ).DeviceOrientationEvent
    if (typeof D?.requestPermission === 'function') {
      try {
        const result = await D.requestPermission()
        if (result !== 'granted') setStatus('denied')
        else setStatus('idle')
      } catch {
        setStatus('denied')
      }
    }
  }

  return { heading, status, request, supported, needsPermission }
}

export function angleDelta(target: number, current: number) {
  return ((target - current + 540) % 360) - 180
}
