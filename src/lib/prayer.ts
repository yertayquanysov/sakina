import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  Madhab as AdhanMadhab,
  PrayerTimes,
  Qibla,
} from 'adhan'
import type { Madhab, MethodId, SavedLocation } from './types'

export const METHODS: {
  id: MethodId
  label: string
  short: string
  create: () => CalculationParameters
}[] = [
  { id: 'MWL', label: 'Muslim World League', short: 'MWL', create: () => CalculationMethod.MuslimWorldLeague() },
  { id: 'ISNA', label: 'Islamic Society of North America', short: 'ISNA', create: () => CalculationMethod.NorthAmerica() },
  { id: 'EGYPT', label: 'Egyptian General Authority', short: 'Egypt', create: () => CalculationMethod.Egyptian() },
  { id: 'KARACHI', label: 'University of Islamic Sciences, Karachi', short: 'Karachi', create: () => CalculationMethod.Karachi() },
  { id: 'MAKKAH', label: 'Umm al-Qura, Makkah', short: 'Umm al-Qura', create: () => CalculationMethod.UmmAlQura() },
  { id: 'DUBAI', label: 'Dubai', short: 'Dubai', create: () => CalculationMethod.Dubai() },
  { id: 'TURKEY', label: 'Diyanet, Turkey', short: 'Diyanet', create: () => CalculationMethod.Turkey() },
  { id: 'MOONSIGHTING', label: 'Moonsighting Committee', short: 'Moonsighting', create: () => CalculationMethod.MoonsightingCommittee() },
  { id: 'KUWAIT', label: 'Kuwait', short: 'Kuwait', create: () => CalculationMethod.Kuwait() },
  { id: 'QATAR', label: 'Qatar', short: 'Qatar', create: () => CalculationMethod.Qatar() },
  { id: 'SINGAPORE', label: 'Singapore', short: 'Singapore', create: () => CalculationMethod.Singapore() },
]

export const methodLabel = (id: MethodId) =>
  METHODS.find((m) => m.id === id)?.short ?? 'MWL'

export const PRAYERS = [
  { key: 'fajr', name: 'Fajr', arabic: 'الفجر', hint: 'Dawn' },
  { key: 'sunrise', name: 'Sunrise', arabic: 'الشروق', hint: 'Shuruq' },
  { key: 'dhuhr', name: 'Dhuhr', arabic: 'الظهر', hint: 'Midday' },
  { key: 'asr', name: 'Asr', arabic: 'العصر', hint: 'Afternoon' },
  { key: 'maghrib', name: 'Maghrib', arabic: 'المغرب', hint: 'Sunset' },
  { key: 'isha', name: 'Isha', arabic: 'العشاء', hint: 'Night' },
] as const

export type PrayerKey = (typeof PRAYERS)[number]['key']

export type DayTimes = {
  fajr: Date
  sunrise: Date
  dhuhr: Date
  asr: Date
  maghrib: Date
  isha: Date
}

export function cityDate(now: Date, tz: string): Date {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now)
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
    return new Date(get('year'), get('month') - 1, get('day'), 12, 0, 0, 0)
  } catch {
    return now
  }
}

export function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function buildParams(method: MethodId, madhab: Madhab) {
  const params = (METHODS.find((m) => m.id === method) ?? METHODS[0]).create()
  params.madhab = madhab === 'hanafi' ? AdhanMadhab.Hanafi : AdhanMadhab.Shafi
  params.highLatitudeRule = HighLatitudeRule.TwilightAngle
  return params
}

export function getDayTimes(
  loc: SavedLocation,
  method: MethodId,
  madhab: Madhab,
  day: Date,
): DayTimes {
  const times = new PrayerTimes(
    new Coordinates(loc.lat, loc.lng),
    day,
    buildParams(method, madhab),
  )
  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  }
}

export function qiblaBearing(loc: Pick<SavedLocation, 'lat' | 'lng'>) {
  return Qibla(new Coordinates(loc.lat, loc.lng))
}

export function prayerTime(times: DayTimes, key: PrayerKey) {
  return times[key]
}

export function formatTime(date: Date, tz: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz,
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
  }
}

export function formatTimeParts(date: Date, tz: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz,
    }).formatToParts(date)
    return {
      time: parts
        .filter((p) => p.type === 'hour' || p.type === 'minute' || p.type === 'dayPeriod')
        .map((p) => p.value)
        .join('')
        .replace(/\s/g, ''),
      period: parts.find((p) => p.type === 'dayPeriod')?.value ?? '',
    }
  } catch {
    return { time: formatTime(date, tz), period: '' }
  }
}

export type NextPrayer = {
  current: { key: PrayerKey; name: string; arabic: string; time: Date } | null
  next: { key: PrayerKey; name: string; arabic: string; time: Date; tomorrow: boolean }
  progress: number
  remainingMs: number
  windowMs: number
}

export function getNextPrayer(
  loc: SavedLocation,
  method: MethodId,
  madhab: Madhab,
  now: Date,
): NextPrayer {
  const today = cityDate(now, loc.tz)
  const tomorrow = addDays(today, 1)
  const t = getDayTimes(loc, method, madhab, today)
  const t2 = getDayTimes(loc, method, madhab, tomorrow)
  const list: { key: PrayerKey; time: Date }[] = [
    { key: 'fajr', time: t.fajr },
    { key: 'dhuhr', time: t.dhuhr },
    { key: 'asr', time: t.asr },
    { key: 'maghrib', time: t.maghrib },
    { key: 'isha', time: t.isha },
    { key: 'fajr', time: t2.fajr },
  ]

  const meta = (key: PrayerKey) => PRAYERS.find((p) => p.key === key)!

  let idx = list.findIndex((p) => p.time.getTime() > now.getTime())
  if (idx === -1) idx = list.length - 1

  const next = list[idx]
  const prev =
    idx === 0
      ? { key: 'isha' as PrayerKey, time: getDayTimes(loc, method, madhab, addDays(today, -1)).isha }
      : list[idx - 1]

  const windowMs = Math.max(1, next.time.getTime() - prev.time.getTime())
  const remainingMs = Math.max(0, next.time.getTime() - now.getTime())
  const progress = Math.min(1, Math.max(0, (now.getTime() - prev.time.getTime()) / windowMs))

  return {
    current: prev
      ? { key: prev.key, name: meta(prev.key).name, arabic: meta(prev.key).arabic, time: prev.time }
      : null,
    next: {
      key: next.key,
      name: meta(next.key).name,
      arabic: meta(next.key).arabic,
      time: next.time,
      tomorrow: idx === list.length - 1,
    },
    progress,
    remainingMs,
    windowMs,
  }
}

export function countdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return {
    h,
    m,
    s,
    text: h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(s).padStart(2, '0')}s`,
    clock: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
  }
}

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
]

const HIJRI_MONTHS_AR = [
  'مُحَرَّم',
  'صَفَر',
  'رَبيع الأوَّل',
  'رَبيع الآخِر',
  'جُمادى الأولى',
  'جُمادى الآخِرة',
  'رَجَب',
  'شَعْبان',
  'رَمَضان',
  'شَوَّال',
  'ذو القَعْدة',
  'ذو الحِجّة',
]

export function hijriDate(date: Date, offset = 0) {
  const d = new Date(date.getTime() + offset * 86400000)
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).formatToParts(d)
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
    const month = Math.min(12, Math.max(1, get('month')))
    return {
      day: get('day'),
      month,
      year: get('year'),
      monthName: HIJRI_MONTHS[month - 1],
      monthArabic: HIJRI_MONTHS_AR[month - 1],
      short: `${get('day')} ${HIJRI_MONTHS[month - 1]} ${get('year')}`,
      arabic: `${get('day')} ${HIJRI_MONTHS_AR[month - 1]} ${get('year')}`,
    }
  } catch {
    return {
      day: 0,
      month: 0,
      year: 0,
      monthName: '',
      monthArabic: '',
      short: '',
      arabic: '',
    }
  }
}

export function gregorianDate(date: Date, tz: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: tz,
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date)
  }
}

export function isRamadan(date: Date, offset = 0) {
  return hijriDate(date, offset).month === 9
}
