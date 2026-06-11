<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElPagination, ElInput, ElIcon } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import freeInfoData from '@/data/split/freeinfo.json'
import dayTripData from '@/data/split/daytrip.json'
import { resolveDataImage } from '@/utils/dataImageResolver'
import { getTownCoordinates, getDistanceBetweenTowns } from '@/utils/distanceCalculator'
import { waitRandomDelay } from '@/utils/loadingUtils'
import { getTourItemDialogKey, tourItemMatchesDialogKey } from '@/utils/searchItemKey'
import { tourItemMatchesKeyword } from '@/utils/searchMatchUtils'

const route = useRoute()

const props = defineProps({
    activeTag: { type: String, required: true },
    subTab: { type: String, default: '景点' },
    s: { type: String, default: '' },
    dayTripTab: { type: String, default: '1日行程' },
})

// 实际参与列表过滤的关键词（本页回车搜索 / 父级 committedKeyword）
const searchKw = computed(() => {
    const localExecuted = searchQuery.value.trim()
    if (localExecuted) return localExecuted

    const fromProps = (props.s || '').trim()
    if (fromProps) return fromProps

    // 从全站搜索结果打开（带 dialogItemId）：不按 URL 的 s 过滤，避免整页只剩少量命中项
    if (route.query.dialogItemId) return ''

    const q = route.query.s
    return q ? String(q).trim() : ''
})

const highlightKw = computed(() => searchKw.value || localSearchKeyword.value.trim())

function syncLocalSearchFromRoute() {
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
const selectedRegion = ref('')
const selectedTown = ref('')
const selectedDistance = ref('')
const loadingState = computed(() => isSearching.value)

const FREE_INFO_FILTER_SUBTABS = ['景点', '餐厅', '住宿']
const UNCATEGORIZED_REGION = '暂未分类分区'
const UNCATEGORIZED_TOWN = '暂未分类城镇'

const regionTownGroups = [
    {
        region: '霍巴特及南部',
        towns: ['Hobart', 'Kingston', 'Huonville', 'Richmond', 'Cygnet', 'Geeveston', 'Bruny Island', 'South Hobart', 'Sandy Bay', 'Battery Point', 'North Hobart', 'Taroona', 'Port Arthur', 'Tasman Peninsula']
    },
    {
        region: '朗塞斯顿及北部',
        towns: ['Launceston', 'Tamar Valley', 'Rosevears', 'Beauty Point', 'Legana', 'Exeter', 'George Town', 'Grindelwald', 'Beaconsfield', 'Deloraine', 'Riverside', 'Prospect']
    },
    {
        region: '东海岸',
        towns: ['Swansea', 'Bicheno', 'Coles Bay', 'St Helens', 'Orford', 'Scamander', 'Freycinet', 'St Marys', 'Triabunna', 'Flinders Island']
    },
    {
        region: '西北部',
        towns: ['Devonport', 'Burnie', 'Ulverstone', 'Wynyard', 'Smithton', 'Penguin', 'Stanley', 'Somerset', 'Latrobe', 'Sheffield', 'Railton', 'Cradle Mountain', 'Moina', 'Mole Creek', 'Wilmot']
    },
    {
        region: '西海岸',
        towns: ['Strahan', 'Queenstown', 'Zeehan', 'Rosebery', 'Tullah', 'Granville', 'Corinna', 'Trial Harbour']
    },
    {
        region: '中部地区',
        towns: ['Oatlands', 'Bothwell', 'Ross', 'Campbell Town', 'Kempton', 'Perth', 'Longford', "Miena"]
    },
    {
        region: '金岛',
        towns: ['Currie', 'Naracoopa']
    }
]

const townToRegionMap = new Map(
    regionTownGroups.flatMap(group => group.towns.map(town => [town.toLowerCase(), group.region]))
)
const regionOrderMap = new Map(regionTownGroups.map((group, index) => [group.region, index]))

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
}

// 懒加载相关状态
const currentPage = ref(1)
const isLoading = ref(false)
const hasMore = ref(true)
const windowWidth = ref(window.innerWidth)
const INITIAL_RENDER_COUNT = 24
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
const normalizedAreaInfoCache = new WeakMap()

function getImageLoading(index) {
    return index < FIRST_SCREEN_PRIORITY_COUNT ? 'eager' : 'lazy'
}

function getImageFetchPriority(index) {
    return index < FIRST_SCREEN_PRIORITY_COUNT ? 'high' : 'low'
}

// 移动端网格 ref（当前可见的网格只有一个）
const gridRef = ref(null)
// 移动端根据滚动位置显示的当前页码（划到哪里就是哪一页）
const mobileScrollPage = ref(1)

// 根据屏幕尺寸动态计算每页显示数量
const itemsPerPage = computed(() => {
    if (windowWidth.value <= 768) {
        if (window.matchMedia('(orientation: portrait)').matches) {
            return 3
        } else {
            return 2
        }
    } else if (windowWidth.value <= 1024) {
        return 12
    } else {
        return 12
    }
})

// 根据屏幕尺寸动态计算分页组件尺寸
const paginationSize = computed(() => {
    return windowWidth.value <= 768 ? 'small' : 'large'
})

// 判断是否为移动端（平板和手机）
const isMobile = computed(() => {
    return windowWidth.value <= 1024
})

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

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', scheduleUpdateMobileScrollPage)
    if (loadMoreObserver) {
        loadMoreObserver.disconnect()
        loadMoreObserver = null
    }
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

// 根据当前上下文获取“完整列表”（未分页的原始数据），用于计算目标条目所在页
function getFullListForLocate() {
    // 一日游场景
    if (props.activeTag === '一日游/多日游') {
        return dayTripFiltered.value || []
    }

    // 有搜索关键词时，使用各自的 filtered 列表
    if (searchKw.value) {
        if (props.subTab === '景点') return scenicFiltered.value || []
        if (props.subTab === '餐厅') return restaurantFiltered.value || []
        if (props.subTab === '葡萄酒酒庄') return wineFiltered.value || []
        if (props.subTab === '洋酒酒庄') return spiritFiltered.value || []
        if (props.subTab === '住宿') return hotelFiltered.value || []
        if (isSpecialSection.value) return activityFiltered.value || []
    } else {
        // 无搜索时，免费信息场景也使用筛选后的列表
        if (props.subTab === '景点') return scenicFiltered.value || []
        if (props.subTab === '餐厅') return restaurantFiltered.value || []
        if (props.subTab === '葡萄酒酒庄') return displayWineWineries.value || []
        if (props.subTab === '洋酒酒庄') return displaySpiritWineries.value || []
        if (props.subTab === '住宿') return hotelFiltered.value || []
        if (isSpecialSection.value) return currentSpecialItems.value || []
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

// 监听props变化，重置分页
watch(() => [props.activeTag, props.subTab, searchKw.value, props.dayTripTab], () => {
    currentPage.value = 1
    mobileScrollPage.value = 1
    resetRenderLimit()
    hasMore.value = true
    checkHasMore()

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
    () => [targetItemTitle.value, searchKw.value, props.subTab, itemsPerPage.value],
    () => {
        if (!route.query.dialogItemId) return
        locateTargetPageForDialogItem()
    }
)

watch(
    () => route.query.s,
    () => {
        syncLocalSearchFromRoute()
    }
)

watch(() => [selectedRegion.value, selectedTown.value, selectedDistance.value], () => {
    currentPage.value = 1
    mobileScrollPage.value = 1
    resetRenderLimit()
    hasMore.value = true
    checkHasMore()
    nextTick(updateMobileScrollPage)
})

watch(() => selectedRegion.value, () => {
    if (selectedTown.value && !townOptions.value.includes(selectedTown.value)) {
        selectedTown.value = ''
    }
})

watch(() => loadMoreTriggerRef.value, () => {
    nextTick(initLoadMoreObserver)
})

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
        if (props.subTab === '葡萄酒酒庄') return wineFiltered.value.length
        if (props.subTab === '洋酒酒庄') return spiritFiltered.value.length
        if (props.subTab === '住宿') return hotelFiltered.value.length
        if (isSpecialSection.value) return activityFiltered.value.length
    } else {
        if (props.subTab === '景点') return scenicFiltered.value.length
        if (props.subTab === '餐厅') return restaurantFiltered.value.length
        if (props.subTab === '葡萄酒酒庄') return displayWineWineries.value.length
        if (props.subTab === '洋酒酒庄') return displaySpiritWineries.value.length
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

    const visibleCount = Math.max(renderLimit.value, itemsPerPage.value)
    return Array.isArray(items) ? items.slice(0, visibleCount) : []
}

// 从data.json获取数据
const getDayTripData = () => {
    try {
        return dayTripData?.subNav || []
    } catch (error) {
        return []
    }
}

const dayTripNavs = getDayTripData()

const datas = freeInfoData || { subNav: [] }
const places = datas.subNav.find(subItem => subItem.subNavName == "景点") || { items: [] }
const restaurants = datas.subNav.find(subItem => subItem.subNavName == "餐厅") || { items: [] }
const wineWineries = datas.subNav.find(subItem => subItem.subNavName == "葡萄酒酒庄") || { items: [] }
const spiritWineries = datas.subNav.find(subItem => subItem.subNavName == "洋酒酒庄") || { items: [] }
const hotels = datas.subNav.find(subItem => subItem.subNavName == "住宿") || { items: [] }

const activityItems = datas.subNav.find(subItem => subItem.subNavName == "特别活动") || { items: [] }

function getActivityImage(imgPath) {
    return getThumbImageUrl(imgPath)
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

// 免费信息：当前子项（如 特别活动/徒步线路/葡萄酒酒庄/洋酒酒庄/住宿/塔州露营地）数据
const currentFreeInfoSection = computed(() => {
    try {
        if (!datas?.subNav || !props.subTab) return null
        return datas.subNav.find(subItem => subItem.subNavName === props.subTab) || null
    } catch (e) {
        return null
    }
})

// 是否为免费信息下的“内容块模式”（isGrid=false）
const isSpecialSection = computed(() => {
    return props.activeTag === '自助游/自驾游免费参考信息' && currentFreeInfoSection?.value?.isGrid === false
})

// 当前展示用的“特别内容”列表与标题
const currentSpecialItems = computed(() => currentFreeInfoSection?.value?.items || [])
const currentSpecialTitle = computed(() => currentFreeInfoSection?.value?.activitiesTitle || '塔斯马尼亚特别内容')
const currentSpecialSubtitle = computed(() => currentFreeInfoSection?.value?.activitiesSubtitle || '')

const shouldShowAreaFilters = computed(() => {
    return props.activeTag === '自助游/自驾游免费参考信息' && FREE_INFO_FILTER_SUBTABS.includes(props.subTab)
})

watch(() => shouldShowAreaFilters.value, (enabled) => {
    if (!enabled) {
        selectedRegion.value = ''
        selectedTown.value = ''
    }
})
function normalizeAreaInfo(item) {
    if (item && typeof item === 'object' && normalizedAreaInfoCache.has(item)) {
        return normalizedAreaInfoCache.get(item)
    }

    const regionRaw = String(item?.region || item?.tripData?.region || '').trim()
    const townRaw = String(item?.town || item?.tripData?.town || '').trim()
    const lowerTown = townRaw.toLowerCase()

    let normalizedRegion = ''
    if (regionRaw && regionTownGroups.some(group => group.region === regionRaw)) {
        normalizedRegion = regionRaw
    } else if (townRaw && townToRegionMap.has(lowerTown)) {
        normalizedRegion = townToRegionMap.get(lowerTown) || ''
    } else if (regionRaw) {
        normalizedRegion = regionRaw
    } else {
        normalizedRegion = UNCATEGORIZED_REGION
    }

    const normalized = {
        region: normalizedRegion,
        town: townRaw || UNCATEGORIZED_TOWN
    }
    if (item && typeof item === 'object') {
        normalizedAreaInfoCache.set(item, normalized)
    }
    return normalized
}

function filterByRegionAndTown(items) {
    const sourceItems = Array.isArray(items) ? items : []
    if (!shouldShowAreaFilters.value) return sourceItems

    return sourceItems.filter(item => {
        const areaInfo = normalizeAreaInfo(item)
        const regionMatched = !selectedRegion.value || areaInfo.region === selectedRegion.value
        const townMatched = !selectedTown.value || areaInfo.town === selectedTown.value
        return regionMatched && townMatched
    })
}

const regionOptions = computed(() => {
    const defaultOptions = regionTownGroups.map(group => group.region)
    const regionSet = new Set(defaultOptions)
    const currentItems = props.subTab === '景点'
        ? places?.items || []
        : props.subTab === '餐厅'
            ? restaurants?.items || []
            : props.subTab === '住宿'
                ? hotels?.items || []
                : []

    currentItems.forEach(item => {
        const normalized = normalizeAreaInfo(item)
        if (normalized.region && normalized.region !== UNCATEGORIZED_REGION) {
            regionSet.add(normalized.region)
        }
    })

    return Array.from(regionSet)
})

const townOptions = computed(() => {
    if (!selectedRegion.value) return []

    const grouped = regionTownGroups.find(group => group.region === selectedRegion.value)
    const baseTowns = grouped ? [...grouped.towns] : []
    const townSet = new Set(baseTowns)
    const currentItems = props.subTab === '景点'
        ? places?.items || []
        : props.subTab === '餐厅'
            ? restaurants?.items || []
            : props.subTab === '住宿'
                ? hotels?.items || []
                : []

    currentItems.forEach(item => {
        const normalized = normalizeAreaInfo(item)
        if (normalized.region === selectedRegion.value && normalized.town && normalized.town !== UNCATEGORIZED_TOWN) {
            townSet.add(normalized.town)
        }
    })

    return Array.from(townSet)
})

function getRegionDisplayName(item) {
    const region = normalizeAreaInfo(item).region
    return region === UNCATEGORIZED_REGION ? '暂未分类' : region
}

function getRegionSortOrder(item) {
    const region = normalizeAreaInfo(item).region
    if (region === UNCATEGORIZED_REGION) return 9999
    if (regionOrderMap.has(region)) return regionOrderMap.get(region)
    return 9998
}

function sortByRegion(items) {
    const list = Array.isArray(items) ? [...items] : []
    return list.sort((a, b) => {
        const regionOrderDiff = getRegionSortOrder(a) - getRegionSortOrder(b)
        if (regionOrderDiff !== 0) return regionOrderDiff

        const aTown = normalizeAreaInfo(a).town
        const bTown = normalizeAreaInfo(b).town
        const townDiff = String(aTown).localeCompare(String(bTown), 'zh-Hans-CN')
        if (townDiff !== 0) return townDiff

        return String(a?.title || '').localeCompare(String(b?.title || ''), 'zh-Hans-CN')
    })
}

function getItemDistance(item) {
    const areaInfo = normalizeAreaInfo(item)
    if (areaInfo.town === UNCATEGORIZED_TOWN) {
        return null
    }
    return getDistanceBetweenTowns(selectedDistance.value, areaInfo.town)
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

function shouldShowRegionTitle(list, index) {
    if (!Array.isArray(list) || !list.length) return false
    if (index === 0) return true
    return getRegionDisplayName(list[index]) !== getRegionDisplayName(list[index - 1])
}

function getTownDisplayName(item) {
    const town = normalizeAreaInfo(item).town
    return town === UNCATEGORIZED_TOWN ? '暂未分类城镇' : town
}

function shouldShowTownTitle(list, index) {
    if (!Array.isArray(list) || !list.length) return false
    if (index === 0) return true
    const currentTown = normalizeAreaInfo(list[index]).town
    const prevTown = normalizeAreaInfo(list[index - 1]).town
    return currentTown !== prevTown
}

const scenicDisplayItems = computed(() => {
    const baseItems = sortByRegion(scenicFiltered.value)
    if (selectedDistance.value) {
        return sortByDistance(baseItems)
    }
    return baseItems
})
const restaurantDisplayItems = computed(() => {
    const baseItems = sortByRegion(restaurantFiltered.value)
    if (selectedDistance.value) {
        return sortByDistance(baseItems)
    }
    return baseItems
})
const hotelDisplayItems = computed(() => {
    const baseItems = sortByRegion(hotelFiltered.value)
    if (selectedDistance.value) {
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

const scenicFiltered = computed(() => {
    const kw = (searchKw.value || searchQuery.value || '').trim()
    const baseItems = filterByRegionAndTown(places?.items || [])
    if (!kw) return baseItems
    return baseItems.filter((item) => tourItemMatchesKeyword(item, kw))
})

// 直接处理餐厅数据，与其他数据结构保持一致
const restaurantFiltered = computed(() => {
    const kw = (searchKw.value || searchQuery.value || '').trim()
    const baseItems = filterByRegionAndTown(restaurants?.items || [])
    if (!kw) return baseItems
    return baseItems.filter((item) => tourItemMatchesKeyword(item, kw))
})

// 用于显示的餐厅列表（直接使用原始数据，与景点保持一致）
const displayRestaurants = computed(() => {
    return filterByRegionAndTown(restaurants?.items || [])
})

// 葡萄酒酒庄数据过滤
const wineFiltered = computed(() => {
    const kw = (searchKw.value || searchQuery.value || '').trim()
    if (!kw) return wineWineries?.items || []
    return (wineWineries?.items || []).filter((item) => tourItemMatchesKeyword(item, kw))
})

// 用于显示的葡萄酒酒庄列表
const displayWineWineries = computed(() => {
    return wineWineries?.items || []
})

// 洋酒酒庄数据过滤
const spiritFiltered = computed(() => {
    const kw = (searchKw.value || searchQuery.value || '').trim()
    if (!kw) return spiritWineries?.items || []
    return (spiritWineries?.items || []).filter((item) => tourItemMatchesKeyword(item, kw))
})

// 用于显示的洋酒酒庄列表
const displaySpiritWineries = computed(() => {
    return spiritWineries?.items || []
})

const hotelFiltered = computed(() => {
    const kw = (searchKw.value || searchQuery.value || '').trim()
    const baseItems = filterByRegionAndTown(hotels?.items || [])
    if (!kw) return baseItems
    return baseItems.filter((item) => tourItemMatchesKeyword(item, kw))
})

const activityFiltered = computed(() => {
    const kw = (searchKw.value || searchQuery.value || '').trim()
    const base = currentSpecialItems.value || []
    if (!kw) return base
    return base.filter((item) => tourItemMatchesKeyword(item, kw))
})

// 对外事件
function onOpenTour(item) {
    // 声明变量存储处理后的数据
    let tripData = item.tripData;
    let bannerImage = item.img;
    let tripType = '一日游';

    // 根据不同的activeTag和subTab确定tripType
    if (props.activeTag === '自助游/自驾游免费参考信息') {
        if (props.subTab === '景点') {
            tripType = '景点信息';
        } else if (props.subTab === '餐厅') {
            tripType = '餐厅信息';
        } else if (props.subTab === '葡萄酒酒庄') {
            tripType = '葡萄酒酒庄信息';
        } else if (props.subTab === '洋酒酒庄') {
            tripType = '洋酒酒庄信息';
        } else if (props.subTab === '住宿') {
            tripType = '住宿信息';
        }
    }

    // 如果是景点数据，从places中查找完整信息
    if (props.activeTag === '自助游/自驾游免费参考信息' && props.subTab === '景点' && places && places.items) {
        const placeItem = places.items.find(place => place.title === item.title);
        if (placeItem) {
            tripData = placeItem.tripData;
            bannerImage = placeItem.img;
        }
    }

    // 如果是餐厅数据，从restaurants中查找完整信息
    if (props.activeTag === '自助游/自驾游免费参考信息' && props.subTab === '餐厅' && restaurants && restaurants.items) {
        const restaurantItem = restaurants.items.find(restaurant => restaurant.title === item.title);
        if (restaurantItem) {
            tripData = restaurantItem.tripData;
            bannerImage = restaurantItem.img;
        }
    }

    // 如果是葡萄酒酒庄数据，从wineWineries中查找完整信息
    if (props.activeTag === '自助游/自驾游免费参考信息' && props.subTab === '葡萄酒酒庄' && wineWineries && wineWineries.items) {
        const wineryItem = wineWineries.items.find(winery => winery.title === item.title);
        if (wineryItem) {
            tripData = wineryItem.tripData;
            bannerImage = wineryItem.img;
        }
    }

    // 如果是洋酒酒庄数据，从spiritWineries中查找完整信息
    if (props.activeTag === '自助游/自驾游免费参考信息' && props.subTab === '洋酒酒庄' && spiritWineries && spiritWineries.items) {
        const wineryItem = spiritWineries.items.find(winery => winery.title === item.title);
        if (wineryItem) {
            tripData = wineryItem.tripData;
            bannerImage = wineryItem.img;
        }
    }

    // 如果是住宿数据，从hotels中查找完整信息
    if (props.activeTag === '自助游/自驾游免费参考信息' && props.subTab === '住宿' && hotels && hotels.items) {
        const hotelItem = hotels.items.find(hotel => hotel.title === item.title);
        if (hotelItem) {
            tripData = hotelItem.tripData;
            bannerImage = hotelItem.img;
        }
    }

    // 如果是一日游/多日游，item本身应该已经包含tripData
    if (props.activeTag === '一日游/多日游') {
        tripData = item.tripData;
        bannerImage = item.img || bannerImage;
    }

    // 如果没有找到tripData，使用默认数据
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

    const resolvedBannerImages = normalizeImageList(bannerImage)
    const resolvedBanner = resolvedBannerImages[0] || getImageUrl(Array.isArray(bannerImage) ? '' : bannerImage)

    const normalizedTripData = tripData && typeof tripData === 'object'
        ? { ...tripData }
        : tripData

    if (
        normalizedTripData &&
        typeof normalizedTripData === 'object' &&
        resolvedBannerImages.length > 0 &&
        (!Array.isArray(normalizedTripData.images) || normalizedTripData.images.length === 0)
    ) {
        normalizedTripData.images = resolvedBannerImages
    }

    emit('openTourDialog', {
        ...item,
        title: item.title,
        enTitle: item.enTitle,
        banner: resolvedBanner,
        tripType: tripType,
        tripData: normalizedTripData
    })
}
function onOpenPlace(groupName, itemType) {
    emit('openPlaceList', { placeName: groupName, itemType })
}

// 从data.json获取一日游数据
const getDayTripItems = (tabName) => {
    const navItem = dayTripNavs.find(nav => nav.subNavName === tabName)
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
    return currentDayTripItems.value.filter((item) => tourItemMatchesKeyword(item, kw))
})

const showDayTrip = computed(() => props.activeTag === '一日游/多日游')

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
            <el-select v-model="selectedRegion" clearable filterable placeholder="一级分类（分区）" class="area-select"
                size="large">
                <el-option v-for="region in regionOptions" :key="region" :label="region" :value="region" />
            </el-select>
            <el-select v-model="selectedTown" clearable filterable placeholder="二级分类（城镇）" class="area-select"
                size="large" :disabled="!selectedRegion">
                <el-option v-for="town in townOptions" :key="town" :label="town" :value="town" />
            </el-select>
            <el-select v-model="selectedDistance" clearable filterable placeholder="按距离排序" class="distance-select"
                size="large">
                <el-option-group v-for="group in regionTownGroups" :key="group.region" :label="`— ${group.region} —`">
                    <el-option v-for="town in group.towns" :key="town" :label="town" :value="town" />
                </el-option-group>
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
                                <span
                                    v-for="(seg, idx) in getHighlightSegments(item.title, highlightKw)"
                                    :key="idx">
                                    <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                                    <span v-else>{{ seg.text }}</span>
                                </span>
                            </div>
                            <div class="card-sub" :title="item.sub">
                                <span
                                    v-for="(seg, idx) in getHighlightSegments(item.sub, highlightKw)"
                                    :key="idx">
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
            </template>
        </template>

        <!-- 搜索结果区：景点 -->
        <template v-if="(s?.trim() || isLocalSearch) && subTab === '景点'">
            <template v-if="scenicFiltered.length">
                <div ref="gridRef" class="coming-grid">
                    <template v-for="(item, i) in getPaginatedItems(scenicDisplayItems)" :key="'sc2-' + i">
                        <h1 v-if="shouldShowRegionTitle(getPaginatedItems(scenicDisplayItems), i)"
                            class="region-title center">
                            {{ getRegionDisplayName(item) }}
                        </h1>
                        <h2 v-if="shouldShowTownTitle(getPaginatedItems(scenicDisplayItems), i)"
                            class="town-title center">
                            — {{ getTownDisplayName(item) }} —
                        </h2>
                        <div class="coming-card" @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getScenicGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">
                                <span
                                    v-for="(seg, idx) in getHighlightSegments(item.title, highlightKw)"
                                    :key="idx">
                                    <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                                    <span v-else>{{ seg.text }}</span>
                                </span>
                            </div>
                            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
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
                        <h1 v-if="shouldShowRegionTitle(getPaginatedItems(restaurantDisplayItems), i)"
                            class="region-title center">
                            {{ getRegionDisplayName(item) }}
                        </h1>
                        <h2 v-if="shouldShowTownTitle(getPaginatedItems(restaurantDisplayItems), i)"
                            class="town-title center">
                            — {{ getTownDisplayName(item) }} —
                        </h2>
                        <div class="coming-card" @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getRestaurantGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">
                                <span
                                    v-for="(seg, idx) in getHighlightSegments(item.title, highlightKw)"
                                    :key="idx">
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

        <!-- 搜索结果区：葡萄酒酒庄 -->
        <template v-else-if="(s?.trim() || isLocalSearch) && subTab === '葡萄酒酒庄'">
            <template v-if="wineFiltered.length">
                <h1 class="region-title center">Hobart</h1>
                <div ref="gridRef" class="coming-grid">
                    <div v-for="(item, i) in getPaginatedItems(wineFiltered)" :key="'wine-search-' + i"
                        class="coming-card" @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                        <img :src="getThumbImageUrl(item.img)" :alt="item.title" class="w100"
                            :loading="getImageLoading(i)" decoding="async" :fetchpriority="getImageFetchPriority(i)">
                        <div class="card-title" :title="item.title">
                            <span v-for="(seg, idx) in getHighlightSegments(item.title, highlightKw)"
                                :key="idx">
                                <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                                <span v-else>{{ seg.text }}</span>
                            </span>
                        </div>
                        <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                    </div>
                </div>
                <!-- <div v-if="isLoading" class="loading-tip">加载中...</div> -->
                <div v-if="wineFiltered.length > 0" class="pagination-section pagination-section--scenic">
                    <div class="custom-pagination custom-pagination--fixed">
                        <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
                            {{
                                mobileTotalPages }} 页</div>
                    </div>
                </div>
            </template>
            <div v-else class="empty-tip">没有搜索结果</div>
        </template>

        <!-- 搜索结果区：洋酒酒庄 -->
        <template v-else-if="(s?.trim() || isLocalSearch) && subTab === '洋酒酒庄'">
            <template v-if="spiritFiltered.length">
                <h1 class="region-title center">Hobart</h1>
                <div ref="gridRef" class="coming-grid">
                    <div v-for="(item, i) in getPaginatedItems(spiritFiltered)" :key="'spirit-search-' + i"
                        class="coming-card" @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                        <img :src="getThumbImageUrl(item.img)" :alt="item.title" class="w100"
                            :loading="getImageLoading(i)" decoding="async" :fetchpriority="getImageFetchPriority(i)">
                        <div class="card-title" :title="item.title">
                            <span v-for="(seg, idx) in getHighlightSegments(item.title, highlightKw)"
                                :key="idx">
                                <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                                <span v-else>{{ seg.text }}</span>
                            </span>
                        </div>
                        <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                    </div>
                </div>
                <!-- <div v-if="isLoading" class="loading-tip">加载中...</div> -->
                <div v-if="spiritFiltered.length > 0" class="pagination-section pagination-section--scenic">
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
                        <h1 v-if="shouldShowRegionTitle(getPaginatedItems(hotelDisplayItems), i)"
                            class="region-title center">
                            {{ getRegionDisplayName(item) }}
                        </h1>
                        <h2 v-if="shouldShowTownTitle(getPaginatedItems(hotelDisplayItems), i)"
                            class="town-title center">
                            — {{ getTownDisplayName(item) }} —
                        </h2>
                        <div class="coming-card" @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getHotelGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">
                                <span
                                    v-for="(seg, idx) in getHighlightSegments(item.title, highlightKw)"
                                    :key="idx">
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

        <!-- 免费信息（isGrid=false）：关键词搜索结果（适配 特别活动/徒步线路/葡萄酒酒庄/洋酒酒庄/塔州露营地 等）-->
        <div class="special-activities-section" v-else-if="(s?.trim() || isLocalSearch) && isSpecialSection">
            <template v-if="activityFiltered.length">
                <div class="activities-header">
                    <h2 class="activities-title">{{ currentSpecialTitle }}</h2>
                    <p class="activities-subtitle">{{ currentSpecialSubtitle }}</p>
                </div>

                <div ref="gridRef" class="activities-grid">
                    <div v-for="(item, i) in getPaginatedItems(activityFiltered)" :key="'ac-filtered-' + i"
                        :class="['activity-card', item.cardClass]">
                        <div class="activity-image">
                            <img :src="getActivityImage(item.img)" alt="特别活动" class="activity-img"
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
            <template v-if="scenicDisplayItems.length">
                <div ref="gridRef" class="coming-grid">
                    <template v-for="(item, i) in getPaginatedItems(scenicDisplayItems)" :key="'rt-bottom-' + i">
                        <h1 v-if="shouldShowRegionTitle(getPaginatedItems(scenicDisplayItems), i)"
                            class="region-title center">
                            {{ getRegionDisplayName(item) }}
                        </h1>
                        <h2 v-if="shouldShowTownTitle(getPaginatedItems(scenicDisplayItems), i)"
                            class="town-title center">
                            — {{ getTownDisplayName(item) }} —
                        </h2>
                        <div class="coming-card" @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getScenicGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">{{ item.title }}</div>
                            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                        </div>
                    </template>
                </div>
            </template>
            <div v-else class="empty-tip">该分类下暂无结果</div>
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
                        <h1 v-if="shouldShowRegionTitle(getPaginatedItems(restaurantDisplayItems), i)"
                            class="region-title center">
                            {{ getRegionDisplayName(item) }}
                        </h1>
                        <h2 v-if="shouldShowTownTitle(getPaginatedItems(restaurantDisplayItems), i)"
                            class="town-title center">
                            — {{ getTownDisplayName(item) }} —
                        </h2>
                        <div class="coming-card" @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getRestaurantGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">{{ item.title }}</div>
                            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                        </div>
                    </template>
                </div>
            </template>
            <div v-else class="empty-tip">该分类下暂无结果</div>
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

        <!-- 底部网格：葡萄酒酒庄（无关键词） -->
        <template v-if="subTab === '葡萄酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip">
            <div ref="gridRef" class="coming-grid">
                <template v-for="(item, i) in getPaginatedItems(displayWineWineries)" :key="'wine-' + i">
                    <h1 v-if="i % 16 === 0" class="region-title center">Hobart</h1>
                    <div class="coming-card" @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                        <img :src="getThumbImageUrl(item.img)" :alt="item.title" class="w100"
                            :loading="getImageLoading(i)" decoding="async" :fetchpriority="getImageFetchPriority(i)">
                        <div class="card-title" :title="item.title">{{ item.title }}</div>
                        <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                    </div>
                </template>
            </div>
        </template>

        <!-- <div v-if="subTab === '葡萄酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip && isLoading" class="loading-tip">
        加载中...
    </div> -->
        <template
            v-if="subTab === '葡萄酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip && displayWineWineries.length > 0">
            <div class="pagination-section pagination-section--scenic">
                <div class="custom-pagination custom-pagination--fixed">
                    <div class="page-indicator fs14">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
                        mobileTotalPages }} 页</div>
                </div>
            </div>
        </template>

        <!-- 底部网格：洋酒酒庄（无关键词） -->
        <template v-if="subTab === '洋酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip">
            <div ref="gridRef" class="coming-grid">
                <template v-for="(item, i) in getPaginatedItems(displaySpiritWineries)" :key="'spirit-' + i">
                    <h1 v-if="i % 16 === 0" class="region-title center">Hobart</h1>
                    <div class="coming-card" @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                        <img :src="getThumbImageUrl(item.img)" :alt="item.title" class="w100"
                            :loading="getImageLoading(i)" decoding="async" :fetchpriority="getImageFetchPriority(i)">
                        <div class="card-title" :title="item.title">{{ item.title }}</div>
                        <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                    </div>
                </template>
            </div>
        </template>
        <!-- <div v-if="subTab === '洋酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip && isLoading" class="loading-tip">
        加载中...
    </div> -->
        <template
            v-if="subTab === '洋酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip && displaySpiritWineries.length > 0">
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
                        <h1 v-if="shouldShowRegionTitle(getPaginatedItems(hotelDisplayItems), i)"
                            class="region-title center">
                            {{ getRegionDisplayName(item) }}
                        </h1>
                        <h2 v-if="shouldShowTownTitle(getPaginatedItems(hotelDisplayItems), i)"
                            class="town-title center">
                            — {{ getTownDisplayName(item) }} —
                        </h2>
                        <div class="coming-card" @click="onOpenTour(item)" :data-tour-title="getTourItemDialogKey(item)">
                            <img :src="getHotelGridImageUrl(item)" :alt="item.title" class="w100"
                                :loading="getImageLoading(i)" decoding="async"
                                :fetchpriority="getImageFetchPriority(i)">
                            <div class="card-title" :title="item.title">{{ item.title }}</div>
                            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                        </div>
                    </template>
                </div>
            </template>
            <div v-else class="empty-tip">该分类下暂无结果</div>
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

        <!-- 免费信息（isGrid=false）：信息展示区域（无关键词，适配 特别活动/徒步线路/葡萄酒酒庄/洋酒酒庄/塔州露营地 等）-->
        <div v-if="isSpecialSection && !(s?.trim())" class="special-activities-section">
            <div class="activities-header">
                <h2 class="activities-title">{{ currentSpecialTitle }}</h2>
                <p class="activities-subtitle">{{ currentSpecialSubtitle }}</p>
            </div>
            <div ref="gridRef" class="activities-grid">
                <div v-for="(activity, index) in getPaginatedItems(currentSpecialItems)" :key="'activity-' + index"
                    :class="['activity-card', activity.cardClass]">
                    <div class="activity-image">
                        <img :src="getActivityImage(activity.img)" alt="特别活动" class="activity-img"
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


        <div v-if="hasMore" ref="loadMoreTriggerRef" aria-hidden="true"></div>
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
        grid-template-columns: minmax(280px, 1fr) 240px 240px 240px;
        gap: 12px;
        align-items: center;

        .area-select {
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

        .coming-card {
            display: flex;
            border-radius: 12px;
            flex-direction: column;
            justify-content: center;
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
                        display: flex;
                        column-gap: 10px;

                        >div {
                            width: 100px;
                            height: 30px;
                            line-height: 30px;
                        }
                    }
                }
            }
        }

        .aurora-badge {
            background: linear-gradient(135deg, #33b1a3 0%, #279486 100%);
        }

        .event-badge {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .season-badge {
            background: linear-gradient(135deg, #33b1a3 0%, #279486 100%);
        }

        .night-badge {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1024px) {
    .search-container--with-filter {
        grid-template-columns: minmax(220px, 1fr) 1fr 1fr;
    }

    .grid-content-loading {
        .coming-grid {
            grid-template-columns: repeat(4, 1fr);
        }

        .special-activities-section {
            width: 95%;
            padding: 15px 0;

            .activities-header {
                .activities-title {
                    font-size: 26px;
                }

                .activities-subtitle {
                    font-size: 13px;
                }
            }

            .activities-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;

                .activity-card {
                    .activity-image {
                        height: 178px;
                    }

                    .activity-content {
                        padding: 16px;

                        .activity-title {
                            font-size: 14px;
                        }

                        .activity-info .info-item {
                            .info-label,
                            .info-value {
                                font-size: 11px;
                            }
                        }
                    }
                }
            }

            .activity-description {
                font-size: 11px;
            }

            .weather-note {
                font-size: 10px;
            }
        }
    }
}

/* 移动端竖屏适配 */
@media (max-width: 768px) and (orientation: portrait) {
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

/* 移动端横屏适配 */
@media (max-width: 768px) and (orientation: landscape) {
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
</style>