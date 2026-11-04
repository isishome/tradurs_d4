import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const path = (relative) => new URL(relative, import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1')
await build({
  entryPoints: [path('../../src/common/fixed-item-search.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: path('./.generated/fixed-item-search.mjs')
})
const { filterFixedItemsByNeedle } = await import('./.generated/fixed-item-search.mjs')

const items = [
  { value: 1, label: '광전사의 도가니의 포바' },
  { value: 2, label: '광전사의 도가니의 페르' },
  { value: 3, label: '아바돈의 살점의 포바' },
  { value: 4, label: 'Phoba of Berserker\'s Crucible' },
  { value: 5, label: 'Ｈａｒｌｅｑｕｉｎ Ｃｒｅｓｔ' }
]
const ids = (needle) => filterFixedItemsByNeedle(items, needle).map((i) => i.value)

test('empty or blank needle keeps every option in order', () => {
  assert.deepEqual(ids(undefined), [1, 2, 3, 4, 5])
  assert.deepEqual(ids(''), [1, 2, 3, 4, 5])
  assert.deepEqual(ids('   '), [1, 2, 3, 4, 5])
})

test('Korean search ignores spaces; partial set or piece names match', () => {
  assert.deepEqual(ids('광전사의 도가니'), [1, 2])
  assert.deepEqual(ids('광전사의도가니'), [1, 2])
  assert.deepEqual(ids('포바'), [1, 3])
  assert.deepEqual(ids('없는 이름'), [])
})

test('English search is case-insensitive and compatibility characters compare equal', () => {
  assert.deepEqual(ids('berserker'), [4])
  assert.deepEqual(ids('PHOBA OF'), [4])
  assert.deepEqual(ids('harlequin'), [5])
})
