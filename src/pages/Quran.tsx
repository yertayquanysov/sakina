import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpenText, Search, X } from 'lucide-react'
import { SURAHS, searchSurahs } from '../lib/quran'
import { useApp } from '../lib/app-context'
import { cx } from '../components/ui'

type Filter = 'all' | 'Meccan' | 'Medinan'

export default function Quran() {
  const { settings } = useApp()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const results = useMemo(() => {
    const list = searchSurahs(query)
    return filter === 'all' ? list : list.filter((s) => s.type === filter)
  }, [query, filter])

  const lastRead = settings.lastRead
  const continueSurah = SURAHS.find((s) => s.n === lastRead?.surah)

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-nav pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="animate-fade-up">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-gold">
              Al-Qur'an al-Kareem
            </p>
            <h1 className="mt-1.5 font-display text-[30px] font-semibold leading-none tracking-tight">
              The Quran
            </h1>
            <p className="mt-1.5 text-[11.5px] text-muted">
              114 surahs · 6,236 ayahs · Uthmani script
            </p>
          </div>
          <p className="font-arabic text-[24px] leading-none text-gold/80" dir="rtl">
            القرآن
          </p>
        </div>
      </header>

      {continueSurah && (
        <Link
          to={`/quran/${continueSurah.n}?ayah=${lastRead?.ayah ?? 1}`}
          className="tap mt-5 flex animate-fade-up items-center gap-3.5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-deep p-4 text-white shadow-float"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10">
            <BookOpenText size={19} className="text-gold" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-gold-soft/70">
              Continue reading
            </p>
            <p className="mt-1 truncate text-[14px] font-semibold">
              {continueSurah.en}{' '}
              <span className="font-normal text-white/50">
                · ayah {lastRead?.ayah ?? 1}
              </span>
            </p>
          </div>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
            <ArrowUpRight size={15} />
          </span>
        </Link>
      )}

      <div className="sticky top-0 z-20 -mx-4 mt-5 bg-bg/80 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2 rounded-2xl border border-line/80 bg-surface px-3.5 py-2.5 shadow-sm">
          <Search size={16} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search surah, meaning or number"
            className="w-full bg-transparent text-[13px] placeholder:text-muted/70 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search">
              <X size={15} className="text-muted" />
            </button>
          )}
        </div>
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
          {(['all', 'Meccan', 'Medinan'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cx(
                'tap shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
                filter === f
                  ? 'bg-brand text-white'
                  : 'border border-line bg-surface text-muted',
              )}
            >
              {f === 'all' ? 'All surahs' : f}
            </button>
          ))}
          <span className="ml-auto shrink-0 self-center pr-1 text-[10.5px] text-muted">
            {results.length} shown
          </span>
        </div>
      </div>

      <div className="mt-2 animate-fade-up overflow-hidden rounded-3xl border border-line/80 bg-surface shadow-card">
        {results.map((s, i) => (
          <Link
            key={s.n}
            to={`/quran/${s.n}`}
            className={cx(
              'tap flex items-center gap-3 px-3.5 py-3',
              i !== 0 && 'border-t border-line/60',
            )}
          >
            <span className="relative grid h-10 w-10 shrink-0 place-items-center">
              <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <path
                  d="M15 3h14l12 12v14L29 41H15L3 29V15Z"
                  fill="none"
                  stroke="rgb(var(--gold) / 0.35)"
                  strokeWidth="1.1"
                />
              </svg>
              <span className="relative text-[11px] font-bold tabular-nums text-brand dark:text-gold">
                {s.n}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold leading-tight">{s.en}</p>
              <p className="mt-0.5 truncate text-[10.5px] text-muted">
                {s.meaning} · {s.ayahs} ayahs · {s.type}
              </p>
            </div>
            <p className="shrink-0 font-arabic text-[18px] leading-tight text-brand dark:text-gold" dir="rtl">
              {s.name}
            </p>
          </Link>
        ))}
        {!results.length && (
          <div className="px-6 py-12 text-center">
            <p className="font-display text-lg font-semibold">Nothing found</p>
            <p className="mt-1 text-[12px] text-muted">Try another name or number.</p>
          </div>
        )}
      </div>

      <p className="mt-5 text-center text-[10px] text-muted/60">
        Arabic text: Uthmani · Translation: Saheeh International
      </p>
    </div>
  )
}
