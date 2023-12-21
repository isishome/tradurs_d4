import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { uid, throttle } from 'quasar'
import { api } from 'boot/axios'
import { Socket } from 'socket.io-client'
import { IUser } from 'src/types/user'

import { useAccountStore } from './account-store'
import { ILabel } from './item-store'
import { Price } from 'src/types/item'

export enum PartyMessageTypes {
  SYSTEM = 0,
  DEFAULT = 1
}

export enum PartyServiceTypes {
  SELL = 'sell',
  BUY = 'buy'
}

export enum PartyRegionTypes {
  ASIA = 'asia',
  AMERICAS = 'americas',
  EUROPE = 'europe'
}

export interface IParty {
  service: PartyServiceTypes,
  region: PartyRegionTypes,
  hardcore: boolean,
  ladder: boolean,
  type: string,
  category: string,
  name: string,
  runs: number,
  people: number,
  time: number,
  notes: string,
  price: Price,
  battleTag?: string,
  regDate?: string,
  expireDate?: string
}

export interface IPartyUser extends IUser {
  owner: boolean,
  typing: boolean
}

export interface IPartyMessage {
  type: PartyMessageTypes,
  battleTag: string,
  avatar?: string,
  message: string,
  regDate?: number,
}

export interface IPage {
  rows: number,
  over: boolean,
  more: boolean
}

export interface IErrorMessage {
  id: string,
  message: string,
  show?: boolean
}

interface IPartyRegion extends ILabel {
  value: PartyRegionTypes
}


interface IPartyCategory extends ILabel {
  party_type: string
}

interface IBase {
  regions: Array<IPartyRegion>,
  partyTypes: Array<ILabel>,
  partyCategories: Array<IPartyCategory>,
  loading: boolean,
  request: number
}

export const usePartyStore = defineStore('party', () => {
  const party = ref<Socket | null>(null)
  const base = reactive<IBase>({
    loading: false,
    request: 0
  } as IBase)
  const parties = ref<Array<IParty>>([])
  const partyPage = ref<IPage>({
    rows: 20,
    over: false,
    more: false
  })
  const joined = ref<boolean>(false)
  const minimum = ref<boolean>(false)
  const unseen = ref<number>(0)
  const partyMember = ref<Array<IPartyUser>>([])
  const remainSeconds = ref<number>(3600)
  const totalSeconds = ref<number>(3600)
  const partyMessages = ref<Array<IPartyMessage>>([])
  const errorMessages = ref<Array<IErrorMessage>>([])

  const getType = computed(() => (type: string) => base.partyTypes.find(pt => pt.value === type)?.label)
  const getCategory = computed(() => (category: string) => base.partyCategories.find(pc => pc.value === category)?.label)
  const getRegion = computed(() => (region: string) => base.regions.find(r => r.value === region)?.label)

  const show = () => {
    unseen.value = 0
    minimum.value = false
  }

  const hide = () => {
    minimum.value = true
  }

  const getBase = () => {
    return new Promise<void>((resolve, reject) => {
      if (base.request === 0 || base.regions.length === 0 || base.partyTypes.length === 0 || base.partyCategories.length === 0) {
        base.loading = true
        api.get('/d4/party/base')
          .then((response) => {
            base.regions = response.data.regions
            base.partyTypes = response.data.partyTypes
            base.partyCategories = response.data.partyCategories
            base.request++
            resolve()
          })
          .catch(() => {
            reject()
          })
          .then(() => {
            base.loading = false
          })
      } else
        resolve()
    })
  }

  const partyCategories = computed(() => (partyType: string) => base.partyCategories.filter(pc => pc.party_type === partyType))

  const getParties = (page: number) => {
    return new Promise<Array<IParty>>((resolve, reject) => {
      api.post('/d4/party', { page, rows: partyPage.value.rows })
        .then((response) => {
          partyPage.value.over = page > 1
          partyPage.value.more = response.data.length > partyPage.value.rows
          response.data.splice(partyPage.value.rows, 1)
          resolve(response.data)
        })
        .catch(() => {
          reject()
        })
    })
  }

  const openParty = (party: IParty) => {
    return new Promise<void>((resolve, reject) => {
      api.post('/d4/party/open', { party })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  const joinParty = (battleTag: string) => {
    return new Promise<void>((resolve, reject) => {
      api.post('/d4/party/join', { battleTag })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  const push = (message: IPartyMessage) => {
    const max = 50
    if (partyMessages.value.length > max)
      partyMessages.value.splice(max, partyMessages.value.length)

    partyMessages.value.splice(0, 0, message)
  }

  const kick = (battleTag: string) => {
    const findPartyUserIndex = partyMember.value.findIndex((pm: IPartyUser) => pm.battleTag === battleTag)
    if (findPartyUserIndex !== -1) {
      const message: IPartyMessage = { type: PartyMessageTypes.SYSTEM, battleTag, message: `${battleTag}님을 방에서 내보냈습니다.` }
      partyMember.value.splice(findPartyUserIndex, 1)
      push(message)
    }
  }

  const setErrorMessage = throttle((message: string) => {
    const timeout = 3000
    const id = uid()
    errorMessages.value.push({ id, message, show: true })
    setTimeout(() => {
      const findMessage = errorMessages.value.find(em => em.id === id)
      if (findMessage)
        findMessage.show = false
    }, timeout)
    setTimeout(() => {
      errorMessages.value.splice(errorMessages.value.findIndex(em => em.id === id), errorMessages.value.findIndex(em => em.id === id) !== -1 ? 1 : 0)
    }, timeout + 1000)
  }, 400)

  let timer: ReturnType<typeof setInterval>
  const startTimer = () => {
    timer = setInterval(() => {
      if (remainSeconds.value > 0) {
        remainSeconds.value--
      }
      else {
        const as = useAccountStore()
        party.value?.emit('leave', { id: as.info.id }, () => {
          dispose()
        })
      }
    }, 1000)
  }

  const clearTimer = () => {
    clearInterval(timer)
  }

  const dispose = () => {
    joined.value = false
    minimum.value = false
    unseen.value = 0
    partyMember.value = []
    remainSeconds.value = 3600
    totalSeconds.value = 3600
    partyMessages.value = []
    errorMessages.value = []
    clearTimer()
  }

  return {
    party,
    base,
    partyCategories,
    parties,
    partyPage,
    joined,
    minimum,
    unseen,
    partyMember,
    remainSeconds,
    totalSeconds,
    partyMessages,
    errorMessages,
    getType,
    getCategory,
    getRegion,
    show, hide, getBase, getParties, openParty, joinParty, push, kick, setErrorMessage, startTimer, clearTimer, dispose
  }

})