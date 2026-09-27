import { readFile, writeFile } from 'node:fs/promises'
const cases = JSON.parse(await readFile(new URL('./cases.json', import.meta.url), 'utf8'))
const results = JSON.parse(await readFile(new URL('./results.json', import.meta.url), 'utf8'))
// Whitespace/case/dash variants only; retain digits, punctuation, and multiplier x.
const norm = s => s.normalize('NFKC').toLowerCase().replace(/[−–—]/g, '-').replace(/\s/g, '')
// Minimum edit distance to any contiguous substring: field-level error, not whole-page CER.
function fieldDistance(field, text) {
  let previous = new Uint32Array(text.length + 1)
  for (let i = 1; i <= field.length; i++) {
    const row = new Uint32Array(text.length + 1)
    row[0] = i
    for (let j = 1; j <= text.length; j++) row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + (field[i - 1] === text[j - 1] ? 0 : 1))
    previous = row
  }
  return Math.min(...previous)
}
const report = []
for (const lang of [...new Set(cases.map(c => c.lang))]) {
  for (const processed of [false, true]) {
    for (const engine of ['currentText', 'allBlockText', 'text', 'paddle']) {
      let count = 0, hits = 0, chars = 0, errors = 0
      const failures = [], times = []
      for (const row of results.filter(r => r.lang === lang && r.processed === processed)) {
        const fixture = cases.find(c => c.id === row.id)
        const text = norm(engine === 'paddle' ? row.paddle.text : row.tesseract[engine])
        times.push(engine === 'paddle' ? row.paddle.ms : row.tesseract.ms)
        for (const field of fixture.fields) {
          const f = norm(field), match = text.includes(f)
          count++; hits += Number(match); chars += f.length; errors += fieldDistance(f, text)
          if (!match) failures.push({ id: row.id, field })
        }
      }
      times.sort((a, b) => a - b)
      const medianMs = (times[Math.floor((times.length - 1) / 2)] + times[Math.floor(times.length / 2)]) / 2
      report.push({ lang, processed, engine, fields: count, exact: hits, fieldRecall: hits / count, fieldCharacterError: errors / chars, medianMs, failures })
    }
  }
}
await writeFile(new URL('./scores.json', import.meta.url), JSON.stringify(report, null, 2))
console.table(report.map(({ failures, ...row }) => row))
