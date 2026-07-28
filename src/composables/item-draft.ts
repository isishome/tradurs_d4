import { Item, Price } from 'src/types/item'
import { User } from 'src/types/user'

const DRAFT_VERSION = 1
const DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000

type ItemDraft = {
  version: number
  savedAt: number
  item: Item
}

const storageAvailable = () => typeof window !== 'undefined'

const draftKey = (identity?: string | null) =>
  `d4.item-draft.${identity || 'anonymous'}`

export const hydrateItemDraft = (value: Item): Item => {
  const item = Object.assign(new Item(''), value)
  item.itemId = ''
  item.loading = false
  item.price = Object.assign(
    new Price(),
    value.price ?? new Price()
  )
  item.price.loading = false
  item.user = Object.assign(new User(), value.user ?? new User())

  return item
}

export const loadItemDraft = (identity?: string | null): Item | null => {
  if (!storageAvailable()) return null

  try {
    const draft = JSON.parse(
      window.localStorage.getItem(draftKey(identity)) ?? ''
    ) as ItemDraft

    if (
      draft.version !== DRAFT_VERSION ||
      !draft.savedAt ||
      Date.now() - draft.savedAt > DRAFT_MAX_AGE ||
      !draft.item
    ) {
      clearItemDraft(identity)
      return null
    }

    return hydrateItemDraft(draft.item)
  } catch {
    clearItemDraft(identity)
    return null
  }
}

export const saveItemDraft = (
  item: Item,
  identity?: string | null
): void => {
  if (!storageAvailable() || item.itemId) return

  const draft: ItemDraft = {
    version: DRAFT_VERSION,
    savedAt: Date.now(),
    item
  }

  try {
    window.localStorage.setItem(draftKey(identity), JSON.stringify(draft))
  } catch {
    // Draft persistence must never interrupt item editing.
  }
}

export const clearItemDraft = (identity?: string | null): void => {
  if (!storageAvailable()) return

  try {
    window.localStorage.removeItem(draftKey(identity))
  } catch {
    // Storage access may be blocked by browser privacy settings.
  }
}
