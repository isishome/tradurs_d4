import type { Item } from 'src/types/item'

// Start independent requests together, but commit a single page snapshot.
// A failed recommendation must not discard a successful listing response.
export async function loadInitialTrade(
  catalog: Promise<void>,
  items: Promise<Item[]>,
  reward: Promise<Item[]>
) {
  const [, list, recommended] = await Promise.all([
    catalog,
    items,
    reward.catch(() => [] as Item[])
  ])
  return { items: list, reward: recommended[0] }
}
