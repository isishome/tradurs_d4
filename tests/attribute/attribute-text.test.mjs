import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const path = (relative) => new URL(relative, import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1')
await build({
  entryPoints: [path('../../src/common/attribute-text.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: path('./.generated/attribute-text.mjs')
})
const { isValidAttributeText } = await import('./.generated/attribute-text.mjs')

// 기존 식. 짧은 입력에서 비교하는 데만 쓴다(긴 입력에는 쓰지 않는다 — 멈춘다).
const ORIGINAL = /^((\{x\})?[0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣\s,.'"%()[\]+\-:]+(\{x\})?)+$/

test('attribute text keeps the original rule on short inputs', () => {
  const samples = [
    'a',
    '{x}a',
    'a{x}',
    'a{x}b',
    '{x}a{x}',
    '공격력 +{x}%',
    '{x} Armor [Resistance]',
    "Crit's (x2): +{x}",
    '{x}',
    '{x}{x}a',
    'a{',
    '{x',
    '{y}',
    '<b>',
    ''
  ]
  for (const sample of samples)
    assert.equal(isValidAttributeText(sample), ORIGINAL.test(sample), sample)
})

test('adjacent {x}{x} is rejected like the back check (stricter than the original)', () => {
  // 기존 식은 중간의 {x}{x}를 통과시켰다. back과 같은 판정을 위해 거부한다.
  assert.equal(ORIGINAL.test('a{x}{x}b'), true)
  assert.equal(isValidAttributeText('a{x}{x}b'), false)
})

test('attribute text rejects non-strings', () => {
  assert.equal(isValidAttributeText(undefined), false)
  assert.equal(isValidAttributeText(null), false)
  assert.equal(isValidAttributeText(['a']), false)
})

test('a long invalid attribute text is rejected quickly (ReDoS)', () => {
  const inputs = [`${'테스트 옵션 '.repeat(200)}{`, `${'a'.repeat(5000)}<`, `${'{x}a'.repeat(2000)}{`]
  const started = performance.now()
  for (const input of inputs) assert.equal(isValidAttributeText(input), false)
  assert.ok(performance.now() - started < 100)
})
