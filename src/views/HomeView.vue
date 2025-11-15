<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import TourDialog from '@/components/TourDialog.vue'
import PlaceListDialog from '@/components/PlaceListDialog.vue'
import TermsandConditionsDialog from '@/components/TermsandConditionsDialog.vue'
import ServicesNav from '@/components/ServicesNav.vue'
import data from '@/data/data.json'
import { useNavStore } from '@/stores/nav'
import { Search } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'

const navStore = useNavStore()
const route = useRoute()
const router = useRouter()


// 当前选中的子导航
const currentSubNavTab = ref('')

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
    return data.filter(item => item.hasSubNav === true)
})

// 获取当前路由对应的数据对象
const currentRouteData = computed(() => {
    const currentPath = route.path
    return data.find(item => {
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

// 当前显示的服务配置
const currentServiceConfig = ref(null)

function onClickSubTab(tab) {
    // 验证点击的tab是否在当前对象的子导航列表中
    if (currentRouteData.value && currentRouteData.value.subNav) {
        const isValidTab = currentRouteData.value.subNav.some(sub => sub.subNavName === tab)
        if (isValidTab) {
            // 根据当前路径决定使用哪个query参数
            const currentPath = route.path
            if (currentPath.includes('/DemoForTTO/trips/oneday')) {
                // 一日游页面使用dayTripTab参数
                router.push({
                    path: '/DemoForTTO/trips/oneday',
                    query: { dayTripTab: tab }
                })
            } else {
                // 其他页面（如免费信息页面）使用subNavName参数
                // 为所有子导航项（包括餐厅、住宿）都添加query参数
                router.push({
                    path: '/DemoForTTO/trips/freeinfo',
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

// 只保留弹窗相关的状态
const isTourDialogVisible = ref(false)
const dialogTitle = ref('大堡礁单日游')
const dialogBanner = ref(new URL('@/assets/img/footer2.jpg', import.meta.url).href)
const dialogTripData = ref({})
const dialogTripType = ref('一日游')

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
//   3) 选“特别活动”：不显示网格，仅显示“待修改”占位
const subSearch = ref('')
const committedKeyword = ref('')


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

function openPlaceList({ placeName, itemType }) {
    listPlaceName.value = placeName
    listItemType.value = itemType

    // 从data.json中获取数据
    const freeInfo = data.find(item => item.tagName === '自助游/自驾游免费信息')
    if (freeInfo && freeInfo.subNav) {
        const subNav = freeInfo.subNav.find(sub => sub.subNavName === itemType)
        if (subNav && subNav.items) {
            if (itemType === '餐厅' || itemType === '住宿') {
                const placeItem = subNav.items.find(item => item.place === placeName)
                if (placeItem && placeItem.list) {
                    listItems.value = placeItem.list
                } else {
                    const allItems = []
                    subNav.items.forEach(item => {
                        if (item.list) {
                            allItems.push(...item.list)
                        }
                    })
                    listItems.value = allItems
                }
            } else {
                listItems.value = subNav.items
            }
        } else {
            generateMockItems()
        }
    } else {
        generateMockItems()
    }

    isPlaceListVisible.value = true
}

function onSelectPlaceItem(item) {
    dialogTitle.value = `${listPlaceName.value} · ${item.title}`
    dialogBanner.value = item.img || (listItemType.value === '餐厅'
        ? new URL('@/assets/img/footer2.jpg', import.meta.url).href
        : new URL('@/assets/img/footer3.jpg', import.meta.url).href)
    dialogTripData.value = item.tripData || {}
    dialogTripType.value = listItemType.value === '餐厅' ? '餐厅信息' : '住宿信息'
    isTourDialogVisible.value = true
}

// 标签点击逻辑已移至ServicesNav组件内部实现

// 弹窗控制
// 弹窗相关方法
function openTourDialog(item) {
    dialogTitle.value = item?.title || '大堡礁单日游'
    dialogBanner.value = item?.banner || new URL('@/assets/img/footer2.jpg', import.meta.url).href
    dialogTripData.value = item?.tripData || {}
    dialogTripType.value = item?.tripType || '一日游'
    isTourDialogVisible.value = true
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

// 初始化当前子导航
function initializeSubNav() {
    if (currentRouteData.value && currentRouteData.value.hasSubNav && currentRouteData.value.subNav && currentRouteData.value.subNav.length > 0) {
        const savedSubNav = navStore.selectedSubNav
        const defaultSubNav = currentRouteData.value.subNav[0].subNavName

        // 检查保存的子导航是否在当前对象的子导航列表中
        const isValidSubNav = currentRouteData.value.subNav.some(sub => sub.subNavName === savedSubNav)

        if (isValidSubNav) {
            currentSubNavTab.value = savedSubNav
        } else {
            currentSubNavTab.value = defaultSubNav
            navStore.saveSelectedSubNav(defaultSubNav)
        }
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
                // 清空搜索
                subSearch.value = '';
                committedKeyword.value = '';
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
// 组件挂载时执行
onMounted(() => {
    selectSlides()
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResizeForSlides)
    }
    initializeSubNav()
})

onUnmounted(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResizeForSlides)
    }
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

        <!-- 固定搜索框 -->
        <!-- <ServicesNav @clear-search="clearSearch" /> -->
        <ServicesNav />

        <!-- 内容区域 - 使用router-view来渲染子路由 -->
        <div class="content-box">
            <!-- 动态子导航（根据data.json中hasSubNav为true的对象渲染） -->
            <div v-if="showSubNav" class="free-trip-subnav center">
                <!-- 横向Tab列表 -->
                <ul class="free-subnav-tabs">
                    <li v-for="subItem in currentRouteData?.subNav" :key="subItem.subNavName"
                        class="free-subnav-tab w100"
                        :class="{ active: currentSubNavTab === subItem.subNavName, disabled: subItem.isShow === false }"
                        @click="subItem.isShow !== false && onClickSubTab(subItem.subNavName)">
                        {{ subItem.subNavName }}
                    </li>
                </ul>
                <!-- 搜索框（仅对免费信息显示） -->
                <div class="free-subnav-search-container">
                    <div v-if="currentRouteData && currentRouteData.tagName === '自助游/自驾游免费信息'"
                        class="free-subnav-search">
                        <el-input v-model="subSearch" placeholder="搜索景点/餐厅/住宿/特别活动..." size="large" clearable
                            @keyup.enter="doSubSearch" @clear="doSubSearch" />
                    </div>
                    <el-button v-if="currentRouteData && currentRouteData.tagName === '自助游/自驾游免费信息'" type="primary"
                        class="free-subnav-search-btn fs16" size="large" @click="doSubSearch">
                        <el-icon>
                            <Search />
                        </el-icon>
                        搜索
                    </el-button>
                </div>
            </div>
            <router-view @open-tour-dialog="openTourDialog" @open-place-list="openPlaceList" :sub-tab="currentSubNavTab"
                :keyword="committedKeyword" />
        </div>

        <!-- 弹窗组件 -->
        <TourDialog v-model:visible="isTourDialogVisible" :title="dialogTitle" :banner="dialogBanner"
            :trip-data="dialogTripData" :trip-type="dialogTripType" />
        <PlaceListDialog v-model="isPlaceListVisible" :place-name="listPlaceName" :item-type="listItemType"
            :items="listItems" @select="onSelectPlaceItem" />
    </el-main>
</template>

<style lang="scss" scoped>
.el-main {
    // background-color: pink;
    color: #333;
    padding: 0;
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
            height: 800px;
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
                font-size: 48px;
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
            font-size: 40px;
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


        .service-title {
            align-self: flex-start;
            margin-left: 20px;
            margin-top: 0;
            font-size: 20px;
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
            color: #3b82f6;
            border: 1px solid #e5e7eb;
            transition: all .2s ease;
            white-space: nowrap;
            user-select: none;
        }

        .free-subnav-tab.disabled {
            background: #f3f4f6;
            color: #9ca3af;
            border-color: #e5e7eb;
            cursor: not-allowed;
            opacity: 0.7;
        }

        .free-subnav-tab.active {
            background: linear-gradient(180deg, #4f86ff 0%, #3a6ff2 100%);
            color: #fff;
            border-color: transparent;
            box-shadow: 0 6px 16px rgba(63, 111, 242, 0.26);
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

        .section-heading {
            margin: 10px 0 8px 4px;
            // font-size: 18px;
            font-size: 28px;
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
                    height: 600px;
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
                        font-size: 36px;
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
                    font-size: 28px;
                }

                .activities-subtitle {
                    font-size: 15px;
                }

                .activities-grid {
                    grid-template-columns: 1fr;
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


.no-result-body {
    color: #374151;
    line-height: 1.8;

    .kw {
        color: #2563eb;
        font-weight: 700;
    }
}
</style>