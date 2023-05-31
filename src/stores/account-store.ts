import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { i18n } from 'boot/i18n'
import { User } from 'src/types/user'
import { Socket } from 'socket.io-client'
import { type ILabel } from 'src/stores/item-store'
import { sleep } from 'src/common'

export interface IEvaluation extends ILabel { }

const timeout = 0

export const useAccountStore = defineStore('account', {
  state: () => ({
    signed: null as boolean | null,
    info: {} as User,
    position: { left: 0, top: 0 },
    socket: null as Socket | null,
    badge: false as boolean,
    evaluations: {
      data: [] as Array<IEvaluation>,
      loading: false as boolean,
      request: 0 as number
    }
  }),
  getters: {
    filterEvaluations: (state) => {
      return (ids?: Array<number>) => ids ? state.evaluations.data.filter(e => ids.includes(Number(e.value)) && e.lang === i18n.global.locale.value) : state.evaluations.data.filter(e => e.lang === i18n.global.locale.value)
    }
  },
  actions: {
    async checkSign() {
      return new Promise<void>((resolve, reject) => {
        if (this.signed === null) {
          api.get('/account/signed')
            .then((response) => {
              this.info = response.data
              this.signed = typeof (response.data.id) !== 'undefined'
              resolve()
            })
            .catch(() => {
              reject()
            })
        }

        resolve()
      })
    },
    sign() {
      return new Promise<boolean>(resolve => {
        if (!this.signed) {
          const tradurs: string = import.meta.env.VITE_APP_TRADURS
          document.location.href = `${tradurs}/sign?redirect=${encodeURIComponent(document.location.href)}`
          resolve(true)
        }

        api.get('/account/signOut')
          .then(() => {
            this.signed = false
            this.info = {} as User
            this.socket = null
            this.badge = false
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
      return new Promise<void>(async (resolve) => {
        await sleep(timeout)
        api.post('/battlenet/tag/update', { battleTag })
          .then(() => {
            resolve()
          })
      })
    }
  }
})