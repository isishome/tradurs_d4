import { defineStore } from 'pinia'
import { i18n } from 'src/boot/i18n'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    itemName: null as string | null
  }),
  getters: {
    getTitle: (state) => {
      return (pageName?: string): string => i18n.global.t('seo.title', { pageName: pageName ? `${pageName} - ` : '', itemName: state.itemName ? `${state.itemName} - ` : '' })
    },
  },
  actions: {
    defaultAct: (param: string) => {
    }
  }
})