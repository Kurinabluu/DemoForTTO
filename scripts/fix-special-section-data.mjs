import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '../src/data/data.json')

const HIKE_KNOWN = {
  'Ben Lomond Summit Link Track': {
    sub: 'Ben Lomond National Park 高山步道',
    location: 'Ben Lomond National Park, Tasmania',
    tags: ['1 km', '30 分钟', 'Grade 2'],
    badge: '徒步信息',
    info: [
      { label: '距离', value: '1 km' },
      { label: '耗时', value: '约 30 分钟' },
      { label: '难度', value: 'Grade 2' },
    ],
    tagItems: [
      { icon: '🥾', text: '1 km' },
      { icon: '⏱️', text: '30 分钟' },
      { icon: '⛰️', text: 'Grade 2' },
    ],
  },
  'Bridport Walking Track': {
    sub: '海岸、森林与河流的 11 公里环线',
    location: 'Bridport, Tasmania',
    tags: ['11 km', '海岸步道', '森林与河流'],
    badge: '步道信息',
    info: [
      { label: '总长度', value: '11 km' },
      { label: '构成', value: 'History-Foreshore / River-Forest / Wildflower Reserve' },
      { label: '特点', value: '近村庄、适合慢行' },
    ],
    tagItems: [
      { icon: '🌊', text: '11 km' },
      { icon: '🌿', text: '多地貌' },
      { icon: '🚶', text: '适合慢行' },
    ],
  },
  'Carr-Villa to Alpine Village Track': {
    sub: 'Ben Lomond National Park 中高山徒步',
    location: 'Carr Villa, Ben Lomond Road, Tasmania',
    tags: ['5 km', '2-3 小时', 'Grade 3'],
    badge: '徒步信息',
    info: [
      { label: '距离', value: '5 km' },
      { label: '耗时', value: '2-3 小时单程' },
      { label: '难度', value: 'Grade 3' },
    ],
    tagItems: [
      { icon: '🏔️', text: '5 km' },
      { icon: '🕒', text: '2-3 小时' },
      { icon: '⛰️', text: 'Grade 3' },
    ],
  },
}

function hikingFallback(title) {
  return {
    sub: title,
    location: '塔斯马尼亚',
    tags: ['徒步', '自然风景', '塔斯马尼亚'],
    badge: '徒步信息',
    badgeClass: 'aurora-badge',
    cardClass: 'aurora-card',
    info: [
      { label: '路线', value: title },
      { label: '区域', value: '塔斯马尼亚' },
      { label: '提示', value: '出发前请查询最新路况与天气' },
    ],
    tagItems: [
      { icon: '🥾', text: '徒步' },
      { icon: '🌿', text: '自然风景' },
      { icon: '📍', text: '塔斯马尼亚' },
    ],
  }
}

function isPlaceholderItem(item) {
  const raw = JSON.stringify(item)
  return raw.includes('待修改') || raw.includes('tag1') || item?.badge === '极光预报'
}

function applyHikingItem(item) {
  const known = HIKE_KNOWN[item.title] || hikingFallback(item.title)
  return {
    ...item,
    ...known,
    badgeClass: 'aurora-badge',
    cardClass: 'aurora-card',
  }
}

const lakeParanganaCamp = {
  sub: 'Central Highlands 湖景露营地',
  location: 'Lake Parangana, Central Highlands, Tasmania',
  tags: ['湖景', '露营', 'Central Highlands'],
  badge: '露营信息',
  badgeClass: 'camping-badge',
  cardClass: 'camping-card',
  info: [
    { label: '类型', value: '湖景露营地' },
    { label: '区域', value: 'Central Highlands' },
    { label: '提示', value: '请提前确认开放状态与预订要求' },
  ],
  tagItems: [
    { icon: '🏕️', text: '湖景露营' },
    { icon: '🌊', text: 'Central Highlands' },
    { icon: '📍', text: 'Lake Parangana' },
  ],
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
const root = data.find((row) => row.path === 'trips/freeinfo')
if (!root?.subNav) {
  throw new Error('freeinfo section not found')
}

for (const section of root.subNav) {
  if (section.subNavName === '徒步线路') {
    section.items = section.items
      .filter((item) => item.title !== '极光观测最佳时机')
      .map((item) => (isPlaceholderItem(item) ? applyHikingItem(item) : item))
  }

  if (section.subNavName === '塔州露营地') {
    section.items = section.items
      .filter((item) => item.title !== '极光观测最佳时机')
      .map((item) => {
        if (item.title === 'Lake Parangana' && isPlaceholderItem(item)) {
          return { ...item, ...lakeParanganaCamp }
        }
        return item
      })
  }
}

fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 4)}\n`, 'utf8')
console.log('[fix-special-section-data] done')
