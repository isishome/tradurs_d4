import { nextTick } from 'vue'
import { copyToClipboard, Notify, Platform, LocalStorage } from 'quasar'
import stringComparison from 'string-comparison'
import { i18n } from 'src/boot/i18n'
import { AffixValue } from 'src/types/item'
import { MinMax } from 'src/stores/item-store'

export const checkName = (name: string) => {
  return (
    /^[0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣\s,\.'"%\(\)\+\-\:]{1,}$/gi.test(name) &&
    name.length <= 256
  )
}

export const checkAttribute = (attribute: string) => {
  return /^((\{x\})?[0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣\s,\.'"%\(\)\[\]\+\-\:]+(\{x\})?)+$/gi.test(
    attribute
  )
}

export const checkEmail = (email: string) => {
  return /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(
    email
  )
}

export const checkComplexity = (pw: string) => {
  let score = 0
  if (/[A-Z]+/.test(pw)) score += 20
  if (/[a-z]+/.test(pw)) score += 20
  if (/[`~!@#$%^&*]+/.test(pw)) score += 20
  if (/[0-9]+/.test(pw)) score += 20
  if (pw.length >= 12) score += 20

  return score
}

// sleep
export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export interface Attribute {
  type: string
  value: number | string
}

export const parse = (
  label: string | undefined,
  values?: Array<number>
): Array<Attribute> => {
  if (label) {
    const result = label.split(/\{x\}/g).reduce((p: Array<Attribute>, c, i) => {
      p.push({ type: 'text', value: c })
      p.push({
        type: 'variable',
        value: values?.[i] === 0 ? 0 : values?.[i] || ''
      })
      return p
    }, [])

    return result.slice(0, label.match(/\{x\}/g) ? -1 : 1)
  } else return []
}

export const parseAffix = (
  label: string | undefined,
  values?: Array<AffixValue>
): Array<Attribute> => {
  if (label) {
    return label
      .split(/\{x\}/g)
      .reduce((p: Array<Attribute>, c, i) => {
        p.push({ type: 'text', value: c })
        p.push({
          type: 'variable',
          value: values?.[i]?.value === 0 ? 0 : values?.[i]?.value || ''
        })
        p.push({
          type: 'min',
          value: values?.[i]?.min === 0 ? 0 : values?.[i]?.min || ''
        })
        p.push({
          type: 'max',
          value: values?.[i]?.max === 0 ? 0 : values?.[i]?.max || ''
        })
        return p
      }, [])
      .slice(0, -3)
  } else return []
}

export const parseMinMax = (
  label: string | undefined,
  values?: Array<MinMax>
): Array<Attribute> => {
  if (label) {
    return label
      .split(/\{x\}/g)
      .reduce((p: Array<Attribute>, c, i) => {
        p.push({ type: 'text', value: c })
        p.push({
          type: 'min',
          value: values?.[i]?.min === 0 ? 0 : values?.[i]?.min || ''
        })
        p.push({
          type: 'max',
          value: values?.[i]?.max === 0 ? 0 : values?.[i]?.max || ''
        })
        return p
      }, [])
      .slice(0, -2)
  } else return []
}

export const splitArray = (arr: Array<number>, chunkSize: number) => {
  const res = []
  while (arr.length > 0) {
    res.push(arr.splice(0, chunkSize))
  }
  return res
}

export const scrollPos = (top?: number, behavior?: ScrollBehavior) => {
  nextTick(() => {
    window.scrollTo({ top: top || 0, behavior: behavior || 'auto' })
  })
}

export const scrollPosDirect = (top?: number, behavior?: ScrollBehavior) => {
  window.scrollTo({ top: top || 0, behavior: behavior || 'auto' })
}

export const clipboard = (text: string, msg: string) => {
  if (!text || text.trim() === '') return

  copyToClipboard(text)
    .then(() => {
      Notify.create({
        message: i18n.global.t('messages.clipboard', { t: msg })
      })
    })
    .catch(() => {
      // fail
    })
}

export const focus = (evt: Event) => {
  if (Platform.is.mobile) return

  const el: HTMLInputElement | null = (evt.target as Element)?.closest('input')
  el?.select()
}

export const clearLocalStorage = () => {
  LocalStorage.removeItem('base')
  LocalStorage.removeItem('properties')
  LocalStorage.removeItem('affixes')
  LocalStorage.removeItem('restrictions')
  LocalStorage.removeItem('evaluations')
}

const lev = stringComparison.levenshtein

export const similarity = (a: string, b: string) => {
  return lev.similarity(a, b)
}
export const distance = (a: string, b: string) => {
  return lev.distance(a, b)
}

export const simplify = (sentense: string, phase: string) => {
  return sentense
    .replace(new RegExp(`\\([${phase} ]*\\)`, 'gi'), '')
    .replace(new RegExp(`[^${phase}]`, 'gi'), '')
}
