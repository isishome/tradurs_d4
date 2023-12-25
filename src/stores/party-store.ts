import { defineStore } from 'pinia'
import { ref, reactive, computed, Ref, ComputedRef } from 'vue'
import { uid, throttle, date, extend } from 'quasar'
import { i18n } from 'src/boot/i18n'
import { api } from 'boot/axios'
import { Socket } from 'socket.io-client'
import { type IUser, User } from 'src/types/user'

import { useAccountStore } from './account-store'
import { useItemStore, type ILabel } from './item-store'
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
  ALL = '',
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

export interface IPartyRoom extends IParty {
  current: number,
  remainSeconds?: Ref,
  remainColor?: ComputedRef,
  remain?: ComputedRef,
  timer?: ReturnType<typeof setInterval>,
  showNotes: boolean,
  authorized: boolean,
  user: User
  set(): void,
  clear(): void
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

export interface IPartyRegion extends ILabel {
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

interface IRange {
  min: number,
  max: number
}

export interface IFilter {
  service: string,
  region: string,
  type: string,
  category: string,
  runs: IRange,
  people: IRange,
  cost: string,
  name: string,
  request: number,
  loading: boolean
}

export class Party implements IPartyRoom {
  service = PartyServiceTypes.SELL
  region = PartyRegionTypes.ASIA
  hardcore = false
  ladder = true
  type = 'bosses'
  category = 'duriel'
  name = ''
  runs = 1
  people = 2
  time = 1
  notes = ''
  price = new Price()
  battleTag?: string
  regDate?: string
  expireDate?: string
  current = 0
  timer?: NodeJS.Timeout
  remainSeconds?: Ref
  remainColor?: ComputedRef
  remain?: ComputedRef
  showNotes = false
  authorized = false
  user = new User()

  constructor(party: IParty) {
    Object.assign(this, party)
    this.set()
  }

  set(): void {
    this.remainSeconds = ref<number>(date.getDateDiff(this.expireDate ?? Date.now(), Date.now(), 'seconds'))
    this.remainColor = computed(() => this.remainSeconds?.value < 600 ? 'negative' : this.remainSeconds?.value < 1800 ? 'orange' : 'positive')
    this.remain = computed(() => `${Math.floor(this.remainSeconds?.value / 3600).toString()}:${date.formatDate((this.remainSeconds?.value % 3600) * 1000, 'mm:ss')}`)

    this.timer = setInterval(() => {
      if (this.remainSeconds?.value && this.remainSeconds?.value >= 1)
        this.remainSeconds.value = this.remainSeconds?.value - 1
      else
        this.clear()
    }, 1000)
  }

  clear(): void {
    clearInterval(this.timer)
  }
}

export const defaultFilter: IFilter = {
  service: '',
  region: '',
  type: 'bosses',
  category: 'duriel',
  runs: { min: 1, max: 30 },
  people: { min: 2, max: 8 },
  cost: '',
  name: '',
  request: 0,
  loading: false
}

export const usePartyStore = defineStore('party', () => {
  const party = ref<Socket | null>(null)
  const base = reactive<IBase>({
    loading: false,
    request: 0
  } as IBase)
  const filter = reactive<IFilter>(extend(false, defaultFilter))
  const partyInfo = ref<IPartyRoom>({} as IPartyRoom)
  const partyPage = ref<IPage>({
    rows: 1,
    over: false,
    more: false
  })
  const joined = ref<boolean>(false)
  const minimum = ref<boolean>(false)
  const request = ref<number>(0)
  const unseen = ref<number>(0)
  const partyMember = ref<Array<IPartyUser>>([])
  const remainSeconds = ref<number>(3600)
  const totalSeconds = ref<number>(3600)
  const partyMessages = ref<Array<IPartyMessage>>([])
  const errorMessages = ref<Array<IErrorMessage>>([])

  const getRegion = computed(() => (region?: string): Array<IPartyRegion> => region ? base.regions.filter(r => r.value === region) : base.regions)
  const getType = computed(() => (type?: string): Array<ILabel> => type ? base.partyTypes.filter(pt => pt.value === type) : base.partyTypes)
  const getCategory = computed(() => (category?: string): Array<IPartyCategory> => category ? base.partyCategories.filter(pc => pc.value === category) : base.partyCategories)
  const getCategoryByType = computed(() => (type?: string): Array<IPartyCategory> => type ? base.partyCategories.filter(pc => pc.party_type === type) : base.partyCategories)


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

  const clearFilter = () => {
    Object.assign(filter, defaultFilter)
  }

  const getParties = (page: number, isFilter?: boolean) => {
    return new Promise<Array<IParty>>((resolve, reject) => {
      const is = useItemStore()
      api.post('/d4/party', { page, rows: partyPage.value.rows, basicFilter: { hardcore: is.storage.data.hardcore, ladder: is.storage.data.ladder }, filter: isFilter ? filter : {} })
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

  const getParty = (battleTag: string) => {
    return new Promise<Array<IParty>>((resolve, reject) => {
      const is = useItemStore()
      api.post('/d4/party/info', { battleTag, basicFilter: { hardcore: is.storage.data.hardcore, ladder: is.storage.data.ladder } })
        .then((response) => {
          resolve(response.data)
        })
        .catch(() => {
          reject()
        })
    })
  }

  const openParty = (party: IParty) => {
    return new Promise<void>((resolve, reject) => {
      const is = useItemStore()
      party.hardcore = is.storage.data.hardcore
      party.ladder = is.storage.data.ladder
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
      const message: IPartyMessage = { type: PartyMessageTypes.SYSTEM, battleTag, message: i18n.global.t('party.messages.kick', { btag: battleTag }) }
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
    clearFilter,
    filter,
    partyInfo,
    partyPage,
    joined,
    minimum,
    request,
    unseen,
    partyMember,
    remainSeconds,
    totalSeconds,
    partyMessages,
    errorMessages,
    getRegion,
    getType,
    getCategory,
    getCategoryByType,
    show, hide, getBase, getParty, getParties, openParty, joinParty, push, kick, setErrorMessage, startTimer, clearTimer, dispose
  }

})