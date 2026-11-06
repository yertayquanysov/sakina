import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://127.0.0.1:5180/sakina'

const settings = {
  theme: 'light',
  method: 'MWL',
  madhab: 'shafi',
  hijriOffset: 0,
  location: {
    lat: 51.5072,
    lng: -0.1276,
    label: 'London, United Kingdom',
    tz: 'Europe/London',
    auto: false,
  },
  translation: true,
  fontSize: 1,
  lastRead: { surah: 1, ayah: 1 },
  onboarded: true,
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
})

const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message))
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE:', m.text()))

const seed = async () => {
  await page.evaluateOnNewDocument((s) => {
    localStorage.setItem('sakina:settings:v1', JSON.stringify(s))
  }, settings)
}

const clickText = async (text, selector = 'button') => {
  const ok = await page.evaluate(
    (text, selector) => {
      const el = [...document.querySelectorAll(selector)].find((e) =>
        (e.textContent || '').includes(text),
      )
      if (!el) return false
      el.click()
      return true
    },
    text,
    selector,
  )
  if (!ok) throw new Error(`Could not find ${selector} with text ${text}`)
  await new Promise((r) => setTimeout(r, 350))
}

const read = (key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key)

await seed()
await page.goto(BASE + '/', { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 800))

// ---- Map: mosques
console.log('\n[MAP] loading mosques…')
await page.goto(`${BASE}/map`, { waitUntil: 'networkidle2' })
await page.waitForFunction(() => document.querySelectorAll('.sakina-marker').length > 0, {
  timeout: 50000,
})
const mosqueInfo = await page.evaluate(() => ({
  markers: document.querySelectorAll('.sakina-marker').length,
  subtitle: [...document.querySelectorAll('p')].map((p) => p.textContent).find((t) => t?.includes('within')),
  first: document.querySelectorAll('.sakina-marker').length,
}))
console.log('[MAP] mosques', mosqueInfo)

// ---- Map: halal
console.log('[MAP] loading halal…')
await clickText('Halal food', 'button')
await page.waitForFunction(
  () =>
    document.querySelectorAll('.sakina-marker').length > 0 ||
    document.body.innerText.includes('No halal places found'),
  { timeout: 50000 },
)
const halalInfo = await page.evaluate(() => ({
  markers: document.querySelectorAll('.sakina-marker').length,
  text: document.body.innerText.replace(/\s+/g, ' ').match(/Halal food.{0,160}/)?.[0],
}))
console.log('[MAP] halal', halalInfo)

// ---- Zikr persistence
await page.goto(`${BASE}/zikr`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 500))
for (let i = 0; i < 3; i++) {
  await page.click('button[aria-label="Count SubhanAllah"]')
  await new Promise((r) => setTimeout(r, 90))
}
let zikr = await read('sakina:zikr:v1')
console.log('[ZIKR] after 3 taps', zikr.records.subhanallah, 'log', zikr.log, 'streak', zikr.streak)
await page.reload({ waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 500))
const shown = await page.evaluate(() => document.querySelector('button[aria-label="Count SubhanAllah"]')?.innerText.replace(/\s+/g, ' '))
console.log('[ZIKR] after reload shows:', shown)
await clickText('Undo', 'button')
zikr = await read('sakina:zikr:v1')
console.log('[ZIKR] after undo', zikr.records.subhanallah.today)
await clickText('99', 'button')
zikr = await read('sakina:zikr:v1')
console.log('[ZIKR] target set to', zikr.records.subhanallah.target)
await clickText('Change', 'button')
await new Promise((r) => setTimeout(r, 400))
await clickText('Astaghfirullah', 'button')
const selected = await page.evaluate(() => localStorage.getItem('sakina:zikr:selected'))
console.log('[ZIKR] selected', selected)

// ---- Quran reader
await page.goto(`${BASE}/quran/2`, { waitUntil: 'networkidle2' })
await page.waitForFunction(() => document.querySelectorAll('[id^="ayah-"]').length > 100, {
  timeout: 30000,
})
const ayahCount = await page.evaluate(() => document.querySelectorAll('[id^="ayah-"]').length)
console.log('[QURAN] ayahs rendered', ayahCount)
await page.evaluate(() => {
  document.querySelectorAll('button[aria-label="Mark as last read"]')[4]?.click()
})
await new Promise((r) => setTimeout(r, 400))
console.log('[QURAN] lastRead', (await read('sakina:settings:v1')).lastRead)

await page.click('button[aria-label="Reading settings"]')
await new Promise((r) => setTimeout(r, 400))
await page.evaluate(() => {
  const sw = document.querySelector('[role="switch"]')
  if (sw) sw.click()
})
await new Promise((r) => setTimeout(r, 300))
console.log('[QURAN] translation setting', (await read('sakina:settings:v1')).translation)

// ---- Namaz method
await page.goto(`${BASE}/namaz`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 700))
await page.click('button[aria-label="Prayer settings"]')
await new Promise((r) => setTimeout(r, 400))
await clickText('Umm al-Qura', 'button')
console.log('[NAMAZ] method', (await read('sakina:settings:v1')).method)
const namazText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 220))
console.log('[NAMAZ] text', namazText)

// ---- Settings theme
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 500))
await clickText('Night', 'button')
const theme = await page.evaluate(() => ({
  dark: document.documentElement.classList.contains('dark'),
  stored: JSON.parse(localStorage.getItem('sakina:settings:v1')).theme,
  meta: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
}))
console.log('[SETTINGS] theme', theme)

// ---- Location picker
await page.goto(BASE + '/', { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 700))
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('London, United Kingdom'))
  btn?.click()
})
await new Promise((r) => setTimeout(r, 500))
await clickText('Istanbul', 'button')
const loc = (await read('sakina:settings:v1')).location
console.log('[LOCATION] picked', loc.label, loc.tz)
const homeText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 160))
console.log('[LOCATION] home', homeText)

// ---- Onboarding skip (fresh page without the seeded settings)
const fresh = await browser.newPage()
await fresh.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
await fresh.goto(BASE + '/', { waitUntil: 'networkidle2' })
await fresh.evaluate(() => localStorage.clear())
await fresh.reload({ waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 800))
const onboarding = await fresh.evaluate(() => ({
  bismillah: document.body.innerText.includes('بِسْمِ اللَّهِ'),
  buttons: [...document.querySelectorAll('button')].map((b) => b.textContent?.trim()).slice(0, 5),
}))
console.log('[ONBOARDING]', onboarding)
await fresh.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Skip'))
  if (!el) throw new Error('Skip button missing')
  el.click()
})
await new Promise((r) => setTimeout(r, 600))
const afterSkip = await fresh.evaluate(() => ({
  onboarded: JSON.parse(localStorage.getItem('sakina:settings:v1')).onboarded,
  hasHeroPrompt: document.body.innerText.includes('Know your next prayer'),
  h1: document.querySelector('h1')?.textContent,
}))
console.log('[ONBOARDING] after skip', afterSkip)
await fresh.close()

await browser.close()
console.log('\nall functional checks done')
