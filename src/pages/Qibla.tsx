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
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="tap grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface2"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] font-semibold leading-none tracking-[-0.02em]">Qibla</h1>
          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-1.5 flex max-w-[260px] items-center gap-1 text-left text-[11px] text-muted"
          >
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{loc?.label ?? 'Set your location'}</span>
          </button>
        </div>
        <span className="font-arabic text-[16px] text-muted/70" dir="rtl">
          القبلة
        </span>
      </header>

      {!loc ? (
        <Card className="mt-6 p-6 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-surface2 text-ink">
            <Compass size={20} />
          </span>
          <p className="mt-3 text-[17px] font-semibold tracking-[-0.02em]">Find the Qibla</p>
          <p className="mx-auto mt-1.5 max-w-[32ch] text-[12px] leading-relaxed text-muted">
            We need your location to calculate the direction of the Kaaba in Makkah.
          </p>
          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-4 rounded-lg bg-brand px-4 py-2.5 text-[12px] font-semibold text-white"
          >
            Set location
          </button>
        </Card>
      ) : (
        <>
          <div className="relative mt-6 flex justify-center">
            <div className="relative grid h-[300px] w-[300px] place-items-center">
              <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
                <div
                  className={cx(
                    'h-0 w-0 border-x-[6px] border-t-[9px] border-x-transparent transition-colors',
                    aligned ? 'border-t-brand' : 'border-t-muted/50',
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
                    r="151.5"
                    fill="none"
                    stroke="rgb(var(--line))"
                  />
                  {ticks.map((t) => {
                    const length = t.major ? 12 : t.mid ? 7 : 3
                    return (
                      <line
                        key={t.angle}
                        x1="160"
                        y1="8"
                        x2="160"
                        y2={8 + length}
                        stroke={t.major ? 'rgb(var(--muted))' : 'rgb(var(--line))'}
                        strokeWidth={t.major ? 1.4 : 0.8}
                        strokeLinecap="round"
                        transform={`rotate(${t.angle} 160 160)`}
                      />
                    )
                  })}
                  {[
                    { label: 'N', x: 160, y: 40, strong: true },
                    { label: 'E', x: 282, y: 164, strong: false },
                    { label: 'S', x: 160, y: 288, strong: false },
                    { label: 'W', x: 38, y: 164, strong: false },
                  ].map((c) => (
                    <text
                      key={c.label}
                      x={c.x}
                      y={c.y}
                      textAnchor="middle"
                      fontSize={c.strong ? 12 : 10}
                      fontWeight={c.strong ? 600 : 400}
                      fill={c.strong ? 'rgb(var(--ink))' : 'rgb(var(--muted))'}
                    >
                      {c.label}
                    </text>
                  ))}

                  <g transform={`rotate(${bearing} 160 160)`}>
                    <line
                      x1="160"
                      y1="160"
                      x2="160"
                      y2="60"
                      stroke="rgb(var(--brand))"
                      strokeWidth="1.5"
                    />
                    <path d="M160 52 L166 70 L160 66 L154 70 Z" fill="rgb(var(--brand))" />
                    <g transform="translate(160 46)">
                      <rect
                        x="-8"
                        y="-8"
                        width="16"
                        height="16"
                        rx="3"
                        fill="rgb(var(--surface))"
                        stroke="rgb(var(--brand))"
                        strokeWidth="1.3"
                      />
                      <path
                        d="M-4 3v-4h8v4M-5 3h10M-3 3v2M3 3v2"
                        fill="none"
                        stroke="rgb(var(--brand))"
                        strokeWidth="0.9"
                      />
                    </g>
                  </g>

                  <circle cx="160" cy="160" r="50" fill="rgb(var(--surface))" stroke="rgb(var(--line))" />
                </svg>
              </div>

              <div className="relative z-[5] text-center">
                <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
                  {aligned ? 'Facing' : 'Qibla'}
                </p>
                <p className="mt-1 text-[28px] font-semibold leading-none tabular-nums tracking-[-0.03em]">
                  {Math.round(bearing)}°
                </p>
                <p className="mt-1 text-[9px] text-muted">from north</p>
              </div>
            </div>
          </div>

          <Card
            className={cx(
              'mt-4 px-4 py-3.5 text-center transition-colors',
              aligned && 'border-brand/30 bg-brand-soft',
            )}
          >
            {heading === null ? (
              <p className="text-[12px] text-muted">
                {needsPermission
                  ? 'Enable the compass to see live direction'
                  : 'No compass sensor — align the top of your phone with north'}
              </p>
            ) : aligned ? (
              <p className="flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-brand">
                <Sparkles size={14} /> You are facing the Qibla
              </p>
            ) : (
              <p className="text-[12px] text-muted">
                Turn{' '}
                <span className="font-semibold text-ink">
                  {Math.abs(Math.round(delta ?? 0))}° {((delta ?? 0) > 0 ? 'right' : 'left')}
                </span>{' '}
                to face the Kaaba
              </p>
            )}
          </Card>

          {needsPermission && heading === null && (
            <button
              onClick={request}
              className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-[12.5px] font-semibold text-white"
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

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-1.5 text-muted">
                <Navigation size={13} />
                <p className="text-[10px]">Distance</p>
              </div>
              <p className="mt-2 text-[18px] font-semibold leading-none tabular-nums tracking-[-0.02em]">
                {distance ? formatDistance(distance) : '—'}
              </p>
              <p className="mt-1 text-[9.5px] text-muted">to the Kaaba, Makkah</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-1.5 text-muted">
                <LocateFixed size={13} />
                <p className="text-[10px]">Heading</p>
              </div>
              <p className="mt-2 text-[18px] font-semibold leading-none tabular-nums tracking-[-0.02em]">
                {heading !== null ? `${Math.round(heading)}°` : 'Manual'}
              </p>
              <p className="mt-1 text-[9.5px] text-muted">
                {heading !== null ? 'live compass' : 'north-up dial'}
              </p>
            </Card>
          </div>

          <div className="mt-3 flex gap-2.5 rounded-xl bg-surface2 px-4 py-3">
            <Info size={14} className="mt-0.5 shrink-0 text-muted" />
            <div className="text-[10.5px] leading-relaxed text-muted">
              <p className="font-medium text-ink">Calibrate for accuracy</p>
              <p className="mt-0.5">
                Hold your phone flat and move it in a figure-eight. Keep away from magnets
                and metal. The Qibla is the shortest direction to the Kaaba.
              </p>
            </div>
          </div>

          <button
            onClick={() => setLocOpen(true)}
            className="tap mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[11.5px] font-medium text-muted"
          >
            <RotateCw size={13} /> Update location
          </button>
        </>
      )}

      <LocationPicker open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  )
}
