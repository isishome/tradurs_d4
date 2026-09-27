import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { build } from 'esbuild'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'

const require = createRequire(import.meta.url)
const { quasarHtml, patchSource, patches } = require('../../scripts/quasar-html.cjs')
const root = fileURLToPath(new URL('../../', import.meta.url))
const plugin = quasarHtml()
plugin.configResolved({ define: { __QUASAR_SSR_SERVER__: true } })
plugin.buildStart()
await build({
  stdin: {
    contents: `import { Quasar, QItem, QIcon, QInput, QBtn, QExpansionItem } from 'quasar';
      export { Quasar, QItem, QIcon, QInput, QBtn, QExpansionItem };`,
    resolveDir: root
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['vue'],
  outfile: path.join(root, 'tests/performance/.generated/html.mjs'),
  define: {
    __QUASAR_VERSION__: '"2.27.0"', __QUASAR_SSR__: 'true',
    __QUASAR_SSR_SERVER__: 'true', __QUASAR_SSR_CLIENT__: 'false',
    __QUASAR_SSR_PWA__: 'false', 'process.env.NODE_ENV': '"production"'
  },
  plugins: [{ name: 'quasar-html', setup(builder) {
    builder.onLoad({ filter: /quasar[\\/]src[\\/].*\.js$/ }, args => {
      const code = readFileSync(args.path, 'utf8')
      return { contents: plugin.transform(code, args.path)?.code || code, loader: 'js' }
    })
    builder.onResolve({ filter: /^quasar$/ }, () => ({ path: 'quasar-imports', namespace: 'fixture' }))
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
      contents: plugin.transform(`import { Quasar, QItem, QIcon, QInput, QBtn, QExpansionItem } from 'quasar';
        export { Quasar, QItem, QIcon, QInput, QBtn, QExpansionItem };`, 'fixture.js').code,
      resolveDir: root
    }))
  } }]
})
const { Quasar, QItem, QIcon, QInput, QBtn, QExpansionItem } = await import('./.generated/html.mjs')

async function render(component, props, slots) {
  const context = { req: { headers: {} } }
  const app = createSSRApp({ render: () => h(component, props, slots) })
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: {} }] })
  app.use(router)
  await router.push('/')
  app.use(Quasar, {}, context)
  return renderToString(app, context)
}

test('Quasar links and expansion keep parent keyboard focus without nested tabindex', async () => {
  for (const props of [{ href: 'https://example.com', target: '_blank' }, { to: '/' }, { clickable: true }]) {
    const html = await render(QItem, props, { default: () => 'Link' })
    assert.match(html, /tabindex="0"/)
    assert.match(html, /class="q-focus-helper" aria-hidden="true"/)
    assert.doesNotMatch(html, /q-focus-helper[^>]*tabindex/)
    if (props.href || props.to) assert.match(html, /^<a\b[^>]*href=/)
    else assert.match(html, /role="button"/)
  }
  const expanded = await render(QExpansionItem, { label: 'Knowledge', expandIcon: 'img:/images/icons/dropdown.svg' })
  assert.doesNotMatch(expanded, /q-focus-helper[^>]*tabindex/)
  assert.match(expanded, /<img[^>]* alt(?:="")?>/)
})

test('decorative Quasar image icons have empty alt', async () => {
  assert.match(await render(QIcon, { name: 'img:/images/icons/close.svg' }), /<img src="\/images\/icons\/close.svg" alt(?:="")?>/)
})

test('input and clear button are not nested in a label; native control retains accessible name and disabled state', async () => {
  for (const disable of [false, true]) {
    const html = await render(QInput, { for: 'search', label: 'Item name', modelValue: '검', disable }, {
      append: () => h(QBtn, { 'aria-label': 'Clear', disable })
    })
    assert.match(html, /^<div\b/)
    assert.doesNotMatch(html, /<label|<div[^>]*\bfor=/)
    assert.match(html, /<input[^>]*aria-label="Item name"[^>]*id="search"/)
    assert.match(html, /<button[^>]*aria-label="Clear"/)
    assert.equal(/<input[^>]* disabled/.test(html), disable)
  }
})

test('dependency drift fails rather than silently dropping a fix', () => {
  assert.throws(() => patchSource('changed upstream', 'components/item/QItem.js'), /Review Quasar HTML fix/)
})

test('development versioned module IDs receive the same HTML fixes as SSR', () => {
  const client = quasarHtml()
  client.configResolved({ define: { __QUASAR_SSR_SERVER__: false } })
  client.buildStart()
  for (const file of Object.keys(patches)) {
    const id = require.resolve(`quasar/src/${file}`)
    const source = readFileSync(id, 'utf8')
    const expected = plugin.transform(source, id)?.code
    for (const suffix of ['?v=1d7be18c', '?v=1d7be18c&t=123', '?import', '#fragment']) {
      assert.equal(client.transform(source, id + suffix)?.code, expected, file + suffix)
    }
  }
  client.generateBundle()
})
