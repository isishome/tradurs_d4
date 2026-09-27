import stringComparison from 'string-comparison'
import type { ILabel, MinMax } from 'src/stores/item-store'

export type CompareParams = {
  standard: ILabel[]
  target: string[]
  cutoffSim: number
  cutoffDis: number
  layer: number
  phase: string
  // When supplied, classify the leading implicit block against rolled affixes.
  propertyAffixes?: ILabel[]
}
export type ResultValue = { returnValues: number[]; returnRangeValues: MinMax[] }
export type Result = {
  id: number; label: string; index: number; len: number; values: ResultValue
}

export function normalizeTooltip(text: string) {
  return text.normalize('NFKC').replace(/[−–—]/g, '-')
    .replace(/(?<=\d),(?=\d{3}(?:\D|$))/g, '')
    .replace(/[\[]{2,}/g, '[').replace(/[\]]{2,}/g, ']')
}

function simplify(text: string, phase: string) {
  return normalizeTooltip(text).replace(/\{x\}/gi, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(new RegExp(`[^${phase}]`, 'gi'), '').toLowerCase()
    // Equivalent tooltip wording, not guesses at numeric OCR errors.
    .replace(/^처치시주자원생성$/, '처치시주자원')
    .replace(/^ranksofthe(.+)passive$/, 'to$1')
    .replace(/^모든원소저항$/, '모든저항')
    .replace(/^저항(화염|냉기|번개|독|암흑)$/, '$1저항')
}

// Consume literals and placeholders in order, even when their values coincide.
export function parseValues(standard: string, target: string): ResultValue {
  let source = normalizeTooltip(target).replace(/\([^)]*\)/g, '')
  if (/\[\{x\}\s*-\s*\{x\}\]/i.test(standard)) {
    source = source.replace(/\[\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*\]/g, '$1 $2')
  }
  const ranges: MinMax[] = []
  const tokens: { value: number; range: MinMax }[] = []
  const pattern = /\[\s*([+-]?\d+(?:\.\d+)?)\s*(?:-\s*([+-]?\d+(?:\.\d+)?))?\s*\]|[+-]?\d+(?:\.\d+)?/g
  for (const match of source.matchAll(pattern)) {
    if (match[1] !== undefined) {
      if (tokens.length) tokens[tokens.length - 1].range = {
        min: Number(match[1]), max: Number(match[2] ?? match[1])
      }
    } else tokens.push({ value: Number(match[0]), range: { min: 0, max: 0 } })
  }
  const values: number[] = []
  let index = 0
  for (const part of normalizeTooltip(standard).match(/\{x\}|\d+(?:\.\d+)?/gi) ?? []) {
    if (part.toLowerCase() === '{x}') {
      const token = tokens[index++]
      values.push(token?.value ?? 0)
      ranges.push(token?.range ?? { min: 0, max: 0 })
    } else if (tokens[index]?.value === Number(part)) index++
  }
  return { returnValues: values, returnRangeValues: ranges }
}

export function matchTooltip(params: CompareParams): Result[] {
  const { target, standard, phase, layer, cutoffSim, cutoffDis } = params
  const dictionary = standard.map(s => ({ ...s, simple: simplify(s.label, phase) }))
    .filter(s => s.simple)
  const result: Result[] = []
  for (let index = 0; index < target.length; index++) {
    if (!simplify(target[index], phase)) continue
    const windows = Array.from({ length: Math.min(layer, target.length - index) }, (_, offset) => {
      const text = target.slice(index, index + offset + 1).join(' ')
      const numericText = normalizeTooltip(text).replace(/\[[^\]]*\]|\([^)]*\)/g, '')
      return { text, simple: simplify(text, phase), numericText,
        actualNumbers: numericText.match(/\d+(?:\.\d+)?/g)?.length ?? 0 }
    })
    const candidates: (Result & { rate: number; distance: number })[] = []
    for (const entry of dictionary) {
      const allowedDistance = Math.min(cutoffDis, Math.floor(entry.simple.length * 0.3))
      for (let len = 1; len <= layer && index + len <= target.length; len++) {
        const { text, simple, numericText, actualNumbers } = windows[len - 1]
        if (simple.length > entry.simple.length + cutoffDis) break
        if (Math.abs(simple.length - entry.simple.length) > allowedDistance) continue
        const distance = stringComparison.levenshtein.distance(simple, entry.simple)
        const rate = 1 - distance / Math.max(simple.length, entry.simple.length)
        const expectedNumbers = normalizeTooltip(entry.label).match(/\{x\}|\d+(?:\.\d+)?/gi)?.length ?? 0
        const numberCount = /\[\{x\}\s*-\s*\{x\}\]/i.test(entry.label)
          ? normalizeTooltip(text).match(/\d+(?:\.\d+)?/g)?.length ?? 0 : actualNumbers
        const unitMatches = !entry.label.includes('{x}') || /%/.test(numericText) === /%/.test(entry.label)
        const fixedNumbersMatch = entry.label.includes('{x}') ||
          JSON.stringify(normalizeTooltip(entry.label).match(/\d+(?:\.\d+)?/g) ?? []) ===
          JSON.stringify(numericText.match(/\d+(?:\.\d+)?/g) ?? [])
        // Short labels need a tighter bound than long unique descriptions.
        if (distance <= allowedDistance && rate >= cutoffSim && numberCount >= expectedNumbers && unitMatches && fixedNumbersMatch) candidates.push({
          id: Number(entry.value), label: entry.label, index, len,
          values: parseValues(entry.label, text), rate, distance
        })
      }
    }
    candidates.sort((a, b) => b.rate - a.rate || a.distance - b.distance || a.len - b.len)
    const best = candidates[0]
    if (!best) continue
    const tied = candidates.filter(c => c.rate === best.rate && c.distance === best.distance && c.len === best.len)
    const hasPercent = /%/.test(target.slice(index, index + best.len).join(' '))
    const chosen = tied.find(c => /%/.test(c.label) === hasPercent) ?? best
    let len = chosen.len
    let text = target.slice(index, index + len).join(' ')
    const next = target[index + len]
    // A separately detected roll range belongs to this affix, not the next one.
    if (next && !simplify(next, phase) &&
      (/^\s*\[\s*\d/.test(next) || (text.lastIndexOf('[') > text.lastIndexOf(']') && /^\s*\d.*\]/.test(next)))) {
      text += ` ${next}`
      len++
    }
    result.push({ id: chosen.id, label: chosen.label, index, len, values: parseValues(chosen.label, text) })
    index += len - 1
  }
  return result
}

// Both dictionaries may contain the same words (Armor, resistance, weapon implicits).
// Preserve modifier signs and tooltip order instead of assigning every matching line
// to the first dictionary. No item names, item IDs, or expected roll values are used.
export function matchProperties(params: CompareParams): Result[] {
  const properties = matchTooltip(params)
  const affixes = matchTooltip({ ...params, standard: params.propertyAffixes ?? [], layer: 10 })
  const selected: Result[] = []
  const used = new Set<number>()
  const textOf = (match: Result) => params.target.slice(match.index, match.index + match.len).join(' ')
  const hasBonus = (text: string) => /\+\s*(?:\{x\}|\d)/i.test(
    normalizeTooltip(text).replace(/\([^)]*\)|\[[^\]]*\]/g, '')
  )
  const score = (match: Result) => {
    const actual = simplify(textOf(match), params.phase)
    const expected = simplify(match.label, params.phase)
    return 1 - stringComparison.levenshtein.distance(actual, expected) / Math.max(actual.length, expected.length)
  }
  for (let index = 0; index < params.target.length; index++) {
    const property = properties.find(p => p.index === index)
    const affix = affixes.find(a => a.index === index)
    if (!property) {
      // Once rolled affixes begin, later matching labels are no longer implicits.
      if (affix) break
      continue
    }
    if (used.has(property.id)) break
    // Parenthesized comparison bonuses are removed by hasBonus; they do not turn
    // a base stat into a rolled bonus. Implicits that contain + remain supported.
    if (hasBonus(textOf(property)) && !hasBonus(property.label)) break
    if (affix && score(affix) > score(property)) break
    selected.push(property)
    used.add(property.id)
    index += property.len - 1
  }
  return selected
}
