import { buildSubNavKey } from '@/utils/subNavKey'
import { fetchItemDetail, fetchItemsBySubNavKey, fetchNavTree, isApiEnabled } from '@/utils/ttoApi'
import { notifyApiWarning } from '@/utils/apiFeedback'

/**
 * ============================================================
 * [临时开发功能] 本地 JSON 兜底数据
 * ============================================================
 * 用途：在开发阶段没有可用数据库时，使用本地 JSON 文件作为数据兜底
 * 
 * 使用场景：
 * - 数据库不可用（如本地开发环境未配置数据库）
 * - API 接口调用失败且 isApiEnabled = false
 * - 后端服务未启动
 * 
 * 使用方式：
 * 1. 确认 `VITE_USE_LOCAL_JSON_FALLBACK=true` 在 .env.development 中
 * 2. 确保 `src/data/fallback/freeinfo_fallback.json` 文件存在且数据完整
 * 3. 系统会在 API 失败时自动回退到本地 JSON 数据
 * 
 * 删除计划：
 * - 当后端数据库正式上线且功能稳定后删除此功能
 * - 删除步骤：
 *   1. 删除 src/data/fallback/freeinfo_fallback.json 文件
 *   2. 删除本文件中的 LOCAL_JSON_FALLBACK 相关代码
 *   3. 删除 .env.development 中的 VITE_USE_LOCAL_JSON_FALLBACK 配置
 * ============================================================
 */
import freeinfoFallbackData from '@/data/fallback/freeinfo_fallback.json'
import daytripFallbackData from '@/data/fallback/daytrip_fallback.json'

// 是否启用本地 JSON 兜底（可通过环境变量控制）
const USE_LOCAL_JSON_FALLBACK = import.meta.env.VITE_USE_LOCAL_JSON_FALLBACK === 'true'

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

/**
 * [临时开发功能] 检查子导航数据是否有效
 * 用于判断是否需要使用兜底数据
 */
function hasValidSubNavData(data) {
  if (!data || typeof data !== 'object') return false
  return Array.isArray(data.subNav) && data.subNav.length > 0
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
  if (dto?.regionName) tripData.region = dto.regionName
  if (dto?.townName) tripData.town = dto.townName
  if (dto?.postcode) tripData.postcode = dto.postcode
  if (dto?.locationLabel) tripData.locationLabel = dto.locationLabel
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

  if (row.regionName && !tripData.region) tripData.region = row.regionName
  if (row.townName && !tripData.town) tripData.town = row.townName
  if (row.postcode && !tripData.postcode) tripData.postcode = row.postcode
  if (row.locationLabel && !tripData.locationLabel) tripData.locationLabel = row.locationLabel
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

async function fetchSubNavItems(sectionPath, subNavMeta) {
  const subNavKey = buildSubNavKey(sectionPath, subNavMeta.subNavName)
  try {
    const rows = await fetchItemsBySubNavKey(subNavKey)
    return Array.isArray(rows) ? rows.map(mapApiItem).filter(Boolean) : []
  } catch {
    if (isApiEnabled()) {
      notifyApiWarning('后端服务暂不可用，请稍后再试', {
        dedupeKey: 'content:api-failed',
      })
    }
  }
  return []
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
    // [临时开发功能] API 未启用时，尝试使用本地 JSON 兜底
    const fallbackKey = sectionPath === 'trips/freeinfo' ? 'freeinfo' : 'daytrip'
    const fallbackData = loadLocalFallbackData(fallbackKey)
    if (fallbackData) {
      return {
        path: sectionPath,
        subNav: fallbackData.subNav || [],
      }
    }
    return { path: sectionPath, subNav: [] }
  }

  let sectionNav = null
  try {
    const navTree = await loadNavTree()
    sectionNav = Array.isArray(navTree)
      ? navTree.find((item) => item.path === sectionPath)
      : null
  } catch {
    // [临时开发功能] API 调用失败时，尝试使用本地 JSON 兜底
    const fallbackKey = sectionPath === 'trips/freeinfo' ? 'freeinfo' : 'daytrip'
    const fallbackData = loadLocalFallbackData(fallbackKey)
    if (fallbackData) {
      return {
        path: sectionPath,
        subNav: fallbackData.subNav || [],
      }
    }
  }

  if (!sectionNav?.subNav?.length) {
    // [临时开发功能] API 返回空数据时，尝试使用本地 JSON 兜底
    const fallbackKey = sectionPath === 'trips/freeinfo' ? 'freeinfo' : 'daytrip'
    const fallbackData = loadLocalFallbackData(fallbackKey)
    if (fallbackData) {
      return {
        path: sectionPath,
        subNav: fallbackData.subNav || [],
      }
    }
    return { path: sectionPath, subNav: [] }
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

  // [临时开发功能] 检查是否所有子导航的items都为空，如果是则使用兜底数据
  const allItemsEmpty = subNav.every(sub => !Array.isArray(sub.items) || sub.items.length === 0)
  if (allItemsEmpty) {
    const fallbackKey = sectionPath === 'trips/freeinfo' ? 'freeinfo' : 'daytrip'
    const fallbackData = loadLocalFallbackData(fallbackKey)
    if (fallbackData) {
      return {
        path: sectionPath,
        subNav: fallbackData.subNav || [],
      }
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
