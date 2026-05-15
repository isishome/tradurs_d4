import { defineStore } from 'pinia'
import { computed } from 'vue'
import { Cookies } from 'quasar'
import { api } from 'boot/axios'
import { i18n } from 'src/boot/i18n'

import { applyFont, normalizeFont } from 'src/boot/appearance'

import type { FontMode } from 'src/boot/appearance'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    localeOptions: [
      { value: 'ko', label: '한국어' },
      { value: 'en', label: 'English' }
    ],
    font: 'kodia' as FontMode,
    fontOptions: computed<{ value: FontMode; label: string }[]>(() => [
      { value: 'kodia', label: i18n.global.t('font.kodia') },
      { value: 'system', label: i18n.global.t('font.system') }
    ]),
    itemName: null as string | null,
    offsetTop: 0 as number,
    scrollTop: 0 as number,
    timeLimit: 0 as number,
    topAccessTimeStamp: Date.now(),
    bottomAccessTimeStamp: Date.now(),
    rightAccessTimeStamp: Date.now(),
    reloadAdKey: 0 as number,
    loading: false as boolean
  }),
  getters: {},
  actions: {
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
    },
    initFont(value?: unknown) {
      this.font = normalizeFont(value)
      applyFont(this.font)
    },
    setFont(font: FontMode) {
      this.font = font
      Cookies.set('d4.font', font, { path: '/', expires: 365 })
      applyFont(font)
    }
  }
})
