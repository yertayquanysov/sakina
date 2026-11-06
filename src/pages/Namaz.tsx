import { useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  CloudSun,
  MapPin,
  Minus,
  MoonStar,
  Plus,
  Settings2,
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { useNow } from '../lib/storage'
import {
  METHODS,
  PRAYERS,
  addDays,
  cityDate,
  countdown,
  formatTime,
  getDayTimes,
  getNextPrayer,
  gregorianDate,
  hijriDate,
  isRamadan,
  methodLabel,
  type PrayerKey,
} from '../lib/prayer'
import LocationPicker from '../components/LocationPicker'
import { Card, Sheet, cx } from '../components/ui'
import type { Madhab, MethodId } from '../lib/types'

const ICONS: Record<PrayerKey, typeof Sun> = {
  fajr: Sunrise,
  sunrise: Sun,
  dhuhr: Sun,
  asr: CloudSun,
  maghrib: Sunset,
  isha: MoonStar,
}

export default function Namaz() {
  const { settings, update } = useApp()
  const now = useNow(1000)
  const [locOpen, setLocOpen] = useState(false)
  const [methodOpen, setMethodOpen] = useState(false)
  const loc = settings.location

  const next = useMemo(
    () => (loc ? getNextPrayer(loc, settings.method, settings.madhab, now) : null),
    [loc, settings.method, settings.madhab, now],
  )

  const today = useMemo(
    () => (loc ? getDayTimes(loc, settings.method, settings.madhab, cityDate(now, loc.tz)) : null),
    [loc, settings.method, settings.madhab, now],
  )

  const week = useMemo(() => {
    if (!loc) return []
    const base = cityDate(now, loc.tz)
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(base, i)
      return {
        date: d,
        times: getDayTimes(loc, settings.method, settings.madhab, d),
      }
    })
  }, [loc, settings.method, settings.madhab, now])

  const hijri = hijriDate(now, settings.hijriOffset)
  const ramadan = isRamadan(now, settings.hijriOffset)

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-nav pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="animate-fade-up flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-gold">
            {hijri.day} {hijri.monthName} {hijri.year} AH
          </p>
          <h1 className="mt-1.5 font-display text-[30px] font-semibold leading-none tracking-tight">
            Namaz
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
        <button
          onClick={() => setMethodOpen(true)}
          aria-label="Prayer settings"
          className="tap grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted"
        >
          <Settings2 size={16} />
        </button>
      </header>

      {ramadan && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gold/30 bg-gold-soft/50 px-4 py-2.5">
          <MoonStar size={14} className="text-gold" />
          <p className="text-[11.5px] font-semibold text-ink">
            Ramadan Mubarak — may your fasts and prayers be accepted.
          </p>
        </div>
      )}

      {!loc && (
        <Card className="mt-5 p-5">
          <p className="font-display text-xl font-semibold">Prayer times need a location</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
            Choose your city or allow location access. Everything is calculated on your
            device.
          </p>
          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-4 rounded-xl bg-brand px-4 py-2.5 text-[12px] font-bold text-white"
          >
            Set location
          </button>
        </Card>
      )}

      {loc && next && today && (
        <>
          <div className="mt-5 animate-fade-up overflow-hidden rounded-[30px] border border-line/70 bg-surface shadow-card">
            <div className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-deep p-5 text-white">
              <div className="pattern pointer-events-none absolute inset-0 opacity-70" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-gold/20" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-gold-soft/70">
                    {next.next.tomorrow ? 'Fajr tomorrow' : 'Next prayer'}
                  </p>
                  <p className="text-[10px] text-white/50">{gregorianDate(now, loc.tz)}</p>
                </div>
                <div className="mt-2.5 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-[32px] font-semibold leading-none">
                      {next.next.name}
                    </h2>
                    <p className="mt-2 font-display text-[20px] font-semibold text-gold-soft">
                      {formatTime(next.next.time, loc.tz)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-arabic text-[20px] leading-none text-gold" dir="rtl">
                      {next.next.arabic}
                    </p>
                    <p className="mt-2.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
                      in
                    </p>
                    <p className="font-display text-[21px] font-semibold leading-none">
                      {countdown(next.remainingMs).text}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft transition-[width] duration-1000"
                    style={{ width: `${Math.max(3, next.progress * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-line/60">
              {PRAYERS.map((p) => {
                const Icon = ICONS[p.key]
                const isNext = p.key === next.next.key
                const isSunrise = p.key === 'sunrise'
                const past = today[p.key].getTime() < now.getTime() && !isNext
                return (
                  <div
                    key={p.key}
                    className={cx(
                      'flex items-center gap-3 px-4 py-3',
                      isNext && 'bg-gold-soft/30',
                      isSunrise && 'bg-surface2/30',
                    )}
                  >
                    <span
                      className={cx(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-full',
                        isNext
                          ? 'bg-brand text-gold-soft'
                          : isSunrise
                            ? 'bg-surface2 text-muted/70'
                            : 'bg-surface2 text-brand dark:text-gold',
                      )}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cx(
                          'text-[13px] font-semibold',
                          past && 'text-muted',
                          isSunrise && 'text-[12px] font-medium text-muted',
                        )}
                      >
                        {p.name}
                        {isSunrise && <span className="ml-1 text-[10px]">· Shuruq</span>}
                      </p>
                      <p className="font-arabic text-[12px] leading-tight text-muted" dir="rtl">
                        {p.arabic}
                      </p>
                    </div>
                    {isNext && (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold-soft">
                        Next
                      </span>
                    )}
                    {past && !isSunrise && (
                      <span className="text-[9px] uppercase tracking-wide text-muted/50">Passed</span>
                    )}
                    <p
                      className={cx(
                        'w-[66px] shrink-0 text-right text-[13px] font-semibold tabular-nums',
                        isNext ? 'text-brand dark:text-gold' : past ? 'text-muted' : 'text-ink',
                      )}
                    >
                      {formatTime(today[p.key], loc.tz)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-4 animate-fade-up" style={{ animationDelay: '80ms' }}>
            <div className="mb-2.5 flex items-end justify-between">
              <h2 className="font-display text-[18px] font-semibold">This week</h2>
              <button
                onClick={() => setMethodOpen(true)}
                className="text-[10.5px] font-semibold text-gold"
              >
                {methodLabel(settings.method)} · {settings.madhab === 'hanafi' ? 'Hanafi' : 'Shafi'}
              </button>
            </div>
            <Card className="overflow-hidden">
              <div className="grid grid-cols-[40px_repeat(5,1fr)] gap-0 border-b border-line/70 bg-surface2/40 px-2 py-2 text-[8.5px] font-bold uppercase tracking-wide text-muted">
                <span />
                {PRAYERS.filter((p) => p.key !== 'sunrise').map((p) => (
                  <span key={p.key} className="text-center">
                    {p.name.slice(0, 3)}
                  </span>
                ))}
              </div>
              {week.map((d, i) => {
                const label = new Intl.DateTimeFormat('en-US', {
                  weekday: 'short',
                  timeZone: loc.tz,
                }).format(d.date)
                return (
                  <div
                    key={i}
                    className={cx(
                      'grid grid-cols-[40px_repeat(5,1fr)] items-center gap-0 px-2 py-2',
                      i === 0 ? 'bg-gold-soft/25' : i % 2 === 1 && 'bg-surface2/20',
                    )}
                  >
                    <span
                      className={cx(
                        'text-[9.5px] font-semibold',
                        i === 0 ? 'text-brand dark:text-gold' : 'text-muted',
                      )}
                    >
                      {i === 0 ? 'Today' : label}
                    </span>
                    {PRAYERS.filter((p) => p.key !== 'sunrise').map((p) => (
                      <span
                        key={p.key}
                        className={cx(
                          'text-center text-[9.5px] tabular-nums',
                          i === 0 ? 'font-semibold text-ink' : 'text-muted',
                        )}
                      >
                        {formatTime(d.times[p.key], loc.tz).replace(/\s?[AP]M/, '')}
                      </span>
                    ))}
                  </div>
                )
              })}
            </Card>
            <p className="mt-2 px-1 text-[10px] leading-relaxed text-muted/70">
              Times are calculated astronomically for your coordinates. Confirm with your
              local masjid for the start of Ramadan and Eid.
            </p>
          </div>
        </>
      )}

      <LocationPicker open={locOpen} onClose={() => setLocOpen(false)} />

      <Sheet
        open={methodOpen}
        onClose={() => setMethodOpen(false)}
        title="Prayer calculation"
        subtitle="Match the method used by your local masjid"
      >
        <div className="pb-2">
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Calculation method
            </p>
            <div className="space-y-1">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => update({ method: m.id as MethodId })}
                  className={cx(
                    'tap flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left',
                    settings.method === m.id ? 'bg-brand-soft' : 'hover:bg-surface2/60',
                  )}
                >
                  <span className="pr-2">
                    <span className="block text-[12.5px] font-semibold">{m.label}</span>
                    <span className="block text-[10px] text-muted">{m.short}</span>
                  </span>
                  {settings.method === m.id && <Check size={16} className="shrink-0 text-gold" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Asr madhab
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['shafi', 'hanafi'] as Madhab[]).map((m) => (
                <button
                  key={m}
                  onClick={() => update({ madhab: m })}
                  className={cx(
                    'tap rounded-xl border px-3 py-2.5 text-[12px] font-semibold',
                    settings.madhab === m
                      ? 'border-brand bg-brand text-white'
                      : 'border-line bg-surface text-muted',
                  )}
                >
                  {m === 'shafi' ? 'Shafi / Maliki / Hanbali' : 'Hanafi'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-line px-3 py-2.5">
            <div>
              <p className="text-[12.5px] font-semibold">Hijri date adjustment</p>
              <p className="text-[10px] text-muted">Match your local moon sighting</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => update({ hijriOffset: Math.max(-2, settings.hijriOffset - 1) })}
                className="tap grid h-7 w-7 place-items-center rounded-full bg-surface2 text-muted"
                aria-label="Previous day"
              >
                <Minus size={13} />
              </button>
              <span className="w-8 text-center text-[13px] font-bold tabular-nums">
                {settings.hijriOffset > 0 ? `+${settings.hijriOffset}` : settings.hijriOffset}
              </span>
              <button
                onClick={() => update({ hijriOffset: Math.min(2, settings.hijriOffset + 1) })}
                className="tap grid h-7 w-7 place-items-center rounded-full bg-surface2 text-muted"
                aria-label="Next day"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
