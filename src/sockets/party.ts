import { i18n } from 'src/boot/i18n'
import { Notify } from 'quasar'
import { Manager } from 'socket.io-client'
import { useAccountStore } from 'src/stores/account-store'
import { usePartyStore, type IPartyMessage, type IPartyUser, PartyMessageTypes } from 'src/stores/party-store'

type AccountStore = ReturnType<typeof useAccountStore>
type PartyStore = ReturnType<typeof usePartyStore>

const prod = import.meta.env.PROD

export const initParty = async (as: AccountStore, ps: PartyStore) => {
  if (process.env.SERVER)
    return

  const manager = new Manager(import.meta.env.VITE_APP_SOCKET, {
    reconnectionDelayMax: 10000,
    withCredentials: prod
  })

  ps.party = manager.socket('/party')

  ps.party.on('connect', () => {
    ps.party?.emit('check', as.info.id, (member?: Array<IPartyUser>, remainSeconds?: number, totalSeconds?: number) => {
      if (member && remainSeconds && totalSeconds) {
        ps.partyMember = member!
        ps.remainSeconds = remainSeconds!
        ps.totalSeconds = totalSeconds!
        ps.joined = true
        ps.startTimer()
      }
    })
  })

  ps.party.on('error', (data: string) => {
    ps.setErrorMessage(i18n.global.t(`socket.${data}`))
  })

  ps.party.on('dupe', (data: { battleTag: string, code: string }) => {
    if (as.info.battleTag === data.battleTag) {
      Notify.create({
        position: 'top',
        icon: 'img:/images/icons/warning.svg',
        color: 'warning',
        textColor: 'black',
        classes: 'no-invert',
        message: i18n.global.t(`socket.${data.code}`)
      })

      ps.dispose()
    }
  })

  ps.party.on('message', (data: IPartyMessage) => {
    const findUser = ps.partyMember.find((pm: IPartyUser) => pm.battleTag === data.battleTag)
    if (findUser) {
      data.type = PartyMessageTypes.DEFAULT
      data.regDate = Date.now()
      findUser.typing = false
      ps.push(data)

      if (ps.minimum)
        ps.unseen++
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

  ps.party.on('takeover', (data: string) => {
    const findUser = ps.partyMember.find((pm: IPartyUser) => pm.battleTag === data)

    if (findUser) {
      const message: IPartyMessage = { type: PartyMessageTypes.SYSTEM, battleTag: findUser.battleTag as string, message: `${findUser.battleTag}님이 방장이 되었습니다.` }
      findUser.owner = true
      ps.push(message)
    }
  })
}