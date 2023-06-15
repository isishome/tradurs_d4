import { route } from 'quasar/wrappers'
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import routes from './routes'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore } from 'src/stores/item-store'
import { Notify } from 'quasar'
import { Manager } from 'socket.io-client'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

const initSocket = (as: any, is: any) => {
  const manager = new Manager(import.meta.env.VITE_APP_SOCKET, {
    reconnectionDelayMax: 10000,
    withCredentials: import.meta.env.PROD
  })

  as.socket = manager.socket('/messenger')
  as.socket.on('connect', () => {
    as.socket.emit('join', as.info.id)
  })

  as.socket.on('message', (data: string) => {
    Notify.create({
      position: 'top',
      message: data,
    })
  })

  as.socket.on('newItems', () => {
    if (as.info.notify)
      is.socket.newItems++
  })

  as.socket.on('newOffer', (itemId: string) => {
    if (as.info.notify)
      is.socket.newOffer = itemId
  })

  as.socket.on('acceptedOffer', (data: { itemName: string, itemId: string }) => {
    if (as.info.notify)
      is.socket.acceptedOffer = data
  })

  as.socket.on('complete', (data: { itemName: string, itemId: string }) => {
    if (as.info.notify)
      is.socket.complete = data
  })

  as.socket.on('newMessages', () => {
    as.newMessages = true
  })
}

export default route(function ({ store }/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior(to, from, savedPosition) {
      const as = useAccountStore(store)
      let result = { left: 0, top: 0 }

      if (savedPosition)
        result = savedPosition

      as.position = result
    },
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach(async (to) => {
    const as = useAccountStore(store)
    const is = useItemStore(store)
    const requireAuth = to.matched.find(route => route.meta.requireAuth)

    if (requireAuth && !as.info.id)
      return { path: '/' }

    if (as.info.id && !as.socket)
      initSocket(as, is)
  })

  return Router
})