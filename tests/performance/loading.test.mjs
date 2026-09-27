import test from 'node:test'
import assert from 'node:assert/strict'
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

test('unpublished manifest paths return a real non-HTML 404', () => {
  let registered, handler
  resourceStatus({ app: { get(paths, fn) { registered = paths; handler = fn } }, resolve: { urlPath: p => `/${p}` } })
  assert.deepEqual(registered, ['/ai-catalog.json', '/.well-known/ai-catalog.json'])
  const response = { status(code) { assert.equal(code, 404); return this }, type(type) { assert.equal(type, 'text/plain'); return this }, send(body) { assert.equal(body, 'Not Found') } }
  handler({}, response)
})
