import {
  MAIN_DESTINATION_EN_TITLES,
  MAIN_DESTINATION_TITLES,
  SPOT_PARENT_BY_EN_TITLE,
  SPOT_PARENT_BY_TITLE,
  SPOT_PARENT_DISPLAY_NAMES,
  SPOT_PARENT_TOWN_MAP,
  TOWN_BY_EN_TITLE_ALIAS,
  TOWN_BY_TEXT,
  VALID_SPOT_PARENT_KEYS,
  REGIONAL_BELONGS_TO_SPOT_DISPLAY_NAMES,
} from './scenicLocationMappings.js'
import tasLocationPostcodesCatalog from '../data/tas-location-postcodes.json' with { type: 'json' }

export const UNCATEGORIZED_LOCATION = '暂未分类'

/** 排序模式常量 */
export const SORT_MODES = {
  POSTCODE: 'postcode',
  NAME_EN: 'nameEn',
  NAME_ZH: 'nameZh',
}

/** 排序模式显示标签 */
export const SORT_MODE_LABELS = {
  [SORT_MODES.POSTCODE]: '按邮编排序',
  [SORT_MODES.NAME_EN]: '按英文名排序',
  [SORT_MODES.NAME_ZH]: '按中文名排序',
}

let LOCATION_CATALOG_ENTRIES = []

function isValidLocationLabel(label) {
  if (!label || label === UNCATEGORIZED_LOCATION) return false
  const { postcode } = splitLocationLabel(label)
  return /^\d{4}$/.test(postcode)
}

export function formatLocationLabel(town, postcode) {
  const townText = String(town || '').trim()
  const pc = String(postcode || '').trim()
  if (!townText || !/^\d{4}$/.test(pc)) return ''
  return `${townText} ${pc}`
}

function resolveLocationLabelFromFields(town, postcode, legacyLabel = '') {
  const derived = formatLocationLabel(town, postcode)
  if (derived) return derived
  const legacy = String(legacyLabel || '').trim()
  if (isValidLocationLabel(legacy)) return legacy
  const fromCatalog = TAS_LOCATION_POSTCODES.find(
    (entry) => entry.town === town && entry.postcode === postcode
  )
  if (fromCatalog?.label) return fromCatalog.label
  return ''
}

function normalizeLocationEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const town = String(entry.town || entry.townName || '').trim()
  const postcode = String(entry.postcode || '').trim()
  const legacyLabel = String(entry.label || entry.locationLabel || '').trim()
  const resolvedLabel = resolveLocationLabelFromFields(town, postcode, legacyLabel)
  if (!resolvedLabel || resolvedLabel === UNCATEGORIZED_LOCATION) return null
  const resolvedPostcode = postcode || (resolvedLabel.match(/\b(\d{4})\b$/)?.[1] || '')
  if (!/^\d{4}$/.test(resolvedPostcode)) return null
  const nameZh = String(entry.nameZh || entry.name_zh || '').trim()
  return {
    label: resolvedLabel,
    town: town || resolvedLabel.replace(/\s+\d{4}$/, ''),
    postcode: resolvedPostcode,
    ...(nameZh ? { nameZh } : {}),
  }
}

export function setLocationCatalogEntries(entries = []) {
  const unique = new Map()
    ; (Array.isArray(entries) ? entries : []).forEach((entry) => {
      const normalized = normalizeLocationEntry(entry)
      if (normalized && !unique.has(normalized.label)) {
        unique.set(normalized.label, normalized)
      }
    })
  LOCATION_CATALOG_ENTRIES = Array.from(unique.values())
  return LOCATION_CATALOG_ENTRIES.length
}

export function getLocationCatalogEntryCount() {
  return getCatalogEntries().length
}

export function buildLocationCatalogFromItems(items = []) {
  return collectLocationEntries(items)
}

function getCatalogEntries() {
  return Array.isArray(LOCATION_CATALOG_ENTRIES) ? LOCATION_CATALOG_ENTRIES : []
}

function splitLocationLabel(label) {
  const text = String(label || '').trim()
  if (!text) return { town: '', postcode: '' }
  const parts = text.split(/\s+/)
  const postcode = parts.length >= 2 && /^\d{4}$/.test(parts[parts.length - 1]) ? parts[parts.length - 1] : ''
  const town = postcode ? parts.slice(0, -1).join(' ') : text
  return { town, postcode }
}

function buildLocationEntryFromItem(item) {
  const tripData = getTripData(item)
  const town = String(
    item?.town
      || item?.townName
      || tripData.town
      || tripData.townName
      || getTownFromItem(item)
      || ''
  ).trim()
  const postcode = String(
    item?.postcode
      || tripData.postcode
      || extractPostcodeFromItem(item)
      || ''
  ).trim()

  if (town && postcode && /^\d{4}$/.test(postcode)) {
    const fromFields = normalizeLocationEntry({ town, postcode })
    if (fromFields) return fromFields
  }

  const fromDb = getLocationLabelFromDb(item)
  if (isValidLocationLabel(fromDb)) {
    const normalized = normalizeLocationEntry({ label: fromDb, town, postcode })
    if (normalized) return normalized
  }

  if (town) {
    const matched = getCatalogEntries().find((entry) => entry.town.toLowerCase() === town.toLowerCase())
    if (matched) return matched
  }

  if (postcode && /^\d{4}$/.test(postcode)) {
    const matched = getCatalogEntries().find((entry) => entry.postcode === postcode && entry.town)
    if (matched) return matched
  }

  return null
}

function collectLocationEntries(items = []) {
  const unique = new Map()

  getCatalogEntries().forEach((entry) => {
    const normalized = normalizeLocationEntry(entry)
    if (normalized && !unique.has(normalized.label)) {
      unique.set(normalized.label, normalized)
    }
  })

    ; (Array.isArray(items) ? items : []).forEach((item) => {
      const entry = buildLocationEntryFromItem(item)
      if (entry && !unique.has(entry.label)) {
        unique.set(entry.label, entry)
      }
    })

  return Array.from(unique.values())
}

function sortLocationEntries(entries = [], mode = SORT_MODES.POSTCODE) {
  const list = Array.isArray(entries) ? [...entries] : []
  return list.sort((left, right) => compareLocationEntries(left, right, mode))
}

function compareLocationEntries(left, right, mode = SORT_MODES.POSTCODE) {
  if (mode === SORT_MODES.POSTCODE) {
    const leftPostcode = String(left?.postcode || left?.label?.match(/\b(\d{4})\b$/)?.[1] || '')
    const rightPostcode = String(right?.postcode || right?.label?.match(/\b(\d{4})\b$/)?.[1] || '')
    const leftNum = /^\d{4}$/.test(leftPostcode) ? parseInt(leftPostcode, 10) : 9999
    const rightNum = /^\d{4}$/.test(rightPostcode) ? parseInt(rightPostcode, 10) : 9999
    if (leftNum !== rightNum) return leftNum - rightNum

    const leftTown = String(left?.town || splitLocationLabel(left?.label).town || left?.label || '')
    const rightTown = String(right?.town || splitLocationLabel(right?.label).town || right?.label || '')
    const townDiff = leftTown.localeCompare(rightTown, 'en', { sensitivity: 'base' })
    if (townDiff !== 0) return townDiff

    return String(left?.label || '').localeCompare(String(right?.label || ''), 'en', { sensitivity: 'base' })
  }

  if (mode === SORT_MODES.NAME_ZH) {
    const leftZh = getLocationDisplayLabel(left?.label, SORT_MODES.NAME_ZH)
    const rightZh = getLocationDisplayLabel(right?.label, SORT_MODES.NAME_ZH)
    const zhDiff = leftZh.localeCompare(rightZh, 'zh', { sensitivity: 'base' })
    if (zhDiff !== 0) return zhDiff
    return String(left?.label || '').localeCompare(String(right?.label || ''), 'en', { sensitivity: 'base' })
  }

  const leftName = String(left?.town || splitLocationLabel(left?.label).town || left?.label || '')
  const rightName = String(right?.town || splitLocationLabel(right?.label).town || right?.label || '')
  const enDiff = leftName.localeCompare(rightName, 'en', { sensitivity: 'base' })
  if (enDiff !== 0) return enDiff
  return String(left?.label || '').localeCompare(String(right?.label || ''), 'en', { sensitivity: 'base' })
}

/** @type {{ label: string, town: string, postcode: string, nameZh: string }[]} */
export const TAS_LOCATION_POSTCODES = tasLocationPostcodesCatalog

/** belongsToSpot 展示名：主景点中文名 → 区域名 → 地点目录 nameZh → 原值 */
export function resolveBelongsToSpotDisplayName(spotKey) {
  const key = String(spotKey || '').trim()
  if (!key) return ''
  if (SPOT_PARENT_DISPLAY_NAMES[key]) return SPOT_PARENT_DISPLAY_NAMES[key]
  if (REGIONAL_BELONGS_TO_SPOT_DISPLAY_NAMES[key]) return REGIONAL_BELONGS_TO_SPOT_DISPLAY_NAMES[key]
  const entry = TAS_LOCATION_POSTCODES.find((row) => row.town.toLowerCase() === key.toLowerCase())
  if (entry?.nameZh) return entry.nameZh
  return key
}

/** 预计算三种排序模式的列表 */
const SORTED_BY_POSTCODE = [...TAS_LOCATION_POSTCODES]

const SORTED_BY_NAME_EN = [...TAS_LOCATION_POSTCODES].sort((a, b) =>
  a.town.localeCompare(b.town, 'en', { sensitivity: 'base' })
)

const SORTED_BY_NAME_ZH = [...TAS_LOCATION_POSTCODES].sort((a, b) =>
  a.nameZh.localeCompare(b.nameZh, 'zh-Hans-CN')
)

/** 构建排序映射（label → index） */
function buildOrderMap(sortedList) {
  return new Map(sortedList.map((item, index) => [item.label, index]))
}

const postcodeOrderMap = buildOrderMap(SORTED_BY_POSTCODE)
const nameEnOrderMap = buildOrderMap(SORTED_BY_NAME_EN)
const nameZhOrderMap = buildOrderMap(SORTED_BY_NAME_ZH)

/** 根据排序模式获取对应的 orderMap */
function getOrderMap(mode) {
  if (mode === SORT_MODES.NAME_EN) return nameEnOrderMap
  if (mode === SORT_MODES.NAME_ZH) return nameZhOrderMap
  return postcodeOrderMap
}

const townDefaultPostcodeMap = new Map(
  TAS_LOCATION_POSTCODES.map((item) => [item.town.toLowerCase(), item.postcode]),
)

const townPostcodeLabelMap = new Map(
  TAS_LOCATION_POSTCODES.map((item) => [`${item.town.toLowerCase()}::${item.postcode}`, item.label]),
)

const townByLower = new Map(TAS_LOCATION_POSTCODES.map((item) => [item.town.toLowerCase(), item.town]))

const sortedTownsByLength = [...TAS_LOCATION_POSTCODES].sort(
  (left, right) => right.town.length - left.town.length,
)

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getTripData(item) {
  return item?.tripData && typeof item.tripData === 'object' ? item.tripData : {}
}

function collectTextFields(item) {
  const tripData = getTripData(item)
  const featureTexts = Array.isArray(tripData.features)
    ? tripData.features.map((row) => String(row?.desc || row?.title || ''))
    : []
  return [
    item?.title,
    item?.enTitle,
    item?.location,
    item?.locationLabel,
    item?.townName,
    item?.postcode,
    item?.route,
    tripData.route,
    tripData.location,
    tripData.townName,
    tripData.desc,
    tripData.locationLabel,
    tripData.town,
    tripData.postcode,
    ...featureTexts,
  ]
}

function collectItemTextJoined(item) {
  return collectTextFields(item)
    .map((raw) => String(raw || '').trim())
    .filter(Boolean)
    .join(' ')
}

function isMainDestinationItem(item) {
  const enTitle = String(item?.enTitle || '').trim()
  const title = String(item?.title || '').trim()
  if (MAIN_DESTINATION_EN_TITLES.has(enTitle)) return true
  if (MAIN_DESTINATION_TITLES.has(title)) return true
  if (enTitle && townByLower.has(enTitle.toLowerCase()) && !SPOT_PARENT_BY_EN_TITLE[enTitle]) {
    return true
  }
  return false
}

function inferBelongsToSpotFromContent(item) {
  const enTitle = String(item?.enTitle || '').trim()
  const title = String(item?.title || '').trim()
  if (isMainDestinationItem(item)) return ''

  if (SPOT_PARENT_BY_EN_TITLE[enTitle]) return SPOT_PARENT_BY_EN_TITLE[enTitle]
  if (SPOT_PARENT_BY_TITLE[title]) return SPOT_PARENT_BY_TITLE[title]
  return ''
}

function readLegacyBelongsToSpot(item) {
  const tripData = getTripData(item)
  const legacyTown = String(item?.belongsToTown || tripData.belongsToTown || '').trim()
  if (legacyTown && VALID_SPOT_PARENT_KEYS.has(legacyTown)) {
    return legacyTown
  }
  return ''
}

function inferTownFromAddressText(text) {
  const normalized = String(text || '').trim()
  if (!normalized) return ''

  for (const entry of sortedTownsByLength) {
    const escaped = escapeRegExp(entry.town)
    const withPostcode = new RegExp(`\\b${escaped}\\b[^\\d]{0,60}\\bTAS?\\s*${entry.postcode}\\b`, 'i')
    if (withPostcode.test(normalized)) return entry.town
    if (new RegExp(`^\\s*${escaped}\\s*,`, 'i').test(normalized)) return entry.town
  }

  for (const entry of sortedTownsByLength) {
    if (new RegExp(`\\b${escapeRegExp(entry.town)}\\b`, 'i').test(normalized)) {
      return entry.town
    }
  }

  const postcodeMatch = normalized.match(/\bTAS?\s*(\d{4})\b/i) || normalized.match(/\b(\d{4})\b/)
  if (postcodeMatch) {
    const byPostcode = TAS_LOCATION_POSTCODES.find((entry) => entry.postcode === postcodeMatch[1])
    if (byPostcode) return byPostcode.town
  }

  return ''
}

function inferTownFromContent(item, belongsToSpot) {
  const enTitle = String(item?.enTitle || '').trim()
  const title = String(item?.title || '').trim()
  const tripData = getTripData(item)

  if (belongsToSpot && SPOT_PARENT_TOWN_MAP[belongsToSpot]) {
    return SPOT_PARENT_TOWN_MAP[belongsToSpot]
  }

  if (enTitle && townByLower.has(enTitle.toLowerCase())) {
    return townByLower.get(enTitle.toLowerCase())
  }

  if (enTitle && TOWN_BY_EN_TITLE_ALIAS[enTitle]) {
    return TOWN_BY_EN_TITLE_ALIAS[enTitle]
  }

  const route = String(tripData.route || item?.route || '').trim()
  const fromRoute = inferTownFromAddressText(route)
  if (fromRoute) return fromRoute

  const fromText = inferTownFromAddressText(collectItemTextJoined(item))
  if (fromText) return fromText

  for (const rule of TOWN_BY_TEXT) {
    const text = collectItemTextJoined(item)
    if (rule.pattern.test(text)) return rule.town
  }

  if (title && townByLower.has(title.toLowerCase())) {
    return townByLower.get(title.toLowerCase())
  }

  return ''
}

/** 从 tripData 字段 + 地址/描述推断 town / belongsToSpot */
export function inferItemLocation(item) {
  const tripData = getTripData(item)
  let belongsToSpot = String(item?.belongsToSpot || tripData.belongsToSpot || '').trim()
  let town = String(item?.town || tripData.town || '').trim()

  if (!belongsToSpot) {
    belongsToSpot = inferBelongsToSpotFromContent(item)
  }
  if (!belongsToSpot) {
    belongsToSpot = readLegacyBelongsToSpot(item)
  }
  if (!town) {
    town = inferTownFromContent(item, belongsToSpot)
  }

  if (belongsToSpot && isMainDestinationItem(item)) {
    belongsToSpot = ''
  }

  return { town, belongsToSpot }
}

export function extractPostcodeFromItem(item) {
  for (const raw of collectTextFields(item)) {
    const text = String(raw || '')
    const tasMatch = text.match(/\bTAS?\s*(\d{4})\b/i)
    if (tasMatch) return tasMatch[1]
    const plainMatch = text.match(/\b(\d{4})\b/)
    if (plainMatch) return plainMatch[1]
  }
  return ''
}

export function getBelongsToSpotFromItem(item) {
  return inferItemLocation(item).belongsToSpot
}

export function getTownFromItem(item) {
  return inferItemLocation(item).town
}

/** 列表分组仅按 town（地点+邮编），优先读数据库字段 */
export function getGroupingTownFromItem(item) {
  const tripData = item?.tripData && typeof item.tripData === 'object' ? item.tripData : {}
  const town = String(item?.town || tripData.town || '').trim()
  if (town) return town
  return inferItemLocation(item).town
}

export function getLocationLabelFromDb(item) {
  const tripData = item?.tripData && typeof item.tripData === 'object' ? item.tripData : {}
  const town = String(item?.town || item?.townName || tripData.town || tripData.townName || '').trim()
  const postcode = String(item?.postcode || tripData.postcode || '').trim()
  const derived = resolveLocationLabelFromFields(
    town,
    postcode,
    item?.locationLabel || tripData.locationLabel || ''
  )
  return derived
}

export function isSubSpotItem(item) {
  const { belongsToSpot } = inferItemLocation(item)
  if (!belongsToSpot) return false
  if (isMainDestinationItem(item)) return false
  return true
}

export function resolveLocationLabel(item) {
  const entry = buildLocationEntryFromItem(item)
  if (entry?.label) return entry.label

  const fromDb = getLocationLabelFromDb(item)
  if (isValidLocationLabel(fromDb)) return fromDb

  return UNCATEGORIZED_LOCATION
}

export function getLocationSortOrder(item, mode = SORT_MODES.POSTCODE) {
  const label = resolveLocationLabel(item)
  if (label === UNCATEGORIZED_LOCATION) return 9999
  const { town, postcode } = splitLocationLabel(label)
  if (mode === SORT_MODES.POSTCODE) {
    return /^\d{4}$/.test(postcode) ? parseInt(postcode, 10) : 9998
  }
  const normalized = String(town || label).toLowerCase()
  let score = 0
  for (const char of normalized.slice(0, 6)) {
    score = score * 100 + char.charCodeAt(0)
  }
  return score || 9998
}

export function getSubSpotSortOrder(item) {
  return isSubSpotItem(item) ? 1 : 0
}

export function buildLocationOptionsFromItems(items = [], mode = SORT_MODES.POSTCODE) {
  return sortLocationEntries(collectLocationEntries(items), mode).map((entry) => entry.label)
}

/**
 * 构建按邮编分组的选项列表，供 el-option-group 使用
 * @param {Array} items - 当前子标签下的条目列表
 * @param {string} mode - 排序模式
 * @returns {Array<{label: string, options: Array<{label: string, value: string}>}>}
 */
export function getLocationOptionGroups(items = [], mode = SORT_MODES.POSTCODE) {
  const sortedEntries = sortLocationEntries(collectLocationEntries(items), mode)

  const groups = new Map()
  sortedEntries.forEach((entry) => {
    const postcode = entry.postcode || splitLocationLabel(entry.label).postcode
    if (!groups.has(postcode)) {
      groups.set(postcode, [])
    }
    groups.get(postcode).push({ label: entry.town || splitLocationLabel(entry.label).town || entry.label, value: entry.label })
  })

  return Array.from(groups.entries()).map(([postcode, options]) => ({
    label: postcode,
    options,
  }))
}

function buildLocationLazyGroups(items = [], mode = SORT_MODES.POSTCODE) {
  const sortedEntries = sortLocationEntries(collectLocationEntries(items), mode)
  const hasUncategorized = sortedEntries.some((entry) => entry.label === UNCATEGORIZED_LOCATION)
    || (Array.isArray(items) ? items : []).some((item) => resolveLocationLabel(item) === UNCATEGORIZED_LOCATION)
  const isPostcodeMode = mode === SORT_MODES.POSTCODE
  const groupMap = new Map()

  sortedEntries.forEach((entry) => {
    const { postcode } = splitLocationLabel(entry.label)
    let firstLevelKey
    if (isPostcodeMode) {
      firstLevelKey = postcode
    } else {
      firstLevelKey = (entry.town || splitLocationLabel(entry.label).town || entry.label).charAt(0).toUpperCase()
    }

    if (!firstLevelKey) return

    if (!groupMap.has(firstLevelKey)) {
      groupMap.set(firstLevelKey, [])
    }
    groupMap.get(firstLevelKey).push(entry)
  })

  const firstLevelKeys = Array.from(groupMap.keys()).sort((a, b) => {
    if (isPostcodeMode) {
      const numA = parseInt(a, 10)
      const numB = parseInt(b, 10)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    }
    return a.localeCompare(b, 'en')
  })

  if (hasUncategorized) {
    firstLevelKeys.push(UNCATEGORIZED_LOCATION)
  }

  return { firstLevelKeys, groupMap }
}

/**
 * 构建 Cascader 完整选项树（非 lazy），供 filterable 搜索使用。
 * API 模式下目录来自 setLocationCatalogEntries（/tto/locations）。
 */
export function buildLocationCascaderOptions(items = [], mode = SORT_MODES.POSTCODE) {
  const { firstLevelKeys, groupMap } = buildLocationLazyGroups(items, mode)
  return firstLevelKeys.map((key) => {
    if (key === UNCATEGORIZED_LOCATION) {
      return { value: key, label: key }
    }
    const locations = groupMap.get(key) || []
    return {
      value: key,
      label: key,
      children: locations.map((loc) => ({
        value: loc.label,
        label: getLocationDisplayLabel(
          loc.label,
          mode,
        ) || loc.town || splitLocationLabel(loc.label).town || loc.label,
      })),
    }
  })
}

/** el-cascader filter-method：支持英文名、中文名、邮编、完整 locationLabel */
export function locationCascaderFilterMethod(node, keyword) {
  const kw = String(keyword || '').trim().toLowerCase()
  if (!kw) return true

  const label = String(node?.label || node?.text || '').toLowerCase()
  if (label.includes(kw)) return true

  const value = String(node?.value || '')
  if (value.toLowerCase().includes(kw)) return true

  const fromCatalog = getCatalogEntries().find((entry) => entry.label === value)
  if (fromCatalog) {
    if (String(fromCatalog.town || '').toLowerCase().includes(kw)) return true
    if (String(getLocationDisplayLabel(fromCatalog.label, SORT_MODES.NAME_ZH) || '').toLowerCase().includes(kw)) {
      return true
    }
    if (String(fromCatalog.postcode || '').includes(kw)) return true
  }

  const catalogEntry = TAS_LOCATION_POSTCODES.find((entry) => entry.label === value)
  if (catalogEntry) {
    if (String(catalogEntry.town || '').toLowerCase().includes(kw)) return true
    if (String(catalogEntry.nameZh || '').toLowerCase().includes(kw)) return true
    if (String(catalogEntry.postcode || '').includes(kw)) return true
  }

  const { town, postcode } = splitLocationLabel(value)
  if (town.toLowerCase().includes(kw)) return true
  if (postcode.includes(kw)) return true

  return false
}

/**
 * 构建 Cascader 懒加载数据
 * 供 el-cascader 的 lazyLoad 回调使用
 * API 模式下目录来自 setLocationCatalogEntries（/tto/locations），在每次展开时重新读取最新目录
 * @param {Array} items - 当前子标签下的条目列表（API 模式传空数组）
 * @param {string} mode - 排序模式
 * @returns {Function} lazyLoad 回调函数 (node, resolve) => void
 */
export function createLocationLazyLoad(items = [], mode = SORT_MODES.POSTCODE) {
  return function lazyLoad(node, resolve) {
    const { firstLevelKeys, groupMap } = buildLocationLazyGroups(items, mode)

    if (node.level === 0) {
      resolve(firstLevelKeys.map((key) => {
        const isUncategorized = key === UNCATEGORIZED_LOCATION
        return {
          value: key,
          label: key,
          leaf: isUncategorized,
        }
      }))
      return
    }

    const locations = groupMap.get(node.value) || []
    resolve(locations.map((loc) => ({
      value: loc.label,
      label: loc.town || splitLocationLabel(loc.label).town || loc.label,
      leaf: true,
    })))
  }
}

/**
 * 获取地点显示标签（中文模式时附加中文名）
 * @param {string} label - 原始标签，如 "Hobart 7000"
 * @param {string} mode - 排序模式
 * @returns {string} 显示标签，如 "霍巴特 Hobart 7000"
 */
export function getLocationDisplayLabel(label, mode = SORT_MODES.POSTCODE) {
  if (!label || label === UNCATEGORIZED_LOCATION) return label
  if (mode !== SORT_MODES.NAME_ZH) return label
  const entry = getCatalogEntries().find((e) => e.label === label)
    || TAS_LOCATION_POSTCODES.find((e) => e.label === label)
  if (entry?.nameZh) {
    return `${entry.nameZh} ${label}`
  }
  return label
}

export function getLocationTitleFromSection(section, mode = SORT_MODES.POSTCODE) {
  const title = String(section?.title || '').trim()
  if (title) return title
  const label = String(section?.label || section?.locationLabel || '').trim()
  if (!label) return ''
  return getLocationDisplayLabel(label, mode)
}

export function getTownByLocationLabel(label) {
  if (label === UNCATEGORIZED_LOCATION) return ''
  const matched = getCatalogEntries().find((item) => item.label === label)
    || TAS_LOCATION_POSTCODES.find((item) => item.label === label)
  if (matched) return matched.town
  const parts = String(label || '').trim().split(/\s+/)
  if (parts.length >= 2) {
    return parts.slice(0, -1).join(' ')
  }
  return ''
}

/** 卡片「隶属于」展示：主景点中文名 */
export function getSpotParentDisplayName(item) {
  if (!isSubSpotItem(item)) return ''
  const spotKey = getBelongsToSpotFromItem(item)
  return SPOT_PARENT_DISPLAY_NAMES[spotKey] || spotKey
}

/** @deprecated 请使用 getSpotParentDisplayName */
export function getSpotContextLabel(item) {
  return getSpotParentDisplayName(item)
}