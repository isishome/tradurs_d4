import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const path = (relative) => new URL(relative, import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1')
await build({
  entryPoints: [path('../../src/common/consent.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  define: { 'import.meta.env.PROD': 'false' },
  outfile: path('./.generated/consent.mjs')
})
const { CONSENT_COOKIE, cookieDomain, parseConsent, readConsentFrom, consentCookie, analyticsCookieRemovals } = await import(
  './.generated/consent.mjs'
)

test('the choice is shared across tradurs.com and host-only elsewhere', () => {
  assert.equal(cookieDomain('tradurs.com'), 'tradurs.com')
  assert.equal(cookieDomain('d4.tradurs.com'), 'tradurs.com')
  assert.equal(cookieDomain('localhost'), undefined)
  assert.equal(cookieDomain('eviltradurs.com'), undefined)
})

test('only the current version in the agreed format counts as a choice', () => {
  assert.deepEqual(parseConsent('v=1&analytics=1&at=2026-10-20'), { analytics: true, at: '2026-10-20' })
  assert.deepEqual(parseConsent('v=1&analytics=0&at=2026-10-20&ads=1'), { analytics: false, at: '2026-10-20' })
  assert.equal(parseConsent('v=2&analytics=1&at=2026-10-20'), null)
  assert.equal(parseConsent('v=1&analytics=1'), null)
  assert.equal(parseConsent(undefined), null)
})

test('the saved cookie matches the Account site format and is read back', () => {
  const cookie = consentCookie(true, '2026-10-20', { hostname: 'd4.tradurs.com', protocol: 'https:' })
  assert.equal(
    cookie,
    `${CONSENT_COOKIE}=v%3D1%26analytics%3D1%26at%3D2026-10-20; Path=/; Max-Age=15552000; SameSite=Lax; Domain=tradurs.com; Secure`
  )
  assert.deepEqual(readConsentFrom(`theme=dark; ${cookie.split(';')[0]}`), { analytics: true, at: '2026-10-20' })
  assert.equal(
    consentCookie(false, '2026-10-20', { hostname: 'localhost', protocol: 'http:' }),
    `${CONSENT_COOKIE}=v%3D1%26analytics%3D0%26at%3D2026-10-20; Path=/; Max-Age=15552000; SameSite=Lax`
  )
  assert.equal(readConsentFrom('theme=dark'), null)
})

test('declining analytics removes only Google Analytics cookies on the host and the shared domain', () => {
  assert.deepEqual(analyticsCookieRemovals('_ga=GA1; _ga_S8LQ=GS1; d4.dark=true', 'd4.tradurs.com'), [
    '_ga=; Path=/; Max-Age=0',
    '_ga=; Path=/; Max-Age=0; Domain=tradurs.com',
    '_ga_S8LQ=; Path=/; Max-Age=0',
    '_ga_S8LQ=; Path=/; Max-Age=0; Domain=tradurs.com'
  ])
  assert.deepEqual(analyticsCookieRemovals('_ga=GA1', 'localhost'), ['_ga=; Path=/; Max-Age=0'])
})
