import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
await build({ entryPoints: [new URL('../../src/common/ocr/paddle.ts', import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1')], bundle: true, format: 'esm', platform: 'node', plugins: [{ name: 'worker-stub', setup(build) { build.onResolve({ filter: /\?worker$/ }, args => ({ path: args.path, namespace: 'stub' })); build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export default class { constructor() { throw new Error("Inject a worker for unit tests") } }' })) } }], outfile: new URL('./.generated/client.mjs', import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1') })
const { PaddleOcrClient, normalizeOcrText } = await import('./.generated/client.mjs')
function harness(timeout = 1000, idle = 1000) {
  const workers = []
  const client = new PaddleOcrClient(() => {
    const worker = { sent: [], stopped: false, postMessage(message) { this.sent.push(message) }, terminate() { this.stopped = true } }
    workers.push(worker)
    return worker
  }, timeout, idle)
  return { client, workers }
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0))

test('separate requests resolve by ID without mixing languages or image bytes', async () => {
  const { client, workers } = harness()
  try {
    const first = client.extract(new Blob(['first']), 'ko')
    const second = client.extract(new Blob(['second']), 'en')
    await tick()
    assert.equal(workers.length, 1)
    const [a, b] = workers[0].sent
    assert.equal(a.language, 'ko')
    assert.equal(new TextDecoder().decode(b.image), 'second')
    workers[0].onmessage({ data: { id: b.id, text: 'second text' } })
    workers[0].onmessage({ data: { id: a.id, text: 'first text' } })
    assert.deepEqual(await Promise.all([first, second]), ['first text', 'second text'])
  } finally { client.terminate() }
})

test('engine failure rejects outstanding requests and a new scan gets a fresh worker', async () => {
  const { client, workers } = harness()
  const first = client.extract(new Blob(['x']), 'ko')
  const rejected = assert.rejects(first, /OCR failed/)
  await tick()
  workers[0].onmessage({ data: { id: workers[0].sent[0].id, error: true } })
  await rejected
  assert.equal(workers[0].stopped, true)
  const retry = client.extract(new Blob(['y']), 'ko')
  await tick()
  workers[1].onmessage({ data: { id: workers[1].sent[0].id, text: 'recovered' } })
  assert.equal(await retry, 'recovered')
  client.terminate()
})

test('hung worker times out and releases its resources', async () => {
  const { client, workers } = harness(10)
  await assert.rejects(client.extract(new Blob(['x']), 'ko'), /timed out/)
  assert.equal(workers[0].stopped, true)
})

test('idle successful worker is released', async () => {
  const { client, workers } = harness(1000, 10)
  const result = client.extract(new Blob(['x']), 'en')
  await tick()
  workers[0].onmessage({ data: { id: workers[0].sent[0].id, text: 'done' } })
  await result
  await new Promise(resolve => setTimeout(resolve, 25))
  assert.equal(workers[0].stopped, true)
})

test('normalization preserves value signs, line boundaries and account-bound markers', () => {
  assert.equal(normalizeOcrText('◇ 공격  속도 +25.0% [20 − 30]%\r\n\r\n계정 귀속', 'ko'), '공격 속도 +25.0% [20 - 30]%\n계정 귀속')
  assert.equal(normalizeOcrText('◆ +2 Ranks\nAccount Bound\n40%[x]', 'en'), '+2 Ranks\nAccount Bound\n40%[x]')
})
