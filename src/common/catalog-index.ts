// Array.find chooses the first match and compares numeric/string IDs strictly.
// Preserve that contract rather than letting Map construction keep the last row.
export function indexByValue<T extends { value: number | string }>(rows: T[]) {
  const index = new Map<number | string | undefined, T>()
  for (const row of rows) {
    if (row.value === row.value && !index.has(row.value)) index.set(row.value, row)
  }
  return index
}
