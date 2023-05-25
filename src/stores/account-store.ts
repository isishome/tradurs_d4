import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { User } from 'src/types/user'
import { Socket } from 'socket.io-client'

export const useAccountStore = defineStore('account', {
  state: () => ({
    signed: null as boolean | null,
    info: {} as User,
    socket: null as Socket | null,
    badge: false as boolean
  }),
  actions: {
    async checkSign() {
      if (this.signed === null) {
        try {
          const response = await api.get('/account/signed')
          this.info = response.data
          this.signed = typeof (response.data.id) !== 'undefined'
        }
        catch { }
      }
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
    updateBattleTag(battleTag: string) {
      return new Promise<void>((resolve) => {
        api.post('/battlenet/tag/update', { battleTag })
          .then(() => {
            resolve()
          })
      })
    },
  }
})