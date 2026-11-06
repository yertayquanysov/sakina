export type SavedLocation = {
  lat: number
  lng: number
  label: string
  tz: string
  auto: boolean
}

export type MethodId =
  | 'MWL'
  | 'ISNA'
  | 'EGYPT'
  | 'KARACHI'
  | 'MAKKAH'
  | 'DUBAI'
  | 'TURKEY'
  | 'MOONSIGHTING'
  | 'KUWAIT'
  | 'QATAR'
  | 'SINGAPORE'

export type Madhab = 'shafi' | 'hanafi'

export type Settings = {
  theme: 'light' | 'dark'
  method: MethodId
  madhab: Madhab
  hijriOffset: number
  location: SavedLocation | null
  translation: boolean
  fontSize: number
  lastRead: { surah: number; ayah: number } | null
  onboarded: boolean
}
