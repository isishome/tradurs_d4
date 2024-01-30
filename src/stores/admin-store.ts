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
  const rows = 300
  const over = ref<boolean>(false)
  const more = ref<boolean>(false)

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
  return { getUsers }
})