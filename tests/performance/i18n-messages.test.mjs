import test from 'node:test'
import assert from 'node:assert/strict'
import { baseCompile } from '@intlify/message-compiler'
import { createI18n } from 'vue-i18n'
import { resolveMessages, koMessages, enMessages } from './.generated/loaders.mjs'

function compile(value, minify) {
  if (typeof value === 'string') return baseCompile(value, { jit: true, minify }).ast
  if (Array.isArray(value)) return value.map(entry => compile(entry, minify))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, compile(entry, minify)]))
  }
  return value
}

for (const minify of [false, true]) {
  test(`structured translations resolve ${minify ? 'compact' : 'development'} ASTs including control fields`, () => {
    const messages = Object.fromEntries(Object.entries({ ko: koMessages, en: enMessages }).map(([locale, source]) => [locale, compile({
      notice: source.notice.contents, support: source.support, sort: source.sort.options
    }, minify)]))
    const { global: composer } = createI18n({ legacy: false, locale: 'ko', messages })
    for (const [locale, source] of Object.entries({ ko: koMessages, en: enMessages })) {
      composer.locale.value = locale
      for (const [key, expected] of Object.entries({ notice: source.notice.contents, support: source.support, sort: source.sort.options })) {
        assert.deepEqual(resolveMessages(composer.tm(key), key === 'support' ? message => composer.rt(message, { x: '{x}' }) : composer.rt), expected)
      }
    }
  })
}
