import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { User } from 'src/types/user'

export const useAccountStore = defineStore('account', {
  state: () => ({
    signed: null as boolean | null,
    info: {} as User
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