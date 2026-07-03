import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')
const dataPath = path.join(projectRoot, 'src', 'data', 'data.json')
const freeinfoPath = path.join(projectRoot, 'src', 'data', 'split', 'freeinfo.json')
const daytripPath = path.join(projectRoot, 'src', 'data', 'split', 'daytrip.json')
const servicesPath = path.join(projectRoot, 'src', 'data', 'split', 'services.json')
const FREEINFO_TAG = '自助游/自驾游免费参考信息'
const DAYTRIP_TAG = '一日游/多日游'
const PARENT_SPOT_ALIASES = new Map([
  ['Tasman Peninsula', ['Turrakana/Tasman Peninsula']],
  ['Freycinet National Park', ['Coles Bay']],
  ['Mount Field National Park', ['Mount Field National Park']]
])

const SOURCE_MAPPINGS = [
  {
    filePath: freeinfoPath,
    match: (row) => row?.path === 'trips/freeinfo' || row?.tagName === FREEINFO_TAG,
  },
  {
    filePath: daytripPath,
    match: (row) => row?.path === 'trips/routes' || row?.tagName === DAYTRIP_TAG,
  },
  {
    filePath: servicesPath,
    match: (row) => typeof row?.path === 'string' && row.path.startsWith('service/'),
  },
]

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

function firstNonBlank(...values) {
  for (const value of values) {
    const text = normalizeText(value)
    if (text) {
      return text
    }
  }
  return ''
}

function slugify(value) {
  const raw = normalizeText(value)
  if (!raw) {
    return 'item'
  }
  const ascii = raw
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (ascii) {
    return ascii.slice(0, 96)
  }
  const fallback = raw.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]+/g, '')
  return fallback ? fallback.slice(0, 96) : 'item'
}

function getTripData(item) {
  return item?.tripData && typeof item.tripData === 'object' ? item.tripData : null
}

function buildFreeInfoItemKey(sectionPath, subNavPath, item, usedKeys) {
  const existing = normalizeText(item?.itemKey)
  if (existing) {
    return existing
  }
  const label = firstNonBlank(item?.enTitle, item?.title, item?.route, item?.place, item?.name)
  const baseKey = `${sectionPath}:${subNavPath}:${slugify(label)}`
  const used = usedKeys.get(baseKey) || 0
  usedKeys.set(baseKey, used + 1)
  return used === 0 ? baseKey : `${baseKey}--${used}`
}

function buildParentLookup(items) {
  const lookup = new Map()
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      continue
    }
    const itemKey = normalizeText(item.itemKey)
    const title = normalizeText(item.title)
    const enTitle = normalizeText(item.enTitle)
    if (itemKey) {
      lookup.set(itemKey.toLowerCase(), item)
    }
    if (title) {
      lookup.set(title.toLowerCase(), item)
    }
    if (enTitle) {
      lookup.set(enTitle.toLowerCase(), item)
    }
  }

  for (const [canonical, aliases] of PARENT_SPOT_ALIASES.entries()) {
    const canonicalKey = canonical.toLowerCase()
    const aliasKeys = aliases.map((alias) => alias.toLowerCase())
    for (const item of items) {
      if (!item || typeof item !== 'object') {
        continue
      }
      const title = normalizeText(item.title).toLowerCase()
      const enTitle = normalizeText(item.enTitle).toLowerCase()
      if (title === canonicalKey || enTitle === canonicalKey || aliasKeys.includes(title) || aliasKeys.includes(enTitle)) {
        lookup.set(canonicalKey, item)
        for (const alias of aliases) {
          lookup.set(alias.toLowerCase(), item)
        }
      }
    }
  }

  return lookup
}

function resolveParentScenicItem(belongsToSpot, lookup) {
  const normalized = normalizeText(belongsToSpot)
  if (!normalized) {
    return null
  }
  const direct = lookup.get(normalized.toLowerCase())
  if (direct) {
    return direct
  }
  const aliases = PARENT_SPOT_ALIASES.get(normalized)
  if (aliases) {
    for (const alias of aliases) {
      const matched = lookup.get(normalizeText(alias).toLowerCase())
      if (matched) {
        return matched
      }
    }
  }
  for (const [canonical, aliasList] of PARENT_SPOT_ALIASES.entries()) {
    if (aliasList.some((alias) => normalizeText(alias).toLowerCase() === normalized.toLowerCase())) {
      const matched = lookup.get(canonical.toLowerCase())
      if (matched) {
        return matched
      }
    }
  }
  return null
}

function normalizeFreeInfoScenicKeys(section) {
  if (!section || section.tagName !== FREEINFO_TAG || !Array.isArray(section.subNav)) {
    return
  }

  section.subNav.forEach((subNav) => {
    if (!subNav || subNav.subNavName !== '景点' || !Array.isArray(subNav.items)) {
      return
    }

    const sectionPath = normalizeText(section.path) || 'trips/freeinfo'
    const subNavPath = normalizeText(subNav.subNavPath) || normalizeText(subNav.subNavName) || '景点'
    const usedKeys = new Map()

    subNav.items.forEach((item) => {
      if (!item || typeof item !== 'object') {
        return
      }
      item.itemKey = buildFreeInfoItemKey(sectionPath, subNavPath, item, usedKeys)
    })

    const parentLookup = buildParentLookup(subNav.items)
    subNav.items.forEach((item) => {
      const tripData = getTripData(item)
      if (!tripData || normalizeText(tripData.parentItemKey)) {
        return
      }
      const parent = resolveParentScenicItem(tripData.belongsToSpot, parentLookup)
      if (parent?.itemKey) {
        tripData.parentItemKey = parent.itemKey
      }
    })
  })
}

function normalizeSourceDataKeys(dataSource) {
  if (!Array.isArray(dataSource)) {
    return
  }
  const freeInfo = dataSource.find((item) => item?.tagName === FREEINFO_TAG)
  normalizeFreeInfoScenicKeys(freeInfo)
}

function mergeSection(rootData, sourceData, matcher) {
  if (!sourceData) {
    return 0
  }

  const sourceSections = Array.isArray(sourceData) ? sourceData : [sourceData]
  let mergedCount = 0

  for (const sourceSection of sourceSections) {
    const targetIndex = rootData.findIndex((row) => matcher(row, sourceSection))
    if (targetIndex >= 0) {
      rootData[targetIndex] = sourceSection
      mergedCount += 1
    }
  }

  return mergedCount
}

async function main() {
  const data = await readJson(dataPath)
  if (!Array.isArray(data)) {
    throw new Error('[data-merge] data.json root must be an array')
  }

  let mergedTotal = 0
  for (const source of SOURCE_MAPPINGS) {
    const sourceData = await readJsonIfExists(source.filePath)
    if (sourceData == null) {
      continue
    }

    const mergedCount = mergeSection(data, sourceData, source.match)
    mergedTotal += mergedCount
    console.log(`[data-merge] ${path.basename(source.filePath)} -> ${mergedCount} sections`)
  }

  normalizeSourceDataKeys(data)

  await fs.writeFile(dataPath, `${JSON.stringify(data, null, 4)}\n`, 'utf8')
  console.log(`[data-merge] data.json synced, merged=${mergedTotal}`)
}

main().catch((error) => {
  console.error('[data-merge] fatal error:', error)
  process.exitCode = 1
})
