// Search for the Unique/Set (fixed item) selector on the item form (query task-csj-037).
// Spaces and letter case are ignored, so `광전사의도가니` finds `광전사의 도가니의 …`,
// and full-width/compatibility characters compare equal (NFKC).
const normalize = (value: string) =>
  value.normalize('NFKC').toLowerCase().replace(/\s+/g, '')

export const filterFixedItemsByNeedle = <T extends { label: string }>(
  items: T[],
  needle?: string
): T[] => {
  const query = needle ? normalize(needle) : ''
  if (!query) return items
  return items.filter((item) => normalize(item.label).includes(query))
}
