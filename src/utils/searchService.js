import { searchContentRemote } from '@/utils/ttoApi'

const SEARCH_STORAGE_KEY = 'tto_last_search_payload'
export const SEARCH_PAGE_SIZE = 10

const cleanText = (value) => {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

export const searchAllContent = async (rawKeyword, pageNum = 1, pageSize = SEARCH_PAGE_SIZE) => {
  const keyword = cleanText(rawKeyword || '')
  if (!keyword) {
    return {
      query: '',
      pageNum: 1,
      pageSize: SEARCH_PAGE_SIZE,
      total: 0,
      results: []
    }
  }

  const data = await searchContentRemote(keyword, {
    pageNum,
    pageSize,
  })

  return {
    query: data?.query || keyword,
    pageNum: Number(data?.pageNum || pageNum) || 1,
    pageSize: Number(data?.pageSize || pageSize) || SEARCH_PAGE_SIZE,
    total: Number(data?.total || 0) || 0,
    results: Array.isArray(data?.results) ? data.results : []
  }
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
