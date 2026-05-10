import { boot } from 'quasar/wrappers'
import { Cookies } from 'quasar'
import { useGlobalStore } from 'src/stores/global-store'

export type FontMode = 'kodia' | 'system'

const fontClasses = ['font-kodia', 'font-system']

export const normalizeFont = (value: unknown): FontMode =>
  value === 'system' ? 'system' : 'kodia'

export const applyFont = (font: FontMode) => {
  if (!process.env.CLIENT) return

  document.body.classList.remove(...fontClasses)
  document.body.classList.add(`font-${font}`)
}

export default boot(({ store, ssrContext } /* { app, router, ... } */) => {
  const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies
  const gs = useGlobalStore(store)

  gs.initFont(cookies.get('d4.font'))
})
