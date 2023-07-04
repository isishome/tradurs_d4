import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'tradeList',
        path: '',
        component: () => import('pages/IndexPage.vue')
      },
      {
        name: 'itemInfo',
        path: 'item/:itemid',
        component: () => import('pages/ItemPage.vue'),
        props: true
      },
      {
        name: 'messages',
        path: 'messages',
        component: () => import('pages/MessagesPage.vue'),
        meta: {
          requireAuth: true
        }
      },
      {
        name: 'awards',
        path: 'awards',
        component: () => import('pages/AwardsPage.vue')
      },
      {
        name: 'support',
        path: 'support',
        component: () => import('pages/SupportPage.vue')
      },
      {
        name: 'test',
        path: 'test',
        component: () => import('pages/Test.vue'),
        meta: {
          requireAuth: true
        }
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    name: 'pnf',
    path: '/:catchAll(.*)*',
    component: () => import('pages/PageNotFound.vue')
  }
]

export default routes
