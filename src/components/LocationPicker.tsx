import { useMemo, useState } from 'react'
import { Check, LocateFixed, MapPin, Search } from 'lucide-react'
import { useApp } from '../lib/app-context'
import { CITIES, cityToLocation } from '../lib/geo'
import { Sheet, Spinner } from './ui'

export default function LocationPicker({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { settings, update, requestLocation, locating, locationError } = useApp()
  const [query, setQuery] = useState('')

  const cities = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CITIES
    return CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Your location"
      subtitle="Used for prayer times, Qibla and nearby places"
    >
      <button
        onClick={async () => {
          const loc = await requestLocation()
          if (loc) onClose()
        }}
        disabled={locating}
        className="tap mb-3 flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left disabled:opacity-70"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface2 text-brand">
          {locating ? <Spinner /> : <LocateFixed size={17} />}
        </span>
        <span className="flex-1">
          <span className="block text-[12.5px] font-medium">
            {locating ? 'Finding your location…' : 'Use my current location'}
          </span>
          <span className="block text-[10.5px] text-muted">
            Most accurate — uses GPS
          </span>
        </span>
      </button>

      {locationError && (
        <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-[11px] text-danger">
          {locationError}
        </p>
      )}

      <div className="mb-2 flex items-center gap-2 rounded-xl bg-surface2 px-3 py-2.5">
        <Search size={15} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a city or country"
          className="w-full bg-transparent text-[12.5px] placeholder:text-muted/70 focus:outline-none"
        />
      </div>

      <div className="max-h-[46dvh] overflow-y-auto pb-2">
        {cities.map((city) => {
          const active =
            settings.location &&
            Math.abs(settings.location.lat - city.lat) < 0.01 &&
            Math.abs(settings.location.lng - city.lng) < 0.01
          return (
            <button
              key={`${city.name}-${city.country}`}
              onClick={() => {
                update({ location: cityToLocation(city) })
                onClose()
              }}
              className="tap flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-surface2/60"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface2 text-muted">
                <MapPin size={14} />
              </span>
              <span className="flex-1">
                <span className="block text-[12.5px] font-medium">{city.name}</span>
                <span className="block text-[10.5px] text-muted">{city.country}</span>
              </span>
              {active && <Check size={15} className="text-brand" />}
            </button>
          )
        })}
        {!cities.length && (
          <p className="py-6 text-center text-[12px] text-muted">
            No city found. Try a nearby larger city.
          </p>
        )}
      </div>
    </Sheet>
  )
}
