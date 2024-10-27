import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { ref, reactive } from 'vue'
import { IHistory } from './account-store'

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

export type RequestAffix = {
  requestId: number,
  affixType: string,
  affixAttribute: string,
  selected: boolean
}

export type Search = {
  itemName?: string
}

export type Item = {
  itemId: number
  itemName: string
  statusCode: string
  battleTag: string
  selected: boolean
  itemType: string
  itemTypeValue1: string
  itemTypeValue2: string
  userIdentity: string
}

export type History = {
  show: boolean
  identity?: string
  data: Array<IHistory>
}

export const useAdminStore = defineStore('admin', () => {
  const rows = 2
  const over = ref<boolean>(false)
  const more = ref<boolean>(false)
  const historyParams = reactive<{ rows: number, nextHistoryId: number | null }>({
    rows: 20 as number,
    nextHistoryId: null as number | null
  })

  const getUsers = (page: number, userIdentity?: string, filter?: Filter, searchInfo?: string) => {
    return new Promise<Array<IUser>>((resolve, reject) => {
      api.post('/d4/admin/user', { page, rows, userIdentity, filter: { status: filter?.status, verified: filter?.verified }, searchInfo })
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

  const getRequestAffixes = () => {
    return new Promise<Array<RequestAffix>>((resolve, reject) => {
      api.get('/d4/admin/affix/request')
        .then((response) => {
          resolve(response.data)
        })
        .catch(() => {
          reject()
        })
    })
  }

  const deleteRequestAffix = (requestIds: Array<number>) => {
    return new Promise<void>((resolve, reject) => {
      api.post('/d4/admin/affix/request/delete', {
        requestIds
      })
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

  const deleteAffix = (affixId: number) => {
    return new Promise<void>((resolve, reject) => {
      api.post('/d4/admin/affix/delete', {
        affixId
      })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  const getItems = (page: number, identity?: string, searchInfo?: Search) => {
    return new Promise<Array<Item>>((resolve, reject) => {
      api.get('/d4/admin/item/get', { params: { page, rows, identity, searchInfo } })
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

  const deleteItems = (itemIds: Array<number>) => {
    return new Promise<void>((resolve, reject) => {
      api.post('/d4/admin/item/delete', { itemIds })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  const updateItemName = (itemId: number, itemName: string) => {
    return new Promise<void>((resolve, reject) => {
      api.post('/d4/admin/item/update', { itemId, itemName })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }
  const getHistory = (identity: string) => {
    return new Promise<Array<IHistory>>((resolve, reject) => {
      api.get('/d4/admin/history', {
        params: {
          identity,
          rows: historyParams.rows,
          nextHistoryId: historyParams.nextHistoryId
        }
      })
        .then((response) => {
          historyParams.nextHistoryId = response.data.slice(historyParams.rows, historyParams.rows + 1)[0]?.historyId
          response.data.splice(historyParams.rows, 1)
          resolve(response.data)
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  return {
    rows,
    over,
    more,
    historyParams,
    getUsers,
    resendVerify,
    deactivate,
    activate,
    getRequestAffixes,
    deleteRequestAffix,
    refreshAffixes,
    upsertAffix,
    deleteAffix,
    getItems,
    deleteItems,
    updateItemName,
    getHistory
  }
})