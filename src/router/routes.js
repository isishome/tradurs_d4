import NotFound from '@/pages/NotFound.vue'
import Layout from '@/pages/Layout.vue'
import Main from '@/pages/Main.vue'

export const routes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  },
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Main',
        component: Main
      }
    ]
  }
]