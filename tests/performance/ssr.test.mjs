import test from 'node:test'
import assert from 'node:assert/strict'
import axios from 'axios'
import { renderToString } from 'vue/server-renderer'
import { parse } from '@vue/compiler-dom'
import { resolveMessages, koMessages, enMessages } from './.generated/loaders.mjs'

// Import only the renderer factory. Never import index.js/start a webserver.
const createApp = (await import('../../dist/ssr/server/server-entry.js')).default

// Inspect the original SSR tree, before a browser can repair invalid nesting.
function assertValidShell(html) {
  const attr = (node, name) => node.props?.find(prop => prop.name === name)
  const blocks = new Set(['div', 'h1', 'h2', 'h3', 'p', 'section', 'ul', 'ol'])
  function visit(node, parents = []) {
    if (node.type === 1) {
      assert.equal(node.tag === 'a' && !!attr(node, 'tag'), false, 'invalid anchor tag attribute')
      if (node.tag === 'img') assert.ok(attr(node, 'alt'), 'img needs alt')
      if (attr(node, 'tabindex')) {
        assert.equal(parents.some(p => p.tag === 'a' || attr(p, 'role')?.value?.content === 'button'), false,
          'focusable descendant of link/button role')
      }
      if (blocks.has(node.tag)) {
        assert.equal(parents.some(p => ['span', 'label', 'button'].includes(p.tag)), false,
          `${node.tag} inside phrasing content`)
      }
      parents = [...parents, node]
    }
    for (const child of node.children || []) visit(child, parents)
  }
  visit(parse(html))
}

const contextFor = (url, cookie = '', desktop = false) => {
  const callbacks = []
  return {
    req: { url, headers: { cookie, 'user-agent': desktop ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36' : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' } },
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
    const contexts = [contextFor('/ko'), contextFor('/en'), contextFor('/ko', 'eternal'), contextFor('/ko', '', true), contextFor('/')]
    const apps = await Promise.all(contexts.map(context => createApp(context)))
    assert.notEqual(apps[0].config.globalProperties.$api, apps[1].config.globalProperties.$api)
    assert.equal(apps[0].config.globalProperties.$api.defaults.headers.common['Accept-Language'], 'ko')
    assert.equal(apps[1].config.globalProperties.$api.defaults.headers.common['Accept-Language'], 'en')
    const html = await Promise.all(apps.map((app, i) => renderToString(app, contexts[i])))
    // App/MainLayout select the route locale during setup, i.e. while rendering.
    assert.equal(apps[0].config.globalProperties.$t('item.unknown'), '알 수 없는 아이템')
    assert.equal(apps[1].config.globalProperties.$t('item.unknown'), 'Unknown Item')
    assert.equal(apps[0].config.globalProperties.$n(12000, 'goldCompact'), '1.2만')
    assert.equal(apps[1].config.globalProperties.$n(12000, 'goldCompact'), '12K')
    for (const [index, source] of [[0, koMessages], [1, enMessages], [4, koMessages]]) {
      const gp = apps[index].config.globalProperties
      for (const [key, expected] of [
        ['notice.contents', source.notice.contents],
        ['support', source.support],
        ['sort.options', source.sort.options]
      ]) {
        const raw = gp.$tm(key)
        const before = JSON.stringify(raw)
        const resolved = resolveMessages(raw, key === 'support' ? message => gp.$rt(message, { x: '{x}' }) : gp.$rt)
        assert.deepEqual(resolved, expected, `${contexts[index].req.url}: ${key}`)
        assert.equal(JSON.stringify(raw), before, 'resolution must not mutate locale resources')
      }
    }
    await Promise.all(contexts.map(context => context.finish()))
    for (const body of html) {
      assertValidShell(body)
      assert.match(body, /bg-season/)
      assert.match(body, /Tradurs Logo Image/)
      assert.match(body, /trade-placeholder/)
      assert.match(body, /class="[^"]*trade-page-container[^"]*"[^>]*style="[^"]*padding-top:66px/)
      assert.match(body, /header-wide/)
      assert.match(body, /header-narrow/)
      assert.doesNotMatch(body, /class="[^"]*header-(?:wide|narrow)[^"]*"[^>]*style="[^"]*display:none/)
      assert.doesNotMatch(body, /q-spinner/)
    }
    assert.match(contexts[0]._meta.headTags, /rel="preload"[^>]*season_emblem_ko.webp[^>]*fetchpriority="high"/)
    assert.match(contexts[1]._meta.headTags, /rel="preload"[^>]*season_emblem_en.webp[^>]*fetchpriority="high"/)
    assert.doesNotMatch(contexts[2]._meta.headTags, /rel="preload"/)
    assert.match(contexts[0]._meta.htmlAttrs, /lang=["']?ko\b/)
    assert.match(contexts[1]._meta.htmlAttrs, /lang=["']?en\b/)
    assert.match(html[3], /<button[^>]*aria-label="지식"/)
    assert.doesNotMatch(html[3], /<button[^>]*aria-label="Expand"/)
    assert.equal(requests.length, 15)
  } finally {
    axios.defaults.adapter = previous
  }
})
