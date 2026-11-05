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

test('iconic unique powers and DoT duration resolve to their own IDs (query task-csj-042)', () => {
  for (const [language, lines, id, values] of [
    ['ko', ['지속 피해 지속시간 +44% [30 - 50]%'], 1173, [44]],
    ['en', ['+44% Damage Over Time Duration'], 1173, [44]],
    ['ko', ['모든 기술 등급을 +6 획득합니다.'], 4009, []],
    ['en', ['Gain +6 Rank to all Skills.'], 4009, []],
    ['ko', ['극대화 피해가 120%[x] [100 - 140]% 증가', '합니다.'], 4006, [120]],
    ['ko', ['2초마다 근처의 적에게 무작위로 표식을', '찍습니다. 표식이 찍힌 적은 취약해지고,',
      '해당 적에 대한 공격이 확정적으로 극대화', '적중합니다. 표식이 찍힌 적을 5번 적중시키', '면 표식이 사라집니다.'], 4015, [5]]
  ]) {
    const result = match(lines, language)
    assert.equal(result.length, 1, `${language} ${lines[0]}`)
    assert.equal(result[0].id, id)
    assert.deepEqual(result[0].values.returnValues, values)
  }
})
