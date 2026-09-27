import { createRequire } from 'node:module'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { build } = require('esbuild')
const { chromium } = require('../../../d2r_v2/client/node_modules/@playwright/test')
await mkdir(path.join(here, '.generated'), { recursive: true })
await build({ entryPoints: [path.join(here, 'browser.js')], bundle: true, format: 'esm', outfile: path.join(here, '.generated/browser.js'), platform: 'browser' })
const bundle = await readFile(path.join(here, '.generated/browser.js'))
const server = createServer((req, res) => {
  if (req.url === '/browser.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle) }
  else { res.setHeader('Content-Type', 'text/html'); res.end('<script type="module" src="/browser.js"></script>') }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
const results = []
try {
  browser = await chromium.launch({ executablePath: process.env.OCR_CHROMIUM || path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe'), headless: true })
  const page = await browser.newPage()
  page.on('pageerror', e => console.error('browser:', e.message))
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.waitForFunction(() => typeof window.paddle === 'function')
  const cases = JSON.parse(await readFile(path.join(here, 'cases.json'), 'utf8'))
  for (const fixture of cases) {
    const bytes = await readFile(path.join(here, 'fixtures', fixture.file))
    const input = `data:image/${fixture.file.endsWith('.jpg') ? 'jpeg' : 'png'};base64,${bytes.toString('base64')}`
    for (const processed of [false, true]) {
      const data = await page.evaluate(([input, processed, crop]) => window.prepare(input, processed, crop), [input, processed, fixture.crop])
      const start = performance.now()
      const row = { id: fixture.id, lang: fixture.lang, processed, tesseract: await page.evaluate(([data, lang]) => window.tesseract(data, lang), [data, fixture.lang]) }
      row.tesseract.totalMs = performance.now() - start
      const paddleStart = performance.now()
      row.paddle = await page.evaluate(([data, lang]) => window.paddle(data, lang), [data, fixture.lang])
      row.paddle.totalMs = performance.now() - paddleStart
      results.push(row)
      await writeFile(path.join(here, 'results.json'), JSON.stringify(results, null, 2))
      console.log(`${fixture.id} ${processed ? 'current-preprocessing' : 'original'}: Tesseract ${Math.round(row.tesseract.ms)}ms, Paddle ${Math.round(row.paddle.ms)}ms`)
    }
  }
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
