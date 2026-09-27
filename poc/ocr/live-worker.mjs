// Uses an already-running dev server. No login, credentials, server startup or listing writes.
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
const require = createRequire(import.meta.url)
const { chromium } = require('../../../d2r_v2/client/node_modules/@playwright/test')
const origin = process.env.OCR_DEV_ORIGIN || 'http://localhost:6090'
const browser = await chromium.launch({ headless: true, executablePath: process.env.OCR_CHROMIUM || path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe') })
try {
  const page = await browser.newPage()
  await page.goto(`${origin}/ko`)
  for (const [file, language, expected] of [['ko-stealth.png', 'ko', '생명력'], ['en-rare.jpg', 'en', 'Willpower']]) {
    const bytes = [...await readFile(new URL(`./fixtures/${file}`, import.meta.url))]
    const result = await page.evaluate(async ({ bytes, language, expected }) => {
      const worker = new Worker('/src/common/ocr/paddle.worker.ts?worker_file', { type: 'module' })
      let timer
      try {
        return await new Promise((resolve, reject) => {
          timer = setTimeout(() => reject(new Error('Live worker timed out')), 120000)
          worker.onerror = e => reject(new Error(`${e.message} at ${e.filename}:${e.lineno}`))
          worker.onmessage = ({ data }) => {
            if (data.error || !data.text?.includes(expected)) reject(new Error('Live OCR output failed validation'))
            else resolve({ language, recognized: true })
          }
          const image = new Uint8Array(bytes).buffer
          worker.postMessage({ id: 1, language, image }, [image])
        })
      } finally { clearTimeout(timer); worker.terminate() }
    }, { bytes, language, expected })
    console.log(JSON.stringify(result))
  }
} finally { await browser.close() }
