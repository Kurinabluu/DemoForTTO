const SITE_NAME = 'TasTrips.Online'
const DEFAULT_TITLE = `${SITE_NAME}-塔州旅行在线一站式平台`
const DEFAULT_DESCRIPTION = '塔斯马尼亚旅行有限公司（TASMANIA TRIPS PTY LTD）运营的塔州旅行服务平台，提供一日游、多日游、包车、地陪、行程管家、专属定制及自助游参考信息。服务区域为塔斯马尼亚。'
const FAQ_SCRIPT_ID = 'tto-faq-jsonld'
export const ENTITY_JSONLD_ID = 'tto-entity-jsonld'
export const BREADCRUMB_JSONLD_ID = 'tto-breadcrumb-jsonld'
export const ORG_JSONLD_ID = 'tto-org-jsonld'
export const SITE_JSONLD_ID = 'tto-site-jsonld'

export function getSiteOrigin() {
  const fromEnv = String(import.meta.env.VITE_SITE_ORIGIN || '').trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

export function getAppBasePath() {
  const base = String(import.meta.env.BASE_URL || '/')
  return base.endsWith('/') ? base : `${base}/`
}

export function toAbsoluteUrl(pathOrUrl = '') {
  const value = String(pathOrUrl || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('//')) {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:'
    return `${protocol}${value}`
  }
  const origin = getSiteOrigin()
  const base = getAppBasePath()
  let path = value.startsWith('/') ? value : `/${value}`
  if (path !== base && path !== base.slice(0, -1) && !path.startsWith(base)) {
    path = `${base}${path.replace(/^\//, '')}`
  }
  const href = origin ? `${origin}${path}` : path
  return href.replace(/([^:]\/)\/+/g, '$1')
}

export function toAbsoluteAssetUrl(src = '') {
  const value = String(src || '').trim()
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) {
    return getDefaultOgImageUrl()
  }
  return toAbsoluteUrl(value) || getDefaultOgImageUrl()
}

export function getCanonicalUrl() {
  if (typeof window === 'undefined') return ''
  return `${getSiteOrigin()}${window.location.pathname}`
}

export function getDefaultOgImageUrl() {
  const origin = getSiteOrigin()
  const base = getAppBasePath()
  if (!origin) return `${base}og-default.png`
  return `${origin}${base}og-default.png`.replace(/([^:]\/)\/+/g, '$1')
}

function upsertMeta(attr, key, content) {
  if (typeof document === 'undefined') return
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content || '')
}

function applyCanonical(href) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href || '')
}

export function applyPageSeo({ title = '', description = '', image = '' } = {}) {
  const pageTitle = String(title || '').trim()
  const fullTitle = pageTitle
    ? (pageTitle.includes(SITE_NAME) ? pageTitle : `${pageTitle} | ${SITE_NAME}`)
    : DEFAULT_TITLE
  const desc = String(description || DEFAULT_DESCRIPTION).trim().slice(0, 220)
  const canonical = getCanonicalUrl()
  const ogImage = image ? toAbsoluteAssetUrl(image) : getDefaultOgImageUrl()
  document.title = fullTitle
  upsertMeta('name', 'description', desc)
  upsertMeta('property', 'og:title', fullTitle)
  upsertMeta('property', 'og:description', desc)
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:locale', 'zh_CN')
  if (canonical) upsertMeta('property', 'og:url', canonical)
  if (ogImage) {
    upsertMeta('property', 'og:image', ogImage)
    upsertMeta('name', 'twitter:image', ogImage)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
  } else {
    upsertMeta('name', 'twitter:card', 'summary')
  }
  upsertMeta('name', 'twitter:title', fullTitle)
  upsertMeta('name', 'twitter:description', desc)
  applyCanonical(canonical)
}

export function applyJsonLd(id, data) {
  if (typeof document === 'undefined') return
  removeJsonLd(id)
  if (!id || !data || typeof data !== 'object') return
  const el = document.createElement('script')
  el.id = id
  el.type = 'application/ld+json'
  el.textContent = JSON.stringify(data)
  document.head.appendChild(el)
}

export function removeJsonLd(id) {
  if (typeof document === 'undefined' || !id) return
  document.getElementById(id)?.remove()
}

export function applyFaqJsonLd(faqs) {
  if (typeof document === 'undefined') return
  removeFaqJsonLd()
  const list = (Array.isArray(faqs) ? faqs : [])
    .map((row) => ({
      q: String(row?.q || '').trim(),
      a: String(row?.a || '').trim(),
    }))
    .filter((row) => row.q && row.a)
  if (!list.length) return
  applyJsonLd(FAQ_SCRIPT_ID, {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map((row) => ({
      '@type': 'Question',
      name: row.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: row.a,
      },
    })),
  })
}

export function applyBreadcrumbJsonLd(items) {
  const list = (Array.isArray(items) ? items : [])
    .map((row) => ({
      name: String(row?.name || '').trim(),
      url: toAbsoluteUrl(row?.url || row?.path || ''),
    }))
    .filter((row) => row.name && row.url)
  if (!list.length) {
    removeJsonLd(BREADCRUMB_JSONLD_ID)
    return
  }
  applyJsonLd(BREADCRUMB_JSONLD_ID, {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list.map((row, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: row.name,
      item: row.url,
    })),
  })
}

export function removeFaqJsonLd() {
  removeJsonLd(FAQ_SCRIPT_ID)
}

export function clearStructuredData() {
  removeFaqJsonLd()
  removeJsonLd(ENTITY_JSONLD_ID)
  removeJsonLd(BREADCRUMB_JSONLD_ID)
  removeJsonLd(ORG_JSONLD_ID)
}

export function resetPageSeo() {
  applyPageSeo({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION })
  clearStructuredData()
}

export { DEFAULT_TITLE, DEFAULT_DESCRIPTION, SITE_NAME }
