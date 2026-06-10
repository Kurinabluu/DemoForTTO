import freeInfoData from '@/data/split/freeinfo.json'
import { resolveDataImage } from '@/utils/dataImageResolver'
import { isApiEnabled } from '@/utils/ttoApi'

export function findFreeInfoSourceItem(title) {
  const normalizedTitle = String(title || '').trim()
  if (!normalizedTitle) return null
  const subNavList = freeInfoData?.subNav
  if (!Array.isArray(subNavList)) return null

  for (const subNav of subNavList) {
    if (!Array.isArray(subNav?.items)) continue
    const sourceItem = subNav.items.find(
      (entry) => String(entry?.title || '').trim() === normalizedTitle,
    )
    if (sourceItem) {
      return {
        subNavName: String(subNav?.subNavName || '').trim(),
        sourceItem,
      }
    }
  }
  return null
}

const SUB_NAV_ITEM_TYPE_MAP = {
  景点: '景点信息',
  餐厅: '餐厅信息',
  住宿: '住宿信息',
  葡萄酒酒庄: '葡萄酒酒庄信息',
  洋酒酒庄: '洋酒酒庄信息',
}

export function itemTypeFromSubNavName(subNavName) {
  return SUB_NAV_ITEM_TYPE_MAP[String(subNavName || '').trim()] || ''
}

/** @deprecated 兼容旧引用 */
export const tripTypeFromSubNavName = itemTypeFromSubNavName

export function resolveOriginalImages(paths) {
  return dedupePaths(paths)
    .map((path) => resolveDataImage(path, ''))
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
  const matched = findFreeInfoSourceItem(favoriteItem?.title)
  const subNavName =
    favoriteItem?.tripData?.displaySubNav ||
    favoriteItem?.subNavName ||
    matched?.subNavName ||
    ''
  const sourceItem = matched?.sourceItem
  const itemType =
    favoriteItem?.itemType ||
    favoriteItem?.tripType ||
    favoriteItem?.type ||
    itemTypeFromSubNavName(subNavName) ||
    'scenic'

  const hasRemoteMedia =
    favoriteItem?.cover ||
    favoriteItem?.img != null ||
    (favoriteItem?.tripData?.img != null && (!matched?.sourceItem || isApiEnabled()))

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
      tripData,
      banner: resolvedImages[0] || favoriteItem.banner || favoriteItem.image || '',
    }
  }

  const imagePaths = getFreeInfoDialogImagePaths(
    sourceItem,
    subNavName,
    favoriteItem?.tripData || {},
  )
  const resolvedImages = resolveOriginalImages(imagePaths)

  const tripData = {
    ...(sourceItem?.tripData && typeof sourceItem.tripData === 'object' ? sourceItem.tripData : {}),
    ...(favoriteItem?.tripData && typeof favoriteItem.tripData === 'object' ? favoriteItem.tripData : {}),
    img: sourceItem?.img ?? favoriteItem?.img ?? favoriteItem?.tripData?.img,
    imgSource: sourceItem?.imgSource ?? favoriteItem?.tripData?.imgSource,
    cover: sourceItem?.cover ?? favoriteItem?.cover ?? favoriteItem?.tripData?.cover,
    displaySubNav: subNavName || favoriteItem?.tripData?.displaySubNav,
  }

  if (imagePaths.length) {
    tripData.images = imagePaths
  } else if (!Array.isArray(tripData.images) || !tripData.images.length) {
    tripData.images = resolvedImages
  }

  const gridPath = getFreeInfoGridImagePath(sourceItem, subNavName)
  const banner =
    resolvedImages[0] ||
    (gridPath ? resolveDataImage(gridPath, '') : '') ||
    favoriteItem?.banner ||
    favoriteItem?.image ||
    ''

  return {
    ...favoriteItem,
    title: favoriteItem.title || sourceItem?.title || '',
    enTitle: favoriteItem.enTitle ?? sourceItem?.enTitle ?? '',
    type: itemType,
    itemType,
    tripType: itemType,
    tripData,
    banner,
  }
}
