import { copyFile, writeFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

await access(join(dist, 'index.html'))

// GitHub Pages serves 404.html for unknown paths. Shipping the app shell there
// lets BrowserRouter resolve deep links such as /sakina/quran/1.
await copyFile(join(dist, 'index.html'), join(dist, '404.html'))

// Keep GitHub Pages from passing the build through Jekyll.
await writeFile(join(dist, '.nojekyll'), '')

console.log('postbuild: wrote dist/404.html and dist/.nojekyll')
