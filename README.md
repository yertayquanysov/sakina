# Sakina — سكينة

A mobile-first Muslim companion PWA: prayer times, Qibla, the Quran, dhikr, nearby masjids and halal food. Everything is stored on the device — no accounts and no tracking.

## Run it

```bash
npm install
npm run dev          # http://127.0.0.1:5180/sakina/
```

Production build + local PWA preview:

```bash
npm run build
npm run preview      # http://127.0.0.1:4173/sakina/
```

Open the preview URL in Chrome or Safari and use **Add to Home Screen** / **Install app** to run it standalone and offline.

## Live site

**https://yertayquanysov.github.io/sakina/**

Every push to `main` builds the app and deploys it to GitHub Pages via `.github/workflows/deploy.yml`. The build uses the `/sakina/` base path; `scripts/postbuild.mjs` copies the app shell to `404.html` so deep links such as `/sakina/quran/1` work on Pages, and adds `.nojekyll`.

## Features

- **Home** — next prayer countdown, Hijri date, Qibla shortcut, verse of the day, dhikr summary.
- **Quran** — all 114 surahs, Uthmani Arabic + Saheeh International translation, Alafasy recitation, adjustable Arabic size, last-read bookmark, per-surah offline caching.
- **Zikr** — large tap counter with 33/99/100/1000 targets, undo/reset, daily streaks, 7-day chart, lifetime totals and a dhikr library.
- **Namaz** — astronomically calculated prayer times (Adhan), seven-day table, calculation-method and Asr madhab settings, Hijri adjustment, Ramadan notice.
- **Qibla** — live compass with permission flow, bearing and distance to the Kaaba, calibration guidance, and a manual north-up dial fallback.
- **Map** — nearby mosques and halal food on OpenStreetMap, radius filter, distance list, and one-tap directions.
- **Settings** — light/night theme, location, prayer method, Quran preferences, cache/history reset, privacy notes.

## Data & services

| Purpose | Source |
| --- | --- |
| Quran text + translation | [AlQuran Cloud](https://alquran.cloud) |
| Recitation | [EveryAyah](https://everyayah.com) (Mishary Rashid Alafasy) |
| Prayer times / Qibla | [`adhan`](https://github.com/batoulapps/adhan-js) calculated locally |
| Places | [OpenStreetMap](https://www.openstreetmap.org) via Nominatim, enriched by Overpass |
| Tiles | OpenStreetMap standard tiles |

Map searches try Nominatim first for fast results, then enrich them with Overpass in the background. Results are cached locally for six hours; the UI degrades gracefully if either service is unavailable.

## Project structure

```
src/
  components/   Onboarding, bottom nav, location picker, install prompt, UI primitives
  lib/          App context, prayer/Qibla math, Quran API, storage, compass, geo
  pages/        Home, Quran, SurahReader, Zikr, Namaz, Qibla, Maps, Settings
  data/         Dhikr library
scripts/
  gen-icons.mjs App icon generator
  functest.mjs  End-to-end functional checks (Puppeteer + local Chrome)
  audit.mjs     Overflow/accessibility audit at 320/360/390px + desktop
  shots.mjs     Screenshot capture into .shots/
```

## Notes

- Prayer times are calculated on-device for the chosen coordinates. Local masjid practice may differ — the calculation method and Hijri offset are adjustable.
- Halal venues come from OpenStreetMap community tags. Verify certification with the venue.
- The test scripts expect Google Chrome at `/Applications/Google Chrome.app`; adjust the `CHROME` constant if yours lives elsewhere.
