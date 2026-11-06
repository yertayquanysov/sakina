import { useMemo, useState } from 'react'
import { Check, ChevronDown, MapPin, Minus, MoonStar, Plus, Settings2 } from 'lucide-react'
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
} from '../lib/prayer'
import LocationPicker from '../components/LocationPicker'
import { Card, Sheet, cx } from '../components/ui'
import type { Madhab, MethodId } from '../lib/types'

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
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-nav pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="animate-fade-up flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-muted">
            {hijri.day} {hijri.monthName} {hijri.year} AH
          </p>
          <h1 className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.03em]">
            Namaz
          </h1>
          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-2 flex max-w-[240px] items-center gap-1 text-left text-[12px] text-muted"
          >
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{loc?.label ?? 'Set your location'}</span>
            <ChevronDown size={12} className="shrink-0" />
          </button>
        </div>
        <button
          onClick={() => setMethodOpen(true)}
          aria-label="Prayer settings"
          className="tap grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface2"
        >
          <Settings2 size={16} />
        </button>
      </header>

      {ramadan && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface2 px-3.5 py-2.5">
          <MoonStar size={14} className="shrink-0 text-brand" />
          <p className="text-[11.5px] text-muted">
            Ramadan Mubarak — may your fasts and prayers be accepted.
          </p>
        </div>
      )}

      {!loc && (
        <Card className="mt-5 p-5">
          <h2 className="text-[17px] font-semibold tracking-[-0.02em]">
            Prayer times need a location
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
            Choose your city or allow location access. Everything is calculated on your
            device.
          </p>
          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-4 rounded-lg bg-brand px-4 py-2.5 text-[12px] font-semibold text-white"
          >
            Set location
          </button>
        </Card>
      )}

      {loc && next && today && (
        <>
          <Card className="mt-5 animate-fade-up overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium text-muted">
                  {next.next.tomorrow ? 'Fajr tomorrow' : 'Next prayer'}
                </p>
                <p className="text-[10.5px] text-muted">{gregorianDate(now, loc.tz)}</p>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[28px] font-semibold leading-none tracking-[-0.03em]">
                    {next.next.name}
                  </h2>
                  <p className="mt-2 text-[13px] tabular-nums text-muted">
                    {formatTime(next.next.time, loc.tz)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-arabic text-[15px] leading-none text-muted" dir="rtl">
                    {next.next.arabic}
                  </p>
                  <p className="mt-2.5 text-[10px] text-muted">in</p>
                  <p className="mt-0.5 text-[21px] font-semibold leading-none tabular-nums tracking-[-0.02em]">
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
            </div>

            <div className="divide-y divide-line border-t border-line">
              {PRAYERS.map((p) => {
                const isNext = p.key === next.next.key
                const isSunrise = p.key === 'sunrise'
                const past = today[p.key].getTime() < now.getTime() && !isNext
                return (
                  <div
                    key={p.key}
                    className={cx(
                      'flex items-center gap-3 px-4 py-3',
                      isNext && 'bg-surface2/60',
                    )}
                  >
                    <span
                      className={cx(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        isNext ? 'bg-brand' : 'bg-line',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cx(
                          'text-[12.5px]',
                          isNext ? 'font-semibold' : past || isSunrise ? 'text-muted' : 'text-ink',
                        )}
                      >
                        {p.name}
                        {isSunrise && <span className="ml-1 text-[10px]">· Shuruq</span>}
                      </p>
                      <p className="font-arabic text-[11px] leading-tight text-muted" dir="rtl">
                        {p.arabic}
                      </p>
                    </div>
                    {isNext && (
                      <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-brand">
                        Next
                      </span>
                    )}
                    {past && !isSunrise && (
                      <span className="text-[9px] uppercase tracking-wide text-muted/50">
                        Passed
                      </span>
                    )}
                    <p
                      className={cx(
                        'w-[62px] shrink-0 text-right text-[12.5px] tabular-nums',
                        isNext ? 'font-semibold text-ink' : past ? 'text-muted' : 'text-ink',
                      )}
                    >
                      {formatTime(today[p.key], loc.tz)}
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>

          <div className="mt-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
            <div className="mb-2.5 flex items-end justify-between">
              <h2 className="text-[13px] font-semibold">This week</h2>
              <button
                onClick={() => setMethodOpen(true)}
                className="text-[10.5px] font-medium text-muted"
              >
                {methodLabel(settings.method)} · {settings.madhab === 'hanafi' ? 'Hanafi' : 'Shafi'}
              </button>
            </div>
            <Card className="overflow-hidden">
              <div className="grid grid-cols-[40px_repeat(5,1fr)] border-b border-line px-2 py-2 text-[8.5px] font-medium uppercase tracking-[0.08em] text-muted">
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
                      'grid grid-cols-[40px_repeat(5,1fr)] items-center px-2 py-2',
                      i === 0 && 'bg-surface2/60',
                    )}
                  >
                    <span
                      className={cx(
                        'text-[9.5px]',
                        i === 0 ? 'font-semibold text-ink' : 'text-muted',
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
            <p className="mt-2 px-0.5 text-[10px] leading-relaxed text-muted/70">
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
          <div className="mb-5">
            <p className="mb-2 text-[11px] font-medium text-muted">Calculation method</p>
            <div className="space-y-0.5">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => update({ method: m.id as MethodId })}
                  className={cx(
                    'tap flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left',
                    settings.method === m.id ? 'bg-surface2' : 'hover:bg-surface2/60',
                  )}
                >
                  <span className="pr-2">
                    <span className="block text-[12.5px] font-medium">{m.label}</span>
                    <span className="block text-[10px] text-muted">{m.short}</span>
                  </span>
                  {settings.method === m.id && <Check size={15} className="shrink-0 text-brand" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-[11px] font-medium text-muted">Asr madhab</p>
            <div className="grid grid-cols-2 gap-2">
              {(['shafi', 'hanafi'] as Madhab[]).map((m) => (
                <button
                  key={m}
                  onClick={() => update({ madhab: m })}
                  className={cx(
                    'tap rounded-lg border px-3 py-2.5 text-[11.5px] font-medium',
                    settings.madhab === m
                      ? 'border-ink bg-ink text-bg'
                      : 'border-line text-muted',
                  )}
                >
                  {m === 'shafi' ? 'Shafi / Maliki / Hanbali' : 'Hanafi'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line px-3.5 py-3">
            <div>
              <p className="text-[12.5px] font-medium">Hijri date adjustment</p>
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
              <span className="w-7 text-center text-[12.5px] font-semibold tabular-nums">
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
