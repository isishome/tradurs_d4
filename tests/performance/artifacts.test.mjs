import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { parse } = require('@babel/parser')
const postcss = require('postcss')
const dist = fileURLToPath(new URL('../../dist/ssr/', import.meta.url))

test('initial CSS reserves drawer space at the header breakpoint and includes the placeholder', () => {
  const dir = path.join(dist, 'client/assets')
  const files = readdirSync(dir)
  const entry = files.find(name => /^index\..*\.css$/.test(name))
  const css = readFileSync(path.join(dir, entry), 'utf8')
  assert.ok(readFileSync(path.join(dist, 'render-template.js'), 'utf8').includes(entry))
  assert.equal(files.some(name => /^TradePlaceholder\..*\.css$/.test(name)), false)
  const tree = postcss.parse(css)
  function valueAt(selector, property, width) {
    let result
    tree.walkRules(rule => {
      if (rule.selector !== selector) return
      for (let parent = rule.parent; parent; parent = parent.parent) {
        if (parent.type !== 'atrule' || parent.name !== 'media') continue
        for (const match of parent.params.matchAll(/(min|max)-width:\s*(\d+)px/g)) {
          if (match[1] === 'min' ? width < +match[2] : width > +match[2]) return
        }
      }
      rule.walkDecls(property, declaration => { result = declaration.value })
    })
    return result
  }
  for (const width of [375, 599, 600, 1024, 1100, 1101, 1350, 1920]) {
    assert.equal(valueAt('.trade-page-container', 'padding-left', width), width > 1100 ? '300px' : '0')
    assert.equal(valueAt('.tradurs-header .header-wide', 'display', width), width > 1100 ? 'flex' : 'none')
    assert.equal(valueAt('.q-header.tradurs-header', 'min-height', width), '66px')
    assert.equal(valueAt('.trade-placeholder .placeholder-card', 'height', width), width < 600 ? '170px' : '220px')
  }
})

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
