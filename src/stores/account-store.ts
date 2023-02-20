import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useAccountStore = defineStore('account', {
  state: () => ({
    signed: false as boolean
  }),
  actions: {
    async checkSign() {
      if (this.signed === null) {
        try {
          const response = await api.get('/account/signed')
          this.signed = response.data
        }
        catch { }
      }
    }
  }
})