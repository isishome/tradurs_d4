import ko from './ko'
import en from './en'

export const messages = {
  'ko': ko,
  'en': en
}

export const numberFormats = {
  'ko': {
    decimal: {
      style: 'decimal'
    },
    goldCompact: {
      style: 'decimal',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }
  },
  'en': {
    decimal: {
      style: 'decimal'
    },
    goldCompact: {
      style: 'decimal',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }
  }
}
