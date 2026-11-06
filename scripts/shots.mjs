import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://127.0.0.1:5180/sakina'
const OUT = '/Users/ertai/sakina/.shots'

await mkdir(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=en-GB'],
})

const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text())
})
page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))

const shot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log('shot', name)
}

await page.goto(BASE + '/', { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 1200))
await shot('01-onboarding')

await page.evaluate(() => {
  localStorage.setItem(
    'sakina:settings:v1',
    JSON.stringify({
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
    }),
  )
})
await page.reload({ waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 1500))
await shot('02-home')

await page.goto(`${BASE}/quran`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 700))
await shot('03-quran')

await page.goto(`${BASE}/quran/1`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 1800))
await shot('04-reader')

await page.goto(`${BASE}/zikr`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 600))
for (let i = 0; i < 5; i++) {
  await page.click('button[aria-label="Count SubhanAllah"]')
  await new Promise((r) => setTimeout(r, 130))
}
await new Promise((r) => setTimeout(r, 500))
await shot('05-zikr')

await page.goto(`${BASE}/namaz`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 800))
await shot('06-namaz')

await page.goto(`${BASE}/qibla`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 900))
await shot('07-qibla')

await page.goto(`${BASE}/map`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 9000))
await shot('08-map')

await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 700))
await shot('09-settings')

await page.evaluate(() => {
  document.documentElement.classList.add('dark')
  localStorage.setItem(
    'sakina:settings:v1',
    JSON.stringify({
      theme: 'dark',
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
      lastRead: { surah: 18, ayah: 10 },
      onboarded: true,
    }),
  )
})
await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 1200))
await shot('10-home-dark')

await browser.close()
console.log('done')
