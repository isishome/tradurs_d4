import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'boot/axios'
import { Socket } from 'socket.io-client'
import { IUser } from 'src/types/user'

export interface IPartyMessage {
  id: number,
  battleTag: string,
  message: string,
  regDate: string,
}

export interface IParty {
  id?: number,
  type: string,
  category: string,
  name: string,
  runs: number,
  current?: number,
  people: number,
  region: string,
  notes: string,
  regDate?: string
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
  const partyId = ref<number | null>(null)
  const joined = ref<boolean>(false)
  const partyMember = ref<Array<IUser>>([])
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

  const setParty = (party: IParty) => {
    return new Promise<number>((resolve, reject) => {
      api.post('/d4/party/open', { party })
        .then((response) => {
          resolve(response.data)
        })
        .catch(() => {
          reject()
        })
    })
  }

  const check = () => {
    return new Promise<number>((resolve, reject) => {
      api.get('/d4/party/check')
        .then((response) => {
          resolve(response.data)
        })
        .catch(() => {
          reject()
        })
    })
  }

  return { party, parties, partyPage, partyId, joined, partyMember, partyMessages, getParties, setParty, check }

})