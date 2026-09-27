import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { parse } = require('@babel/parser')
const dist = fileURLToPath(new URL('../../dist/ssr/', import.meta.url))

test('home static imports exclude the editor, analysis, filter and OCR engine chunks', () => {
  const dir = path.join(dist, 'client/assets')
  const entry = readdirSync(dir).find(name => /^IndexPage\..*\.js$/.test(name))
  assert.ok(entry, 'build SSR before running performance tests')
  const visited = new Set()
  function visit(name) {
    if (visited.has(name)) return
    visited.add(name)
    const nodes = parse(readFileSync(path.join(dir, name), 'utf8'), { sourceType: 'module' }).program.body
    for (const node of nodes) {
      const source = node.source?.value
      if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) &&
          source?.startsWith('./') && source.endsWith('.js')) visit(source.slice(2))
    }
  }
  visit(entry)
  assert.deepEqual([...visited].filter(name => /^(D4Item\.|D4Analysis\.|D4Filter\.|paddle\.|cropper\.)/.test(name)), [])
  assert.ok([...visited].some(name => /^D4ItemDisplay\./.test(name)))
})

test('deployable output includes the viewport, public guide and missing-manifest handler', () => {
  const template = readFileSync(path.join(dist, 'render-template.js'), 'utf8')
  assert.doesNotMatch(template, /user-scalable=no|maximum-scale=1/)
  assert.match(template, /preconnect/)
  assert.match(readFileSync(path.join(dist, 'client/llms.txt'), 'utf8'), /^# Tradurs/m)
  const server = readFileSync(path.join(dist, 'index.js'), 'utf8')
  assert.match(server, /ai-catalog\.json/)
  assert.ok(existsSync(path.join(dist, 'server/server-entry.js')))
})
