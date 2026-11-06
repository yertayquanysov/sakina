export type Dhikr = {
  id: string
  arabic: string
  translit: string
  meaning: string
  target: number
  virtue?: string
}

export const DHIKR: Dhikr[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    translit: 'SubhanAllah',
    meaning: 'Glory be to Allah',
    target: 33,
    virtue: 'Whoever says it 100 times a day will have his sins forgiven.',
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    translit: 'Alhamdulillah',
    meaning: 'All praise is for Allah',
    target: 33,
  },
  {
    id: 'allahuakbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    translit: 'Allahu Akbar',
    meaning: 'Allah is the Greatest',
    target: 34,
  },
  {
    id: 'tahlil',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    translit: 'La ilaha illallah',
    meaning: 'There is no god but Allah',
    target: 100,
    virtue: 'The best dhikr is La ilaha illallah.',
  },
  {
    id: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    translit: 'Astaghfirullah',
    meaning: 'I seek forgiveness from Allah',
    target: 100,
  },
  {
    id: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    translit: 'Allahumma salli ala Muhammad',
    meaning: 'O Allah, send blessings upon Muhammad ﷺ',
    target: 100,
    virtue: 'Whoever sends one blessing upon me, Allah sends ten upon him.',
  },
  {
    id: 'hawqala',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    translit: 'La hawla wa la quwwata illa billah',
    meaning: 'There is no power except with Allah',
    target: 100,
  },
  {
    id: 'subhan-bihamdih',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    translit: 'SubhanAllahi wa bihamdihi',
    meaning: 'Glory and praise be to Allah',
    target: 100,
    virtue: 'Two words light on the tongue, heavy on the scales.',
  },
  {
    id: 'tawheed',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    translit: 'La ilaha illallahu wahdahu la sharika lah',
    meaning: 'None has the right to be worshipped but Allah alone',
    target: 10,
    virtue: 'A protection from Shaytan for the whole day.',
  },
]

export type ZikrRecord = {
  total: number
  today: number
  date: string
  target: number
}

export type ZikrState = {
  records: Record<string, ZikrRecord>
  rounds: Record<string, number>
  log: Record<string, number>
  streak: number
  lastActive: string
  lifetime: number
}

export const emptyZikr: ZikrState = {
  records: {},
  rounds: {},
  log: {},
  streak: 0,
  lastActive: '',
  lifetime: 0,
}
