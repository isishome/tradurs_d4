import { boot } from 'quasar/wrappers'
import Adsense from 'components/global/Adsense.vue'

import D4Btn from 'components/UI/D4Btn.vue'
import D4Counter from 'components/UI/D4Counter.vue'
import D4Dialog from 'components/UI/D4Dialog.vue'
import D4Tooltip from 'components/UI/D4Tooltip.vue'
import D4Note from 'components/UI/D4Note.vue'

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app }/* { app, router, ... } */) => {
  // something to do
  app.component('Adsense', Adsense)
    .component('D4Btn', D4Btn)
    .component('D4Counter', D4Counter)
    .component('D4Dialog', D4Dialog)
    .component('D4Tooltip', D4Tooltip)
    .component('D4Note', D4Note)
})
