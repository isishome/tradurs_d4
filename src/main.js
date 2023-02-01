import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
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
  config: {
    brand: {
      primary: '#A59263',
      secondary: '#26A69A',
      accent: '#9C27B0',
      light: '#FFFFFF',
      //light: '#FDFDFD',
      //'light-page': '#DBDBDB',
      'light-page': '#FBFBFB',
      'light-border': '#DDDDDD',
      dark: '#1a1a1a',
      'dark-page': '#040404',
      'dark-border': '#222222',
      positive: '#21BA45',
      negative: '#C10015',
      info: '#31CCEC',
      warning: '#F2C037',
      magic: '#4169E1',
      'dark-magic': '#010951',
      rare: '#FFFF00',
      'dark-rare': '#332200',
      set: '#00FF00',
      'dark-set': '#003300',
      unique: '#A59263',
      'dark-unique': '#463213',
      shadow: '#000000',
      'filter-normal': 'invert(39%) sepia(1%) saturate(1823%) hue-rotate(16deg) brightness(100%) contrast(89%)',
      'filter-magic': 'invert(33%) sepia(27%) saturate(7235%) hue-rotate(219deg) brightness(97%) contrast(82%)',
      'filter-rare': 'invert(90%) sepia(51%) saturate(4962%) hue-rotate(358deg) brightness(106%) contrast(54%)',
      'filter-set': 'invert(60%) sepia(44%) saturate(4863%) hue-rotate(84deg) brightness(118%) contrast(54%)',
      'filter-unique': 'invert(76%) sepia(11%) saturate(1353%) hue-rotate(5deg) brightness(77%) contrast(75%)'
    }
  }
}).use(createPinia()).use(router)
  .component('Link', Link)
  .component('Title', Title)
  .component('Move', Move)
  .component('Note', Note)
  .component('Info', Info)
  .mount('#app')
