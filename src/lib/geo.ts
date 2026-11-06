import type { SavedLocation } from './types'

export type City = {
  name: string
  country: string
  lat: number
  lng: number
  tz: string
}

export const CITIES: City[] = [
  { name: 'Makkah', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262, tz: 'Asia/Riyadh' },
  { name: 'Madinah', country: 'Saudi Arabia', lat: 24.4672, lng: 39.6111, tz: 'Asia/Riyadh' },
  { name: 'London', country: 'United Kingdom', lat: 51.5072, lng: -0.1276, tz: 'Europe/London' },
  { name: 'Birmingham', country: 'United Kingdom', lat: 52.4862, lng: -1.8904, tz: 'Europe/London' },
  { name: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426, tz: 'Europe/London' },
  { name: 'Istanbul', country: 'Türkiye', lat: 41.0082, lng: 28.9784, tz: 'Europe/Istanbul' },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai' },
  { name: 'Doha', country: 'Qatar', lat: 25.2854, lng: 51.531, tz: 'Asia/Qatar' },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, tz: 'Africa/Cairo' },
  { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011, tz: 'Asia/Karachi' },
  { name: 'Lahore', country: 'Pakistan', lat: 31.5204, lng: 74.3587, tz: 'Asia/Karachi' },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125, tz: 'Asia/Dhaka' },
  { name: 'Delhi', country: 'India', lat: 28.6139, lng: 77.209, tz: 'Asia/Kolkata' },
  { name: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, tz: 'Asia/Kolkata' },
  { name: 'Hyderabad', country: 'India', lat: 17.385, lng: 78.4867, tz: 'Asia/Kolkata' },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lng: 101.6869, tz: 'Asia/Kuala_Lumpur' },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, tz: 'Asia/Jakarta' },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, tz: 'Asia/Singapore' },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006, tz: 'America/New_York' },
  { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298, tz: 'America/Chicago' },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, tz: 'America/Toronto' },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, tz: 'Europe/Paris' },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405, tz: 'Europe/Berlin' },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041, tz: 'Europe/Amsterdam' },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686, tz: 'Europe/Stockholm' },
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522, tz: 'Europe/Oslo' },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney' },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241, tz: 'Africa/Johannesburg' },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, tz: 'Africa/Lagos' },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219, tz: 'Africa/Nairobi' },
]

export function deviceTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function cityToLocation(city: City): SavedLocation {
  return {
    lat: city.lat,
    lng: city.lng,
    label: `${city.name}, ${city.country}`,
    tz: city.tz,
    auto: false,
  }
}

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function getPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 1000 * 60 * 5,
      ...options,
    })
  })
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) throw new Error('geocode failed')
    const data = (await res.json()) as {
      city?: string
      locality?: string
      principalSubdivision?: string
      countryName?: string
    }
    const place = data.city || data.locality || data.principalSubdivision
    if (place) return data.countryName ? `${place}, ${data.countryName}` : place
  } catch {
    /* fall through */
  }
  return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`
}

export function mapsLink(lat: number, lng: number, label?: string) {
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`
  return `https://www.google.com/maps/search/?api=1&query=${q}&center=${lat},${lng}`
}
