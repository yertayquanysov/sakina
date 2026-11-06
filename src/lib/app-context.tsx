import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { readStore, writeStore } from './storage'
import type { SavedLocation, Settings } from './types'
import { deviceTz, getPosition, reverseGeocode } from './geo'

const KEY = 'sakina:settings:v1'

export const defaultSettings: Settings = {
  theme: 'light',
  method: 'MWL',
  madhab: 'shafi',
  hijriOffset: 0,
  location: null,
  translation: true,
  fontSize: 1,
  lastRead: null,
  onboarded: false,
}

type AppContextValue = {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  setLocation: (loc: SavedLocation | null) => void
  locating: boolean
  locationError: string | null
  requestLocation: (opts?: { silent?: boolean }) => Promise<SavedLocation | null>
  toast: (message: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...defaultSettings,
    ...readStore<Partial<Settings>>(KEY, {}),
  }))
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [toastState, setToastState] = useState<{ id: number; message: string } | null>(null)

  useEffect(() => {
    writeStore(KEY, settings)
    const root = document.documentElement
    root.classList.toggle('dark', settings.theme === 'dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', settings.theme === 'dark' ? '#0A0A09' : '#FAFAF9')
  }, [settings])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const setLocation = useCallback((loc: SavedLocation | null) => {
    setSettings((prev) => ({ ...prev, location: loc }))
  }, [])

  const toast = useCallback((message: string) => {
    setToastState({ id: Date.now(), message })
  }, [])

  useEffect(() => {
    if (!toastState) return
    const id = window.setTimeout(() => setToastState(null), 2600)
    return () => window.clearTimeout(id)
  }, [toastState])

  const requestLocation = useCallback(
    async (opts?: { silent?: boolean }) => {
      setLocating(true)
      setLocationError(null)
      try {
        const pos = await getPosition()
        const { latitude, longitude } = pos.coords
        const label = await reverseGeocode(latitude, longitude)
        const loc: SavedLocation = {
          lat: latitude,
          lng: longitude,
          label,
          tz: deviceTz(),
          auto: true,
        }
        setSettings((prev) => ({ ...prev, location: loc }))
        return loc
      } catch (err) {
        const message =
          (err as { code?: number })?.code === 1
            ? 'Location permission was denied. You can pick a city instead.'
            : 'We could not get your location. Try again or pick a city.'
        setLocationError(message)
        if (!opts?.silent) toast(message)
        return null
      } finally {
        setLocating(false)
      }
    },
    [toast],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      update,
      setLocation,
      locating,
      locationError,
      requestLocation,
      toast,
    }),
    [settings, update, setLocation, locating, locationError, requestLocation, toast],
  )

  return (
    <AppContext.Provider value={value}>
      {children}
      {toastState && (
        <div
          key={toastState.id}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-5"
        >
          <div className="animate-scale-in rounded-xl bg-ink px-4 py-2.5 text-center text-[12.5px] font-medium text-bg shadow-float">
            {toastState.message}
          </div>
        </div>
      )}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
