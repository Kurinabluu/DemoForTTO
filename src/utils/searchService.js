import { searchContentRemote } from '@/utils/ttoApi'

const SEARCH_STORAGE_KEY = 'tto_last_search_payload'
export const SEARCH_PAGE_SIZE = 10
const MAX_SEARCH_CACHE_SIZE = 32

const searchCache = new Map()

const cleanText = (value) => {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

export function buildSearchSignature(keyword, pageNum = 1, pageSize = SEARCH_PAGE_SIZE) {
  return `${cleanText(keyword)}::${Number(pageNum) || 1}::${Number(pageSize) || SEARCH_PAGE_SIZE}`
}

function rememberSearchPayload(signature, payload) {
  if (!signature || !payload) return
  if (searchCache.size >= MAX_SEARCH_CACHE_SIZE) {
    const oldest = searchCache.keys().next().value
    searchCache.delete(oldest)
  }
  searchCache.set(signature, payload)
}

export function getCachedSearchPayload(keyword, pageNum = 1, pageSize = SEARCH_PAGE_SIZE) {
  return searchCache.get(buildSearchSignature(keyword, pageNum, pageSize)) || null
}

export function clearSearchCache() {
  searchCache.clear()
}

export const searchAllContent = async (rawKeyword, pageNum = 1, pageSize = SEARCH_PAGE_SIZE, { force = false } = {}) => {
  const keyword = cleanText(rawKeyword || '')
  if (!keyword) {
    return {
      query: '',
      pageNum: 1,
      pageSize: SEARCH_PAGE_SIZE,
      total: 0,
      results: [],
    }
  }

  const signature = buildSearchSignature(keyword, pageNum, pageSize)
  if (!force) {
    const cached = searchCache.get(signature)
    if (cached) {
      return cached
    }
  }

  const data = await searchContentRemote(keyword, {
    pageNum,
    pageSize,
  })

  const payload = {
    query: data?.query || keyword,
    pageNum: Number(data?.pageNum || pageNum) || 1,
    pageSize: Number(data?.pageSize || pageSize) || SEARCH_PAGE_SIZE,
    total: Number(data?.total || 0) || 0,
    results: Array.isArray(data?.results) ? data.results : [],
  }

  rememberSearchPayload(signature, payload)
  return payload
}

export const persistSearchSession = (payload) => {
  if (typeof window === 'undefined' || !payload) return
  try {
    localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify({ ...payload, timestamp: Date.now() }))
  } catch (error) {
    // ignore
  }
}

export const getStoredSearchSession = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SEARCH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    return null
  }
}

export const clearStoredSearchSession = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SEARCH_STORAGE_KEY)
  } catch (error) {
    // ignore
  }
}
