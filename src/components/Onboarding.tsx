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
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-brand-deep text-white">
      <div className="pattern pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/20 blur-[90px]" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-soft/70">
            Sakina
          </span>
          <button
            onClick={() => update({ onboarded: true })}
            className="tap rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/70"
          >
            Skip
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center text-center">
          <p className="font-arabic text-[15px] text-gold-soft/80" dir="rtl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <div className="mt-6 animate-scale-in">
            <Logo size={76} />
          </div>
          <h1 className="mt-5 font-display text-[42px] font-semibold leading-none tracking-tight">
            Sakina
          </h1>
          <p className="mt-2 font-arabic text-2xl text-gold" dir="rtl">
            سَكِينَة
          </p>
          <p className="mt-4 max-w-[30ch] text-[13.5px] leading-relaxed text-white/65">
            Tranquility for your day — prayer, remembrance and the Quran, all in
            one calm place.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-2.5">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 backdrop-blur-sm"
            >
              <f.icon size={17} className="text-gold" />
              <span className="text-[12px] font-medium text-white/85">{f.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-8">
          {step === 'welcome' ? (
            <div className="animate-fade-up rounded-[28px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md">
              <p className="mb-3 text-center text-[12px] leading-relaxed text-white/60">
                Allow location for accurate prayer times and places nearby.
              </p>
              {locationError && (
                <p className="mb-3 rounded-xl bg-danger/20 px-3 py-2 text-center text-[11.5px] text-white/85">
                  {locationError}
                </p>
              )}
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="tap flex w-full items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-3.5 text-[14px] font-bold text-brand-deep shadow-lg disabled:opacity-70"
              >
                {locating ? <Spinner /> : <MapPin size={17} />}
                {locating ? 'Finding you…' : 'Use my location'}
              </button>
              <button
                onClick={() => setStep('city')}
                className="tap mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3.5 text-[13.5px] font-semibold text-white/85"
              >
                Choose a city
                <ArrowRight size={15} />
              </button>
              <p className="mt-3 text-center text-[10.5px] leading-relaxed text-white/40">
                Your location stays on this device. Nothing is uploaded.
              </p>
            </div>
          ) : (
            <div className="animate-fade-up rounded-[28px] border border-white/10 bg-white/[0.07] p-3 backdrop-blur-md">
              <div className="mb-2 flex items-center gap-2 px-1">
                <button
                  onClick={() => setStep('welcome')}
                  className="tap grid h-8 w-8 place-items-center rounded-full bg-white/10"
                  aria-label="Back"
                >
                  <ArrowLeft size={15} />
                </button>
                <p className="text-[12px] font-semibold text-white/80">Pick your city</p>
              </div>
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <Search size={14} className="text-white/50" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search city or country"
                  className="w-full bg-transparent text-[13px] text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
              <div className="no-scrollbar max-h-[210px] overflow-y-auto">
                {cities.map((city) => (
                  <button
                    key={`${city.name}-${city.country}`}
                    onClick={() => {
                      update({ location: cityToLocation(city), onboarded: true })
                    }}
                    className="tap flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.06]"
                  >
                    <span className="text-[13px] font-medium text-white/90">
                      {city.name}
                    </span>
                    <span className="text-[10.5px] text-white/40">{city.country}</span>
                  </button>
                ))}
                {!cities.length && (
                  <p className="px-3 py-6 text-center text-[12px] text-white/50">
                    No city found. Try a larger nearby city.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-4 text-[10.5px] text-white/40">
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
