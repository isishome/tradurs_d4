import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'item-list',
        path: '',
        component: () => import('pages/IndexPage.vue'),
        children: [
          {
            name: 'item-detail',
            path: ':itemid',
            component: () => import('pages/IndexPage.vue'),
            props: true
          }
        ]
      },
      { path: 'message', component: () => import('pages/MessagePage.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
