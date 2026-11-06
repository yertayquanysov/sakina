import { emptyZikr, type ZikrState } from '../data/zikr'
import { readStore, todayKey, daysBetween } from './storage'

export const ZIKR_KEY = 'sakina:zikr:v1'

export function loadZikr(): ZikrState {
  const state = readStore<ZikrState>(ZIKR_KEY, emptyZikr)
  return {
    ...emptyZikr,
    ...state,
    records: state.records ?? {},
    rounds: state.rounds ?? {},
    log: state.log ?? {},
  }
}

export function todayTotal(state: ZikrState) {
  return state.log[todayKey()] ?? 0
}

export function streakCount(state: ZikrState) {
  if (!state.lastActive) return 0
  const diff = daysBetween(state.lastActive, todayKey())
  return diff === 0 || diff === 1 ? state.streak : 0
}

export function lastSevenDays(state: ZikrState) {
  const out: { day: string; count: number; label: string }[] = []
  const now = new Date()
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    out.push({
      day: todayKey(d),
      count: state.log[todayKey(d)] ?? 0,
      label: labels[d.getDay()],
    })
  }
  return out
}
