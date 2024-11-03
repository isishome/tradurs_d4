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
        meta: {
          onlyAdmin: true
        },
        redirect: { name: 'adminUser' },
        children: [
          {
            name: 'adminUser',
            path: 'user/:identity([a-zA-Z0-9_-]{1,})?',
            component: () => import('pages/admin/UserPage.vue'),
            props: true
          },
          {
            name: 'adminItem',
            path: 'item/:identity([a-zA-Z0-9_-]{1,})?',
            component: () => import('pages/admin/ItemPage.vue'),
            props: true
          },
          {
            name: 'adminAffix',
            path: 'affix',
            component: () => import('pages/admin/AffixPage.vue')
          }
        ]
      },
      {
        name: 'dev',
        path: 'dev',
        meta: {
          onlyDev: true
        },
        redirect: { name: 'devAffix' },
        children: [
          {
            name: 'devAffix',
            path: 'affix',
            component: () => import('pages/dev/AffixPage.vue')
          }
        ]
      },
      // {
      //   name: 'test',
      //   path: 'test',
      //   component: () => import('pages/TestPage.vue'),
      //   props: true
      // },
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
