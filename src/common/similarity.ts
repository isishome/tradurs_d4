import stringComparison from 'string-comparison'

// Keep OCR matching dependencies out of the shared navigation/UI helpers.
export const similarity = (a: string, b: string) =>
  stringComparison.levenshtein.similarity(a, b)
