<script setup>
import { computed, ref, shallowRef, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElPagination, ElInput, ElIcon } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { loadFreeInfoData, loadDayTripDataFresh, loadCatalogItemDetail, searchItemsInSubNav } from '@/utils/contentRepository'
import { resolveDayTripSubNavName } from '@/utils/subNavKey'
import { fetchLocationCatalog, fetchLocationSections, isApiEnabled } from '@/utils/ttoApi'
import { resolveDataImage } from '@/utils/dataImageResolver'
import { getTownCoordinates, getDistanceBetweenTowns } from '@/utils/distanceCalculator'
import { waitRandomDelay, withLoading } from '@/utils/loadingUtils'
import { notifyApiError, notifyApiWarning } from '@/utils/apiFeedback'
import { getTourItemDialogKey, tourItemMatchesDialogKey } from '@/utils/searchItemKey'
import { tourItemMatchesKeyword } from '@/utils/searchMatchUtils'
import {
    buildLocationCatalogFromItems,
    buildLocationCascaderOptions,
    getGroupingTownFromItem,
    getLocationDisplayLabel,
    getLocationSortOrder,
    getTownByLocationLabel,
    locationCascaderFilterMethod,
    resolveLocationLabel,
    setLocationCatalogEntries,
    SORT_MODES,
    SORT_MODE_LABELS,
    UNCATEGORIZED_LOCATION,
} from '@/utils/tasLocationPostcodes'
import {
    findChildSpotItems,
    findParentSpotItemForChild,
    getSpotParentDisplayNameFromDb,
    getSubSpotSortOrderFromDb,
    isSubSpotItemFromDb,
} from '@/utils/spotRelations'

const route = useRoute()

const props = defineProps({
    activeTag: { type: String, required: true },
    subTab: { type: String, default: '景点' },
    s: { type: String, default: '' },
    dayTripTab: { type: String, default: '1' },
})

// 实际参与列表过滤的关键词（本页回车搜索 / 父级 committedKeyword）
const searchKw = computed(() => {
    // 带 dialogItemId 时优先做精确定位，不再让搜索词干扰定位列表
    if (route.query.dialogItemId) return ''

    const localExecuted = searchQuery.value.trim()
    if (localExecuted) return localExecuted

    const fromProps = (props.s || '').trim()
    if (fromProps) return fromProps

    const q = route.query.s
    return q ? String(q).trim() : ''
})

const highlightKw = computed(() => searchKw.value || localSearchKeyword.value.trim())

function syncLocalSearchFromRoute() {
    if (route.query.dialogItemId) return
    const q = route.query.s
    const hint = q ? String(q).trim() : ''
    if (!hint) return
    localSearchKeyword.value = hint
}

const emit = defineEmits(['openTourDialog', 'openPlaceList'])

// 本地搜索状态
const localSearchKeyword = ref('')
const searchQuery = ref('') // 实际执行的搜索词
const isSearching = ref(false) // 搜索加载状态
const isLocalSearch = computed(() => searchQuery.value.trim().length > 0)
const selectedLocationKey = ref([])
const selectedDistance = ref([])
const selectedLocationLabel = computed(() => {
    const arr = selectedLocationKey.value
    return Array.isArray(arr) && arr.length ? arr[arr.length - 1] : ''
})
const selectedDistanceLabel = computed(() => {
    const arr = selectedDistance.value
    return Array.isArray(arr) && arr.length ? arr[arr.length - 1] : ''
})
const sortMode = ref(SORT_MODES.POSTCODE)

const FREE_INFO_FILTER_SUBTABS = ['景点', '餐厅', '住宿']

// 执行搜索函数
const executeSearch = async () => {
    const keyword = localSearchKeyword.value.trim()
    if (!keyword) {
        searchQuery.value = ''
        return
    }

    isSearching.value = true

    try {
        await waitRandomDelay(180, 480)
        searchQuery.value = keyword
        currentPage.value = 1 // 重置到第一页
        await syncSubNavKeywordSearch()
    } finally {
        isSearching.value = false
    }
}

// 处理回车事件
const handleSearchEnter = () => {
    executeSearch()
}

// 处理清除搜索
const handleSearchClear = () => {
    localSearchKeyword.value = ''
    searchQuery.value = ''
    subNavKeywordItems.value = []
    subNavKeywordSynced.value = false
}

// 懒加载相关状态
const currentPage = ref(1)
const isLoading = ref(false)
const hasMore = ref(true)
const windowWidth = ref(window.innerWidth)
const INITIAL_RENDER_COUNT = 36
const RENDER_STEP_COUNT = 24
const FIRST_SCREEN_PRIORITY_COUNT = 8
const renderLimit = ref(INITIAL_RENDER_COUNT)
const loadMoreTriggerRef = ref(null)
let loadMoreObserver = null
let mobileScrollTicking = false
const resolvedImagePathCache = new Map()
const scenicCardImageCache = new WeakMap()
const restaurantCardImageCache = new WeakMap()
const hotelCardImageCache = new WeakMap()
const scenicBackendSections = shallowRef([])
const backendLocationSections = scenicBackendSections
const backendSectionsSynced = ref(false)
const backendSectionsLoading = ref(false)
let backendSectionsRequestSeq = 0
const locationCatalogRevision = ref(0)

const prefersBackendLocationGrid = computed(() => {
    return isApiEnabled() && FREE_INFO_FILTER_SUBTABS.includes(props.subTab)
})

function buildLocationSectionQuery() {
    return {
        sortMode: sortMode.value,
        locationLabel: selectedLocationLabel.value || undefined,
        distanceFromLabel: selectedDistanceLabel.value || undefined,
        keyword: (searchKw.value || searchQuery.value || '').trim() || undefined,
    }
}

function flattenBackendSections(sections) {
    const rows = []
    for (const section of Array.isArray(sections) ? sections : []) {
        const items = Array.isArray(section?.items) ? section.items : []
        rows.push(...items)
    }
    return dedupeItemsByIdentity(rows)
}

const useBackendLocationSections = computed(() => {
    if (!prefersBackendLocationGrid.value) return false
    return (
        backendSectionsSynced.value
        || backendLocationSections.value.length > 0
        || backendSectionsLoading.value
    )
})

const loadingState = computed(() => {
    if (isSearching.value) return true
    if (prefersBackendLocationGrid.value) {
        const awaitingFirstSections = !backendSectionsSynced.value && backendLocationSections.value.length === 0
        if (awaitingFirstSections) {
            return backendSectionsLoading.value || !backendSectionsSynced.value
        }
    }
    return false
})

function getImageLoading(index) {
    return index < FIRST_SCREEN_PRIORITY_COUNT ? 'eager' : 'lazy'
}

function getImageFetchPriority(index) {
    return index < FIRST_SCREEN_PRIORITY_COUNT ? 'high' : 'low'
}

// 移动端网格 ref（当前可见的网格只有一个）
const gridRef = ref(null)
// 仅手机端（不含 iPad）使用紧凑分页与单列网格
const PHONE_MAX_WIDTH = 480
// 移动端根据滚动位置显示的当前页码（划到哪里就是哪一页）
const mobileScrollPage = ref(1)

// 根据屏幕尺寸动态计算每页显示数量
const itemsPerPage = computed(() => {
    if (windowWidth.value <= PHONE_MAX_WIDTH) {
        if (window.matchMedia('(orientation: portrait)').matches) {
            return 3
        } else {
            return 2
        }
    }
    return 12
})

// 根据屏幕尺寸动态计算分页组件尺寸
const paginationSize = computed(() => {
    return windowWidth.value <= PHONE_MAX_WIDTH ? 'small' : 'large'
})

// 判断是否为手机端（iPad 与桌面一致，不算移动端）
const isMobile = computed(() => {
    return windowWidth.value <= PHONE_MAX_WIDTH
})

// 判断是否应该显示"后端服务暂不可用"的提示
// 当API启用但数据为空时，说明后端可能没启动或API失败
// 当API未启用时（完全使用本地文件），说明完全离线，显示"网络未连接"
// 当用户主动选择了筛选条件（地点/距离）但无匹配结果时，显示"暂无匹配结果"
const shouldShowApiErrorTip = computed(() => {
    return isApiEnabled() && !selectedLocationLabel.value && !selectedDistanceLabel.value
})

// 获取空状态提示文案
function getEmptyTipText() {
    if (selectedLocationLabel.value || selectedDistanceLabel.value) {
        return '暂无匹配结果'
    }
    if (shouldShowApiErrorTip.value) {
        return '服务暂不可用，请稍后再试'
    }
    return '网络未连接，请检查网络'
}

// 当前网格总页数（按每页 itemsPerPage 条计算，移动端页码显示用）
const mobileTotalPages = computed(() => {
    const total = getTotalItems()
    const per = itemsPerPage.value || 1
    return Math.max(1, Math.ceil(total / per))
})

// 监听窗口大小变化
const handleResize = () => {
    windowWidth.value = window.innerWidth
}

// 根据滚动位置更新显示的当前页码（划到哪里就是哪一页，每页条数按 itemsPerPage）
// 当滚动到某一页的第一行（开头）时就切换页码，而不是等整页内容都展示完
function updateMobileScrollPage() {
    if (!gridRef.value) return
    const total = getTotalItems()
    if (total <= 0) {
        mobileScrollPage.value = 1
        return
    }
    const per = itemsPerPage.value || 1
    const totalPages = Math.max(1, Math.ceil(total / per))
    const grid = gridRef.value
    const rect = grid.getBoundingClientRect()
    const gridTop = rect.top + window.pageYOffset
    const scrollOffset = window.scrollY - gridTop
    if (scrollOffset <= 0) {
        mobileScrollPage.value = 1
        return
    }
    const totalHeight = grid.scrollHeight
    if (totalHeight <= 0) {
        mobileScrollPage.value = 1
        return
    }
    const pageHeight = (totalHeight / total) * per
    // 使用 Math.ceil 而不是 Math.floor，这样当滚动到某一页的第一行时就切换页码
    // 例如：scrollOffset = pageHeight 时，Math.ceil(pageHeight / pageHeight) = 1，page = 2（第2页）
    // 而 Math.floor 需要 scrollOffset >= pageHeight 才会进入第2页
    const page = Math.ceil(scrollOffset / pageHeight) + 1
    mobileScrollPage.value = Math.min(totalPages, Math.max(1, page))
}

function scheduleUpdateMobileScrollPage() {
    if (mobileScrollTicking) return
    mobileScrollTicking = true
    requestAnimationFrame(() => {
        updateMobileScrollPage()
        maybeLoadMoreOnScroll()
        mobileScrollTicking = false
    })
}

function resetRenderLimit() {
    renderLimit.value = INITIAL_RENDER_COUNT
}

function increaseRenderLimit() {
    const totalItems = getTotalItems()
    if (renderLimit.value >= totalItems) return
    renderLimit.value = Math.min(totalItems, renderLimit.value + RENDER_STEP_COUNT)
    nextTick(initLoadMoreObserver)
}

function maybeLoadMoreOnScroll() {
    if (!hasMore.value || shouldLoadAll.value || shouldShowAllLocationGridItems.value) return
    const scrollBottom = window.scrollY + window.innerHeight
    const pageBottom = document.documentElement.scrollHeight
    if (scrollBottom >= pageBottom - 800) {
        increaseRenderLimit()
        checkHasMore()
    }
}

function initLoadMoreObserver() {
    if (typeof window === 'undefined') return
    if (!('IntersectionObserver' in window)) return
    if (!loadMoreTriggerRef.value) return

    if (loadMoreObserver) {
        loadMoreObserver.disconnect()
    }

    loadMoreObserver = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting)) return
        increaseRenderLimit()
        checkHasMore()
    }, {
        root: null,
        rootMargin: '600px 0px 600px 0px',
        threshold: 0
    })

    loadMoreObserver.observe(loadMoreTriggerRef.value)
}

onMounted(() => {
    void withLoading(async () => {
        const [loaded, dayTrips] = await Promise.all([
            loadFreeInfoData(),
            loadDayTripDataFresh(),
        ])
        if (loaded?.subNav?.length) {
            datas.value = loaded
        }
        if (Array.isArray(dayTrips) && dayTrips.length) {
            dayTripNavs.value = dayTrips
        } else if (isApiEnabled()) {
            notifyApiWarning('暂时无法加载，请稍后再试', {
                dedupeKey: 'trips:daytrip-empty',
            })
        }
    }, { text: '正在加载内容...' }).catch((error) => {
        if (isApiEnabled()) {
            notifyApiError(error, { action: '加载内容', dedupeKey: 'trips:load' })
        }
    })

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', scheduleUpdateMobileScrollPage, { passive: true })
    syncLocalSearchFromRoute()
    checkHasMore()

    // 如果检测到需要自动加载所有数据，立即加载（仅非搜索场景）
    if (shouldLoadAll.value) {
        setTimeout(() => {
            void loadAllItems()
        }, 100)
    }

    // 如果是通过搜索结果携带 dialogItemId 打开的页面，定位到包含该结果的页码
    if (route.query.dialogItemId) {
        locateTargetPageForDialogItem()
    }

    nextTick(() => {
        updateMobileScrollPage()
        initLoadMoreObserver()
    })
})
// 检测是否需要自动加载所有数据（兼容老的“高亮跳转”逻辑）
// 说明：
// - 之前在搜索结果新窗口打开时，会带上 s + dialogItemId，通过 shouldLoadAll 一次性渲染全部结果
// - 现在景点网格已经改为分页显示，如果继续“加载全部”，会导致所有结果都挤在第一页上，分页按钮形同虚设
// - 因此：只在“没有搜索关键词时且带有 dialogItemId”才保留旧逻辑；搜索场景一律走正常分页
const shouldLoadAll = computed(() => {
    return !!(route.query.dialogItemId && !route.query.s)
})

// 解析 URL 中需要高亮的条目标题
const targetItemTitle = computed(() => {
    const id = route.query.dialogItemId
    if (!id) return ''
    try {
        return decodeURIComponent(String(id))
    } catch {
        return String(id)
    }
})

// 根据当前上下文获取“完整列表”（与网格展示顺序一致），用于计算目标条目所在页
function getFullListForLocate() {
    // 一日游场景
    if (props.activeTag === '一日游/多日游') {
        return dayTripFiltered.value || []
    }

    if (props.subTab === '景点') return scenicDisplayItems.value || []
    if (props.subTab === '餐厅') return restaurantDisplayItems.value || []
    if (props.subTab === '住宿') return hotelDisplayItems.value || []
    if (isSpecialSection.value) {
        return searchKw.value ? (activityFiltered.value || []) : (currentSpecialItems.value || [])
    }
    return []
}

// 定位“要高亮的结果”所在的页码，并更新 currentPage
// 当从搜索结果页打开时，只加载到目标结果所在的页数（之前的页都显示，之后的页不显示）
function locateTargetPageForDialogItem() {
    const title = targetItemTitle.value?.trim()
    if (!title) return

    const list = getFullListForLocate()
    if (!Array.isArray(list) || !list.length) return

    // 以 title 精确匹配；如需更宽松可以改成 includes / 忽略大小写
    const index = list.findIndex((item) => tourItemMatchesDialogKey(item, title))
    if (index === -1) return

    const pageSize = itemsPerPage.value || 1
    const targetPage = Math.max(1, Math.floor(index / pageSize) + 1)
    currentPage.value = targetPage
    mobileScrollPage.value = targetPage
    const targetVisibleCount = Math.max(INITIAL_RENDER_COUNT, targetPage * pageSize)
    renderLimit.value = Math.min(list.length, targetVisibleCount)
    hasMore.value = renderLimit.value < list.length
}


// 处理页码变化
const handlePageChange = (page) => {
    currentPage.value = page
    const gridElement = document.querySelector('.coming-grid')
    if (gridElement) {
        const offsetTop = gridElement.getBoundingClientRect().top + window.pageYOffset
        window.scrollTo({ top: offsetTop - 180, behavior: 'smooth' })
    }
}

// 处理加载更多
const handleLoadMore = () => {
    if (isLoading.value || !hasMore.value) return
    increaseRenderLimit()
    checkHasMore()
}

// 检查是否还有更多数据
function checkHasMore() {
    if (shouldShowAllLocationGridItems.value) {
        hasMore.value = false
        return
    }
    const totalItems = getTotalItems()
    hasMore.value = renderLimit.value < totalItems
}

// 获取当前应该显示的数据总数
function getTotalItems() {
    const searchKeyword = searchKw.value || searchQuery.value || ''
    const hasSearch = searchKeyword.trim().length > 0

    if (props.activeTag === '一日游/多日游') {
        return dayTripFiltered.value.length
    } else if (hasSearch) {
        if (props.subTab === '景点') return scenicFiltered.value.length
        if (props.subTab === '餐厅') return restaurantFiltered.value.length
        if (props.subTab === '住宿') return hotelFiltered.value.length
        if (isSpecialSection.value) return activityFiltered.value.length
    } else {
        if (props.subTab === '景点') {
            const mainCount = scenicMainGridItems.value.length
            if (selectedLocationLabel.value) return mainCount
            return mainCount + scenicUncategorizedDisplayItems.value.length
        }
        if (props.subTab === '餐厅') return restaurantFiltered.value.length
        if (props.subTab === '住宿') return hotelFiltered.value.length
        if (isSpecialSection.value) return currentSpecialItems.value.length
    }
    return 0
}

// 自动加载所有数据（用于新窗口打开时的高亮功能）
async function loadAllItems() {
    if (isLoading.value) return

    const totalItems = getTotalItems()
    if (totalItems <= 0) return

    if (renderLimit.value < totalItems) {
        isLoading.value = true
        try {
            renderLimit.value = totalItems
            hasMore.value = false
            await waitRandomDelay(220, 360)
        } finally {
            isLoading.value = false
        }
    }
}

// 获取分页后的数据
function getPaginatedItems(items) {
    // 如果需要自动加载所有数据，返回所有数据
    if (shouldLoadAll.value) {
        return items
    }

    // 免费信息地点分区网格：已分类条目必须一次全部展示，否则 renderLimit 截断后
    // 会直接跳到「暂未分类」区块，7112+ 等中间邮编在 DOM 中缺失。
    if (shouldShowAllLocationGridItems.value) {
        return Array.isArray(items) ? items : []
    }

    const visibleCount = Math.max(renderLimit.value, itemsPerPage.value)
    return Array.isArray(items) ? items.slice(0, visibleCount) : []
}

// 从 contentRepository / JSON 获取数据
const datas = shallowRef({ subNav: [] })
const dayTripNavs = shallowRef([])

const places = computed(() => datas.value.subNav.find(subItem => subItem.subNavName == "景点") || { items: [] })
const restaurants = computed(() => datas.value.subNav.find(subItem => subItem.subNavName == "餐厅") || { items: [] })
const hotels = computed(() => datas.value.subNav.find(subItem => subItem.subNavName == "住宿") || { items: [] })

function getCurrentLocationItems() {
    if (props.subTab === '景点') return places.value?.items || []
    if (props.subTab === '餐厅') return restaurants.value?.items || []
    if (props.subTab === '住宿') return hotels.value?.items || []
    return []
}

async function syncLocationCatalogRows() {
    if (!isApiEnabled()) {
        setLocationCatalogEntries(buildLocationCatalogFromItems(getCurrentLocationItems()))
        locationCatalogRevision.value += 1
        return
    }
    if (!FREE_INFO_FILTER_SUBTABS.includes(props.subTab)) {
        return
    }

    const rows = await fetchLocationCatalog(props.subTab, { sortMode: sortMode.value })
    setLocationCatalogEntries(Array.isArray(rows) ? rows : [])
    locationCatalogRevision.value += 1
}

async function syncBackendLocationSections() {
    if (!isApiEnabled() || !FREE_INFO_FILTER_SUBTABS.includes(props.subTab)) {
        return
    }

    const requestId = ++backendSectionsRequestSeq
    backendSectionsLoading.value = true

    try {
        const sections = await fetchLocationSections(props.subTab, buildLocationSectionQuery())
        if (requestId !== backendSectionsRequestSeq) return
        backendLocationSections.value = Array.isArray(sections) ? sections : []
        backendSectionsSynced.value = true
    } catch (error) {
        if (requestId !== backendSectionsRequestSeq) return
        notifyApiError(error, { action: '加载地点分组', dedupeKey: 'trips:location-sections' })
        if (backendLocationSections.value.length === 0) {
            backendSectionsSynced.value = false
        }
    } finally {
        if (requestId === backendSectionsRequestSeq) {
            backendSectionsLoading.value = false
        }
    }
}

async function syncLocationCatalog() {
    if (!isApiEnabled()) {
        backendLocationSections.value = []
        backendSectionsSynced.value = false
    }

    try {
        await syncLocationCatalogRows()
    } catch (error) {
        notifyApiError(error, { action: '加载地点目录', dedupeKey: 'trips:location-catalog' })
        if (isApiEnabled()) {
            setLocationCatalogEntries([])
            locationCatalogRevision.value += 1
        }
    }

    if (isApiEnabled() && FREE_INFO_FILTER_SUBTABS.includes(props.subTab)) {
        await syncBackendLocationSections()
    }
}

const SPECIAL_SECTION_FALLBACK_IMAGES = [
    new URL('@/assets/img/footer1.jpg', import.meta.url).href,
    new URL('@/assets/img/footer2.jpg', import.meta.url).href,
    new URL('@/assets/img/footer3.jpg', import.meta.url).href,
    new URL('@/assets/img/footer4.jpg', import.meta.url).href,
]

function getActivityImage(imgPath, index = 0) {
    const fallback = SPECIAL_SECTION_FALLBACK_IMAGES[index % SPECIAL_SECTION_FALLBACK_IMAGES.length]
    return getThumbImageUrl(imgPath, fallback)
}

// 处理图片路径
function getImageUrl(imgPath) {
    const cacheKey = String(imgPath || '')
    if (resolvedImagePathCache.has(cacheKey)) {
        return resolvedImagePathCache.get(cacheKey)
    }
    const resolved = resolveDataImage(imgPath)
    resolvedImagePathCache.set(cacheKey, resolved)
    return resolved
}

function getThumbImageUrl(imgPath, fallback = '') {
    const cacheKey = `thumb::${String(imgPath || '')}::${String(fallback || '')}`
    if (resolvedImagePathCache.has(cacheKey)) {
        return resolvedImagePathCache.get(cacheKey)
    }
    const resolved = resolveDataImage(imgPath, fallback, { variant: 'thumb' })
    resolvedImagePathCache.set(cacheKey, resolved)
    return resolved
}

function normalizeImageList(images) {
    if (!Array.isArray(images)) return []
    return images.map(img => getImageUrl(img)).filter(Boolean)
}

function getRestaurantGridImageUrl(item) {
    if (item && restaurantCardImageCache.has(item)) {
        return restaurantCardImageCache.get(item)
    }

    let resolvedUrl = ''
    // 检查 cover
    const hasCoverField = item && Object.prototype.hasOwnProperty.call(item, 'cover')
    if (hasCoverField) {
        const coverPath = String(item?.cover || '').trim()
        if (coverPath) {
            const resolvedCover = getThumbImageUrl(coverPath, '')
            if (resolvedCover) resolvedUrl = resolvedCover
        }
    }
    // cover 为空，检查 img
    if (!resolvedUrl && item?.img) {
        if (Array.isArray(item.img)) {
            if (item.img.length >= 2) {
                // 餐厅使用第二张图片
                const secondImagePath = String(item.img[1] || '').trim()
                if (secondImagePath) {
                    const resolvedImage = getThumbImageUrl(secondImagePath, '')
                    if (resolvedImage) resolvedUrl = resolvedImage
                }
            }
            // 如果没有第二张或解析失败，使用第一张
            for (const imagePath of item.img) {
                if (resolvedUrl) break
                const normalizedPath = String(imagePath || '').trim()
                if (!normalizedPath) continue
                const resolvedImage = getThumbImageUrl(normalizedPath, '')
                if (resolvedImage) resolvedUrl = resolvedImage
            }
        } else {
            // img 不是数组，直接使用
            const resolvedImage = getThumbImageUrl(item.img, '')
            if (resolvedImage) resolvedUrl = resolvedImage
        }
    }
    const finalUrl = resolvedUrl || getImageUrl('')
    if (item && typeof item === 'object') {
        restaurantCardImageCache.set(item, finalUrl)
    }
    return finalUrl
}

function getScenicGridImageUrl(item) {
    if (item && scenicCardImageCache.has(item)) {
        return scenicCardImageCache.get(item)
    }

    let resolvedUrl = ''
    // 检查 cover
    const hasCoverField = item && Object.prototype.hasOwnProperty.call(item, 'cover')
    if (hasCoverField) {
        const coverPath = String(item?.cover || '').trim()
        if (coverPath) {
            const resolvedCover = getThumbImageUrl(coverPath, '')
            if (resolvedCover) resolvedUrl = resolvedCover
        }
    }
    // cover 为空，检查 img
    if (!resolvedUrl && item?.img) {
        if (Array.isArray(item.img)) {
            // 景点使用第一张图片
            for (const imagePath of item.img) {
                if (resolvedUrl) break
                const normalizedPath = String(imagePath || '').trim()
                if (!normalizedPath) continue
                const resolvedImage = getThumbImageUrl(normalizedPath, '')
                if (resolvedImage) resolvedUrl = resolvedImage
            }
        } else {
            // img 不是数组，直接使用
            const resolvedImage = getThumbImageUrl(item.img, '')
            if (resolvedImage) resolvedUrl = resolvedImage
        }
    }
    const finalUrl = resolvedUrl || getImageUrl('')
    if (item && typeof item === 'object') {
        scenicCardImageCache.set(item, finalUrl)
    }
    return finalUrl
}

function getHotelGridImageUrl(item) {
    if (item && hotelCardImageCache.has(item)) {
        return hotelCardImageCache.get(item)
    }

    let resolvedUrl = ''
    // 检查 cover
    const hasCoverField = item && Object.prototype.hasOwnProperty.call(item, 'cover')
    if (hasCoverField) {
        const coverPath = String(item?.cover || '').trim()
        if (coverPath) {
            const resolvedCover = getThumbImageUrl(coverPath, '')
            if (resolvedCover) resolvedUrl = resolvedCover
        }
    }
    // cover 为空，检查 img
    if (!resolvedUrl && item?.img) {
        if (Array.isArray(item.img)) {
            // 住宿使用第一张图片
            for (const imagePath of item.img) {
                if (resolvedUrl) break
                const normalizedPath = String(imagePath || '').trim()
                if (!normalizedPath) continue
                const resolvedImage = getThumbImageUrl(normalizedPath, '')
                if (resolvedImage) resolvedUrl = resolvedImage
            }
        } else {
            // img 不是数组，直接使用
            const resolvedImage = getThumbImageUrl(item.img, '')
            if (resolvedImage) resolvedUrl = resolvedImage
        }
    }
    const finalUrl = resolvedUrl || getImageUrl('')
    if (item && typeof item === 'object') {
        hotelCardImageCache.set(item, finalUrl)
    }
    return finalUrl
}

function getDayTripGridImageUrl(item) {
    if (!item || typeof item !== 'object') {
        return getImageUrl('')
    }

    let resolvedUrl = ''
    const hasCoverField = Object.prototype.hasOwnProperty.call(item, 'cover')
    if (hasCoverField) {
        const coverPath = String(item?.cover || '').trim()
        if (coverPath) {
            const resolvedCover = getThumbImageUrl(coverPath, '')
            if (resolvedCover) resolvedUrl = resolvedCover
        }
    }

    if (!resolvedUrl) {
        const candidateGroups = [
            item?.img,
            item?.images,
            item?.banners,
            item?.bannerList,
            item?.tripData?.cover ? [item.tripData.cover] : [],
            item?.tripData?.img,
            item?.tripData?.images,
            item?.tripData?.banners,
            item?.tripData?.bannerList
        ]
        const candidatePaths = candidateGroups
            .flatMap(group => Array.isArray(group) ? group : [group])
            .map(path => String(path || '').trim())
            .filter(Boolean)

        for (const imagePath of candidatePaths) {
            const resolvedImage = getThumbImageUrl(imagePath, '')
            if (resolvedImage) {
                resolvedUrl = resolvedImage
                break
            }
        }
    }

    return resolvedUrl || getImageUrl('')
}

// 免费信息：当前子项（如 特别活动/徒步线路/塔州露营地）数据
const currentFreeInfoSection = computed(() => {
    try {
        if (!datas.value?.subNav || !props.subTab) return null
        return datas.value.subNav.find(subItem => subItem.subNavName === props.subTab) || null
    } catch (e) {
        return null
    }
})

// 是否为免费信息下的“内容块模式”（isGrid=false）
function isFalseLike(value) {
    return value === false || value === 0 || value === '0' || value === 'false'
}

const isSpecialSection = computed(() => {
    return props.activeTag === '自助游/自驾游免费参考信息' && isFalseLike(currentFreeInfoSection?.value?.isGrid)
})

// 当前展示用的“特别内容”列表与标题
const currentSpecialItems = computed(() => currentFreeInfoSection?.value?.items || [])
const currentSpecialTitle = computed(() => currentFreeInfoSection?.value?.activitiesTitle || '塔斯马尼亚特别内容')
const currentSpecialSubtitle = computed(() => currentFreeInfoSection?.value?.activitiesSubtitle || '')

const subNavKeywordItems = shallowRef([])
const subNavKeywordSynced = ref(false)

const useSubNavKeywordSearch = computed(() => {
    const kw = (searchKw.value || searchQuery.value || '').trim()
    return isApiEnabled() && subNavKeywordSynced.value && kw.length > 0
})

async function syncSubNavKeywordSearch() {
    const kw = (searchKw.value || searchQuery.value || '').trim()
    subNavKeywordItems.value = []
    subNavKeywordSynced.value = false
    if (!isApiEnabled() || !kw) {
        return
    }

    let sectionPath = ''
    let subNavName = ''
    if (props.activeTag === '一日游/多日游') {
        sectionPath = 'trips/routes'
        subNavName = resolveDayTripSubNavName(props.dayTripTab, dayTripNavs.value)
    } else if (isSpecialSection.value) {
        sectionPath = 'trips/freeinfo'
        subNavName = props.subTab
    }
    if (!sectionPath || !subNavName) {
        return
    }

    try {
        subNavKeywordItems.value = await searchItemsInSubNav(sectionPath, subNavName, kw)
        subNavKeywordSynced.value = true
    } catch (error) {
        subNavKeywordSynced.value = false
        subNavKeywordItems.value = []
        notifyApiError(error, { action: '搜索', dedupeKey: 'trips:subnav-search' })
    }
}

// 监听props变化，重置分页
watch(() => [props.activeTag, props.subTab, searchKw.value, props.dayTripTab], () => {
    currentPage.value = 1
    mobileScrollPage.value = 1
    resetRenderLimit()
    hasMore.value = true
    checkHasMore()
    void syncSubNavKeywordSearch()

    // 如果需要自动加载所有数据，立即加载
    if (shouldLoadAll.value) {
        void loadAllItems()
    }

    // 如果是通过 dialogItemId 打开，props 变更后重新定位页码
    if (route.query.dialogItemId) {
        locateTargetPageForDialogItem()
    }

    nextTick(updateMobileScrollPage)
}, { deep: true })

// 当 URL 中的 dialogItemId / 搜索词 / 子标签 或每页数量变化时，尝试重新定位目标页
watch(
    () => [targetItemTitle.value, searchKw.value, props.subTab, itemsPerPage.value, datas.value],
    () => {
        if (!route.query.dialogItemId) return
        locateTargetPageForDialogItem()
    },
    { deep: true }
)

watch(
    () => route.query.s,
    () => {
        syncLocalSearchFromRoute()
        void syncSubNavKeywordSearch()
    }
)

watch(() => [selectedLocationLabel.value, selectedDistanceLabel.value, sortMode.value, searchKw.value, searchQuery.value, props.subTab], () => {
    currentPage.value = 1
    mobileScrollPage.value = 1
    resetRenderLimit()
    hasMore.value = true
    checkHasMore()
    nextTick(updateMobileScrollPage)
    if (isApiEnabled() && FREE_INFO_FILTER_SUBTABS.includes(props.subTab)) {
        void syncBackendLocationSections()
    }
})

watch(() => props.subTab, () => {
    selectedLocationKey.value = []
    selectedDistance.value = []
    backendSectionsRequestSeq += 1
    backendLocationSections.value = []
    backendSectionsSynced.value = false
    backendSectionsLoading.value = false
    locationCatalogRevision.value += 1
})

watch(() => sortMode.value, async () => {
    selectedLocationKey.value = []
    selectedDistance.value = []
    if (!isApiEnabled() || !FREE_INFO_FILTER_SUBTABS.includes(props.subTab)) {
        return
    }
    try {
        await syncLocationCatalogRows()
    } catch (error) {
        notifyApiError(error, { action: '加载地点目录', dedupeKey: 'trips:location-catalog-sort' })
        setLocationCatalogEntries([])
        locationCatalogRevision.value += 1
    }
})

watch(() => loadMoreTriggerRef.value, () => {
    nextTick(initLoadMoreObserver)
})
const shouldShowLocationFilter = computed(() => {
    return props.activeTag === '自助游/自驾游免费参考信息' && FREE_INFO_FILTER_SUBTABS.includes(props.subTab)
})

/** 景点/餐厅/住宿默认网格：按地点分区展示，不做 renderLimit 截断 */
const shouldShowAllLocationGridItems = computed(() => {
    if (props.activeTag === '一日游/多日游') return false
    const hasSearch = (searchKw.value || searchQuery.value || '').trim().length > 0
    if (hasSearch || isLocalSearch.value) return false
    if (props.activeTag !== '自助游/自驾游免费参考信息') return false
    return FREE_INFO_FILTER_SUBTABS.includes(props.subTab)
})

const shouldShowAreaFilters = computed(() => shouldShowLocationFilter.value)

watch(() => shouldShowAreaFilters.value, (enabled) => {
    if (!enabled) {
        selectedLocationKey.value = []
        selectedDistance.value = []
    }
})

function filterByLocation(items) {
    const sourceItems = Array.isArray(items) ? items : []
    if (!shouldShowLocationFilter.value || !selectedLocationLabel.value) return sourceItems

    return sourceItems.filter(item => resolveLocationLabel(item) === selectedLocationLabel.value)
}

const locationFilterSourceItems = computed(() => {
    if (prefersBackendLocationGrid.value) {
        return []
    }
    if (props.subTab === '景点') return places.value?.items || []
    if (props.subTab === '餐厅') return restaurants.value?.items || []
    if (props.subTab === '住宿') return hotels.value?.items || []
    return []
})

const locationCascaderOptions = computed(() => {
    void locationCatalogRevision.value
    return buildLocationCascaderOptions(locationFilterSourceItems.value, sortMode.value)
})

const locationCascaderFieldProps = {
    expandTrigger: 'click',
    showAllLevels: false,
}

function getDistanceReferenceTown() {
    if (!selectedDistanceLabel.value) return ''
    return getTownByLocationLabel(selectedDistanceLabel.value) || selectedDistanceLabel.value
}

function getItemDistance(item) {
    const referenceTown = getDistanceReferenceTown()
    if (!referenceTown) return null

    const itemTown = getGroupingTownFromItem(item)
    if (!itemTown) return null
    return getDistanceBetweenTowns(referenceTown, itemTown)
}

function sortByDistance(items) {
    const list = Array.isArray(items) ? [...items] : []

    const sortableItems = []
    const unsortableItems = []

    list.forEach(item => {
        const distance = getItemDistance(item)
        if (distance !== null) {
            sortableItems.push({ item, distance })
        } else {
            unsortableItems.push(item)
        }
    })

    sortableItems.sort((a, b) => {
        if (a.distance !== b.distance) {
            return a.distance - b.distance
        }
        return String(a.item?.title || '').localeCompare(String(b.item?.title || ''), 'zh-Hans-CN')
    })

    return [...sortableItems.map(s => s.item), ...unsortableItems]
}

function getLocationDisplayName(item) {
    const label = resolveLocationLabel(item)
    return getLocationDisplayLabel(label, sortMode.value)
}

function sortByLocation(items) {
    const list = Array.isArray(items) ? [...items] : []
    return list.sort((a, b) => {
        const leftLabel = resolveLocationLabel(a)
        const rightLabel = resolveLocationLabel(b)
        const leftOrder = getLocationSortOrder(a, sortMode.value)
        const rightOrder = getLocationSortOrder(b, sortMode.value)
        if (leftOrder !== rightOrder) return leftOrder - rightOrder

        const leftTown = getTownByLocationLabel(leftLabel) || leftLabel
        const rightTown = getTownByLocationLabel(rightLabel) || rightLabel
        const townDiff = String(leftTown || '').localeCompare(String(rightTown || ''), 'en', { sensitivity: 'base' })
        if (townDiff !== 0) return townDiff

        const subSpotDiff = getSubSpotSortOrderFromDb(a) - getSubSpotSortOrderFromDb(b)
        if (subSpotDiff !== 0) return subSpotDiff
        return String(a?.title || '').localeCompare(String(b?.title || ''), 'zh-Hans-CN')
    })
}

function shouldShowLocationTitle(list, index) {
    if (!Array.isArray(list) || !list.length) return false
    if (index === 0) return true
    return getLocationDisplayName(list[index]) !== getLocationDisplayName(list[index - 1])
}

const scenicDisplayItems = computed(() => {
    if (prefersBackendLocationGrid.value) {
        if (!useBackendLocationSections.value) return []
        return scenicFiltered.value
    }
    const baseItems = sortByLocation(scenicFiltered.value)
    if (selectedDistanceLabel.value) {
        return sortByDistance(baseItems)
    }
    return baseItems
})

const scenicCategorizedDisplayItems = computed(() => {
    return scenicDisplayItems.value.filter(item => resolveLocationLabel(item) !== UNCATEGORIZED_LOCATION)
})

const scenicUncategorizedDisplayItems = computed(() => {
    return scenicDisplayItems.value.filter(item => resolveLocationLabel(item) === UNCATEGORIZED_LOCATION)
})

const scenicMainGridItems = computed(() => {
    if (selectedLocationLabel.value) return scenicDisplayItems.value
    return scenicCategorizedDisplayItems.value
})

function buildScenicSectionsFromItems(items) {
    const sections = []
    const sectionByLabel = new Map()
    let startIndex = 0

    for (const item of Array.isArray(items) ? items : []) {
        const label = resolveLocationLabel(item)
        if (!label) continue

        if (!sectionByLabel.has(label)) {
            const section = {
                label,
                title: getLocationDisplayName(item),
                items: [],
                startIndex,
            }
            sectionByLabel.set(label, section)
            sections.push(section)
        }

        sectionByLabel.get(label).items.push(item)
        startIndex += 1
    }

    return sections
}

function normalizeBackendScenicSections(sections) {
    const rows = []
    let startIndex = 0
    for (const section of Array.isArray(sections) ? sections : []) {
        const items = Array.isArray(section?.items) ? section.items : []
        const label = String(section?.label || section?.locationLabel || section?.title || '').trim() || UNCATEGORIZED_LOCATION
        rows.push({
            label,
            title: String(section?.title || label).trim() || label,
            items,
            startIndex,
        })
        startIndex += items.length
    }
    return rows
}

const scenicMainGridSections = computed(() => {
    if (prefersBackendLocationGrid.value) {
        if (!useBackendLocationSections.value) return []
        return normalizeBackendScenicSections(backendLocationSections.value)
    }
    return buildScenicSectionsFromItems(scenicMainGridItems.value || [])
})

const restaurantDisplayItems = computed(() => {
    if (prefersBackendLocationGrid.value) {
        if (!useBackendLocationSections.value) return []
        return flattenBackendSections(backendLocationSections.value)
    }
    const baseItems = sortByLocation(restaurantFiltered.value)
    if (selectedDistanceLabel.value) {
        return sortByDistance(baseItems)
    }
    return baseItems
})
const hotelDisplayItems = computed(() => {
    if (prefersBackendLocationGrid.value) {
        if (!useBackendLocationSections.value) return []
        return flattenBackendSections(backendLocationSections.value)
    }
    const baseItems = sortByLocation(hotelFiltered.value)
    if (selectedDistanceLabel.value) {
        return sortByDistance(baseItems)
    }
    return baseItems
})

// 派生数据 - 从data.json获取适合当前标签的数据
const gridItems = computed(() => {
    try {
        if (!props.activeTag) return []

        if (props.activeTag === '一日游/多日游') {
            return getDayTripItems(props.dayTripTab)
        } else {
            // 对于其他标签，保持原有的生成逻辑
            const scenicPlaces = [
                '菲欣拿国家公园', '摇篮山', '火焰湾', '酒杯湾', '玛丽亚岛', '塔斯曼半岛', '布鲁尼岛', '霍巴特海滨',
                '朗塞斯顿峡谷', '圣海伦斯', '比切诺', '斯坦利小镇', '里士满古桥', '亚瑟港', '德文波特', '塔拉娜自然保护区'
            ]

            function seededRandom(seed) {
                let x = Math.sin(seed) * 10000
                return x - Math.floor(x)
            }

            const items = []
            for (let i = 0; i < 32; i++) {
                const r = seededRandom(i + (props.activeTag?.length || 0))
                const idx = Math.floor(r * scenicPlaces.length) % scenicPlaces.length
                const place = scenicPlaces[idx]

                const driveThemes = ['自驾环线', '观景台', '徒步步道', '日落观景点', '海岸公路', '森林小径', '瀑布探秘', '轻装徒步']
                const themeIdx = Math.floor(seededRandom(idx + i) * driveThemes.length) % driveThemes.length
                const subTitle = driveThemes[themeIdx]

                items.push({ title: `${place}`, sub: subTitle })
            }
            return items
        }
    } catch (error) {
        return []
    }
})

// 文本搜索匹配（支持英文单词模糊匹配，如 wonders of 匹配 wonder of）
function normalizeForSearch(str) {
    return (str || '').toLowerCase()
}

function tokenizeForSearch(str) {
    return normalizeForSearch(str).split(/[\s,./\\\-+()]+/).filter(Boolean)
}

function matchesKeyword(text, kw) {
    const kwRaw = (kw || '').trim()
    if (!kwRaw) return true

    const kwNorm = normalizeForSearch(kwRaw)
    const textNorm = normalizeForSearch(text)

    // 如果包含非 ASCII 字符（如中文），使用简单包含匹配，避免拆词出错
    if (/[^\x00-\x7f]/.test(kwNorm) || /[^\x00-\x7f]/.test(textNorm)) {
        return textNorm.includes(kwNorm)
    }

    const kwTokens = tokenizeForSearch(kwNorm)
    if (!kwTokens.length) return true

    const textTokens = tokenizeForSearch(textNorm)
    if (!textTokens.length) return false

    // 规则：关键字中的每个词，都要能在文本词里找到“同根”匹配：
    // - 完全相同：wonder == wonder
    // - 复数/单数：wonders == wonder 或 wonder == wonders
    return kwTokens.every(kwTok =>
        textTokens.some(tt => {
            if (tt === kwTok) return true
            if (tt === kwTok + 's') return true
            if (tt + 's' === kwTok) return true
            return false
        })
    )
}

// 生成高亮片段：精确匹配字符，搜 wonder 只高亮 wonder 部分（不是整个 wonders）
function getHighlightSegments(text, kw) {
    const raw = text || ''
    const kwRaw = (kw || '').trim()
    if (!kwRaw) return [{ text: raw, highlight: false }]

    const kwNorm = normalizeForSearch(kwRaw)
    const textNorm = normalizeForSearch(raw)

    // 如果包含非 ASCII 字符（如中文），使用简单包含匹配
    if (/[^\x00-\x7f]/.test(kwNorm) || /[^\x00-\x7f]/.test(textNorm)) {
        const index = textNorm.indexOf(kwNorm)
        if (index === -1) return [{ text: raw, highlight: false }]
        return [
            { text: raw.slice(0, index), highlight: false },
            { text: raw.slice(index, index + kwRaw.length), highlight: true },
            { text: raw.slice(index + kwRaw.length), highlight: false }
        ].filter(seg => seg.text)
    }

    // 英文：按单词拆分，但高亮时精确匹配字符
    const kwTokens = tokenizeForSearch(kwNorm)
    if (!kwTokens.length) return [{ text: raw, highlight: false }]

    const segments = []
    let lastIndex = 0
    const textLower = raw.toLowerCase()

    // 对每个关键字词，在文本中查找匹配位置（支持单复数）
    for (const kwTok of kwTokens) {
        // 尝试精确匹配
        let foundIndex = textLower.indexOf(kwTok, lastIndex)
        if (foundIndex === -1) {
            // 尝试单复数变体
            if (kwTok.endsWith('s')) {
                foundIndex = textLower.indexOf(kwTok.slice(0, -1), lastIndex)
            } else {
                foundIndex = textLower.indexOf(kwTok + 's', lastIndex)
            }
        }

        if (foundIndex !== -1) {
            // 添加匹配前的部分
            if (foundIndex > lastIndex) {
                segments.push({ text: raw.slice(lastIndex, foundIndex), highlight: false })
            }
            // 添加匹配的部分（使用原始大小写）
            const matchLength = kwTok.length
            segments.push({ text: raw.slice(foundIndex, foundIndex + matchLength), highlight: true })
            lastIndex = foundIndex + matchLength
        }
    }

    // 添加剩余部分
    if (lastIndex < raw.length) {
        segments.push({ text: raw.slice(lastIndex), highlight: false })
    }

    return segments.length > 0 ? segments : [{ text: raw, highlight: false }]
}

function getItemIdentityKey(item) {
    const tripData = item?.tripData && typeof item.tripData === 'object' ? item.tripData : {}
    const itemKey = String(item?.itemKey || tripData.itemKey || '').trim()
    if (itemKey) return `key:${itemKey}`

    const id = item?.id ?? tripData.id
    if (id != null && id !== '') return `id:${String(id)}`

    return [
        String(item?.title || '').trim(),
        String(item?.enTitle || '').trim(),
        String(resolveLocationLabel(item) || '').trim(),
    ].filter(Boolean).join('|')
}

function dedupeItemsByIdentity(items) {
    const seen = new Set()
    const result = []
    for (const item of Array.isArray(items) ? items : []) {
        const key = getItemIdentityKey(item)
        if (!key || seen.has(key)) continue
        seen.add(key)
        result.push(item)
    }
    return result
}

const scenicFiltered = computed(() => {
    if (prefersBackendLocationGrid.value) {
        if (!useBackendLocationSections.value) return []
        return flattenBackendSections(backendLocationSections.value)
    }
    const kw = (searchKw.value || searchQuery.value || '').trim()
    const baseItems = dedupeItemsByIdentity(filterByLocation(places.value?.items || []))
    if (!kw) return baseItems
    return baseItems.filter((item) => tourItemMatchesKeyword(item, kw))
})

// 直接处理餐厅数据，与其他数据结构保持一致
const restaurantFiltered = computed(() => {
    if (prefersBackendLocationGrid.value) {
        if (!useBackendLocationSections.value) return []
        return flattenBackendSections(backendLocationSections.value)
    }
    const kw = (searchKw.value || searchQuery.value || '').trim()
    const baseItems = dedupeItemsByIdentity(filterByLocation(restaurants.value?.items || []))
    if (!kw) return baseItems
    return baseItems.filter((item) => tourItemMatchesKeyword(item, kw))
})

// 用于显示的餐厅列表（直接使用原始数据，与景点保持一致）
const displayRestaurants = computed(() => {
    return filterByLocation(restaurants.value?.items || [])
})

const hotelFiltered = computed(() => {
    if (prefersBackendLocationGrid.value) {
        if (!useBackendLocationSections.value) return []
        return flattenBackendSections(backendLocationSections.value)
    }
    const kw = (searchKw.value || searchQuery.value || '').trim()
    const baseItems = dedupeItemsByIdentity(filterByLocation(hotels.value?.items || []))
    if (!kw) return baseItems
    return baseItems.filter((item) => tourItemMatchesKeyword(item, kw))
})

const activityFiltered = computed(() => {
    const kw = (searchKw.value || searchQuery.value || '').trim()
    if (!kw) return dedupeItemsByIdentity(currentSpecialItems.value || [])
    if (useSubNavKeywordSearch.value) {
        return dedupeItemsByIdentity(subNavKeywordItems.value)
    }
    const base = dedupeItemsByIdentity(currentSpecialItems.value || [])
    return base.filter((item) => tourItemMatchesKeyword(item, kw))
})

// 对外事件
function buildSpecialContentTripData(item) {
    const baseTripData = item?.tripData && typeof item.tripData === 'object'
        ? { ...item.tripData }
        : {}

    const features = Array.isArray(item?.info)
        ? item.info
            .filter(Boolean)
            .map((infoItem) => ({
                icon: '#33b1a3',
                title: String(infoItem?.label || '').trim(),
                desc: String(infoItem?.value || '').trim(),
            }))
            .filter((row) => row.title || row.desc)
        : Array.isArray(baseTripData.features)
            ? baseTripData.features
            : []

    const tagItems = Array.isArray(item?.tagItems)
        ? item.tagItems
        : Array.isArray(baseTripData.tagItems)
            ? baseTripData.tagItems
            : []
    const tagsFromItems = tagItems
        .map((tagItem) => String(tagItem?.text || '').trim())
        .filter(Boolean)
    const tagsFromArray = Array.isArray(item?.tags)
        ? item.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
        : []
    const tags = tagsFromItems.length
        ? tagsFromItems
        : tagsFromArray.length
            ? tagsFromArray
            : Array.isArray(baseTripData.tags)
                ? baseTripData.tags
                : []
    const route = String(item?.sub || baseTripData.route || '').trim()
    const location = String(item?.location || baseTripData.location || '').trim()
    const badge = String(item?.badge || baseTripData.badge || '').trim()

    return {
        ...baseTripData,
        route: route || location || String(item?.title || '').trim(),
        desc: [location, badge].filter(Boolean).join(' · ') || baseTripData.desc || '',
        features,
        tags,
        badge,
        sub: route,
        location,
        badgeClass: item?.badgeClass || baseTripData.badgeClass || '',
        cardClass: item?.cardClass || baseTripData.cardClass || '',
        info: Array.isArray(item?.info)
            ? item.info
            : Array.isArray(baseTripData.info)
                ? baseTripData.info
                : [],
        tagItems,
    }
}

function findMatchingTourItem(items, item) {
    if (!Array.isArray(items) || !item) return null
    const dialogKey = getTourItemDialogKey(item)
    if (!dialogKey) return null
    return items.find((candidate) => tourItemMatchesDialogKey(candidate, dialogKey)) || null
}

function collectRawImagePaths(images) {
    if (!images) return []
    const list = Array.isArray(images) ? images : [images]
    const seen = new Set()
    const result = []
    for (const raw of list) {
        const path = String(raw || '').trim()
        if (!path || seen.has(path)) continue
        seen.add(path)
        result.push(path)
    }
    return result
}

function buildRelatedSpotDialogPayload(child, options = {}) {
    const { includeParentPayload = true } = options
    const rawImg = child?.img
    const thumbBanner = getScenicGridImageUrl(child)
    const resolved = buildTourDialogPayload(
        {
            ...child,
            img: rawImg,
            banner: thumbBanner || child?.banner || rawImg,
            tripData: {
                ...(child?.tripData && typeof child.tripData === 'object' ? child.tripData : {}),
                img: rawImg,
            },
        },
        { skipParentPayload: !includeParentPayload }
    )
    return {
        ...resolved,
        img: thumbBanner || resolved.img || rawImg,
        banner: thumbBanner || resolved.banner || rawImg,
        tripData: {
            ...(resolved.tripData || {}),
            img: rawImg,
        },
    }
}

function scenicParentDisplayName(item) {
    return getSpotParentDisplayNameFromDb(item, places.value?.items || [])
}

async function onOpenParentSpot(item) {
    const allItems = places.value?.items || []
    const parentItem = findParentSpotItemForChild(allItems, item)
    if (!parentItem) return

    let sourceItem = parentItem
    if (isApiEnabled() && parentItem?.id != null) {
        try {
            const enriched = await withLoading(
                () => loadCatalogItemDetail(parentItem.id),
                { text: '正在打开详情...' }
            )
            if (enriched) {
                sourceItem = {
                    ...parentItem,
                    ...enriched,
                    tripData: {
                        ...(parentItem.tripData || {}),
                        ...(enriched.tripData || {}),
                    },
                }
            }
        } catch (error) {
            notifyApiError(error, { action: '详情', dedupeKey: 'trips:parent-detail' })
        }
    }
    emit('openTourDialog', buildTourDialogPayload(sourceItem))
}

function resolveSpecialBannerImage(item) {
    const imgPath = String(item?.img || '').trim()
    if (imgPath) {
        return getThumbImageUrl(imgPath, SPECIAL_SECTION_FALLBACK_IMAGES[0])
    }
    const items = currentSpecialItems.value || []
    const index = items.findIndex((row) => row?.title === item?.title)
    const safeIndex = index >= 0 ? index : 0
    return SPECIAL_SECTION_FALLBACK_IMAGES[safeIndex % SPECIAL_SECTION_FALLBACK_IMAGES.length]
}

function buildTourDialogPayload(item, options = {}) {
    const { skipParentPayload = false } = options
    let tripData = item.tripData;
    let bannerImage = item.img;
    let tripType = '一日游';
    const isSpecialContentSection = props.activeTag === '自助游/自驾游免费参考信息' && !FREE_INFO_FILTER_SUBTABS.includes(props.subTab)

    if (props.activeTag === '自助游/自驾游免费参考信息') {
        if (props.subTab === '景点') {
            tripType = '景点信息';
        } else if (props.subTab === '餐厅') {
            tripType = '餐厅信息';
        } else if (props.subTab === '住宿') {
            tripType = '住宿信息';
        } else if (isSpecialContentSection) {
            tripType = `${props.subTab}信息`;
            tripData = buildSpecialContentTripData(item);
            bannerImage = resolveSpecialBannerImage(item);
        }
    }

    if (props.activeTag === '自助游/自驾游免费参考信息' && props.subTab === '景点' && places.value?.items) {
        const placeItem = findMatchingTourItem(places.value.items, item);
        if (placeItem) {
            tripData = { ...(placeItem.tripData || {}), ...(tripData || item.tripData || {}) };
            bannerImage = item.img || placeItem.img || bannerImage;
        }
    }

    if (props.activeTag === '自助游/自驾游免费参考信息' && props.subTab === '餐厅' && restaurants.value?.items) {
        const restaurantItem = findMatchingTourItem(restaurants.value.items, item);
        if (restaurantItem) {
            tripData = restaurantItem.tripData;
            bannerImage = restaurantItem.img;
        }
    }

    if (props.activeTag === '自助游/自驾游免费参考信息' && props.subTab === '住宿' && hotels.value?.items) {
        const hotelItem = findMatchingTourItem(hotels.value.items, item);
        if (hotelItem) {
            tripData = hotelItem.tripData;
            bannerImage = hotelItem.img;
        }
    }

    if (props.activeTag === '一日游/多日游') {
        tripData = item.tripData;
        bannerImage = item.img || bannerImage;
    }

    if (!tripData) {
        tripData = {
            route: `${item.title || '未知行程'}探索之旅`,
            desc: `深度探索目的地的自然美景和文化内涵，体验塔斯马尼亚独特的魅力。`,
            features: [
                { icon: '#22c55e', title: '自然探索', desc: '深入了解当地的自然环境和生态系统' },
                { icon: '#3b82f6', title: '文化体验', desc: '感受塔斯马尼亚的历史文化' },
                { icon: '#f59e0b', title: '摄影记录', desc: '记录美好的旅行时光' }
            ],
            tags: ['全程约6小时', '含专业导游', '灵活出发', '中英文服务']
        };
    }

    const rawBannerPaths = collectRawImagePaths(bannerImage)
    const resolvedBanner = getThumbImageUrl(rawBannerPaths[0] || '')
        || getImageUrl(Array.isArray(bannerImage) ? '' : bannerImage)

    const normalizedTripData = tripData && typeof tripData === 'object'
        ? { ...tripData }
        : tripData

    if (
        normalizedTripData &&
        typeof normalizedTripData === 'object' &&
        rawBannerPaths.length > 0 &&
        (!Array.isArray(normalizedTripData.images) || normalizedTripData.images.length === 0)
    ) {
        normalizedTripData.images = rawBannerPaths
    }

    if (
        normalizedTripData &&
        typeof normalizedTripData === 'object' &&
        bannerImage &&
        normalizedTripData.img == null
    ) {
        normalizedTripData.img = bannerImage
    }

    const isFreeInfoScenic =
        props.activeTag === '自助游/自驾游免费参考信息' && props.subTab === '景点'

    if (isFreeInfoScenic && places.value?.items) {
        const childSpots = findChildSpotItems(places.value.items, item)
        let parentSpotTitle = ''
        let parentSpotId = null
        let parentItem = null

        if (isSubSpotItemFromDb(item)) {
            parentItem = findParentSpotItemForChild(places.value.items, item)
            if (parentItem) {
                parentSpotTitle = parentItem.title || ''
                parentSpotId = parentItem.id ?? null
            }
        }

        normalizedTripData.childSpots = childSpots.map((child) => buildRelatedSpotDialogPayload(child, { includeParentPayload: false }))
        normalizedTripData.hasChildSpots = normalizedTripData.childSpots.length > 0

        if (parentSpotTitle && parentSpotId) {
            normalizedTripData.parentSpotTitle = parentSpotTitle
            normalizedTripData.parentSpotId = parentSpotId
        }

        if (!skipParentPayload && parentItem) {
            normalizedTripData.parentSpotOpenPayload = buildTourDialogPayload(parentItem, { skipParentPayload: true })
        }
    }

    const itemType = props.subTab === '景点' ? '景点信息' : (item?.itemType || item?.tripType || tripType)

    return {
        ...item,
        title: item.title,
        enTitle: item.enTitle,
        banner: resolvedBanner,
        tripType,
        itemType,
        tripData: normalizedTripData,
        parentSpotTitle: normalizedTripData?.parentSpotTitle || '',
        parentSpotId: normalizedTripData?.parentSpotId || null
    }
}

async function onOpenTour(item) {
    let sourceItem = item
    const isSpecialContentItem = props.activeTag === '自助游/自驾游免费参考信息' && !FREE_INFO_FILTER_SUBTABS.includes(props.subTab)
    const isDayTripSection = props.activeTag === '一日游/多日游'
    if (isApiEnabled() && item?.id != null && !isSpecialContentItem) {
        try {
            const enriched = await withLoading(
                () => loadCatalogItemDetail(item.id),
                { text: '正在打开详情...' }
            )
            if (enriched) {
                sourceItem = {
                    ...item,
                    ...enriched,
                    tripData: {
                        ...(item.tripData || {}),
                        ...(enriched.tripData || {}),
                    },
                }
            }
        } catch (error) {
            notifyApiError(error, { action: '详情', dedupeKey: 'trips:detail' })
        }
    }
    emit('openTourDialog', buildTourDialogPayload(sourceItem))
}
function onOpenPlace(groupName, itemType, items = []) {
    emit('openPlaceList', { placeName: groupName, itemType, items })
}

// 从 API/本地数据获取一日游条目
const getDayTripItems = (tabName) => {
    const resolvedName = resolveDayTripSubNavName(tabName, dayTripNavs.value)
    const navItem = dayTripNavs.value.find(nav => nav.subNavName === resolvedName)
    return navItem?.items || []
}

const currentDayTripItems = computed(() => {
    if (props.activeTag !== '一日游/多日游') return []
    return getDayTripItems(props.dayTripTab)
})

// 一日游/多日游搜索过滤
const dayTripFiltered = computed(() => {
    const kw = (searchKw.value || searchQuery.value || '').trim()
    if (!kw) return currentDayTripItems.value
    if (useSubNavKeywordSearch.value) {
        return dedupeItemsByIdentity(subNavKeywordItems.value)
    }
    return currentDayTripItems.value.filter((item) => tourItemMatchesKeyword(item, kw))
})

const showDayTrip = computed(() => props.activeTag === '一日游/多日游')

watch(() => [searchQuery.value, searchKw.value], () => {
    void syncSubNavKeywordSearch()
})

watch(() => [props.subTab, places.value?.items, restaurants.value?.items, hotels.value?.items], () => {
    void syncLocationCatalog()
}, { immediate: true })

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', scheduleUpdateMobileScrollPage)
    if (loadMoreObserver) {
        loadMoreObserver.disconnect()
        loadMoreObserver = null
    }
})

</script>

<template>
    <!-- 搜索框：只在非一日游页面显示 -->
    <div class="search-container" :class="{ 'search-container--with-filter': shouldShowAreaFilters }">
        <el-input v-model="localSearchKeyword" placeholder="搜索当前内容" clearable size="large" class="search-input"
            @keyup.enter="handleSearchEnter" @clear="handleSearchClear">
            <template #prefix>
                <el-icon>
                    <Search />
                </el-icon>
            </template>
            <template #append>
                <el-button :loading="isSearching" @click="executeSearch">
                    <span v-if="!isSearching">搜索</span>
                </el-button>
            </template>
        </el-input>
        <template v-if="shouldShowAreaFilters">
            <el-cascader v-model="selectedLocationKey" :options="locationCascaderOptions"
                :props="locationCascaderFieldProps" :filter-method="locationCascaderFilterMethod" clearable
                filterable placeholder="地点（邮编）" class="area-select" size="large"
                :key="'loc-' + subTab + '-' + sortMode + '-' + locationCatalogRevision" />
            <el-cascader v-model="selectedDistance" :options="locationCascaderOptions"
                :props="locationCascaderFieldProps" :filter-method="locationCascaderFilterMethod" clearable
                filterable placeholder="按距离排序" class="distance-select" size="large"
                :key="'dist-' + subTab + '-' + sortMode + '-' + locationCatalogRevision" />
            <el-select v-model="sortMode" class="sort-select" size="large">
                <el-option v-for="(label, value) in SORT_MODE_LABELS" :key="value" :label="label" :value="value" />
            </el-select>
        </template>
    </div>

    <!-- 全屏加载
    <div v-loading.fullscreen="loadingState" element-loading-spinner-color="#279486"
        element-loading-background="rgba(255, 255, 255, 0.8)"></div> -->

    <div class="grid-content-loading" v-loading="loadingState" element-loading-text="加载中..."
        element-loading-spinner-color="#279486" element-loading-background="rgba(255, 255, 255, 0.65)">
        <!-- 主内容区 -->
        <!-- 一日游：根据传入的 dayTripTab 渲染对应数据 -->
        <template v-if="showDayTrip">
            <template v-if="(s?.trim() || isLocalSearch)">
                <template v-if="dayTripFiltered.length">
                    <div ref="gridRef" class="coming-grid">
                        <div v-for="(item, i) in getPaginatedItems(dayTripFiltered)"
                            :key="`day-trip-${dayTripTab}-${i}`" class="coming-card" @click="onOpenTour(item)"
                            :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getDayTripGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">
                                <span v-for="(seg, idx) in getHighlightSegments(item.title, highlightKw)" :key="idx">
                                    <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                                    <span v-else>{{ seg.text }}</span>
                                </span>
                            </div>
                            <div class="card-sub" :title="item.sub">
                                <span v-for="(seg, idx) in getHighlightSegments(item.sub, highlightKw)" :key="idx">
                                    <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                                    <span v-else>{{ seg.text }}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div v-if="dayTripFiltered.length > 0" class="pagination-section pagination-section--scenic">
                        <div class="custom-pagination custom-pagination--fixed">
                            <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage
                            }}</span> /
                                {{
                                    mobileTotalPages }} 页</div>
                        </div>
                    </div>
                </template>
                <div v-else class="empty-tip">没有搜索结果</div>
            </template>
            <template v-else>
                <div ref="gridRef" class="coming-grid">
                    <div v-for="(item, i) in getPaginatedItems(currentDayTripItems)"
                        :key="`day-trip-${dayTripTab}-${i}`" class="coming-card" @click="onOpenTour(item)"
                        :data-tour-title="getTourItemDialogKey(item)">
                        <img :src="getDayTripGridImageUrl(item)" :alt="item.title" class="w100"
                            :loading="getImageLoading(i)" decoding="async" :fetchpriority="getImageFetchPriority(i)">
                        <div class="card-title" :title="item.title">{{ item.title }}</div>
                        <div class="card-sub" :title="item.sub">{{ item.sub }}</div>
                    </div>
                </div>
                <div v-if="currentDayTripItems.length > 0" class="pagination-section pagination-section--scenic">
                    <div class="custom-pagination custom-pagination--fixed">
                        <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
                            {{
                                mobileTotalPages }} 页</div>
                    </div>
                </div>
                <div v-if="currentDayTripItems.length === 0" class="empty-tip">{{ getEmptyTipText() }}</div>
            </template>
        </template>

        <!-- 搜索结果区：景点 -->
        <template v-if="(s?.trim() || isLocalSearch) && subTab === '景点'">
            <template v-if="scenicFiltered.length">
                <div ref="gridRef" class="coming-grid coming-grid--scenic">
                    <template v-for="(item, i) in getPaginatedItems(scenicDisplayItems)" :key="'sc2-' + i">
                        <h1 v-if="shouldShowLocationTitle(getPaginatedItems(scenicDisplayItems), i)"
                            class="region-title center">
                            {{ getLocationDisplayName(item) }}
                        </h1>
                        <div class="coming-card" :class="{ 'coming-card--with-belong': isSubSpotItemFromDb(item) }"
                            @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getScenicGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">
                                <span v-for="(seg, idx) in getHighlightSegments(item.title, highlightKw)" :key="idx">
                                    <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                                    <span v-else>{{ seg.text }}</span>
                                </span>
                            </div>
                            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                            <div v-if="isSubSpotItemFromDb(item)" class="card-belong">
                                <span class="card-belong-tag">所在景点</span>
                                <button type="button" class="card-belong-spot" :title="scenicParentDisplayName(item)"
                                    @click.stop="onOpenParentSpot(item)">
                                    {{ scenicParentDisplayName(item) }}
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
                <!-- <div v-if="isLoading" class="loading-tip">加载中...</div> -->
                <div v-if="scenicFiltered.length > 0" class="pagination-section pagination-section--scenic">
                    <div class="custom-pagination custom-pagination--fixed">
                        <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
                            {{
                                mobileTotalPages }} 页</div>
                    </div>
                </div>
            </template>
            <div v-else class="empty-tip">没有搜索结果</div>
        </template>

        <!-- 搜索结果区：餐厅 -->
        <template v-else-if="(s?.trim() || isLocalSearch) && subTab === '餐厅'">
            <template v-if="restaurantFiltered.length">
                <div ref="gridRef" class="coming-grid">
                    <template v-for="(item, i) in getPaginatedItems(restaurantDisplayItems)" :key="'rt-search-' + i">
                        <h1 v-if="shouldShowLocationTitle(getPaginatedItems(restaurantDisplayItems), i)"
                            class="region-title center">
                            {{ getLocationDisplayName(item) }}
                        </h1>
                        <div class="coming-card" @click="onOpenTour(item)"
                            :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getRestaurantGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">
                                <span v-for="(seg, idx) in getHighlightSegments(item.title, highlightKw)" :key="idx">
                                    <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                                    <span v-else>{{ seg.text }}</span>
                                </span>
                            </div>
                            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                        </div>
                    </template>
                </div>
                <!-- <div v-if="isLoading" class="loading-tip">加载中...</div> -->
                <div v-if="restaurantFiltered.length > 0" class="pagination-section pagination-section--scenic">
                    <div class="custom-pagination custom-pagination--fixed">
                        <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
                            {{
                                mobileTotalPages }} 页</div>
                    </div>
                </div>
            </template>
            <div v-else class="empty-tip">没有搜索结果</div>
        </template>

        <!-- 搜索结果区：住宿 -->
        <template v-else-if="(s?.trim() || isLocalSearch) && subTab === '住宿'">
            <template v-if="hotelFiltered.length">
                <div ref="gridRef" class="coming-grid">
                    <template v-for="(item, i) in getPaginatedItems(hotelDisplayItems)" :key="'ht-search-' + i">
                        <h1 v-if="shouldShowLocationTitle(getPaginatedItems(hotelDisplayItems), i)"
                            class="region-title center">
                            {{ getLocationDisplayName(item) }}
                        </h1>
                        <div class="coming-card" @click="onOpenTour(item)"
                            :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getHotelGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">
                                <span v-for="(seg, idx) in getHighlightSegments(item.title, highlightKw)" :key="idx">
                                    <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                                    <span v-else>{{ seg.text }}</span>
                                </span>
                            </div>
                            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                        </div>
                    </template>
                </div>
                <!-- <div v-if="isLoading" class="loading-tip">加载中...</div> -->
                <div v-if="hotelFiltered.length > 0" class="pagination-section pagination-section--scenic">
                    <div class="custom-pagination custom-pagination--fixed">
                        <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
                            {{
                                mobileTotalPages }} 页</div>
                    </div>
                </div>
            </template>
            <div v-else class="empty-tip">没有搜索结果</div>
        </template>

        <!-- 免费信息（isGrid=false）：关键词搜索结果（适配 特别活动/徒步线路/塔州露营地 等）-->
        <div class="special-activities-section" v-else-if="(s?.trim() || isLocalSearch) && isSpecialSection">
            <template v-if="activityFiltered.length">
                <div class="activities-header">
                    <h2 class="activities-title">{{ currentSpecialTitle }}</h2>
                    <p class="activities-subtitle">{{ currentSpecialSubtitle }}</p>
                </div>

                <div ref="gridRef" class="activities-grid">
                    <div v-for="(item, i) in getPaginatedItems(activityFiltered)" :key="'ac-filtered-' + i"
                        :class="['activity-card', item.cardClass, 'pointer']" @click="onOpenTour(item)"
                        :data-tour-title="getTourItemDialogKey(item)">
                        <div class="activity-image">
                            <img :src="getActivityImage(item.img, i)" alt="特别活动" class="activity-img"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div :class="['activity-badge', item.badgeClass]">{{ item.badge }}</div>
                        </div>
                        <div class="activity-content">
                            <h3 class="activity-title">{{ item.title }}</h3>
                            <div class="activity-info">
                                <div v-for="(infoItem, infoIndex) in item.info" :key="infoIndex" class="info-item">
                                    <span class="info-label">{{ infoItem.label }}：</span>
                                    <span :class="['info-value', infoItem.valueClass]">{{ infoItem.value }}</span>
                                </div>
                            </div>
                            <div class="tags">
                                <div v-for="(tagItem, tagIndex) in item.tagItems" :key="tagIndex"
                                    :class="tagItem.icon ? 'weather-note' : 'activity-description'">
                                    <i v-if="tagItem.icon" class="weather-icon">{{ tagItem.icon }}</i>
                                    <span>{{ tagItem.text }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- <div v-if="isLoading" class="loading-tip">加载中...</div> -->
                <div v-if="activityFiltered.length > 0" class="pagination-section pagination-section--scenic">
                    <div class="custom-pagination custom-pagination--fixed">
                        <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
                            {{
                                mobileTotalPages }} 页</div>
                    </div>
                </div>
            </template>
            <div v-else class="empty-tip">没有搜索结果</div>
            <div class="activities-footer">
                <div class="update-info"><i class="update-icon">🔄</i><span>信息每2小时更新一次</span></div>
                <div class="contact-info"><span>获取最新活动信息，请联系我们的专业顾问</span></div>
            </div>
        </div>

        <!-- 底部网格：景点（无关键词） -->
        <template v-if="subTab === '景点' && !isLocalSearch && !(s?.trim()) && !showDayTrip">
            <template v-if="scenicFiltered.length">
                <div ref="gridRef" class="coming-grid coming-grid--scenic">
                    <template v-for="section in scenicMainGridSections" :key="section.label">
                        <h1 class="region-title center">
                            {{ section.title }}
                        </h1>
                        <template v-for="(item, i) in section.items"
                            :key="getTourItemDialogKey(item) || `${section.label}-${i}`">
                            <div class="coming-card" :class="{ 'coming-card--with-belong': isSubSpotItemFromDb(item) }"
                                @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                                <img :src="getScenicGridImageUrl(item)" :alt="item.title" class="w100"
                                    :loading="getImageLoading(section.startIndex + i)" decoding="async"
                                    :fetchpriority="getImageFetchPriority(section.startIndex + i)">
                                <div class="card-title" :title="item.title">{{ item.title }}</div>
                                <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                                <div v-if="isSubSpotItemFromDb(item)" class="card-belong">
                                    <span class="card-belong-tag">所在景点</span>
                                    <button type="button" class="card-belong-spot"
                                        :title="scenicParentDisplayName(item)" @click.stop="onOpenParentSpot(item)">
                                        {{ scenicParentDisplayName(item) }}
                                    </button>
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
                <div v-if="!selectedLocationLabel && !useBackendLocationSections && scenicUncategorizedDisplayItems.length"
                    class="coming-grid coming-grid--scenic">
                    <h1 class="region-title center">{{ UNCATEGORIZED_LOCATION }}</h1>
                    <template v-for="(item, i) in scenicUncategorizedDisplayItems" :key="'rt-uncategorized-' + i">
                        <div class="coming-card" :class="{ 'coming-card--with-belong': isSubSpotItemFromDb(item) }"
                            @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getScenicGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">{{ item.title }}</div>
                            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                            <div v-if="isSubSpotItemFromDb(item)" class="card-belong">
                                <span class="card-belong-tag">所在景点</span>
                                <button type="button" class="card-belong-spot" :title="scenicParentDisplayName(item)"
                                    @click.stop="onOpenParentSpot(item)">
                                    {{ scenicParentDisplayName(item) }}
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </template>
            <div v-else class="empty-tip">{{ getEmptyTipText() }}</div>
        </template>
        <!-- <div v-if="subTab === '景点' && !isLocalSearch && !(s?.trim()) && !showDayTrip && isLoading" class="loading-tip">
        加载中...
    </div> -->
        <template v-if="subTab === '景点' && !isLocalSearch && !(s?.trim()) && !showDayTrip && scenicFiltered.length > 0">
            <div class="pagination-section pagination-section--scenic">
                <div class="custom-pagination custom-pagination--fixed">
                    <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
                        mobileTotalPages }} 页</div>
                </div>
            </div>
        </template>

        <!-- 底部网格：餐厅（无关键词） -->
        <template v-if="subTab === '餐厅' && !isLocalSearch && !(s?.trim()) && !showDayTrip">
            <template v-if="restaurantDisplayItems.length">
                <div class="coming-grid" ref="gridRef">
                    <template v-for="(item, i) in getPaginatedItems(restaurantDisplayItems)" :key="'restaurant-' + i">
                        <h1 v-if="shouldShowLocationTitle(getPaginatedItems(restaurantDisplayItems), i)"
                            class="region-title center">
                            {{ getLocationDisplayName(item) }}
                        </h1>
                        <div class="coming-card" @click="onOpenTour(item)"
                            :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getRestaurantGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">{{ item.title }}</div>
                            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                        </div>
                    </template>
                </div>
            </template>
            <div v-else class="empty-tip">{{ getEmptyTipText() }}</div>
        </template>

        <!-- <div v-if="subTab === '餐厅' && !isLocalSearch && !(s?.trim()) && !showDayTrip && isLoading" class="loading-tip">
        加载中...
    </div> -->
        <template
            v-if="subTab === '餐厅' && !isLocalSearch && !(s?.trim()) && !showDayTrip && displayRestaurants.length > 0">
            <div class="pagination-section pagination-section--scenic">
                <div class="custom-pagination custom-pagination--fixed">
                    <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
                        mobileTotalPages }} 页</div>
                </div>
            </div>
        </template>

        <!-- 底部网格：住宿（无关键词） -->
        <template v-if="subTab === '住宿' && !isLocalSearch && !(s?.trim()) && !showDayTrip">
            <template v-if="hotelDisplayItems.length">
                <div ref="gridRef" class="coming-grid">
                    <template v-for="(item, i) in getPaginatedItems(hotelDisplayItems)" :key="'hotel-' + i">
                        <h1 v-if="shouldShowLocationTitle(getPaginatedItems(hotelDisplayItems), i)"
                            class="region-title center">
                            {{ getLocationDisplayName(item) }}
                        </h1>
                        <div class="coming-card" @click="onOpenTour(item)"
                            :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getHotelGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">{{ item.title }}</div>
                            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                        </div>
                    </template>
                </div>
            </template>
            <div v-else class="empty-tip">{{ getEmptyTipText() }}</div>
        </template>
        <!-- <div v-if="subTab === '住宿' && !isLocalSearch && !(s?.trim()) && !showDayTrip && isLoading" class="loading-tip">
        加载中...
    </div> -->
        <div v-if="subTab === '住宿' && !isLocalSearch && !(s?.trim()) && !showDayTrip && hotelFiltered.length > 0"
            class="pagination-section pagination-section--scenic">
            <div class="custom-pagination custom-pagination--fixed">
                <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
                    mobileTotalPages }} 页</div>
            </div>
        </div>

        <!-- 免费信息（isGrid=false）：信息展示区域（无关键词，适配 特别活动/徒步线路/塔州露营地 等）-->
        <div v-if="isSpecialSection && !(s?.trim())" class="special-activities-section">
            <div class="activities-header">
                <h2 class="activities-title">{{ currentSpecialTitle }}</h2>
                <p class="activities-subtitle">{{ currentSpecialSubtitle }}</p>
            </div>
            <div ref="gridRef" class="activities-grid">
                <div v-for="(activity, index) in getPaginatedItems(currentSpecialItems)" :key="'activity-' + index"
                    :class="['activity-card', activity.cardClass, 'pointer']" @click="onOpenTour(activity)"
                    :data-tour-title="getTourItemDialogKey(activity)">
                    <div class="activity-image">
                        <img :src="getActivityImage(activity.img, index)" alt="特别活动" class="activity-img"
                            :loading="getImageLoading(index)" decoding="async"
                            :fetchpriority="getImageFetchPriority(index)">
                        <div :class="['activity-badge', activity.badgeClass]">{{ activity.badge }}</div>
                    </div>
                    <div class="activity-content">
                        <h3 class="activity-title">{{ activity.title }}</h3>
                        <div class="activity-info">
                            <div v-for="(infoItem, infoIndex) in activity.info" :key="infoIndex" class="info-item">
                                <span class="info-label">{{ infoItem.label }}：</span>
                                <span :class="['info-value', infoItem.valueClass]">{{ infoItem.value }}</span>
                            </div>
                        </div>
                        <div class="tags">
                            <div v-for="(tagItem, tagIndex) in activity.tagItems" :key="tagIndex"
                                :class="tagItem.icon ? 'weather-note' : 'activity-description'">
                                <i v-if="tagItem.icon" class="weather-icon">{{ tagItem.icon }}</i>
                                <span>{{ tagItem.text }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- <div v-if="isLoading" class="loading-tip">加载中...</div> -->
            <div v-if="currentSpecialItems.length > 0" class="pagination-section pagination-section--scenic">
                <div class="custom-pagination custom-pagination--fixed">
                    <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
                        mobileTotalPages }} 页</div>
                </div>
            </div>
            <div class="activities-footer">
                <div class="update-info"><i class="update-icon">🔄</i><span>信息每2小时更新一次</span></div>
                <div class="contact-info"><span>获取最新活动信息，请联系我们的专业顾问</span></div>
            </div>
        </div>


        <div v-if="hasMore" ref="loadMoreTriggerRef" class="load-more-trigger" aria-hidden="true"></div>
    </div>
</template>

<style lang="scss" scoped>
.search-container {
    width: 90%;
    margin: 20px auto 0;
    max-width: 600px;

    .search-input {
        width: 100%;
    }

    &--with-filter {
        max-width: 1200px;
        display: grid;
        grid-template-columns: minmax(280px, 1fr) 280px 280px 200px;
        gap: 12px;
        align-items: center;

        .area-select {
            width: 100%;
        }

        .sort-select {
            width: 100%;
        }
    }

    :deep(.el-input-group__append) {
        background-color: #33b1A3;
        border-color: #33b1A3;
        color: #fff;

        &:hover {
            background-color: #1e7a6e;
            border-color: #1e7a6e;
        }

        .el-button {
            color: #fff;
            border: none;
            background: transparent;
        }
    }
}

.grid-content-loading {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    .coming-grid {
        width: 90%;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        padding: 28px 0 40px;

        img {
            height: 240px;
        }

        .region-title {
            grid-column: 1 / -1;
            margin: 18px 0;
            text-align: center;
            font-size: 28px;
            font-weight: bold;

            &:first-child {
                margin-top: 0;
            }
        }

        .town-title {
            grid-column: 1 / -1;
            margin: 0 0 8px 0;
            text-align: center;
            font-size: 18px;
            color: #57595f;
            font-weight: normal;
        }

        .coming-grid.coming-grid--scenic {
            align-items: start;
        }

        .coming-grid--scenic .coming-card {
            justify-content: flex-start;
        }

        .coming-card {
            display: flex;
            border-radius: 12px;
            flex-direction: column;
            justify-content: flex-start;
            cursor: pointer;
            gap: 5px;
            border: 2px solid transparent;

            img {
                object-fit: cover;
            }
        }
    }

    .card-title {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 2px;
        color: #1f2937;
        -webkit-line-clamp: 1;
        line-clamp: 1;
    }

    .card-sub {
        font-size: 10px;
        color: #6b7280;
        letter-spacing: 2px;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        line-height: 1.5;
        min-height: calc(1.5em * 2);
    }

    .card-belong {
        margin-top: 6px;
        font-size: 10px;
        color: #279486;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        min-width: 0;
        width: 100%;
        padding: 6px 8px;
        background: rgba(39, 148, 134, 0.1);
        border-left: 3px solid #279486;
        border-radius: 4px;
        line-height: 1.4;
    }

    .card-belong-tag {
        font-size: 11px;
        font-weight: 600;
        color: #5f6b76;
        letter-spacing: 0.5px;
        line-height: 1.3;
        flex-shrink: 0;
    }

    .card-belong-spot {
        width: 100%;
        padding: 0;
        border: 0;
        background: none;
        font-size: 13px;
        font-weight: 700;
        color: #1a7a6f;
        letter-spacing: 0.5px;
        line-height: 1.35;
        cursor: pointer;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &:hover {
            color: #279486;
            text-decoration: underline;
            text-underline-offset: 2px;
        }
    }

    .card-title,
    .card-sub {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .search-highlight {
        color: #33b1a3;
        font-weight: 700;
    }

    .empty-tip {
        text-align: center;
        color: #6b7280;
        font-size: 16px;
        margin: 45px;
    }

    .loading-tip {
        text-align: center;
        color: #3b82f6;
        font-size: 14px;
        padding: 16px 0 8px;
    }

    .pagination-section {
        display: flex;
        text-align: center;
        padding-bottom: 40px;
        justify-content: center;
        align-items: center;

        .custom-pagination {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }

        .custom-pagination--fixed {
            position: fixed;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .page-indicator {
            color: #6b7280;
            letter-spacing: 1px;
            line-height: 1.5;

            .page-num {
                font-size: 18px;
                color: #279486;
                line-height: 24px;
            }
        }
    }

    :deep(.el-pagination) {
        .el-pager li {
            &.is-active {
                background-color: #279486;
                color: white;
            }

            &:hover {
                color: #279486;
            }
        }

        .btn-prev,
        .btn-next {
            &:hover {
                color: #279486;
            }
        }
    }

    .load-more-btn {
        padding: 14px 48px;
        background-color: #279486;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        letter-spacing: 1px;

        &:hover {
            background-color: #1e7a6e;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(39, 148, 134, 0.3);
        }

        &:active {
            transform: translateY(0);
        }
    }

    .special-activities-section {
        width: 90%;
        padding: 20px 0;

        .activities-header {
            text-align: center;
            margin-bottom: 30px;

            .activities-title {
                font-size: 30px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 8px;
                letter-spacing: 2px;
            }

            .activities-subtitle {
                font-size: 14px;
                color: #6b7280;
                margin: 0;
            }
        }

        .activities-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin-bottom: 30px;

            .activity-card {
                background: #fff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                transition: transform 0.3s ease, box-shadow 0.3s ease;

                &:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

                    .activity-img {
                        transform: scale(1.05);
                    }
                }

                .activity-image {
                    position: relative;
                    height: 298px;
                    overflow: hidden;

                    .activity-img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        transition: transform 0.3s ease;
                    }

                    .activity-badge {
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 10px;
                        font-weight: 600;
                        color: #fff;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                }

                .activity-content {
                    padding: 20px;

                    .activity-title {
                        font-size: 16px;
                        font-weight: 700;
                        color: #111827;
                        margin-bottom: 16px;
                        letter-spacing: 1px;
                    }

                    .activity-info {
                        margin-bottom: 16px;

                        .info-item {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 8px;
                            padding: 4px 0;

                            .info-label {
                                font-size: 14px;
                                color: #6b7280;
                                font-weight: 500;
                            }

                            .info-value {
                                font-size: 14px;
                                color: #111827;
                                font-weight: 600;

                                &.high {
                                    color: #059669;
                                    font-weight: 700;
                                }

                                &.excellent {
                                    color: #dc2626;
                                    font-weight: 700;
                                }
                            }
                        }
                    }

                    .tags {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 10px;
                        align-items: stretch;

                        .weather-note,
                        .activity-description {
                            min-width: 0;
                            height: auto;
                            line-height: 1.5;
                            word-break: break-word;
                            white-space: normal;
                        }
                    }
                }
            }
        }

        .aurora-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .event-badge {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .season-badge {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .night-badge {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .camping-badge {
            background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
        }

        .activity-description {
            font-size: 14px;
            color: #4b5563;
            line-height: 1.6;
            background: #f9fafb;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid #33b1a3;
        }

        .weather-note {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #059669;
            background: #ecfdf5;
            padding: 10px 12px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }

        .weather-icon {
            font-size: 16px;
        }

        .activities-footer {
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;

            .update-info {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-bottom: 12px;
                font-size: 14px;
                color: #6b7280;

                .update-icon {
                    font-size: 16px;
                }
            }

            .contact-info {
                font-size: 14px;
                color: #4b5563;
            }
        }
    }
}

/* 手机端竖屏适配（iPad 走桌面样式） */
@media (max-width: 480px) and (orientation: portrait) {
    .search-container--with-filter {
        grid-template-columns: 1fr;
    }

    .grid-content-loading {
        .coming-grid {
            grid-template-columns: repeat(1, 1fr);
            gap: 20px;

            .coming-card {
                gap: 10px;
            }
        }

        .special-activities-section {
            width: 95%;
            padding: 10px 0;

            .activities-header {
                margin-bottom: 20px;

                .activities-title {
                    font-size: 24px;
                    letter-spacing: 1px;
                }

                .activities-subtitle {
                    font-size: 14px;
                }
            }

            .activities-grid {
                grid-template-columns: 1fr;
                gap: 16px;
                margin-bottom: 20px;

                .activity-card {
                    .activity-image {
                        height: 160px;

                        .activity-badge {
                            top: 8px;
                            right: 8px;
                            padding: 4px 8px;
                            font-size: 10px;
                        }
                    }

                    .activity-content {
                        padding: 12px;

                        .activity-title {
                            font-size: 15px;
                            margin-bottom: 12px;
                        }

                        .activity-info {
                            margin-bottom: 12px;

                            .info-item {
                                margin-bottom: 6px;
                                padding: 2px 0;

                                .info-label,
                                .info-value {
                                    font-size: 12px;
                                }
                            }
                        }

                        .tags {
                            grid-template-columns: 1fr;
                        }
                    }
                }
            }

            .activity-description {
                font-size: 12px;
                padding: 10px;
            }

            .weather-note {
                font-size: 11px;
                padding: 8px 10px;
            }

            .weather-icon {
                font-size: 14px;
            }

            .activities-footer {
                padding: 15px;

                .update-info {
                    font-size: 12px;
                    margin-bottom: 8px;
                }

                .contact-info {
                    font-size: 12px;
                }
            }
        }
    }
}

/* 手机端横屏适配（iPad 走桌面样式） */
@media (max-width: 480px) and (orientation: landscape) {
    .search-container--with-filter {
        grid-template-columns: 1fr 1fr 1fr;
    }

    .grid-content-loading {
        .coming-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;

            .coming-card {
                gap: 8px;
            }

            img {
                height: 180px;
            }
        }

        .special-activities-section {
            width: 95%;
            padding: 10px 0;

            .activities-header {
                margin-bottom: 15px;

                .activities-title {
                    font-size: 20px;
                    letter-spacing: 1px;
                }

                .activities-subtitle {
                    font-size: 13px;
                }
            }

            .activities-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-bottom: 20px;

                .activity-card {
                    .activity-image {
                        height: 140px;

                        .activity-badge {
                            top: 8px;
                            right: 8px;
                            padding: 4px 8px;
                            font-size: 10px;
                        }
                    }

                    .activity-content {
                        padding: 12px;

                        .activity-title {
                            font-size: 14px;
                            margin-bottom: 10px;
                        }

                        .activity-info {
                            margin-bottom: 10px;

                            .info-item {
                                margin-bottom: 4px;
                                padding: 2px 0;

                                .info-label,
                                .info-value {
                                    font-size: 11px;
                                }
                            }
                        }
                    }
                }
            }

            .activity-description {
                font-size: 11px;
                padding: 8px;
            }

            .weather-note {
                font-size: 11px;
                padding: 8px 10px;
            }

            .weather-icon {
                font-size: 14px;
            }

            .activities-footer {
                padding: 15px;

                .update-info {
                    font-size: 12px;
                    margin-bottom: 8px;
                }

                .contact-info {
                    font-size: 12px;
                }
            }
        }
    }
}

/* 超小屏幕 */
@media (max-width: 375px) {
    .grid-content-loading {
        .special-activities-section {
            .activities-header {
                .activities-title {
                    font-size: 20px;
                }

                .activities-subtitle {
                    font-size: 13px;
                }
            }

            .activities-grid {
                gap: 12px;

                .activity-card {
                    .activity-image {
                        height: 140px;

                        .activity-badge {
                            top: 6px;
                            right: 6px;
                            padding: 3px 6px;
                            font-size: 9px;
                        }
                    }

                    .activity-content {
                        padding: 10px;

                        .activity-title {
                            font-size: 14px;
                            margin-bottom: 10px;
                        }

                        .activity-info {
                            .info-item {
                                margin-bottom: 4px;

                                .info-label,
                                .info-value {
                                    font-size: 11px;
                                }
                            }
                        }
                    }
                }
            }

            .activity-description {
                font-size: 11px;
                padding: 8px;
            }

            .weather-note {
                font-size: 10px;
                padding: 6px 8px;
            }

            .activities-footer {
                padding: 12px;

                .update-info {
                    font-size: 11px;
                }

                .contact-info {
                    font-size: 11px;
                }
            }
        }
    }
}

.load-more-trigger {
    width: 100%;
    height: 4px;
    pointer-events: none;
}
</style>