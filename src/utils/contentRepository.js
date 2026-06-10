import navData from '@/data/split/nav.json'
import freeInfoFallback from '@/data/split/freeinfo.json'
import dayTripFallback from '@/data/split/daytrip.json'
import { buildSubNavKey } from '@/utils/subNavKey'
import { fetchItemDetail, fetchItemsBySubNavKey, isApiEnabled } from '@/utils/ttoApi'

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
    extra.tripData && typeof extra.tripData === 'object' ? { ...extra.tripData } : {}

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
    title: row?.title || extra.title || '',
    enTitle: row?.enTitle ?? extra.enTitle ?? '',
    cover: row?.cover ?? extra.cover,
    img: extra.img ?? row?.img ?? row?.cover ?? row?.thumbnail,
    tripType: itemType,
    itemType,
    tripData,
  }
}

export async function loadCatalogItemDetail(itemId) {
  if (itemId == null || itemId === '') return null
  try {
    const dto = await fetchItemDetail(itemId)
    return mapApiDetailToItem(dto)
  } catch (error) {
    console.warn('[contentRepository] detail API fallback:', itemId, error)
    return null
  }
}

export async function loadItemDetailById(itemId) {
  return loadCatalogItemDetail(itemId)
}

async function fetchSubNavItems(sectionPath, subNavMeta, fallbackItems) {
  const subNavKey = buildSubNavKey(sectionPath, subNavMeta.subNavName)
  try {
    const rows = await fetchItemsBySubNavKey(subNavKey)
    const items = Array.isArray(rows) ? rows.map(mapApiItem).filter(Boolean) : []
    if (items.length) return items
  } catch (error) {
    console.warn('[contentRepository] API fallback:', subNavKey, error)
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
  return fetchSubNavItems(sectionPath, subNavMeta, fallbackItems)
}

async function loadSectionBundle(sectionPath, fallback) {
  if (!isApiEnabled()) {
    return fallback
  }

  const sectionNav = Array.isArray(navData)
    ? navData.find((item) => item.path === sectionPath)
    : null

  if (!sectionNav?.subNav?.length) {
    return fallback
  }

  const subNav = await Promise.all(
    sectionNav.subNav.map(async (subNavMeta) => {
      const fallbackSubNav = fallback?.subNav?.find(
        (item) => item.subNavName === subNavMeta.subNavName
      )
      const items = await fetchSubNavItems(
        sectionPath,
        subNavMeta,
        fallbackSubNav?.items
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

export async function loadFreeInfoData() {
  if (!freeInfoPromise) {
    freeInfoPromise = loadSectionBundle('trips/freeinfo', freeInfoFallback)
  }
  return freeInfoPromise
}

export async function loadDayTripData() {
  if (!dayTripPromise) {
    dayTripPromise = loadSectionBundle('trips/routes', dayTripFallback).then((bundle) => {
      return Array.isArray(bundle?.subNav) ? bundle.subNav : []
    })
  }
  return dayTripPromise
}
