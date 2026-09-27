import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { renderToString } from 'vue/server-renderer'

const require = createRequire(import.meta.url)
const axios = require('axios')
// Import only the renderer factory. Never import index.js/start a webserver.
const createApp = require('../../dist/ssr/server/server-entry.js').default

const contextFor = (url, cookie = '') => {
  const callbacks = []
  return {
    req: { url, headers: { cookie, 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' } },
    res: { setHeader() {}, getHeader() {} },
    _meta: { htmlAttrs: '', headTags: '', bodyAttrs: '', bodyTags: '' },
    onRendered: fn => callbacks.push(fn),
    finish: async () => { for (const fn of callbacks) await fn() }
  }
}

test('production SSR outputs the shell and localized preload without catalog requests', async () => {
  const previous = axios.defaults.adapter
  const requests = []
  axios.defaults.adapter = async config => {
    requests.push(config.url)
    // Force overlapping boot/prefetch requests without using a server or network.
    await new Promise(resolve => setImmediate(resolve))
    let data
    if (config.url === '/account/signed') data = {}
    else if (config.url === '/d4/account/storage') data = { ladder: config.headers.Cookie !== 'eternal', hardcore: false }
    else if (config.url === '/account/messages/unread') data = { unread: 0 }
    else throw new Error(`Unexpected live API request: ${config.url}`)
    return { data, status: 200, statusText: 'OK', headers: {}, config }
  }
  try {
    const contexts = [contextFor('/ko'), contextFor('/en'), contextFor('/ko', 'eternal')]
    const apps = await Promise.all(contexts.map(context => createApp(context)))
    assert.notEqual(apps[0].config.globalProperties.$api, apps[1].config.globalProperties.$api)
    assert.equal(apps[0].config.globalProperties.$api.defaults.headers.common['Accept-Language'], 'ko')
    assert.equal(apps[1].config.globalProperties.$api.defaults.headers.common['Accept-Language'], 'en')
    const html = await Promise.all(apps.map((app, i) => renderToString(app, contexts[i])))
    await Promise.all(contexts.map(context => context.finish()))
    for (const body of html) {
      assert.match(body, /bg-season/)
      assert.match(body, /Tradurs Logo Image/)
      assert.match(body, /trade-placeholder/)
      assert.doesNotMatch(body, /q-spinner/)
    }
    assert.match(contexts[0]._meta.headTags, /rel="preload"[^>]*season_emblem_ko.webp[^>]*fetchpriority="high"/)
    assert.match(contexts[1]._meta.headTags, /rel="preload"[^>]*season_emblem_en.webp[^>]*fetchpriority="high"/)
    assert.doesNotMatch(contexts[2]._meta.headTags, /rel="preload"/)
    assert.match(contexts[0]._meta.htmlAttrs, /lang=["']?ko\b/)
    assert.match(contexts[1]._meta.htmlAttrs, /lang=["']?en\b/)
    assert.equal(requests.length, 9)
  } finally {
    axios.defaults.adapter = previous
  }
})
