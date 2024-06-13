import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance } from 'axios'
import { Notify } from 'quasar'
import { useAccountStore } from 'stores/account-store'
import { User } from 'src/types/user'
import { i18n } from './i18n'

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

    if (process.env.SERVER)
      return

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
            noCaps: true,
            dense: true,
            class: 'no-hover text-underline',
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

  app.provide('axios', api)

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

export { api }
