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

export interface IHistoryTypes extends ILabel {}

interface IContents {
  item_id?: number
  amount?: number
  degree?: number
}

export interface IHistory extends IItem {
  historyId: number
  typeName: string
  actionName: string
  contents: IContents
  description: string | null
  regDate: string
  price_currency: string
  price_currency_value: string | null
  price_quantity: number
}

export const useAccountStore = defineStore('account', {
  state: () => ({
    signed: null as boolean | null,
    info: {} as User,
    // 상태 변경 요청 헤더로 돌려보내는 CSRF 토큰(back task-csj-006). 화면 정보(info)와 분리해 둔다.
    csrf: '' as string,
    messenger: null as Socket | null,
    newMessages: false as boolean,
    battleTagGuide: false as boolean,
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
    // back과 같은 기준: 배틀태그가 있고 Battle.net 인증까지 마친 사용자만 거래 기능을 쓴다.
    battleTagVerified: (state) =>
      !!state.signed && !!state.info.battleTag && !!state.info.verified,
    filterEvaluations: (state) => {
      return (ids?: Array<number>) =>
        ids
          ? state.evaluations.data.filter((e) => ids.includes(Number(e.value)))
          : state.evaluations.data.map((e) => ({
              ...e,
              keepColor: e.type === '001',
              color: e.type === '001' ? 'negative' : 'primary'
            }))
    }
  },
  actions: {
    checkSign(options?: AxiosRequestConfig) {
      return new Promise<void>((resolve, reject) => {
        this.$api
          .get('/account/signed', options)
          .then((response) => {
            const { csrf, ...info } = response.data
            this.info = info
            this.csrf = csrf ?? ''
            this.signed = typeof info.id !== 'undefined'
            resolve()
          })
          .catch(() => {
            reject()
          })
      })
    },
    sign(options?: AxiosRequestConfig) {
      return new Promise<boolean>((resolve) => {
        // 로그아웃 요청이 실패해도 화면은 로그아웃 상태로 돌린다.
        this.$api
          .post('/account/signout', undefined, options)
          .catch(() => undefined)
          .then(() => {
            this.signed = null
            this.info = {} as User
            this.csrf = ''
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
          this.$api
            .get('/history/types')
            .then((response) => {
              this.historyTypes.data = response.data
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.historyTypes.loading = false

              if (error) reject()
              else resolve()
            })
        } else resolve()
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
        } else if (this.evaluations.request === 0) {
          this.evaluations.request++
          this.evaluations.loading = true
          this.$api
            .get('/account/evaluations')
            .then((response) => {
              LocalStorage.setItem('evaluations', JSON.stringify(response.data))
              this.evaluations.data = response.data
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.evaluations.loading = false

              if (error) reject()
              else resolve()
            })
        } else resolve()
      })
    },
    // 배틀태그 인증이 필요한 기능 앞에서 부른다. 미인증이면 front_v2 내 정보로 안내하는 대화상자를 연다.
    requireBattleTag() {
      if (this.battleTagVerified) return true
      this.battleTagGuide = true
      return false
    },
    // notify(notify: INotify) {
    //   return new Promise<void>((resolve, reject) => {
    //     this.$api.post('/account/notify', notify)
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
        this.$api
          .post('/account/messages', { page, rows: this.messagePage.rows })
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
        this.$api
          .post('/d4/account/blocks', { page, rows: this.blockPage.rows })
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
        this.$api
          .post('/account/messages/read', { msgIds })
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
        this.$api
          .get('/account/messages/unread', options)
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
        this.$api
          .post('/d4/account/block', { battleTag })
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
        this.$api
          .post('/d4/account/unblock', { battleTags })
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
        this.$api
          .post(`/history/${service}/${historyType}`, {
            rows: this.historyPage.rows,
            nextHistoryId: this.historyPage.nextHistoryId,
            period
          })
          .then((response) => {
            this.historyPage.nextHistoryId = response.data.slice(
              this.historyPage.rows,
              this.historyPage.rows + 1
            )[0]?.historyId
            response.data.splice(this.historyPage.rows, 1)
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    }
  }
})
