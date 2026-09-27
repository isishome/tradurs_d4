import { access } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const required = [
  'src-ssr/server.ts',
  'src-ssr/critical-css.ts',
  'src-ssr/ssr-flag.d.ts',
  'src-ssr/middlewares/render.ts',
  'src-ssr/middlewares/resource-status.ts'
]
const included = new Set(execFileSync('git', [
  '-c', 'core.excludesFile=', 'ls-files', '--cached', '--others', '--exclude-standard',
  '--', ...required
], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/))
for (const file of required) {
  await access(new URL(`../${file}`, import.meta.url))
  if (!included.has(file)) throw new Error(`${file} is ignored and will be absent from a clean checkout`)
}
console.log(`SSR source: all ${required.length} required files exist and are eligible for version control.`)
