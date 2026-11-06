import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Compass,
  MapPin,
  MoonStar,
  Search,
  Sparkles,
} from 'lucide-react'
import Logo from './Logo'
import { CITIES, cityToLocation } from '../lib/geo'
import { useApp } from '../lib/app-context'
import { Spinner } from './ui'

const features = [
  { icon: MoonStar, label: 'Prayer times' },
  { icon: BookOpenText, label: 'The Quran' },
  { icon: Compass, label: 'Qibla compass' },
  { icon: MapPin, label: 'Mosques & halal' },
]

export default function Onboarding() {
  const { update, requestLocation, locating, locationError } = useApp()
  const [step, setStep] = useState<'welcome' | 'city'>('welcome')
  const [query, setQuery] = useState('')

  const cities = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CITIES
    return CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q),
    )
  }, [query])

  const useMyLocation = async () => {
    const loc = await requestLocation({ silent: true })
    if (loc) update({ onboarded: true })
    else setStep('city')
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-bg text-ink">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold tracking-[-0.01em]">Sakina</span>
          <button
            onClick={() => update({ onboarded: true })}
            className="tap rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-muted hover:bg-surface2"
          >
            Skip
          </button>
        </div>

        <div className="mt-10 flex flex-col items-center text-center">
          <p className="font-arabic text-[14px] text-muted" dir="rtl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <div className="mt-6 animate-scale-in">
            <Logo size={68} />
          </div>
          <h1 className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.04em]">
            Sakina
          </h1>
          <p className="mt-2 font-arabic text-[21px] text-brand" dir="rtl">
            سَكِينَة
          </p>
          <p className="mt-4 max-w-[30ch] text-[13px] leading-relaxed text-muted">
            Tranquility for your day — prayer, remembrance and the Quran, all in
            one calm place.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-3"
            >
              <f.icon size={16} className="text-brand" strokeWidth={1.8} />
              <span className="text-[11.5px] font-medium text-muted">{f.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-8">
          {step === 'welcome' ? (
            <div className="animate-fade-up">
              <p className="mb-3 text-center text-[11.5px] leading-relaxed text-muted">
                Allow location for accurate prayer times and places nearby.
              </p>
              {locationError && (
                <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-center text-[11px] text-danger">
                  {locationError}
                </p>
              )}
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="tap flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-[13.5px] font-semibold text-white disabled:opacity-70"
              >
                {locating ? <Spinner /> : <MapPin size={16} />}
                {locating ? 'Finding you…' : 'Use my location'}
              </button>
              <button
                onClick={() => setStep('city')}
                className="tap mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3.5 text-[12.5px] font-medium text-muted"
              >
                Choose a city
                <ArrowRight size={15} />
              </button>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-muted/70">
                Your location stays on this device. Nothing is uploaded.
              </p>
            </div>
          ) : (
            <div className="animate-fade-up">
              <div className="mb-2 flex items-center gap-2">
                <button
                  onClick={() => setStep('welcome')}
                  className="tap grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface2"
                  aria-label="Back"
                >
                  <ArrowLeft size={15} />
                </button>
                <p className="text-[12px] font-medium">Pick your city</p>
              </div>
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-surface2 px-3 py-2.5">
                <Search size={14} className="text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search city or country"
                  className="w-full bg-transparent text-[12.5px] placeholder:text-muted/70 focus:outline-none"
                />
              </div>
              <div className="no-scrollbar max-h-[230px] overflow-y-auto">
                {cities.map((city) => (
                  <button
                    key={`${city.name}-${city.country}`}
                    onClick={() => {
                      update({ location: cityToLocation(city), onboarded: true })
                    }}
                    className="tap flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-surface2"
                  >
                    <span className="text-[12.5px] font-medium">{city.name}</span>
                    <span className="text-[10.5px] text-muted">{city.country}</span>
                  </button>
                ))}
                {!cities.length && (
                  <p className="px-3 py-6 text-center text-[12px] text-muted">
                    No city found. Try a larger nearby city.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-4 text-[10px] text-muted/70">
            <span className="inline-flex items-center gap-1">
              <Sparkles size={12} /> Private by design
            </span>
            <span className="inline-flex items-center gap-1">
              <Compass size={12} /> Works offline
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
