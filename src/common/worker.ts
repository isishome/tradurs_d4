import stringComparison from 'string-comparison'
import type { ILabel, MinMax } from 'src/stores/item-store'

export type CompareParams = {
  standard: Array<ILabel>
  target: Array<string>
  cutoffSim: number
  cutoffDis: number
  layer: number
  phase: string
}

type Match = {
  id: number
  label: string
  chainText: string
  len: number
  rate: number
  span: number
}

type Line = {
  index: number
  label: string
  complete: boolean
  matches: Array<Match>
}

export type ResultValue = {
  returnValues: Array<number>
  returnRangeValues: Array<MinMax>
}

export type Result = {
  id: number
  label: string
  index: number
  len: number
  values: ResultValue
}

const lev = stringComparison.levenshtein

const similarity = (a: string, b: string) => {
  return lev.similarity(a, b)
}
const distance = (a: string, b: string) => {
  return lev.distance(a, b)
}

const simplify = (sentense: string, phase: string) => {
  return sentense
    .replace(new RegExp(`\\([${phase} ]*\\)`, 'gi'), '')
    .replace(new RegExp(`[^${phase}]`, 'gi'), '')
}

const parseValues = (
  standard: string,
  target: string,
  ignoreBrackets = false
) => {
  const nums = standard.match(/[0-9.]{1,}|/gi) ?? []
  const xLen = standard.match(/\{x\}/gi)?.length ?? 0
  const values = target.match(/([(\[]?)([0-9\-.%]{1,})([\])]?)/gi) ?? []
  nums.forEach((n) => {
    const findIndex = values.findIndex((v) => v === n)

    if (findIndex !== -1) values.splice(findIndex, 1)
  })
  const val = values
    .filter((v) => !(ignoreBrackets ? /[\|]/gi : /[\[\]]/gi).test(v))
    .map((v) => v.split(/[\[\]%\-]/gi))
    .flat()
    .filter((v) => !!v && /[0-9]{1,}\.?[0-9]{0,}?/gi.test(v))
  const minmax = values
    .filter((v) => /[\[\]]/gi.test(v))
    .map((v) => v.split(/[\[\]%]/gi))
    .flat()
    .filter((v) => !!v && /[0-9]{1,}\.?[0-9]{0,}?/gi.test(v))

  const returnValues = []
  const returnRangeValues = []

  for (let i = 0; i < xLen; i++) {
    const v = !isNaN(parseFloat(val[i])) ? parseFloat(val[i]) : 0
    let min = !isNaN(parseFloat((minmax[i] ?? '').split('-')[0]))
      ? parseFloat((minmax[i] ?? '').split('-')[0])
      : 0
    let max = !isNaN(parseFloat((minmax[i] ?? '').split('-')[1]))
      ? parseFloat((minmax[i] ?? '').split('-')[1])
      : min ?? 0

    if (val.length > minmax.length && (v < min || v > max)) {
      min = 0
      max = 0
      minmax.unshift('0-0')
    }

    returnValues.push(v)
    returnRangeValues.push({ min, max })
  }

  return { returnValues, returnRangeValues }
}

self.onmessage = (event) => {
  const {
    standard,
    target,
    cutoffSim,
    cutoffDis,
    layer,
    phase
  }: CompareParams = JSON.parse(event.data)

  const simpleStandard = standard.map((s) => ({
    value: s.value,
    label: simplify(s.label, phase)
  }))

  const simpleTarget: Array<Line> = target.map((t, i) => ({
    index: i,
    label: simplify(t, phase),
    complete: false,
    matches: []
  }))

  simpleStandard.sort((a, b) => b.label.length - a.label.length)

  simpleStandard.forEach((ss) => {
    const remain = simpleTarget.filter((st) => !st.complete && !!st.label)

    remain.forEach((st, i) => {
      let repeat = 0
      let lastRate = 0
      while (repeat < layer) {
        const chainText = remain
          .slice(i, i + repeat + 1)
          .map((r) => r.label)
          .join('')

        const rate = similarity(chainText, ss.label)
        const span = distance(chainText, ss.label)

        if (lastRate >= rate) break
        else if (rate >= cutoffSim && span <= cutoffDis) {
          st.matches.push({
            id: ss.value as number,
            label: ss.label,
            chainText,
            len: repeat + 1,
            rate,
            span
          })

          if (rate === 1) {
            st.complete = true
            break
          }
        }

        lastRate = rate
        repeat++
      }
    })
  })

  const result = []

  let i = 0
  while (!!simpleTarget[i]) {
    simpleTarget[i].matches.sort((a, b) => b.rate - a.rate || a.span - b.span)
    const id = simpleTarget[i].matches[0]?.id

    if (id) {
      const label = standard.find((s) => s.value === id)?.label
      result.push({
        id,
        label,
        index: simpleTarget[i].index,
        len: simpleTarget[i].matches[0]?.len,
        values: parseValues(
          label ?? '',
          target
            .slice(
              simpleTarget[i].index,
              simpleTarget[i].index + simpleTarget[i].matches[0]?.len + 1
            )
            .join(''),
          id === 2
        )
      })

      i = i + simpleTarget[i].matches[0]?.len
    } else i++
  }

  self.postMessage(result)
}
