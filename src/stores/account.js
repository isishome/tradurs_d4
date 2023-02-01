import { defineStore } from 'pinia'
import { instance } from '@/axios'

export const useAccountStore = defineStore('account', {
  state: () => ({
    signed: null
  }),
  actions: {
    async checkSign() {
      if (this.signed === null) {
        try {
          const response = await instance.get('/account/signed')
          this.signed = response.data
        }
        catch { }
      }
    }
  }
})