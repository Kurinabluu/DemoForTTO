const DEFAULT_BASE = '/api'
let tokenRefreshHandler = null

function apiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, '')
}

function buildUrl(path, params) {
  const base = apiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${normalizedPath}`
  if (!params || !Object.keys(params).length) return url
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })
  const query = search.toString()
  return query ? `${url}?${query}` : url
}

function buildHeaders(token, withJsonBody = false) {
  const headers = { Accept: 'application/json' }
  if (withJsonBody) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.token = token
  }
  return headers
}

async function parseResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const payload = await response.json()
  if (!payload || payload.code !== 1) {
    throw new Error(payload?.msg || 'API 请求失败')
  }
  return payload.data
}

async function requestJson(path, { params, method = 'GET', body, token } = {}) {
  const response = await fetch(buildUrl(path, params), {
    method,
    headers: buildHeaders(token, body !== undefined),
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const refreshedToken = response.headers.get('X-Auth-Token')
  if (refreshedToken && typeof tokenRefreshHandler === 'function') {
    tokenRefreshHandler(refreshedToken)
  }
  return parseResponse(response)
}

export function registerTokenRefreshHandler(handler) {
  tokenRefreshHandler = typeof handler === 'function' ? handler : null
}

export function isApiEnabled() {
  return String(import.meta.env.VITE_USE_API || '').toLowerCase() === 'true'
}

export async function fetchItemsBySubNavKey(subNavKey) {
  return requestJson('/tto/items', { params: { subNavKey } })
}

export async function fetchItemDetail(itemId) {
  return requestJson(`/tto/items/${itemId}`)
}

export async function pingApi() {
  return requestJson('/common/ping')
}

export async function fetchAuthSession(token) {
  return requestJson('/auth/session', { token })
}

export async function login(username, password) {
  return requestJson('/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

export async function fetchFavorites(token) {
  const data = await requestJson('/tto/favorites', { token })
  return data?.list || []
}

export async function addFavoriteRemote(token, payload) {
  return requestJson('/tto/favorites', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function removeFavoriteRemote(token, favoriteId) {
  return requestJson(`/tto/favorites/${favoriteId}`, {
    method: 'DELETE',
    token,
  })
}

export async function submitInquiry(payload, token) {
  return requestJson('/tto/inquiries', {
    method: 'POST',
    body: payload,
    token: token || undefined,
  })
}
