import freeInfoFallback from '@/data/split/freeinfo.json'
import dayTripFallback from '@/data/split/daytrip.json'
import { buildSubNavKey } from '@/utils/subNavKey'
import { fetchItemDetail, fetchItemsBySubNavKey, fetchNavTree, isApiEnabled } from '@/utils/ttoApi'
import { notifyApiWarning } from '@/utils/apiFeedback'

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

function buildFallbackItemKey(subNavKey, fallbackItem) {
  const title = String(fallbackItem?.title || '').trim()
  const enTitle = String(fallbackItem?.enTitle || '').trim()
  const raw = title || enTitle
  if (!raw) return ''

  const ascii = raw
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const keyPart = ascii || raw.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]+/g, '')
  return keyPart ? `${subNavKey}:${keyPart.substring(0, 96)}` : ''
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

/** 免费信息网格：API 负责 id / 标题等基础字段，本地 JSON 负责更完整的卡片字段 */
function mergeGridSectionItems(apiRows, fallbackItems, subNavKey) {
  if (!Array.isArray(fallbackItems) || !fallbackItems.length) {
    return Array.isArray(apiRows) ? apiRows.map(mapApiItem).filter(Boolean) : []
  }
  if (!Array.isArray(apiRows) || !apiRows.length) {
    return fallbackItems
  }

  const fallbackByTitle = new Map()
  const fallbackByItemKey = new Map()
  for (const item of fallbackItems) {
    if (item?.title) fallbackByTitle.set(item.title, item)
    const itemKey = buildFallbackItemKey(subNavKey, item)
    if (itemKey) fallbackByItemKey.set(itemKey, item)
    if (item?.itemKey) fallbackByItemKey.set(item.itemKey, item)
    const enKey = buildFallbackItemKey(subNavKey, { title: item?.enTitle })
    if (enKey) fallbackByItemKey.set(enKey, item)
  }

  return apiRows.map((row) => {
    const apiItem = mapApiItem(row)
    if (!apiItem) return null
    const fallbackItem =
      fallbackByItemKey.get(apiItem.itemKey) ||
      fallbackByItemKey.get(buildFallbackItemKey(subNavKey, { title: apiItem?.enTitle })) ||
      fallbackByTitle.get(apiItem.title)
    if (!fallbackItem) return apiItem

    return {
      ...fallbackItem,
      ...apiItem,
      tripData: {
        ...(fallbackItem?.tripData || {}),
        ...(apiItem?.tripData || {}),
      },
      img: apiItem.img ?? fallbackItem.img,
      cover: apiItem.cover ?? fallbackItem.cover,
    }
  }).filter(Boolean)
}

export async function loadCatalogItemDetail(itemId) {
  if (itemId == null || itemId === '') return null
  try {
    const dto = await fetchItemDetail(itemId)
    return mapApiDetailToItem(dto)
  } catch (error) {
    console.warn('[contentRepository] detail API fallback:', itemId, error)
    if (isApiEnabled()) {
      throw error
    }
    return null
  }
}

export async function loadItemDetailById(itemId) {
  return loadCatalogItemDetail(itemId)
}

async function fetchSubNavItems(sectionPath, subNavMeta, fallbackItems, fallbackSubNav) {
  const subNavKey = buildSubNavKey(sectionPath, subNavMeta.subNavName)
  const useApiOnlyDayTripData = sectionPath === 'trips/routes' && isApiEnabled()
  const useApiSpecialCardData =
    sectionPath === 'trips/freeinfo' && (subNavMeta?.isGrid === false || fallbackSubNav?.isGrid === false)

  try {
    const rows = await fetchItemsBySubNavKey(subNavKey)
    if (useApiSpecialCardData) {
      return Array.isArray(rows) ? rows.map(mapApiItem).filter(Boolean) : []
    }
    if (sectionPath === 'trips/freeinfo' && (subNavMeta?.isGrid === true || fallbackSubNav?.isGrid === true) && Array.isArray(fallbackItems) && fallbackItems.length) {
      return mergeGridSectionItems(rows, fallbackItems, subNavKey)
    }
    if (useApiOnlyDayTripData) {
      return Array.isArray(rows) ? rows.map(mapApiItem).filter(Boolean) : []
    }
    const items = Array.isArray(rows) ? rows.map(mapApiItem).filter(Boolean) : []
    if (items.length) return items
  } catch (error) {
    console.warn('[contentRepository] API fallback:', subNavKey, error)
    if (isApiEnabled()) {
      const hasFallback = Array.isArray(fallbackItems) && fallbackItems.length > 0
      if (useApiOnlyDayTripData || !hasFallback) {
        notifyApiWarning('暂时无法加载，请稍后再试', {
          dedupeKey: 'content:api-failed',
        })
      }
    }
  }
  return Array.isArray(fallbackItems) ? fallbackItems : []
}

export async function loadItemsBySubNav(sectionPath, subNavName) {
  const fallback = sectionPath === 'trips/routes' ? dayTripFallback : freeInfoFallback
  const fallbackSubNav = fallback?.subNav?.find((item) => item.subNavName === subNavName)
  const fallbackItems = fallbackSubNav?.items

  if (!isApiEnabled()) {
    return Array.isArray(fallbackItems) ? fallbackItems : []
  }

  const subNavMeta = { subNavName }
  return fetchSubNavItems(sectionPath, subNavMeta, fallbackItems, fallbackSubNav)
}

async function loadSectionBundle(sectionPath, fallback) {
  if (!isApiEnabled()) {
    return fallback
  }

  let sectionNav = null
  try {
    const navTree = await loadNavTree()
    sectionNav = Array.isArray(navTree)
      ? navTree.find((item) => item.path === sectionPath)
      : null
  } catch (error) {
    console.warn('[contentRepository] nav API fallback:', sectionPath, error)
  }

  if (!sectionNav?.subNav?.length) {
    return fallback
  }

  const subNav = await Promise.all(
    sectionNav.subNav.map(async (subNavMeta) => {
      const fallbackSubNav = fallback?.subNav?.find(
        (item) => item.subNavName === subNavMeta.subNavName
      )
      const fallbackItems = sectionPath === 'trips/routes' ? [] : fallbackSubNav?.items
      const items = await fetchSubNavItems(
        sectionPath,
        subNavMeta,
        fallbackItems,
        fallbackSubNav
      )
      return {
        ...(fallbackSubNav || {}),
        ...subNavMeta,
        items,
      }
    })
  )

  return {
    ...(fallback || {}),
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
    freeInfoPromise = loadSectionBundle('trips/freeinfo', freeInfoFallback)
  }
  return freeInfoPromise
}

export async function loadFreeInfoDataFresh() {
  return loadSectionBundle('trips/freeinfo', freeInfoFallback)
}

export async function loadDayTripData() {
  if (!dayTripPromise) {
    dayTripPromise = loadSectionBundle('trips/routes', dayTripFallback).then((bundle) => {
      return Array.isArray(bundle?.subNav) ? bundle.subNav : []
    })
  }
  return dayTripPromise
}

export async function loadDayTripDataFresh() {
  const bundle = await loadSectionBundle('trips/routes', dayTripFallback)
  return Array.isArray(bundle?.subNav) ? bundle.subNav : []
}
