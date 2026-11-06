import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpenText,
  Check,
  ChevronRight,
  Database,
  Info,
  MapPin,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Type,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { METHODS, methodLabel } from '../lib/prayer'
import { ZIKR_KEY, loadZikr } from '../lib/zikr'
import { SURAHS } from '../lib/quran'
import LocationPicker from '../components/LocationPicker'
import { Card, SectionTitle, Sheet, Toggle, cx } from '../components/ui'
import type { Madhab } from '../lib/types'

const FONT_SIZES = [
  { label: 'Small', value: 0.9 },
  { label: 'Medium', value: 1 },
  { label: 'Large', value: 1.15 },
  { label: 'X-Large', value: 1.32 },
]

export default function Settings() {
  const { settings, update, toast } = useApp()
  const navigate = useNavigate()
  const [locOpen, setLocOpen] = useState(false)
  const [methodOpen, setMethodOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState<null | 'zikr' | 'all'>(null)
  const zikr = loadZikr()

  const clearQuranCache = () => {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('sakina:quran:') || key === 'sakina:quran:index')) keys.push(key)
    }
    keys.forEach((k) => localStorage.removeItem(k))
    toast(`Cleared ${keys.length ? 'cached surahs' : 'Quran cache'}`)
  }

  const doReset = () => {
    if (confirmReset === 'zikr') {
      localStorage.removeItem(ZIKR_KEY)
      toast('Zikr history cleared')
    } else if (confirmReset === 'all') {
      localStorage.clear()
      window.location.assign(import.meta.env.BASE_URL)
      return
    }
    setConfirmReset(null)
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="tap grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface2"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-[20px] font-semibold leading-none tracking-[-0.02em]">Settings</h1>
          <p className="mt-1.5 text-[11px] text-muted">Sakina, your way</p>
        </div>
      </header>

      <div className="mt-6">
        <SectionTitle>Appearance</SectionTitle>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface2 p-1">
          {[
            { value: 'light' as const, label: 'Daylight', icon: Sun },
            { value: 'dark' as const, label: 'Night', icon: Moon },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => update({ theme: t.value })}
              className={cx(
                'tap flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12px] font-medium transition-colors',
                settings.theme === t.value
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-muted',
              )}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle>Location & prayer</SectionTitle>
        <Card className="divide-y divide-line">
          <button
            onClick={() => setLocOpen(true)}
            className="tap flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface2 text-muted">
              <MapPin size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-medium">Location</span>
              <span className="block truncate text-[10.5px] text-muted">
                {settings.location?.label ?? 'Not set'}
              </span>
            </span>
            <ChevronRight size={15} className="shrink-0 text-muted/60" />
          </button>

          <button
            onClick={() => setMethodOpen(true)}
            className="tap flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface2 text-muted">
              <Sparkles size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-medium">Calculation method</span>
              <span className="block truncate text-[10.5px] text-muted">
                {METHODS.find((m) => m.id === settings.method)?.label}
              </span>
            </span>
            <ChevronRight size={15} className="shrink-0 text-muted/60" />
          </button>

          <div className="px-4 py-3.5">
            <p className="text-[12.5px] font-medium">Asr madhab</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['shafi', 'hanafi'] as Madhab[]).map((m) => (
                <button
                  key={m}
                  onClick={() => update({ madhab: m })}
                  className={cx(
                    'tap rounded-lg border py-2 text-[10.5px] font-medium',
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

          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-[12.5px] font-medium">Hijri adjustment</p>
              <p className="text-[10.5px] text-muted">Match your local moon sighting</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => update({ hijriOffset: Math.max(-2, settings.hijriOffset - 1) })}
                className="tap grid h-7 w-7 place-items-center rounded-full bg-surface2 text-muted"
                aria-label="Subtract a day"
              >
                <Minus size={13} />
              </button>
              <span className="w-7 text-center text-[12.5px] font-semibold tabular-nums">
                {settings.hijriOffset > 0 ? `+${settings.hijriOffset}` : settings.hijriOffset}
              </span>
              <button
                onClick={() => update({ hijriOffset: Math.min(2, settings.hijriOffset + 1) })}
                className="tap grid h-7 w-7 place-items-center rounded-full bg-surface2 text-muted"
                aria-label="Add a day"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <SectionTitle>Quran</SectionTitle>
        <Card className="divide-y divide-line">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-[12.5px] font-medium">Show translation</p>
              <p className="text-[10.5px] text-muted">Saheeh International</p>
            </div>
            <Toggle
              checked={settings.translation}
              onChange={(v) => update({ translation: v })}
              label="Show translation"
            />
          </div>
          <div className="px-4 py-3.5">
            <div className="mb-2 flex items-center gap-1.5">
              <Type size={14} className="text-muted" />
              <p className="text-[12.5px] font-medium">Arabic text size</p>
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-surface2 p-1">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => update({ fontSize: f.value })}
                  className={cx(
                    'tap rounded-lg py-1.5 text-[10px] font-medium transition-colors',
                    Math.abs(settings.fontSize - f.value) < 0.01
                      ? 'bg-surface text-ink shadow-sm'
                      : 'text-muted',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <SectionTitle>Your data</SectionTitle>
        <Card className="divide-y divide-line">
          <button
            onClick={clearQuranCache}
            className="tap flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface2 text-muted">
              <Database size={15} />
            </span>
            <span className="flex-1">
              <span className="block text-[12.5px] font-medium">Clear cached surahs</span>
              <span className="block text-[10.5px] text-muted">
                {SURAHS.length} surahs available to download on demand
              </span>
            </span>
            <RotateCcw size={14} className="text-muted/60" />
          </button>
          <button
            onClick={() => setConfirmReset('zikr')}
            className="tap flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface2 text-muted">
              <Sparkles size={15} />
            </span>
            <span className="flex-1">
              <span className="block text-[12.5px] font-medium">Reset dhikr history</span>
              <span className="block text-[10.5px] text-muted">
                {zikr.lifetime} lifetime · {zikr.streak} day streak
              </span>
            </span>
            <Trash2 size={14} className="text-danger" />
          </button>
        </Card>
      </div>

      <div className="mt-6">
        <SectionTitle>About</SectionTitle>
        <Card className="divide-y divide-line">
          <div className="flex items-start gap-3 px-4 py-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface2 text-muted">
              <ShieldCheck size={15} />
            </span>
            <div>
              <p className="text-[12.5px] font-medium">Private by design</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">
                Your location, reading progress and dhikr are stored only on this device.
                No accounts, no tracking.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 px-4 py-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface2 text-muted">
              <BookOpenText size={15} />
            </span>
            <div>
              <p className="text-[12.5px] font-medium">Sources</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">
                Quran text from AlQuran Cloud, prayer calculations by Adhan, places from
                OpenStreetMap.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface2 text-muted">
              <Info size={15} />
            </span>
            <div>
              <p className="text-[12.5px] font-medium">Sakina 1.0</p>
              <p className="text-[10.5px] text-muted">Made with care · 1448 AH</p>
            </div>
          </div>
        </Card>
      </div>

      <button
        onClick={() => setConfirmReset('all')}
        className="tap mt-4 w-full rounded-xl border border-danger/25 py-3 text-[11.5px] font-medium text-danger"
      >
        Reset all app data
      </button>

      <LocationPicker open={locOpen} onClose={() => setLocOpen(false)} />

      <Sheet
        open={methodOpen}
        onClose={() => setMethodOpen(false)}
        title="Calculation method"
        subtitle={`Currently using ${methodLabel(settings.method)}`}
      >
        <div className="space-y-0.5 pb-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                update({ method: m.id })
                setMethodOpen(false)
              }}
              className={cx(
                'tap flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left',
                settings.method === m.id ? 'bg-surface2' : 'hover:bg-surface2/60',
              )}
            >
              <span>
                <span className="block text-[12.5px] font-medium">{m.label}</span>
                <span className="block text-[10px] text-muted">{m.short}</span>
              </span>
              {settings.method === m.id && <Check size={15} className="text-brand" />}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet
        open={confirmReset !== null}
        onClose={() => setConfirmReset(null)}
        title={confirmReset === 'all' ? 'Reset everything?' : 'Reset dhikr history?'}
        subtitle="This cannot be undone"
      >
        <p className="text-[12.5px] leading-relaxed text-muted">
          {confirmReset === 'all'
            ? 'Your settings, dhikr history and cached surahs will be removed from this device.'
            : 'All dhikr counts, rounds and streaks will be cleared. Your settings stay as they are.'}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setConfirmReset(null)}
            className="tap flex-1 rounded-lg border border-line py-2.5 text-[12px] font-medium text-muted"
          >
            Cancel
          </button>
          <button
            onClick={doReset}
            className="tap flex-1 rounded-lg bg-danger py-2.5 text-[12px] font-semibold text-white"
          >
            Yes, reset
          </button>
        </div>
      </Sheet>
    </div>
  )
}
