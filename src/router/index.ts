import { route } from 'quasar/wrappers'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'
import { LocalStorage } from 'quasar'
import { i18n } from 'src/boot/i18n'
import routes from './routes'
import { api } from 'boot/axios'
import { useGlobalStore } from 'src/stores/global-store'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore } from 'stores/item-store'
import { initMessenger } from 'src/sockets/messenger'
import { clearLocalStorage } from 'src/common'

const prod = import.meta.env.PROD

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (
  { store, ssrContext } /* { store, ssrContext } */
) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
    ? createWebHistory
    : createWebHashHistory

  const Router = createRouter({
    scrollBehavior(to, from, savedPosition) {
      if (!!history.state.noScrollTop) return
      else if (!!history.state.scrollTop) return { left: 0, top: 0 }

      return savedPosition || { left: 0, top: 0 }
    },
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach(async (to, from, next) => {
    const lang = to.params.lang || 'ko'
    api.defaults.headers.common['Accept-Language'] = lang

    const gs = useGlobalStore(store)
    const as = useAccountStore(store)
    const is = useItemStore(store)
    const onlyAdmin = !!to.matched.some((m) => m.meta.onlyAdmin)
    const onlyDev = !!to.matched.some((m) => m.meta.onlyDev)
    const requireAuth = !!to.matched.some((m) => m.meta.requireAuth)

    if (!process.env.SERVER && !['pnf', 'ftc'].includes(to.name as string)) {
      try {
        const appVersion = LocalStorage.getItem<string>('APP_VERSION')
        const locale = LocalStorage.getItem<string>('lang')

        if (
          appVersion !== import.meta.env.VITE_APP_VERSION ||
          locale !== lang
        ) {
          clearLocalStorage()
          LocalStorage.setItem('APP_VERSION', import.meta.env.VITE_APP_VERSION)
          LocalStorage.setItem('lang', lang)
        }

        const promises = [
          is.getBase(),
          is.getProperties(),
          is.getAffixes(),
          is.getRestrictions(),
          as.getEvaluations(),
          gs.checkHealth()
        ]

        await Promise.all(promises)
      } catch {
        return next({ name: 'ftc' })
      }
    }

    if (as.signed === null && !['pnf', 'ftc'].includes(to.name as string)) {
      const options = process.env.SERVER
        ? {
            headers: {
              Cookie: ssrContext?.req.headers['cookie'],
              'Accept-Language': to.params.lang || 'ko'
            }
          }
        : undefined

      await as
        .checkSign(options)
        .then(() => {})
        .catch(() => {
          as.sign(options)
        })
    }

    if (
      ((to.params.lang?.length === 2 &&
        !gs.localeOptions
          .map((lo) => lo.value)
          .includes(to.params.lang as string)) ||
        (onlyAdmin && !as.info.isAdmin) ||
        (onlyDev && prod)) &&
      to.name !== 'pnf'
    )
      return next({ name: 'pnf' })

    if (requireAuth && !as.info.id)
      return next({ name: 'tradeList', params: { lang: to.params.lang } })

    if (
      !!as.info.id &&
      as.messenger === null &&
      !['pnf', 'ftc'].includes(to.name as string)
    ) {
      try {
        await initMessenger(as, is)
      } catch {
        return next({ name: 'ftc' })
      }
    }

    return next()
  })

  Router.afterEach((to, from) => {
    if (
      from.name &&
      to.name &&
      (to.name !== from.name || to.query.page !== from.query.page)
    ) {
      const gs = useGlobalStore(store)
      gs.reloadAdKey++
    }
  })

  return Router
})
