import { boot } from 'quasar/wrappers'
import D4Btn from 'components/UI/D4Btn.vue'
import D4Counter from 'components/UI/D4Counter.vue'
import D4Dialog from 'components/UI/D4Dialog.vue'
import D4Tooltip from 'components/UI/D4Tooltip.vue'

export default boot(({ app }) => {
  app.component('D4Btn', D4Btn)
    .component('D4Counter', D4Counter)
    .component('D4Dialog', D4Dialog)
    .component('D4Tooltip', D4Tooltip)
})
