import { resolveDataImage } from '@/utils/dataImageResolver'

const resolveDialogThumb = (path, fallback = '') =>
  resolveDataImage(path, fallback, { variant: 'thumb' }) || resolveDataImage(path, fallback)

const resolveDialogOriginal = (path, fallback = '') => resolveDataImage(path, fallback)

export function findFreeInfoSourceItem(title) {
  return null
}

const SUB_NAV_ITEM_TYPE_MAP = {
  景点: '景点信息',
  餐厅: '餐厅信息',
  住宿: '住宿信息',
}

export function itemTypeFromSubNavName(subNavName) {
  return SUB_NAV_ITEM_TYPE_MAP[String(subNavName || '').trim()] || ''
}

/** @deprecated 兼容旧引用 */
export const tripTypeFromSubNavName = itemTypeFromSubNavName

export function resolveOriginalImages(paths) {
  return dedupePaths(paths)
    .map((path) => resolveDialogOriginal(path, ''))
    .filter(Boolean)
}

function dedupePaths(paths) {
  const seen = new Set()
  const result = []
  for (const raw of paths) {
    const path = String(raw || '').trim()
    if (!path || seen.has(path)) continue
    seen.add(path)
    result.push(path)
  }
  return result
}

function flattenImageGroup(group) {
  if (Array.isArray(group)) return group
  if (group) return [group]
  return []
}

const SPECIAL_SECTION_FALLBACK_IMAGES = [
  new URL('@/assets/img/footer1.jpg', import.meta.url).href,
  new URL('@/assets/img/footer2.jpg', import.meta.url).href,
  new URL('@/assets/img/footer3.jpg', import.meta.url).href,
  new URL('@/assets/img/footer4.jpg', import.meta.url).href,
]

export function resolveSpecialContentFallbackImage(sourceItem, subNavName = '', title = '') {
  const normalizedTitle = String(title || sourceItem?.title || '').trim()
  const normalizedSubNav = String(subNavName || sourceItem?.subNavName || '').trim()
  const seed = `${normalizedSubNav}:${normalizedTitle}`
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return SPECIAL_SECTION_FALLBACK_IMAGES[hash % SPECIAL_SECTION_FALLBACK_IMAGES.length]
}

function buildSpecialContentTripData(sourceItem = {}) {
  const features = Array.isArray(sourceItem?.info)
    ? sourceItem.info
      .filter(Boolean)
      .map((infoItem) => ({
        icon: '#33b1a3',
        title: String(infoItem?.label || '').trim(),
        desc: String(infoItem?.value || '').trim(),
      }))
      .filter((row) => row.title || row.desc)
    : []

  const tagItems = Array.isArray(sourceItem?.tagItems) ? sourceItem.tagItems : []
  const tagsFromItems = tagItems
    .map((tagItem) => String(tagItem?.text || '').trim())
    .filter(Boolean)
  const tagsFromArray = Array.isArray(sourceItem?.tags)
    ? sourceItem.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
    : []
  const tags = tagsFromItems.length ? tagsFromItems : tagsFromArray

  const sub = String(sourceItem?.sub || '').trim()
  const location = String(sourceItem?.location || '').trim()
  const badge = String(sourceItem?.badge || '').trim()

  return {
    route: sub || location || String(sourceItem?.title || '').trim(),
    desc: [location, badge].filter(Boolean).join(' · '),
    features,
    tags,
  }
}

/** 列表卡片缩略图：餐厅优先 cover，否则 img 第二张；景点/住宿等走 img 顺序 */
export function getFreeInfoGridImagePath(sourceItem, subNavName = '') {
  if (!sourceItem || typeof sourceItem !== 'object') return ''

  const hasCoverField = Object.prototype.hasOwnProperty.call(sourceItem, 'cover')
  if (hasCoverField) {
    const coverPath = String(sourceItem.cover || '').trim()
    if (coverPath) return coverPath
  }

  const rawImg = sourceItem.img
  if (!rawImg) return ''

  if (Array.isArray(rawImg)) {
    if (subNavName === '餐厅' && rawImg.length >= 2) {
      const second = String(rawImg[1] || '').trim()
      if (second) return second
    }
    for (const imagePath of rawImg) {
      const normalized = String(imagePath || '').trim()
      if (normalized) return normalized
    }
    return ''
  }

  return String(rawImg).trim()
}

/**
 * 详情轮播图路径：
 * - 餐厅：只用 img 数组（cover 仅用于列表卡片）
 * - 其它：images / img / cover 等按顺序合并
 */
export function getFreeInfoDialogImagePaths(sourceItem, subNavName = '', tripData = {}) {
  if (subNavName === '餐厅' || tripData?.displaySubNav === '餐厅') {
    const restaurantPaths = flattenImageGroup(sourceItem?.img)
    if (restaurantPaths.length) return dedupePaths(restaurantPaths)
    return dedupePaths(flattenImageGroup(tripData?.img))
  }

  const groups = [
    tripData?.images,
    tripData?.banners,
    tripData?.bannerList,
    tripData?.imgs,
    tripData?.img,
    sourceItem?.img,
    sourceItem?.cover ? [sourceItem.cover] : [],
    tripData?.cover ? [tripData.cover] : [],
  ]

  return dedupePaths(groups.flatMap(flattenImageGroup))
}

export function buildFreeInfoDialogPayload(favoriteItem) {
  const subNavName =
    favoriteItem?.tripData?.displaySubNav ||
    favoriteItem?.subNavName ||
    ''
  const sourceTripData = favoriteItem?.tripData && typeof favoriteItem.tripData === 'object'
    ? { ...favoriteItem.tripData }
    : {}
  const specialTripData =
    Array.isArray(sourceTripData?.info) ||
      Array.isArray(sourceTripData?.tagItems) ||
      Array.isArray(sourceTripData?.tags) ||
      sourceTripData?.badge ||
      sourceTripData?.location ||
      sourceTripData?.sub
      ? buildSpecialContentTripData(sourceTripData)
      : {}
  const finalSourceTripData = Object.keys(specialTripData).length
    ? { ...specialTripData, ...sourceTripData }
    : sourceTripData
  const itemType =
    favoriteItem?.itemType ||
    favoriteItem?.tripType ||
    favoriteItem?.type ||
    itemTypeFromSubNavName(subNavName) ||
    'scenic'

  const hasRemoteMedia =
    favoriteItem?.cover ||
    favoriteItem?.img != null ||
    favoriteItem?.tripData?.img != null

  const specialFallbackImage =
    !hasRemoteMedia
      ? resolveSpecialContentFallbackImage(favoriteItem?.tripData || favoriteItem, subNavName, favoriteItem?.title)
      : ''

  if (hasRemoteMedia && favoriteItem?.tripData && Object.keys(favoriteItem.tripData).length) {
    const imagePaths = getFreeInfoDialogImagePaths(
      {
        cover: favoriteItem.cover || favoriteItem.tripData.cover,
        img: favoriteItem.img ?? favoriteItem.tripData.img,
      },
      subNavName,
      favoriteItem.tripData,
    )
    const resolvedImages = resolveOriginalImages(imagePaths)
    const tripData = { ...favoriteItem.tripData, displaySubNav: subNavName }
    if (imagePaths.length) {
      tripData.images = imagePaths
    } else if (resolvedImages.length) {
      tripData.images = resolvedImages
    }
    return {
      ...favoriteItem,
      title: favoriteItem.title || '',
      enTitle: favoriteItem.enTitle ?? '',
      type: itemType,
      itemType,
      tripType: itemType,
      tripData: {
        ...finalSourceTripData,
        ...tripData,
      },
      banner: resolveDialogThumb(imagePaths[0]) || specialFallbackImage || favoriteItem.banner || favoriteItem.image || '',
    }
  }

  const imagePaths = getFreeInfoDialogImagePaths(
    favoriteItem?.tripData || favoriteItem,
    subNavName,
    favoriteItem?.tripData || {},
  )
  const resolvedImages = resolveOriginalImages(imagePaths)

  const tripData = {
    ...finalSourceTripData,
    ...(favoriteItem?.tripData && typeof favoriteItem.tripData === 'object' ? favoriteItem.tripData : {}),
    img: favoriteItem?.img ?? favoriteItem?.tripData?.img,
    imgSource: favoriteItem?.tripData?.imgSource,
    cover: favoriteItem?.cover ?? favoriteItem?.tripData?.cover,
    displaySubNav: subNavName || favoriteItem?.tripData?.displaySubNav,
  }

  if (imagePaths.length) {
    tripData.images = imagePaths
  } else if (!Array.isArray(tripData.images) || !tripData.images.length) {
    tripData.images = resolvedImages
  }

  const gridPath = getFreeInfoGridImagePath(favoriteItem?.tripData || favoriteItem, subNavName)
  const banner =
    resolveDialogThumb(imagePaths[0]) ||
    (gridPath ? resolveDialogThumb(gridPath, '') : '') ||
    specialFallbackImage ||
    favoriteItem?.banner ||
    favoriteItem?.image ||
    ''

  return {
    ...favoriteItem,
    title: favoriteItem.title || favoriteItem?.tripData?.title || '',
    enTitle: favoriteItem.enTitle ?? favoriteItem?.tripData?.enTitle ?? '',
    type: itemType,
    itemType,
    tripType: itemType,
    tripData,
    banner,
  }
}
