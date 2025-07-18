import { api } from 'boot/axios'
import { defineStore } from 'pinia'
import { AxiosRequestConfig } from 'axios'
import { LocalStorage } from 'quasar'
import { User } from 'src/types/user'
import { Socket } from 'socket.io-client'
import { type ILabel } from 'src/stores/item-store'
import { IItem } from 'src/types/item'


export interface IEvaluation extends ILabel {
  type: string
}

export interface IHistoryTypes extends ILabel { }

interface IContents {
  item_id?: number,
  amount?: number,
  degree?: number
}

export interface IHistory extends IItem {
  historyId: number,
  typeName: string,
  actionName: string,
  contents: IContents,
  description: string | null,
  regDate: string,
  price_currency: string,
  price_currency_value: string | null,
  price_quantity: number
}

export const useAccountStore = defineStore('account', {
  state: () => ({
    signed: null as boolean | null,
    info: {} as User,
    messenger: null as Socket | null,
    newMessages: false as boolean,
    historyTypes: {
      data: [] as Array<IHistoryTypes>,
      loading: false as boolean,
      request: 0 as number
    },
    evaluations: {
      data: [] as Array<IEvaluation>,
      loading: false as boolean,
      request: 0 as number
    },
    messagePage: {
      rows: 20 as number,
      over: false as boolean,
      more: false as boolean,
      unread: 0 as number
    },
    blockPage: {
      rows: 20 as number,
      over: false as boolean,
      more: false as boolean
    },
    historyPage: {
      rows: 20 as number,
      nextHistoryId: null as number | null
    }
  }),
  getters: {
    filterEvaluations: (state) => {
      return (ids?: Array<number>) => ids ? state.evaluations.data.filter(e => ids.includes(Number(e.value))) : state.evaluations.data.map(e => ({ ...e, keepColor: e.type === '001', color: e.type === '001' ? 'negative' : 'primary' }))
    }
  },
  actions: {
    checkSign(options?: AxiosRequestConfig) {
      return new Promise<void>((resolve, reject) => {
        api.get('/account/signed', options)
          .then((response) => {
            this.info = response.data
            this.signed = typeof (response.data.id) !== 'undefined'
            resolve()
          })
          .catch(() => {
            reject()
          })
      })
    },
    sign(options?: AxiosRequestConfig) {
      return new Promise<boolean>(resolve => {
        api.get('/account/signOut', options)
          .then(() => {
            this.signed = null
            this.info = {} as User
            this.messenger?.disconnect()
            this.messenger = null
            this.newMessages = false
            resolve(false)
          })
      })
    },
    getHistoryTypes() {
      return new Promise<void>((resolve, reject) => {
        let error: unknown = null
        if (this.historyTypes.request === 0) {
          this.historyTypes.request++
          this.historyTypes.loading = true
          api.get('/history/types')
            .then((response) => {
              this.historyTypes.data = response.data
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.historyTypes.loading = false

              if (error)
                reject()
              else
                resolve()
            })
        }
        else
          resolve()
      })
    },
    getEvaluations() {
      return new Promise<void>((resolve, reject) => {
        let error: unknown = null
        const data = LocalStorage.getItem<string>('evaluations') ?? ''
        if (!!data && this.evaluations.request === 0) {
          this.evaluations.request++
          this.evaluations.data = JSON.parse(data)
          resolve()
        }
        else if (this.evaluations.request === 0) {
          this.evaluations.request++
          this.evaluations.loading = true
          api.get('/account/evaluations')
            .then((response) => {
              LocalStorage.setItem('evaluations', JSON.stringify(response.data))
              this.evaluations.data = response.data
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.evaluations.loading = false

              if (error)
                reject()
              else
                resolve()
            })
        }
        else
          resolve()
      })
    },
    updateBattleTag(battleTag: string) {
      return new Promise<void>((resolve) => {
        api.post('/battlenet/tag/update', { battleTag })
          .then(() => {
            resolve()
          })
      })
    },
    // notify(notify: INotify) {
    //   return new Promise<void>((resolve, reject) => {
    //     api.post('/account/notify', notify)
    //       .then(() => {
    //         resolve()
    //       })
    //       .catch((e) => {
    //         reject(e)
    //       })
    //   })
    // },
    getMessages(page: number) {
      return new Promise<void>((resolve, reject) => {
        api.post('/account/messages', { page, rows: this.messagePage.rows })
          .then((response) => {
            this.messagePage.over = page > 1
            this.messagePage.more = response.data.length > this.messagePage.rows
            response.data.splice(this.messagePage.rows, 1)
            resolve(response.data)
          })
          .catch(() => {
            reject()
          })
      })
    },
    getBlocks(page: number) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/account/blocks', { page, rows: this.blockPage.rows })
          .then((response) => {
            this.blockPage.over = page > 1
            this.blockPage.more = response.data.length > this.blockPage.rows
            response.data.splice(this.blockPage.rows, 1)
            resolve(response.data)
          })
          .catch(() => {
            reject()
          })
      })
    },
    readMessage(msgIds: Array<number>) {
      return new Promise<void>((resolve, reject) => {
        api.post('/account/messages/read', { msgIds })
          .then(() => {
            resolve()
          })
          .catch(() => {
            reject()
          })
      })
    },
    unreadMessages(options?: AxiosRequestConfig) {
      return new Promise<void>((resolve, reject) => {
        api.get('/account/messages/unread', options)
          .then((response) => {
            this.messagePage.unread = response.data.unread
            resolve()
          })
          .catch(() => {
            reject()
          })
      })
    },
    block(battleTag: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/account/block', { battleTag })
          .then(() => {
            resolve()
          })
          .catch(() => {
            reject()
          })
      })
    },
    unblock(battleTags: Array<string>) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/account/unblock', { battleTags })
          .then(() => {
            resolve()
          })
          .catch(() => {
            reject()
          })
      })
    },
    getHistory(service: string, historyType?: string, period?: number) {
      return new Promise<Array<IHistory>>((resolve, reject) => {
        api.post(`/history/${service}/${historyType}`, {
          rows: this.historyPage.rows,
          nextHistoryId: this.historyPage.nextHistoryId,
          period
        })
          .then((response) => {
            this.historyPage.nextHistoryId = response.data.slice(this.historyPage.rows, this.historyPage.rows + 1)[0]?.historyId
            response.data.splice(this.historyPage.rows, 1)
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
  }
})