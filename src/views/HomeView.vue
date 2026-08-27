<script setup>
import { ref, onMounted, onUnmounted, computed, watch, defineAsyncComponent } from 'vue'
import { ElMessage } from 'element-plus'
import ServicesNav from '@/components/ServicesNav.vue'
import navData from '@/data/split/nav.json'
import { useNavStore } from '@/stores/nav'
import { Search } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { buildDayTripTabQuery, resolveDayTripSubNavName } from '@/utils/subNavKey'
import { MAX_FAVORITES } from '@/utils/favoritesStore'
import { normalizeAppPath } from '@/utils/appPath'
import { openContentDetailWindow } from '@/utils/openContentDetail'
import { applyBreadcrumbJsonLd, applyJsonLd, applyPageSeo, removeFaqJsonLd, removeJsonLd, SITE_JSONLD_ID, SITE_NAME, toAbsoluteUrl } from '@/utils/pageSeo'

const PlaceListDialog = defineAsyncComponent(() => import('@/components/PlaceListDialog.vue'))

const navStore = useNavStore()
const route = useRoute()
const router = useRouter()

// 收藏消息处理
const handleFavoriteMessage = (event) => {
    const { type } = event.detail
    if (type === 'local_limit') {
        ElMessage.warning(`未登录状态下收藏数量有限，请注册或登录后同步更多收藏（上限 ${MAX_FAVORITES} 个）`)
    } else if (type === 'limit') {
        ElMessage.warning(`收藏数量已达上限（${MAX_FAVORITES}个），请先取消部分收藏后再添加`)
    } else if (type === 'exists') {
        ElMessage.info('该项目已在收藏列表中')
    }
}

// 当前选中的子导航（空字符串不要传给列表，否则会盖掉路由默认的「景点」）
const currentSubNavTab = ref(
    typeof route.query.subNavName === 'string' ? route.query.subNavName : ''
)

// 监听路由变化，当路由改变时自动设置默认子导航
// watch(() => route.path, (newPath) => {
//     // 找到当前路由对应的数据对象
//     const routeData = data.find(item => {
//         if (item.path) {
//             return newPath.includes(item.path)
//         }
//         return false
//     })

//     if (routeData && routeData.hasSubNav && routeData.subNav && routeData.subNav.length > 0) {
//         // 获取保存的子导航，如果没有则使用第一个
//         const savedSubNav = navStore.selectedSubNav
//         const defaultSubNav = routeData.subNav[0].subNavName

//         // 检查保存的子导航是否在当前对象的子导航列表中
//         const isValidSubNav = routeData.subNav.some(sub => sub.subNavName === savedSubNav)

//         if (isValidSubNav) {
//             // 如果保存的子导航有效，使用它
//             currentSubNavTab.value = savedSubNav
//         } else {
//             // 如果无效，使用默认的第一个子导航
//             currentSubNavTab.value = defaultSubNav
//             navStore.saveSelectedSubNav(defaultSubNav)
//         }
//     }
// }, { immediate: true })

// 从data.json中获取有子导航的对象
const itemsWithSubNav = computed(() => {
    return navData.filter(item => item.hasSubNav === true)
})

// 获取当前路由对应的数据对象
const currentRouteData = computed(() => {
    const currentPath = normalizeAppPath(route.path) || route.path
    if (currentPath === '/info' || currentPath.startsWith('/info/')) {
        return undefined
    }
    return navData.find(item => {
        if (item.path) {
            return currentPath.includes(item.path)
        }
        return false
    })
})
// 获取当前对象的子导航
const currentSubNav = computed(() => {
    if (currentRouteData.value && currentRouteData.value.subNav) {
        return currentRouteData.value.subNav.map(sub => sub.subNavName)
    }
    return []
})

// 显示子导航的条件
const showSubNav = computed(() => {
    return currentRouteData.value && currentRouteData.value.hasSubNav && currentSubNavTab.value
})

const isContentDetailPage = computed(() => {
    const currentPath = normalizeAppPath(route.path) || route.path
    return currentPath === '/info' || currentPath.startsWith('/info/')
})

const listPageHeading = computed(() => {
    const path = normalizeAppPath(route.path) || route.path
    if (path === '/trips/routes') return '一日游 / 多日游'
    if (path === '/trips/freeinfo') {
        const sub = String(route.query.subNavName || '景点').trim() || '景点'
        return `自助游参考信息 · ${sub}`
    }
    return ''
})

const hiddenFreeInfoSubNav = new Set(['葡萄酒酒庄', '洋酒酒庄'])
const visibleSubNavItems = computed(() => {
    const items = currentRouteData.value?.subNav || []
    if (currentRouteData.value?.tagName === '自助游/自驾游免费参考信息') {
        return items.filter(item => !hiddenFreeInfoSubNav.has(item.subNavName))
    }
    return items
})

// 当前显示的服务配置
const currentServiceConfig = ref(null)

function onClickSubTab(tab) {
    // 验证点击的tab是否在当前对象的子导航列表中
    if (currentRouteData.value && currentRouteData.value.subNav) {
        const isValidTab = currentRouteData.value.subNav.some(sub => sub.subNavName === tab)
        if (isValidTab) {
            // 根据当前路径决定使用哪个query参数
            const currentPath = route.path
            if (currentPath.includes('/trips/routes')) {
                // 一日游/多日游页面使用 dayTripTab 数字键（如 1、16）
                router.push({
                    path: '/trips/routes',
                    query: { dayTripTab: buildDayTripTabQuery(tab) }
                })
            } else if (currentPath.includes('/trips/freeinfo')) {
                // 免费信息页面使用subNavName参数
                router.push({
                    path: '/trips/freeinfo',
                    query: { subNavName: tab }
                })
            }

            currentSubNavTab.value = tab
            // 清空搜索框和搜索关键词
            subSearch.value = ''
            committedKeyword.value = ''
            // 保存用户选择的子导航
            navStore.saveSelectedSubNav(tab)
        }
    }
}

// 监听currentRouteData变化，确保子导航同步
watch(currentRouteData, (newData) => {
    if (newData && newData.hasSubNav && newData.subNav && newData.subNav.length > 0) {
        const savedSubNav = navStore.selectedSubNav
        const defaultSubNav = newData.subNav[0].subNavName

        // 检查保存的子导航是否在当前对象的子导航列表中
        const isValidSubNav = newData.subNav.some(sub => sub.subNavName === savedSubNav)

        if (isValidSubNav) {
            currentSubNavTab.value = savedSubNav
        } else {
            currentSubNavTab.value = defaultSubNav
            navStore.saveSelectedSubNav(defaultSubNav)
        }
    }
}, { immediate: true })

// 搜索功能
function doSubSearch() {
    const kw = (subSearch.value || '').trim()
    if (!kw) {
        // 清空搜索时重置
        committedKeyword.value = ''
        return
    }
    committedKeyword.value = kw
}

const isPlaceListVisible = ref(false)
const listPlaceName = ref('')
const listItemType = ref('餐厅')
const listItems = ref([])

// 轮播图切换事件处理
function onCarouselChange(index) {
    currentSlideIndex.value = index
}
// 轮播图图片源：PC 使用 newbn*.jpg；手机/平板仅使用 newbn1.jpg
// const desktopModules = import.meta.glob('@/assets/img/newbn*.{jpg,JPG,jpeg,JPEG}', { eager: true });
const desktopModules = import.meta.glob('@/assets/img/footer*.{jpg,JPG,jpeg,JPEG}', { eager: true });
// const desktopModules = import.meta.glob('@/assets/img/newbn*.jpg', { eager: true });
const desktopSlides = Object.entries(desktopModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, mod]) => (typeof mod === 'string' ? mod : mod.default))
    .filter(Boolean);
// const desktopSlides = Object.values(desktopModules).map((mod) => (typeof mod === 'string' ? mod : mod.default));

// 移动端同样展示 4 张轮播图
const mobileSlides = desktopSlides

// 服务配置已移至ServiceShowcase组件内部处理

// 当前显示的服务配置
const isDialogVisible = ref(false)

// 子导航（仅用于“自助游/自驾游免费信息”）
// - 需求：在景点列表上方显示横向导航（景点/餐厅/住宿/特别活动）和搜索框，默认“景点”
// - 点击切换：
//   1) 选“景点”：下方维持原有景点网格
//   2) 选“餐厅/住宿”：下方卡片标题改为对应文案（不改子标题，作为示例）
//   3) 选“特别活动”：显示特别活动列表，包含活动卡片和详细信息
const subSearch = ref('')
const committedKeyword = ref('')

function syncSearchFromRoute() {
    const q = route.query.s
    if (q == null || !String(q).trim()) return
    // 从全站搜索结果打开：s 仅用于 TripsGrid 搜索框展示，不在此做全页过滤
    if (route.query.dialogItemId) {
        committedKeyword.value = ''
        return
    }
    committedKeyword.value = String(q).trim()
}

function decodeDialogItemId(raw) {
    if (raw == null || raw === '') return ''
    try {
        return decodeURIComponent(String(raw))
    } catch {
        return String(raw)
    }
}

function findTourCardByDialogKey(dialogKey) {
    if (!dialogKey || typeof document === 'undefined') return null
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
        const el = document.querySelector(`[data-tour-title="${CSS.escape(dialogKey)}"]`)
        if (el) return el
    }
    const cards = document.querySelectorAll('[data-tour-title]')
    for (const node of cards) {
        if (node.getAttribute('data-tour-title') === dialogKey) return node
    }
    return null
}

function runTourDialogLocate() {
    const dialogItemId = route.query.dialogItemId
    const dialogType = route.query.dialogType
    if (!dialogItemId || dialogType !== 'tour') return

    const decodedId = decodeDialogItemId(dialogItemId)
    if (!decodedId) return

    let attempts = 0
    const maxAttempts = 50
    const checkInterval = 100

    const findAndHighlightElement = () => {
        attempts++
        const targetElement = findTourCardByDialogKey(decodedId)

        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            setTimeout(() => {
                targetElement.style.borderColor = '#33b1a3'
                targetElement.style.boxShadow = '0 0 0 2px rgba(51, 177, 163, 0.22)'
                targetElement.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease'
                setTimeout(() => {
                    targetElement.style.transition = 'border-color 0.5s ease, box-shadow 0.5s ease'
                    targetElement.style.borderColor = 'transparent'
                    targetElement.style.boxShadow = 'none'
                    setTimeout(() => {
                        targetElement.click()
                    }, 500)
                }, 1000)
            }, 500)
        } else if (attempts < maxAttempts) {
            setTimeout(findAndHighlightElement, checkInterval)
        }
    }

    setTimeout(findAndHighlightElement, 500)
}


// function onClickSubTab(tab) {
//     subTab.value = tab

//     // 清空搜索框和搜索关键词
//     subSearch.value = ''
//     committedKeyword.value = ''

// }

// 清空搜索功能
function clearSearch() {
    // subSearch.value = ''
    // committedKeyword.value = ''
}

// 地点分组网格改由 TripsGrid 内部数据驱动

function generateMockItems() {
    let baseImg, titlePrefix, enTitlePrefix
    switch (listItemType.value) {
        case '餐厅':
            baseImg = new URL('@/assets/img/footer2.jpg', import.meta.url).href
            titlePrefix = '餐厅名'
            enTitlePrefix = 'Restaurant'
            break
        case '住宿':
            baseImg = new URL('@/assets/img/footer3.jpg', import.meta.url).href
            titlePrefix = '住宿名'
            enTitlePrefix = 'Hotel'
            break
        case '景点':
            baseImg = new URL('@/assets/img/footer1.jpg', import.meta.url).href
            titlePrefix = '景点名'
            enTitlePrefix = 'Attraction'
            break
        default:
            baseImg = new URL('@/assets/img/footer1.jpg', import.meta.url).href
            titlePrefix = '地点名'
            enTitlePrefix = 'Place'
    }

    const items = []
    for (let i = 0; i < 24; i++) {
        const label = String.fromCharCode(65 + (i % 26))
        const title = `${titlePrefix}${label}`
        const enTitle = `${enTitlePrefix}${label}`
        items.push({ title, img: baseImg, enTitle })
    }
    listItems.value = items
}

function openPlaceList({ placeName, itemType, items = [] }) {
    listPlaceName.value = placeName
    listItemType.value = itemType
    listItems.value = Array.isArray(items) ? items : []

    isPlaceListVisible.value = true
}

function onSelectPlaceItem(item) {
    if (!item) return
    openContentDetailWindow(router, {
        ...item,
        tripType: item.tripType || item.itemType || (listItemType.value === '餐厅' ? '餐厅信息' : '住宿信息'),
        itemType: item.itemType || item.tripType || (listItemType.value === '餐厅' ? '餐厅信息' : '住宿信息'),
    })
}

// 标签点击逻辑已移至ServicesNav组件内部实现

// 弹窗控制
// 弹窗相关方法
function openTourDialog(item) {
    openContentDetailWindow(router, item)
}

function applyListPageSeo() {
    const path = normalizeAppPath(route.path) || route.path
    if (path === '/info' || path.startsWith('/info/') || path.startsWith('/service/')) {
        return
    }
    if (path === '/trips/routes') {
        applyPageSeo({
            title: '一日游 / 多日游',
            description: '塔斯马尼亚一日游与多日游行程，可按天数查看并咨询出发地、时长和包含项目。由 TASMANIA TRIPS PTY LTD 提供，服务区域为塔斯马尼亚。',
        })
        applyBreadcrumbJsonLd([
            { name: '首页', path: '/trips/freeinfo' },
            { name: '一日游 / 多日游', path: '/trips/routes' },
        ])
        return
    }
    if (path === '/trips/freeinfo') {
        const sub = String(route.query.subNavName || '景点').trim() || '景点'
        applyPageSeo({
            title: `自助游参考信息 · ${sub}`,
            description: `塔斯马尼亚${sub}等公开资料整理，供自助游和自驾游规划参考。本页不是售票或订房系统。`,
        })
        removeFaqJsonLd()
        applyBreadcrumbJsonLd([
            { name: '首页', path: '/trips/freeinfo' },
            { name: `自助游参考信息 · ${sub}`, path: '/trips/freeinfo' },
        ])
        return
    }
    if (path === '/search') {
        applyPageSeo({
            title: '搜索',
            description: '搜索 TasTrips.Online 行程、景点、餐厅、住宿等参考信息。',
        })
        removeFaqJsonLd()
        applyBreadcrumbJsonLd([
            { name: '首页', path: '/trips/freeinfo' },
            { name: '搜索', path: '/search' },
        ])
        return
    }
    if (path === '/favorites') {
        applyPageSeo({
            title: '我的收藏',
            description: '查看已收藏的行程与参考信息。',
        })
        removeFaqJsonLd()
        applyBreadcrumbJsonLd([
            { name: '首页', path: '/trips/freeinfo' },
            { name: '我的收藏', path: '/favorites' },
        ])
    }
}

// 响应式选择轮播图（<=1024 为手机/平板）与高度
const slidesRef = ref([])
const carouselHeight = ref('800px')
const isMobileOrTablet = ref(typeof window !== 'undefined' ? window.innerWidth <= 1024 : false)
const selectSlides = () => {
    const isMobile = isMobileOrTablet.value
    slidesRef.value = (isMobile ? mobileSlides : desktopSlides).filter(Boolean)
    if (!isMobile) {
        carouselHeight.value = '800px'
    } else {
        // 手机/平板高度适配
        const w = typeof window !== 'undefined' ? window.innerWidth : 1024
        carouselHeight.value = w <= 768 ? '420px' : '600px'
    }
}
const handleResizeForSlides = () => {
    if (typeof window === 'undefined') return
    const next = window.innerWidth <= 1024
    if (next !== isMobileOrTablet.value) {
        isMobileOrTablet.value = next
        selectSlides()
    } else {
        // 同一类别也需要根据宽度微调高度
        selectSlides()
    }
}

// 轮播图引用与触摸滑动支持（手机/平板）
const carouselRef = ref(null)
const currentSlideIndex = ref(0)
let touchStartX = 0
let touchStartY = 0
let touchDeltaX = 0
let touchDeltaY = 0

function onTouchStart(e) {
    const t = e.touches && e.touches[0]
    if (!t) return
    touchStartX = t.clientX
    touchStartY = t.clientY
    touchDeltaX = 0
    touchDeltaY = 0
}

function onTouchMove(e) {
    const t = e.touches && e.touches[0]
    if (!t) return
    touchDeltaX = t.clientX - touchStartX
    touchDeltaY = t.clientY - touchStartY
}

function onTouchEnd() {
    const horizontal = Math.abs(touchDeltaX) > Math.abs(touchDeltaY)
    const distance = Math.abs(touchDeltaX)
    const MIN_SWIPE = 50
    if (horizontal && distance >= MIN_SWIPE) {
        if (touchDeltaX < 0) {
            // 左滑，下一张
            carouselRef.value && carouselRef.value.next && carouselRef.value.next()
        } else {
            // 右滑，上一张
            carouselRef.value && carouselRef.value.prev && carouselRef.value.prev()
        }
    }
}

// 初始化当前子导航（URL query 优先于本地缓存）
function initializeSubNav() {
    if (!currentRouteData.value?.hasSubNav || !currentRouteData.value.subNav?.length) return

    const subNavList = currentRouteData.value.subNav

    if (route.query.subNavName) {
        const fromQuery = String(route.query.subNavName)
        if (subNavList.some(sub => sub.subNavName === fromQuery)) {
            currentSubNavTab.value = fromQuery
            navStore.saveSelectedSubNav(fromQuery)
            return
        }
    }

    if (route.query.dayTripTab) {
        const resolved = resolveDayTripSubNavName(route.query.dayTripTab, subNavList)
        if (subNavList.some(sub => sub.subNavName === resolved)) {
            currentSubNavTab.value = resolved
            navStore.saveSelectedSubNav(resolved)
            return
        }
    }

    const savedSubNav = navStore.selectedSubNav
    const defaultSubNav = subNavList[0].subNavName
    const isValidSubNav = subNavList.some(sub => sub.subNavName === savedSubNav)

    if (isValidSubNav) {
        currentSubNavTab.value = savedSubNav
    } else {
        currentSubNavTab.value = defaultSubNav
        navStore.saveSelectedSubNav(defaultSubNav)
    }
}


// 监听路由query参数变化
watch(() => route.query, (newQuery) => {
    // 如果query中有subNavName参数，优先使用它
    if (newQuery.subNavName) {
        // 检查这个子导航是否在当前路由的子导航列表中
        if (currentRouteData.value && currentRouteData.value.subNav) {
            const isValidSubNav = currentRouteData.value.subNav.some(sub => sub.subNavName === newQuery.subNavName);
            if (isValidSubNav) {
                currentSubNavTab.value = newQuery.subNavName;
                navStore.saveSelectedSubNav(newQuery.subNavName);
                subSearch.value = '';
                if (newQuery.dialogItemId) {
                    committedKeyword.value = '';
                } else if (newQuery.s != null && String(newQuery.s).trim()) {
                    committedKeyword.value = String(newQuery.s).trim();
                } else {
                    committedKeyword.value = '';
                }
                return;
            }
        }
    }

    // 如果query中有dayTripTab参数（一日游/多日游页面），使用它
    if (newQuery.dayTripTab) {
        if (currentRouteData.value && currentRouteData.value.subNav) {
            const resolved = resolveDayTripSubNavName(newQuery.dayTripTab, currentRouteData.value.subNav)
            const isValidSubNav = currentRouteData.value.subNav.some(sub => sub.subNavName === resolved)
            if (isValidSubNav) {
                currentSubNavTab.value = resolved
                navStore.saveSelectedSubNav(resolved)
                subSearch.value = '';
                if (newQuery.dialogItemId) {
                    committedKeyword.value = '';
                } else if (newQuery.s != null && String(newQuery.s).trim()) {
                    committedKeyword.value = String(newQuery.s).trim();
                } else {
                    committedKeyword.value = '';
                }
                return;
            }
        }
    }

    // 如果没有query参数（比如点击网站首页清空了query），使用默认逻辑
    if (currentRouteData.value && currentRouteData.value.hasSubNav && currentRouteData.value.subNav && currentRouteData.value.subNav.length > 0) {
        const savedSubNav = navStore.selectedSubNav;
        const defaultSubNav = currentRouteData.value.subNav[0].subNavName;

        // 当没有query参数时，优先使用store中保存的子导航，如果无效则使用默认的
        const isValidSubNav = savedSubNav && currentRouteData.value.subNav.some(sub => sub.subNavName === savedSubNav);

        if (isValidSubNav) {
            currentSubNavTab.value = savedSubNav;
        } else {
            currentSubNavTab.value = defaultSubNav;
            navStore.saveSelectedSubNav(defaultSubNav);
        }
    }
}, { immediate: true });

watch(
    () => route.query.s,
    () => {
        syncSearchFromRoute()
    },
    { immediate: true }
)

watch(
    () => [route.query.dialogItemId, route.query.dialogType, route.path],
    () => {
        runTourDialogLocate()
    }
)

watch(
    () => [route.path, route.query.subNavName, route.query.dayTripTab],
    () => {
        applyListPageSeo()
    },
)

onMounted(() => {
    selectSlides()
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResizeForSlides)
        window.addEventListener('favoriteMessage', handleFavoriteMessage)
    }
    initializeSubNav()
    syncSearchFromRoute()
    runTourDialogLocate()
    applyListPageSeo()
    applyJsonLd(SITE_JSONLD_ID, {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: toAbsoluteUrl('/trips/freeinfo'),
        potentialAction: {
            '@type': 'SearchAction',
            target: toAbsoluteUrl('/search?q={search_term_string}'),
            'query-input': 'required name=search_term_string',
        },
    })
})

onUnmounted(() => {
    removeJsonLd(SITE_JSONLD_ID)
})
</script>

<template>
    <el-main>
        <!-- 轮播图 -->
        <!-- <div class="carousel-container" @touchstart.passive="onTouchStart" @touchmove.passive="onTouchMove"
            @touchend="onTouchEnd">
            <div class="carousel-background">
                <img :src="slidesRef[currentSlideIndex]" alt="background" class="background-img"
                    :key="currentSlideIndex" />
            </div>
            <div class="glass-overlay"></div>

            <el-carousel ref="carouselRef" :height="carouselHeight" :autoplay="false" arrow="always" :interval="3000"
                :loop="true" indicator-position="none" class="carousel" @change="onCarouselChange">
                <el-carousel-item v-for="(src, idx) in slidesRef" :key="idx">
                    <img :src="src" alt="slide" class="slide-img" />
                    <div class="carousel-text">
                        <h1>到世界的尽头<br>与自然与人文相遇<br>TASMANIA</h1>
                    </div>
                </el-carousel-item>
            </el-carousel>
        </div> -->

        <h1 v-if="listPageHeading" class="page-seo-title">{{ listPageHeading }}</h1>
        <ServicesNav v-if="!isContentDetailPage" />

        <!-- 内容区域 - 使用router-view来渲染子路由 -->
        <div class="content-box" :class="{ 'content-box--detail': isContentDetailPage }">
            <!-- 动态子导航（根据data.json中hasSubNav为true的对象渲染） -->
            <div v-if="showSubNav" class="free-trip-subnav center">
                <!-- 横向Tab列表 -->
                <ul class="free-subnav-tabs days-tab-grid">
                    <li v-for="subItem in visibleSubNavItems" :key="subItem.subNavName" class="free-subnav-tab w100"
                        :class="{ active: currentSubNavTab === subItem.subNavName, disabled: subItem.isShow === false }"
                        @click="subItem.isShow !== false && onClickSubTab(subItem.subNavName)">
                        {{ subItem.subNavName }}
                    </li>
                </ul>
            </div>
            <router-view @open-tour-dialog="openTourDialog" @open-place-list="openPlaceList"
                :sub-tab="currentSubNavTab || undefined" :s="committedKeyword" />
        </div>

        <PlaceListDialog v-if="isPlaceListVisible" v-model="isPlaceListVisible" :place-name="listPlaceName"
            :item-type="listItemType" :items="listItems" @select="onSelectPlaceItem" />
    </el-main>
</template>

<style lang="scss" scoped>
.el-main {
    // background-color: pink;
    color: #333;
    padding: 0;
    overflow: visible;
    // height: auto;

    .carousel-container {
        position: relative;
        width: 100%;
        overflow: hidden;
    }

    .carousel-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        overflow: hidden;

        .background-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: blur(8px);
            transform: scale(1.1);
        }
    }

    .glass-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 2;
        pointer-events: none;
    }

    .carousel {
        position: relative;
        z-index: 3;

        .slide-img {
            display: block;
            width: 100%;
            height: 798px;
            //object-fit: cover;
            object-fit: contain;
            z-index: 100;
        }

        :deep(.el-carousel__item) {
            position: absolute;
            inset: 0;
            height: 100%;
            width: 100%;
        }

        :deep(.el-carousel__arrow--left) {
            left: 0
        }

        :deep(.el-carousel__arrow--right) {
            right: 0
        }

        .carousel-text {
            position: absolute;
            inset: 0;
            z-index: 200;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: #FFF;
            pointer-events: none;

            h1 {
                font-size: 46px;
                font-weight: 600;
                line-height: 1.35;
                margin: 0;
                color: #FFFEF2;
                text-align: center;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                padding: 16px 32px;
                border-radius: 8px;
                letter-spacing: 18px;
            }
        }

        :deep(.el-carousel__arrow) {
            color: #fff;
            width: 120px;
            // height: 56px;
            height: 100%;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
        }

        :deep(.el-carousel__arrow i),
        :deep(.el-carousel__arrow .el-icon),
        :deep(.el-carousel__arrow svg) {
            width: 40px;
            height: 40px;
            // font-size:28px;
            font-size: 38px;
            font-weight: 900;
        }

    }

    // .search-fixed相关样式已移至ServicesNav.vue组件中

    .content-box {
        height: auto;
        color: #101010;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 20px;
        // letter-spacing: 15px;
        margin-top: 90px;

        &.content-box--detail {
            margin-top: 24px;
        }


        .service-title {
            align-self: flex-start;
            margin-left: 20px;
            margin-top: 0;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0;
            /* 去除字距 */
            color: #111827;
        }


        /* 自助游/自驾游免费信息 子导航容器 */
        .free-trip-subnav {
            width: 90%;
            /* 与下面网格等宽 */
            // display: flex;
            // align-items: center;
            // justify-content: space-between;
            // gap: 16px;
            padding: 0 20px;
        }

        /* 横向Tab列表 */
        .free-subnav-tabs {
            display: flex;
            justify-content: space-between;
            // display: grid;
            // grid-template-columns: repeat(4, 1fr);
            // list-style: none;
            margin: 0;
            padding: 0;
            gap: 12px;
        }

        .free-subnav-tab {
            cursor: pointer;
            padding: 10px 16px;
            border-radius: 8px;
            background: #fff;
            color: #33b1a3;
            border: 1px solid #e5e7eb;
            transition: all .2s ease;
            white-space: nowrap;
            user-select: none;
            font-size: 16px;
        }

        .free-subnav-tab.disabled {
            background: #f3f4f6;
            color: #9ca3af;
            border-color: #e5e7eb;
            cursor: not-allowed;
            opacity: 0.7;
        }

        .free-subnav-tab.active {
            background: linear-gradient(180deg, #33b1a3 0%, #279486 100%);
            color: #fff;
            border-color: transparent;
            box-shadow: 0 6px 16px rgba(61, 199, 190, 0.26);
        }

        .free-subnav-search-container {
            display: flex;
            justify-content: right;
            margin-top: 25px;

            /* 子搜索框：与Tab在同一行，右对齐 */
            .free-subnav-search {
                flex: 0 0 320px;
                margin-right: 15px;
            }

            .free-subnav-search-btn {
                // flex: 0 0 auto;
                height: 40px;
            }
        }

        .days-tab-grid {
            display: grid;
            // 子导航项数量会动态变化，使用 auto-fit 避免右侧留白
            // grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            grid-template-columns: repeat(6, 1fr);
        }

        .section-heading {
            margin: 10px 0 8px 4px;
            // font-size: 18px;
            font-size: 26px;
            font-weight: 700;
            color: #111827;
        }




    }
}

/* 响应式适配：平板（768px-1024px） */
@media (min-width: 769px) and (max-width: 1024px) {
    .el-container {
        .el-main {
            .carousel-background {
                .background-img {
                    transition: all 0.8s ease-in-out;
                    opacity: 1;
                }
            }

            .carousel {
                .slide-img {
                    height: 598px;
                }

                :deep(.el-carousel__arrow) {
                    display: flex !important;
                    width: 56px;
                    //height: 56px;
                    height: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    // background: rgba(0, 0, 0, 0.25);
                    background: transparent;
                    // border-radius: 50%;
                    z-index: 210;
                }

                .carousel-text {
                    padding: 0 20px;

                    h1 {
                        font-size: 34px;
                        line-height: 1.3;
                        letter-spacing: 12px;
                    }
                }
            }

            .content-box {

                // height: 240px;
                .free-trip-subnav {
                    width: 95%;
                    flex: 10px;
                    // padding: 0;

                    .free-subnav-search-btn {
                        flex: 0;
                    }
                }

                .coming-grid {
                    grid-template-columns: repeat(2, 1fr)
                }

                /* 特别活动平板端适配 */
                .special-activities-section {
                    width: 95%;
                    padding: 15px 0;
                }

                .activities-title {
                    font-size: 26px;
                }

                .activities-subtitle {
                    font-size: 13px;
                }

                .activities-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                .activity-image {
                    height: 178px;
                }

                .activity-content {
                    padding: 16px;
                }

                .activity-title {
                    font-size: 14px;
                }

                .info-label,
                .info-value {
                    font-size: 11px;
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
}

@media (max-width: 768px) {
    .el-container {
        .el-main {
            .carousel-container {
                height: auto;
                /* 移动端使用自适应高度 */
                overflow: visible;
                /* 允许搜索框溢出显示 */
            }

            .carousel-background {
                height: 420px;
                /* 与轮播图高度一致 */

                .background-img {
                    transition: all 0.8s ease-in-out;
                    opacity: 1;
                }
            }

            .glass-overlay {
                height: 420px;
                /* 与轮播图高度一致 */
            }

            // 轮播图
            .carousel {
                .slide-img {
                    height: 420px;
                }

                :deep(.el-carousel__arrow) {
                    display: flex !important;
                    width: 60px;
                    height: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    // background: rgba(0, 0, 0, 0.25);
                    background: transparent;
                    // border-radius: 50%;
                    z-index: 210;
                }

                .carousel-text {
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 12px;

                    h1 {
                        font-size: 26px;
                        line-height: 1.3;
                        letter-spacing: 6px;
                        text-align: center;
                    }
                }
            }

            // 渲染内容
            .content-box {
                height: auto;
                margin-top: 0;
                // padding-top: 20px;
                /* 移动端减少间距 */

                .free-trip-subnav {
                    flex-direction: column;
                    padding: 0;

                    .free-subnav-search,
                    .free-subnav-search-btn {
                        width: 100%
                    }

                    .free-subnav-search {
                        flex: 0
                    }

                    .free-subnav-tabs {
                        display: grid;
                        width: 100%;
                        gap: 10px;
                        grid-template-columns: repeat(1, 1fr);
                        margin-top: 10px;
                    }

                    .free-subnav-search-container {
                        display: grid;
                        grid-template-columns: repeat(1, 1fr);
                        gap: 15px;
                    }
                }

                .coming-grid {
                    grid-template-columns: repeat(1, 1fr);
                    gap: 20px;
                }

                /* 特别活动移动端适配 */
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
        }
    }
}

/* 超小屏幕设备适配（iPhone 4、iPhone 5、iPhone SE等，<=375px） */
@media (max-width: 375px) {
    .el-container {
        .el-main {
            .carousel {
                .slide-img {
                    // height: 360px;
                    height: 420px;
                }

                .carousel-text {
                    h1 {
                        font-size: 22px;
                        line-height: 1.2;
                        letter-spacing: 4px;
                        padding: 12px 20px;
                    }
                }
            }

            // .search-fixed {
            //     padding: 6px 8px 20px;
            //     margin-bottom: 20px;

            //     .search-card {
            //         max-width: 98vw;
            //     }

            //     .search-tags {
            //         grid-template-columns: repeat(2, 1fr);
            //     }

            //     .tag-pill {
            //         padding: 4px 8px;
            //         font-size: 11px;
            //         line-height: 1.2;
            //     }
            // }

            .content-box {
                height: auto;
                // margin-top: 30px;
                padding-top: 20px;
                gap: 16px;

                // .coming-soon {
                //     font-size: 18px;

                //     // letter-spacing: 10px;
                //     .free-trip-subnav {
                //         padding: 0 10px;
                //         gap: 8px;
                //     }

                //     .free-subnav-tab {
                //         padding: 8px 12px;
                //         font-size: 12px;
                //     }
                // }
            }
        }
    }
}

/* 极超小屏幕设备适配（iPhone 4等，<=320px） */
@media (max-width: 320px) {
    .el-container {
        .el-main {
            .carousel {
                .slide-img {
                    // height: 320px;
                    height: 420px;
                }

                .carousel-text {
                    h1 {
                        font-size: 18px;
                        line-height: 1.1;
                        letter-spacing: 2px;
                        padding: 8px 12px;
                    }
                }
            }

            // .search-fixed {
            //     padding: 4px 6px 20px;
            //     margin-bottom: 20px;

            //     .search-card {
            //         max-width: 99vw;
            //     }

            //     .search-tags {
            //         grid-template-columns: repeat(2, 1fr);
            //     }

            //     .tag-pill {
            //         padding: 3px 6px;
            //         font-size: 10px;
            //         line-height: 1.1;
            //     }
            // }

            .content-box {
                height: auto;
                // margin-top: 30px;
                padding-top: 20px;
                gap: 12px;

                .free-subnav-tabs {
                    gap: 0
                }

                // .coming-soon {
                //     font-size: 16px;
                //     letter-spacing: 8px;

                //     .free-subnav-tab {
                //         padding: 6px 10px;
                //         font-size: 11px;
                //     }

                //     .free-subnav-search-btn {
                //         height: 36px;
                //         font-size: 12px;
                //     }
                // }

                /* 特别活动超小屏幕适配 */
                .special-activities-section {
                    width: 98%;
                    padding: 8px 0;
                }

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
        }
    }
}

:deep(.no-result-dialog) {
    .el-dialog__body {
        padding-top: 6px;
    }
}


.page-seo-title {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.no-result-body {
    color: #374151;
    line-height: 1.8;

    .kw {
        color: #2563eb;
        font-weight: 700;
    }
}
</style>