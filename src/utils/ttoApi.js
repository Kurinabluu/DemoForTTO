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

export class ApiError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.cause = cause
  }
}

async function parseResponse(response) {
  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const status = response.status
    if (status >= 500) {
      throw new ApiError('服务繁忙，请稍后再试', { status })
    }
    if (status === 401 || payload?.code === 401) {
      throw new ApiError('未登录或登录已过期，请重新登录', { status, code: 401 })
    }
    throw new ApiError(payload?.msg || `请求失败（HTTP ${status}）`, { status })
  }

  if (!payload || payload.code !== 1) {
    if (payload?.code === 401) {
      throw new ApiError('未登录或登录已过期，请重新登录', { code: 401 })
    }
    const message = payload?.msg || '加载失败，请稍后再试'
    throw new ApiError(message, { code: payload?.code })
  }
  return payload.data
}

async function requestJson(path, { params, method = 'GET', body, token } = {}) {
  try {
    const response = await fetch(buildUrl(path, params), {
      method,
      headers: buildHeaders(token, body !== undefined),
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const refreshedToken = response.headers.get('X-Auth-Token')
    if (refreshedToken && typeof tokenRefreshHandler === 'function') {
      tokenRefreshHandler(refreshedToken)
    }
    return parseResponse(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    const message = String(error?.message || '')
    if (error?.name === 'TypeError' || /failed to fetch|network|load failed/i.test(message)) {
      throw new ApiError('网络异常，请检查网络后重试', { cause: error })
    }
    throw new ApiError(message || '请求失败', { cause: error })
  }
}

export function registerTokenRefreshHandler(handler) {
  tokenRefreshHandler = typeof handler === 'function' ? handler : null
}

/** 仅 gh-pages 等生产过渡环境使用本地 JSON 展示内容 */
export function isLocalJsonFallbackEnabled() {
  return import.meta.env.PROD
    && String(import.meta.env.VITE_USE_LOCAL_JSON_FALLBACK || '').toLowerCase() === 'true'
}

/**
 * 是否走后端内容 API。
 * 开发环境：VITE_USE_API=true 且未启用 JSON 兜底 → 走 API。
 * gh-pages：启用 JSON 兜底时不发内容 API（避免 /api/tto/* 404）。
 */
export function isApiEnabled() {
  if (isLocalJsonFallbackEnabled()) {
    return false
  }
  return String(import.meta.env.VITE_USE_API || '').toLowerCase() === 'true'
}

export async function fetchItemsBySubNavKey(subNavKey, { keyword } = {}) {
  return requestJson('/tto/items', {
    params: {
      subNavKey,
      q: keyword,
    },
  })
}

export async function fetchNavTree() {
  return requestJson('/tto/nav')
}

export async function fetchItemDetail(itemId) {
  return requestJson(`/tto/items/${itemId}`)
}

export async function fetchItemDetailByKey(itemKey) {
  return requestJson('/tto/items/by-key', {
    params: {
      itemKey,
    },
  })
}

export async function fetchLocationCatalog(subNavName, { sortMode } = {}) {
  return requestJson('/tto/locations', {
    params: {
      subNavName,
      sortMode,
    },
  })
}

export async function fetchLocationSections(subNavName, {
  sortMode,
  locationLabel,
  distanceFromLabel,
  keyword,
} = {}) {
  return requestJson('/tto/location-sections', {
    params: {
      subNavName,
      sortMode,
      locationLabel,
      distanceFromLabel,
      keyword,
    },
  })
}

export async function pingApi() {
  return requestJson('/common/ping')
}

export async function fetchAuthSession(token) {
  return requestJson('/auth/session', {
    token: token || undefined,
  })
}

export async function login(username, password) {
  return requestJson('/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

export async function registerAccount(payload) {
  return requestJson('/auth/register', {
    method: 'POST',
    body: payload,
  })
}

export async function logoutAccount() {
  return requestJson('/auth/logout', {
    method: 'POST',
  })
}

export async function fetchFavorites(token, { pageNum = 1, pageSize = 12, keyword = '', source = '' } = {}) {
  return requestJson('/tto/favorites', {
    token,
    params: {
      pageNum,
      pageSize,
      keyword,
      source,
    },
  })
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

export async function searchContentRemote(keyword, { pageNum = 1, pageSize = 10 } = {}) {
  return requestJson('/tto/search', {
    params: {
      q: keyword,
      pageNum,
      pageSize,
    },
  })
}

/** 商业服务列表（含 serviceConfig） */
export async function fetchServices() {
  return requestJson('/tto/services')
}

/** 按板块名称取商业服务（如「包车服务」） */
export async function fetchServiceByName(name) {
  return requestJson('/tto/services/by-name', {
    params: { name },
  })
}

/** 按 path 取商业服务（如 service/car） */
export async function fetchServiceByPath(path) {
  return requestJson('/tto/services/by-path', {
    params: { path },
  })
}
