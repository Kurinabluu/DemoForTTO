import { getTourItemDialogKey } from './searchItemKey.js'

function normalizeEnTitle(value) {
  return String(value || '').trim()
}

function getTripData(item) {
  return item?.tripData && typeof item.tripData === 'object' ? item.tripData : {}
}

/** 从 API/数据库读取母景点 ID（方案 B，列表接口会运行时补齐） */
export function getParentItemIdFromDb(item) {
  const tripData = getTripData(item)
  const raw = item?.parentItemId ?? tripData.parentItemId
  if (raw == null || raw === '') return null
  return raw
}

/** 数据库字段 belongsToSpot（extra_json / belongs_to_spot 列） */
export function getBelongsToSpotFromDb(item) {
  const tripData = getTripData(item)
  return String(item?.belongsToSpot || tripData.belongsToSpot || '').trim()
}

export function isSubSpotItemFromDb(item) {
  if (getParentItemIdFromDb(item) != null) return true
  return Boolean(getBelongsToSpotFromDb(item))
}

export function getSubSpotSortOrderFromDb(item) {
  return isSubSpotItemFromDb(item) ? 1 : 0
}

export function findParentSpotItemById(items, parentItemId) {
  if (parentItemId == null || parentItemId === '' || !Array.isArray(items)) return null
  return items.find((item) => String(item?.id) === String(parentItemId)) || null
}

/** 解析子景点对应的母景点卡片 */
export function findParentSpotItemForChild(items, child) {
  const byId = findParentSpotItemById(items, getParentItemIdFromDb(child))
  if (byId) return byId

  const spotKey = getBelongsToSpotFromDb(child).toLowerCase()
  if (!spotKey || !Array.isArray(items)) return null
  return items.find((row) => normalizeEnTitle(row?.enTitle).toLowerCase() === spotKey) || null
}

/** 母景点展示名 */
export function getSpotParentDisplayNameFromDb(item, items = []) {
  const parent = findParentSpotItemForChild(items, item)
  if (parent?.title) return parent.title
  return getBelongsToSpotFromDb(item)
}

/** 查找某主景区下的子景点（parentItemId 或 belongsToSpot 匹配母卡片 enTitle） */
export function findChildSpotItems(items, parentItem) {
  if (!Array.isArray(items) || !parentItem) return []

  const parentDialogKey = getTourItemDialogKey(parentItem)
  const parentId = parentItem.id != null ? String(parentItem.id) : null
  const parentEn = normalizeEnTitle(parentItem.enTitle).toLowerCase()

  return items.filter((child) => {
    const childDialogKey = getTourItemDialogKey(child)
    if (parentDialogKey && childDialogKey === parentDialogKey) return false

    const childParentId = getParentItemIdFromDb(child)
    if (parentId && childParentId != null && String(childParentId) === parentId) return true

    const belongs = getBelongsToSpotFromDb(child).toLowerCase()
    if (!belongs || !parentEn) return false
    return belongs === parentEn
  })
}

/** @deprecated 请使用 findParentSpotItemForChild */
export function findParentSpotItem(items, parentSpotKey) {
  const spotKey = normalizeEnTitle(parentSpotKey)
  if (!spotKey || !Array.isArray(items)) return null
  return items.find((item) => normalizeEnTitle(item?.enTitle) === spotKey) || null
}
