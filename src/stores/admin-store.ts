import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { ref } from 'vue'

export type IUser = {
  selected: boolean
  identity: string
  status: string
  verified: boolean
  email: string
  battleTag: string
}

export type Option = {
  value: string
  label: string
  color?: string
}

export type Filter = {
  status: string
  verified: string
  statusOptions: Array<Option>
  verifiedOptions: Array<Option>
}

export const useAdminStore = defineStore('admin', () => {
  const rows = 10
  const over = ref<boolean>(false)
  const more = ref<boolean>(false)

  const getUsers = (page: number, filter?: Filter, searchInfo?: string) => {
    return new Promise<Array<IUser>>((resolve, reject) => {
      api.get('/d4/admin/user', { params: { page, rows, filter: { status: filter?.status, verified: filter?.verified }, searchInfo } })
        .then((response) => {
          over.value = page > 1
          more.value = response.data.length > rows
          response.data.splice(rows, 1)
          resolve(response.data)
        })
        .catch(() => {
          reject()
        })
    })
  }

  const resendVerify = (identity: string, lang: string) => {
    return new Promise<void>((resolve, reject) => {
      api.post('/d4/admin/user/verify/resend', { identity, lang })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  const deactivate = (identity: string, hour = 24 as number, description = '관리자' as string) => {
    return new Promise<void>((resolve, reject) => {
      api.post('/d4/admin/user/deactivate', { identity, hour, description })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  const activate = (identity: string, description = '관리자' as string) => {
    return new Promise<void>((resolve, reject) => {
      api.post('/d4/admin/user/activate', { identity, description })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  const refreshAffixes = () => {
    return new Promise<void>((resolve, reject) => {
      api.get('/d4/admin/affix/refresh')
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  const upsertAffix = (action: 'insert' | 'update', affixId: number | null, affixType: string, affixAttribute: string, languageId: string) => {
    return new Promise<void>((resolve, reject) => {
      api.post('/d4/admin/affix/upsert', {
        action,
        affixId,
        affixType,
        affixAttribute,
        languageId
      })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  return {
    rows,
    over,
    more,
    getUsers,
    resendVerify,
    deactivate,
    activate,
    refreshAffixes,
    upsertAffix
  }
})