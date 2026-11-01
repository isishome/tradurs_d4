import test from 'node:test'
import assert from 'node:assert/strict'
import { renderMiddleware } from './.generated/loaders.mjs'

test('SSR middleware preserves Quasar 3 redirects, not-found responses and private production errors', async () => {
  for (const [error, status, body] of [
    [{ redirectUrl: '/en', redirectHttpStatusCode: 302 }, 302, '/en'],
    [{ routeNotFound: true }, 404, '404 | Page Not Found'],
    [new Error('private server detail'), 500, '500 | Internal Server Error']
  ]) {
    let handler
    renderMiddleware({
      app: { get(route, callback) { assert.equal(route, '*'); handler = callback } },
      resolve: { urlPath: path => path },
      render: async () => { throw error },
      serve: {}
    })
    const response = {
      statusCode: 200,
      setHeader() {},
      status(code) { this.statusCode = code; return this },
      send(value) { this.body = value },
      redirect(code, value) { this.statusCode = code; this.body = value }
    }
    await handler({}, response)
    assert.equal(response.statusCode, status)
    assert.equal(response.body, body)
  }
})
