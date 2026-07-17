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
  return {
    label: resolvedLabel,
    town: town || resolvedLabel.replace(/\s+\d{4}$/, ''),
    postcode: resolvedPostcode,
  }
}

export function setLocationCatalogEntries(entries = []) {
  const unique = new Map()
  ;(Array.isArray(entries) ? entries : []).forEach((entry) => {
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
  const town = String(item?.town || tripData.town || getTownFromItem(item) || '').trim()
  const postcode = String(
    item?.postcode || tripData.postcode || extractPostcodeFromItem(item) || ''
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

  ;(Array.isArray(items) ? items : []).forEach((item) => {
    const entry = buildLocationEntryFromItem(item)
    if (entry && !unique.has(entry.label)) {
      unique.set(entry.label, entry)
    }
  })

  return Array.from(unique.values())
}

function sortLocationEntries(entries = [], mode = SORT_MODES.POSTCODE) {
  const list = Array.isArray(entries) ? [...entries] : []
  return list.sort((left, right) => {
    if (mode === SORT_MODES.POSTCODE) {
      const leftPostcode = String(left.postcode || left.label.match(/\b(\d{4})\b$/)?.[1] || '')
      const rightPostcode = String(right.postcode || right.label.match(/\b(\d{4})\b$/)?.[1] || '')
      const leftNum = /^\d{4}$/.test(leftPostcode) ? parseInt(leftPostcode, 10) : 9999
      const rightNum = /^\d{4}$/.test(rightPostcode) ? parseInt(rightPostcode, 10) : 9999
      if (leftNum !== rightNum) return leftNum - rightNum
    }

    const leftName = String(left.town || splitLocationLabel(left.label).town || left.label || '')
    const rightName = String(right.town || splitLocationLabel(right.label).town || right.label || '')
    return leftName.localeCompare(rightName, 'en', { sensitivity: 'base' })
  })
}

/** @type {{ label: string, town: string, postcode: string, nameZh: string }[]} */
export const TAS_LOCATION_POSTCODES = [
  { label: 'Hobart 7000', town: 'Hobart', postcode: '7000', nameZh: '霍巴特' },
  { label: 'North Hobart 7000', town: 'North Hobart', postcode: '7000', nameZh: '北霍巴特' },
  { label: 'Battery Point 7004', town: 'Battery Point', postcode: '7004', nameZh: '巴特里角' },
  { label: 'South Hobart 7004', town: 'South Hobart', postcode: '7004', nameZh: '南霍巴特' },
  { label: 'Sandy Bay 7005', town: 'Sandy Bay', postcode: '7005', nameZh: '桑迪湾' },
  { label: 'Derwent Park 7009', town: 'Derwent Park', postcode: '7009', nameZh: '德文特公园' },
  { label: 'Moonah 7009', town: 'Moonah', postcode: '7009', nameZh: '穆纳' },
  { label: 'Glenorchy 7010', town: 'Glenorchy', postcode: '7010', nameZh: '格伦诺基' },
  { label: 'Berriedale 7011', town: 'Berriedale', postcode: '7011', nameZh: '贝里代尔' },
  { label: 'Richmond 7025', town: 'Richmond', postcode: '7025', nameZh: '里士满' },
  { label: 'Bothwell 7030', town: 'Bothwell', postcode: '7030', nameZh: '博斯韦尔' },
  { label: 'Brighton 7030', town: 'Brighton', postcode: '7030', nameZh: '布莱顿' },
  { label: 'Kempton 7030', town: 'Kempton', postcode: '7030', nameZh: '肯普顿' },
  { label: 'Liawenee 7030', town: 'Liawenee', postcode: '7030', nameZh: '莱文尼' },
  { label: 'Miena 7030', town: 'Miena', postcode: '7030', nameZh: '米纳' },
  { label: 'Kingston 7050', town: 'Kingston', postcode: '7050', nameZh: '金斯顿' },
  { label: 'Taroona 7053', town: 'Taroona', postcode: '7053', nameZh: '塔鲁纳' },
  { label: 'Fern Tree 7054', town: 'Fern Tree', postcode: '7054', nameZh: '芬树' },
  { label: 'Margate 7054', town: 'Margate', postcode: '7054', nameZh: '马盖特' },
  { label: 'Snug 7054', town: 'Snug', postcode: '7054', nameZh: '斯纳格' },
  { label: 'Grove 7109', town: 'Grove', postcode: '7109', nameZh: '格罗夫' },
  { label: 'Huonville 7109', town: 'Huonville', postcode: '7109', nameZh: '休恩维尔' },
  { label: 'Southport 7109', town: 'Southport', postcode: '7109', nameZh: '南港' },
  { label: 'Cygnet 7112', town: 'Cygnet', postcode: '7112', nameZh: '西格尼特' },
  { label: 'Franklin 7113', town: 'Franklin', postcode: '7113', nameZh: '富兰克林' },
  { label: 'Geeveston 7116', town: 'Geeveston', postcode: '7116', nameZh: '吉夫斯顿' },
  { label: 'Dover 7117', town: 'Dover', postcode: '7117', nameZh: '多佛' },
  { label: 'Oatlands 7120', town: 'Oatlands', postcode: '7120', nameZh: '奥特兰兹' },
  { label: 'Hamilton 7140', town: 'Hamilton', postcode: '7140', nameZh: '汉密尔顿' },
  { label: 'Maydena 7140', town: 'Maydena', postcode: '7140', nameZh: '梅迪纳' },
  { label: 'Mount Field 7140', town: 'Mount Field', postcode: '7140', nameZh: '菲尔德山' },
  { label: 'New Norfolk 7140', town: 'New Norfolk', postcode: '7140', nameZh: '新诺福克' },
  { label: 'Ouse 7140', town: 'Ouse', postcode: '7140', nameZh: '乌斯' },
  { label: 'Westerway 7140', town: 'Westerway', postcode: '7140', nameZh: '韦斯特韦' },
  { label: 'Bruny Island 7150', town: 'Bruny Island', postcode: '7150', nameZh: '布鲁尼岛' },
  { label: 'Kettering 7155', town: 'Kettering', postcode: '7155', nameZh: '凯特林' },
  { label: 'Woodbridge 7162', town: 'Woodbridge', postcode: '7162', nameZh: '伍德布里奇' },
  { label: 'Cambridge 7170', town: 'Cambridge', postcode: '7170', nameZh: '剑桥' },
  { label: 'Sorell 7172', town: 'Sorell', postcode: '7172', nameZh: '索雷尔' },
  { label: 'Dodges Ferry 7173', town: 'Dodges Ferry', postcode: '7173', nameZh: '道奇斯费里' },
  { label: 'Primrose Sands 7173', town: 'Primrose Sands', postcode: '7173', nameZh: '报春花沙滩' },
  { label: 'Dunalley 7177', town: 'Dunalley', postcode: '7177', nameZh: '邓纳利' },
  { label: 'Murduanna 7178', town: 'Murduanna', postcode: '7178', nameZh: '默杜纳' },
  { label: 'Eaglehawk Neck 7179', town: 'Eaglehawk Neck', postcode: '7179', nameZh: '鹰颈峡' },
  { label: 'Taranna 7180', town: 'Taranna', postcode: '7180', nameZh: '塔兰纳' },
  { label: 'Port Arthur 7182', town: 'Port Arthur', postcode: '7182', nameZh: '亚瑟港' },
  { label: 'Tasman Peninsula 7182', town: 'Tasman Peninsula', postcode: '7182', nameZh: '塔斯曼半岛' },
  { label: 'Nubeena 7184', town: 'Nubeena', postcode: '7184', nameZh: '努比纳' },
  { label: 'White Beach 7184', town: 'White Beach', postcode: '7184', nameZh: '白沙滩' },
  { label: 'Buckland 7190', town: 'Buckland', postcode: '7190', nameZh: '巴克兰' },
  { label: 'Cranbrook 7190', town: 'Cranbrook', postcode: '7190', nameZh: '克兰布鲁克' },
  { label: 'Dolphin Sands 7190', town: 'Dolphin Sands', postcode: '7190', nameZh: '海豚沙滩' },
  { label: 'Orford 7190', town: 'Orford', postcode: '7190', nameZh: '奥福德' },
  { label: 'Swansea 7190', town: 'Swansea', postcode: '7190', nameZh: '斯旺西' },
  { label: 'Triabunna 7190', town: 'Triabunna', postcode: '7190', nameZh: '特里亚布纳' },
  { label: 'Ross 7209', town: 'Ross', postcode: '7209', nameZh: '罗斯' },
  { label: 'Campbell Town 7210', town: 'Campbell Town', postcode: '7210', nameZh: '坎贝尔镇' },
  { label: 'Evandale 7212', town: 'Evandale', postcode: '7212', nameZh: '埃文代尔' },
  { label: 'St Marys 7214', town: 'St Marys', postcode: '7214', nameZh: '圣玛丽斯' },
  { label: 'Bicheno 7215', town: 'Bicheno', postcode: '7215', nameZh: '比舍诺' },
  { label: 'Coles Bay 7215', town: 'Coles Bay', postcode: '7215', nameZh: '科尔斯湾' },
  { label: 'Freycinet 7215', town: 'Freycinet', postcode: '7215', nameZh: '菲欣纳' },
  { label: 'Scamander 7215', town: 'Scamander', postcode: '7215', nameZh: '斯卡曼德' },
  { label: 'St Helens 7216', town: 'St Helens', postcode: '7216', nameZh: '圣海伦斯' },
  { label: 'Launceston 7250', town: 'Launceston', postcode: '7250', nameZh: '朗塞斯顿' },
  { label: 'Prospect 7250', town: 'Prospect', postcode: '7250', nameZh: '普罗斯佩克特' },
  { label: 'Riverside 7250', town: 'Riverside', postcode: '7250', nameZh: '河畔' },
  { label: 'West Launceston 7250', town: 'West Launceston', postcode: '7250', nameZh: '西朗塞斯顿' },
  { label: 'Hillwood 7252', town: 'Hillwood', postcode: '7252', nameZh: '希尔伍德' },
  { label: 'Windermere 7252', town: 'Windermere', postcode: '7252', nameZh: '温德米尔' },
  { label: 'George Town 7253', town: 'George Town', postcode: '7253', nameZh: '乔治镇' },
  { label: 'Low Head 7253', town: 'Low Head', postcode: '7253', nameZh: '洛角' },
  { label: 'Lebrina 7254', town: 'Lebrina', postcode: '7254', nameZh: '勒布里纳' },
  { label: 'Flinders Island 7255', town: 'Flinders Island', postcode: '7255', nameZh: '弗林德斯岛' },
  { label: 'Currie 7256', town: 'Currie', postcode: '7256', nameZh: '柯里' },
  { label: 'Naracoopa 7256', town: 'Naracoopa', postcode: '7256', nameZh: '纳拉库帕' },
  { label: 'Scottsdale 7260', town: 'Scottsdale', postcode: '7260', nameZh: '斯科茨代尔' },
  { label: 'Beauty Point 7262', town: 'Beauty Point', postcode: '7262', nameZh: '美丽角' },
  { label: 'Bridport 7262', town: 'Bridport', postcode: '7262', nameZh: '布里德波特' },
  { label: 'Derby 7264', town: 'Derby', postcode: '7264', nameZh: '达比' },
  { label: 'Weldborough 7264', town: 'Weldborough', postcode: '7264', nameZh: '韦尔德伯勒' },
  { label: 'Beaconsfield 7270', town: 'Beaconsfield', postcode: '7270', nameZh: '比肯斯菲尔德' },
  { label: 'Exeter 7275', town: 'Exeter', postcode: '7275', nameZh: '埃克塞特' },
  { label: 'Tamar Valley 7275', town: 'Tamar Valley', postcode: '7275', nameZh: '塔马谷' },
  { label: 'Grindelwald 7277', town: 'Grindelwald', postcode: '7277', nameZh: '格林德瓦' },
  { label: 'Legana 7277', town: 'Legana', postcode: '7277', nameZh: '勒加纳' },
  { label: 'Rosevears 7277', town: 'Rosevears', postcode: '7277', nameZh: '罗斯沃斯' },
  { label: 'Hadspen 7290', town: 'Hadspen', postcode: '7290', nameZh: '哈德斯彭' },
  { label: 'Carrick 7291', town: 'Carrick', postcode: '7291', nameZh: '卡里克' },
  { label: 'Perth 7300', town: 'Perth', postcode: '7300', nameZh: '珀斯' },
  { label: 'Bishopsbourne 7301', town: 'Bishopsbourne', postcode: '7301', nameZh: '比肖普斯本' },
  { label: 'Longford 7301', town: 'Longford', postcode: '7301', nameZh: '朗福德' },
  { label: 'Cressy 7302', town: 'Cressy', postcode: '7302', nameZh: '克雷西' },
  { label: 'Westbury 7303', town: 'Westbury', postcode: '7303', nameZh: '韦斯特伯里' },
  { label: 'Chudleigh 7304', town: 'Chudleigh', postcode: '7304', nameZh: '查德利' },
  { label: 'Deloraine 7304', town: 'Deloraine', postcode: '7304', nameZh: '德洛兰' },
  { label: 'Elizabeth Town 7304', town: 'Elizabeth Town', postcode: '7304', nameZh: '伊丽莎白镇' },
  { label: 'Golden Valley 7304', town: 'Golden Valley', postcode: '7304', nameZh: '金色山谷' },
  { label: 'Meander 7304', town: 'Meander', postcode: '7304', nameZh: '米安德' },
  { label: 'Mole Creek 7304', town: 'Mole Creek', postcode: '7304', nameZh: '莫尔溪' },
  { label: 'Red Hills 7304', town: 'Red Hills', postcode: '7304', nameZh: '红山' },
  { label: 'Western Creek 7304', town: 'Western Creek', postcode: '7304', nameZh: '西溪' },
  { label: 'Railton 7305', town: 'Railton', postcode: '7305', nameZh: '雷尔顿' },
  { label: 'Cradle Mountain 7306', town: 'Cradle Mountain', postcode: '7306', nameZh: '摇篮山' },
  { label: 'Gowrie Park 7306', town: 'Gowrie Park', postcode: '7306', nameZh: '高里公园' },
  { label: 'Lorinna 7306', town: 'Lorinna', postcode: '7306', nameZh: '洛林纳' },
  { label: 'Sheffield 7306', town: 'Sheffield', postcode: '7306', nameZh: '谢菲尔德' },
  { label: 'Hawley Beach 7307', town: 'Hawley Beach', postcode: '7307', nameZh: '霍利海滩' },
  { label: 'Latrobe 7307', town: 'Latrobe', postcode: '7307', nameZh: '拉特罗布' },
  { label: 'Port Sorell 7307', town: 'Port Sorell', postcode: '7307', nameZh: '索雷尔港' },
  { label: 'Devonport 7310', town: 'Devonport', postcode: '7310', nameZh: '德文波特' },
  { label: 'Don 7310', town: 'Don', postcode: '7310', nameZh: '唐' },
  { label: 'Moina 7310', town: 'Moina', postcode: '7310', nameZh: '莫伊纳' },
  { label: 'Quoiba 7310', town: 'Quoiba', postcode: '7310', nameZh: '奎巴' },
  { label: 'Spreyton 7310', town: 'Spreyton', postcode: '7310', nameZh: '斯普雷顿' },
  { label: 'Wilmot 7310', town: 'Wilmot', postcode: '7310', nameZh: '威尔莫特' },
  { label: 'Turners Beach 7315', town: 'Turners Beach', postcode: '7315', nameZh: '特纳斯海滩' },
  { label: 'Ulverstone 7315', town: 'Ulverstone', postcode: '7315', nameZh: '阿尔弗斯通' },
  { label: 'Penguin 7316', town: 'Penguin', postcode: '7316', nameZh: '企鹅镇' },
  { label: 'Burnie 7320', town: 'Burnie', postcode: '7320', nameZh: '伯尼' },
  { label: 'South Burnie 7320', town: 'South Burnie', postcode: '7320', nameZh: '南伯尼' },
  { label: 'Boat Harbour 7321', town: 'Boat Harbour', postcode: '7321', nameZh: '船港' },
  { label: 'Rocky Cape 7321', town: 'Rocky Cape', postcode: '7321', nameZh: '洛基角' },
  { label: 'Savage River 7321', town: 'Savage River', postcode: '7321', nameZh: '萨维奇河' },
  { label: 'Sisters Beach 7321', town: 'Sisters Beach', postcode: '7321', nameZh: '姐妹海滩' },
  { label: 'Tullah 7321', town: 'Tullah', postcode: '7321', nameZh: '塔拉' },
  { label: 'Waratah 7321', town: 'Waratah', postcode: '7321', nameZh: '沃拉塔' },
  { label: 'Somerset 7322', town: 'Somerset', postcode: '7322', nameZh: '萨默塞特' },
  { label: 'Wynyard 7325', town: 'Wynyard', postcode: '7325', nameZh: '温耶德' },
  { label: 'Arthur River 7330', town: 'Arthur River', postcode: '7330', nameZh: '亚瑟河' },
  { label: 'Marrawah 7330', town: 'Marrawah', postcode: '7330', nameZh: '马拉瓦' },
  { label: 'Smithton 7330', town: 'Smithton', postcode: '7330', nameZh: '史密斯顿' },
  { label: 'Temma 7330', town: 'Temma', postcode: '7330', nameZh: '特马' },
  { label: 'Stanley 7331', town: 'Stanley', postcode: '7331', nameZh: '斯坦利' },
  { label: 'Trial Harbour 7466', town: 'Trial Harbour', postcode: '7466', nameZh: '特里尔港' },
  { label: 'Corinna 7467', town: 'Corinna', postcode: '7467', nameZh: '科林纳' },
  { label: 'Queenstown 7467', town: 'Queenstown', postcode: '7467', nameZh: '皇后镇' },
  { label: 'Strahan 7468', town: 'Strahan', postcode: '7468', nameZh: '斯特拉恩' },
  { label: 'Granville 7469', town: 'Granville', postcode: '7469', nameZh: '格兰维尔' },
  { label: 'Zeehan 7469', town: 'Zeehan', postcode: '7469', nameZh: '齐恩' },
  { label: 'Rosebery 7470', town: 'Rosebery', postcode: '7470', nameZh: '罗斯伯里' }

]

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
    item?.route,
    tripData.route,
    tripData.desc,
    tripData.locationLabel,
    tripData.town,
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
  const town = String(item?.town || tripData.town || '').trim()
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

  const catalogEntry = TAS_LOCATION_POSTCODES.find((entry) => entry.label === value)
  if (catalogEntry) {
    if (String(catalogEntry.town || '').toLowerCase().includes(kw)) return true
    if (String(catalogEntry.nameZh || '').toLowerCase().includes(kw)) return true
    if (String(catalogEntry.postcode || '').includes(kw)) return true
  }

  const fromCatalog = getCatalogEntries().find((entry) => entry.label === value)
  if (fromCatalog) {
    if (String(fromCatalog.town || '').toLowerCase().includes(kw)) return true
    if (String(fromCatalog.postcode || '').includes(kw)) return true
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
  const entry = TAS_LOCATION_POSTCODES.find((e) => e.label === label)
  if (entry && entry.nameZh) {
    return `${entry.nameZh} ${label}`
  }
  return label
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