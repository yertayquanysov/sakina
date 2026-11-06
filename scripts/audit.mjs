import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://127.0.0.1:5180/sakina'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
})

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

const routes = ['/', '/quran', '/quran/1', '/zikr', '/namaz', '/qibla', '/map', '/settings']

for (const width of [320, 360, 390]) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  await page.evaluateOnNewDocument((s) => {
    localStorage.setItem('sakina:settings:v1', JSON.stringify(s))
  }, settings)
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })

  console.log(`\n===== viewport ${width}px =====`)
  for (const route of routes) {
    const errors = []
    const onErr = (e) => errors.push(e.message)
    page.on('pageerror', onErr)
    await page.goto(BASE + route, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, route === '/map' ? 7000 : route.startsWith('/quran/') ? 1500 : 700))

    const audit = await page.evaluate(() => {
      const vw = window.innerWidth
      const docOverflow = document.documentElement.scrollWidth - vw
      const offenders = []
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          const style = getComputedStyle(el)
          if (style.position === 'fixed' || style.overflowX === 'auto' || style.overflowX === 'scroll') return
          if (el.closest('.no-scrollbar')) return
          offenders.push(
            `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} [${Math.round(r.left)}..${Math.round(r.right)}]`,
          )
        }
      })
      const unlabeled = [...document.querySelectorAll('button, a')].filter((el) => {
        const name = (el.getAttribute('aria-label') || el.textContent || '').trim()
        return !name
      }).length
      return {
        docOverflow,
        offenders: offenders.slice(0, 6),
        unlabeled,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 260),
        ayahs: document.querySelectorAll('[id^="ayah-"]').length,
        markers: document.querySelectorAll('.sakina-marker').length,
        tiles: document.querySelectorAll('.leaflet-tile').length,
        nav: [...document.querySelectorAll('nav a')].map((a) => a.textContent?.trim()).join('|'),
      }
    })
    console.log(
      `${route.padEnd(10)} overflow=${audit.docOverflow} offenders=${audit.offenders.length} unlabeled=${audit.unlabeled} ayahs=${audit.ayahs} markers=${audit.markers} tiles=${audit.tiles}`,
    )
    if (audit.offenders.length) console.log('   overflow:', audit.offenders.join(' ; '))
    console.log('   h1:', audit.h1)
    console.log('   text:', audit.text)
    if (errors.length) console.log('   ERRORS:', errors.join(' | '))
    page.off('pageerror', onErr)
  }
  await page.close()
}

const desktop = await browser.newPage()
await desktop.setViewport({ width: 1280, height: 900 })
await desktop.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
await desktop.evaluate((s) => localStorage.setItem('sakina:settings:v1', JSON.stringify(s)), settings)
await desktop.goto(BASE + '/', { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 1000))
const desktopAudit = await desktop.evaluate(() => {
  const nav = document.querySelector('nav')
  const r = nav?.getBoundingClientRect()
  const main = document.querySelector('main') ?? document.querySelector('#root > div')
  return {
    navWidth: r ? Math.round(r.width) : null,
    contentWidth: main ? Math.round(main.getBoundingClientRect().width) : null,
  }
})
console.log('\n===== desktop 1280 =====')
console.log(desktopAudit)

await browser.close()
