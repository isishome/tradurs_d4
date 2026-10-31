import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const path = (relative) => new URL(relative, import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1')
await build({
  entryPoints: [path('../../src/composables/item-draft-key.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: path('./.generated/item-draft-key.mjs')
})
const { DRAFT_MAX_AGE, draftKey, sweepItemDrafts } = await import('./.generated/item-draft-key.mjs')

const memoryStorage = (entries) => {
  const map = new Map(Object.entries(entries))
  return {
    get length() {
      return map.size
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    removeItem: (key) => map.delete(key),
    keys: () => [...map.keys()].sort()
  }
}

test('the draft key stays the same across sign-in checks for one account', () => {
  assert.equal(draftKey('Player#1234'), 'd4.item-draft.Player#1234')
  assert.equal(draftKey('Player#1234'), draftKey('Player#1234'))
  assert.notEqual(draftKey('Player#1234'), draftKey('Other#5678'))
  assert.equal(draftKey(undefined), 'd4.item-draft.anonymous')
})

test('expired or unreadable drafts are swept, fresh drafts and other keys stay', () => {
  const now = 1_000_000_000_000
  const saved = (age) => JSON.stringify({ version: 1, savedAt: now - age, item: {} })
  const storage = memoryStorage({
    'd4.item-draft.Player#1234': saved(1000),
    'd4.item-draft.Other#5678': saved(DRAFT_MAX_AGE - 1),
    'd4.item-draft.old-random-id': saved(DRAFT_MAX_AGE + 1),
    'd4.item-draft.broken': '{',
    'd4.item-draft.no-date': JSON.stringify({ version: 1 }),
    'unrelated.key': 'keep'
  })
  sweepItemDrafts(storage, now)
  assert.deepEqual(storage.keys(), ['d4.item-draft.Other#5678', 'd4.item-draft.Player#1234', 'unrelated.key'])
})
