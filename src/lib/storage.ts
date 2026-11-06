import { useCallback, useEffect, useState } from 'react'

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeStore<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStore(key, initial))
  useEffect(() => {
    writeStore(key, value)
  }, [key, value])
  return [value, setValue] as const
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export function useToast() {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const show = useCallback((message: string) => {
    setToast({ id: Date.now(), message })
  }, [])
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(id)
  }, [toast])
  return { toast, show }
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* ignore */
  }
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round(
    (new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime()) / 86400000,
  )
}
