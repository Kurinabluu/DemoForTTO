import { buildSubNavKey } from '@/utils/subNavKey'
import { formatLocationLabel } from '@/utils/tasLocationPostcodes'
import { fetchItemDetail, fetchItemsBySubNavKey, fetchNavTree, isApiEnabled, isLocalJsonFallbackEnabled } from '@/utils/ttoApi'
import { notifyApiWarning } from '@/utils/apiFeedback'

import freeinfoFallbackData from '@/data/fallback/freeinfo_fallback.json'
import daytripFallbackData from '@/data/fallback/daytrip_fallback.json'

// 仅在 gh-pages 生产过渡环境允许本地 JSON 兜底；开发环境强制走数据库
const USE_LOCAL_JSON_FALLBACK = isLocalJsonFallbackEnabled()

/**
 * [临时开发功能] 从本地 JSON 文件获取数据
 * 用于开发阶段数据库不可用时的兜底
 */
function loadLocalFallbackData(dataKey) {
  if (!USE_LOCAL_JSON_FALLBACK) {
    return null
  }

  try {
    if (dataKey === 'freeinfo') {
      return freeinfoFallbackData
    } else if (dataKey === 'daytrip') {
      return daytripFallbackData
    }
  } catch {
  }

  return null
}

function loadLocalFallbackBundle(sectionPath) {
  if (!USE_LOCAL_JSON_FALLBACK) {
    return null
  }
  const fallbackKey = sectionPath === 'trips/freeinfo' ? 'freeinfo' : 'daytrip'
  const fallbackData = loadLocalFallbackData(fallbackKey)
  if (!fallbackData) {
    return null
  }
  return {
    path: sectionPath,
    subNav: fallbackData.subNav || [],
  }
}

function parseCardExtraJson(row) {
  if (!row?.cardExtraJson) return {}
  try {
    return typeof row.cardExtraJson === 'string'
      ? JSON.parse(row.cardExtraJson)
      : row.cardExtraJson
  } catch {
    return {}
  }
}

function mapApiFeatures(features) {
  if (!Array.isArray(features)) return undefined
  return features.map((row) => ({
    icon: row?.icon || '',
    title: row?.featureTitle || row?.title || '',
    desc: row?.featureDesc || row?.desc || '',
  }))
}

function mapApiSources(source) {
  if (!Array.isArray(source)) return undefined
  return source.map((row) => ({
    title: row?.sourceTitle || row?.title || '',
    desc: row?.sourceDesc || row?.desc || '',
    url: row?.sourceUrl || row?.url || '',
  }))
}

function mapApiTags(tags) {
  if (!Array.isArray(tags)) return undefined
  return tags
    .map((row) => (typeof row === 'string' ? row : row?.tagName))
    .filter(Boolean)
}

function resolveItemType(row, extra = {}) {
  return row?.itemType || row?.tripType || extra.itemType || extra.tripType || 'scenic'
}

/** 将详情 API 的结构化字段合并为前端 tripData 形状 */
export function buildTripDataFromDetailDto(dto, extra = {}) {
  const baseTripData =
    dto?.tripData && typeof dto.tripData === 'object'
      ? { ...dto.tripData }
      : extra.tripData && typeof extra.tripData === 'object'
        ? { ...extra.tripData }
        : {}

  const tripData = { ...baseTripData }

  if (dto?.routeText) tripData.route = dto.routeText
  if (dto?.description) tripData.desc = dto.description
  if (dto?.townName) tripData.town = dto.townName
  if (dto?.postcode) tripData.postcode = dto.postcode
  const derivedLabel = formatLocationLabel(dto?.townName, dto?.postcode) || dto?.locationLabel
  if (derivedLabel) tripData.locationLabel = derivedLabel
  if (dto?.subNavName === '景点' && dto?.belongsToSpot) tripData.belongsToSpot = dto.belongsToSpot
  if (dto?.subNavName === '景点' && dto?.parentItemId != null) tripData.parentItemId = dto.parentItemId
  if (dto?.website) tripData.website = dto.website

  const features = mapApiFeatures(dto?.features)
  if (features?.length) tripData.features = features

  const tags = mapApiTags(dto?.tags)
  if (tags?.length) tripData.tags = tags

  const source = mapApiSources(dto?.source)
  if (source?.length) tripData.source = source

  if (Array.isArray(dto?.images) && dto.images.length) {
    tripData.images = dto.images
  }

  return tripData
}

export function mapApiDetailToItem(dto) {
  if (!dto || typeof dto !== 'object') return null

  const extra = parseCardExtraJson(dto)
  const tripData = buildTripDataFromDetailDto(dto, extra)
  const img = extra.img ?? dto.img ?? dto.cover ?? (Array.isArray(dto.images) ? dto.images[0] : undefined)
  const itemType = resolveItemType(dto, extra)

  return {
    ...extra,
    id: dto.id ?? extra.id,
    itemKey: dto.itemKey ?? extra.itemKey,
    title: dto.title || extra.title || '',
    enTitle: dto.enTitle ?? extra.enTitle ?? '',
    cover: dto.cover ?? extra.cover,
    img,
    tripType: itemType,
    itemType,
    subNavName: dto.subNavName || extra.subNavName || tripData.displaySubNav || '',
    tripData,
  }
}

function mapApiItem(row) {
  if (!row || typeof row !== 'object') return null

  const extra = parseCardExtraJson(row)
  const tripData =
    extra.tripData && typeof extra.tripData === 'object'
      ? { ...extra.tripData }
      : row?.tripData && typeof row.tripData === 'object'
        ? { ...row.tripData }
        : {}

  if (row.townName) tripData.town = row.townName
  if (row.postcode) tripData.postcode = row.postcode
  const derivedLabel = formatLocationLabel(row.townName, row.postcode)
    || (row.locationLabel && row.locationLabel !== '暂未分类' ? row.locationLabel : '')
  if (derivedLabel) {
    tripData.locationLabel = derivedLabel
  } else if (tripData.town && tripData.postcode && /^\d{4}$/.test(String(tripData.postcode))) {
    tripData.locationLabel = `${tripData.town} ${tripData.postcode}`
  }
  if (row.belongsToSpot && !tripData.belongsToSpot) tripData.belongsToSpot = row.belongsToSpot
  if (row.parentItemId != null && tripData.parentItemId == null) tripData.parentItemId = row.parentItemId

  const itemType = resolveItemType(row, extra)

  return {
    ...extra,
    id: row?.id ?? extra.id,
    itemKey: row?.itemKey ?? extra.itemKey,
    title: row?.title || extra.title || '',
    enTitle: row?.enTitle ?? extra.enTitle ?? '',
    cover: row?.cover ?? extra.cover,
    img: extra.img ?? row?.img ?? row?.cover ?? row?.thumbnail,
    tripType: itemType,
    itemType,
    tripData,
    badge: row?.badge ?? extra.badge ?? extra.badgeText ?? '',
    badgeClass: row?.badgeClass ?? extra.badgeClass ?? extra.badge_class ?? '',
    cardClass: row?.cardClass ?? extra.cardClass ?? extra.card_class ?? '',
    sub: row?.sub ?? extra.sub ?? '',
    location: row?.location ?? extra.location ?? '',
    info: Array.isArray(row?.info) ? row.info : Array.isArray(extra.info) ? extra.info : [],
    tagItems: Array.isArray(row?.tagItems) ? row.tagItems : Array.isArray(extra.tagItems) ? extra.tagItems : [],
    tags: Array.isArray(row?.tags) ? row.tags : Array.isArray(extra.tags) ? extra.tags : [],
  }
}

export async function loadCatalogItemDetail(itemId) {
  if (itemId == null || itemId === '') return null
  if (!isApiEnabled()) return null
  try {
    const dto = await fetchItemDetail(itemId)
    return mapApiDetailToItem(dto)
  } catch (error) {
    if (isApiEnabled()) {
      throw error
    }
    return null
  }
}

export async function loadItemDetailById(itemId) {
  return loadCatalogItemDetail(itemId)
}

async function fetchSubNavItems(sectionPath, subNavMeta, keyword = '') {
  const subNavKey = buildSubNavKey(sectionPath, subNavMeta.subNavName)
  const rows = await fetchItemsBySubNavKey(subNavKey, {
    keyword: String(keyword || '').trim() || undefined,
  })
  return Array.isArray(rows) ? rows.map(mapApiItem).filter(Boolean) : []
}

export async function searchItemsInSubNav(sectionPath, subNavName, keyword) {
  const safeKeyword = String(keyword || '').trim()
  if (!isApiEnabled() || !safeKeyword || !sectionPath || !subNavName) {
    return []
  }
  return fetchSubNavItems(sectionPath, { subNavName }, safeKeyword)
}

export async function loadItemsBySubNav(sectionPath, subNavName) {
  if (!isApiEnabled()) {
    return []
  }

  const subNavMeta = { subNavName }
  return fetchSubNavItems(sectionPath, subNavMeta)
}

async function loadSectionBundle(sectionPath) {
  if (!isApiEnabled()) {
    return loadLocalFallbackBundle(sectionPath) || { path: sectionPath, subNav: [] }
  }

  let sectionNav = null
  try {
    const navTree = await loadNavTree()
    sectionNav = Array.isArray(navTree)
      ? navTree.find((item) => item.path === sectionPath)
      : null
  } catch (error) {
    const fallbackBundle = loadLocalFallbackBundle(sectionPath)
    if (fallbackBundle) {
      notifyApiWarning('后端暂不可用，已使用本地数据展示', {
        dedupeKey: 'content:api-fallback',
      })
      return fallbackBundle
    }
    throw error
  }

  if (!sectionNav?.subNav?.length) {
    const fallbackBundle = loadLocalFallbackBundle(sectionPath)
    if (fallbackBundle) {
      notifyApiWarning('后端暂无数据，已使用本地数据展示', {
        dedupeKey: 'content:api-empty-fallback',
      })
      return fallbackBundle
    }
    throw new Error('后端导航数据为空')
  }

  const subNav = await Promise.all(
    sectionNav.subNav.map(async (subNavMeta) => {
      const items = await fetchSubNavItems(sectionPath, subNavMeta)
      return {
        ...subNavMeta,
        items,
      }
    })
  )

  const allItemsEmpty = subNav.every(sub => !Array.isArray(sub.items) || sub.items.length === 0)
  if (allItemsEmpty) {
    const fallbackBundle = loadLocalFallbackBundle(sectionPath)
    if (fallbackBundle) {
      notifyApiWarning('后端暂无内容，已使用本地数据展示', {
        dedupeKey: 'content:api-items-empty-fallback',
      })
      return fallbackBundle
    }
  }

  return {
    path: sectionPath,
    subNav,
  }
}

let freeInfoPromise = null
let dayTripPromise = null
let navTreePromise = null

async function loadNavTree() {
  if (!navTreePromise) {
    navTreePromise = fetchNavTree().catch((error) => {
      navTreePromise = null
      throw error
    })
  }
  return navTreePromise
}

export async function loadFreeInfoData() {
  if (!freeInfoPromise) {
    freeInfoPromise = loadSectionBundle('trips/freeinfo')
  }
  return freeInfoPromise
}

export async function loadFreeInfoDataFresh() {
  return loadSectionBundle('trips/freeinfo')
}

export async function loadDayTripData() {
  if (!dayTripPromise) {
    dayTripPromise = loadSectionBundle('trips/routes').then((bundle) => {
      return Array.isArray(bundle?.subNav) ? bundle.subNav : []
    })
  }
  return dayTripPromise
}

export async function loadDayTripDataFresh() {
  const bundle = await loadSectionBundle('trips/routes')
  return Array.isArray(bundle?.subNav) ? bundle.subNav : []
}
