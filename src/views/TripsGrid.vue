<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElPagination, ElInput, ElIcon } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import dataJson from '@/data/data.json'

const route = useRoute()

const props = defineProps({
    activeTag: { type: String, required: true },
    subTab: { type: String, default: '景点' },
    s: { type: String, default: '' },
    dayTripTab: { type: String, default: '1日行程' },
})

const emit = defineEmits(['openTourDialog', 'openPlaceList'])

// 本地搜索状态
const localSearchKeyword = ref('')
const searchQuery = ref('') // 实际执行的搜索词
const isSearching = ref(false) // 搜索加载状态
const isLocalSearch = computed(() => searchQuery.value.trim().length > 0)

// 执行搜索函数
const executeSearch = async () => {
    const keyword = localSearchKeyword.value.trim()
    if (!keyword) {
        searchQuery.value = ''
        return
    }

    isSearching.value = true

    // 模拟1.5秒搜索延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    searchQuery.value = keyword
    isSearching.value = false
    currentPage.value = 1 // 重置到第一页
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

onMounted(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', updateMobileScrollPage, { passive: true })
    checkHasMore()

    // 如果检测到需要自动加载所有数据，立即加载（仅非搜索场景）
    if (shouldLoadAll.value) {
        setTimeout(() => {
            loadAllItems()
        }, 100)
    }

    // 如果是通过搜索结果携带 dialogItemId 打开的页面，定位到包含该结果的页码
    if (route.query.dialogItemId) {
        locateTargetPageForDialogItem()
    }

    nextTick(updateMobileScrollPage)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', updateMobileScrollPage)
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
    if (props.s?.trim()) {
        if (props.subTab === '景点') return scenicFiltered.value || []
        if (props.subTab === '餐厅') return restaurantFiltered.value || []
        if (props.subTab === '葡萄酒酒庄') return wineFiltered.value || []
        if (props.subTab === '洋酒酒庄') return spiritFiltered.value || []
        if (props.subTab === '住宿') return hotelFiltered.value || []
        if (isSpecialSection.value) return activityFiltered.value || []
    } else {
        // 无搜索时，使用原始数据列表
        if (props.subTab === '景点') return places?.items || []
        if (props.subTab === '餐厅') return displayRestaurants.value || []
        if (props.subTab === '葡萄酒酒庄') return displayWineWineries.value || []
        if (props.subTab === '洋酒酒庄') return displaySpiritWineries.value || []
        if (props.subTab === '住宿') return hotels?.items || []
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
    const index = list.findIndex(item => item?.title === title)
    if (index === -1) return

    const pageSize = itemsPerPage.value || 1

    // 计算目标结果所在的页数
    const targetPage = Math.floor(index / pageSize) + 1

    // 如果是移动端（平板/手机），使用累积显示模式
    // 设置 currentPage 为目标页，这样会显示从第1页到目标页的所有数据
    if (isMobile.value) {
        currentPage.value = targetPage
        // 检查是否还有更多数据（目标页之后是否还有数据）
        const totalItems = list.length
        hasMore.value = targetPage * pageSize < totalItems
    } else {
        // PC端：传统分页，只显示目标页
        currentPage.value = targetPage
        const totalItems = list.length
        hasMore.value = targetPage * pageSize < totalItems
    }
}

// 监听props变化，重置分页
watch(() => [props.activeTag, props.subTab, props.s, props.dayTripTab], () => {
    currentPage.value = 1
    mobileScrollPage.value = 1
    hasMore.value = true
    checkHasMore()

    // 如果需要自动加载所有数据，立即加载
    if (shouldLoadAll.value) {
        loadAllItems()
    }

    // 如果是通过 dialogItemId 打开，props 变更后重新定位页码
    if (route.query.dialogItemId) {
        locateTargetPageForDialogItem()
    }

    nextTick(updateMobileScrollPage)
}, { deep: true })

// 当 URL 中的 dialogItemId / 搜索词 / 子标签 或每页数量变化时，尝试重新定位目标页
watch(
    () => [targetItemTitle.value, props.s, props.subTab, itemsPerPage.value],
    () => {
        if (!route.query.dialogItemId) return
        locateTargetPageForDialogItem()
    }
)

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
    currentPage.value++
    checkHasMore()
}

// 检查是否还有更多数据
function checkHasMore() {
    const totalItems = getTotalItems()
    hasMore.value = currentPage.value * itemsPerPage.value < totalItems
}

// 获取当前应该显示的数据总数
function getTotalItems() {
    const searchKeyword = props.s || searchQuery.value || ''
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
        if (props.subTab === '景点') return places?.items?.length || 0
        if (props.subTab === '餐厅') return displayRestaurants.value.length
        if (props.subTab === '葡萄酒酒庄') return displayWineWineries.value.length
        if (props.subTab === '洋酒酒庄') return displaySpiritWineries.value.length
        if (props.subTab === '住宿') return hotels?.items?.length || 0
        if (isSpecialSection.value) return currentSpecialItems.value.length
    }
    return 0
}

// 自动加载所有数据（用于新窗口打开时的高亮功能）
function loadAllItems() {
    if (isLoading.value) return

    const totalItems = getTotalItems()
    if (totalItems <= 0) return

    // 计算需要加载的页数
    const totalPages = Math.ceil(totalItems / itemsPerPage.value)

    if (currentPage.value < totalPages) {
        isLoading.value = true
        currentPage.value = totalPages
        hasMore.value = false

        // 使用 setTimeout 模拟加载过程，确保 DOM 更新
        setTimeout(() => {
            isLoading.value = false
        }, 300)
    }
}

// 获取分页后的数据
function getPaginatedItems(items) {
    // 如果需要自动加载所有数据，返回所有数据
    if (shouldLoadAll.value) {
        return items
    }

    // 所有设备：一次性展示全部数据
    return items
}

// 从data.json获取数据
const getDayTripData = () => {
    try {
        if (!dataJson) return []
        const dayTripSection = dataJson.find(item => item.tagName === '一日游/多日游')
        return dayTripSection?.subNav || []
    } catch (error) {
        return []
    }
}

const dayTripNavs = getDayTripData()

const datas = dataJson.find(data => data.tagName == "自助游/自驾游免费参考信息")
const places = datas.subNav.find(subItem => subItem.subNavName == "景点")
const restaurants = datas.subNav.find(subItem => subItem.subNavName == "餐厅")
const wineWineries = datas.subNav.find(subItem => subItem.subNavName == "葡萄酒酒庄")
const spiritWineries = datas.subNav.find(subItem => subItem.subNavName == "洋酒酒庄")
const hotels = datas.subNav.find(subItem => subItem.subNavName == "住宿")

const activityItems = datas.subNav.find(subItem => subItem.subNavName == "特别活动")

function getActivityImage(imgPath) {
    return getImageUrl(imgPath)
}

// 处理图片路径
function getImageUrl(imgPath) {
    if (!imgPath) return new URL('@/assets/img/default.png', import.meta.url).href

    const normalizedPath = String(imgPath).trim()
        // 兼容误写的 ../assetes
        .replace(/^(\.\.\/)assetes\//, '$1assets/')

    // 如果已经是完整的URL，直接返回
    if (normalizedPath.startsWith('http') || normalizedPath.startsWith('data:')) {
        return normalizedPath
    }

    const candidates = [normalizedPath]
    if (normalizedPath.startsWith('@/')) {
        candidates.push(`../${normalizedPath.slice(2)}`)
    }
    if (normalizedPath.startsWith('../assets/')) {
        candidates.push(normalizedPath.replace('../assets/', '@/assets/'))
    }

    for (const candidate of candidates) {
        try {
            // new URL 不支持 @ 前缀，跳过
            if (candidate.startsWith('@/')) continue
            return new URL(candidate, import.meta.url).href
        } catch (e) {
            // continue
        }
    }
    return new URL('@/assets/img/default.png', import.meta.url).href
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
    const kw = (props.s || searchQuery.value || '').trim()
    if (!kw) return places?.items || []
    return (places?.items || []).filter(item => matchesKeyword(item.title, kw))
})

// 直接处理餐厅数据，与其他数据结构保持一致
const restaurantFiltered = computed(() => {
    const kw = (props.s || searchQuery.value || '').trim()
    if (!kw) return restaurants?.items || []
    return (restaurants?.items || []).filter(item =>
        matchesKeyword(item.title, kw) ||
        (item.place && matchesKeyword(item.place, kw)) ||
        (item.enPlace && matchesKeyword(item.enPlace, kw))
    )
})

// 用于显示的餐厅列表（直接使用原始数据，与景点保持一致）
const displayRestaurants = computed(() => {
    return restaurants?.items || []
})

// 葡萄酒酒庄数据过滤
const wineFiltered = computed(() => {
    const kw = (props.s || searchQuery.value || '').trim()
    if (!kw) return wineWineries?.items || []
    return (wineWineries?.items || []).filter(item =>
        matchesKeyword(item.title, kw) ||
        (item.place && matchesKeyword(item.place, kw)) ||
        (item.enPlace && matchesKeyword(item.enPlace, kw))
    )
})

// 用于显示的葡萄酒酒庄列表
const displayWineWineries = computed(() => {
    return wineWineries?.items || []
})

// 洋酒酒庄数据过滤
const spiritFiltered = computed(() => {
    const kw = (props.s || searchQuery.value || '').trim()
    if (!kw) return spiritWineries?.items || []
    return (spiritWineries?.items || []).filter(item =>
        matchesKeyword(item.title, kw) ||
        (item.place && matchesKeyword(item.place, kw)) ||
        (item.enPlace && matchesKeyword(item.enPlace, kw))
    )
})

// 用于显示的洋酒酒庄列表
const displaySpiritWineries = computed(() => {
    return spiritWineries?.items || []
})

const hotelFiltered = computed(() => {
    const kw = (props.s || searchQuery.value || '').trim()
    if (!kw) return hotels?.items || []
    return (hotels?.items || []).filter(item =>
        matchesKeyword(item.place, kw) ||
        matchesKeyword(item.enPlace, kw)
    )
})

const activityFiltered = computed(() => {
    const kw = (props.s || searchQuery.value || '').trim()
    const base = currentSpecialItems.value || []
    if (!kw) return base
    return base.filter(item =>
        matchesKeyword(item.title, kw) ||
        (item.location && matchesKeyword(item.location, kw)) ||
        (Array.isArray(item.tags) && item.tags.some(tag => matchesKeyword(tag, kw))) ||
        (Array.isArray(item.tagItems) && item.tagItems.some(t => matchesKeyword(t?.text, kw)))
    )
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

    emit('openTourDialog', {
        ...item,
        title: item.title,
        enTitle: item.enTitle,
        banner: getImageUrl(bannerImage),
        tripType: tripType,
        tripData: tripData
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
    const kw = (props.s || searchQuery.value || '').trim()
    if (!kw) return currentDayTripItems.value
    return currentDayTripItems.value.filter(item =>
        matchesKeyword(item.title, kw) ||
        (item.sub && matchesKeyword(item.sub, kw))
    )
})

const showDayTrip = computed(() => props.activeTag === '一日游/多日游')

</script>

<template>
    <!-- 搜索框：只在非一日游页面显示 -->
    <div class="search-container">
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
    </div>

    <!-- 全屏加载 -->
    <div v-loading.fullscreen="isSearching || isLoading" element-loading-spinner-color="#279486"
        element-loading-background="rgba(255, 255, 255, 0.8)"></div>

    <!-- 主内容区 -->
    <!-- 一日游：根据传入的 dayTripTab 渲染对应数据 -->
    <template v-if="showDayTrip">
        <template v-if="(s?.trim() || isLocalSearch)">
            <template v-if="dayTripFiltered.length">
                <div ref="gridRef" class="coming-grid">
                    <div v-for="(item, i) in getPaginatedItems(dayTripFiltered)" :key="`day-trip-${dayTripTab}-${i}`"
                        class="coming-card" @click="onOpenTour(item)" :data-tour-title="item.title">
                        <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
                        <div class="card-title" :title="item.title">
                            <span v-for="(seg, idx) in getHighlightSegments(item.title, s || localSearchKeyword.value)"
                                :key="idx">
                                <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                                <span v-else>{{ seg.text }}</span>
                            </span>
                        </div>
                        <div class="card-sub" :title="item.sub">
                            <span v-for="(seg, idx) in getHighlightSegments(item.sub, s || localSearchKeyword.value)"
                                :key="idx">
                                <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                                <span v-else>{{ seg.text }}</span>
                            </span>
                        </div>
                    </div>
                </div>
                <div v-if="dayTripFiltered.length > 0" class="pagination-section pagination-section--scenic">
                    <div class="custom-pagination custom-pagination--fixed">
                        <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
                            {{
                                mobileTotalPages }} 页</div>
                    </div>
                </div>
            </template>
            <div v-else class="empty-tip">没有搜索结果</div>
        </template>
        <template v-else>
            <div ref="gridRef" class="coming-grid">
                <div v-for="(item, i) in getPaginatedItems(currentDayTripItems)" :key="`day-trip-${dayTripTab}-${i}`"
                    class="coming-card" @click="onOpenTour(item)" :data-tour-title="item.title">
                    <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
                    <div class="card-title" :title="item.title">{{ item.title }}</div>
                    <div class="card-sub" :title="item.sub">{{ item.sub }}</div>
                </div>
            </div>
            <div v-if="currentDayTripItems.length > 0" class="pagination-section pagination-section--scenic">
                <div class="custom-pagination custom-pagination--fixed">
                    <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
                        mobileTotalPages }} 页</div>
                </div>
            </div>
        </template>
    </template>

    <!-- 搜索结果区：景点 -->
    <template v-if="(s?.trim() || isLocalSearch) && subTab === '景点'">
        <template v-if="scenicFiltered.length">
            <div ref="gridRef" class="coming-grid">
                <div v-for="(item, i) in getPaginatedItems(scenicFiltered)" :key="'sc2-' + i" class="coming-card"
                    @click="onOpenTour(item)" :data-tour-title="item.title">
                    <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
                    <div class="card-title" :title="item.title">
                        <span v-for="(seg, idx) in getHighlightSegments(item.title, s || localSearchKeyword.value)"
                            :key="idx">
                            <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                            <span v-else>{{ seg.text }}</span>
                        </span>
                    </div>
                    <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                </div>
            </div>
            <!-- <div v-if="isLoading" class="loading-tip">加载中...</div> -->
            <div v-if="scenicFiltered.length > 0" class="pagination-section pagination-section--scenic">
                <div class="custom-pagination custom-pagination--fixed">
                    <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
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
                <div v-for="(item, i) in getPaginatedItems(restaurantFiltered)" :key="'rt-search-' + i"
                    class="coming-card" @click="onOpenTour(item)" :data-tour-title="item.title">
                    <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
                    <div class="card-title" :title="item.title">
                        <span v-for="(seg, idx) in getHighlightSegments(item.title, s || localSearchKeyword.value)"
                            :key="idx">
                            <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                            <span v-else>{{ seg.text }}</span>
                        </span>
                    </div>
                    <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                </div>
            </div>
            <!-- <div v-if="isLoading" class="loading-tip">加载中...</div> -->
            <div v-if="restaurantFiltered.length > 0" class="pagination-section pagination-section--scenic">
                <div class="custom-pagination custom-pagination--fixed">
                    <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
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
            <div ref="gridRef" class="coming-grid">
                <div v-for="(item, i) in getPaginatedItems(wineFiltered)" :key="'wine-search-' + i" class="coming-card"
                    @click="onOpenTour(item)" :data-tour-title="item.title">
                    <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
                    <div class="card-title" :title="item.title">
                        <span v-for="(seg, idx) in getHighlightSegments(item.title, s || localSearchKeyword.value)"
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
                    <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
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
            <div ref="gridRef" class="coming-grid">
                <div v-for="(item, i) in getPaginatedItems(spiritFiltered)" :key="'spirit-search-' + i"
                    class="coming-card" @click="onOpenTour(item)" :data-tour-title="item.title">
                    <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
                    <div class="card-title" :title="item.title">
                        <span v-for="(seg, idx) in getHighlightSegments(item.title, s || localSearchKeyword.value)"
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
                    <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
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
                <div v-for="(item, i) in getPaginatedItems(hotelFiltered)" :key="'ht-search-' + i" class="coming-card"
                    @click="onOpenTour(item)" :data-tour-title="item.title">
                    <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
                    <div class="card-title" :title="item.title">
                        <span v-for="(seg, idx) in getHighlightSegments(item.title, s || localSearchKeyword.value)"
                            :key="idx">
                            <span v-if="seg.highlight" class="search-highlight">{{ seg.text }}</span>
                            <span v-else>{{ seg.text }}</span>
                        </span>
                    </div>
                    <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                </div>
            </div>
            <!-- <div v-if="isLoading" class="loading-tip">加载中...</div> -->
            <div v-if="hotelFiltered.length > 0" class="pagination-section pagination-section--scenic">
                <div class="custom-pagination custom-pagination--fixed">
                    <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
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
                        <img :src="getActivityImage(item.img)" alt="特别活动" class="activity-img">
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
                    <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> /
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
    <div v-if="subTab === '景点' && !isLocalSearch && !(s?.trim()) && !showDayTrip" ref="gridRef" class="coming-grid">
        <div v-for="(item, i) in getPaginatedItems(places.items)" :key="'rt-bottom-' + i" class="coming-card"
            @click="onOpenTour(item)" :data-tour-title="item.title">
            <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
            <div class="card-title" :title="item.title">{{ item.title }}</div>
            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
        </div>
    </div>
    <!-- <div v-if="subTab === '景点' && !isLocalSearch && !(s?.trim()) && !showDayTrip && isLoading" class="loading-tip">
        加载中...
    </div> -->
    <div v-if="subTab === '景点' && !isLocalSearch && !(s?.trim()) && !showDayTrip && places.items.length > 0"
        class="pagination-section pagination-section--scenic">
        <div class="custom-pagination custom-pagination--fixed">
            <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
                mobileTotalPages }} 页</div>
        </div>
    </div>

    <!-- 底部网格：餐厅（无关键词） -->
    <div v-if="subTab === '餐厅' && !isLocalSearch && !(s?.trim()) && !showDayTrip" ref="gridRef" class="coming-grid">
        <div v-for="(item, i) in getPaginatedItems(displayRestaurants)" :key="'restaurant-' + i" class="coming-card"
            @click="onOpenTour(item)" :data-tour-title="item.title">
            <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
            <div class="card-title" :title="item.title">{{ item.title }}</div>
            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
        </div>
    </div>
    <!-- <div v-if="subTab === '餐厅' && !isLocalSearch && !(s?.trim()) && !showDayTrip && isLoading" class="loading-tip">
        加载中...
    </div> -->
    <div v-if="subTab === '餐厅' && !isLocalSearch && !(s?.trim()) && !showDayTrip && displayRestaurants.length > 0"
        class="pagination-section pagination-section--scenic">
        <div class="custom-pagination custom-pagination--fixed">
            <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
                mobileTotalPages }} 页</div>
        </div>
    </div>

    <!-- 底部网格：葡萄酒酒庄（无关键词） -->
    <div v-if="subTab === '葡萄酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip" ref="gridRef" class="coming-grid">
        <div v-for="(item, i) in getPaginatedItems(displayWineWineries)" :key="'wine-' + i" class="coming-card"
            @click="onOpenTour(item)" :data-tour-title="item.title">
            <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
            <div class="card-title" :title="item.title">{{ item.title }}</div>
            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
        </div>
    </div>
    <!-- <div v-if="subTab === '葡萄酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip && isLoading" class="loading-tip">
        加载中...
    </div> -->
    <div v-if="subTab === '葡萄酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip && displayWineWineries.length > 0"
        class="pagination-section pagination-section--scenic">
        <div class="custom-pagination custom-pagination--fixed">
            <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
                mobileTotalPages }} 页</div>
        </div>
    </div>

    <!-- 底部网格：洋酒酒庄（无关键词） -->
    <div v-if="subTab === '洋酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip" ref="gridRef" class="coming-grid">
        <div v-for="(item, i) in getPaginatedItems(displaySpiritWineries)" :key="'spirit-' + i" class="coming-card"
            @click="onOpenTour(item)" :data-tour-title="item.title">
            <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
            <div class="card-title" :title="item.title">{{ item.title }}</div>
            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
        </div>
    </div>
    <!-- <div v-if="subTab === '洋酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip && isLoading" class="loading-tip">
        加载中...
    </div> -->
    <div v-if="subTab === '洋酒酒庄' && !isLocalSearch && !(s?.trim()) && !showDayTrip && displaySpiritWineries.length > 0"
        class="pagination-section pagination-section--scenic">
        <div class="custom-pagination custom-pagination--fixed">
            <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
                mobileTotalPages }} 页</div>
        </div>
    </div>

    <!-- 底部网格：住宿（无关键词） -->
    <div v-if="subTab === '住宿' && !isLocalSearch && !(s?.trim()) && !showDayTrip" ref="gridRef" class="coming-grid">
        <div v-for="(item, i) in getPaginatedItems(hotels.items)" :key="'hotel-' + i" class="coming-card"
            @click="onOpenTour(item)" :data-tour-title="item.title">
            <img :src="getImageUrl(item.img)" :alt="item.title" class="w100">
            <div class="card-title" :title="item.title">{{ item.title }}</div>
            <div v-if="item.enTitle" class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
        </div>
    </div>
    <!-- <div v-if="subTab === '住宿' && !isLocalSearch && !(s?.trim()) && !showDayTrip && isLoading" class="loading-tip">
        加载中...
    </div> -->
    <div v-if="subTab === '住宿' && !isLocalSearch && !(s?.trim()) && !showDayTrip && hotels.items.length > 0"
        class="pagination-section pagination-section--scenic">
        <div class="custom-pagination custom-pagination--fixed">
            <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
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
                    <img :src="getActivityImage(activity.img)" alt="特别活动" class="activity-img">
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
                <div class="page-indicator fs16">第 <span class="page-num fowe7">{{ mobileScrollPage }}</span> / {{
                    mobileTotalPages }} 页</div>
            </div>
        </div>
        <div class="activities-footer">
            <div class="update-info"><i class="update-icon">🔄</i><span>信息每2小时更新一次</span></div>
            <div class="contact-info"><span>获取最新活动信息，请联系我们的专业顾问</span></div>
        </div>
    </div>


    <!-- </div> -->
</template>

<style lang="scss" scoped>
.search-container {
    width: 90%;
    margin: 20px auto 0;
    max-width: 600px;

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

.search-input {
    width: 100%;
}

.coming-grid {
    width: 90%;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 8px 0 40px;

    img {
        height: 240px;
    }
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

.card-title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 2px;
    color: #1f2937;
    -webkit-line-clamp: 1;
    line-clamp: 1;
}

.card-sub {
    font-size: 12px;
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
    font-size: 18px;
    margin: 45px;
}

.loading-tip {
    text-align: center;
    color: #3b82f6;
    font-size: 16px;
    padding: 16px 0 8px;
}

.pagination-section {
    display: flex;
    text-align: center;
    padding-bottom: 40px;
    justify-content: center;
    align-items: center;
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

.custom-pagination {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

/* 手机/平板端景点网格：页码固定在页面下方 */
// @media (max-width: 1024px) {
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

// }

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

.page-indicator {
    color: #6b7280;
    letter-spacing: 1px;
    line-height: 1.5;

    .page-num {
        font-size: 20px;
        color: #279486;
        line-height: 24px;
    }
}

/* 特别活动样式 */
.special-activities-section {
    width: 90%;
    padding: 20px 0;
}

.activities-header {
    text-align: center;
    margin-bottom: 30px;
}

.activities-title {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
    letter-spacing: 2px;
}

.activities-subtitle {
    font-size: 16px;
    color: #6b7280;
    margin: 0;
}

.activities-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 30px;
}

.activity-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.activity-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.activity-image {
    position: relative;
    height: 300px;
    overflow: hidden;
}

.activity-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.activity-card:hover .activity-img {
    transform: scale(1.05);
}

.activity-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
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

.activity-content {
    padding: 20px;

    .tags {
        display: flex;
        column-gap: 10px;

        .tags>div {
            width: 100px;
            height: 30px;
            line-height: 30px;
        }
    }
}

.activity-title {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 16px;
    letter-spacing: 1px;
}

.activity-info {
    margin-bottom: 16px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding: 4px 0;
}

.info-label {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
}

.info-value {
    font-size: 14px;
    color: #111827;
    font-weight: 600;
}

.info-value.high {
    color: #059669;
    font-weight: 700;
}

.info-value.excellent {
    color: #dc2626;
    font-weight: 700;
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
}

.update-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    color: #6b7280;
}

.update-icon {
    font-size: 16px;
}

.contact-info {
    font-size: 14px;
    color: #4b5563;
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1024px) {
    .coming-grid {
        grid-template-columns: repeat(4, 1fr);
    }

    .special-activities-section {
        width: 95%;
        padding: 15px 0;
    }

    .activities-title {
        font-size: 28px;
    }

    .activities-subtitle {
        font-size: 15px;
    }

    .activities-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
    }

    .activity-image {
        height: 180px;
    }

    .activity-content {
        padding: 16px;
    }

    .activity-title {
        font-size: 16px;
    }

    .info-label,
    .info-value {
        font-size: 13px;
    }

    .activity-description {
        font-size: 13px;
    }

    .weather-note {
        font-size: 12px;
    }
}

/* 移动端竖屏适配 */
@media (max-width: 768px) and (orientation: portrait) {
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
    }

    .activities-header {
        margin-bottom: 20px;
    }

    .activities-title {
        font-size: 24px;
        letter-spacing: 1px;
    }

    .activities-subtitle {
        font-size: 14px;
    }

    .activities-grid {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 20px;
    }

    .activity-image {
        height: 160px;
    }

    .activity-badge {
        top: 8px;
        right: 8px;
        padding: 4px 8px;
        font-size: 10px;
    }

    .activity-content {
        padding: 12px;
    }

    .activity-title {
        font-size: 15px;
        margin-bottom: 12px;
    }

    .activity-info {
        margin-bottom: 12px;
    }

    .info-item {
        margin-bottom: 6px;
        padding: 2px 0;
    }

    .info-label,
    .info-value {
        font-size: 12px;
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
    }

    .update-info {
        font-size: 12px;
        margin-bottom: 8px;
    }

    .contact-info {
        font-size: 12px;
    }
}

/* 移动端横屏适配 */
@media (max-width: 768px) and (orientation: landscape) {
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
    }

    .activities-header {
        margin-bottom: 15px;
    }

    .activities-title {
        font-size: 20px;
        letter-spacing: 1px;
    }

    .activities-subtitle {
        font-size: 13px;
    }

    .activities-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 20px;
    }

    .activity-image {
        height: 140px;
    }

    .activity-badge {
        top: 8px;
        right: 8px;
        padding: 4px 8px;
        font-size: 10px;
    }

    .activity-content {
        padding: 12px;
    }

    .activity-title {
        font-size: 14px;
        margin-bottom: 10px;
    }

    .activity-info {
        margin-bottom: 10px;
    }

    .info-item {
        margin-bottom: 4px;
        padding: 2px 0;
    }

    .info-label,
    .info-value {
        font-size: 11px;
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
    }

    .update-info {
        font-size: 12px;
        margin-bottom: 8px;
    }

    .contact-info {
        font-size: 12px;
    }
}

/* 超小屏幕 */
@media (max-width: 375px) {
    .activities-title {
        font-size: 20px;
    }

    .activities-subtitle {
        font-size: 13px;
    }

    .activities-grid {
        gap: 12px;
    }

    .activity-image {
        height: 140px;
    }

    .activity-badge {
        top: 6px;
        right: 6px;
        padding: 3px 6px;
        font-size: 9px;
    }

    .activity-content {
        padding: 10px;
    }

    .activity-title {
        font-size: 14px;
        margin-bottom: 10px;
    }

    .info-item {
        margin-bottom: 4px;
    }

    .info-label,
    .info-value {
        font-size: 11px;
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
    }

    .update-info {
        font-size: 11px;
    }

    .contact-info {
        font-size: 11px;
    }
}
</style>