import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')

const art = `
  <path d="M40 21.2a12.6 12.6 0 1 0 0 21.6 14 14 0 1 1 0-21.6Z" fill="#FAFAF9"/>
  <circle cx="43.5" cy="22" r="2.2" fill="#7FE0B8"/>`

function iconSvg({ maskable = false } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="${maskable ? 0 : 15}" fill="#0F5B45"/>
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
