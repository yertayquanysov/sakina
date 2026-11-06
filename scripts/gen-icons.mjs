import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#12513F"/>
      <stop offset="1" stop-color="#07281F"/>
    </linearGradient>
    <linearGradient id="gold" x1="12" y1="10" x2="52" y2="56" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#E7CD8B"/>
      <stop offset="1" stop-color="#B78F37"/>
    </linearGradient>
  </defs>`

const art = `
  <path d="M32 9c9.4 0 17 7.2 17 16.2V52a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V25.2C15 16.2 22.6 9 32 9Z"
    fill="none" stroke="url(#gold)" stroke-width="1.6" opacity="0.78"/>
  <path d="M39.4 22.3a11.2 11.2 0 1 0 0 18.2 12.4 12.4 0 1 1 0-18.2Z" fill="url(#gold)"/>
  <path d="M44.6 27.2l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1 1.1-2.9Z" fill="url(#gold)"/>
  <circle cx="32" cy="52.5" r="1.4" fill="#E7CD8B" opacity="0.9"/>`

function iconSvg({ maskable = false } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64">
    ${defs}
    <rect width="64" height="64" rx="${maskable ? 0 : 14}" fill="url(#bg)"/>
    <g ${maskable ? 'transform="translate(32 32) scale(0.74) translate(-32 -32)"' : ''}>${art}</g>
  </svg>`
}

const favicon = iconSvg()

await mkdir(outDir, { recursive: true })
await writeFile(join(root, 'public', 'favicon.svg'), favicon)

const targets = [
  { file: 'icon-192.png', size: 192, svg: iconSvg() },
  { file: 'icon-512.png', size: 512, svg: iconSvg() },
  { file: 'maskable-512.png', size: 512, svg: iconSvg({ maskable: true }) },
  { file: 'apple-touch-icon.png', size: 180, svg: iconSvg({ maskable: true }) },
]

for (const target of targets) {
  await sharp(Buffer.from(target.svg)).resize(target.size, target.size).png().toFile(join(outDir, target.file))
  console.log('wrote', target.file)
}
