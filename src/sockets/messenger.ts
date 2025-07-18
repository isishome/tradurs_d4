import { i18n } from 'src/boot/i18n'
import { Notify, LocalStorage } from 'quasar'
import { Manager } from 'socket.io-client'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore, type OfferInfo } from 'src/stores/item-store'

type AccountStore = ReturnType<typeof useAccountStore>
type ItemStore = ReturnType<typeof useItemStore>

const prod = import.meta.env.PROD
const reconnectionAttempts = 3
let reconnectionCount = 0

export const initMessenger = async (as: AccountStore, is: ItemStore) => {
  if (process.env.SERVER)
    return

  const manager = new Manager(import.meta.env.VITE_APP_SOCKET, {
    withCredentials: prod,
    transports: ['websocket'],
    reconnectionAttempts
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
            reconnectionCount = 0
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


    reconnectionCount++
    if (reconnectionCount >= reconnectionAttempts)
      reconnect()
  })

  as.messenger.on('disconnect', () => {
    if (!!!as.signed)
      return
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
    const sound = new Audio(`/sounds/${is.storage.data.sound ?? '0'}.wav`)
    sound.volume = is.storage.data.volume ?? 1.0
    sound.play()
  }

  as.messenger.on('newItems', () => {
    if (is.storage.data.notifyNew)
      is.socket.newItems++
  })

  as.messenger.on('newOffer', (offerInfo: OfferInfo) => {
    notify()
    if (is.storage.data.notifyPrivate)
      is.socket.newOffer = offerInfo
  })

  as.messenger.on('acceptedOffer', (offerInfo: OfferInfo) => {
    notify()
    if (is.storage.data.notifyPrivate)
      is.socket.acceptedOffer = offerInfo
  })

  as.messenger.on('retractedOffer', (offerInfo: OfferInfo) => {
    notify()
    if (is.storage.data.notifyPrivate)
      is.socket.retractedOffer = offerInfo
  })

  as.messenger.on('turnedDownOffer', (offerInfo: OfferInfo) => {
    notify()
    if (is.storage.data.notifyPrivate)
      is.socket.turnedDownOffer = offerInfo
  })

  as.messenger.on('complete', async (offerInfo: OfferInfo) => {
    notify()
    await as.checkSign()
    if (is.storage.data.notifyPrivate)
      is.socket.complete = offerInfo
  })

  as.messenger.on('refreshAffixes', () => {
    is.affixes.request = 0
    LocalStorage.removeItem('affixes')
  })

  as.messenger.on('notice', ({ message, caption }: { message: { ko: string, en: string }, caption: string }) => {
    Notify.create({
      icon: 'img:/images/icons/warning.svg',
      classes: 'no-invert',
      color: 'warning',
      textColor: 'dark',
      multiLine: true,
      html: true,
      message: message[(i18n.global.locale.value ?? 'ko') as keyof typeof message],
      caption,
      timeout: 0,
      actions: [
        {
          dense: true,
          class: 'no-hover text-underline',
          label: i18n.global.t('btn.confirm'),
          color: 'dark'
        }
      ]
    })
  })
}