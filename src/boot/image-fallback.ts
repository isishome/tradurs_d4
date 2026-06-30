import { boot } from 'quasar/wrappers'

const ITEM_IMAGE_PREFIX = '/images/items/'
const FALLBACK_IMAGE = '/images/unknown.webp'
const FALLBACK_APPLIED = 'tradursImageFallbackApplied'

const isItemImagePath = (src: string): boolean => {
  try {
    return new URL(src, window.location.origin).pathname.startsWith(
      ITEM_IMAGE_PREFIX
    )
  } catch {
    return src.startsWith(ITEM_IMAGE_PREFIX)
  }
}

const isFallbackPath = (src: string): boolean => {
  try {
    return new URL(src, window.location.origin).pathname === FALLBACK_IMAGE
  } catch {
    return src === FALLBACK_IMAGE
  }
}

export default boot(() => {
  if (process.env.SERVER) return

  document.addEventListener(
    'error',
    (event) => {
      const target = event.target

      if (!(target instanceof HTMLImageElement)) return

      const src = target.currentSrc || target.src
      if (!src || isFallbackPath(src) || !isItemImagePath(src)) return
      if (target.dataset[FALLBACK_APPLIED]) return

      target.dataset[FALLBACK_APPLIED] = 'true'
      target.src = FALLBACK_IMAGE
    },
    true
  )
})
