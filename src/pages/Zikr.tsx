import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronRight,
  Flame,
  ListFilter,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { DHIKR, emptyZikr, type ZikrState } from '../data/zikr'
import { ZIKR_KEY, lastSevenDays, streakCount, todayTotal } from '../lib/zikr'
import { daysBetween, readStore, todayKey, useStored, vibrate, writeStore } from '../lib/storage'
import { useApp } from '../lib/app-context'
import { Card, Sheet, cx } from '../components/ui'

const TARGETS = [33, 99, 100, 1000]

export default function Zikr() {
  const { toast } = useApp()
  const [state, setState] = useState<ZikrState>(() => {
    const stored = readStore<ZikrState>(ZIKR_KEY, emptyZikr)
    return { ...emptyZikr, ...stored }
  })
  const [selectedId, setSelectedId] = useStored('sakina:zikr:selected', 'subhanallah')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    writeStore(ZIKR_KEY, state)
  }, [state])

  const dhikr = DHIKR.find((d) => d.id === selectedId) ?? DHIKR[0]
  const record = state.records[dhikr.id]
  const today = record?.date === todayKey() ? record.today : 0
  const target = record?.target ?? dhikr.target
  const rounds = state.rounds[dhikr.id] ?? 0
  const progress = Math.min(1, today / target)
  const complete = today >= target
  const dayTotal = todayTotal(state)
  const streak = streakCount(state)
  const week = useMemo(() => lastSevenDays(state), [state])
  const maxWeek = Math.max(1, ...week.map((d) => d.count))

  const tap = () => {
    const key = todayKey()
    setPulse((p) => p + 1)
    vibrate(complete ? [12, 40, 12] : 8)
    setState((prev) => {
      const existing = prev.records[dhikr.id] ?? {
        total: 0,
        today: 0,
        date: key,
        target: dhikr.target,
      }
      const base = existing.date === key ? existing : { ...existing, today: 0, date: key }
      const nextToday = base.today + 1
      const diff = prev.lastActive ? daysBetween(prev.lastActive, key) : 999
      const nextStreak =
        prev.lastActive === key ? prev.streak : diff === 1 ? prev.streak + 1 : 1
      return {
        ...prev,
        records: {
          ...prev.records,
          [dhikr.id]: { ...base, today: nextToday, total: base.total + 1 },
        },
        rounds: {
          ...prev.rounds,
          [dhikr.id]: Math.max(prev.rounds[dhikr.id] ?? 0, Math.floor(nextToday / target)),
        },
        log: { ...prev.log, [key]: (prev.log[key] ?? 0) + 1 },
        streak: nextStreak,
        lastActive: key,
        lifetime: prev.lifetime + 1,
      }
    })
    if ((today + 1) % target === 0) {
      toast(`Round complete — ${target} × ${dhikr.translit}`)
    }
  }

  const undo = () => {
    if (today === 0) return
    vibrate(6)
    setState((prev) => {
      const rec = prev.records[dhikr.id]
      if (!rec) return prev
      const key = todayKey()
      return {
        ...prev,
        records: {
          ...prev.records,
          [dhikr.id]: { ...rec, today: Math.max(0, rec.today - 1), total: Math.max(0, rec.total - 1) },
        },
        log: { ...prev.log, [key]: Math.max(0, (prev.log[key] ?? 0) - 1) },
        lifetime: Math.max(0, prev.lifetime - 1),
      }
    })
  }

  const reset = () => {
    setState((prev) => {
      const rec = prev.records[dhikr.id]
      if (!rec) return prev
      const key = todayKey()
      return {
        ...prev,
        records: {
          ...prev.records,
          [dhikr.id]: { ...rec, today: 0, date: key },
        },
        rounds: { ...prev.rounds, [dhikr.id]: 0 },
        log: { ...prev.log, [key]: Math.max(0, (prev.log[key] ?? 0) - rec.today) },
      }
    })
    toast('Counter reset for today')
  }

  const setTarget = (value: number) => {
    setState((prev) => {
      const key = todayKey()
      const existing = prev.records[dhikr.id] ?? {
        total: 0,
        today: 0,
        date: key,
        target: value,
      }
      return {
        ...prev,
        records: {
          ...prev.records,
          [dhikr.id]: { ...existing, target: value, date: key },
        },
      }
    })
  }

  const circumference = 2 * Math.PI * 116

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-nav pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="animate-fade-up flex items-start justify-between">
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-gold">
            Remembrance
          </p>
          <h1 className="mt-1.5 font-display text-[30px] font-semibold leading-none tracking-tight">
            Dhikr
          </h1>
          <p className="mt-1.5 text-[11.5px] text-muted">
            {dayTotal > 0 ? `${dayTotal} today` : 'Quiet the heart with remembrance'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1.5 text-[11px] font-bold text-gold">
              <Flame size={12} /> {streak}
            </span>
          )}
          <button
            onClick={() => setPickerOpen(true)}
            aria-label="Choose dhikr"
            className="tap grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted"
          >
            <ListFilter size={16} />
          </button>
        </div>
      </header>

      <div className="mt-5 animate-fade-up text-center" style={{ animationDelay: '50ms' }}>
        <p className="font-arabic text-[26px] leading-relaxed text-brand dark:text-gold" dir="rtl">
          {dhikr.arabic}
        </p>
        <p className="mt-1.5 text-[13px] font-semibold">{dhikr.translit}</p>
        <p className="mt-0.5 text-[11px] text-muted">{dhikr.meaning}</p>
      </div>

      <div className="relative mt-4 flex justify-center">
        <div className="pointer-events-none absolute top-8 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <button
          onClick={tap}
          aria-label={`Count ${dhikr.translit}`}
          className="tap relative grid h-[268px] w-[268px] place-items-center rounded-full"
        >
          <svg viewBox="0 0 260 260" className="absolute inset-0 h-full w-full -rotate-90">
            <circle
              cx="130"
              cy="130"
              r="116"
              fill="rgb(var(--surface))"
              stroke="rgb(var(--line) / 0.7)"
              strokeWidth="1"
            />
            <circle
              cx="130"
              cy="130"
              r="116"
              fill="none"
              stroke="rgb(var(--line))"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <circle
              cx="130"
              cy="130"
              r="116"
              fill="none"
              stroke="rgb(var(--gold))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
            <circle cx="130" cy="130" r="98" fill="none" stroke="rgb(var(--line) / 0.6)" strokeWidth="0.8" />
          </svg>

          {pulse > 0 && (
            <span
              key={pulse}
              className="pointer-events-none absolute h-[232px] w-[232px] animate-ripple rounded-full border border-gold/50"
            />
          )}

          <span className="relative flex flex-col items-center">
            <span
              key={today}
              className="animate-pop font-display text-[64px] font-semibold leading-none tabular-nums text-ink"
            >
              {today}
            </span>
            <span className="mt-1 text-[11px] font-medium text-muted">of {target}</span>
            <span
              className={cx(
                'mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.12em]',
                complete ? 'bg-brand text-gold-soft' : 'bg-surface2 text-muted',
              )}
            >
              {complete ? (
                <>
                  <Check size={10} /> Target complete
                </>
              ) : (
                'Tap to count'
              )}
            </span>
          </span>
        </button>
      </div>

      <div className="mt-5 flex justify-center gap-1.5">
        {TARGETS.map((t) => (
          <button
            key={t}
            onClick={() => setTarget(t)}
            className={cx(
              'tap min-w-[58px] rounded-full px-3 py-2 text-[11.5px] font-bold tabular-nums transition-colors',
              target === t
                ? 'bg-brand text-white shadow-sm'
                : 'border border-line bg-surface text-muted',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={undo}
          disabled={today === 0}
          className="tap flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface py-3 text-muted disabled:opacity-40"
        >
          <RotateCcw size={16} />
          <span className="text-[10.5px] font-semibold">Undo</span>
        </button>
        <button
          onClick={reset}
          disabled={today === 0}
          className="tap flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface py-3 text-muted disabled:opacity-40"
        >
          <Trash2 size={16} />
          <span className="text-[10.5px] font-semibold">Reset</span>
        </button>
        <button
          onClick={() => setPickerOpen(true)}
          className="tap flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface py-3 text-brand dark:text-gold"
        >
          <Sparkles size={16} />
          <span className="text-[10.5px] font-semibold">Change</span>
        </button>
      </div>

      <div className="mt-5 grid animate-fade-up grid-cols-3 gap-2" style={{ animationDelay: '100ms' }}>
        {[
          { label: 'Today', value: dayTotal },
          { label: 'Rounds', value: rounds },
          { label: 'Lifetime', value: state.lifetime },
        ].map((s) => (
          <Card key={s.label} className="px-2 py-3.5 text-center">
            <p className="font-display text-[22px] font-semibold leading-none tabular-nums">
              {s.value > 9999 ? `${Math.floor(s.value / 1000)}k` : s.value}
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
              {s.label}
            </p>
          </Card>
        ))}
      </div>

      <Card className="mt-3 animate-fade-up p-4" style={{ animationDelay: '140ms' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Last 7 days
          </p>
          <p className="text-[10.5px] text-muted">
            {week.reduce((a, b) => a + b.count, 0)} dhikr
          </p>
        </div>
        <div className="flex h-16 items-end justify-between gap-2">
          {week.map((d, i) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-12 w-full items-end">
                <div
                  className={cx(
                    'w-full rounded-t-md transition-all',
                    i === week.length - 1 ? 'bg-gold' : 'bg-brand/25 dark:bg-gold/25',
                  )}
                  style={{ height: `${Math.max(4, (d.count / maxWeek) * 100)}%` }}
                  title={`${d.count} dhikr`}
                />
              </div>
              <span className="text-[9px] text-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {dhikr.virtue && (
        <div className="mt-3 flex gap-2.5 rounded-2xl border border-gold/25 bg-gold-soft/40 px-4 py-3">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-[11px] leading-relaxed text-muted">{dhikr.virtue}</p>
        </div>
      )}

      <Sheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choose a dhikr"
        subtitle="Tap one to begin counting"
      >
        <div className="space-y-1.5 pb-2">
          {DHIKR.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedId(d.id)
                setPickerOpen(false)
              }}
              className={cx(
                'tap flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left',
                d.id === dhikr.id
                  ? 'border-gold/50 bg-gold-soft/40'
                  : 'border-line/70 bg-surface',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-arabic text-[18px] leading-snug text-brand dark:text-gold" dir="rtl">
                  {d.arabic}
                </p>
                <p className="mt-0.5 text-[11.5px] font-semibold">{d.translit}</p>
                <p className="truncate text-[10.5px] text-muted">{d.meaning}</p>
              </div>
              <span className="shrink-0 text-right">
                <span className="block text-[10px] font-bold text-muted">{d.target}×</span>
                {d.id === dhikr.id ? (
                  <Check size={16} className="ml-auto mt-1 text-gold" />
                ) : (
                  <ChevronRight size={15} className="ml-auto mt-1 text-muted/50" />
                )}
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
