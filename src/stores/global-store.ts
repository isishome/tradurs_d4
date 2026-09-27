import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { LocalStorage } from 'quasar'
import { useItemStore } from './item-store'
import { useAccountStore } from './account-store'
import { clearLocalStorage } from 'src/common'

const catalogLoads = new WeakMap<object, Promise<void>>()

export const useGlobalStore = defineStore('global', {
  state: () => ({
    localeOptions: [
      { value: 'ko', label: '한국어' },
      { value: 'en', label: 'English' }
    ],
    itemName: null as string | null,
    offsetTop: 0 as number,
    scrollTop: 0 as number,
    reloadAdKey: 0 as number,
    loading: false as boolean,
    catalogReady: false,
    catalogFailed: false
  }),
  getters: {},
  actions: {
    loadCatalog(lang: string) {
      if (this.catalogReady) return Promise.resolve()
      const pending = catalogLoads.get(this)
      if (pending) return pending

      const items = useItemStore()
      const account = useAccountStore()
      const loading = Promise.resolve().then(async () => {
        if (
          LocalStorage.getItem('APP_VERSION') !== import.meta.env.VITE_APP_VERSION ||
          LocalStorage.getItem('lang') !== lang
        ) {
          clearLocalStorage()
          LocalStorage.setItem('APP_VERSION', import.meta.env.VITE_APP_VERSION)
          LocalStorage.setItem('lang', lang)
        }
        await Promise.all([
          items.getBase(), items.getProperties(), items.getAffixes(),
          items.getRestrictions(), items.getFixedItems(), items.getSetGroups(),
          account.getEvaluations()
        ])
        this.catalogReady = true
      }).catch((error) => {
        this.catalogFailed = true
        throw error
      })
      // Keep the settled promise too: failures need a reload, not a partially
      // initialized retry while the other catalog requests are still running.
      catalogLoads.set(this, loading)
      return loading
    },
    checkHealth() {
      return new Promise<void>((resolve, reject) => {
        api
          .get('/d4/system/health')
          .then(() => {
            resolve()
          })
          .catch(() => {
            reject()
          })
      })
    },
    contactUs(token: string, contents: string | null) {
      return new Promise<void>((resolve, reject) => {
        api
          .post('/d4/contact', { token, contents })
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
        api
          .post('/d4/contact/answer', { msgId, contents })
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
