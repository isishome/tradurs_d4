import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'boot/axios'
import { Socket } from 'socket.io-client'
import { IUser } from 'src/types/user'

export interface IPartyUser extends IUser {
  partyId: number,
  owner: boolean,
  typing: boolean
}

export interface IPartyMessage {
  id: number,
  battleTag: string,
  message: string,
  regDate: string,
}

export interface IParty {
  battleTag?: string,
  type: string,
  category: string,
  name: string,
  runs: number,
  current?: number,
  people: number,
  region: string,
  notes: string,
  regDate?: string,
  joined?: number
}

export interface IPage {
  rows: number,
  over: boolean,
  more: boolean
}

export const usePartyStore = defineStore('party', () => {
  const party = ref<Socket | null>(null)
  const parties = ref<Array<IParty>>([])
  const partyPage = ref<IPage>({
    rows: 20,
    over: false,
    more: false
  })
  const joined = ref<boolean>(false)
  const minimum = ref<boolean>(false)
  const partyMember = ref<Array<IPartyUser>>([])
  const partyMessages = ref<Array<IPartyMessage>>([])

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

  const sendParty = ({ msg }: { msg: string }) => {
    return new Promise<void>((resolve, reject) => {
      api.post('/d4/party/send', { msg })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  const dispose = () => {
    joined.value = false
    minimum.value = false
    partyMember.value = []
    partyMessages.value = []
  }

  return { party, parties, partyPage, joined, minimum, partyMember, partyMessages, getParties, openParty, joinParty, sendParty, dispose }

})