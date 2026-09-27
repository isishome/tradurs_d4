import { readFile, writeFile } from 'node:fs/promises'
const truth = JSON.parse(await readFile(new URL('./affix-truth.json', import.meta.url)))
const results = JSON.parse(await readFile(new URL('./match-results.json', import.meta.url)))
const metrics = []
for (const engine of ['baseline', 'paddle-old-parser', 'paddle-new-parser']) {
  let total = 0, ids = 0, exact = 0, falsePositives = 0
  const details = []
  for (const row of results.filter(r => r.engine === engine)) {
    const expected = truth[row.id]
    // Innate armor / amulet resistance and sockets are outside the affix truth.
    const actual = row.matches.filter(m => ![1,354,338].includes(m.id))
    const used = new Set(), idUsed = new Set()
    for (const [id, ...values] of expected) {
      total++
      const idIndex = actual.findIndex((a,i) => !idUsed.has(i) && a.id === id)
      if (idIndex >= 0) { ids++; idUsed.add(idIndex) }
      const index = actual.findIndex((a,i) => !used.has(i) && a.id === id && JSON.stringify(a.values.returnValues) === JSON.stringify(values))
      if (index >= 0) { exact++; used.add(index) }
      else details.push({ image: row.id, missed: [id,...values] })
    }
    falsePositives += actual.length - idUsed.size
    details.push({ image: row.id, unmatched: actual.filter((_,i) => !idUsed.has(i)).map(a => [a.id,...a.values.returnValues]) })
  }
  metrics.push({ engine, total, ids, exact, falsePositives, idRecall: ids/total, idAndValueRecall: exact/total, details })
}
await writeFile(new URL('./affix-metrics.json', import.meta.url), JSON.stringify(metrics,null,2))
console.table(metrics.map(({details,...m}) => m))
