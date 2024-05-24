import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { ref } from 'vue'

export type IUser = {
  selected: boolean
  identity: string
  email: string
  battleTag: string
  status: string
}

export const useAdminStore = defineStore('admin', () => {
  const rows = 20
  const over = ref<boolean>(false)
  const more = ref<boolean>(false)

  const getUsers = (page: number, searchInfo?: string) => {
    return new Promise<Array<IUser>>((resolve, reject) => {
      api.get('/d4/admin/user', { params: { page, rows, searchInfo } })
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

  const resendVerify = (identity: string) => {
    return new Promise<void>((resolve, reject) => {
      api.get('/d4/admin/user/verify/resend', { params: { identity } })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  const resetCore = () => {
    return new Promise<void>((resolve, reject) => {
      api.get('/d4/admin/data/core/reset')
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
    resetCore
  }
})