import { getFreeInfoGridImagePath } from '@/utils/freeInfoImageUtils'
import {
  findChildSpotItems,
  findParentSpotItemForChild,
  isSubSpotItemFromDb,
} from '@/utils/spotRelations'

export function pickRelatedSpotCoverPath(spot) {
  if (!spot || typeof spot !== 'object') return ''
  const fromItem = getFreeInfoGridImagePath(spot, '景点')
  if (fromItem) return fromItem

  const banner = spot.banner
  if (typeof banner === 'string' && banner.trim()) return banner.trim()

  const thumbnail = String(spot.thumbnail || '').trim()
  if (thumbnail) return thumbnail

  const tripData = spot.tripData && typeof spot.tripData === 'object' ? spot.tripData : {}
  return getFreeInfoGridImagePath(tripData, '景点')
}

function toRelatedSpotCard(item) {
  if (!item || typeof item !== 'object' || !item.title) return null
  const coverPath = pickRelatedSpotCoverPath(item)
  return {
    id: item.id ?? null,
    itemKey: item.itemKey || '',
    title: item.title,
    enTitle: item.enTitle || '',
    img: item.img || coverPath || item.banner || '',
    banner: coverPath || item.banner || '',
    cover: coverPath || item.cover || '',
    thumbnail: item.thumbnail || coverPath || '',
    tripType: '景点信息',
    itemType: '景点信息',
    tripData: item.tripData && typeof item.tripData === 'object' ? { ...item.tripData } : {},
  }
}

export function enrichScenicRelations(detailItem, scenicItems = []) {
  if (!detailItem || !Array.isArray(scenicItems) || scenicItems.length === 0) {
    return detailItem
  }

  const childSpots = findChildSpotItems(scenicItems, detailItem)
    .map(toRelatedSpotCard)
    .filter(Boolean)
  const parentItem = findParentSpotItemForChild(scenicItems, detailItem)
  const parentCard = toRelatedSpotCard(parentItem)
  const isSubSpot = isSubSpotItemFromDb(detailItem)
  const siblingSpots = parentItem
    ? findChildSpotItems(scenicItems, parentItem)
      .filter((spot) => {
        if (!spot?.title || spot.title === detailItem.title) return false
        if (detailItem.id != null && spot.id != null && String(spot.id) === String(detailItem.id)) return false
        return true
      })
      .map(toRelatedSpotCard)
      .filter(Boolean)
    : []

  const tripData = {
    ...(detailItem.tripData && typeof detailItem.tripData === 'object' ? detailItem.tripData : {}),
    childSpots,
    hasChildSpots: childSpots.length > 0,
    siblingSpots,
    parentSpotTitle: parentCard?.title || '',
    parentSpotId: parentCard?.id ?? null,
    parentSpotOpenPayload: parentCard,
  }

  return {
    ...detailItem,
    tripData,
    parentSpotTitle: parentCard?.title || '',
    parentSpotId: parentCard?.id ?? null,
    isSubSpot,
  }
}

export function isScenicContentType(item) {
  const type = String(item?.itemType || item?.tripType || '').trim()
  const subNavName = String(item?.subNavName || item?.tripData?.subNavName || item?.tripData?.displaySubNav || '').trim()
  return type === '景点信息' || type === 'scenic' || subNavName === '景点'
}
