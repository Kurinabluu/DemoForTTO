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
export const MAX_FAVORITES = 500

const favorites = ref([])
let remoteLoaded = false

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
    uniqueKey: row?.uniqueKey || String(row?.id ?? row?.itemId ?? ''),
  }
}

export function switchToLocalFavorites() {
  remoteLoaded = false
  favorites.value = loadLocalFavorites()
}

export async function refreshRemoteFavorites(force = false) {
  if (!shouldUseRemoteFavorites()) {
    switchToLocalFavorites()
    return favorites.value
  }
  if (remoteLoaded && !force) {
    return favorites.value
  }

  try {
    const rows = await fetchFavorites(getAuthToken())
    favorites.value = rows.map(mapRemoteFavorite)
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
    return
  }

  for (const item of localItems) {
    if (!item?.id) continue
    try {
      await addFavoriteRemote(getAuthToken(), {
        itemId: Number(item.id),
        itemType: item.itemType || item.type || 'scenic',
        title: item.title || '',
      })
    } catch (error) {
      console.warn('[favoritesStore] 迁移收藏失败:', item?.id, error)
    }
  }

  saveLocalFavorites([])
  await refreshRemoteFavorites(true)
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

const removeFavorite = (id, type, title, favoriteId) => {
  const uniqueKey = favoriteId ? null : normalizeId(id) || `${type}_${title}`
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

const isFavorite = (id, type, title) => {
  const uniqueKey = normalizeId(id) || `${type}_${title}`
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

export async function removeFavoriteAsync(id, type, title, favoriteId) {
  if (shouldUseRemoteFavorites()) {
    const target = favorites.value.find((fav) => {
      if (favoriteId != null) return fav.favoriteId === favoriteId
      return getUniqueKey(fav) === (normalizeId(id) || `${type}_${title}`)
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
  removeFavorite(id, type, title, favoriteId)
}

export async function toggleFavorite(item) {
  const itemType = item?.itemType || item?.type
  const uniqueKey = getUniqueKey(item)
  if (isFavorite(item.id, itemType, item.title)) {
    const current = favorites.value.find((fav) => getUniqueKey(fav) === uniqueKey)
    await removeFavoriteAsync(item.id, itemType, item.title, current?.favoriteId)
    return 'removed'
  }
  return addFavoriteAsync({ ...item, type: itemType, itemType })
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
