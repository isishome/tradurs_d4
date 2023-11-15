import { route } from 'quasar/wrappers'
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import routes from './routes'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore, type OfferInfo } from 'src/stores/item-store'
import { useGlobalStore } from 'src/stores/global-store'
import { Notify } from 'quasar'
import { Manager } from 'socket.io-client'
import { usePartyStore } from 'src/stores/party-store'

type AccountStore = ReturnType<typeof useAccountStore>
type ItemStore = ReturnType<typeof useItemStore>
type PartyStore = ReturnType<typeof usePartyStore>
/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

const prod = import.meta.env.PROD

const initSocket = async (as: AccountStore, is: ItemStore, ps: PartyStore) => {
  if (process.env.SERVER)
    return

  const manager = new Manager(import.meta.env.VITE_APP_SOCKET, {
    reconnectionDelayMax: 10000,
    withCredentials: prod,
    transports: ['polling']
  })

  as.messenger = manager.socket('/messenger')
  ps.party = manager.socket('/party')

  as.messenger.on('connect', () => {
    as.messenger?.emit('join', as.info.id)
  })

  as.messenger.on('connect', () => {
    ps.party?.emit('init', as.info.id)
  })

  as.messenger.on('message', (data: string) => {
    Notify.create({
      position: 'top',
      message: data,
    })
  })

  const notify = () => {
    as.newMessages = true
    const sound = new Audio('/sounds/notify.wav')
    sound.play()
  }

  as.messenger.on('newItems', () => {
    if (as.info.notifyNew)
      is.socket.newItems++
  })

  as.messenger.on('newOffer', (offerInfo: OfferInfo) => {
    notify()
    if (as.info.notifyPrivate)
      is.socket.newOffer = offerInfo
  })

  as.messenger.on('acceptedOffer', (offerInfo: OfferInfo) => {
    notify()
    if (as.info.notifyPrivate)
      is.socket.acceptedOffer = offerInfo
  })

  as.messenger.on('retractedOffer', (offerInfo: OfferInfo) => {
    notify()
    if (as.info.notifyPrivate)
      is.socket.retractedOffer = offerInfo
  })

  as.messenger.on('turnedDownOffer', (offerInfo: OfferInfo) => {
    notify()
    if (as.info.notifyPrivate)
      is.socket.turnedDownOffer = offerInfo
  })

  as.messenger.on('complete', async (offerInfo: OfferInfo) => {
    notify()
    await as.retrieve()
    if (as.info.notifyPrivate)
      is.socket.complete = offerInfo
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
    const gs = useGlobalStore(store)
    const as = useAccountStore(store)
    const is = useItemStore(store)
    const ps = usePartyStore(store)
    const requireAuth = to.matched.find(route => route.meta.requireAuth)

    if (to.params.lang?.length === 2 && !gs.localeOptions.map(lo => lo.value).includes(to.params.lang as string) && to.name !== 'pnf')
      return { name: 'pnf' }

    if (requireAuth && !as.info.id)
      return { name: 'tradeList', params: { lang: to.params.lang } }

    if (as.info.id && (as.messenger === null || is.socket === null || ps.party === null)) {
      await initSocket(as, is, ps)
      await as.unreadMessages()
    }
  })

  Router.afterEach((to, from) => {
    if (from.name && to.name && to.name !== from.name) {
      const gs = useGlobalStore(store)
      gs.reloadAdKey++
    }
  })

  return Router
})