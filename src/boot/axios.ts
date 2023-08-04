import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance } from 'axios'
import { Notify } from 'quasar'
import { useAccountStore } from 'stores/account-store'
import { User } from 'src/types/user'
import { i18n } from './i18n'

let api: AxiosInstance

export default boot(({ app, ssrContext, store, router }) => {
  api = axios.create({
    baseURL: import.meta.env.VITE_APP_BACKEND,
    timeout: 0,
    withCredentials: true
  })

  api.interceptors.response.use(function (response) {
    return response
  }, function (error) {
    const status = error.response && error.response.status ? error.response.status : null
    if ([401, 403].includes(status)) {
      const accountStore = useAccountStore(store)
      accountStore.signed = false
      accountStore.info = new User()
      const url = status === 401 ? `${import.meta.env.VITE_APP_TRADURS}/sign?redirect=${encodeURIComponent(document.location.href)}` : `${import.meta.env.VITE_APP_TRADURS}/info`
      Notify.create({
        progress: true,
        icon: 'img:/images/icons/alert.svg',
        classes: 'no-invert',
        color: 'warning',
        textColor: 'dark',
        multiLine: true,
        message: error.response && error.response.data || error.message,
        actions: [
          {
            label: i18n.global.t('btn.move'), color: 'dark', handler: () => {
              document.location.href = url
            }
          }
        ]
      })
    }
    else {
      const message = error.response && error.response.data || error.message

      Notify.create({
        icon: 'img:/images/icons/alert.svg',
        color: 'negative',
        classes: '',
        message: message,
        timeout: 3000
      })
    }

    return Promise.reject()
  })

  if (process.env.SERVER && ssrContext?.req.headers.cookie)
    api.defaults.headers.common['cookie'] = ssrContext?.req.headers.cookie

  router.beforeEach((to, from, next) => {
    api.defaults.headers.common['Accept-Language'] = to.params.lang || ssrContext?.req.headers['Accept-Language'] || 'ko-KR'
    next()
  })

  app.provide('axios', api)

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api }