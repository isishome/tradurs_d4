import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { matchProperties, matchTooltip } from './.generated/matcher.mjs'
import { readCatalog } from '../../../query/d4/docs/verification/affix-audit/catalog.mjs'

const seed = await readFile(new URL('../../../query/d4/5.1. properties.sql', import.meta.url), 'utf8')
const properties = [...seed.matchAll(/VALUES \((\d+), '((?:[^']|'')*)', '(ko|en)'\)/g)]
  .map(([, id, label, language]) => ({ value: Number(id), label: label.replaceAll("''", "'"), language }))
const affixes = (await readCatalog()).map(r => ({ value: r.id, label: r.label, language: r.language }))
const compact = result => result.map(r => [r.id, ...r.values.returnValues])
function classify(lines, ids, lang = 'ko') {
  const params = { target: lines, standard: properties.filter(p => p.language === lang && ids.includes(p.value)),
    propertyAffixes: affixes.filter(a => a.language === lang), phase: lang === 'ko' ? '가-힣' : 'a-z',
    cutoffSim: 0.6, cutoffDis: 3, layer: 3 }
  const selected = matchProperties(params)
  const rest = [...lines]
  for (const r of [...selected].reverse()) rest.splice(r.index, r.len)
  return { properties: selected, affixes: matchTooltip({ ...params, standard: params.propertyAffixes, target: rest, layer: 10 }), old: matchTooltip(params) }
}
async function actual(file) {
  const { ocr } = JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8'))
  // Same allowed characters as the KO OCR client; keep + for classification.
  const lines = ocr.normalize('NFKC').replace(/[−–—]/g, '-').replace(/[^0-9%가-힣/+.\[\]\-,:\n() ]/g, '')
    .split('\n').map(s => s.trim()).filter(Boolean)
  const lost = lines.findIndex(s => /장착.*사라지는|요구.*레벨/.test(s))
  return lost < 0 ? lines : lines.slice(0, lost)
}

test('actual Enigma: base armor3506 and rolled armor1837 occupy different dictionaries', async () => {
  const data = classify(await actual('enigma-property-result.json'), [15])
  assert.deepEqual(compact(data.old), [[15, 3506], [15, 1837]])
  assert.deepEqual(compact(data.properties), [[15, 3506]])
  assert.deepEqual(compact(data.affixes).filter(a => a[0] === 354), [[354, 1837]])
  assert.deepEqual(compact(data.affixes).filter(a => a[0] === 3312), [[3312, 33]])
  assert.equal(data.affixes.filter(a => a.id === 1).length, 2)
})

test('actual legendary ring: flat resistance173 is an implicit; Toughness comparison is not a roll', async () => {
  const data = classify(await actual('ring-property-result.json'), [22,23,24,25,26,27,45])
  assert.deepEqual(compact(data.properties), [[45,173]])
  assert.ok(!data.affixes.some(a => a.id === 925))
  assert.deepEqual(compact(data.affixes).filter(a => [25,105,27].includes(a[0])), [[25,151],[105,1813],[27,6.3]])
})

test('actual boots: Quality and Transmuted metadata do not become properties or stop the implicit scan', async () => {
  const data = classify(await actual('boots-metadata-result.json'), [15,19,20,21,32])
  assert.deepEqual(compact(data.properties), [[15,1001]])
  assert.ok(data.affixes.some(a => a.values.returnValues.includes(182)))
  assert.ok(data.affixes.some(a => a.values.returnValues.includes(38)))
})

test('English armor signs, missing OCR sign, and comparison values preserve classification', () => {
  for (const lines of [['3,506 Armor', '+1,837 Armor'], ['3,506 Armor', '1,837 Armor'], ['3,506 Armor (+100)', '+1,837 Armor']]) {
    const data = classify(lines, [15], 'en')
    assert.deepEqual(compact(data.properties), [[15,3506]])
    assert.deepEqual(compact(data.affixes), [[354,1837]])
  }
  const cropped = classify(['+1,837 Armor'], [15], 'en')
  assert.deepEqual(cropped.properties, [])
  assert.deepEqual(compact(cropped.affixes), [[354,1837]])
})

test('weapon implicits with + are preserved once; identical later rolls stay affixes', () => {
  const data = classify(['1,000 Damage Per Second','[800 - 1,200] Damage per Hit','1.10 Attacks per Second',
    '+30% Damage to Close Enemies','+100 Willpower','+60% Damage to Close Enemies'], [1,2,3,7], 'en')
  assert.deepEqual(compact(data.properties), [[1,1000],[2,800,1200],[3,1.1],[7,30]])
  assert.ok(data.affixes.some(a => a.values.returnValues.includes(60)))
})

test('jewelry keeps legacy percent and flat variants distinct and does not absorb later resistance', () => {
  const old = classify(['12% Resistance to All Elements','+100 Willpower','+30% Resistance to All Elements'], [22,45], 'en')
  assert.deepEqual(compact(old.properties), [[22,12]])
  const modern = classify(['173 All Resistance (Toughness -18.4%)','+500 All Resistance'], [22,45], 'en')
  assert.deepEqual(compact(modern.properties), [[45,173]])
  assert.deepEqual(compact(modern.affixes), [[925,500]])
  const late = classify(['의지력 +151','모든 저항 173'], [22,45])
  assert.deepEqual(late.properties, [])
})

test('boot movement affix must not fuzzy-match a more complex Evade implicit', () => {
  const data = classify(['방어도 1001','이동 속도 +30%','피하기 사용 시 2초 동안 이동 속도 +50%'], [15,32])
  assert.deepEqual(compact(data.properties), [[15,1001]])
})

test('wrapped base values are consumed without consuming a rolled bonus', () => {
  const data = classify(['방어도','3,506','방어도 +1,837'], [15])
  assert.deepEqual(compact(data.properties), [[15,3506]])
  assert.deepEqual(compact(data.affixes), [[354,1837]])
})

test('flat-resistance patch preserves legacy units and links the new bilingual property to rings', async () => {
  const patch = await readFile(new URL('../../../query/d4/season/15/property_flat_resistance_20260927.sql', import.meta.url), 'utf8')
  assert.equal(properties.find(p => p.value === 22 && p.language === 'ko').label, '모든 저항 {x}%')
  for (const p of properties.filter(p => p.value === 45)) assert.ok(patch.includes(`(45, '${p.label}', '${p.language}')`))
  assert.ok(patch.includes("VALUES ('ring', 45)"))
  assert.ok(!/UPDATE\s+item_properties|DELETE\s+FROM|DROP\s+TABLE/i.test(patch))
})
