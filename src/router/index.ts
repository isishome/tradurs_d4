import { route } from 'quasar/wrappers'
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import routes from './routes'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore, type OfferInfo } from 'src/stores/item-store'
import { useGlobalStore } from 'src/stores/global-store'
import { Notify, Screen } from 'quasar'
import { Manager } from 'socket.io-client'
import { usePartyStore, type IPartyMessage, type IPartyUser, PartyMessageTypes } from 'src/stores/party-store'

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
    withCredentials: prod
  })

  as.messenger = manager.socket('/messenger')
  ps.party = manager.socket('/party')

  as.messenger.on('connect', () => {
    as.messenger?.emit('join', as.info.id)
  })

  as.messenger.on('message', (data: string) => {
    Notify.create({
      position: 'top',
      message: data,
    })
  })

  ps.party.on('connect', () => {
    ps.party?.emit('check', as.info.id, (member?: Array<IPartyUser>) => {
      if (member) {
        ps.partyMember = member!
        ps.joined = true
      }
    })
  })

  ps.party.on('error', (data: string) => {
    Notify.create({
      message: data,
      classes: 'bg-negative',
      textColor: 'white',
      position: Screen.lt.sm ? 'bottom' : 'bottom-right'
    })
  })

  ps.party.on('message', (data: IPartyMessage) => {
    const findUser = ps.partyMember.find((pm: IPartyUser) => pm.battleTag === data.battleTag)
    if (findUser) {
      data.type = PartyMessageTypes.DEFAULT
      data.regDate = Date.now()
      findUser.typing = false
      ps.push(data)
    }
  })

  ps.party.on('typing', ({ battleTag, typing, avatar }: { battleTag: string, typing: boolean, avatar: number }) => {
    const findUser = ps.partyMember.find((pm: IPartyUser) => pm.battleTag === battleTag && as.info.battleTag !== battleTag)
    if (findUser) {
      findUser.avatar = avatar
      findUser.typing = typing
    }
  })

  ps.party.on('online', (data: IPartyUser) => {
    let findUser = ps.partyMember.find((pm: IPartyUser) => pm.battleTag === data.battleTag)

    if (findUser)
      findUser.online = true
    else {
      ps.partyMember.push(data)
      const message: IPartyMessage = { type: PartyMessageTypes.SYSTEM, battleTag: data.battleTag as string, message: `${data.battleTag}님이 방에 들어왔습니다.` }
      ps.push(message)
    }
  })

  ps.party.on('offline', (data: string) => {
    const findUser = ps.partyMember.find((pm: IPartyUser) => pm.battleTag === data)
    if (findUser)
      findUser.online = false
  })

  ps.party.on('leave', (data: string) => {
    const message: IPartyMessage = { type: PartyMessageTypes.SYSTEM, battleTag: data as string, message: `${data}님이 방을 나갔습니다.` }
    const findUserIndex = ps.partyMember.findIndex((pm: IPartyUser) => pm.battleTag === data)
    if (findUserIndex !== -1) {
      ps.partyMember.splice(findUserIndex, 1)
      ps.push(message)
    }
  })

  ps.party.on('kick', (data: string) => {
    const message: IPartyMessage = { type: PartyMessageTypes.SYSTEM, battleTag: data as string, message: `${data}님 방에서 쫓겨났습니다.` }
    const findUserIndex = ps.partyMember.findIndex((pm: IPartyUser) => pm.battleTag === data)
    if (findUserIndex !== -1) {
      ps.partyMember.splice(findUserIndex, 1)

      if (as.info.battleTag === data)
        ps.dispose()
      else
        ps.push(message)
    }
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