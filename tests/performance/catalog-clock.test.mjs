import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp, createSSRApp, h, computed } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createPinia, setActivePinia } from 'pinia'
import { useItemStore, createSharedClock, useSharedClock } from './.generated/loaders.mjs'

const store = () => {
  const pinia = createPinia()
  createApp({}).use(pinia)
  setActivePinia(pinia)
  return useItemStore(pinia)
}

test('indexed lookup preserves strict IDs, first match and affix-before-rune precedence', () => {
  const items = store()
  items.affixes.data = [
    { value: 1, label: 'first' }, { value: 1, label: 'duplicate' },
    { value: '1', label: 'string' }, { value: NaN, label: 'invalid' }
  ]
  items.runes = [{ value: 'rune', label: 'fallback' }, { value: 1, label: 'shadowed' }]
  const index = items.affixesById
  assert.equal(items.findAffix(1).label, 'first')
  assert.equal(items.findAffix('1').label, 'string')
  assert.equal(items.findAffix('rune').label, 'fallback')
  assert.equal(items.findAspect('rune'), undefined)
  assert.equal(items.findAffix(NaN), undefined)
  assert.equal(items.findAffix(), undefined)
  assert.equal(items.affixesById, index)
})

test('destructured lookup functions remain reactive across replace, key edit, insertion and deletion', () => {
  const items = store()
  const find = items.findAffix
  const label = computed(() => find(7)?.label)
  assert.equal(label.value, undefined)
  items.affixes.data = [{ value: 7, label: 'before' }]
  assert.equal(label.value, 'before')
  const index = items.affixesById
  items.affixes.data[0].label = 'after'
  assert.equal(label.value, 'after')
  assert.equal(items.affixesById, index)
  items.affixes.data[0].value = 8
  assert.equal(label.value, undefined)
  assert.equal(find(8).label, 'after')
  items.affixes.data.push({ value: 7, label: 'new' })
  assert.equal(label.value, 'new')
  items.affixes.data.splice(1, 1)
  assert.equal(label.value, undefined)
  items.runes = [{ value: 7, label: 'rune fallback' }]
  assert.equal(label.value, 'rune fallback')
  assert.ok(!Object.keys(items.$state).includes('affixesById'))
})

test('other catalog lookups see replacement and remain isolated between stores', () => {
  const a = store(), b = store()
  for (const [field, method] of [
    ['properties', 'findProperty'], ['restrictions', 'findRestriction'], ['setGroups', 'findSetGroup']
  ]) {
    const find = a[method]
    a[field].data = [{ value: 9, label: field }]
    assert.equal(find(9).label, field)
    assert.equal(b[method](9), undefined)
    a[field].data = []
    assert.equal(find(9), undefined)
  }
  const findRune = a.findRune
  a.runes = [{ value: 'sol', label: 'Sol' }]
  assert.equal(findRune('sol').label, 'Sol')
  a.runes = []
  assert.equal(findRune('sol'), undefined)
})

test('many cards share one timer, correct wall-clock jumps and release it exactly once', () => {
  let time = 1000, starts = 0, stops = 0, tick
  const clock = createSharedClock({
    now: () => time,
    everySecond: callback => { starts++; tick = callback; return () => { stops++ } }
  })
  assert.equal(starts, 0)
  const release = Array.from({ length: 21 }, () => clock.acquire())
  assert.equal(starts, 1)
  time = 121000 // background-tab suspension; don't drift by decrementing once
  tick()
  assert.equal(clock.now.value, time)
  release.slice(0, 20).forEach(fn => fn())
  assert.equal(stops, 0)
  release[20]()
  release[20]()
  assert.equal(stops, 1)
  time = 150000
  const again = clock.acquire()
  assert.equal(starts, 2)
  assert.equal(clock.now.value, time)
  again()
  assert.equal(stops, 2)
})

test('SSR does not subscribe to a clock timer and concurrent apps have independent clocks', async () => {
  const times = []
  const Card = { setup() {
    const now = useSharedClock(() => true)
    times.push(now)
    return () => h('span', 'card')
  } }
  const create = () => createSSRApp({ render: () => h('div', [h(Card), h(Card)]) })
  const original = globalThis.setInterval
  globalThis.setInterval = () => { throw new Error('timer started during SSR') }
  try {
    await renderToString(create())
    await renderToString(create())
    assert.equal(times[0], times[1])
    assert.equal(times[2], times[3])
    assert.notEqual(times[0], times[2])
  } finally { globalThis.setInterval = original }
})
