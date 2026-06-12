/** 服务类板块：仅打开页面，不做卡片定位 */
export const SERVICE_SECTION_TAGS = new Set([
  '热门项目',
  '商务接送',
  '包车服务',
  '专属定制',
  '地接地陪',
  '行程管家'
])

/** 与 TripsGrid 卡片 data-tour-title、URL dialogItemId 一致 */
export function getTourItemDialogKey(item) {
  if (!item || typeof item !== 'object') return ''
  if (item.itemKey != null && String(item.itemKey).trim() !== '') {
    return String(item.itemKey).trim()
  }
  if (item.id != null && String(item.id).trim() !== '') {
    return String(item.id).trim()
  }
  const label = item.title || item.place || item.name || item.route || ''
  return typeof label === 'string' ? label.trim() : String(label || '').trim()
}

export function buildTourDialogQueryParams(item, baseParams = {}) {
  const key = getTourItemDialogKey(item)
  if (!key) return { ...baseParams }
  return {
    ...baseParams,
    dialogItemId: key,
    dialogType: 'tour'
  }
}

export function shouldAttachTourDialogLocate(sectionTag) {
  return !SERVICE_SECTION_TAGS.has(sectionTag)
}

/** 列表项是否匹配 dialogItemId / data-tour-title */
export function tourItemMatchesDialogKey(item, dialogKey) {
  if (!dialogKey) return false
  const key = getTourItemDialogKey(item)
  if (key && key === dialogKey) return true
  return item?.title === dialogKey
}
