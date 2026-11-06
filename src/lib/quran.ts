import surahs from '../data/surahs.json'

export type SurahMeta = {
  n: number
  name: string
  ar: string
  en: string
  meaning: string
  ayahs: number
  type: 'Meccan' | 'Medinan'
}

export const SURAHS = surahs as SurahMeta[]

export type Ayah = {
  n: number
  ar: string
  en: string
}

export type Surah = {
  meta: SurahMeta
  ayahs: Ayah[]
  fetchedAt: number
}

const CACHE_PREFIX = 'sakina:quran:'
const CACHE_INDEX = 'sakina:quran:index'
const MAX_CACHE = 10

type CacheIndex = { keys: { key: string; at: number }[] }

function readIndex(): CacheIndex {
  try {
    const raw = localStorage.getItem(CACHE_INDEX)
    if (!raw) return { keys: [] }
    return JSON.parse(raw) as CacheIndex
  } catch {
    return { keys: [] }
  }
}

function writeIndex(index: CacheIndex) {
  try {
    localStorage.setItem(CACHE_INDEX, JSON.stringify(index))
  } catch {
    /* ignore */
  }
}

function touch(key: string) {
  const index = readIndex()
  const next = index.keys.filter((k) => k.key !== key)
  next.unshift({ key, at: Date.now() })
  const evicted = next.splice(MAX_CACHE)
  for (const item of evicted) {
    try {
      localStorage.removeItem(item.key)
    } catch {
      /* ignore */
    }
  }
  writeIndex({ keys: next })
}

export function getCachedSurah(n: number): Surah | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + n)
    if (!raw) return null
    return JSON.parse(raw) as Surah
  } catch {
    return null
  }
}

export function cacheSurah(surah: Surah) {
  const key = CACHE_PREFIX + surah.meta.n
  try {
    localStorage.setItem(key, JSON.stringify(surah))
    touch(key)
  } catch {
    // Free space and retry once.
    const index = readIndex()
    const oldest = index.keys[index.keys.length - 1]
    if (oldest) {
      try {
        localStorage.removeItem(oldest.key)
      } catch {
        /* ignore */
      }
      writeIndex({ keys: index.keys.filter((k) => k.key !== oldest.key) })
    }
    try {
      localStorage.setItem(key, JSON.stringify(surah))
      touch(key)
    } catch {
      /* give up quietly */
    }
  }
}

export const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'

function cleanArabic(text: string) {
  return text.replace(
    /^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/,
    '',
  )
}

export async function fetchSurah(n: number, signal?: AbortSignal): Promise<Surah> {
  const meta = SURAHS.find((s) => s.n === n)
  if (!meta) throw new Error('Surah not found')
  const cached = getCachedSurah(n)
  if (cached && cached.ayahs.length === meta.ayahs) return cached

  const res = await fetch(
    `https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.sahih`,
    { signal },
  )
  if (!res.ok) throw new Error('Could not load the surah. Check your connection.')
  const json = (await res.json()) as {
    data: {
      ayahs: { numberInSurah: number; text: string }[]
    }[]
  }
  const arabic = json.data[0]?.ayahs ?? []
  const english = json.data[1]?.ayahs ?? []
  if (!arabic.length) throw new Error('Empty response from the Quran service.')

  const surah: Surah = {
    meta,
    fetchedAt: Date.now(),
    ayahs: arabic.map((a, i) => ({
      n: a.numberInSurah,
      ar:
        a.numberInSurah === 1 && n !== 1 && n !== 9
          ? cleanArabic(a.text)
          : a.text,
      en: english[i]?.text ?? '',
    })),
  }
  cacheSurah(surah)
  return surah
}

export function audioUrl(surah: number, ayah: number) {
  const s = String(surah).padStart(3, '0')
  const a = String(ayah).padStart(3, '0')
  return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`
}

export function searchSurahs(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return SURAHS
  return SURAHS.filter(
    (s) =>
      String(s.n) === q ||
      s.en.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q) ||
      s.name.includes(query) ||
      s.ar.includes(query),
  )
}
