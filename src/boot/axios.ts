import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance } from 'axios'
import { Notify } from 'quasar'
import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'
import { useGlobalStore } from 'stores/global-store'
import { usePartyStore } from 'stores/party-store'
import { User } from 'src/types/user'
import { i18n } from './i18n'
import { initMessenger } from 'src/sockets/messenger'
import { initParty } from 'src/sockets/party'

let api: AxiosInstance

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app, ssrContext, store, router }/* { app, router, ... } */) => {
  // something to do
  api = axios.create({
    baseURL: import.meta.env.VITE_APP_BACKEND,
    timeout: 0,
    withCredentials: true
  })

  api.interceptors.response.use(function (response) {
    return response
  }, function (error) {
    const status = error.response && error.response.status ? error.response.status : null
    let message = error.response && error.response.data || error.message
    const caption = typeof (message) === 'object' && message.caption || ''
    message = typeof (message) === 'object' && message.body || message

    if ([401, 403].includes(status)) {
      const accountStore = useAccountStore(store)
      accountStore.signed = false
      accountStore.info = new User()
      const url = status === 401 ? `${import.meta.env.VITE_APP_TRADURS}/sign?redirect=${encodeURIComponent(document.location.href)}` : `${import.meta.env.VITE_APP_TRADURS}/info`
      Notify.create({
        progress: true,
        icon: 'img:/images/icons/warning.svg',
        classes: 'no-invert',
        color: 'warning',
        textColor: 'dark',
        multiLine: true,
        message,
        caption,
        actions: [
          {
            label: i18n.global.t('btn.move'), color: 'dark', handler: () => {
              document.location.replace(url)
            }
          }
        ]
      })
    }
    else {
      let message = error.response && error.response.data || error.message
      const caption = typeof (message) === 'object' && message.caption || ''
      message = typeof (message) === 'object' && message.body || message

      Notify.create({
        icon: 'img:/images/icons/alert.svg',
        color: 'negative',
        classes: '',
        message,
        caption,
        timeout: 3000
      })
    }

    return Promise.reject()
  })

  if (process.env.SERVER && ssrContext?.req.headers.cookie)
    api.defaults.headers.common['cookie'] = ssrContext?.req.headers.cookie

  router.beforeEach(async (to, from, next) => {
    api.defaults.headers.common['Accept-Language'] = to.params.lang || ssrContext?.req.headers['Accept-Language'] || 'ko'

    const gs = useGlobalStore(store)
    const as = useAccountStore(store)
    const is = useItemStore(store)
    const ps = usePartyStore(store)
    const requireAuth = to.matched.find(route => route.meta.requireAuth)

    if (to.params.lang?.length === 2 && !gs.localeOptions.map(lo => lo.value).includes(to.params.lang as string) && to.name !== 'pnf')
      return next({ name: 'pnf' })

    if (requireAuth && !as.info.id)
      return next({ name: 'tradeList', params: { lang: to.params.lang } })

    if (as.info.id && (as.messenger === null || is.socket === null || ps.party === null)) {
      await initMessenger(as, is)
      await initParty(as, ps)
      await as.unreadMessages()
    }

    return next()
  })

  app.provide('axios', api)

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

export { api }
