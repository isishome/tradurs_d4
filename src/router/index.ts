import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useAccountStore } from '@/stores/account'

// Init Router
export const router = createRouter({
  history: createWebHistory(),
  routes: routes,
  scrollBehavior(to) {
    return new Promise(async (resolve) => {
      resolve({ top: 0, behavior: 'auto' })
    })
  }
})

// Before Each
router.beforeEach(async (to) => {
  const accountStore = useAccountStore()
  await accountStore.checkSign()
  if (accountStore.signed) {
    if (to.matched.some(m => ['Sign', 'Forgot', 'Join'].includes(m.name as string)))
      return { name: 'Main' }
  }
  else {
    const isAuth = to.meta.isAuth
    if (isAuth)
      return { name: 'Sign' }
  }

})