export const GOLD_PRICE_MIN = 100000
export const GOLD_PRICE_STEP = 100000
export const GOLD_PRICE_MAX = 999999999999

export const normalizeGoldInput = (value: unknown): string => {
  return `${value ?? ''}`.replace(/[^\d]/g, '')
}

const isGoldWithinCap = (normalized: string): boolean => {
  if (!normalized) return false

  const cap = GOLD_PRICE_MAX.toString()
  const value = normalized.replace(/^0+(?=\d)/, '')

  return value.length < cap.length || (value.length === cap.length && value <= cap)
}

export const parseGoldInput = (value: unknown): number | null => {
  const normalized = normalizeGoldInput(value)
  if (!normalized || !isGoldWithinCap(normalized)) return null

  const parsed = Number(normalized)
  return Number.isSafeInteger(parsed) ? parsed : null
}

export const isValidGoldPrice = (value: unknown): boolean => {
  const gold = parseGoldInput(value)
  if (gold === null) return false
  if (gold < GOLD_PRICE_MIN || gold > GOLD_PRICE_MAX) return false

  return gold === GOLD_PRICE_MAX || gold % GOLD_PRICE_STEP === 0
}

export const clampGoldPrice = (value: unknown): string => {
  const normalized = normalizeGoldInput(value)
  if (!normalized) return ''

  if (!isGoldWithinCap(normalized)) return GOLD_PRICE_MAX.toString()

  const gold = Number(normalized)
  if (!Number.isSafeInteger(gold)) return ''
  if (gold < GOLD_PRICE_MIN || gold === GOLD_PRICE_MAX) return gold.toString()

  return (gold - (gold % GOLD_PRICE_STEP)).toString()
}

const toSafeGoldNumber = (value: unknown): number => {
  const normalized = normalizeGoldInput(value)
  const gold = normalized ? Number(normalized) : 0

  return Number.isSafeInteger(gold) ? gold : 0
}

export const formatGold = (
  value: unknown,
  locale?: string | string[]
): string => {
  return new Intl.NumberFormat(locale).format(toSafeGoldNumber(value))
}

export const formatGoldCompact = (
  value: unknown,
  locale?: string | string[]
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  }).format(toSafeGoldNumber(value))
}
