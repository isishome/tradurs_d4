import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { resolveConfig, optimizeDeps } from 'vite'

const require = createRequire(import.meta.url)
const quasar = require('../../quasar.config.js')({ dev: true })

test('lazy OCR worker dependencies are optimized before first recognition', async () => {
  const config = {
    define: {},
    optimizeDeps: { entries: [], include: ['vue'], exclude: ['test-existing-exclusion'] }
  }
  quasar.build.extendViteConf(config)
  // Keep resolution stable when the same workspace is also built while dev runs.
  for (const context of [{ dev: false }, {}]) {
    const other = { define: {} }
    require('../../quasar.config.js')(context).build.extendViteConf(other)
    const alias = other.resolve.alias.find(a => a.find.test?.('onnxruntime-web'))
    assert.equal(alias?.replacement, 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.wasm.min.mjs')
  }
  assert.deepEqual(config.optimizeDeps.exclude, ['test-existing-exclusion'])
  assert.equal(config.optimizeDeps.esbuildOptions.target, 'es2020')
  for (const dependency of ['vue', 'ppu-paddle-ocr/web']) {
    assert.ok(config.optimizeDeps.include.includes(dependency))
  }
  // Exercise the installed Vite 2 optimizer without opening or restarting a server.
  const resolved = await resolveConfig({
    configFile: false,
    root: fileURLToPath(new URL('../../', import.meta.url)),
    cacheDir: fileURLToPath(new URL('./.generated/dev-deps', import.meta.url)),
    optimizeDeps: config.optimizeDeps,
    resolve: config.resolve,
    logLevel: 'error'
  }, 'serve')
  const metadata = await optimizeDeps(resolved, true, true)
  for (const dependency of ['ppu-paddle-ocr/web']) {
    assert.ok(metadata.optimized[dependency], `${dependency} must not be discovered at first use`)
  }
  assert.equal(metadata.optimized['onnxruntime-web'], undefined)
  const source = await readFile(metadata.optimized['ppu-paddle-ocr/web'].file, 'utf8')
  assert.ok(source.includes('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.wasm.min.mjs'))
  const parsed = await build({ stdin: { contents: source }, format: 'esm', write: false, metafile: true })
  const names = Object.values(parsed.metafile.outputs).flatMap(output => output.exports)
  assert.ok(names.includes('PaddleOcrService'))
})
