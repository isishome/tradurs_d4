import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance } from 'axios'
import { Notify, Cookies, Quasar } from 'quasar'
import { useAccountStore } from 'stores/account-store'
import { User } from 'src/types/user'
import { i18n } from './i18n'
import { icons } from 'src/common/icons'

let api: AxiosInstance

export default boot(({ app, ssrContext, store }) => {
  api = axios.create({
    baseURL: import.meta.env.VITE_APP_BACKEND,
    timeout: 0,
    withCredentials: true
  })

  api.interceptors.response.use(function (response) {
    return response
  }, function (error) {
    const status = error.response && error.response.status ? error.response.status : null
    if (status === 401) {
      const accountStore = useAccountStore(store)
      accountStore.signed = false
      accountStore.info = new User()
      const url = `${import.meta.env.VITE_APP_TRADURS}/sign?redirect=${encodeURIComponent(document.location.href)}`
      Notify.create({
        progress: true,
        icon: `img:${icons.alert}`,
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
    else if (status === 403) {
      const url = `${import.meta.env.VITE_APP_TRADURS}/info`
      document.location.href = url
    }
    else {
      const message = error.response && error.response.data || error.message

      Notify.create({
        icon: `img:${icons.alert}`,
        color: 'negative',
        classes: '',
        message: message,
        timeout: 3000
      })
    }

    return Promise.reject()
  })

  const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies

  if (process.env.SERVER && ssrContext?.req.headers.cookie)
    api.defaults.headers.common['cookie'] = ssrContext?.req.headers.cookie

  api.defaults.headers.common['Accept-Language'] = cookies.has('d4.lang') ? cookies.get('d4.lang') : Quasar.lang.getLocale() || ssrContext?.req.headers['accept-language'] || 'ko-KR'

  app.provide('axios', api)

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api }