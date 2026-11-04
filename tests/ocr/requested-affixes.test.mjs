import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { readCatalog } from '../../../query/d4/docs/verification/affix-audit/catalog.mjs'
import { matchTooltip } from './.generated/matcher.mjs'

const catalog = await readCatalog()
function match(lines, language = 'ko') {
  return matchTooltip({
    standard: catalog.filter(r => r.language === language).map(r => ({ value: r.id, label: r.label })),
    target: lines, phase: language === 'ko' ? '가-힣' : 'a-z',
    cutoffDis: 3, cutoffSim: 0.6, layer: 10
  })
}

test('Wrath per ten kills is a normal affix; ten never becomes the resource roll', () => {
  for (const [language, text, amount] of [
    ['ko', '처치 10회당 진노 1', 1],
    ['ko', '처치 10회당 진노 +2 [1 - 2]', 2],
    ['en', '+1 Wrath every 10 Kills', 1],
    ['en', '+2 [1 - 2] Wrath every 10 Kills', 2]
  ]) {
    const result = match([text], language)
    assert.equal(result.length, 1)
    assert.equal(result[0].id, 1132)
    assert.deepEqual(result[0].values.returnValues, [amount])
    assert.equal(catalog.find(r => r.id === 1132 && r.language === language).type, 'standard')
  }
})

test('Abaddon set-count effect matches wrapped text without inventing a variable roll', () => {
  for (const [language, lines] of [
    ['ko', ['아바돈의 살점 세트 개수가 +1 추가', '됩니다.']],
    ['en', ['+1 Set count to Flesh of Abaddon']]
  ]) {
    const result = match(lines, language)
    assert.equal(result.length, 1)
    assert.equal(result[0].id, 1133)
    assert.deepEqual(result[0].values.returnValues, [])
    assert.deepEqual(result[0].values.returnRangeValues, [])
  }
  assert.ok(!match(['아바돈의 마귀 +1']).some(r => r.id === 1133))
})

test('requested-affix patch contains both canonical languages and only dictionary writes', async () => {
  const sql = await readFile(new URL('../../../query/d4/season/15/requested_affixes_20260927.sql', import.meta.url), 'utf8')
  const rows = catalog.filter(r => [1132, 1133].includes(r.id))
  assert.equal(rows.length, 4)
  for (const row of rows) {
    assert.equal(row.placeholders, row.id === 1132 ? 1 : 0)
    assert.ok(sql.includes(`(${row.id}, '${row.label.replaceAll("'", "''")}', '${row.language}')`))
  }
  assert.equal([...sql.matchAll(/ON DUPLICATE KEY UPDATE/g)].length, 2)
  assert.match(sql, /SIGNAL SQLSTATE/)
  assert.doesNotMatch(sql, /\b(?:DROP|DELETE|TRUNCATE|ALTER|item_affixes|item_affix_values)\b/i)
})

test('Hellfire Torch set-count lines match their own set ID in both languages (task036)', async () => {
  const setCount = catalog.filter(r => r.type === 'standard' && (r.id === 1133 || (r.id >= 1136 && r.id <= 1172)))
  assert.equal(setCount.length, 76)
  for (const row of setCount) {
    assert.equal(row.placeholders, 0)
    const lines = row.language === 'ko'
      ? [row.label.replace(' 추가됩니다.', ''), '추가됩니다.'].map(s => s.replaceAll(' ', ''))
      : [row.label]
    const result = match(lines, row.language)
    assert.equal(result.length, 1, `${row.id} ${row.language}`)
    assert.equal(result[0].id, row.id, `${row.label} matched ${result[0].id}`)
    assert.deepEqual(result[0].values.returnValues, [])
  }
  assert.equal(catalog.find(r => r.id === 1137 && r.language === 'ko').label, '광전사의 도가니 세트 개수가 +1 추가됩니다.')
  const sql = await readFile(new URL('../../../query/d4/season/15/requested_affixes_20261104.sql', import.meta.url), 'utf8')
  for (const row of setCount.filter(r => r.id !== 1133)) {
    assert.ok(sql.includes(`(${row.id}, '${row.label.replaceAll("'", "''")}', '${row.language}')`), `${row.id} ${row.language}`)
  }
  assert.match(sql, /SIGNAL SQLSTATE/)
  assert.doesNotMatch(sql, /\b(?:DROP TABLE|DELETE|TRUNCATE|ALTER|INSERT INTO item_affixes|item_affix_values)\b/i)
})
