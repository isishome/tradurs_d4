import { boot } from 'quasar/wrappers'
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig
} from 'axios'
import { Notify, QNotifyUpdateOptions } from 'quasar'
import { useAccountStore } from 'stores/account-store'
import { User } from 'src/types/user'
import { i18n } from './i18n'
import { markRaw } from 'vue'

const CSRF_HEADER = 'X-CSRF-Token'
const CSRF_ERROR_CODE = '0160'

let api: AxiosInstance
let dismiss:
  | undefined
  | {
      (props?: QNotifyUpdateOptions): void
      (props?: QNotifyUpdateOptions): void
    }

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(
  ({ app, ssrContext, store, router } /* { app, router, ... } */) => {
    // something to do
    const requestApi = axios.create({
      baseURL: import.meta.env.VITE_APP_BACKEND,
      withCredentials: true
    })

    // Stores must retain their own SSR request's client, not a module binding
    // that the next simultaneous render can replace.
    store.use(() => ({ $api: markRaw(requestApi) }))
    if (!process.env.SERVER) api = requestApi

    // 상태 변경 요청에 CSRF 토큰을 붙인다(back task-csj-006). SSR 상태를 이어받은 브라우저도
    // 같은 값을 쓰도록 요청할 때마다 store에서 읽는다.
    requestApi.interceptors.request.use((config) => {
      const csrf = useAccountStore(store).csrf
      if (csrf && config.method !== 'get') config.headers.set(CSRF_HEADER, csrf)
      return config
    })

    // back이 CSRF 토큰을 거부하면(0160) 새 토큰을 받아 한 번만 다시 보낸다.
    const csrfRetried = new WeakSet<object>()
    const retryWithNewCsrf = async (config: InternalAxiosRequestConfig) => {
      csrfRetried.add(config)
      const options = process.env.SERVER
        ? { headers: { Cookie: config.headers.get('Cookie') } }
        : undefined
      await useAccountStore(store)
        .checkSign(options as AxiosRequestConfig | undefined)
        .catch(() => undefined)
      return requestApi(config)
    }

    requestApi.interceptors.response.use(
      function (response) {
        return response
      },
      function (error) {
        const config: InternalAxiosRequestConfig | undefined = error.config
        if (
          error.response?.headers?.['x-error-code'] === CSRF_ERROR_CODE &&
          config &&
          config.method !== 'get' &&
          !csrfRetried.has(config)
        )
          return retryWithNewCsrf(config)

        const status =
          error.response && error.response.status ? error.response.status : null
        let message = (error.response && error.response.data) || error.message
        const caption = (typeof message === 'object' && message.caption) || ''
        message = (typeof message === 'object' && message.body) || message

        if (process.env.SERVER || dismiss) return Promise.reject(error)

        // 403은 back이 배틀태그 미인증 사용자를 거절한 경우다(0132). 로그인은 그대로 두고 인증 안내를 연다.
        if (status === 403) {
          useAccountStore(store).battleTagGuide = true
        } else if (status === 401) {
          const accountStore = useAccountStore(store)
          accountStore.signed = false
          accountStore.info = new User()
          const lang = !!router.currentRoute.value.params.lang
            ? `/${router.currentRoute.value.params.lang}`
            : ''
          const url = `${
            import.meta.env.VITE_APP_TRADURS
          }${lang}/sign?redirect=${encodeURIComponent(document.location.href)}`

          dismiss = Notify.create({
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
                label: i18n.global.t('btn.move'),
                color: 'dark',
                handler: () => {
                  document.location.replace(url)
                }
              }
            ],
            onDismiss: () => {
              dismiss = undefined
            }
          })
        } else {
          let message = (error.response && error.response.data) || error.message
          const caption = (typeof message === 'object' && message.caption) || ''
          message = (typeof message === 'object' && message.body) || message

          dismiss = Notify.create({
            icon: 'img:/images/icons/alert.svg',
            color: 'negative',
            classes: '',
            message,
            caption,
            timeout: 3000,
            onDismiss: () => {
              dismiss = undefined
            }
          })
        }

        return Promise.reject()
      }
    )

    app.provide('axios', requestApi)

    app.config.globalProperties.$axios = axios
    // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
    //       so you won't necessarily have to import axios in each vue file

    app.config.globalProperties.$api = requestApi
    // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
    //       so you can easily perform requests against your app's API
  }
)

export { api }
