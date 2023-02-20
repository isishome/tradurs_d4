import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance } from 'axios'
import { Notify } from 'quasar'
import { useAccountStore } from 'stores/account-store'
import alert from 'assets/icons/alert.svg'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_BACKEND_ORIGIN,
  timeout: 10000,
  withCredentials: true
});

api.interceptors.response.use(function (response) {
  return response
}, function (error) {
  const status = error.response && error.response.status ? error.response.status : null
  if (status === 401) {
    const accountStore = useAccountStore()
    accountStore.signed = false
    //router.push({ name: 'Sign' })
  }
  else {
    const message = error.message || error.response && error.response.data

    Notify.create({
      icon: `img:${alert}`,
      color: 'negative',
      message: message,
      timeout: 10000
    })
  }

  //return Promise.reject(error)
})

export default boot(({ app, ssrContext }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  if (process.env.SERVER)
    api.defaults.headers.cookie = ssrContext?.req.headers.cookie || null

  app.provide('axios', api)

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api }
