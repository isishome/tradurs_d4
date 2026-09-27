// Temporary HTML conformance fixes for the pinned Quasar version. Applied to
// source in BOTH client and SSR builds; never rewrite rendered HTML or the DOM.
const fs = require('node:fs')
const path = require('node:path')

const patches = {
  'components/item/QItem.js': [[
    "tabindex: -1,\n            ref: blurTargetRef",
    "'aria-hidden': 'true'"
  ]],
  'components/icon/QIcon.js': [[
    "h('img', { src: type.src })",
    "h('img', { src: type.src, alt: '' })"
  ]],
  'components/input/QInput.js': [[
    'const state = useFieldState({ changeEvent: true })',
    `const state = useFieldState({ changeEvent: true })
    // The native input keeps its aria-label and all QInput editing behavior.
    state.tag = { value: 'div' }
    state.htmlInput = true`
  ]],
  'composables/private.use-field/use-field.js': [[
    'if (state.targetUid.value) {',
    "if (state.targetUid.value && state.tag.value === 'label') {"
  ], [
    'style: attrs.style,\n        ...labelAttrs',
    `style: attrs.style,
        // Preserve the former label's blank-area click-to-focus behavior,
        // without stealing focus from append/prepend buttons or links.
        onClick: state.htmlInput ? e => {
          if (!props.disable && !e.defaultPrevented &&
              !e.target.closest('input, textarea, button, a, label, [role="button"], [tabindex]:not(.q-field__control)')) {
            focus()
          }
        } : void 0,
        ...labelAttrs`
  ]]
}

function patchSource(source, file) {
  let code = source.replace(/\r\n/g, '\n')
  for (const [before, after] of patches[file] || []) {
    if (code.split(before).length !== 2) {
      throw new Error(`Review Quasar HTML fix: unexpected source in ${file}`)
    }
    code = code.replace(before, after)
  }
  return code
}

function quasarHtml() {
  const root = path.dirname(require.resolve('quasar/package.json'))
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version
  const imports = JSON.parse(fs.readFileSync(path.join(root, 'dist/transforms/import-map.json'), 'utf8'))
  const transformed = new Set()
  let server = false
  return {
    name: 'tradurs-quasar-html',
    // Quasar CLI does not tree-shake SSR imports. Run after Vue/Quasar's
    // transforms so SSR and development also use the same patched source.
    enforce: 'post',
    configResolved(config) {
      server = config.define.__QUASAR_SSR_SERVER__ === true
    },
    buildStart() {
      transformed.clear()
      if (version !== '2.27.0') throw new Error('Review Quasar HTML fixes before upgrading Quasar')
      for (const file of Object.keys(patches)) {
        patchSource(fs.readFileSync(path.join(root, 'src', file), 'utf8'), file)
      }
    },
    generateBundle() {
      for (const file of Object.keys(patches)) {
        if (!transformed.has(file)) throw new Error(`Quasar HTML fix missing from build: ${file}`)
      }
    },
    transform(source, id) {
      // Vite dev appends dependency versions (?v=...) and HMR timestamps.
      // Match the pathname so the client receives the same fixes as SSR.
      const file = id.replace(/\\/g, '/').split(/[?#]/, 1)[0].split('/quasar/src/')[1]
      if (patches[file]) {
        transformed.add(file)
        return { code: patchSource(source, file), map: null }
      }
      // SSR relies on Quasar's server entry to register ALL components and
      // directives globally; the client vue-plugin entry does not do this.
      if (server) {
        const code = source.replace(/from\s*(['"])quasar\1/g, "from 'quasar/src/index.ssr.js'")
        return code === source ? null : { code, map: null }
      }
      const code = source.replace(/import\s*\{([\w,\s]+)\}\s*from\s*(['"])quasar\2;?/g,
        (_, names) => names.split(',').filter(name => name.trim()).map(name => {
          const [key, alias] = name.trim().split(/\s+as\s+/)
          if (!imports[key]) throw new Error(`Unknown Quasar import: ${key}`)
          return `import ${alias || key} from 'quasar/${imports[key]}';`
        }).join('\n'))
      return code === source ? null : { code, map: null }
    }
  }
}

module.exports = { quasarHtml, patchSource, patches }
