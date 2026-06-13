import { ref, watch } from 'vue'
import {
  addFavoriteRemote,
  fetchFavorites,
  removeFavoriteRemote,
} from '@/utils/ttoApi'
import {
  getAuthToken,
  shouldUseRemoteFavorites,
} from '@/utils/authStore'

const STORAGE_KEY = 'tto_favorites'
export const MAX_FAVORITES = 300
const MAX_REMOTE_PAGE_SIZE = 50

const favorites = ref([])
let remoteLoaded = false
const favoriteActionLocks = new Set()

function loadLocalFavorites() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载收藏数据失败:', error)
  }
  return []
}

function saveLocalFavorites(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (error) {
    console.error('保存收藏数据失败:', error)
  }
}

watch(
  favorites,
  (newVal) => {
    if (!shouldUseRemoteFavorites()) {
      saveLocalFavorites(newVal)
    }
  },
  { deep: true },
)

function normalizeId(value) {
  if (value == null || value === '') return null
  return String(value)
}

function getUniqueKey(item) {
  if (item?.itemKey != null && item.itemKey !== '') return String(item.itemKey)
  if (item?.uniqueKey != null && item.uniqueKey !== '') return String(item.uniqueKey)
  const id = normalizeId(item?.id)
  if (id) return id
  return `${item?.type || ''}_${item?.title || ''}`
}

function mapRemoteFavorite(row) {
  const tripData =
    row?.tripData && typeof row.tripData === 'object' ? { ...row.tripData } : {}
  const itemType = row?.itemType || row?.tripType || row?.type || 'scenic'

  if (row?.subNavName) tripData.displaySubNav = row.subNavName
  if (row?.cover) tripData.cover = row.cover
  if (row?.thumbnail) tripData.thumbnail = row.thumbnail
  if (row?.img != null) tripData.img = row.img

  return {
    favoriteId: row?.favoriteId,
    id: row?.id ?? row?.itemId,
    itemKey: row?.itemKey || '',
    type: itemType,
    itemType,
    title: row?.title || '',
    enTitle: row?.enTitle || '',
    cover: row?.cover || tripData.cover || '',
    thumbnail: row?.thumbnail || row?.cover || tripData.thumbnail || tripData.cover || '',
    img: row?.img ?? tripData.img,
    image: row?.image || row?.banner || '',
    banner: row?.banner || row?.image || '',
    region: row?.region || tripData.region || '',
    town: row?.town || tripData.town || '',
    tripData,
    subNavName: row?.subNavName || tripData.displaySubNav || '',
    tripType: itemType,
    itemKey: row?.itemKey || '',
    uniqueKey: row?.uniqueKey || String(row?.id ?? row?.itemId ?? ''),
  }
}

export function switchToLocalFavorites() {
  remoteLoaded = false
  favorites.value = loadLocalFavorites()
}

export async function refreshRemoteFavorites(force = false, pageSize = 50) {
  if (!shouldUseRemoteFavorites()) {
    switchToLocalFavorites()
    return favorites.value
  }
  if (remoteLoaded && !force) {
    return favorites.value
  }

  try {
    const requestedPageSize = Number.isFinite(Number(pageSize)) && Number(pageSize) > 0
      ? Math.floor(Number(pageSize))
      : MAX_REMOTE_PAGE_SIZE
    const safePageSize = Math.min(requestedPageSize, MAX_REMOTE_PAGE_SIZE)
    const token = getAuthToken()
    const merged = []
    let pageNum = 1
    let total = 0

    while (true) {
      const data = await fetchFavorites(token, { pageNum, pageSize: safePageSize })
      const rows = Array.isArray(data?.list) ? data.list : []
      if (!total) {
        total = Number(data?.total || rows.length || 0)
      }
      merged.push(...rows.map(mapRemoteFavorite))
      if (merged.length >= total || rows.length < safePageSize) {
        break
      }
      pageNum += 1
    }

    favorites.value = merged
    remoteLoaded = true
  } catch (error) {
    console.warn('[favoritesStore] 远程收藏加载失败:', error)
    remoteLoaded = false
    favorites.value = []
  }
  return favorites.value
}

export async function migrateLocalFavoritesToRemote() {
  if (!shouldUseRemoteFavorites()) return

  const localItems = loadLocalFavorites()
  if (!localItems.length) {
    await refreshRemoteFavorites(true)
    return {
      migratedCount: 0,
      remainingCount: 0,
      limitReached: false,
    }
  }

  const remainingItems = []
  let migratedCount = 0
  let limitReached = false

  for (let index = 0; index < localItems.length; index += 1) {
    const item = localItems[index]
    if (!item?.id) {
      remainingItems.push(item)
      continue
    }
    try {
      const result = await addFavoriteRemote(getAuthToken(), {
        itemId: Number(item.id),
        itemType: item.itemType || item.type || 'scenic',
        title: item.title || '',
        itemKey: item.itemKey || '',
      })
      if (result?.status === 'limit') {
        limitReached = true
        remainingItems.push(item)
        remainingItems.push(...localItems.slice(index + 1))
        break
      }
      if (result?.status === 'exists' || result?.status === 'success') {
        migratedCount += 1
        continue
      }
      remainingItems.push(item)
    } catch (error) {
      console.warn('[favoritesStore] 迁移收藏失败:', item?.id, error)
      remainingItems.push(item)
    }
  }

  saveLocalFavorites(remainingItems)
  await refreshRemoteFavorites(true)
  return {
    migratedCount,
    remainingCount: remainingItems.length,
    limitReached,
  }
}

const addFavorite = (item) => {
  const uniqueKey = getUniqueKey(item)
  const exists = favorites.value.some((fav) => getUniqueKey(fav) === uniqueKey)
  if (exists) {
    return 'exists'
  }
  if (favorites.value.length >= MAX_FAVORITES) {
    return 'limit'
  }
  favorites.value.push({ ...item, uniqueKey })
  return 'success'
}

const removeFavorite = (id, type, title, favoriteId, itemKey) => {
  const uniqueKey = favoriteId ? null : normalizeId(itemKey) || normalizeId(id) || `${type}_${title}`
  const index = favorites.value.findIndex((fav) => {
    if (favoriteId != null && fav.favoriteId != null) {
      return fav.favoriteId === favoriteId
    }
    return getUniqueKey(fav) === uniqueKey
  })
  if (index > -1) {
    favorites.value.splice(index, 1)
  }
}

const isFavorite = (id, type, title, itemKey) => {
  const uniqueKey = normalizeId(itemKey) || normalizeId(id) || `${type}_${title}`
  return favorites.value.some((fav) => getUniqueKey(fav) === uniqueKey)
}

export async function addFavoriteAsync(item) {
  if (shouldUseRemoteFavorites()) {
    if (item?.id == null || item?.id === '') {
      console.warn('[favoritesStore] 登录状态下收藏需要有效的 itemId')
      return 'error'
    }
    const numericId = Number(item.id)
    if (!Number.isFinite(numericId)) {
      console.warn('[favoritesStore] 无效 itemId:', item.id)
      return 'error'
    }
    try {
      const result = await addFavoriteRemote(getAuthToken(), {
        itemId: numericId,
        itemType: item.itemType || item.type || 'scenic',
        title: item.title || '',
        itemKey: item.itemKey || '',
      })
      await refreshRemoteFavorites(true)
      return result?.status || 'success'
    } catch (error) {
      console.warn('[favoritesStore] 远程添加收藏失败:', error)
      return 'error'
    }
  }
  return addFavorite(item)
}

export async function removeFavoriteAsync(id, type, title, favoriteId, itemKey) {
  if (shouldUseRemoteFavorites()) {
    const target = favorites.value.find((fav) => {
      if (favoriteId != null) return fav.favoriteId === favoriteId
      return getUniqueKey(fav) === (normalizeId(itemKey) || normalizeId(id) || `${type}_${title}`)
    })
    const remoteId = favoriteId ?? target?.favoriteId
    if (!remoteId) {
      await refreshRemoteFavorites(true)
      return
    }
    try {
      await removeFavoriteRemote(getAuthToken(), remoteId)
      await refreshRemoteFavorites(true)
    } catch (error) {
      console.warn('[favoritesStore] 远程取消收藏失败:', error)
      throw error
    }
    return
  }
  removeFavorite(id, type, title, favoriteId, itemKey)
}

export async function toggleFavorite(item) {
  const itemType = item?.itemType || item?.type
  const uniqueKey = getUniqueKey(item)
  const lockKey = `toggle:${uniqueKey}`

  if (favoriteActionLocks.has(lockKey)) {
    return 'busy'
  }

  favoriteActionLocks.add(lockKey)
  try {
    if (isFavorite(item.id, itemType, item.title, item.itemKey)) {
      const current = favorites.value.find((fav) => getUniqueKey(fav) === uniqueKey)
      await removeFavoriteAsync(item.id, itemType, item.title, current?.favoriteId, item.itemKey)
      return 'removed'
    }
    return addFavoriteAsync({ ...item, type: itemType, itemType })
  } finally {
    favoriteActionLocks.delete(lockKey)
  }
}

const getFavorites = () => favorites.value

const getFavoritesCount = () => favorites.value.length

const clearFavorites = () => {
  favorites.value = []
}

watch(
  () => shouldUseRemoteFavorites(),
  (useRemote, prev) => {
    if (useRemote) {
      // 登录流程由 LoginDialog 负责 migrate + refresh，避免与迁移竞态
      if (prev === false) return
      void refreshRemoteFavorites(true)
      return
    }
    switchToLocalFavorites()
  },
  { immediate: true },
)

export {
  favorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  getFavorites,
  getFavoritesCount,
  clearFavorites,
}
