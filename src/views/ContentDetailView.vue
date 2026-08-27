<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, InfoFilled } from '@element-plus/icons-vue'
import InfoSourceDialog from '@/components/InfoSourceDialog.vue'
import ContactDialog from '@/components/ContactDialog.vue'
import { resolveDataImageWithStatus, DEFAULT_DATA_IMAGE } from '@/utils/dataImageResolver'
import { isFavorite as checkFavorite, toggleFavorite } from '@/utils/favoritesStore'
import { notifyFavoriteResult } from '@/utils/favoriteMessages'
import { notifyApiError } from '@/utils/apiFeedback'
import { loadCatalogItemByKey, loadCatalogItemDetail, loadItemsBySubNav } from '@/utils/contentRepository'
import { mergeImageSourceIntoTripData } from '@/utils/freeInfoImageUtils'
import { enrichScenicRelations, isScenicContentType, pickRelatedSpotCoverPath } from '@/utils/freeInfoRelations'
import { openContentDetailWindow, isDayTripContentType } from '@/utils/openContentDetail'
import { extractDayTripTabKey } from '@/utils/subNavKey'
import {
  applyBreadcrumbJsonLd,
  applyFaqJsonLd,
  applyJsonLd,
  applyPageSeo,
  clearStructuredData,
  ENTITY_JSONLD_ID,
  toAbsoluteAssetUrl,
} from '@/utils/pageSeo'
import { COMPANY_SERVICES } from '@/data/companyProfile'
import tasMapImg from '@/assets/img/tasmap.jpg'
import { Z_INDEX } from '@/constants/zIndex'
import { isApiEnabled } from '@/utils/ttoApi'
import { useNavStore } from '@/stores/nav'

const DEFAULT_PAGE_TITLE = 'TasTrips.Online-塔州旅行在线一站式平台'
const SOURCE_SECTION_LABEL = '免费参考信息'
const ITEM_TYPE_TO_CATEGORY = {
  景点信息: '景点',
  餐厅信息: '餐厅',
  住宿信息: '住宿',
  scenic: '景点',
  一日游: '一日游',
  多日游: '多日游',
}

const route = useRoute()
const router = useRouter()
const navStore = useNavStore()

const loading = ref(true)
const loadError = ref('')
const detailItem = ref(null)
const infoDialogVisible = ref(false)
const consultationDialogVisible = ref(false)
const favoriteSubmitting = ref(false)
const bannerCarouselRef = ref(null)
const failedImageIndexes = ref(new Set())
const initialRawImagePaths = ref([])
const activeBannerIndex = ref(0)
const childSpotsCarouselOffset = ref(0)
const siblingSpotsCarouselOffset = ref(0)
const activeFaqName = ref('0')

const SPOT_CARD_WIDTH = 240
const SPOT_CARD_GAP = 14
const BANNER_HEIGHT = '500px'
const motherCardsEl = ref(null)
const siblingCardsEl = ref(null)
const subChildCardsEl = ref(null)
const motherVisibleCount = ref(6)
const siblingVisibleCount = ref(3)
const subChildVisibleCount = ref(3)
let spotResizeObserver = null

function decodeRouteItemKey(raw) {
  const value = Array.isArray(raw) ? raw.filter(Boolean).join('/') : String(raw || '').trim()
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const routeItemKey = computed(() => decodeRouteItemKey(route.params.itemKey))
const routeItemId = computed(() => {
  const raw = route.query.id
  return raw != null && String(raw).trim() !== '' ? String(raw).trim() : ''
})

function getDefaultFreeInfo(title = '未知信息') {
  return {
    route: `${title}信息`,
    desc: `关于${title}的详细信息，提供全面的参考资料。`,
    features: [
      { icon: '#22c55e', title: '详细介绍', desc: '提供全面的信息介绍' },
      { icon: '#3b82f6', title: '实用建议', desc: '分享实用的参考建议' },
      { icon: '#f59e0b', title: '注意事项', desc: '提醒重要的注意事项' },
    ],
    tags: ['免费信息', '参考资料', '详细介绍', '实用建议'],
  }
}

const resolvedItemType = computed(() =>
  detailItem.value?.itemType || detailItem.value?.tripType || 'scenic'
)

const pageTitle = computed(() => detailItem.value?.title || '')
const pageEnTitle = computed(() => detailItem.value?.enTitle || '')
const pageItemKey = computed(() => detailItem.value?.itemKey || routeItemKey.value)
const pageItemId = computed(() => detailItem.value?.id ?? null)

function parseCategoryFromItemKey(itemKey) {
  const parts = String(itemKey || '').split(':')
  return String(parts[1] || '').trim()
}

const sourceCategory = computed(() => {
  const fromItem = String(
    detailItem.value?.subNavName
    || routeInfo.value?.displaySubNav
    || routeInfo.value?.subNavName
    || ''
  ).trim()
  if (fromItem) return fromItem

  const fromKey = parseCategoryFromItemKey(pageItemKey.value)
  if (fromKey) return fromKey

  const fromType = ITEM_TYPE_TO_CATEGORY[resolvedItemType.value]
  if (fromType) return fromType

  const type = String(resolvedItemType.value || '').trim()
  if (type.endsWith('信息') && type.length > 2) return type.slice(0, -2)

  return '景点'
})

const sourcePlaceLabel = computed(() => {
  const locationLabel = String(routeInfo.value?.locationLabel || '').trim()
  if (locationLabel && locationLabel !== '暂未分类') return locationLabel
  const town = String(routeInfo.value?.town || routeInfo.value?.townName || '').trim()
  return town
})

const backButtonLabel = computed(() => `返回${sourceCategory.value}列表`)

function goBackToSourceList() {
  if (isDayTripInfo.value) {
    const tab = extractDayTripTabKey(sourceCategory.value)
    router.push({
      path: '/trips/routes',
      query: tab ? { dayTripTab: tab } : {},
    })
    return
  }
  const category = sourceCategory.value || '景点'
  navStore.saveSelectedSubNav(category)
  router.push({
    path: '/trips/freeinfo',
    query: { subNavName: category },
  })
}

const routeInfo = computed(() => {
  const tripData = detailItem.value?.tripData
  if (tripData && typeof tripData === 'object' && Object.keys(tripData).length > 0) {
    const hasContent = tripData.route || tripData.desc
      || (Array.isArray(tripData.features) && tripData.features.length)
    if (hasContent) return tripData
    return { ...getDefaultFreeInfo(pageTitle.value), ...tripData }
  }
  return getDefaultFreeInfo(pageTitle.value || '未知信息')
})

const isFavorite = computed(() => {
  if (!detailItem.value) return false
  return checkFavorite(pageItemId.value, resolvedItemType.value, pageTitle.value, pageItemKey.value)
})

const isScenicInfo = computed(() => isScenicContentType(detailItem.value) || resolvedItemType.value === '景点信息')
const isDayTripInfo = computed(() => isDayTripContentType(resolvedItemType.value) || isDayTripContentType(detailItem.value?.tripType))
const isRestaurantInfo = computed(() => resolvedItemType.value === '餐厅信息')
const isLodgingInfo = computed(() => resolvedItemType.value === '住宿信息')
const shouldAlignImageSourceRight = computed(() => isScenicInfo.value || isLodgingInfo.value)
const sourceSectionLabel = computed(() => (isDayTripInfo.value ? '一日游/多日游' : SOURCE_SECTION_LABEL))
const consultButtonLabel = computed(() => (isDayTripInfo.value ? '立刻咨询此行程' : '咨询'))

const scenicAddressText = computed(() => {
  if (!isScenicInfo.value) return ''
  const routeText = String(routeInfo.value?.route || '').trim()
  if (!routeText) return ''
  const title = String(pageTitle.value || '').trim()
  const defaultRoute = title ? `${title}信息` : '未知信息信息'
  if (routeText === defaultRoute) return ''
  return routeText
})

const infoSourceRows = computed(() => {
  if (Array.isArray(routeInfo.value?.source)) return routeInfo.value.source
  return []
})

const sourceEntryName = computed(() => {
  return String(infoSourceRows.value?.[0]?.title || '').trim() || '该条目'
})

const childSpots = computed(() => {
  const raw = routeInfo.value?.childSpots
  if (!Array.isArray(raw)) return []
  return raw.filter((spot) => spot && typeof spot === 'object' && spot.title)
})

const hasChildSpots = computed(() => {
  return Boolean(routeInfo.value?.hasChildSpots) || childSpots.value.length > 0
})

const isSubSpotPage = computed(() => {
  return Boolean(detailItem.value?.isSubSpot || (routeInfo.value?.parentSpotTitle && routeInfo.value?.parentSpotId))
})

const siblingSpots = computed(() => {
  if (!isSubSpotPage.value) return []
  const raw = routeInfo.value?.siblingSpots
  if (!Array.isArray(raw)) return []
  return raw.filter((spot) => spot && typeof spot === 'object' && spot.title && spot.title !== pageTitle.value)
})

const parentSpotCard = computed(() => {
  const payload = routeInfo.value?.parentSpotOpenPayload
  if (payload && typeof payload === 'object' && payload.title) return payload
  if (!routeInfo.value?.parentSpotTitle) return null
  return {
    id: routeInfo.value.parentSpotId,
    title: routeInfo.value.parentSpotTitle,
    img: '',
    banner: '',
  }
})

const childSpotsSectionTitle = computed(() => (hasChildSpots.value ? '此地还可游览' : ''))

const contentTags = computed(() => {
  const raw = routeInfo.value?.tags
  if (!Array.isArray(raw)) return []
  return raw.map((tag) => String(tag || '').trim()).filter(Boolean)
})

const parentBelongingText = computed(() => {
  if (!isScenicInfo.value || !isSubSpotPage.value) return ''
  return String(parentSpotCard.value?.title || routeInfo.value?.parentSpotTitle || '').trim()
})

const orderableInfo = computed(() => {
  const info = routeInfo.value?.orderableInfo
  return info && typeof info === 'object' ? info : null
})

const relatedServiceLinks = computed(() =>
  COMPANY_SERVICES.filter((item) => [
    '热门项目与门票',
    '包车服务',
    '商务接送',
    '地接地陪',
    '行程管家',
    '专属定制',
  ].includes(item.name))
)

function getSpotCarouselView(items, offset, visibleCount) {
  const list = Array.isArray(items) ? items : []
  const count = Math.max(1, Number(visibleCount) || 1)
  const hasOverflow = list.length > count
  const maxOffset = Math.max(0, list.length - count)
  const safeOffset = Math.min(offset, maxOffset)
  return {
    spots: hasOverflow ? list.slice(safeOffset, safeOffset + count) : list,
    canGoPrev: hasOverflow && safeOffset > 0,
    canGoNext: hasOverflow && safeOffset < maxOffset,
    hasOverflow,
  }
}

function calcVisibleSpotCount(el, fallback) {
  if (!el) return fallback
  const width = el.clientWidth
  if (width < 40) return fallback
  return Math.max(1, Math.floor((width + SPOT_CARD_GAP) / (SPOT_CARD_WIDTH + SPOT_CARD_GAP)))
}

function clampCarouselOffset(offsetRef, items, visibleCount) {
  const maxOffset = Math.max(0, (Array.isArray(items) ? items.length : 0) - Math.max(1, visibleCount))
  if (offsetRef.value > maxOffset) offsetRef.value = maxOffset
}

function updateSpotVisibleCounts() {
  motherVisibleCount.value = calcVisibleSpotCount(motherCardsEl.value, motherVisibleCount.value)
  siblingVisibleCount.value = calcVisibleSpotCount(siblingCardsEl.value, siblingVisibleCount.value)
  subChildVisibleCount.value = calcVisibleSpotCount(subChildCardsEl.value, subChildVisibleCount.value)
  const childVisible = isSubSpotPage.value ? subChildVisibleCount.value : motherVisibleCount.value
  clampCarouselOffset(childSpotsCarouselOffset, childSpots.value, childVisible)
  clampCarouselOffset(siblingSpotsCarouselOffset, siblingSpots.value, siblingVisibleCount.value)
}

function observeSpotCarousels() {
  if (typeof ResizeObserver === 'undefined') {
    updateSpotVisibleCounts()
    return
  }
  spotResizeObserver?.disconnect()
  spotResizeObserver = new ResizeObserver(() => {
    updateSpotVisibleCounts()
  })
    ;[motherCardsEl.value, siblingCardsEl.value, subChildCardsEl.value].forEach((el) => {
      if (el) spotResizeObserver.observe(el)
    })
  updateSpotVisibleCounts()
}

const motherChildSpotsCarouselView = computed(() =>
  getSpotCarouselView(childSpots.value, childSpotsCarouselOffset.value, motherVisibleCount.value)
)
const subChildSpotsCarouselView = computed(() =>
  getSpotCarouselView(childSpots.value, childSpotsCarouselOffset.value, subChildVisibleCount.value)
)
const siblingSpotsCarouselView = computed(() =>
  getSpotCarouselView(siblingSpots.value, siblingSpotsCarouselOffset.value, siblingVisibleCount.value)
)

function shiftSpotCarousel(offsetRef, items, direction, visibleCount) {
  const list = Array.isArray(items) ? items : []
  const count = Math.max(1, Number(visibleCount) || 1)
  if (list.length <= count) return
  const maxOffset = Math.max(0, list.length - count)
  if (direction === 'prev') {
    offsetRef.value = Math.max(0, offsetRef.value - 1)
    return
  }
  offsetRef.value = Math.min(maxOffset, offsetRef.value + 1)
}

function shiftChildSpotsCarousel(direction) {
  const visibleCount = isSubSpotPage.value ? subChildVisibleCount.value : motherVisibleCount.value
  shiftSpotCarousel(childSpotsCarouselOffset, childSpots.value, direction, visibleCount)
}

function shiftSiblingSpotsCarousel(direction) {
  shiftSpotCarousel(siblingSpotsCarouselOffset, siblingSpots.value, direction, siblingVisibleCount.value)
}

const faqItems = computed(() => {
  const custom = Array.isArray(routeInfo.value?.faq) ? routeInfo.value.faq : []
  const fromData = custom
    .map((row) => ({
      q: String(row?.q || row?.question || '').trim(),
      a: String(row?.a || row?.answer || '').trim(),
    }))
    .filter((row) => row.q && row.a)
  if (fromData.length) return fromData

  const items = []
  const features = Array.isArray(routeInfo.value?.features) ? routeInfo.value.features : []
  const haystack = [
    pageTitle.value,
    pageEnTitle.value,
    routeInfo.value?.desc,
    contentTags.value.join(' '),
  ].join(' ')

  if (isDayTripInfo.value) {
    items.push({
      q: '可以在这页直接付款预订吗？',
      a: '不可以。本页用于展示行程内容，不接受在线付款。出发日期、人数和报价需通过「立刻咨询此行程」确认。',
    })
    items.push({
      q: '费用包含哪些项目？',
      a: contentTags.value.length
        ? `页面整理的行程标签包括：${contentTags.value.join('、')}。最终包含项目以确认报价单为准。`
        : '最终包含项目、用车和门票以确认报价单为准。',
    })
    items.push({
      q: '取消或改期怎么处理？',
      a: '以本站退款政策为准。已向第三方锁定的门票或车辆，可能适用更早的取消时限。',
    })
    const notice = features.find((feature) => /注意|提示|建议|时间|季节|门票|开放|预约/.test(`${feature?.title || ''}${feature?.desc || ''}`))
    if (notice?.desc) {
      items.push({
        q: /[？?]/.test(String(notice.title || '')) ? notice.title : `关于「${notice.title}」需要了解什么？`,
        a: String(notice.desc),
      })
    }
    return items.slice(0, 5)
  }

  if (isRestaurantInfo.value) {
    items.push({
      q: '营业时间和是否需要订位以什么为准？',
      a: '本页是免费参考信息，不展示实时座位和当日营业状态。是否需要订位请以餐厅官方或到店确认为准。',
    })
    items.push({
      q: '可以在这页直接订位吗？',
      a: '不可以。本页不是预订系统，也不能在此完成付款。如需代订，可通过本页「咨询」联系。',
    })
  } else if (isLodgingInfo.value) {
    items.push({
      q: '房价和空房可以在这页查到吗？',
      a: '本页是免费参考信息，不展示实时房价与空房。入住政策、价格请以住宿官方渠道为准。',
    })
    items.push({
      q: '可以在这页直接订房吗？',
      a: '不可以。本页不是预订系统，也不能在此完成付款。如需代订或搭配行程，可通过本页「咨询」联系。',
    })
  } else {
    items.push({
      q: '门票和开放时间以什么为准？',
      a: '本页是免费参考信息，不展示实时票价、剩余名额和当日开放状态。是否收费、是否预约、开放时段请以景区或场馆官方信息为准。',
    })
    items.push({
      q: '可以在这页直接买票或预约吗？',
      a: '不可以。本页不是售票或预订系统，也不能在此完成付款。如需代订，可通过本页「咨询」联系。',
    })
  }

  const notice = features.find((feature) => /注意|提示|建议|时间|季节|门票|开放|预约/.test(`${feature?.title || ''}${feature?.desc || ''}`))
  if (notice?.desc) {
    items.push({
      q: /[？?]/.test(String(notice.title || '')) ? notice.title : `关于「${notice.title}」需要了解什么？`,
      a: String(notice.desc),
    })
  }

  if (isScenicInfo.value && /国家公园|National Park/i.test(haystack)) {
    items.push({
      q: '进入国家公园需要公园通行证吗？',
      a: '塔斯马尼亚大多数国家公园需要 Parks Pass（公园通行证）。是否需要、票种和价格以 Parks Tasmania 官方为准。本页不代售通行证。',
    })
  }

  if (isScenicInfo.value && /国家公园|世界遗产|徒步|步道|荒野|海滩|瀑布|山峰|营地|National Park|World Heritage/i.test(haystack)) {
    items.push({
      q: '会因天气或火险无法前往吗？',
      a: '部分步道、公园和户外地点会因天气、火险、养护或管理需要临时关闭或改线。出发前请查询 Parks Tasmania 或该地点官方公告。',
    })
  }

  return items.slice(0, 5)
})

const handleToggleFavorite = async () => {
  if (favoriteSubmitting.value || !detailItem.value) return
  favoriteSubmitting.value = true
  const item = {
    id: pageItemId.value,
    type: resolvedItemType.value,
    itemType: resolvedItemType.value,
    title: pageTitle.value,
    enTitle: pageEnTitle.value,
    itemKey: pageItemKey.value,
    subNavName: detailItem.value?.subNavName || routeInfo.value?.displaySubNav || routeInfo.value?.subNavName || '',
    image: detailItem.value?.img || detailItem.value?.banner,
    banner: detailItem.value?.banner || detailItem.value?.img,
    town: routeInfo.value?.town || '',
    locationLabel: routeInfo.value?.locationLabel || '',
    postcode: routeInfo.value?.postcode || '',
    tripData: routeInfo.value,
  }
  try {
    const result = await toggleFavorite(item)
    notifyFavoriteResult(result)
  } catch (error) {
    notifyApiError(error, { action: '收藏操作', dedupeKey: 'favorite:toggle' })
  } finally {
    favoriteSubmitting.value = false
  }
}

const openInfoDialog = () => {
  if (!infoSourceRows.value.length) return
  infoDialogVisible.value = true
}

const openConsultationDialog = () => {
  consultationDialogVisible.value = true
}

const handleBannerChange = (currentIndex) => {
  activeBannerIndex.value = Number(currentIndex) || 0
}

const resolveChildSpotImage = (spot) => {
  const raw = pickRelatedSpotCoverPath(spot)
  if (!raw) return ''
  return resolveDataImageWithStatus(raw, { variant: 'thumb' }).src
}

const dedupeImagePaths = (paths) => {
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

function isLikelyResolvedAssetUrl(path) {
  const value = String(path || '').trim()
  if (!value) return false
  return /^(https?:|data:|blob:)/i.test(value)
    || value.includes('/node_modules/.vite/')
    || value.includes('.thumb.webp')
    || value.includes('.original.webp')
    || /^\/src\/assets\//.test(value)
}

function extractRawImagePathsFrom(source) {
  if (!source || typeof source !== 'object') return []
  const imageGroups = isRestaurantInfo.value
    ? [source.img]
    : [
      source.images,
      source.banners,
      source.bannerList,
      source.imgs,
      source.img,
      source.cover ? [source.cover] : [],
    ]
  return dedupeImagePaths(
    imageGroups.flatMap((group) => {
      if (Array.isArray(group)) return group
      if (group) return [group]
      return []
    }).filter((path) => !isLikelyResolvedAssetUrl(path))
  )
}

const dialogImagePaths = computed(() => {
  return dedupeImagePaths([
    ...extractRawImagePathsFrom(routeInfo.value),
    ...extractRawImagePathsFrom(detailItem.value),
    ...initialRawImagePaths.value,
  ])
})

const dialogImageSlides = computed(() => {
  const paths = dialogImagePaths.value
  if (paths.length === 0) {
    return [{
      originalPath: '',
      displaySrc: DEFAULT_DATA_IMAGE,
      previewSrc: DEFAULT_DATA_IMAGE,
      usedFallback: false,
      isIntentionalDefault: true,
      errorReason: '',
    }]
  }
  return paths.map((path) => {
    const thumb = resolveDataImageWithStatus(path, { variant: 'thumb' })
    const original = resolveDataImageWithStatus(path, { variant: 'original' })
    return {
      originalPath: path,
      displaySrc: thumb.src,
      previewSrc: original.src,
      usedFallback: thumb.usedFallback,
      isIntentionalDefault: false,
      errorReason: thumb.errorReason,
    }
  })
})

function getDialogImageDisplaySrc(index) {
  if (failedImageIndexes.value.has(index)) return DEFAULT_DATA_IMAGE
  return dialogImageSlides.value[index]?.displaySrc || DEFAULT_DATA_IMAGE
}

function getDialogImagePreviewSrc(index) {
  if (failedImageIndexes.value.has(index)) return DEFAULT_DATA_IMAGE
  return dialogImageSlides.value[index]?.previewSrc || DEFAULT_DATA_IMAGE
}

const dialogPreviewSrcList = computed(() =>
  dialogImageSlides.value.map((_, index) => getDialogImagePreviewSrc(index))
)

function handleDialogImageError(index) {
  const slide = dialogImageSlides.value[index]
  if (!slide?.originalPath || slide.isIntentionalDefault) return
  if (failedImageIndexes.value.has(index)) return
  failedImageIndexes.value = new Set([...failedImageIndexes.value, index])
}

const normalizeImageSourceEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return null
  const source = String(entry.source || '').trim()
  const sourceName = String(entry.sourceName || entry.sourcename || '').trim()
  const photographerLink = String(entry.photographerLink || '').trim()
  const photographer = String(entry.photographer || '').trim()
  const license = String(entry.license || '').trim()
  const licenseLink = String(entry.licenseLink || '').trim()
  if (!sourceName || !photographer) return null
  return { source, sourceName, photographerLink, photographer, license, licenseLink }
}

const imageSourceMeta = computed(() => {
  const raw = routeInfo.value?.imgSource
  if (!Array.isArray(raw) || raw.length === 0) return []
  return raw.map(normalizeImageSourceEntry).filter(Boolean)
})

const isTasTripsBrandSource = (sourceName) => {
  const n = String(sourceName || '').trim().toLowerCase().replace(/\s+/g, '')
  return n === 'tastrips' || n === 'tastrips.online'
}

const currentImageSourceMeta = computed(() => {
  if (!imageSourceMeta.value.length) return null
  return imageSourceMeta.value[activeBannerIndex.value] || imageSourceMeta.value[0] || null
})

const getImageAltText = (index) => {
  const sourceMeta = imageSourceMeta.value[index] || imageSourceMeta.value[0]
  const title = String(pageTitle.value || '').trim()
  if (title && sourceMeta?.photographer) {
    return `${title}（Photo by ${sourceMeta.photographer}）`
  }
  if (sourceMeta?.photographer && sourceMeta?.sourceName) {
    const licensePart = sourceMeta?.license ? ` · ${sourceMeta.license}` : ''
    return `Photo by ${sourceMeta.photographer} on ${sourceMeta.sourceName}${licensePart}`
  }
  return title || '详情配图'
}

function entitySchemaType() {
  if (isDayTripInfo.value) return 'TouristTrip'
  if (isRestaurantInfo.value) return 'Restaurant'
  if (isLodgingInfo.value) return 'LodgingBusiness'
  return 'TouristAttraction'
}

function applyDetailStructuredData() {
  const name = pageTitle.value || '详情'
  const image = toAbsoluteAssetUrl(dialogImageSlides.value[0]?.displaySrc || dialogImageSlides.value[0]?.previewSrc)
  const entity = {
    '@context': 'https://schema.org',
    '@type': entitySchemaType(),
    name,
    description: String(routeInfo.value?.desc || name).replace(/\s+/g, ' ').slice(0, 220),
  }
  if (pageEnTitle.value) entity.alternateName = pageEnTitle.value
  if (image) entity.image = image
  if (scenicAddressText.value) {
    entity.address = {
      '@type': 'PostalAddress',
      streetAddress: scenicAddressText.value,
      addressRegion: 'Tasmania',
      addressCountry: 'AU',
    }
  }
  applyJsonLd(ENTITY_JSONLD_ID, entity)
  const crumbs = [
    { name: '首页', path: '/trips/freeinfo' },
  ]
  if (isDayTripInfo.value) {
    crumbs.push({ name: '一日游 / 多日游', path: '/trips/routes' })
  } else {
    crumbs.push({
      name: sourceCategory.value || '免费参考信息',
      path: '/trips/freeinfo',
    })
  }
  crumbs.push({ name, path: route.path })
  applyBreadcrumbJsonLd(crumbs)
}

function openRelatedSpot(spot) {
  if (!spot) return
  openContentDetailWindow(router, {
    ...spot,
    tripType: spot.tripType || '景点信息',
    itemType: spot.itemType || '景点信息',
  })
}

function openParentSpot() {
  const payload = routeInfo.value?.parentSpotOpenPayload || parentSpotCard.value
  if (!payload) return
  openContentDetailWindow(router, {
    ...payload,
    tripType: '景点信息',
    itemType: '景点信息',
  })
}

async function enrichIfScenic(item) {
  if (!item || !isScenicContentType(item)) return item
  if (!isApiEnabled()) return item
  try {
    const scenicItems = await loadItemsBySubNav('trips/freeinfo', '景点')
    return enrichScenicRelations(item, scenicItems)
  } catch {
    return item
  }
}

async function loadPage() {
  loading.value = true
  loadError.value = ''
  detailItem.value = null
  failedImageIndexes.value = new Set()
  initialRawImagePaths.value = []
  activeBannerIndex.value = 0
  childSpotsCarouselOffset.value = 0
  siblingSpotsCarouselOffset.value = 0

  try {
    let item = null
    if (routeItemId.value && /^\d+$/.test(routeItemId.value)) {
      item = await loadCatalogItemDetail(routeItemId.value)
    }
    if (!item && routeItemKey.value) {
      item = await loadCatalogItemByKey(routeItemKey.value)
    }
    if (!item && routeItemKey.value && /^\d+$/.test(routeItemKey.value)) {
      item = await loadCatalogItemDetail(routeItemKey.value)
    }
    if (!item) {
      loadError.value = '没有找到这条信息'
      clearStructuredData()
      return
    }
    const mergedTripData = mergeImageSourceIntoTripData(item, item.tripData || {})
    const withTripData = { ...item, tripData: mergedTripData }
    detailItem.value = withTripData
    initialRawImagePaths.value = extractRawImagePathsFrom(mergedTripData)
    detailItem.value = await enrichIfScenic(withTripData)
    document.title = pageTitle.value
      ? `${pageTitle.value} | TasTrips.Online`
      : DEFAULT_PAGE_TITLE
    applyPageSeo({
      title: pageTitle.value,
      description: String(mergedTripData?.desc || pageTitle.value || '').replace(/\s+/g, ' ').slice(0, 180),
      image: dialogImageSlides.value[0]?.displaySrc || dialogImageSlides.value[0]?.previewSrc,
    })
    applyFaqJsonLd(faqItems.value)
    applyDetailStructuredData()
    await nextTick()
    bannerCarouselRef.value?.setActiveItem?.(0)
  } catch (error) {
    loadError.value = '详情加载失败，请稍后再试'
    clearStructuredData()
    notifyApiError(error, { action: '加载详情', dedupeKey: 'content-detail:load' })
  } finally {
    loading.value = false
  }
}

watch([routeItemKey, routeItemId], () => {
  void loadPage()
}, { immediate: true })

watch([childSpots, siblingSpots], () => {
  childSpotsCarouselOffset.value = 0
  siblingSpotsCarouselOffset.value = 0
})

watch(
  [loading, isSubSpotPage, hasChildSpots, siblingSpots, childSpots],
  async () => {
    await nextTick()
    observeSpotCarousels()
  }
)

function pinPageToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  navStore.saveScroll(0, route.fullPath)
}

onMounted(() => {
  if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }
  pinPageToTop()
})

watch(loading, async (isLoading) => {
  if (isLoading) {
    pinPageToTop()
    return
  }
  await nextTick()
  pinPageToTop()
})

onUnmounted(() => {
  spotResizeObserver?.disconnect()
  clearStructuredData()
})
</script>

<template>
  <div class="content-detail">
    <section class="detail-origin">
      <div class="origin-top">
        <button type="button" class="origin-back" @click="goBackToSourceList">
          <el-icon class="origin-back-icon">
            <ArrowLeft />
          </el-icon>
          <span>{{ backButtonLabel }}</span>
        </button>
        <p class="origin-trail">
          <span>{{ sourceSectionLabel }}</span>
          <i class="origin-sep" aria-hidden="true"></i>
          <span>{{ sourceCategory }}</span>
          <template v-if="sourcePlaceLabel">
            <i class="origin-sep" aria-hidden="true"></i>
            <span>{{ sourcePlaceLabel }}</span>
          </template>
        </p>
      </div>

      <template v-if="!loading && !loadError">
        <header class="detail-header">
          <div class="detail-title-wrap">
            <h1 class="detail-title">
              {{ pageTitle }}
              <span v-if="pageEnTitle" class="detail-en-title">（{{ pageEnTitle }}）</span>
            </h1>
          </div>
          <div class="detail-actions">
            <button type="button" class="favorite-action" :disabled="favoriteSubmitting" :class="{ active: isFavorite }"
              @click="handleToggleFavorite">
              {{ isFavorite ? '★ 已收藏' : '☆ 收藏' }}
            </button>
            <button type="button" class="consult-btn" @click="openConsultationDialog">{{ consultButtonLabel }}</button>
          </div>
        </header>
      </template>
    </section>

    <div class="detail-banner">
      <el-carousel v-if="!loading && !loadError && dialogImageSlides.length" ref="bannerCarouselRef" :autoplay="false"
        :interval="0" indicator-position="inside" arrow="hover" :height="BANNER_HEIGHT" @change="handleBannerChange">
        <el-carousel-item v-for="(slide, index) in dialogImageSlides" :key="`${slide.originalPath}-${index}`">
          <el-image :src="getDialogImageDisplaySrc(index)" :alt="getImageAltText(index)" class="carousel-image pointer"
            fit="cover" :preview-src-list="dialogPreviewSrcList" :initial-index="index" :zoom-rate="1.2" :max-scale="7"
            :min-scale="0.2" :lazy="index > 0" show-progress show-close show-toolbar show-index
            :preview-teleported="true" :z-index="Z_INDEX.dialog.imagePreview" @error="handleDialogImageError(index)" />
        </el-carousel-item>
      </el-carousel>
    </div>

    <div v-if="loading" class="detail-state">正在加载详情...</div>
    <div v-else-if="loadError" class="detail-state detail-state--error">{{ loadError }}</div>
    <template v-else>

      <p v-if="currentImageSourceMeta"
        :class="['img-source-note', { 'img-source-note--align-right': shouldAlignImageSourceRight }]">
        ※ Photo by
        <el-link v-if="currentImageSourceMeta.photographerLink" :href="currentImageSourceMeta.photographerLink"
          target="_blank" rel="noopener noreferrer" class="img-source-link">
          {{ currentImageSourceMeta.photographer }}
        </el-link>
        <span v-else-if="isTasTripsBrandSource(currentImageSourceMeta.sourceName)" class="img-source-highlight">
          {{ currentImageSourceMeta.photographer }}
        </span>
        <span v-else class="img-source-photographer-no-link" title="暂未提供可用的个人主页外链">
          {{ currentImageSourceMeta.photographer }}
        </span>
        on
        <el-link v-if="currentImageSourceMeta.source" :href="currentImageSourceMeta.source" target="_blank"
          rel="noopener noreferrer" class="img-source-link">
          {{ currentImageSourceMeta.sourceName }}
        </el-link>
        <span v-else-if="isTasTripsBrandSource(currentImageSourceMeta.sourceName)" class="img-source-highlight">
          {{ currentImageSourceMeta.sourceName }}
        </span>
        <span v-else class="img-source-plain">{{ currentImageSourceMeta.sourceName }}</span>
        <template v-if="currentImageSourceMeta.license">
          ·
          <el-link v-if="currentImageSourceMeta.licenseLink" :href="currentImageSourceMeta.licenseLink" target="_blank"
            rel="noopener noreferrer" class="img-source-link">
            {{ currentImageSourceMeta.license }}
          </el-link>
          <span v-else>{{ currentImageSourceMeta.license }}</span>
        </template>
      </p>

      <div :class="['detail-body', { 'detail-body--scenic': isScenicInfo }]">
        <div class="section-title" v-if="!isScenicInfo && routeInfo.route">
          {{ routeInfo.route }}
        </div>
        <div v-if="scenicAddressText || parentBelongingText" class="scenic-address">
          <div v-if="scenicAddressText" class="scenic-address-row">
            <span class="scenic-address-label">地址</span>
            <span class="scenic-address-text">{{ scenicAddressText }}</span>
          </div>
          <div v-if="parentBelongingText" class="scenic-address-row">
            <span class="scenic-address-label">位置</span>
            <span class="scenic-address-text">位于{{ parentBelongingText }}内</span>
          </div>
        </div>
        <div v-if="contentTags.length" class="tag-row">
          <span class="mini-tag" v-for="(tag, index) in contentTags" :key="`${tag}-${index}`">{{ tag }}</span>
        </div>
        <div class="section-desc">
          {{ routeInfo.desc }}
        </div>
        <div class="feature-grid">
          <div class="feature-card" v-for="(feature, index) in (routeInfo.features || [])" :key="index">
            <div class="icon" :style="{ background: feature.icon }"></div>
            <div class="f-title">{{ feature.title }}</div>
            <div class="f-desc">{{ feature.desc }}</div>
          </div>
        </div>

        <div v-if="isDayTripInfo" class="trip-map-block">
          <img :src="tasMapImg" alt="塔斯马尼亚地图" class="trip-map-img" />
        </div>
        <div v-if="orderableInfo" class="orderable-facts">
          <h2 class="faq-title">项目详情</h2>
          <p v-if="orderableInfo.preparation?.length"><strong>需要准备：</strong>{{ orderableInfo.preparation.join('、') }}
          </p>
          <p v-if="orderableInfo.personalInfo"><strong>个人信息：</strong>{{ orderableInfo.personalInfo }}</p>
          <p v-if="orderableInfo.feeBasis"><strong>费用依据：</strong>{{ orderableInfo.feeBasis }}</p>
          <div v-if="orderableInfo.singlePrice" class="orderable-price">
            {{ orderableInfo.singlePriceLabel || '价格' }}
            {{ orderableInfo.currency }} {{ orderableInfo.singlePrice }}{{ orderableInfo.priceUnit }}
            <span v-if="orderableInfo.groupPrice">
              （{{ orderableInfo.groupPriceLabel || '团购' }} {{ orderableInfo.currency }} {{ orderableInfo.groupPrice }}{{
                orderableInfo.priceUnit }}）
            </span>
          </div>
          <ul v-if="orderableInfo.notes?.length">
            <li v-for="(note, idx) in orderableInfo.notes" :key="idx">{{ note }}</li>
          </ul>
        </div>

        <div v-if="isScenicInfo && !isSubSpotPage && hasChildSpots" class="child-spots-section">
          <div class="child-spots-title">{{ childSpotsSectionTitle }}</div>
          <div class="spot-carousel">
            <button v-if="motherChildSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
              :class="{ 'spot-carousel-nav--disabled': !motherChildSpotsCarouselView.canGoPrev }"
              :disabled="!motherChildSpotsCarouselView.canGoPrev" aria-label="查看上一组"
              @click="shiftChildSpotsCarousel('prev')">
              <el-icon class="spot-carousel-nav-icon">
                <ArrowLeft />
              </el-icon>
            </button>
            <div ref="motherCardsEl" class="spot-carousel-cards"
              :style="{ gridTemplateColumns: `repeat(${motherVisibleCount}, minmax(0, 1fr))` }">
              <button v-for="spot in motherChildSpotsCarouselView.spots" :key="spot.itemKey || spot.id || spot.title"
                type="button" class="child-spot-card" :title="spot.title" @click="openRelatedSpot(spot)">
                <img v-if="resolveChildSpotImage(spot)" :src="resolveChildSpotImage(spot)" :alt="spot.title"
                  class="child-spot-thumb" loading="lazy" decoding="async" />
                <span v-else class="child-spot-thumb child-spot-thumb--empty">{{ spot.title?.slice(0, 1) || '景'
                }}</span>
                <span class="child-spot-name" :title="spot.title">{{ spot.title }}</span>
                <span v-if="spot.enTitle" class="child-spot-en-name" :title="spot.enTitle">{{ spot.enTitle }}</span>
              </button>
            </div>
            <button v-if="motherChildSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
              :class="{ 'spot-carousel-nav--disabled': !motherChildSpotsCarouselView.canGoNext }"
              :disabled="!motherChildSpotsCarouselView.canGoNext" aria-label="查看更多"
              @click="shiftChildSpotsCarousel('next')">
              <el-icon class="spot-carousel-nav-icon">
                <ArrowRight />
              </el-icon>
            </button>
          </div>
        </div>

        <div v-if="isScenicInfo && isSubSpotPage" class="sibling-spots-section">
          <div class="sibling-spots-layout">
            <div class="sibling-parent-block">
              <span class="sibling-parent-label">所属景点</span>
              <div class="sibling-spots-grid sibling-spots-grid--single">
                <button v-if="parentSpotCard" type="button" class="child-spot-card" :title="parentSpotCard.title"
                  @click="openParentSpot">
                  <img v-if="resolveChildSpotImage(parentSpotCard)" :src="resolveChildSpotImage(parentSpotCard)"
                    :alt="parentSpotCard.title" class="child-spot-thumb" loading="lazy" decoding="async" />
                  <span v-else class="child-spot-thumb child-spot-thumb--empty">{{ parentSpotCard.title?.slice(0, 1) ||
                    '景'
                  }}</span>
                  <span class="child-spot-name" :title="parentSpotCard.title">{{ parentSpotCard.title }}</span>
                  <span v-if="parentSpotCard.enTitle" class="child-spot-en-name" :title="parentSpotCard.enTitle">{{
                    parentSpotCard.enTitle }}</span>
                </button>
              </div>
            </div>
            <span v-if="siblingSpots.length" class="sibling-divider" aria-hidden="true"></span>
            <div v-if="siblingSpots.length" class="sibling-others-block">
              <span class="sibling-label">同区域其他景点</span>
              <div class="spot-carousel">
                <button v-if="siblingSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
                  :class="{ 'spot-carousel-nav--disabled': !siblingSpotsCarouselView.canGoPrev }"
                  :disabled="!siblingSpotsCarouselView.canGoPrev" aria-label="查看上一组"
                  @click="shiftSiblingSpotsCarousel('prev')">
                  <el-icon class="spot-carousel-nav-icon">
                    <ArrowLeft />
                  </el-icon>
                </button>
                <div ref="siblingCardsEl" class="spot-carousel-cards"
                  :style="{ gridTemplateColumns: `repeat(${siblingVisibleCount}, minmax(0, 1fr))` }">
                  <button v-for="spot in siblingSpotsCarouselView.spots" :key="spot.itemKey || spot.id || spot.title"
                    type="button" class="child-spot-card" :title="spot.title" @click="openRelatedSpot(spot)">
                    <img v-if="resolveChildSpotImage(spot)" :src="resolveChildSpotImage(spot)" :alt="spot.title"
                      class="child-spot-thumb" loading="lazy" decoding="async" />
                    <span v-else class="child-spot-thumb child-spot-thumb--empty">{{ spot.title?.slice(0, 1) || '景'
                    }}</span>
                    <span class="child-spot-name" :title="spot.title">{{ spot.title }}</span>
                    <span v-if="spot.enTitle" class="child-spot-en-name" :title="spot.enTitle">{{ spot.enTitle }}</span>
                  </button>
                </div>
                <button v-if="siblingSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
                  :class="{ 'spot-carousel-nav--disabled': !siblingSpotsCarouselView.canGoNext }"
                  :disabled="!siblingSpotsCarouselView.canGoNext" aria-label="查看更多"
                  @click="shiftSiblingSpotsCarousel('next')">
                  <el-icon class="spot-carousel-nav-icon">
                    <ArrowRight />
                  </el-icon>
                </button>
              </div>
            </div>
            <span v-if="hasChildSpots" class="sibling-divider" aria-hidden="true"></span>
            <div v-if="hasChildSpots" class="sibling-others-block sibling-children-block">
              <span class="sibling-label">{{ childSpotsSectionTitle }}</span>
              <div class="spot-carousel">
                <button v-if="subChildSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
                  :class="{ 'spot-carousel-nav--disabled': !subChildSpotsCarouselView.canGoPrev }"
                  :disabled="!subChildSpotsCarouselView.canGoPrev" aria-label="查看上一组"
                  @click="shiftChildSpotsCarousel('prev')">
                  <el-icon class="spot-carousel-nav-icon">
                    <ArrowLeft />
                  </el-icon>
                </button>
                <div ref="subChildCardsEl" class="spot-carousel-cards"
                  :style="{ gridTemplateColumns: `repeat(${subChildVisibleCount}, minmax(0, 1fr))` }">
                  <button v-for="spot in subChildSpotsCarouselView.spots" :key="spot.itemKey || spot.id || spot.title"
                    type="button" class="child-spot-card" :title="spot.title" @click="openRelatedSpot(spot)">
                    <img v-if="resolveChildSpotImage(spot)" :src="resolveChildSpotImage(spot)" :alt="spot.title"
                      class="child-spot-thumb" loading="lazy" decoding="async" />
                    <span v-else class="child-spot-thumb child-spot-thumb--empty">{{ spot.title?.slice(0, 1) || '景'
                    }}</span>
                    <span class="child-spot-name" :title="spot.title">{{ spot.title }}</span>
                    <span v-if="spot.enTitle" class="child-spot-en-name" :title="spot.enTitle">{{ spot.enTitle }}</span>
                  </button>
                </div>
                <button v-if="subChildSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
                  :class="{ 'spot-carousel-nav--disabled': !subChildSpotsCarouselView.canGoNext }"
                  :disabled="!subChildSpotsCarouselView.canGoNext" aria-label="查看更多"
                  @click="shiftChildSpotsCarousel('next')">
                  <el-icon class="spot-carousel-nav-icon">
                    <ArrowRight />
                  </el-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <section v-if="faqItems.length" class="faq-section">
          <h2 class="faq-title">常见问题</h2>
          <el-collapse v-model="activeFaqName" accordion>
            <el-collapse-item v-for="(faq, index) in faqItems" :key="`${faq.q}-${index}`" :name="String(index)">
              <template #title>
                <span class="faq-q">{{ faq.q }}</span>
              </template>
              <p class="faq-a">{{ faq.a }}</p>
            </el-collapse-item>
          </el-collapse>
        </section>

        <section class="service-cta">
          <h2 class="faq-title">需要行程协助？</h2>
          <p>如果需要门票、包车、接送、地陪、行程管家或定制行程，可以查看这些服务页，或通过本页咨询。</p>
          <div class="service-cta-links">
            <RouterLink v-for="item in relatedServiceLinks" :key="item.path" :to="item.path">{{ item.name }}
            </RouterLink>
          </div>
        </section>

        <div class="info-disclaimer" @click="infoSourceRows.length ? openInfoDialog() : null">
          <el-icon class="info-icon">
            <InfoFilled />
          </el-icon>
          <template v-if="infoSourceRows.length">
            本页信息来源：{{ infoSourceRows[0].desc }}
          </template>
          <template v-else>
            本页信息来源：TasTrips.Online原创
          </template>
        </div>
      </div>
    </template>

    <InfoSourceDialog v-model:visible="infoDialogVisible" :source-data="infoSourceRows"
      :entry-title="sourceEntryName" />
    <ContactDialog v-model:visible="consultationDialogVisible"
      :source-page="pageTitle || (isDayTripInfo ? '一日游详情' : '免费信息详情')"
      :source-module="isDayTripInfo ? '一日游/多日游' : '免费信息详情'" source-page-key="content-detail" source-module-key="consult"
      :source-entry-key="pageItemKey" />
  </div>
</template>

<style lang="scss" scoped>
.content-detail {
  width: 90%;
  margin: 0 auto 48px;
  background: #fff;
  color: #333;
  letter-spacing: 0;
}

.detail-origin {
  margin-bottom: 18px;
  padding: 18px 20px 16px;
  background:
    linear-gradient(180deg, rgba(51, 177, 163, 0.08) 0%, rgba(255, 255, 255, 0.9) 42%, #fff 100%);
  border: 1px solid #d7efe9;
  border-radius: 3px;
  box-shadow: 0 8px 24px rgba(39, 148, 134, 0.06);
}

.origin-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  margin-bottom: 4px;
  border-bottom: 1px dashed #cfe8e2;
}

.origin-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px 0 10px;
  border: 1px solid #33b1a3;
  border-radius: 5px;
  background: #fff;
  color: #1a7a6f;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #33b1a3;
    color: #fff;
  }
}

.origin-back-icon {
  font-size: 16px;
}

.origin-trail {
  margin: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #5f6b76;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.origin-sep {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #33b1a3;
}

.detail-state {
  padding: 64px 16px;
  text-align: center;
  color: #666;
  font-size: 15px;
}

.detail-state--error {
  color: #a94442;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 10px 0 4px;
}

.detail-title-wrap {
  min-width: 0;
  flex: 1;
}

.detail-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #111827;
  line-height: 1.35;
}

.detail-en-title {
  font-weight: 600;
  color: #4b5563;
}

.detail-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.favorite-action {
  min-width: 92px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #f59e0b;
    border-color: #f59e0b;
  }

  &.active {
    color: #d97706;
    border-color: #f59e0b;
    background: #fffbeb;
  }
}

.consult-btn {
  min-width: 92px;
  height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 8px;
  background: #33b1a3;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #2da099;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(61, 199, 190, 0.35);
  }
}

.detail-banner {
  height: 504px;
  overflow: hidden;
  background: #eef2f4;

  :deep(.el-carousel),
  :deep(.el-carousel__container) {
    height: 100% !important;
  }

  .carousel-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
}

.img-source-note {
  margin: 10px 4px 0;
  font-size: 14px;
  line-height: 1.7;
  color: #4b5563;
  word-break: break-word;
  text-align: left;
}

.img-source-note--align-right {
  text-align: right;
}

.img-source-link {
  color: #33b1a3;
  vertical-align: baseline;
}

.img-source-highlight {
  display: inline-block;
  color: #0f766e;
  font-weight: 700;
  background: rgba(51, 177, 163, 0.14);
  border-radius: 4px;
  padding: 0 4px;
  margin: 0 1px;
}

.img-source-plain {
  color: inherit;
  font-weight: 500;
}

.img-source-photographer-no-link {
  color: #4b5563;
  font-weight: 600;
  border-bottom: 1px dashed #9ca3af;
  cursor: help;
}

.detail-body {
  padding: 22px 4px 8px;
  text-align: left;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.scenic-address {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 14px;
  padding: 12px 14px;
  background: #f0faf8;
  border-left: 3px solid #279486;
  border-radius: 0 8px 8px 0;
}

.scenic-address-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.scenic-address-label {
  flex-shrink: 0;
  min-width: 2em;
  font-size: 13px;
  font-weight: 700;
  color: #279486;
  letter-spacing: 0.5px;
  line-height: 1;
}

.scenic-address-text {
  font-size: 16px;
  line-height: 1.6;
  color: #374151;
  font-weight: 500;
}

.section-desc {
  line-height: 1.85;
  color: #4b5563;
  font-weight: 400;
  margin-bottom: 16px;
  font-size: 18px;
}

.detail-body--scenic .section-desc {
  color: #1f2937;
  font-size: 21px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.feature-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  border: 1px solid #e5e7eb;
}

.icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  margin-bottom: 10px;
}

.f-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 6px;
}

.f-desc {
  color: #6b7280;
  line-height: 1.7;
  font-size: 14px;
}

.tag-row {
  margin: 0 0 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mini-tag {
  background: #f3f4f6;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #374151;
  white-space: normal;
  word-break: break-word;
}

.child-spots-section,
.sibling-spots-section {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #e5efec;
}

.faq-section {
  margin-top: 28px;
}

.faq-section :deep(.el-collapse) {
  border: none;
}

.faq-section :deep(.el-collapse-item) {
  border-bottom: 1px solid #e5efec;
}

.faq-section :deep(.el-collapse-item:last-child) {
  border-bottom: none;
}

.faq-section :deep(.el-collapse-item__header),
.faq-section :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

.child-spots-title {
  font-size: 20px;
  font-weight: 800;
  color: #1a7a6f;
  margin: 0 0 14px;
  line-height: 1.5;
  letter-spacing: 0.5px;
}

.faq-title {
  font-size: 18px;
  font-weight: 800;
  color: #1a7a6f;
  margin: 0 0 12px;
  line-height: 1.5;
  letter-spacing: 0.5px;
}

.faq-q {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  line-height: 1.45;
}

.faq-a {
  margin: 0;
  color: #374151;
  line-height: 1.8;
  font-size: 16px;
}

.trip-map-block {
  margin-top: 24px;
}

.trip-map-img {
  display: block;
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  background: #f8fafc;
  border-radius: 8px;
}

.orderable-facts {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5efec;
  color: #374151;
  line-height: 1.8;
}

.service-cta {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5efec;
}

.service-cta p {
  margin: 0;
  color: #374151;
  line-height: 1.8;
}

.service-cta-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-top: 18px;
}

.service-cta-links a {
  color: #1a7a6f;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid #d7efe9;
  border-radius: 999px;
  padding: 8px 16px;
  line-height: 1.4;
}

.sibling-parent-label {
  font-size: 17px;
  font-weight: 800;
  color: #1a7a6f;
  letter-spacing: 0.4px;
}

.sibling-label {
  font-size: 16px;
  font-weight: 700;
  color: #1a7a6f;
  letter-spacing: 0.4px;
}

.sibling-spots-layout {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.sibling-parent-block {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.sibling-divider {
  flex: 0 0 2px;
  align-self: stretch;
  min-height: 48px;
  background: #279486;
  border-radius: 1px;
}

.sibling-others-block {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sibling-spots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.sibling-spots-grid--single {
  width: 240px;
  max-width: 100%;
  grid-template-columns: 240px;
}

.spot-carousel {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.spot-carousel-cards {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 12px;
  overflow: hidden;
}

.spot-carousel-nav {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  padding: 0;
  border: none;
  background: transparent;
  color: #b8c0cc;
  cursor: pointer;

  &:hover {
    color: #6b7280;
  }

  &:disabled,
  &.spot-carousel-nav--disabled {
    color: #d1d5db;
    cursor: not-allowed;
  }
}

.spot-carousel-nav-icon {
  font-size: 44px;
  line-height: 1;
}

.child-spot-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  min-width: 0;
  padding: 10px;
  border: 1px solid #dcefe9;
  border-radius: 12px;
  background: #f7faf9;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: #33b1a3;
    box-shadow: 0 2px 8px rgba(39, 148, 134, 0.12);
  }
}

.child-spot-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 8px;
  background: #e5e7eb;
}

.child-spot-thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: #6b7280;
}

.child-spot-name,
.child-spot-en-name {
  min-width: 0;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.child-spot-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.35;
}

.child-spot-en-name {
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
  line-height: 1.2;
}

.info-disclaimer {
  margin-top: 28px;
  font-size: 14px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  .info-icon {
    color: #6b7280;
    font-size: 16px;
  }
}

@media (max-width: 900px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-header {
    flex-direction: column;
  }

  .origin-top {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .detail-title {
    font-size: 22px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .sibling-spots-layout {
    flex-direction: column;
  }

  .sibling-divider {
    display: none;
  }

  .detail-banner {
    height: 312px;
  }
}
</style>
