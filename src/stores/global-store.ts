import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { i18n } from 'src/boot/i18n'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    localeOptions: [
      { value: 'ko', label: '한국어' },
      { value: 'en', label: 'English' }
    ],
    itemName: null as string | null,
    refresh: 0 as number
  }),
  getters: {
    getTitle: (state) => {
      return (pageName?: string): string => i18n.global.t('seo.title', { pageName: pageName ? `${pageName} - ` : '', itemName: state.itemName ? `${state.itemName} - ` : '' })
    },
  },
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