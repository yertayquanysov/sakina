import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'
import Onboarding from './components/Onboarding'
import { Spinner } from './components/ui'
import { useApp } from './lib/app-context'
import Home from './pages/Home'
import Quran from './pages/Quran'
import SurahReader from './pages/SurahReader'
import Zikr from './pages/Zikr'
import Namaz from './pages/Namaz'
import Qibla from './pages/Qibla'
import Settings from './pages/Settings'

const Maps = lazy(() => import('./pages/Maps'))

export default function App() {
  const { settings } = useApp()
  const { pathname } = useLocation()
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const isReader = /^\/quran\/\d+/.test(pathname)

  return (
    <>
      {!settings.onboarded && <Onboarding />}

      <div className="mx-auto min-h-dvh max-w-md">
        <Suspense
          fallback={
            <div className="grid min-h-dvh place-items-center">
              <Spinner className="h-6 w-6 text-gold" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quran" element={<Quran />} />
            <Route path="/quran/:n" element={<SurahReader />} />
            <Route path="/zikr" element={<Zikr />} />
            <Route path="/namaz" element={<Namaz />} />
            <Route path="/qibla" element={<Qibla />} />
            <Route path="/map" element={<Maps />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      {!isReader && <BottomNav />}
      {!isReader && <InstallPrompt />}

      {!online && (
        <div className="pointer-events-none fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-[70] flex justify-center px-4">
          <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[10.5px] font-semibold text-muted shadow-card">
            <WifiOff size={12} /> Offline — saved content still works
          </div>
        </div>
      )}
    </>
  )
}
