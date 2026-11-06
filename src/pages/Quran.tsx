import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenText, ChevronRight, Search, X } from 'lucide-react'
import { SURAHS, searchSurahs } from '../lib/quran'
import { useApp } from '../lib/app-context'
import { Card, cx } from '../components/ui'

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
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-nav pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="animate-fade-up flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted">Al-Qur'an al-Kareem</p>
          <h1 className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.03em]">
            The Quran
          </h1>
          <p className="mt-2 text-[12px] text-muted">
            114 surahs · 6,236 ayahs · Uthmani script
          </p>
        </div>
        <p className="font-arabic text-[20px] leading-none text-muted/70" dir="rtl">
          القرآن
        </p>
      </header>

      {continueSurah && (
        <Link
          to={`/quran/${continueSurah.n}?ayah=${lastRead?.ayah ?? 1}`}
          className="tap mt-5 flex animate-fade-up items-center gap-3 rounded-2xl border border-line bg-surface p-3.5"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface2 text-ink">
            <BookOpenText size={17} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] text-muted">Continue reading</p>
            <p className="mt-0.5 truncate text-[13px] font-medium">
              {continueSurah.en}
              <span className="font-normal text-muted"> · ayah {lastRead?.ayah ?? 1}</span>
            </p>
          </div>
          <ChevronRight size={15} className="shrink-0 text-muted/60" />
        </Link>
      )}

      <div className="sticky top-0 z-20 -mx-5 mt-5 bg-bg/90 px-5 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-2 rounded-xl bg-surface2 px-3.5 py-2.5">
          <Search size={15} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search surah, meaning or number"
            className="w-full bg-transparent text-[12.5px] placeholder:text-muted/70 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search">
              <X size={14} className="text-muted" />
            </button>
          )}
        </div>
        <div className="no-scrollbar mt-2 flex gap-1 overflow-x-auto">
          {(['all', 'Meccan', 'Medinan'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cx(
                'tap shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                filter === f ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
              )}
            >
              {f === 'all' ? 'All surahs' : f}
            </button>
          ))}
          <span className="ml-auto shrink-0 self-center pr-1 text-[10.5px] tabular-nums text-muted">
            {results.length} shown
          </span>
        </div>
      </div>

      <Card className="mt-2 animate-fade-up overflow-hidden">
        {results.map((s, i) => (
          <Link
            key={s.n}
            to={`/quran/${s.n}`}
            className={cx(
              'tap flex items-center gap-3 px-4 py-3',
              i !== 0 && 'border-t border-line',
            )}
          >
            <span className="w-6 shrink-0 text-right text-[11px] font-medium tabular-nums text-muted">
              {s.n}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium leading-tight">{s.en}</p>
              <p className="mt-0.5 truncate text-[10.5px] text-muted">
                {s.meaning} · {s.ayahs} ayahs · {s.type}
              </p>
            </div>
            <p className="shrink-0 font-arabic text-[17px] leading-tight text-ink" dir="rtl">
              {s.name}
            </p>
          </Link>
        ))}
        {!results.length && (
          <div className="px-6 py-12 text-center">
            <p className="text-[14px] font-semibold">Nothing found</p>
            <p className="mt-1 text-[12px] text-muted">Try another name or number.</p>
          </div>
        )}
      </Card>

      <p className="mt-5 text-center text-[10px] text-muted/70">
        Arabic text: Uthmani · Translation: Saheeh International
      </p>
    </div>
  )
}
