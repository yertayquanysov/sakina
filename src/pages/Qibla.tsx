import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Compass,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  RotateCw,
  Sparkles,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { angleDelta, useCompass } from '../lib/compass'
import { qiblaBearing } from '../lib/prayer'
import { formatDistance, haversine } from '../lib/geo'
import LocationPicker from '../components/LocationPicker'
import { Card, cx } from '../components/ui'

const KAABA = { lat: 21.4225, lng: 39.8262 }

export default function Qibla() {
  const { settings } = useApp()
  const navigate = useNavigate()
  const [locOpen, setLocOpen] = useState(false)
  const loc = settings.location
  const { heading, status, request, needsPermission } = useCompass()
  const bearing = loc ? qiblaBearing(loc) : 118.99
  const distance = loc ? haversine(loc, KAABA) : null
  const delta = heading !== null ? angleDelta(bearing, heading) : null
  const aligned = delta !== null && Math.abs(delta) <= 4
  const dialRotation = heading !== null ? -heading : 0

  const ticks = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => {
        const angle = i * 5
        const major = angle % 45 === 0
        const mid = angle % 15 === 0
        return { angle, major, mid }
      }),
    [],
  )

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[max(0.9rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="tap grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] font-semibold leading-none">Qibla</h1>
          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-1 flex max-w-[260px] items-center gap-1 text-left text-[10.5px] text-muted"
          >
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{loc?.label ?? 'Set your location'}</span>
          </button>
        </div>
        <span className="font-arabic text-[18px] text-gold" dir="rtl">
          القبلة
        </span>
      </header>

      {!loc ? (
        <Card className="mt-6 p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand dark:text-gold">
            <Compass size={22} />
          </span>
          <p className="mt-3 font-display text-xl font-semibold">Find the Qibla</p>
          <p className="mx-auto mt-1.5 max-w-[32ch] text-[12px] leading-relaxed text-muted">
            We need your location to calculate the direction of the Kaaba in Makkah.
          </p>
          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-4 rounded-xl bg-brand px-4 py-2.5 text-[12px] font-bold text-white"
          >
            Set location
          </button>
        </Card>
      ) : (
        <>
          <div className="relative mt-4 flex justify-center">
            <div
              className={cx(
                'absolute top-10 h-64 w-64 rounded-full blur-3xl transition-colors duration-500',
                aligned ? 'bg-gold/30' : 'bg-brand/10',
              )}
            />
            <div className="relative grid h-[320px] w-[320px] place-items-center">
              <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
                <div
                  className={cx(
                    'h-0 w-0 border-x-[7px] border-t-[10px] border-x-transparent transition-colors',
                    aligned ? 'border-t-gold' : 'border-t-brand/50 dark:border-t-gold/60',
                  )}
                />
              </div>

              <div
                className="absolute inset-0 transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${dialRotation}deg)` }}
              >
                <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden="true">
                  <circle cx="160" cy="160" r="152" fill="rgb(var(--surface))" />
                  <circle
                    cx="160"
                    cy="160"
                    r="152"
                    fill="none"
                    stroke="rgb(var(--line))"
                    strokeWidth="1"
                  />
                  <circle
                    cx="160"
                    cy="160"
                    r="136"
                    fill="none"
                    stroke="rgb(var(--line) / 0.6)"
                    strokeWidth="0.8"
                  />
                  {ticks.map((t) => {
                    const length = t.major ? 13 : t.mid ? 8 : 4
                    return (
                      <line
                        key={t.angle}
                        x1="160"
                        y1="8"
                        x2="160"
                        y2={8 + length}
                        stroke={t.major ? 'rgb(var(--brand))' : 'rgb(var(--muted) / 0.45)'}
                        strokeWidth={t.major ? 1.6 : 0.8}
                        strokeLinecap="round"
                        transform={`rotate(${t.angle} 160 160)`}
                      />
                    )
                  })}
                  {[
                    { label: 'N', x: 160, y: 38, strong: true },
                    { label: 'E', x: 285, y: 164, strong: false },
                    { label: 'S', x: 160, y: 290, strong: false },
                    { label: 'W', x: 35, y: 164, strong: false },
                  ].map((c) => (
                    <text
                      key={c.label}
                      x={c.x}
                      y={c.y}
                      textAnchor="middle"
                      fontSize={c.strong ? 13 : 11}
                      fontWeight={c.strong ? 700 : 500}
                      fill={c.strong ? 'rgb(var(--gold))' : 'rgb(var(--muted))'}
                    >
                      {c.label}
                    </text>
                  ))}

                  <g transform={`rotate(${bearing} 160 160)`}>
                    <line
                      x1="160"
                      y1="160"
                      x2="160"
                      y2="56"
                      stroke="rgb(var(--gold))"
                      strokeWidth="2"
                      strokeDasharray="3 5"
                      opacity="0.55"
                    />
                    <path
                      d="M160 52 L168 72 L160 68 L152 72 Z"
                      fill="rgb(var(--gold))"
                    />
                    <g transform="translate(160 44)">
                      <rect
                        x="-10"
                        y="-10"
                        width="20"
                        height="20"
                        rx="3"
                        fill="rgb(var(--brand-deep))"
                        stroke="rgb(var(--gold))"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M-6 4v-6h12v6M-7 4h14M-4 4v3M4 4v3M-2 -2h4v4h-4z"
                        fill="none"
                        stroke="rgb(var(--gold))"
                        strokeWidth="1"
                      />
                    </g>
                  </g>

                  <circle cx="160" cy="160" r="52" fill="rgb(var(--surface))" stroke="rgb(var(--line))" />
                  <circle cx="160" cy="160" r="52" fill="none" stroke="rgb(var(--gold) / 0.25)" />
                </svg>
              </div>

              <div className="relative z-[5] text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
                  {aligned ? 'Facing' : 'Qibla'}
                </p>
                <p className="mt-0.5 font-display text-[30px] font-semibold leading-none tabular-nums">
                  {Math.round(bearing)}°
                </p>
                <p className="mt-1 text-[9px] text-muted">from north</p>
              </div>
            </div>
          </div>

          <div
            className={cx(
              'mt-2 rounded-2xl border px-4 py-3 text-center transition-colors',
              aligned
                ? 'border-gold/40 bg-gold-soft/60'
                : 'border-line bg-surface',
            )}
          >
            {heading === null ? (
              <p className="text-[12px] font-semibold text-muted">
                {needsPermission
                  ? 'Enable the compass to see live direction'
                  : 'No compass sensor — align the top of your phone with north'}
              </p>
            ) : aligned ? (
              <p className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-brand dark:text-gold">
                <Sparkles size={14} /> You are facing the Qibla
              </p>
            ) : (
              <p className="text-[12.5px] font-semibold">
                Turn{' '}
                <span className="font-bold text-gold">
                  {Math.abs(Math.round(delta ?? 0))}° {((delta ?? 0) > 0 ? 'right' : 'left')}
                </span>{' '}
                to face the Kaaba
              </p>
            )}
          </div>

          {needsPermission && heading === null && (
            <button
              onClick={request}
              className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-[12.5px] font-bold text-white"
            >
              <Compass size={15} /> Enable compass
            </button>
          )}

          {status === 'denied' && (
            <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-center text-[11px] text-danger">
              Compass access was denied. You can still use the bearing above with a
              physical compass.
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Card className="p-4">
              <div className="flex items-center gap-1.5 text-muted">
                <Navigation size={13} />
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em]">Distance</p>
              </div>
              <p className="mt-1.5 font-display text-[19px] font-semibold leading-none">
                {distance ? formatDistance(distance) : '—'}
              </p>
              <p className="mt-1 text-[9.5px] text-muted">to the Kaaba, Makkah</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-1.5 text-muted">
                <LocateFixed size={13} />
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em]">Heading</p>
              </div>
              <p className="mt-1.5 font-display text-[19px] font-semibold leading-none tabular-nums">
                {heading !== null ? `${Math.round(heading)}°` : 'Manual'}
              </p>
              <p className="mt-1 text-[9.5px] text-muted">
                {heading !== null ? 'live compass' : 'north-up dial'}
              </p>
            </Card>
          </div>

          <div className="mt-3 flex gap-2.5 rounded-2xl border border-line/70 bg-surface2/40 px-4 py-3">
            <Info size={14} className="mt-0.5 shrink-0 text-gold" />
            <div className="text-[10.5px] leading-relaxed text-muted">
              <p className="font-semibold text-ink">Calibrate for accuracy</p>
              <p className="mt-0.5">
                Hold your phone flat and move it in a figure-eight. Keep away from magnets
                and metal. The Qibla is the shortest direction to the Kaaba.
              </p>
            </div>
          </div>

          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface py-2.5 text-[11.5px] font-semibold text-muted"
          >
            <RotateCw size={13} /> Update location
          </button>
        </>
      )}

      <LocationPicker open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  )
}
