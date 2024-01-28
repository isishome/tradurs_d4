import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { ref } from 'vue'

export type IUser = {
  selected: boolean
  identity: string
  email: string
  status: string
}

export const useAdminStore = defineStore('admin', () => {
  const rows = 100
  const over = ref<boolean>(false)
  const more = ref<boolean>(false)
  const getLow = () => {
    return new Promise<{ low: number, total: number }>((resolve, reject) => {
      api.get('/d4/admin/user/security/low')
        .then((response) => {
          resolve(response.data)
        })
        .catch(() => {
          reject()
        })
    })
  }

  const getUsers = (page: number) => {
    return new Promise<Array<IUser>>((resolve, reject) => {
      api.get('/d4/admin/user', { params: { page, rows } })
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

  const enhance = (identities: Array<string>) => {
    return new Promise<boolean | string>((resolve, reject) => {
      api.post('/d4/admin/user/enhance', { identities })
        .then((response) => {
          resolve(response.data)
        })
        .catch(() => {
          reject()
        })
    })
  }

  return { getLow, getUsers, enhance }
})