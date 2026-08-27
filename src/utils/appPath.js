const LEGACY_PREFIX = '/DemoForTTO'

function readBasePrefix() {
  const raw = typeof import.meta !== 'undefined' ? (import.meta.env?.BASE_URL || '/') : '/'
  const trimmed = String(raw).replace(/\/$/, '')
  return trimmed === '' ? '' : trimmed
}

export function isSiteRootPath(path) {
  const value = String(path || '').split('?')[0]
  return value === '/' || value === '' || value === '/index.html'
}

export function isSearchEngineReferrer() {
  if (typeof document === 'undefined') return false
  const referrer = document.referrer || ''
  if (!referrer) return false
  try {
    const host = new URL(referrer).hostname
    return /(^|\.)(google|bing|baidu|yahoo|duckduckgo)\./i.test(host)
  } catch {
    return false
  }
}

/** 把历史 /DemoForTTO 前缀和 BASE_URL 收成 Vue Router 使用的 path+query。 */
export function normalizeAppPath(raw) {
  if (!raw || typeof raw !== 'string') return ''
  let value = raw.split('#')[0].trim()
  if (!value) return ''

  try {
    if (/^https?:\/\//i.test(value)) {
      const absolute = new URL(value)
      value = `${absolute.pathname}${absolute.search}`
    }
  } catch {
    // keep value
  }

  const base = readBasePrefix()
  if (base && value === base) {
    value = '/'
  } else if (base && value.startsWith(`${base}/`)) {
    value = value.slice(base.length)
  }

  if (value === LEGACY_PREFIX) {
    value = '/'
  } else if (value.startsWith(`${LEGACY_PREFIX}/`)) {
    value = value.slice(LEGACY_PREFIX.length)
  }

  if (!value.startsWith('/')) {
    value = `/${value}`
  }

  try {
    const parsed = new URL(value, 'http://tto.local')
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return value
  }
}

export function isRestorableAppPath(raw) {
  const value = normalizeAppPath(raw)
  if (!value) return false
  const pathname = value.split('?')[0]
  if (isSiteRootPath(pathname)) return false
  return /^\/(trips|favorites|service|search|info|about|privacy|terms|refund)(\/|$)/.test(pathname)
}

export function isContentDetailPath(raw) {
  const pathname = normalizeAppPath(raw).split('?')[0]
  return pathname === '/info' || pathname.startsWith('/info/')
}

export function isFavoritesPath(raw) {
  const pathname = normalizeAppPath(raw).split('?')[0]
  return pathname === '/favorites' || pathname.startsWith('/favorites/')
}

export function isCompanyPagePath(raw) {
  const pathname = normalizeAppPath(raw).split('?')[0]
  return pathname === '/about'
    || pathname === '/privacy'
    || pathname === '/terms'
    || pathname === '/refund'
}

export function shouldPinScrollToTop(raw) {
  return isContentDetailPath(raw) || isFavoritesPath(raw) || isCompanyPagePath(raw)
}
