import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/:lang([^/]{2})?',
    component: () => import('layouts/MainLayout.vue'),
    props: true,
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
        name: 'partyPlay',
        path: 'party',
        component: () => import('pages/PartyPage.vue')
      },
      {
        name: 'awards',
        path: 'awards',
        component: () => import('pages/AwardsPage.vue')
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
        name: 'blocks',
        path: 'blocks',
        component: () => import('pages/BlocksPage.vue'),
        meta: {
          requireAuth: true
        }
      },
      {
        name: 'history',
        path: 'history',
        component: () => import('pages/HistoryPage.vue'),
        meta: {
          requireAuth: true
        }
      },
      {
        name: 'support',
        path: 'support/:section([a-z]{0,})?',
        component: () => import('pages/SupportPage.vue'),
        props: true
      },
      {
        name: 'admin',
        path: 'admin',
        props: true,
        meta: {
          onlyAdmin: true
        },
        redirect: { name: 'adminUser' },
        children: [
          {
            name: 'adminUser',
            path: 'user',
            component: () => import('pages/admin/UserPage.vue')
          },
          {
            name: 'adminData',
            path: 'data',
            component: () => import('pages/admin/DataPage.vue')
          }
        ]
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    name: 'pnf',
    path: '/:catchAll(.*)*',
    component: () => import('pages/PageNotFound.vue')
  },
  {
    name: 'ftc',
    path: '/:catchAll(.*)*',
    component: () => import('pages/FailedToConnection.vue')
  }
]

export default routes
