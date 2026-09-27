import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRenderer, h, ref, computed, nextTick } from 'vue'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { parse } from '@vue/compiler-dom'

const root = fileURLToPath(new URL('../../', import.meta.url))
// Real QDrawer and model-toggle watchers; isolate browser scroll/history effects.
await build({
  entryPoints: [root + 'node_modules/quasar/src/components/drawer/QDrawer.js'],
  outfile: root + 'tests/performance/.generated/drawer.mjs',
  bundle: true, platform: 'node', format: 'esm', external: ['vue'],
  define: { __QUASAR_SSR_SERVER__: 'false' },
  plugins: [{ name: 'drawer-environment', setup(builder) {
    builder.onLoad({ filter: /(?:use-history|use-prevent-scroll|TouchPan|escape-key)\.js$/ }, ({ path }) => ({
      contents: path.endsWith('use-history.js')
        ? 'export default () => ({ addToHistory() {}, removeFromHistory() {} })'
        : path.endsWith('use-prevent-scroll.js')
          ? 'export default () => ({ preventBodyScroll() {} })'
          : path.endsWith('TouchPan.js') ? 'export default {}'
            : 'export function addEscapeKey() {} export function removeEscapeKey() {}'
    }))
  } }]
})
const { default: QDrawer } = await import('./.generated/drawer.mjs')
const node = tag => ({ tag, props: {}, children: [], parent: null })
const renderer = createRenderer({
  createElement: node, createText: text => ({ ...node('#text'), text }),
  createComment: text => ({ ...node('#comment'), text }),
  patchProp: (el, key, before, after) => { el.props[key] = after },
  insert(el, parent, anchor) {
    el.parent = parent
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index < 0) parent.children.push(el)
    else parent.children.splice(index, 0, el)
  },
  remove(el) { const p = el.parent; if (p) p.children.splice(p.children.indexOf(el), 1) },
  setElementText(el, text) { el.text = text }, setText(el, text) { el.text = text },
  parentNode: el => el.parent,
  nextSibling: el => el.parent?.children[el.parent.children.indexOf(el) + 1]
})

function behaviorFromLayout() {
  const template = parseSfc(readFileSync(root + 'src/layouts/MainLayout.vue', 'utf8')).descriptor.template.content
  const layout = parse(template).children.find(n => n.tag === 'q-layout')
  const drawer = layout.children.find(n => n.tag === 'q-drawer')
  const binding = drawer.props.find(p => p.type === 7 && p.arg?.content === 'behavior')
  return binding ? new Function('$q', `return (${binding.exp.content})`) : () => undefined
}

async function scenario(getBehavior) {
  const previous = globalThis.document
  globalThis.document = { qScrollPrevented: true, body: { classList: { add() {}, remove() {} } } }
  const width = ref(0), shown = ref(false)
  const target = node('root')
  const state = {
    instances: {}, isContainer: ref(false), totalWidth: width, scrollbarWidth: ref(0),
    view: ref('hHh lpR lFf'), rows: computed(() => ({ top: ['h', 'h', 'h'], bottom: ['l', 'f', 'f'] })),
    header: { space: true, offset: 66, size: 66 }, footer: {}, animate() {}, update() {}
  }
  const app = renderer.createApp({ render: () => h(QDrawer, {
    modelValue: shown.value, 'onUpdate:modelValue': value => { shown.value = value },
    showIfAbove: true, breakpoint: 1100, behavior: getBehavior({ screen: { width: width.value } }),
    noSwipeOpen: true, noSwipeClose: true, noSwipeBackdrop: true
  }, { default: () => h('div', { class: 'filter' }, 'Loaded filter') }) })
  app.provide('_q_', { dark: { isActive: true }, lang: { rtl: false }, platform: { is: {} } })
  app.provide('_q_l_', state)
  function aside(el = target) { return el.tag === 'aside' ? el : el.children.map(aside).find(Boolean) }
  try {
    app.mount(target)
    await nextTick()
    width.value = 1920 // first layout measurement while the welcome notice locks scroll
    await nextTick()
    const locked = { shown: shown.value, transform: aside().props.style.transform }
    document.qScrollPrevented = false // closing the notice does not change layout width
    await nextTick()
    const closed = shown.value
    width.value = 800
    await nextTick()
    const mobile = shown.value
    width.value = 1920
    await nextTick()
    return { locked, closed, mobile, wideAgain: shown.value }
  } finally {
    app.unmount()
    globalThis.document = previous
  }
}

test('automatic drawer breakpoint can miss the first desktop width under modal scroll lock', async () => {
  const result = await scenario(() => undefined)
  assert.equal(result.locked.shown, false)
  assert.equal(result.closed, false)
})

test('layout filter drawer opens at desktop width even while the initial notice locks scroll', async () => {
  const behavior = behaviorFromLayout()
  for (const width of [0, 375, 1100, 1101, 2560]) {
    assert.equal(behavior({ screen: { width } }), width > 1100 ? 'desktop' : 'mobile')
  }
  const result = await scenario(behavior)
  assert.deepEqual(result, {
    locked: { shown: true, transform: 'translateX(0px)' },
    closed: true, mobile: false, wideAgain: true
  })
})
