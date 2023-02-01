import axios from 'axios'
import { router } from '@/router'
import { Notify } from 'quasar'
import { useAccountStore } from '@/stores/account'
import alert from '@/assets/icons/alert.svg'
export const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_BACKEND_ORIGIN || `${document.location.protocol}//${document.location.hostname}:6081`,
  timeout: 10000,
  withCredentials: true
})
instance.interceptors.response.use(function (response) {
  return response
}, function (error) {
  const status = error.response && error.response.status ? error.response.status : null
  if (status === 401) {
    const accountStore = useAccountStore()
    accountStore.signed = false
    router.push({ name: 'Sign' })
    return Promise.reject()
  }
  else {
    const message = error.response && error.response ? error.response.data : error.message

    Notify.create({
      icon: `img:${alert}`,
      color: 'negative',
      message: message
    })

    return Promise.reject()
  }
})