import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createApp, markRaw } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { loadInitialTrade, useGlobalStore, useItemStore, resourceStatus } from './.generated/loaders.mjs'

const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const setup = api => {
  const pinia = createPinia()
  pinia.use(() => ({ $api: markRaw(api) }))
  createApp({}).use(pinia)
  setActivePinia(pinia)
  return { global: useGlobalStore(pinia), items: useItemStore(pinia) }
}

test('catalog initialization shares work and waits for every dictionary', async () => {
  const requests = new Map()
  const { global } = setup({ get(url) {
    assert.ok(!requests.has(url), `duplicate ${url}`)
    const request = deferred()
    requests.set(url, request)
    return request.promise
  } })
  const first = global.loadCatalog('ko')
  const second = global.loadCatalog('ko')
  await Promise.resolve()
  assert.equal(requests.size, 7)
  const entries = [...requests.entries()]
  for (const [url, request] of entries.slice(0, -1)) request.resolve({ data: url.endsWith('/base') ? {} : [] })
  await Promise.resolve()
  assert.equal(global.catalogReady, false)
  entries.at(-1)[1].resolve({ data: [] })
  await Promise.all([first, second])
  assert.equal(global.catalogReady, true)
  await global.loadCatalog('ko')
  assert.equal(requests.size, 7)
})

test('catalog failure does not mark a partial catalog ready or retry in flight', async () => {
  let calls = 0
  const { global } = setup({ get() { calls++; return Promise.reject(new Error('offline')) } })
  await assert.rejects(global.loadCatalog('ko'))
  assert.equal(global.catalogReady, false)
  assert.equal(global.catalogFailed, true)
  await assert.rejects(global.loadCatalog('ko'))
  assert.equal(calls, 7)
})

test('listing snapshot waits for both catalog and recommendation', async () => {
  const catalog = deferred(), reward = deferred()
  let committed = false
  const result = loadInitialTrade(catalog.promise, Promise.resolve([{ itemId: 'list' }]), reward.promise)
    .then(value => { committed = true; return value })
  catalog.resolve()
  await Promise.resolve()
  assert.equal(committed, false)
  reward.resolve([{ itemId: 'recommendation' }])
  assert.deepEqual(await result, { items: [{ itemId: 'list' }], reward: { itemId: 'recommendation' } })
})

test('recommendation failure preserves listings; catalog/listing failure rejects', async () => {
  assert.deepEqual(await loadInitialTrade(Promise.resolve(), Promise.resolve([{ itemId: 'list' }]), Promise.reject('offline')),
    { items: [{ itemId: 'list' }], reward: undefined })
  await assert.rejects(loadInitialTrade(Promise.reject(new Error('catalog')), Promise.resolve([]), Promise.resolve([])))
  await assert.rejects(loadInitialTrade(Promise.resolve(), Promise.reject(new Error('list')), Promise.resolve([])))
})

test('old listing response cannot overwrite the current pagination flags', async () => {
  const requests = []
  const { items } = setup({ post() { const request = deferred(); requests.push(request); return request.promise } })
  const older = items.getItems(1)
  const newer = items.getItems(2)
  requests[1].resolve({ data: Array.from({ length: 21 }, () => ({})) })
  assert.equal((await newer).length, 20)
  requests[0].resolve({ data: [] })
  await older
  assert.equal(items.itemPage.over, true)
  assert.equal(items.itemPage.more, true)
})

test('manifest routes match real Express paths with the installed Quasar URL resolver', () => {
  const require = createRequire(import.meta.url)
  const { Router } = require('express')
  const template = readFileSync(new URL('../../node_modules/@quasar/app-vite/templates/entry/ssr-prod-webserver.js', import.meta.url), 'utf8')
  const resolverSource = template.slice(template.indexOf('const doubleSlashRE'), template.indexOf('const rootFolder'))
  assert.ok(resolverSource.includes('const resolveUrlPath'))
  for (const base of ['/', '/app/']) {
    const urlPath = new Function(resolverSource.replace('<%= build.publicPath %>', base) + '; return resolveUrlPath')()
    const router = Router()
    resourceStatus({ app: router, resolve: { urlPath } })
    for (const file of ['ai-catalog.json', '.well-known/ai-catalog.json']) {
      for (const method of ['GET', 'HEAD']) {
        let sent = false
        const response = {
          status(code) { assert.equal(code, 404); return this },
          type(type) { assert.equal(type, 'text/plain'); return this },
          send(body) { assert.equal(body, 'Not Found'); sent = true }
        }
        router.handle({ method, url: `${base}${file}?audit=1` }, response, () => {})
        assert.equal(sent, true, `${method} ${base}${file} fell through to SSR`)
      }
    }
    let fallthrough = false
    router.handle({ method: 'GET', url: `${base}ko` }, {}, () => { fallthrough = true })
    assert.equal(fallthrough, true, 'ordinary pages must reach the SSR renderer')
  }
})
