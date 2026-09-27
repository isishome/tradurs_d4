import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { gzipSync } from 'node:zlib'
import { createCriticalCssRenderer } from './.generated/loaders.mjs'

const asset = '/assets/MainLayout.1234abcd.css'
test('small shell CSS retains root-relative URLs and is read once per immutable asset', () => {
  let reads = 0
  const css = '.card{background:url(/images/frames/outer.webp)}'
  const render = createCriticalCssRenderer(name => { reads++; assert.equal(name, 'MainLayout.1234abcd.css'); return css })
  assert.equal(render(asset), `<style data-ssr-css="${asset}">${css}</style>`)
  assert.equal(render(asset), render(asset))
  assert.equal(reads, 1)
  assert.ok(render('/app/assets/MainLayout.1234abcd.css').includes(css))
})

test('unselected or unsafe paths never trigger asset reads', () => {
  const render = createCriticalCssRenderer(() => { throw new Error('unexpected read') })
  // Counting separately ensures errors are not simply swallowed by fallback.
  let reads = 0
  const counted = createCriticalCssRenderer(() => { reads++; return 'body{}' })
  for (const file of ['/assets/index.1234abcd.css', '/assets/D4Item.1234abcd.css',
    '/assets/../MainLayout.1234abcd.css', '//cdn.test/assets/MainLayout.1234abcd.css',
    'https://cdn.test/assets/MainLayout.1234abcd.css', '/assets/MainLayout.1234abcd.css?x=1']) {
    assert.equal(render(file), undefined)
    assert.equal(counted(file), undefined)
  }
  assert.equal(reads, 0)
})

test('missing, oversized or relative-resource CSS falls back without breaking rendering', () => {
  for (const css of ['', 'x'.repeat(16385), '가'.repeat(6000),
    'body{background:url(../image.webp)}', '@import "/other.css";',
    'body{background:url(//cdn.test/a.webp)}', '</style><script>alert(1)</script>']) {
    assert.equal(createCriticalCssRenderer(() => css)(asset), undefined)
  }
  let reads = 0
  const missing = createCriticalCssRenderer(() => { reads++; throw new Error('ENOENT') })
  assert.equal(missing(asset), undefined)
  assert.equal(missing(asset), undefined)
  assert.equal(reads, 1)
})

test('production preload hook inlines real shell assets while keeping other resources linked', () => {
  const require = createRequire(import.meta.url)
  const { renderPreloadTag } = require('./.generated/server-preload.cjs')
  const dir = new URL('../../dist/ssr/client/assets/', import.meta.url)
  const files = readdirSync(dir)
  const selected = files.filter(name => /^(MainLayout|register)\.[a-f0-9]+\.css$/.test(name))
  assert.equal(selected.length, 2)
  let combined = ''
  for (const name of selected) {
    const css = readFileSync(new URL(name, dir), 'utf8')
    assert.equal(renderPreloadTag(`/assets/${name}`), `<style data-ssr-css="/assets/${name}">${css}</style>`)
    combined += css
  }
  const index = files.find(name => /^index\..*\.css$/.test(name))
  assert.equal(renderPreloadTag(`/assets/${index}`), `<link rel="stylesheet" href="/assets/${index}">`)
  assert.equal(renderPreloadTag('/assets/MainLayout.00000000.css'), '<link rel="stylesheet" href="/assets/MainLayout.00000000.css">')
  assert.match(renderPreloadTag('/assets/index.12345678.js'), /rel="modulepreload"/)
  console.log(`Inline shell CSS: ${Buffer.byteLength(combined)} bytes raw, ${gzipSync(combined).length} bytes gzip; 2 blocking links replaced.`)
})
