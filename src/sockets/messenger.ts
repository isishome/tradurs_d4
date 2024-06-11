import { i18n } from 'src/boot/i18n'
import { Notify } from 'quasar'
import { Manager } from 'socket.io-client'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore, type OfferInfo } from 'src/stores/item-store'

type AccountStore = ReturnType<typeof useAccountStore>
type ItemStore = ReturnType<typeof useItemStore>

const prod = import.meta.env.PROD

export const initMessenger = async (as: AccountStore, is: ItemStore) => {
  if (process.env.SERVER)
    return

  const manager = new Manager(import.meta.env.VITE_APP_SOCKET, {
    reconnection: false,
    withCredentials: prod,
    transports: ['websocket']
  })

  as.messenger = manager.socket('/messenger')

  const reconnect = (message = i18n.global.t('socket.disconnect')) => {
    Notify.create({
      icon: 'img:/images/icons/warning.svg',
      classes: 'no-invert',
      color: 'warning',
      textColor: 'dark',
      multiLine: true,
      message,
      progress: true,
      timeout: 10000,
      actions: [
        {
          noCaps: true,
          dense: true,
          class: 'no-hover text-underline',
          label: i18n.global.t('btn.reConnect'),
          color: 'dark', handler: () => {
            as.messenger?.connect()
          }
        }
      ]
    })
  }

  as.messenger.on('connect', () => {
    as.messenger?.emit('join', as.info.id)
  })

  as.messenger.on("connect_error", () => {
    if (!!!as.signed)
      return

    reconnect(i18n.global.t('socket.failed'))
  })

  as.messenger.on('disconnect', () => {
    if (!!!as.signed)
      return

    reconnect()
  })

  as.messenger.on('error', (data: string) => {
    Notify.create({
      position: 'top',
      icon: 'img:/images/icons/alert.svg',
      color: 'negative',
      classes: '',
      message: i18n.global.t(`socket.${data}`)
    })
  })

  as.messenger.on('message', (data: string) => {
    Notify.create({
      position: 'top',
      message: data,
    })
  })

  const notify = () => {
    as.newMessages = true
    as.messagePage.unread++
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