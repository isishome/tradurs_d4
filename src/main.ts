import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { instance } from '@/axios'
import { Quasar, Cookies, Notify } from 'quasar'
import { router } from '@/router'
import Link from '@/components/paragraph/Link.vue'
import Title from '@/components/paragraph/Title.vue'
import Move from '@/components/paragraph/Move.vue'
import Note from '@/components/paragraph/Note.vue'
import Info from '@/components/paragraph/Info.vue'

// Import icon libraries
//import '@quasar/extras/roboto-font/roboto-font.css'
//import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/dist/quasar.css'

// Import using css
import '@/assets/base.css'
import '@/assets/item.css'

createApp(App).provide('axios', instance).use(Quasar, {
  plugins: { Cookies, Notify }, // import Quasar plugins and add here
  config: {}
}).use(createPinia()).use(router)
  .component('Link', Link)
  .component('Title', Title)
  .component('Move', Move)
  .component('Note', Note)
  .component('Info', Info)
  .mount('#app')