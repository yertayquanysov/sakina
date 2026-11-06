import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCw,
  Settings2,
  Type,
} from 'lucide-react'
import { BISMILLAH, SURAHS, audioUrl, fetchSurah, type Surah } from '../lib/quran'
import { useApp } from '../lib/app-context'
import { Sheet, Spinner, Toggle, cx } from '../components/ui'

const FONT_SIZES = [
  { label: 'S', value: 0.9 },
  { label: 'M', value: 1 },
  { label: 'L', value: 1.15 },
  { label: 'XL', value: 1.32 },
]

function arabicNumber(n: number) {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}

export default function SurahReader() {
  const { n } = useParams()
  const number = Number(n)
  const meta = SURAHS.find((s) => s.n === number)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { settings, update, toast } = useApp()

  const [surah, setSurah] = useState<Surah | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState<number | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const scrolledRef = useRef(false)

  useEffect(() => {
    if (!meta) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setSurah(null)
    scrolledRef.current = false
    fetchSurah(number, controller.signal)
      .then((data) => {
        setSurah(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if ((err as Error).name === 'AbortError') return
        setError((err as Error).message || 'Could not load this surah.')
        setLoading(false)
      })
    return () => controller.abort()
  }, [number, meta, retryKey])

  useEffect(() => {
    if (!surah || scrolledRef.current) return
    const target = Number(searchParams.get('ayah') || 0)
    if (target > 1) {
      const el = document.getElementById(`ayah-${target}`)
      if (el) {
        scrolledRef.current = true
        setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250)
      }
    }
  }, [surah, searchParams])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  if (!meta) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="text-[17px] font-semibold">Surah not found</p>
          <Link to="/quran" className="mt-3 inline-block text-[12px] font-medium text-brand">
            Back to the Quran
          </Link>
        </div>
      </div>
    )
  }

  const play = (ayah: number) => {
    const audio = audioRef.current
    if (!audio) return
    if (playing === ayah) {
      audio.pause()
      setPlaying(null)
      return
    }
    audio.src = audioUrl(number, ayah)
    audio
      .play()
      .then(() => setPlaying(ayah))
      .catch(() => toast('Audio could not be played. Check your connection.'))
  }

  const onEnded = () => {
    if (!surah || playing === null) return
    const idx = surah.ayahs.findIndex((a) => a.n === playing)
    const next = surah.ayahs[idx + 1]
    if (next) {
      play(next.n)
      document.getElementById(`ayah-${next.n}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    } else {
      setPlaying(null)
    }
  }

  const isBookmarked = settings.lastRead?.surah === number

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 px-5 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="tap grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface2"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight">{meta.en}</p>
            <p className="text-[10.5px] text-muted">
              Surah {meta.n} · {meta.ayahs} ayahs · {meta.type}
            </p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Reading settings"
            className="tap grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface2"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </header>

      <div className="px-5">
        <div className="mt-5 rounded-2xl border border-line bg-surface px-5 py-5 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            {meta.type === 'Meccan' ? 'Revealed in Makkah' : 'Revealed in Madinah'}
          </p>
          <h1 className="mt-2 font-arabic text-[28px] leading-tight text-ink" dir="rtl">
            {meta.ar}
          </h1>
          <p className="mt-1.5 text-[13px] font-medium">{meta.en}</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {meta.meaning} · {meta.ayahs} ayahs
          </p>
          {isBookmarked && (
            <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-[10px] font-medium text-brand">
              <BookmarkCheck size={11} /> Last read
            </span>
          )}
        </div>

        {loading && (
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-line bg-surface p-4">
                <div className="skeleton mb-3 ml-auto h-6 w-4/5 rounded-lg" />
                <div className="skeleton mb-2 ml-auto h-6 w-3/5 rounded-lg" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton mt-1.5 h-3 w-2/3 rounded" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="mt-5 rounded-2xl border border-line px-6 py-10 text-center">
            <p className="text-[15px] font-semibold">Could not load the surah</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{error}</p>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="tap mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[12px] font-semibold text-white"
            >
              <RotateCw size={14} /> Try again
            </button>
          </div>
        )}

        {surah && !loading && (
          <>
            {number !== 1 && number !== 9 && (
              <p
                className="mt-6 text-center font-arabic text-[23px] leading-relaxed text-brand"
                dir="rtl"
              >
                {BISMILLAH}
              </p>
            )}

            <div className="mt-4 space-y-2">
              {surah.ayahs.map((ayah) => {
                const bookmarked = settings.lastRead?.surah === number && settings.lastRead?.ayah === ayah.n
                return (
                  <article
                    key={ayah.n}
                    id={`ayah-${ayah.n}`}
                    className={cx(
                      'scroll-mt-24 rounded-xl border bg-surface p-4 transition-colors',
                      playing === ayah.n ? 'border-brand/40' : 'border-line',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-md bg-surface2 px-1 text-[10px] font-medium tabular-nums text-muted">
                        {arabicNumber(ayah.n)}
                      </span>
                      <p
                        className="flex-1 text-right font-arabic leading-[2.1] text-ink"
                        style={{ fontSize: `${24 * settings.fontSize}px` }}
                        dir="rtl"
                      >
                        {ayah.ar}
                      </p>
                    </div>

                    {settings.translation && (
                      <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted">
                        {ayah.en}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-1.5">
                      <button
                        onClick={() => play(ayah.n)}
                        aria-label={playing === ayah.n ? 'Pause recitation' : 'Play recitation'}
                        className={cx(
                          'tap grid h-8 w-8 place-items-center rounded-full transition-colors',
                          playing === ayah.n
                            ? 'bg-brand text-white'
                            : 'bg-surface2 text-muted',
                        )}
                      >
                        {playing === ayah.n ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button
                        onClick={() => {
                          update({ lastRead: { surah: number, ayah: ayah.n } })
                          toast(`Marked ${meta.en} ${number}:${ayah.n} as last read`)
                        }}
                        aria-label="Mark as last read"
                        className={cx(
                          'tap grid h-8 w-8 place-items-center rounded-full transition-colors',
                          bookmarked ? 'bg-brand-soft text-brand' : 'bg-surface2 text-muted',
                        )}
                      >
                        {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      </button>
                      <span className="ml-auto text-[10px] tabular-nums text-muted/70">
                        {number}:{ayah.n}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                disabled={number === 1}
                onClick={() => navigate(`/quran/${number - 1}`)}
                className="tap flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-3 text-left disabled:opacity-40"
              >
                <ChevronLeft size={16} className="shrink-0 text-muted" />
                <span className="min-w-0">
                  <span className="block text-[9.5px] text-muted">Previous</span>
                  <span className="block truncate text-[12px] font-medium">
                    {SURAHS[number - 2]?.en ?? '—'}
                  </span>
                </span>
              </button>
              <button
                disabled={number === 114}
                onClick={() => navigate(`/quran/${number + 1}`)}
                className="tap flex items-center justify-end gap-2 rounded-xl border border-line bg-surface px-3 py-3 text-right disabled:opacity-40"
              >
                <span className="min-w-0">
                  <span className="block text-[9.5px] text-muted">Next</span>
                  <span className="block truncate text-[12px] font-medium">
                    {SURAHS[number]?.en ?? '—'}
                  </span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </button>
            </div>

            <p className="mt-5 text-center text-[10px] leading-relaxed text-muted/70">
              Recitation: Mishary Rashid Alafasy · Translation: Saheeh International
            </p>
          </>
        )}
      </div>

      <audio ref={audioRef} onEnded={onEnded} preload="none" />

      <Sheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Reading settings"
        subtitle="Make the Quran comfortable to read"
      >
        <div className="space-y-5 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12.5px] font-medium">Translation</p>
              <p className="text-[10.5px] text-muted">Saheeh International</p>
            </div>
            <Toggle
              checked={settings.translation}
              onChange={(v) => update({ translation: v })}
              label="Show translation"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-medium">
              <Type size={14} className="text-muted" /> Arabic size
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-surface2 p-1">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.label}
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
          <div className="rounded-xl bg-surface2 px-3.5 py-3 text-[10.5px] leading-relaxed text-muted">
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner /> Caching this surah for offline reading…
              </span>
            ) : (
              'Read surahs are saved on this device, so you can continue offline.'
            )}
          </div>
        </div>
      </Sheet>
    </div>
  )
}
