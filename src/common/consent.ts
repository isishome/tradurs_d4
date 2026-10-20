/**
 * Tradurs 공통 쿠키 동의(`tradurs_consent`). 규격 원본: front_v2 docs/plans/task-csj-015-cookie-consent.md 8장.
 * - tradurs.com과 하위 서비스가 같은 선택을 쓴다(`Domain=tradurs.com`, 로컬은 host 전용).
 * - 동의 항목은 분석 하나다. 광고(AdSense)는 쿠키 선택과 관계없이 제공한다(2026-10-20 사용자 결정).
 */
export const CONSENT_COOKIE = 'tradurs_consent'
/** 동의 항목이 바뀌면 올린다. 저장된 버전이 다르면 다시 묻는다. */
export const CONSENT_VERSION = 1
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180
const SHARED_DOMAIN = 'tradurs.com'
const GA_MEASUREMENT_ID = 'G-S8LQETJ7W1'

export interface Consent {
  analytics: boolean
  /** 동의한 날짜(YYYY-MM-DD). */
  at: string
}

/** tradurs.com과 그 하위 주소에서는 공통 도메인, 그 밖(localhost 등)에서는 host 전용. */
export const cookieDomain = (hostname: string): string | undefined =>
  hostname === SHARED_DOMAIN || hostname.endsWith(`.${SHARED_DOMAIN}`)
    ? SHARED_DOMAIN
    : undefined

/** 쿠키 값(`v=1&analytics=1&at=…`)을 해석한다. 버전이 다르거나 형식이 틀리면 선택하지 않은 것으로 본다. */
export const parseConsent = (value: string | undefined): Consent | null => {
  if (!value) return null
  const params = new URLSearchParams(value)
  if (params.get('v') !== String(CONSENT_VERSION)) return null
  const at = params.get('at') ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(at)) return null
  return { analytics: params.get('analytics') === '1', at }
}

/** `document.cookie` 문자열에서 동의 값을 읽는다. */
export const readConsentFrom = (cookies: string): Consent | null => {
  const entry = cookies
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`))
  if (!entry) return null
  try {
    return parseConsent(decodeURIComponent(entry.slice(CONSENT_COOKIE.length + 1)))
  } catch {
    return null
  }
}

/** 저장할 쿠키 문자열(값 + 속성). */
export const consentCookie = (
  analytics: boolean,
  at: string,
  location: { hostname: string; protocol: string }
): string => {
  const value = new URLSearchParams({
    v: String(CONSENT_VERSION),
    analytics: analytics ? '1' : '0',
    at
  }).toString()
  const domain = cookieDomain(location.hostname)
  return [
    `${CONSENT_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
    'SameSite=Lax',
    domain ? `Domain=${domain}` : '',
    location.protocol === 'https:' ? 'Secure' : ''
  ]
    .filter(Boolean)
    .join('; ')
}

/** Google Analytics 쿠키(`_ga`, `_ga_<ID>`)를 지우는 쿠키 문자열들. GA는 최상위 도메인에 두므로 host 전용과 공통 도메인 둘 다 지운다. */
export const analyticsCookieRemovals = (cookies: string, hostname: string): string[] => {
  const domain = cookieDomain(hostname)
  return cookies
    .split(';')
    .map((part) => part.trim().split('=')[0])
    .filter((name) => name === '_ga' || name.startsWith('_ga_'))
    .flatMap((name) => [
      `${name}=; Path=/; Max-Age=0`,
      ...(domain ? [`${name}=; Path=/; Max-Age=0; Domain=${domain}`] : [])
    ])
}

// 아래는 브라우저 전용. 서버 렌더링 중에는 부르지 않는다.

export const readConsent = (): Consent | null => {
  try {
    return readConsentFrom(document.cookie)
  } catch {
    return null
  }
}

/** 선택을 저장한다. 분석을 끄면 이미 저장된 GA 쿠키도 지운다(Google 도메인의 쿠키는 지울 수 없다). */
export const saveConsent = (analytics: boolean): Consent => {
  const consent = { analytics, at: new Date().toISOString().slice(0, 10) }
  try {
    document.cookie = consentCookie(analytics, consent.at, window.location)
    if (!analytics)
      for (const removal of analyticsCookieRemovals(document.cookie, window.location.hostname))
        document.cookie = removal
  } catch {
    // 쿠키를 막은 브라우저에서는 저장하지 못한다. 다음 방문에 다시 묻는다.
  }
  return consent
}

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }

/** 분석에 동의한 경우에만 부른다. 운영 빌드에서 한 번만 GA 스크립트를 넣는다(이전에는 index.html에 정적으로 있었다). */
export const loadGoogleAnalytics = (): void => {
  const w = window as GtagWindow
  if (!import.meta.env.PROD || w.gtag) return
  w.dataLayer = w.dataLayer || []
  // gtag.js는 arguments 객체를 그대로 받아야 하므로 공식 코드 조각과 같은 형태를 쓴다.
  w.gtag = function gtag() {
    w.dataLayer?.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', GA_MEASUREMENT_ID)
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
}
