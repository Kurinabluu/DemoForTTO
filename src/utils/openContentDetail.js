import { getTourItemDialogKey } from '@/utils/searchItemKey'

export function isDayTripContentType(tripType) {
  const normalized = String(tripType || '').trim()
  return normalized === '一日游'
    || normalized === '多日游'
    || normalized.includes('日行程')
    || (normalized.includes('日游') && !normalized.includes('信息'))
}

export function buildContentDetailLocation(item) {
  const itemKey = getTourItemDialogKey(item)
  if (!itemKey) return null

  const query = {}
  if (item?.id != null && item.id !== '' && /^\d+$/.test(String(item.id))) {
    query.id = String(item.id)
  }

  return {
    name: 'ContentDetail',
    params: { itemKey },
    query,
  }
}

export function openContentDetailWindow(router, item) {
  if (!router || !item) return false
  const location = buildContentDetailLocation(item)
  if (!location) return false
  const href = router.resolve(location).href
  window.open(href, '_blank', 'noopener,noreferrer')
  return true
}
