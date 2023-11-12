import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { Socket } from 'socket.io-client'

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

export const usePartyStore = defineStore('party', {
  state: () => ({
    party: null as Socket | null,
    parties: Array<IParty>,
    partyPage: {
      rows: 20 as number,
      over: false as boolean,
      more: false as boolean
    },
  }),
  getters: {

  },
  actions: {
    getParties(page: number) {
      return new Promise<Array<IParty>>((resolve, reject) => {
        api.post('/d4/party', { page, rows: this.partyPage.rows })
          .then((response) => {
            this.partyPage.over = page > 1
            this.partyPage.more = response.data.length > this.partyPage.rows
            response.data.splice(this.partyPage.rows, 1)
            resolve(response.data)
          })
          .catch(() => {
            reject()
          })
      })
    },
    setParty(party: IParty) {
      return new Promise<number>((resolve, reject) => {
        api.post('/d4/party/open', { party })
          .then((response) => {
            resolve(response.data)
          })
          .catch(() => {
            reject()
          })
      })
    },
    check() {
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
  }
})