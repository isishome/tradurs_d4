import { Item, Price } from 'src/types/item'
import { User } from 'src/types/user'
import { DRAFT_MAX_AGE, draftKey, sweepItemDrafts } from './item-draft-key'

const DRAFT_VERSION = 1

type ItemDraft = {
  version: number
  savedAt: number
  item: Item
}

const storageAvailable = () => typeof window !== 'undefined'

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

export const loadItemDraft = (owner?: string | null): Item | null => {
  if (!storageAvailable()) return null

  try {
    sweepItemDrafts(window.localStorage, Date.now())
  } catch {
    // Storage access may be blocked by browser privacy settings.
  }

  try {
    const draft = JSON.parse(
      window.localStorage.getItem(draftKey(owner)) ?? ''
    ) as ItemDraft

    if (
      draft.version !== DRAFT_VERSION ||
      !draft.savedAt ||
      Date.now() - draft.savedAt > DRAFT_MAX_AGE ||
      !draft.item
    ) {
      clearItemDraft(owner)
      return null
    }

    return hydrateItemDraft(draft.item)
  } catch {
    clearItemDraft(owner)
    return null
  }
}

export const saveItemDraft = (
  item: Item,
  owner?: string | null
): void => {
  if (!storageAvailable() || item.itemId) return

  const draft: ItemDraft = {
    version: DRAFT_VERSION,
    savedAt: Date.now(),
    item
  }

  try {
    window.localStorage.setItem(draftKey(owner), JSON.stringify(draft))
  } catch {
    // Draft persistence must never interrupt item editing.
  }
}

export const clearItemDraft = (owner?: string | null): void => {
  if (!storageAvailable()) return

  try {
    window.localStorage.removeItem(draftKey(owner))
  } catch {
    // Storage access may be blocked by browser privacy settings.
  }
}
