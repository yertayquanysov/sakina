import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpenText,
  ChevronDown,
  ChevronRight,
  Compass,
  Flame,
  MapPin,
  Moon,
  Settings2,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { useNow } from '../lib/storage'
import {
  cityDate,
  countdown,
  formatTime,
  getDayTimes,
  getNextPrayer,
  gregorianDate,
  hijriDate,
  PRAYERS,
  qiblaBearing,
} from '../lib/prayer'
import { loadZikr, streakCount, todayTotal } from '../lib/zikr'
import { SURAHS } from '../lib/quran'
import ayat from '../data/ayat.json'
import LocationPicker from '../components/LocationPicker'
import { Card, SectionTitle, cx } from '../components/ui'

const quickLinks = [
  { to: '/quran', label: 'Quran', icon: BookOpenText },
  { to: '/zikr', label: 'Zikr', icon: Sparkles },
  { to: '/qibla', label: 'Qibla', icon: Compass },
  { to: '/map', label: 'Nearby', icon: MapPin },
] as const

export default function Home() {
  const { settings, update } = useApp()
  const now = useNow(1000)
  const [locOpen, setLocOpen] = useState(false)
  const loc = settings.location
  const tz = loc?.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const hijri = hijriDate(now, settings.hijriOffset)

  const next = useMemo(
    () => (loc ? getNextPrayer(loc, settings.method, settings.madhab, now) : null),
    [loc, settings.method, settings.madhab, now],
  )

  const times = useMemo(
    () => (loc ? getDayTimes(loc, settings.method, settings.madhab, cityDate(now, loc.tz)) : null),
    [loc, settings.method, settings.madhab, now],
  )

  const zikr = useMemo(() => loadZikr(), [])
  const zikrToday = todayTotal(zikr)
  const streak = streakCount(zikr)
  const bearing = loc ? qiblaBearing(loc) : null

  const verse = useMemo(() => {
    const start = new Date(now.getFullYear(), 0, 0)
    const day = Math.floor((now.getTime() - start.getTime()) / 86400000)
    return ayat[day % ayat.length]
  }, [now])

  const lastRead = settings.lastRead
  const readingSurah = SURAHS.find((s) => s.n === (lastRead?.surah ?? 1)) ?? SURAHS[0]
  const readingAyah = lastRead?.ayah ?? 1

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-nav pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="animate-fade-up flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-muted">Assalamu alaikum</p>
          <h1 className="mt-1 text-[23px] font-semibold leading-tight tracking-[-0.025em]">
            {hijri.day} {hijri.monthName}
            <span className="ml-1.5 text-[13px] font-normal text-muted">{hijri.year} AH</span>
          </h1>
          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-1 flex max-w-[240px] items-center gap-1 text-left text-[12px] text-muted"
          >
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{loc?.label ?? 'Set your location'}</span>
            <ChevronDown size={12} className="shrink-0" />
          </button>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button
            onClick={() => update({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            aria-label="Toggle theme"
            className="tap grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface2"
          >
            {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            to="/settings"
            aria-label="Settings"
            className="tap grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface2"
          >
            <Settings2 size={16} />
          </Link>
        </div>
      </header>

      <div className="mt-6 animate-fade-up" style={{ animationDelay: '50ms' }}>
        {loc && next && times ? (
          <Card className="overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium text-muted">Next prayer</p>
                <p className="text-[11px] tabular-nums text-muted">
                  {next.next.tomorrow ? 'Tomorrow' : 'Today'} ·{' '}
                  {formatTime(next.next.time, loc.tz)}
                </p>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[28px] font-semibold leading-none tracking-[-0.03em]">
                    {next.next.name}
                  </h2>
                  <p className="mt-2 font-arabic text-[14px] leading-none text-muted" dir="rtl">
                    {next.next.arabic}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-muted">in</p>
                  <p className="mt-1 text-[22px] font-semibold leading-none tabular-nums tracking-[-0.02em]">
                    {countdown(next.remainingMs).text}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-surface2">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-1000"
                  style={{ width: `${Math.max(3, next.progress * 100)}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-muted">
                <span>
                  {next.current?.name} {next.current ? formatTime(next.current.time, loc.tz) : ''}
                </span>
                <span>{next.next.name}</span>
              </div>
            </div>

            <div className="grid grid-cols-5 divide-x divide-line border-t border-line">
              {PRAYERS.filter((p) => p.key !== 'sunrise').map((p) => {
                const active = p.key === next.next.key
                return (
                  <div key={p.key} className="py-3 text-center">
                    <p
                      className={cx(
                        'text-[9.5px]',
                        active ? 'font-semibold text-ink' : 'text-muted',
                      )}
                    >
                      {p.name.slice(0, 3)}
                    </p>
                    <p
                      className={cx(
                        'mt-1 text-[10px] tabular-nums',
                        active ? 'font-semibold text-ink' : 'text-muted',
                      )}
                    >
                      {formatTime(times[p.key], loc.tz).replace(/\s?[AP]M/, '')}
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <Moon size={20} className="text-muted" />
            <h2 className="mt-3 text-[20px] font-semibold tracking-[-0.02em]">
              Know your next prayer
            </h2>
            <p className="mt-1.5 max-w-[34ch] text-[12.5px] leading-relaxed text-muted">
              Set your location for accurate prayer times and the Qibla direction.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setLocOpen(true)}
                className="tap rounded-lg bg-brand px-4 py-2.5 text-[12px] font-semibold text-white"
              >
                Set location
              </button>
              <Link
                to="/namaz"
                className="tap rounded-lg border border-line px-4 py-2.5 text-[12px] font-medium text-muted"
              >
                Prayer guide
              </Link>
            </div>
          </Card>
        )}
      </div>

      <div
        className="mt-3 grid animate-fade-up grid-cols-4 gap-1 rounded-2xl border border-line bg-surface p-1.5"
        style={{ animationDelay: '90ms' }}
      >
        {quickLinks.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="tap flex flex-col items-center gap-1.5 rounded-xl py-2.5 hover:bg-surface2"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-surface2 text-ink">
              <q.icon size={17} strokeWidth={1.8} />
            </span>
            <span className="text-[10.5px] font-medium text-muted">{q.label}</span>
          </Link>
        ))}
      </div>

      <div
        className="mt-3 grid animate-fade-up grid-cols-2 gap-3"
        style={{ animationDelay: '130ms' }}
      >
        <Link to="/qibla" className="tap rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted">Qibla</p>
            <ChevronRight size={14} className="text-muted/60" />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <CompassDial bearing={bearing ?? 118} />
            <div className="min-w-0">
              <p className="text-[18px] font-semibold leading-none tabular-nums tracking-[-0.02em]">
                {bearing ? `${Math.round(bearing)}°` : '—'}
              </p>
              <p className="mt-1 text-[10px] leading-tight text-muted">
                {loc ? 'from true north' : 'set location'}
              </p>
            </div>
          </div>
        </Link>

        <Link
          to={`/quran/${readingSurah.n}?ayah=${readingAyah}`}
          className="tap rounded-2xl border border-line bg-surface p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted">{lastRead ? 'Continue' : 'Start reading'}</p>
            <ChevronRight size={14} className="text-muted/60" />
          </div>
          <div className="mt-2">
            <p className="font-arabic text-[18px] leading-tight text-ink" dir="rtl">
              {readingSurah.name}
            </p>
            <p className="mt-1 truncate text-[12px] font-medium">{readingSurah.en}</p>
            <p className="mt-0.5 text-[10px] text-muted">
              Ayah {readingAyah} · {readingSurah.ayahs} total
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-7 animate-fade-up" style={{ animationDelay: '170ms' }}>
        <SectionTitle
          action={
            <Link
              to="/quran"
              className="flex items-center gap-0.5 text-[11px] font-medium text-brand"
            >
              Read <ChevronRight size={12} />
            </Link>
          }
        >
          Verse for today
        </SectionTitle>
        <Card className="p-5">
          <p className="font-arabic text-[21px] leading-[1.9] text-ink" dir="rtl">
            {verse.ar}
          </p>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{verse.en}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-brand" />
            <p className="text-[10.5px] font-medium text-muted">
              {verse.surahName} · {verse.surah}:{verse.ayah}
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-3 animate-fade-up" style={{ animationDelay: '210ms' }}>
        <Link
          to="/zikr"
          className="tap flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface2">
            <Sparkles size={17} className="text-ink" />
            {zikrToday > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[9px] font-semibold text-white">
                {zikrToday > 999 ? '999+' : zikrToday}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-medium">
              {zikrToday > 0 ? `${zikrToday} dhikr today` : 'Begin your dhikr'}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted">
              {streak > 0 ? (
                <>
                  <Flame size={11} /> {streak} day streak
                </>
              ) : (
                'A few moments of remembrance'
              )}
            </p>
          </div>
          <ChevronRight size={15} className="text-muted/60" />
        </Link>
      </div>

      <p className="mt-7 pb-2 text-center text-[10px] text-muted/70">
        {gregorianDate(now, tz)} · {hijri.short} AH
      </p>

      <LocationPicker open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  )
}

function CompassDial({ bearing }: { bearing: number }) {
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12 shrink-0" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="rgb(var(--surface-2))" />
      <circle cx="32" cy="32" r="29.5" fill="none" stroke="rgb(var(--line))" />
      <text x="32" y="10" textAnchor="middle" fontSize="6" fill="rgb(var(--muted))">
        N
      </text>
      <g transform={`rotate(${bearing} 32 32)`}>
        <path d="M32 16 L36.5 37 L32 34.5 L27.5 37 Z" fill="rgb(var(--brand))" />
      </g>
      <circle cx="32" cy="32" r="2" fill="rgb(var(--surface))" stroke="rgb(var(--brand))" />
    </svg>
  )
}
