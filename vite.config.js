import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Файли з public/, без яких застосунок не запуститься офлайн.
const STATIC_FILES = ['manifest.webmanifest', 'icon.svg', 'app-icon-180.png', 'app-icon-192.png']

// Імена зібраних JS/CSS містять хеш, тому сервіс-воркер не може знати їх наперед.
// Після збірки вписуємо в dist/sw.js точний список файлів і версію кешу —
// так застосунок працює офлайн уже після першого відкриття.
function precacheServiceWorker() {
  let outDir = 'dist'
  let bundled = []
  return {
    name: 'precache-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    generateBundle(_, bundle) {
      bundled = Object.keys(bundle).filter((file) => !file.endsWith('.map'))
    },
    async closeBundle() {
      const files = [...new Set(['index.html', ...bundled, ...STATIC_FILES])].sort()
      const list = ['./', ...files.map((file) => `./${file}`)]
      const build = createHash('sha256').update(list.join('|')).digest('hex').slice(0, 10)
      const path = resolve(outDir, 'sw.js')
      const source = await readFile(path, 'utf8')
      const patched = source
        .replace("'__BUILD__'", JSON.stringify(build))
        .replace("/*__PRECACHE__*/ ['./']", JSON.stringify(list))
      if (patched === source) throw new Error('sw.js: не знайдено місць для списку файлів')
      await writeFile(path, patched)
    },
  }
}

export default defineConfig({
  // Сайт живе в підтеці (paliibo.github.io/shift-calendar/), тому всі шляхи відносні.
  base: './',
  plugins: [react(), tailwindcss(), precacheServiceWorker()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
