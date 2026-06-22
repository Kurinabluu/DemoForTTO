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
} from './scenicLocationMappings.js'

export const UNCATEGORIZED_LOCATION = '暂未分类分区'

/** @type {{ label: string, town: string, postcode: string }[]} */
export const TAS_LOCATION_POSTCODES = [
  { label: 'Hobart 7000', town: 'Hobart', postcode: '7000' },
  { label: 'North Hobart 7000', town: 'North Hobart', postcode: '7000' },
  { label: 'South Hobart 7004', town: 'South Hobart', postcode: '7004' },
  { label: 'Battery Point 7004', town: 'Battery Point', postcode: '7004' },
  { label: 'Sandy Bay 7005', town: 'Sandy Bay', postcode: '7005' },
  { label: 'Taroona 7053', town: 'Taroona', postcode: '7053' },
  { label: 'Kingston 7050', town: 'Kingston', postcode: '7050' },
  { label: 'Huonville 7109', town: 'Huonville', postcode: '7109' },
  { label: 'Richmond 7025', town: 'Richmond', postcode: '7025' },
  { label: 'Cygnet 7112', town: 'Cygnet', postcode: '7112' },
  { label: 'Geeveston 7116', town: 'Geeveston', postcode: '7116' },
  { label: 'Bruny Island 7150', town: 'Bruny Island', postcode: '7150' },
  { label: 'Port Arthur 7182', town: 'Port Arthur', postcode: '7182' },
  { label: 'Tasman Peninsula 7182', town: 'Tasman Peninsula', postcode: '7182' },
  { label: 'Launceston 7250', town: 'Launceston', postcode: '7250' },
  { label: 'Tamar Valley 7275', town: 'Tamar Valley', postcode: '7275' },
  { label: 'Rosevears 7277', town: 'Rosevears', postcode: '7277' },
  { label: 'Beauty Point 7262', town: 'Beauty Point', postcode: '7262' },
  { label: 'Legana 7277', town: 'Legana', postcode: '7277' },
  { label: 'Exeter 7275', town: 'Exeter', postcode: '7275' },
  { label: 'George Town 7253', town: 'George Town', postcode: '7253' },
  { label: 'Grindelwald 7277', town: 'Grindelwald', postcode: '7277' },
  { label: 'Beaconsfield 7270', town: 'Beaconsfield', postcode: '7270' },
  { label: 'Deloraine 7304', town: 'Deloraine', postcode: '7304' },
  { label: 'Riverside 7250', town: 'Riverside', postcode: '7250' },
  { label: 'Prospect 7250', town: 'Prospect', postcode: '7250' },
  { label: 'Swansea 7190', town: 'Swansea', postcode: '7190' },
  { label: 'Bicheno 7215', town: 'Bicheno', postcode: '7215' },
  { label: 'Coles Bay 7215', town: 'Coles Bay', postcode: '7215' },
  { label: 'St Helens 7216', town: 'St Helens', postcode: '7216' },
  { label: 'Orford 7190', town: 'Orford', postcode: '7190' },
  { label: 'Scamander 7215', town: 'Scamander', postcode: '7215' },
  { label: 'Freycinet 7215', town: 'Freycinet', postcode: '7215' },
  { label: 'St Marys 7214', town: 'St Marys', postcode: '7214' },
  { label: 'Triabunna 7190', town: 'Triabunna', postcode: '7190' },
  { label: 'Flinders Island 7255', town: 'Flinders Island', postcode: '7255' },
  { label: 'Devonport 7310', town: 'Devonport', postcode: '7310' },
  { label: 'Burnie 7320', town: 'Burnie', postcode: '7320' },
  { label: 'Ulverstone 7315', town: 'Ulverstone', postcode: '7315' },
  { label: 'Wynyard 7325', town: 'Wynyard', postcode: '7325' },
  { label: 'Smithton 7330', town: 'Smithton', postcode: '7330' },
  { label: 'Penguin 7316', town: 'Penguin', postcode: '7316' },
  { label: 'Stanley 7331', town: 'Stanley', postcode: '7331' },
  { label: 'Somerset 7322', town: 'Somerset', postcode: '7322' },
  { label: 'Latrobe 7307', town: 'Latrobe', postcode: '7307' },
  { label: 'Sheffield 7306', town: 'Sheffield', postcode: '7306' },
  { label: 'Railton 7305', town: 'Railton', postcode: '7305' },
  { label: 'Cradle Mountain 7306', town: 'Cradle Mountain', postcode: '7306' },
  { label: 'Moina 7310', town: 'Moina', postcode: '7310' },
  { label: 'Mole Creek 7304', town: 'Mole Creek', postcode: '7304' },
  { label: 'Wilmot 7310', town: 'Wilmot', postcode: '7310' },
  { label: 'Strahan 7468', town: 'Strahan', postcode: '7468' },
  { label: 'Queenstown 7467', town: 'Queenstown', postcode: '7467' },
  { label: 'Zeehan 7469', town: 'Zeehan', postcode: '7469' },
  { label: 'Rosebery 7470', town: 'Rosebery', postcode: '7470' },
  { label: 'Tullah 7321', town: 'Tullah', postcode: '7321' },
  { label: 'Granville 7469', town: 'Granville', postcode: '7469' },
  { label: 'Corinna 7467', town: 'Corinna', postcode: '7467' },
  { label: 'Trial Harbour 7466', town: 'Trial Harbour', postcode: '7466' },
  { label: 'Oatlands 7120', town: 'Oatlands', postcode: '7120' },
  { label: 'Bothwell 7030', town: 'Bothwell', postcode: '7030' },
  { label: 'Ross 7209', town: 'Ross', postcode: '7209' },
  { label: 'Campbell Town 7210', town: 'Campbell Town', postcode: '7210' },
  { label: 'Kempton 7030', town: 'Kempton', postcode: '7030' },
  { label: 'Perth 7300', town: 'Perth', postcode: '7300' },
  { label: 'Longford 7301', town: 'Longford', postcode: '7301' },
  { label: 'Miena 7030', town: 'Miena', postcode: '7030' },
  { label: 'Currie 7256', town: 'Currie', postcode: '7256' },
  { label: 'Naracoopa 7256', town: 'Naracoopa', postcode: '7256' },
  { label: 'Moonah 7009', town: 'Moonah', postcode: '7009' },
  { label: 'Glenorchy 7010', town: 'Glenorchy', postcode: '7010' },
  { label: 'Berriedale 7011', town: 'Berriedale', postcode: '7011' },
  { label: 'Derwent Park 7009', town: 'Derwent Park', postcode: '7009' },
  { label: 'Fern Tree 7054', town: 'Fern Tree', postcode: '7054' },
  { label: 'New Norfolk 7140', town: 'New Norfolk', postcode: '7140' },
  { label: 'Sorell 7172', town: 'Sorell', postcode: '7172' },
  { label: 'Brighton 7030', town: 'Brighton', postcode: '7030' },
  { label: 'Cambridge 7170', town: 'Cambridge', postcode: '7170' },
  { label: 'Westbury 7303', town: 'Westbury', postcode: '7303' },
  { label: 'Evandale 7212', town: 'Evandale', postcode: '7212' },
  { label: 'Hadspen 7290', town: 'Hadspen', postcode: '7290' },
  { label: 'Carrick 7291', town: 'Carrick', postcode: '7291' },
  { label: 'Bishopsbourne 7301', town: 'Bishopsbourne', postcode: '7301' },
  { label: 'Cressy 7302', town: 'Cressy', postcode: '7302' },
  { label: 'Meander 7304', town: 'Meander', postcode: '7304' },
  { label: 'Golden Valley 7304', town: 'Golden Valley', postcode: '7304' },
  { label: 'Elizabeth Town 7304', town: 'Elizabeth Town', postcode: '7304' },
  { label: 'Red Hills 7304', town: 'Red Hills', postcode: '7304' },
  { label: 'Chudleigh 7304', town: 'Chudleigh', postcode: '7304' },
  { label: 'Western Creek 7304', town: 'Western Creek', postcode: '7304' },
  { label: 'Hillwood 7252', town: 'Hillwood', postcode: '7252' },
  { label: 'Windermere 7252', town: 'Windermere', postcode: '7252' },
  { label: 'Bridport 7262', town: 'Bridport', postcode: '7262' },
  { label: 'Scottsdale 7260', town: 'Scottsdale', postcode: '7260' },
  { label: 'Derby 7264', town: 'Derby', postcode: '7264' },
  { label: 'Weldborough 7264', town: 'Weldborough', postcode: '7264' },
  { label: 'Lebrina 7254', town: 'Lebrina', postcode: '7254' },
  { label: 'Low Head 7253', town: 'Low Head', postcode: '7253' },
  { label: 'West Launceston 7250', town: 'West Launceston', postcode: '7250' },
  { label: 'Dolphin Sands 7190', town: 'Dolphin Sands', postcode: '7190' },
  { label: 'Cranbrook 7190', town: 'Cranbrook', postcode: '7190' },
  { label: 'Buckland 7190', town: 'Buckland', postcode: '7190' },
  { label: 'Hamilton 7140', town: 'Hamilton', postcode: '7140' },
  { label: 'Ouse 7140', town: 'Ouse', postcode: '7140' },
  { label: 'Westerway 7140', town: 'Westerway', postcode: '7140' },
  { label: 'Maydena 7140', town: 'Maydena', postcode: '7140' },
  { label: 'Mount Field 7140', town: 'Mount Field', postcode: '7140' },
  { label: 'Dover 7117', town: 'Dover', postcode: '7117' },
  { label: 'Southport 7109', town: 'Southport', postcode: '7109' },
  { label: 'Franklin 7113', town: 'Franklin', postcode: '7113' },
  { label: 'Grove 7109', town: 'Grove', postcode: '7109' },
  { label: 'Woodbridge 7162', town: 'Woodbridge', postcode: '7162' },
  { label: 'Kettering 7155', town: 'Kettering', postcode: '7155' },
  { label: 'Margate 7054', town: 'Margate', postcode: '7054' },
  { label: 'Snug 7054', town: 'Snug', postcode: '7054' },
  { label: 'Dodges Ferry 7173', town: 'Dodges Ferry', postcode: '7173' },
  { label: 'Primrose Sands 7173', town: 'Primrose Sands', postcode: '7173' },
  { label: 'Dunalley 7177', town: 'Dunalley', postcode: '7177' },
  { label: 'Eaglehawk Neck 7179', town: 'Eaglehawk Neck', postcode: '7179' },
  { label: 'Nubeena 7184', town: 'Nubeena', postcode: '7184' },
  { label: 'White Beach 7184', town: 'White Beach', postcode: '7184' },
  { label: 'Taranna 7180', town: 'Taranna', postcode: '7180' },
  { label: 'Murduanna 7178', town: 'Murduanna', postcode: '7178' },
  { label: 'Liawenee 7030', town: 'Liawenee', postcode: '7030' },
  { label: 'Gowrie Park 7306', town: 'Gowrie Park', postcode: '7306' },
  { label: 'Lorinna 7306', town: 'Lorinna', postcode: '7306' },
  { label: 'Waratah 7321', town: 'Waratah', postcode: '7321' },
  { label: 'Savage River 7321', town: 'Savage River', postcode: '7321' },
  { label: 'Temma 7330', town: 'Temma', postcode: '7330' },
  { label: 'Marrawah 7330', town: 'Marrawah', postcode: '7330' },
  { label: 'Arthur River 7330', town: 'Arthur River', postcode: '7330' },
  { label: 'Sisters Beach 7321', town: 'Sisters Beach', postcode: '7321' },
  { label: 'Boat Harbour 7321', town: 'Boat Harbour', postcode: '7321' },
  { label: 'Rocky Cape 7321', town: 'Rocky Cape', postcode: '7321' },
  { label: 'Port Sorell 7307', town: 'Port Sorell', postcode: '7307' },
  { label: 'Hawley Beach 7307', town: 'Hawley Beach', postcode: '7307' },
  { label: 'Turners Beach 7315', town: 'Turners Beach', postcode: '7315' },
  { label: 'Spreyton 7310', town: 'Spreyton', postcode: '7310' },
  { label: 'Don 7310', town: 'Don', postcode: '7310' },
  { label: 'Quoiba 7310', town: 'Quoiba', postcode: '7310' },
  { label: 'South Burnie 7320', town: 'South Burnie', postcode: '7320' },
]

const locationOrderMap = new Map(TAS_LOCATION_POSTCODES.map((item, index) => [item.label, index]))

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
    item?.route,
    tripData.route,
    tripData.desc,
    item?.region,
    tripData.region,
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
  return String(item?.locationLabel || tripData.locationLabel || '').trim()
}

export function isSubSpotItem(item) {
  const { belongsToSpot } = inferItemLocation(item)
  if (!belongsToSpot) return false
  if (isMainDestinationItem(item)) return false
  return true
}

export function resolveLocationLabel(item) {
  const fromDb = getLocationLabelFromDb(item)
  if (fromDb) return fromDb

  const town = getGroupingTownFromItem(item)
  if (!town) return UNCATEGORIZED_LOCATION

  const defaultPostcode = townDefaultPostcodeMap.get(town.toLowerCase()) || ''
  const extractedPostcode = extractPostcodeFromItem(item)
  let postcode = defaultPostcode

  if (extractedPostcode) {
    const extractedLabel = townPostcodeLabelMap.get(`${town.toLowerCase()}::${extractedPostcode}`)
    if (extractedLabel) {
      postcode = extractedPostcode
    }
  }

  if (postcode) {
    const mapped = townPostcodeLabelMap.get(`${town.toLowerCase()}::${postcode}`)
    if (mapped) return mapped
    return `${town} ${postcode}`
  }
  return town
}

export function getLocationSortOrder(item) {
  const label = resolveLocationLabel(item)
  if (label === UNCATEGORIZED_LOCATION) return 9999
  if (locationOrderMap.has(label)) return locationOrderMap.get(label)
  return 9998
}

export function getSubSpotSortOrder(item) {
  return isSubSpotItem(item) ? 1 : 0
}

export function buildLocationOptionsFromItems(items = []) {
  const labels = new Set(TAS_LOCATION_POSTCODES.map((item) => item.label))

  items.forEach((item) => {
    const label = resolveLocationLabel(item)
    if (label && label !== UNCATEGORIZED_LOCATION) {
      labels.add(label)
    }
  })

  return Array.from(labels).sort((left, right) => {
    const leftOrder = locationOrderMap.has(left) ? locationOrderMap.get(left) : 9998
    const rightOrder = locationOrderMap.has(right) ? locationOrderMap.get(right) : 9998
    if (leftOrder !== rightOrder) return leftOrder - rightOrder
    return left.localeCompare(right, 'en')
  })
}

export function getTownByLocationLabel(label) {
  if (label === UNCATEGORIZED_LOCATION) return ''
  const matched = TAS_LOCATION_POSTCODES.find((item) => item.label === label)
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
