import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BookOpenText,
  ChevronDown,
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
  { to: '/quran', label: 'Quran', icon: BookOpenText, tone: 'brand' },
  { to: '/zikr', label: 'Zikr', icon: Sparkles, tone: 'gold' },
  { to: '/qibla', label: 'Qibla', icon: Compass, tone: 'brand' },
  { to: '/map', label: 'Nearby', icon: MapPin, tone: 'gold' },
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
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-nav pt-[max(0.9rem,env(safe-area-inset-top))]">
      <header className="animate-fade-up flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-gold">
            Assalamu alaikum
          </p>
          <h1 className="mt-1.5 font-display text-[27px] font-semibold leading-[1.08] tracking-tight">
            {hijri.day} {hijri.monthName}{' '}
            <span className="ml-1.5 align-middle text-[12px] font-medium tracking-normal text-muted">
              {hijri.year} AH
            </span>
          </h1>
          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-1.5 flex max-w-[240px] items-center gap-1 text-left text-[11.5px] text-muted"
          >
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{loc?.label ?? 'Set your location'}</span>
            <ChevronDown size={12} className="shrink-0" />
          </button>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={() => update({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            aria-label="Toggle theme"
            className="tap grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted shadow-sm"
          >
            {settings.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <Link
            to="/settings"
            aria-label="Settings"
            className="tap grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted shadow-sm"
          >
            <Settings2 size={15} />
          </Link>
        </div>
      </header>

      <div className="mt-5 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {loc && next && times ? (
          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-brand to-brand-deep p-5 text-white shadow-float">
            <div className="pattern pointer-events-none absolute inset-0 opacity-70" />
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full border border-gold/25" />
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border border-gold/15" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-gold-soft/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  Next prayer
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/75 backdrop-blur">
                  {next.next.tomorrow ? 'Tomorrow' : 'Today'} · {formatTime(next.next.time, loc.tz)}
                </span>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-[34px] font-semibold leading-none tracking-tight">
                    {next.next.name}
                  </h2>
                  <p className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-display text-[21px] font-semibold text-gold-soft">
                      {formatTime(next.next.time, loc.tz)}
                    </span>
                    <span className="text-[11px] text-white/45">
                      {next.next.tomorrow ? 'tomorrow' : 'adhan'}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-arabic text-[21px] leading-none text-gold" dir="rtl">
                    {next.next.arabic}
                  </p>
                  <p className="mt-2.5 text-[10px] uppercase tracking-[0.14em] text-white/45">in</p>
                  <p className="font-display text-[22px] font-semibold leading-none text-white/90">
                    {countdown(next.remainingMs).text}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-1 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft transition-[width] duration-1000"
                    style={{ width: `${Math.max(3, next.progress * 100)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[9.5px] text-white/40">
                  <span>
                    {next.current?.name} {next.current ? formatTime(next.current.time, loc.tz) : ''}
                  </span>
                  <span>{next.next.name}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-1 border-t border-white/10 pt-3.5">
                {PRAYERS.filter((p) => p.key !== 'sunrise').map((p) => {
                  const active = p.key === next.next.key
                  return (
                    <div key={p.key} className="text-center">
                      <p
                        className={cx(
                          'text-[9px] font-semibold uppercase tracking-wide',
                          active ? 'text-gold' : 'text-white/45',
                        )}
                      >
                        {p.name.slice(0, 3)}
                      </p>
                      <p
                        className={cx(
                          'mt-1 text-[9.5px] tabular-nums',
                          active ? 'font-bold text-gold-soft' : 'text-white/70',
                        )}
                      >
                        {formatTime(times[p.key], loc.tz).replace(/\s?[AP]M/, '')}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-brand to-brand-deep p-6 text-white shadow-float">
            <div className="pattern pointer-events-none absolute inset-0 opacity-70" />
            <div className="relative">
              <Moon className="mb-3 text-gold" size={22} />
              <h2 className="font-display text-[25px] font-semibold leading-tight">
                Know your next prayer
              </h2>
              <p className="mt-1.5 max-w-[32ch] text-[12px] leading-relaxed text-white/60">
                Set your location for accurate prayer times and the Qibla direction.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setLocOpen(true)}
                  className="tap rounded-xl bg-gold px-4 py-2.5 text-[12px] font-bold text-brand-deep"
                >
                  Set location
                </button>
                <Link
                  to="/namaz"
                  className="tap rounded-xl border border-white/20 px-4 py-2.5 text-[12px] font-semibold text-white/80"
                >
                  Prayer guide
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="mt-4 grid animate-fade-up grid-cols-4 gap-2"
        style={{ animationDelay: '110ms' }}
      >
        {quickLinks.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="tap flex flex-col items-center gap-2 rounded-2xl border border-line/80 bg-surface py-3 shadow-card"
          >
            <span
              className={cx(
                'grid h-9 w-9 place-items-center rounded-full',
                q.tone === 'gold'
                  ? 'bg-gold-soft text-gold'
                  : 'bg-brand-soft text-brand dark:text-gold',
              )}
            >
              <q.icon size={17} />
            </span>
            <span className="text-[10.5px] font-semibold">{q.label}</span>
          </Link>
        ))}
      </div>

      <div
        className="mt-4 grid animate-fade-up grid-cols-2 gap-2.5"
        style={{ animationDelay: '150ms' }}
      >
        <Link
          to="/qibla"
          className="tap group relative overflow-hidden rounded-3xl border border-line/80 bg-surface p-4 shadow-card"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Qibla</p>
            <ArrowUpRight size={14} className="text-muted/60" />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <CompassDial bearing={bearing ?? 118} />
            <div className="min-w-0">
              <p className="font-display text-[20px] font-semibold leading-none">
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
          className="tap relative overflow-hidden rounded-3xl border border-line/80 bg-surface p-4 shadow-card"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              {lastRead ? 'Continue' : 'Start reading'}
            </p>
            <ArrowUpRight size={14} className="text-muted/60" />
          </div>
          <div className="mt-2">
            <p className="font-arabic text-[19px] leading-tight text-brand dark:text-gold" dir="rtl">
              {readingSurah.name}
            </p>
            <p className="mt-1 truncate text-[12px] font-semibold">{readingSurah.en}</p>
            <p className="mt-0.5 text-[10px] text-muted">
              Ayah {readingAyah} · {readingSurah.ayahs} total
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-6 animate-fade-up" style={{ animationDelay: '190ms' }}>
        <SectionTitle
          action={
            <Link to="/quran" className="flex items-center gap-0.5 text-[11px] font-semibold text-gold">
              Read <ArrowUpRight size={12} />
            </Link>
          }
        >
          Verse for today
        </SectionTitle>
        <Card className="relative overflow-hidden p-5">
          <span className="pointer-events-none absolute -right-1 -top-6 font-display text-[90px] leading-none text-gold/10">
            ”
          </span>
          <p className="relative font-arabic text-[22px] leading-[1.9] text-ink" dir="rtl">
            {verse.ar}
          </p>
          <p className="relative mt-3 text-[12.5px] leading-relaxed text-muted">{verse.en}</p>
          <div className="relative mt-3 flex items-center gap-2">
            <span className="h-px w-5 bg-gold/50" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
              {verse.surahName} · {verse.surah}:{verse.ayah}
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-5 animate-fade-up" style={{ animationDelay: '230ms' }}>
        <Link
          to="/zikr"
          className="tap flex items-center gap-3.5 rounded-3xl border border-line/80 bg-surface p-4 shadow-card"
        >
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold-soft">
            <Sparkles size={19} className="text-gold" />
            {zikrToday > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                {zikrToday > 999 ? '999+' : zikrToday}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold">
              {zikrToday > 0 ? `${zikrToday} dhikr today` : 'Begin your dhikr'}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted">
              {streak > 0 ? (
                <>
                  <Flame size={11} className="text-gold" /> {streak} day streak · keep it alive
                </>
              ) : (
                'A few moments of remembrance'
              )}
            </p>
          </div>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-surface2 text-muted">
            <ArrowUpRight size={15} />
          </span>
        </Link>
      </div>

      <p className="mt-6 pb-2 text-center text-[10px] text-muted/60">
        {gregorianDate(now, tz)} · {hijri.short} AH
      </p>

      <LocationPicker open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  )
}

function CompassDial({ bearing }: { bearing: number }) {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="rgb(var(--surface-2))" />
      <circle cx="32" cy="32" r="29" fill="none" stroke="rgb(var(--line))" />
      <text x="32" y="10" textAnchor="middle" fontSize="6.5" fill="rgb(var(--muted))">
        N
      </text>
      <g transform={`rotate(${bearing} 32 32)`}>
        <path d="M32 14 L37.5 36 L32 33 L26.5 36 Z" fill="rgb(var(--gold))" />
      </g>
      <circle cx="32" cy="32" r="2.6" fill="rgb(var(--brand))" />
    </svg>
  )
}
