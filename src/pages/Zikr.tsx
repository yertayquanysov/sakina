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

  const circumference = 2 * Math.PI * 118

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-nav pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="animate-fade-up flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted">Remembrance</p>
          <h1 className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.03em]">
            Dhikr
          </h1>
          <p className="mt-2 text-[12px] text-muted">
            {dayTotal > 0 ? `${dayTotal} today` : 'Quiet the heart with remembrance'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-lg bg-surface2 px-2 py-1.5 text-[11px] font-medium text-muted">
              <Flame size={12} /> {streak}
            </span>
          )}
          <button
            onClick={() => setPickerOpen(true)}
            aria-label="Choose dhikr"
            className="tap grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface2"
          >
            <ListFilter size={16} />
          </button>
        </div>
      </header>

      <div className="mt-7 animate-fade-up text-center" style={{ animationDelay: '50ms' }}>
        <p className="font-arabic text-[25px] leading-relaxed text-ink" dir="rtl">
          {dhikr.arabic}
        </p>
        <p className="mt-2 text-[13px] font-medium">{dhikr.translit}</p>
        <p className="mt-0.5 text-[11px] text-muted">{dhikr.meaning}</p>
      </div>

      <div className="mt-5 flex justify-center">
        <button
          onClick={tap}
          aria-label={`Count ${dhikr.translit}`}
          className="tap relative grid h-[264px] w-[264px] place-items-center rounded-full"
        >
          <svg viewBox="0 0 260 260" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="130" cy="130" r="118" fill="rgb(var(--surface))" />
            <circle
              cx="130"
              cy="130"
              r="118"
              fill="none"
              stroke="rgb(var(--line))"
              strokeWidth="3"
            />
            <circle
              cx="130"
              cy="130"
              r="118"
              fill="none"
              stroke="rgb(var(--brand))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>

          {pulse > 0 && (
            <span
              key={pulse}
              className="pointer-events-none absolute h-[248px] w-[248px] animate-fade-in rounded-full border border-brand/20"
            />
          )}

          <span className="relative flex flex-col items-center">
            <span
              key={today}
              className="animate-pop text-[60px] font-semibold leading-none tabular-nums tracking-[-0.05em] text-ink"
            >
              {today}
            </span>
            <span className="mt-1.5 text-[11px] text-muted">of {target}</span>
            <span
              className={cx(
                'mt-4 inline-flex items-center gap-1 text-[9.5px] font-medium uppercase tracking-[0.14em]',
                complete ? 'text-brand' : 'text-muted/70',
              )}
            >
              {complete ? (
                <>
                  <Check size={11} /> Complete
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
              'tap min-w-[56px] rounded-lg px-3 py-2 text-[11.5px] font-medium tabular-nums transition-colors',
              target === t ? 'bg-ink text-bg' : 'bg-surface2 text-muted',
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
          className="tap flex flex-col items-center gap-1 rounded-xl bg-surface2 py-2.5 text-muted disabled:opacity-40"
        >
          <RotateCcw size={15} />
          <span className="text-[10px] font-medium">Undo</span>
        </button>
        <button
          onClick={reset}
          disabled={today === 0}
          className="tap flex flex-col items-center gap-1 rounded-xl bg-surface2 py-2.5 text-muted disabled:opacity-40"
        >
          <Trash2 size={15} />
          <span className="text-[10px] font-medium">Reset</span>
        </button>
        <button
          onClick={() => setPickerOpen(true)}
          className="tap flex flex-col items-center gap-1 rounded-xl bg-surface2 py-2.5 text-ink"
        >
          <Sparkles size={15} />
          <span className="text-[10px] font-medium">Change</span>
        </button>
      </div>

      <Card
        className="mt-5 grid animate-fade-up grid-cols-3 divide-x divide-line"
        style={{ animationDelay: '100ms' }}
      >
        {[
          { label: 'Today', value: dayTotal },
          { label: 'Rounds', value: rounds },
          { label: 'Lifetime', value: state.lifetime },
        ].map((s) => (
          <div key={s.label} className="px-2 py-3.5 text-center">
            <p className="text-[20px] font-semibold leading-none tabular-nums tracking-[-0.02em]">
              {s.value > 9999 ? `${Math.floor(s.value / 1000)}k` : s.value}
            </p>
            <p className="mt-1 text-[9.5px] text-muted">{s.label}</p>
          </div>
        ))}
      </Card>

      <Card className="mt-3 animate-fade-up p-4" style={{ animationDelay: '140ms' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-medium text-muted">Last 7 days</p>
          <p className="text-[10.5px] tabular-nums text-muted">
            {week.reduce((a, b) => a + b.count, 0)} dhikr
          </p>
        </div>
        <div className="flex h-16 items-end justify-between gap-2">
          {week.map((d, i) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-12 w-full items-end">
                <div
                  className={cx(
                    'w-full rounded-sm transition-all',
                    i === week.length - 1 ? 'bg-brand' : 'bg-brand/20',
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
        <p className="mt-4 border-l-2 border-line pl-3 text-[11.5px] leading-relaxed text-muted">
          {dhikr.virtue}
        </p>
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
                'tap flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left',
                d.id === dhikr.id ? 'border-brand/30 bg-brand-soft' : 'border-line bg-surface',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-arabic text-[17px] leading-snug text-ink" dir="rtl">
                  {d.arabic}
                </p>
                <p className="mt-0.5 text-[11.5px] font-medium">{d.translit}</p>
                <p className="truncate text-[10.5px] text-muted">{d.meaning}</p>
              </div>
              <span className="shrink-0 text-right">
                <span className="block text-[10px] font-medium tabular-nums text-muted">
                  {d.target}×
                </span>
                {d.id === dhikr.id ? (
                  <Check size={15} className="ml-auto mt-1 text-brand" />
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
