import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ArrowUpRight,
  LocateFixed,
  MapPin,
  Navigation,
  RotateCw,
  SearchX,
  Utensils,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { formatDistance, haversine, mapsLink } from '../lib/geo'
import LocationPicker from '../components/LocationPicker'
import { Card, EmptyState, Segmented, Spinner, cx } from '../components/ui'

type Mode = 'mosque' | 'halal'

type Place = {
  id: string
  name: string
  lat: number
  lng: number
  address?: string
  detail?: string
  distance: number
}

type OverpassElement = {
  id: number
  type: string
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

type NominatimPlace = {
  place_id: number
  osm_type?: string
  osm_id?: number
  lat: string
  lon: string
  name?: string
  display_name?: string
  category?: string
  type?: string
  address?: Record<string, string>
  extratags?: Record<string, string>
}

type Coords = { lat: number; lng: number }

const LONDON = { lat: 51.5072, lng: -0.1276, label: 'London, United Kingdom' }
const CACHE_TTL = 1000 * 60 * 60 * 6

const MOSQUE_SVG =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c2.6 2.1 4 4.4 4 7H8c0-2.6 1.4-4.9 4-7Z"/><path d="M4 21v-7h16v7"/><path d="M9 21v-4h6v4"/></svg>'
const HALAL_SVG =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v6a2 2 0 0 0 2 2v10"/><path d="M11 3v6"/><path d="M7 3v4"/><path d="M18 3c1.8 2.6 1.8 6.4 0 9v9"/></svg>'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

function cacheKey(mode: Mode, radius: number, lat: number, lng: number) {
  return `sakina:places:${mode}:${radius}:${lat.toFixed(3)}:${lng.toFixed(3)}`
}

function readCache(key: string): Place[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at: number; places: Place[] }
    if (!Array.isArray(parsed.places) || Date.now() - parsed.at > CACHE_TTL) return null
    return parsed.places
  } catch {
    return null
  }
}

function writeCache(key: string, places: Place[]) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), places }))
  } catch {
    /* storage full or unavailable — caching is best-effort */
  }
}

function viewbox(radius: number, center: Coords) {
  const dLat = radius / 111320
  const dLng = radius / (111320 * Math.max(0.2, Math.cos((center.lat * Math.PI) / 180)))
  return {
    top: center.lat + dLat,
    bottom: center.lat - dLat,
    left: center.lng - dLng,
    right: center.lng + dLng,
  }
}

function buildQuery(mode: Mode, radius: number, lat: number, lng: number) {
  const around = `(around:${radius},${lat.toFixed(5)},${lng.toFixed(5)})`
  if (mode === 'mosque') {
    return `[out:json][timeout:20];(nwr["amenity"="place_of_worship"]["religion"="muslim"]${around};);out center 60;`
  }
  return `[out:json][timeout:20];(nwr["amenity"~"^(restaurant|fast_food|cafe|food_court)$"]["diet:halal"~"^(yes|only)$"]${around};nwr["amenity"~"^(restaurant|fast_food|cafe|food_court)$"]["cuisine"~"halal",i]${around};);out center 60;`
}

function nominatimAddress(address?: Record<string, string>) {
  if (!address) return ''
  return [
    address.road || address.pedestrian,
    address.suburb || address.neighbourhood || address.quarter,
    address.city || address.town || address.village,
  ]
    .filter(Boolean)
    .join(', ')
}

async function fetchNominatim(
  mode: Mode,
  radius: number,
  center: Coords,
  signal: AbortSignal,
): Promise<Place[]> {
  const box = viewbox(radius, center)
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: mode === 'mosque' ? 'mosque' : 'halal food',
    limit: '40',
    bounded: '1',
    viewbox: `${box.left.toFixed(5)},${box.top.toFixed(5)},${box.right.toFixed(5)},${box.bottom.toFixed(5)}`,
    lat: center.lat.toFixed(5),
    lon: center.lng.toFixed(5),
    addressdetails: '1',
    extratags: '1',
    'accept-language': 'en',
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Nominatim responded ${res.status}`)
  const data = (await res.json()) as NominatimPlace[]
  if (!Array.isArray(data)) return []

  const seen = new Set<string>()
  const places: Place[] = []
  for (const item of data) {
    const lat = Number(item.lat)
    const lng = Number(item.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const name = (item.name || item.display_name?.split(',')[0] || '').trim()
    if (!name) continue
    const dedupe = `${name.toLowerCase()}:${lat.toFixed(3)}:${lng.toFixed(3)}`
    if (seen.has(dedupe)) continue
    seen.add(dedupe)
    const distance = haversine(center, { lat, lng })
    if (distance > radius) continue
    const extra = item.extratags ?? {}
    places.push({
      id: `nom-${item.place_id}`,
      name,
      lat,
      lng,
      address: nominatimAddress(item.address),
      detail:
        mode === 'mosque'
          ? extra.denomination || 'Masjid'
          : extra.cuisine
            ? extra.cuisine.replace(/[_;]/g, ' ')
            : (item.type || 'Halal').replace(/_/g, ' '),
      distance,
    })
  }
  return places.sort((a, b) => a.distance - b.distance)
}

function parseOverpass(
  data: { elements: OverpassElement[] },
  mode: Mode,
  center: Coords,
): Place[] {
  const seen = new Set<string>()
  const parsed: Place[] = []
  for (const el of data.elements ?? []) {
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (typeof lat !== 'number' || typeof lng !== 'number') continue
    const tags = el.tags ?? {}
    const name = tags.name || tags['name:en'] || tags['name:en-GB'] || ''
    if (!name) continue
    const dedupe = `${name.toLowerCase()}:${lat.toFixed(3)}:${lng.toFixed(3)}`
    if (seen.has(dedupe)) continue
    seen.add(dedupe)
    const address = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
      .filter(Boolean)
      .join(', ')
    parsed.push({
      id: `${el.type}-${el.id}`,
      name,
      lat,
      lng,
      address: address || tags['addr:full'] || '',
      detail:
        mode === 'mosque'
          ? tags.denomination || 'Masjid'
          : tags.cuisine
            ? tags.cuisine.replace(/[_;]/g, ' ')
            : 'Halal',
      distance: haversine(center, { lat, lng }),
    })
  }
  return parsed.sort((a, b) => a.distance - b.distance)
}

function placeKey(place: Place) {
  return `${place.name.toLowerCase().replace(/\s+/g, ' ')}:${place.lat.toFixed(3)}:${place.lng.toFixed(3)}`
}

function mergePlaces(primary: Place[], extra: Place[]): Place[] {
  const merged = new Map<string, Place>()
  for (const place of primary) merged.set(placeKey(place), place)
  for (const place of extra) {
    const key = placeKey(place)
    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, place)
      continue
    }
    merged.set(key, {
      ...existing,
      address: existing.address || place.address,
      detail:
        existing.detail && existing.detail !== 'Masjid' && existing.detail !== 'Halal'
          ? existing.detail
          : place.detail || existing.detail,
    })
  }
  return [...merged.values()].sort((a, b) => a.distance - b.distance)
}

async function fetchOverpass(query: string, signal: AbortSignal) {
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]
  let lastError: unknown = null
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
        signal,
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`Overpass responded ${res.status}`)
      return (await res.json()) as { elements: OverpassElement[] }
    } catch (err) {
      if (signal.aborted) throw err
      lastError = err
    }
  }
  throw lastError ?? new Error('Map service unavailable')
}

export default function Maps() {
  const { settings, requestLocation, locating } = useApp()
  const saved = settings.location
  const center = saved ?? LONDON
  const [mode, setMode] = useState<Mode>('mosque')
  const [radius, setRadius] = useState(3000)
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [locOpen, setLocOpen] = useState(false)
  const [retry, setRetry] = useState(0)

  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const markersRef = useRef<Record<string, L.Marker>>({})

  const mapKey = `${center.lat.toFixed(3)}:${center.lng.toFixed(3)}`

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([center.lat, center.lng], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    const timer = window.setTimeout(() => map.invalidateSize(), 300)
    return () => {
      window.clearTimeout(timer)
      map.remove()
      mapRef.current = null
      layerRef.current = null
      markersRef.current = {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setView([center.lat, center.lng], 13)
  }, [mapKey, center.lat, center.lng])

  useEffect(() => {
    let cancelled = false
    const key = cacheKey(mode, radius, center.lat, center.lng)

    const cached = readCache(key)
    if (cached) {
      setPlaces(cached)
      setError(null)
      setLoading(false)
      return
    }

    const nominatimController = new AbortController()
    const overpassController = new AbortController()
    const nominatimTimer = window.setTimeout(() => nominatimController.abort(), 9000)
    const overpassTimer = window.setTimeout(() => overpassController.abort(), 26000)

    setLoading(true)
    setError(null)
    setActiveId(null)

    const run = async () => {
      let primary: Place[] = []
      let nominatimOk = false
      try {
        primary = await fetchNominatim(mode, radius, center, nominatimController.signal)
        nominatimOk = true
      } catch {
        if (cancelled) return
      } finally {
        window.clearTimeout(nominatimTimer)
      }
      if (cancelled) return

      if (primary.length) {
        setPlaces(primary)
        setLoading(false)
        writeCache(key, primary)

        // Nominatim gets results on screen fast. Overpass is then asked for richer
        // tags (denomination, cuisine) and any venues Nominatim missed.
        try {
          const data = await fetchOverpass(
            buildQuery(mode, radius, center.lat, center.lng),
            overpassController.signal,
          )
          if (cancelled) return
          const merged = mergePlaces(primary, parseOverpass(data, mode, center))
          setPlaces(merged)
          writeCache(key, merged)
        } catch {
          /* Nominatim results are already on screen */
        } finally {
          window.clearTimeout(overpassTimer)
        }
        return
      }

      try {
        const data = await fetchOverpass(
          buildQuery(mode, radius, center.lat, center.lng),
          overpassController.signal,
        )
        if (cancelled) return
        const parsed = parseOverpass(data, mode, center)
        setPlaces(parsed)
        setLoading(false)
        if (parsed.length) writeCache(key, parsed)
      } catch {
        if (cancelled) return
        setLoading(false)
        if (nominatimOk) {
          setPlaces([])
        } else {
          setError('The map service is busy right now. Please try again in a moment.')
        }
      } finally {
        window.clearTimeout(overpassTimer)
      }
    }

    void run()

    return () => {
      cancelled = true
      nominatimController.abort()
      overpassController.abort()
      window.clearTimeout(nominatimTimer)
      window.clearTimeout(overpassTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, radius, mapKey, retry])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    markersRef.current = {}

    const userIcon = L.divIcon({
      className: '',
      html: '<div class="sakina-user-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    L.marker([center.lat, center.lng], { icon: userIcon, zIndexOffset: 1000 })
      .addTo(layer)
      .bindTooltip('You are here', { direction: 'top', offset: [0, -10] })

    const bounds: L.LatLngExpression[] = []
    for (const place of places) {
      const icon = L.divIcon({
        className: 'sakina-marker',
        html: `<span>${mode === 'mosque' ? MOSQUE_SVG : HALAL_SVG}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 30],
      })
      const marker = L.marker([place.lat, place.lng], { icon }).addTo(layer)
      marker.bindPopup(
        `<div style="font-family:inherit;min-width:130px"><strong style="font-size:12px">${escapeHtml(
          place.name,
        )}</strong><br/><span style="font-size:10px;color:#6b7a72">${escapeHtml(
          place.detail ?? '',
        )} · ${formatDistance(place.distance)}</span></div>`,
      )
      marker.on('click', () => setActiveId(place.id))
      markersRef.current[place.id] = marker
      bounds.push([place.lat, place.lng])
    }
    if (bounds.length) {
      map.fitBounds(L.latLngBounds(bounds).pad(0.18), { maxZoom: 15, animate: true })
    } else {
      map.setView([center.lat, center.lng], 13)
    }
  }, [places, mode, mapKey, center.lat, center.lng])

  useEffect(() => {
    if (!activeId) return
    const map = mapRef.current
    const marker = markersRef.current[activeId]
    if (!map || !marker) return
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.6 })
    marker.openPopup()
  }, [activeId])

  const subtitle = useMemo(
    () =>
      loading
        ? 'Searching nearby…'
        : `${places.length} ${mode === 'mosque' ? 'masjids' : 'halal places'} within ${
            radius / 1000
          } km`,
    [loading, places.length, mode, radius],
  )

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-nav pt-[max(0.9rem,env(safe-area-inset-top))]">
      <header className="flex items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-gold">
            Around you
          </p>
          <h1 className="mt-1.5 font-display text-[28px] font-semibold leading-none tracking-tight">
            Nearby
          </h1>
          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-1.5 flex max-w-[230px] items-center gap-1 text-left text-[11px] text-muted"
          >
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{saved?.label ?? 'London (default)'}</span>
          </button>
        </div>
        <button
          onClick={() => requestLocation()}
          disabled={locating}
          aria-label="Use my current location"
          className="tap grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted disabled:opacity-60"
        >
          {locating ? <Spinner /> : <LocateFixed size={16} />}
        </button>
      </header>

      {!saved && (
        <button
          onClick={() => requestLocation()}
          className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-2 rounded-xl border border-gold/30 bg-gold-soft/40 px-3 py-2 text-left"
        >
          <Navigation size={13} className="shrink-0 text-gold" />
          <p className="text-[10.5px] leading-snug text-muted">
            Showing London. Tap to use your location for places near you.
          </p>
        </button>
      )}

      <div className="mt-3 px-4">
        <Segmented
          value={mode}
          onChange={(v) => {
            setMode(v)
            setPlaces([])
          }}
          options={[
            { value: 'mosque', label: 'Mosques' },
            { value: 'halal', label: 'Halal food' },
          ]}
        />
      </div>

      <div className="relative mt-3 px-4">
        <div
          ref={mapEl}
          className="h-[36vh] min-h-[230px] overflow-hidden rounded-3xl border border-line/80 bg-surface2 shadow-card"
        />
        {loading && (
          <div className="pointer-events-none absolute inset-0 mx-4 grid place-items-center rounded-3xl bg-surface/50 backdrop-blur-[1px]">
            <span className="flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-[11px] font-semibold text-muted shadow-card">
              <Spinner /> Finding places…
            </span>
          </div>
        )}
        <div className="absolute right-6 top-3 flex flex-col gap-1">
          {[2000, 3000, 5000, 10000].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={cx(
                'rounded-lg px-2 py-1 text-[9px] font-bold shadow-sm backdrop-blur transition-colors',
                radius === r
                  ? 'bg-brand text-white'
                  : 'bg-surface/90 text-muted hover:bg-surface',
              )}
            >
              {r / 1000} km
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-4">
        <p className="text-[11px] font-semibold text-muted">{subtitle}</p>
        <p className="text-[9px] uppercase tracking-wide text-muted/60">
          {mode === 'mosque' ? 'OpenStreetMap' : 'Halal tagged'}
        </p>
      </div>

      <div className="mt-2 space-y-2 px-4">
        {error && !loading && (
          <Card className="p-5 text-center">
            <p className="text-[12.5px] font-semibold">{error}</p>
            <button
              onClick={() => setRetry((r) => r + 1)}
              className="tap mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-[11.5px] font-bold text-white"
            >
              <RotateCw size={13} /> Try again
            </button>
          </Card>
        )}

        {!error &&
          !loading &&
          places.length === 0 && (
            <EmptyState
              icon={<SearchX size={20} />}
              title={mode === 'mosque' ? 'No masjids found' : 'No halal places found'}
              body="Try a wider radius, or move the map to a nearby town."
              action={
                <button
                  onClick={() => setRadius((r) => Math.min(10000, r + 2000))}
                  className="text-[11.5px] font-bold text-gold"
                >
                  Search wider
                </button>
              }
            />
          )}

        {places.map((place) => (
          <div
            key={place.id}
            onClick={() => setActiveId(place.id)}
            className={cx(
              'flex cursor-pointer items-center gap-3 rounded-2xl border bg-surface p-3 shadow-card transition-colors',
              activeId === place.id ? 'border-gold/50 bg-gold-soft/20' : 'border-line/70',
            )}
          >
            <span
              className={cx(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                mode === 'mosque'
                  ? 'bg-brand-soft text-brand dark:text-gold'
                  : 'bg-gold-soft text-gold',
              )}
            >
              {mode === 'mosque' ? <MosqueGlyph /> : <Utensils size={17} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold leading-tight">{place.name}</p>
              <p className="mt-0.5 truncate text-[10px] capitalize text-muted">
                {place.detail}
                {place.address ? ` · ${place.address}` : ''}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-gold">
                {formatDistance(place.distance)} away
              </p>
            </div>
            <a
              href={mapsLink(place.lat, place.lng, place.name)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Directions to ${place.name}`}
              className="tap grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface2 text-muted"
            >
              <ArrowUpRight size={15} />
            </a>
          </div>
        ))}

        {!loading && places.length > 0 && (
          <p className="pb-2 pt-1 text-center text-[9.5px] leading-relaxed text-muted/60">
            Community data from OpenStreetMap. Please verify halal certification with the
            venue.
          </p>
        )}
      </div>

      <LocationPicker open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  )
}

function MosqueGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3c2.6 2.1 4 4.4 4 7H8c0-2.6 1.4-4.9 4-7Z" />
      <path d="M4 21v-7h16v7" />
      <path d="M9 21v-4h6v4" />
    </svg>
  )
}
