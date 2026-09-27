import { createRequire } from 'node:module'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
const require = createRequire(import.meta.url)
const { chromium } = require('../../../d2r_v2/client/node_modules/@playwright/test')
const here = path.dirname(fileURLToPath(import.meta.url))
const development = process.argv.includes('--dev')
const assets = path.resolve(here, '../../dist/ssr/client/assets')
const deps = path.join(here, '.generated/dev-deps/deps')
let workerSource
if (development) {
  // Reuse real Vite development prebundles, not esbuild's dependency resolver.
  const compiled = await build({
    entryPoints: [path.resolve(here, '../../src/common/ocr/paddle.worker.ts')],
    bundle: true, format: 'esm', write: false,
    plugins: [{ name: 'vite-prebundles', setup(build) {
      build.onResolve({ filter: /^(ppu-paddle-ocr\/web|onnxruntime-web)$/ }, ({ path: name }) => ({
        path: name === 'onnxruntime-web'
          ? 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.wasm.min.mjs'
          : '/deps/ppu-paddle-ocr_web.js', external: true
      }))
    } }]
  })
  workerSource = compiled.outputFiles[0].text
} else {
  const name = (await readdir(assets)).find(n => /^paddle\.worker\..*\.js$/.test(n))
  if (!name) throw new Error('Build the SSR client first')
  workerSource = await readFile(path.join(assets, name))
}
const server = createServer(async (req, res) => {
  if (req.url === '/worker.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(workerSource) }
  else if (development && /^\/deps\/[\w.-]+\.js$/.test(req.url)) {
    res.setHeader('Content-Type', 'text/javascript')
    res.end(await readFile(path.join(deps, path.basename(req.url))))
  }
  else res.end('<!doctype html><title>Standalone production OCR worker test</title>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({ executablePath: process.env.OCR_CHROMIUM || path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe'), headless: true })
  const page = await browser.newPage()
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  const results = []
  for (const [file, language, expected] of [['ko-stealth.png', 'ko', '생명력'], ['en-rare.jpg', 'en', 'Willpower']]) {
    const bytes = [...await readFile(path.join(here, 'fixtures', file))]
    const result = await page.evaluate(async ({ bytes, language }) => {
      const worker = new Worker('/worker.js', { type: 'module' })
      const start = performance.now()
      try {
        return await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Worker timed out')), 120000)
          worker.onmessage = ({ data }) => { clearTimeout(timeout); resolve({ ...data, ms: performance.now() - start }) }
          worker.onerror = event => { clearTimeout(timeout); reject(new Error(event.message)) }
          const image = new Uint8Array(bytes).buffer
          worker.postMessage({ id: 1, image, language }, [image])
        })
      } finally { worker.terminate() }
    }, { bytes, language })
    if (result.error || !result.text.includes(expected)) throw new Error(`${development ? 'Development' : 'Production'} ${language} worker failed: ${JSON.stringify(result)}`)
    results.push({ file, language, ...result })
    console.log(`${language} ${development ? 'development' : 'production'} worker passed in ${Math.round(result.ms)} ms`)
  }
  await writeFile(path.join(here, development ? 'development-results.json' : 'production-results.json'), JSON.stringify(results, null, 2))
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)) }
