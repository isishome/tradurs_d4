import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    localeOptions: [
      { value: 'ko', label: '한국어' },
      { value: 'en', label: 'English' }
    ],
    itemName: null as string | null,
    offsetTop: 0 as number,
    scrollTop: 0 as number,
    topAccessTimeStamp: Date.now(),
    bottomAccessTimeStamp: Date.now(),
    rightAccessTimeStamp: Date.now(),
    reloadAdKey: 0 as number,
    loading: false as boolean
  }),
  getters: {},
  actions: {
    contactUs(token: string, contents: string | null) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/contact', { token, contents })
          .then(() => {
            resolve()
          })
          .catch(() => {
            reject()
          })
      })
    },
    answer(msgId: number, contents: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/contact/answer', { msgId, contents })
          .then(() => {
            resolve()
          })
          .catch(() => {
            reject()
          })
      })
    }
  }
})