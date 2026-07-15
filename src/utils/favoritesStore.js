import { ref, watch } from 'vue'
import {
  addFavoriteRemote,
  fetchFavorites,
  fetchItemsBySubNavKey,
  removeFavoriteRemote,
} from '@/utils/ttoApi'
import {
  getAuthToken,
  shouldUseRemoteFavorites,
} from '@/utils/authStore'

const STORAGE_KEY = 'tto_favorites'
export const MAX_LOCAL_FAVORITES = 5
export const MAX_FAVORITES = 300
const MAX_REMOTE_PAGE_SIZE = 50

const favorites = ref([])
let remoteLoaded = false
let remoteRefreshPromise = null
let postLoginSyncPromise = null
let postLoginSyncDeferred = null
export const isPostLoginSyncing = ref(false)
const favoriteActionLocks = new Set()

function loadLocalFavorites() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
  }
  return []
}

function saveLocalFavorites(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
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
    town: row?.town || tripData.town || '',
    locationLabel: row?.locationLabel || tripData.locationLabel || '',
    postcode: row?.postcode || tripData.postcode || '',
    tripData,
    subNavName: row?.subNavName || tripData.displaySubNav || '',
    tripType: itemType,
    itemKey: row?.itemKey || '',
    uniqueKey: row?.uniqueKey || String(row?.id ?? row?.itemId ?? ''),
  }
}

export function getLocalFavoritesCount() {
  return loadLocalFavorites().length
}

function getActiveFavoritesLimit() {
  return shouldUseRemoteFavorites() ? MAX_FAVORITES : MAX_LOCAL_FAVORITES
}

export async function previewMigrationOverflow(authToken = getAuthToken()) {
  const localCount = getLocalFavoritesCount()
  const token = String(authToken || '').trim()
  if (!localCount || !token) {
    return {
      wouldOverflow: false,
      localCount,
      remoteCount: 0,
      combined: localCount,
    }
  }

  const data = await fetchFavorites(token, { pageNum: 1, pageSize: 1 })
  const remoteCount = Number(data?.total || 0)
  const combined = localCount + remoteCount
  return {
    wouldOverflow: combined > MAX_FAVORITES,
    localCount,
    remoteCount,
    combined,
  }
}

export function switchToLocalFavorites() {
  remoteLoaded = false
  favorites.value = loadLocalFavorites()
}

export function isRemoteFavoritesLoaded() {
  return remoteLoaded
}

export function getPostLoginSyncPromise() {
  return postLoginSyncPromise
}

export async function fetchRemoteFavoritesPage({
  pageNum = 1,
  pageSize = 12,
  keyword = '',
  source = '',
} = {}) {
  if (!shouldUseRemoteFavorites()) {
    return { list: [], total: 0 }
  }
  const data = await fetchFavorites(getAuthToken(), {
    pageNum,
    pageSize,
    keyword,
    source,
  })
  return {
    list: (Array.isArray(data?.list) ? data.list : []).map(mapRemoteFavorite),
    total: Number(data?.total || 0),
  }
}

export async function refreshRemoteFavorites(force = false, pageSize = 50) {
  if (!shouldUseRemoteFavorites()) {
    switchToLocalFavorites()
    return favorites.value
  }
  if (remoteLoaded && !force) {
    return favorites.value
  }
  if (remoteRefreshPromise && !force) {
    return remoteRefreshPromise
  }

  const runRefresh = async () => {
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
      remoteLoaded = false
      favorites.value = []
      throw error
    }
    return favorites.value
  }

  remoteRefreshPromise = runRefresh()
  try {
    return await remoteRefreshPromise
  } finally {
    remoteRefreshPromise = null
  }
}

async function runPostLoginSyncWork(mode = 'migrate') {
  if (mode === 'discard_local') {
    saveLocalFavorites([])
    await refreshRemoteFavorites(true)
    return {
      migratedCount: 0,
      remainingCount: 0,
      limitReached: true,
      localDiscarded: true,
    }
  }

  if (mode === 'skip') {
    await refreshRemoteFavorites(true)
    return {
      migratedCount: 0,
      remainingCount: getLocalFavoritesCount(),
      limitReached: false,
      skipped: true,
    }
  }

  const migrationResult = await migrateLocalFavoritesToRemote()
  await refreshRemoteFavorites(true)
  return migrationResult
}

export function reservePostLoginSync() {
  if (postLoginSyncDeferred) {
    return postLoginSyncDeferred.promise
  }

  let resolveDeferred
  let rejectDeferred
  const promise = new Promise((resolve, reject) => {
    resolveDeferred = resolve
    rejectDeferred = reject
  })

  postLoginSyncDeferred = {
    promise,
    resolve: resolveDeferred,
    reject: rejectDeferred,
  }
  postLoginSyncPromise = promise
  isPostLoginSyncing.value = true
  return promise
}

export function pausePostLoginSyncOverlay() {
  isPostLoginSyncing.value = false
}

export function cancelPostLoginSync() {
  if (postLoginSyncDeferred) {
    postLoginSyncDeferred.resolve({
      cancelled: true,
      migratedCount: 0,
      remainingCount: getLocalFavoritesCount(),
      limitReached: false,
    })
  }
  isPostLoginSyncing.value = false
  postLoginSyncDeferred = null
  postLoginSyncPromise = null
  remoteLoaded = false
}

export async function releasePostLoginSync(mode = 'migrate') {
  if (!shouldUseRemoteFavorites()) {
    return {
      migratedCount: 0,
      remainingCount: 0,
      limitReached: false,
    }
  }

  if (!postLoginSyncDeferred) {
    return syncFavoritesAfterLogin({ mode })
  }

  isPostLoginSyncing.value = true
  try {
    const result = await runPostLoginSyncWork(mode)
    postLoginSyncDeferred.resolve(result)
    return result
  } catch (error) {
    postLoginSyncDeferred.reject(error)
    throw error
  } finally {
    isPostLoginSyncing.value = false
    postLoginSyncDeferred = null
    postLoginSyncPromise = null
  }
}

export async function syncFavoritesAfterLogin({ mode = 'migrate' } = {}) {
  if (!shouldUseRemoteFavorites()) {
    return {
      migratedCount: 0,
      remainingCount: 0,
      limitReached: false,
    }
  }

  reservePostLoginSync()
  return releasePostLoginSync(mode)
}

export async function migrateLocalFavoritesToRemote() {
  if (!shouldUseRemoteFavorites()) {
    return {
      migratedCount: 0,
      remainingCount: 0,
      limitReached: false,
    }
  }

  const localItems = loadLocalFavorites()
  if (!localItems.length) {
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
    } catch {
      remainingItems.push(item)
    }
  }

  saveLocalFavorites(remainingItems)
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
  if (favorites.value.length >= getActiveFavoritesLimit()) {
    return shouldUseRemoteFavorites() ? 'limit' : 'local_limit'
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
  if (isPostLoginSyncing.value) {
    return 'busy'
  }

  if (shouldUseRemoteFavorites()) {
    if (item?.id == null || item?.id === '') {
      return 'error'
    }
    const numericId = Number(item.id)
    if (!Number.isFinite(numericId)) {
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
    } catch {
      return 'error'
    }
  }
  return addFavorite(item)
}

export async function removeFavoriteAsync(id, type, title, favoriteId, itemKey) {
  if (isPostLoginSyncing.value) {
    throw new Error('收藏正在同步，请稍候')
  }

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
      throw error
    }
    return
  }
  removeFavorite(id, type, title, favoriteId, itemKey)
}

export async function toggleFavorite(item) {
  if (isPostLoginSyncing.value) {
    return 'busy'
  }

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

const MIGRATION_TEST_SUB_NAVS = [
  'trips/freeinfo:景点',
  'trips/freeinfo:餐厅',
  'trips/freeinfo:住宿',
  'trips/freeinfo:徒步线路',
]

function mapCandidateFavorite(row) {
  const id = row?.id ?? row?.itemId
  if (id == null) return null
  const itemType = row?.itemType || row?.tripType || 'scenic'
  return {
    id,
    itemKey: row?.itemKey || '',
    itemType,
    type: itemType,
    title: row?.title || `条目 ${id}`,
    enTitle: row?.enTitle || '',
    uniqueKey: row?.itemKey || String(id),
    subNavName: row?.subNavName || '',
    tripData: row?.tripData && typeof row.tripData === 'object' ? { ...row.tripData } : {},
  }
}

export async function prepareMigrationTestLocalFavorites(targetCount = MAX_FAVORITES - 5) {
  const safeTarget = Math.max(1, Math.min(Number(targetCount) || MAX_FAVORITES - 5, MAX_FAVORITES))
  const candidates = []
  const seen = new Set()

  for (const subNavKey of MIGRATION_TEST_SUB_NAVS) {
    try {
      const rows = await fetchItemsBySubNavKey(subNavKey)
      if (!Array.isArray(rows)) continue
      for (const row of rows) {
        const item = mapCandidateFavorite(row)
        if (!item) continue
        const dedupeKey = String(item.id)
        if (seen.has(dedupeKey)) continue
        seen.add(dedupeKey)
        candidates.push(item)
        if (candidates.length >= safeTarget) break
      }
    } catch {
    }
    if (candidates.length >= safeTarget) break
  }

  if (!candidates.length) {
    throw new Error('未能获取可用于迁移测试的内容条目')
  }

  const list = candidates.slice(0, safeTarget)
  saveLocalFavorites(list)
  favorites.value = list
  remoteLoaded = false
  return list.length
}

watch(
  () => shouldUseRemoteFavorites(),
  (useRemote, prev) => {
    if (useRemote) {
      // 登录流程由 authStore 统一 migrate + refresh，避免重复请求
      if (prev === false) return
      void refreshRemoteFavorites(true).catch((error) => {
      })
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
