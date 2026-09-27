import { readFile, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { readCatalog } from '../../../query/d4/docs/verification/affix-audit/catalog.mjs'
const root = new URL('../../', import.meta.url)
const local = name => fileURLToPath(new URL(name, import.meta.url))
await build({ entryPoints: [fileURLToPath(new URL('src/common/affix-matcher.ts', root))], bundle: true, platform: 'node', format: 'esm', outfile: local('.generated/matcher.mjs') })
await build({ entryPoints: [local('baseline-worker.ts')], bundle: true, platform: 'node', format: 'esm', outfile: local('.generated/baseline.mjs') })
const { matchTooltip } = await import('./.generated/matcher.mjs')
globalThis.self = { postMessage(result) { this.result = result } }
await import('./.generated/baseline.mjs')
const baseline = params => { self.onmessage({ data: JSON.stringify(params) }); return self.result }
const dictionary = { ko: new Map(), en: new Map() }
for (const row of await readCatalog()) dictionary[row.language].set(row.id, { value: row.id, label: row.label })
const rows = JSON.parse(await readFile(local('results.json'), 'utf8'))
const fixtures = JSON.parse(await readFile(local('cases.json'), 'utf8'))
const report = []
for (const fixture of fixtures) {
  for (const [engine, processed, matcher] of [['baseline', true, baseline], ['paddle-old-parser', false, baseline], ['paddle-new-parser', false, matchTooltip]]) {
    const row = rows.find(r => r.id === fixture.id && r.processed === processed)
    let text = engine === 'baseline' ? row.tesseract.currentText : row.paddle.text
    text = text.replace(new RegExp(`[^${fixture.lang === 'ko' ? '가-힣' : 'a-zA-Z'}0-9\\n .,:%+\\-\\[\\](){}]`, 'g'), '')
    const target = text.split('\n').map(t => t.trim().replace(/[+ ]/g, '').replace(/(\d),(?=\d)/g, '$1')).filter(Boolean)
    const params = { standard: [...dictionary[fixture.lang].values()], target, cutoffSim: 0.6, cutoffDis: 3, layer: 10, phase: fixture.lang === 'ko' ? '가-힣' : 'a-z' }
    report.push({ id: fixture.id, engine, dictionarySize: params.standard.length, matches: matcher(params) })
  }
}
await writeFile(local('match-results.json'), JSON.stringify(report, null, 2))
console.log(report.map(r => ({ id: r.id, engine: r.engine, matches: r.matches.map(m => `${m.id}:${m.label}=${m.values.returnValues}`) })))
