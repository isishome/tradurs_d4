import { boot } from 'quasar/wrappers'
import { createI18n } from 'vue-i18n'
import { messages, numberFormats } from 'src/i18n'

export type MessageLanguages = keyof typeof messages
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = typeof messages['ko']

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-interface */
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema { }

  // define the datetime format schema
  export interface DefineDateTimeFormat { }

  // define the number format schema
  export interface DefineNumberFormat { }
}
/* eslint-enable @typescript-eslint/no-empty-interface */

let i18n: any

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app }/* { app, router, ... } */) => {
  // something to do
  i18n = createI18n({
    locale: 'ko',
    legacy: false,
    messages,
    numberFormats
  })

  // Set i18n instance on app
  app.use(i18n)
})

export { i18n }