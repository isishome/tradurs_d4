import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { User, type INotify } from 'src/types/user'
import { Socket } from 'socket.io-client'
import { type ILabel } from 'src/stores/item-store'

export interface IEvaluation extends ILabel {
  type: string
}

export const useAccountStore = defineStore('account', {
  state: () => ({
    signed: null as boolean | null,
    info: {} as User,
    position: { left: 0, top: 0 },
    socket: null as Socket | null,
    newMessages: false as boolean,
    evaluations: {
      data: [] as Array<IEvaluation>,
      loading: false as boolean,
      request: 0 as number
    },
    messagePage: {
      rows: 6 as number,
      over: false as boolean,
      more: false as boolean,
      unread: 0 as number
    },
  }),
  getters: {
    filterEvaluations: (state) => {
      return (ids?: Array<number>) => ids ? state.evaluations.data.filter(e => ids.includes(Number(e.value))) : state.evaluations.data.map(e => ({ ...e, keepColor: e.type === '001', color: e.type === '001' ? 'negative' : 'primary' }))
    }
  },
  actions: {
    checkSign() {
      return new Promise<void>((resolve, reject) => {
        api.get('/account/signed')
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
    retrieve() {
      return new Promise<void>((resolve, reject) => {
        api.get('/account/retrieve')
          .then((response) => {
            this.info = response.data
            this.signed = typeof (response.data.id) !== 'undefined'
            resolve()
          })
          .catch(() => {
            reject()
          })

        resolve()
      })
    },
    sign() {
      return new Promise<boolean>(resolve => {
        api.get('/account/signOut')
          .then(() => {
            this.signed = false
            this.info = {} as User
            this.socket = null
            this.newMessages = false
            resolve(false)
          })
      })
    },
    getEvaluations() {
      return new Promise<void>((resolve, reject) => {
        let error: unknown = null
        if (this.evaluations.request === 0) {
          this.evaluations.loading = true
          api.get('/account/evaluations')
            .then((response) => {
              this.evaluations.data = response.data
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.evaluations.loading = false
              this.evaluations.request++

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
    notify(notify: INotify) {
      return new Promise<void>((resolve, reject) => {
        api.post('/account/notify', notify)
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    getMessages(page: number) {
      return new Promise<void>((resolve) => {
        api.post('/account/messages', { page, rows: this.messagePage.rows })
          .then((response) => {
            this.messagePage.over = page > 1
            this.messagePage.more = response.data.length > this.messagePage.rows
            response.data.splice(this.messagePage.rows, 1)
            resolve(response.data)
          })
      })
    },
    readMessage(msgIds: Array<number>) {
      return new Promise<void>((resolve) => {
        api.post('/account/messages/read', { msgIds })
          .then(() => {
            resolve()
          })
      })
    },
    unreadMessages() {
      return new Promise<void>((resolve) => {
        api.get('/account/messages/unread')
          .then((response) => {
            this.messagePage.unread = response.data
            resolve()
          })
      })
    },
    block(battleTag: string) {
      return new Promise<void>((resolve) => {
        api.post('/d4/account/block', { battleTag })
          .then(() => {
            resolve()
          })
      })
    },
    unblock(battleTag: string) {
      return new Promise<void>((resolve) => {
        api.post('/d4/account/unblock', { battleTag })
          .then(() => {
            resolve()
          })
      })
    }
  }
})