import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))

// Node flags from the production image, e.g. ["--experimental-global-webcrypto", ...].
function productionNodeFlags() {
  const dockerfile = readFileSync(path.join(root, 'Dockerfile'), 'utf8')
  const entrypoint = dockerfile.match(/^ENTRYPOINT\s+(\[.*\])\s*$/m)
  assert.ok(entrypoint, 'Dockerfile needs an exec-form ENTRYPOINT')
  const args = JSON.parse(entrypoint[1])
  assert.equal(args[0], 'node')
  return args.slice(1, -1)
}

// The item detail page creates `new Item()` (Quasar uid()) in preFetch. Render it in a child
// process with the production flags so CI on the production Node version catches a missing
// Web Crypto global (2026-10-26: every /item/:id refresh returned 500 on node:18-alpine).
const renderItemPage = `
const { createRequire } = require('node:module')
const rootRequire = createRequire(${JSON.stringify(path.join(root, 'package.json'))})
const axios = rootRequire('axios')
const { renderToString } = rootRequire('vue/server-renderer')
const createApp = require(${JSON.stringify(path.join(root, 'dist/ssr/server/server-entry.js'))}).default
axios.defaults.adapter = async config => {
  let data
  if (config.url === '/account/signed') data = {}
  else if (config.url === '/d4/account/storage') data = { ladder: true, hardcore: false }
  else if (config.url === '/account/messages/unread') data = { unread: 0 }
  else if (config.url === '/d4/item') data = []
  else if (/^\\/d4\\/item\\/\\d+\\/related$/.test(config.url)) data = { sellerItems: [], similarItems: [] }
  else throw new Error('Unexpected live API request: ' + config.url)
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}
const context = {
  req: { url: '/ko/item/1', headers: { cookie: '', 'user-agent': 'Mozilla/5.0' } },
  res: { setHeader() {}, getHeader() {} },
  _meta: { htmlAttrs: '', headTags: '', bodyAttrs: '', bodyTags: '' },
  onRendered() {}
}
createApp(context)
  .then(app => renderToString(app, context))
  .then(html => { process.stdout.write('RENDERED ' + html.length); process.exit(0) })
  .catch(error => { process.stderr.write(String(error && error.stack || error)); process.exit(1) })
`

test('item detail SSR renders with the production Node flags', () => {
  // Run a file, not `node -e`: eval mode exposes the crypto module as a global and hides the bug.
  const script = path.join(root, 'tests/performance/.generated/render-item-page.cjs')
  mkdirSync(path.dirname(script), { recursive: true })
  writeFileSync(script, renderItemPage)
  const result = spawnSync(process.execPath, [...productionNodeFlags(), script], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60000
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /^RENDERED \d+/)
})
