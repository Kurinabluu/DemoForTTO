<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import TourDialog from '@/components/TourDialog.vue'
import PlaceListDialog from '@/components/PlaceListDialog.vue'
import ServiceShowcase from '@/views/ServiceShowcase.vue'
import TripsGrid from '@/views/TripsGrid.vue'
import ServicesNav from '@/components/ServicesNav.vue'
import { useNavStore } from '@/stores/nav'

const route = useRoute()
const router = useRouter()

// 监听路由变化，根据当前路由决定显示什么内容
const currentView = computed(() => {
    if (route.name === 'Service') return 'service'
    if (route.name === 'Trips') return 'trips'
    return 'default'
})

// 路由名与标签的映射
const routeNameToTag = {
    Service: '代订门票及旅游项目', // 根据你的需求调整
    Trips: '自助游/自驾游免费信息', // 根据你的需求调整
}
const tagToRouteName = {
    '代订门票及旅游项目': 'Service',
    '自助游/自驾游免费信息': 'Trips',
}

// 监听查询参数，动态切换子导航与一日游子标签
// watch(() => route.query, (q) => {
//     const query = q || {}
//     if (typeof query.subTab === 'string' && subNavTabs.includes(query.subTab)) {
//         subTab.value = query.subTab
//     }
//     if (typeof query.dayTab === 'string' && ['景点一日游', '主题一日游', '定制一日游'].includes(query.dayTab)) {
//         dayTripTab.value = query.dayTab
//     }
// }, { deep: true })

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

const searchText = ref('')
const popularTags = ref([
    '自助游/自驾游免费信息',
    '代订门票及旅游项目',
    '包车服务（独立成团+专车+司导）',
    '全程旅游管家服务',
    '地接地陪服务',
    '一日游（固定行程）',
    '多日游（固定行程）',
    '个性定制服务'
])


// 服务类型 -> 统一组件的配置
const serviceConfigs = {
    '独立成团（不限人数）': {
        heroTitle: '独立成团专属体验',
        heroDesc: '不限人数，完全按需，专属导游团队为您服务。',
        features: ['不限人数 灵活成团', '专属导游全程陪同', '个性化行程定制', '灵活时间安排', '专属车辆与设备'],
        packagesTitle: '独立成团套餐',
        packages: [
            { id: 1, title: '小团定制', description: '2-6人小团，灵活安排，专属导游服务' },
            { id: 2, title: '中团定制', description: '7-15人中团，专业导游，舒适体验' },
            { id: 3, title: '大团定制', description: '16人以上大团，专业团队，全程保障' }
        ],
        advantagesTitle: '独立成团服务优势',
        advantages: [
            { id: 1, title: '灵活成团', description: '不限人数 随时成团', icon: 'el-icon-user-solid' },
            { id: 2, title: '专属服务', description: '专属导游全程陪同', icon: 'el-icon-service' },
            { id: 3, title: '个性定制', description: '完全按需定制行程', icon: 'el-icon-setting' },
            { id: 4, title: '品质保障', description: '专业团队品质服务', icon: 'el-icon-medal' }
        ],
        contactTitle: '获取独立成团服务',
        contactIntro: '如需了解详情或预约独立成团服务，请联系我们的专属顾问'
    },
    '包车服务（独立成团+专车+司导）': {
        heroTitle: '专车座驾，您的移动休息室，您的专属节奏',
        heroDesc: '在塔斯马尼亚，最美的风景往往藏在徒步难以抵达之处。景点分散、班次有限、徒步距离遥远，这些因素导致太多旅行者与心仪的美景失之交臂。选择包车服务，TTO为您提供您的私密天地、您的移动探索基地，让您尽情放松休息、存放物品。遇到心动风景即可停靠，发现有趣地点随时前往。TTO提供的不只是车辆，更是打开塔斯马尼亚最美一面的钥匙，让您的旅途不再留下“如果当时能去那里就好了”的遗憾。TTO将这一切变为可能！',
        features: ['多种专业车型应对满足任意需求', '司导具备本地知识，提供本地人才知道的隐藏景点信息', '行程节奏自由掌控', '全天候私密空间', '24小时服务支持'],
        packagesTitle: '包车服务',
        packages: [
            { id: 1, title: 'XX包车', description: '描述描述描述' },
            { id: 2, title: 'XX包车', description: '描述描述描述' },
            { id: 3, title: 'XX包车', description: '描述描述描述' }
        ],
        advantagesTitle: '多种车型任你挑选',
        advantages: [
            {
                id: 1, title: '劳斯莱斯', description: 'XX座，真皮座驾', url: 'carType.png',
                conTitle: '家庭出游', conDes: '一家人共同旅游，享受众多乐趣',
            },
            {
                id: 2, title: '劳斯莱斯', description: 'XX座，真皮座驾', url: 'carType.png',
                conTitle: '家庭出游', conDes: '一家人共同旅游，享受众多乐趣',
            },
            {
                id: 3, title: '劳斯莱斯', description: 'XX座，真皮座驾', url: 'carType.png',
                conTitle: '家庭出游', conDes: '一家人共同旅游，享受众多乐趣',
            },
            {
                id: 4, title: '劳斯莱斯', description: 'XX座，真皮座驾', url: 'carType.png',
                conTitle: '家庭出游', conDes: '一家人共同旅游，享受众多乐趣',
            }
        ],
        contactTitle: '获取包车服务',
        contactIntro: '如需了解详情或预约包车服务，请联系我们的专属顾问'
    },
    '有偿行程定制': {
        heroTitle: '有偿行程定制体验',
        heroDesc: '专业规划师为您量身打造专属塔州之旅。',
        features: ['一对一专业规划师', '个性化行程设计', '详细行程安排', '全程跟踪服务', '专业建议与支持'],
        packagesTitle: '行程定制套餐',
        packages: [
            { id: 1, title: '基础定制', description: '基础行程规划，含主要景点与住宿建议' },
            { id: 2, title: '深度定制', description: '含交通、餐饮、活动等详细安排' },
            { id: 3, title: '豪华定制', description: '全方位定制，专属导游与特殊体验' }
        ],
        advantagesTitle: '行程定制服务优势',
        advantages: [
            { id: 1, title: '专业规划', description: '专业规划师团队', icon: 'el-icon-edit' },
            { id: 2, title: '个性定制', description: '完全按需定制', icon: 'el-icon-setting' },
            { id: 3, title: '详细安排', description: '细致到每一步', icon: 'el-icon-document' },
            { id: 4, title: '全程跟踪', description: '出行期间持续支持', icon: 'el-icon-view' }
        ],
        contactTitle: '获取行程定制服务',
        contactIntro: '如需了解详情或预约行程定制服务，请联系我们的专属顾问'
    },
    '全程旅游管家服务': {
        heroTitle: '全方位生活管家体验',
        heroDesc: '从日常事务到特殊需求，专业管家团队让您无忧。',
        features: ['一对一专属管家服务', '全方位生活需求规划', '专属活动与特殊安排', '24小时紧急支持', 'VIP特权与优先服务'],
        packagesTitle: '管家服务套餐',
        packages: [
            { id: 1, title: '基础管家', description: '日常事务管理，采购与预约' },
            { id: 2, title: '高级管家', description: '家庭活动与特殊安排' },
            { id: 3, title: '尊享管家', description: '24小时专属管家与私人助理' }
        ],
        advantagesTitle: '管家服务优势',
        advantages: [
            { id: 1, title: '专业保障', description: '资深管家服务团队', icon: 'el-icon-shield' },
            { id: 2, title: '全面服务', description: '全方位生活需求', icon: 'el-icon-chat-dot-round' },
            { id: 3, title: '私人服务', description: '一对一专线管家', icon: 'el-icon-user' },
            { id: 4, title: '尊享特权', description: '优先服务与特权', icon: 'el-icon-star-on' }
        ],
        contactTitle: '获取专属管家服务',
        contactIntro: '如需了解详情或预约管家服务，请联系我们的专属顾问'
    },
    '个性定制服务': {
        heroTitle: '个性定制服务体验',
        heroDesc: '按兴趣与需求打造独一无二的旅程。',
        features: ['创意定制方案', '特殊需求满足', '独特体验设计', '灵活调整服务', '专属活动安排'],
        packagesTitle: '个性定制套餐',
        packages: [
            { id: 1, title: '创意定制', description: '基础创意方案，满足特殊兴趣' },
            { id: 2, title: '深度定制', description: '独特体验与活动的深度方案' },
            { id: 3, title: '极致定制', description: '专属活动与特殊安排' }
        ],
        advantagesTitle: '个性定制优势',
        advantages: [
            { id: 1, title: '创意设计', description: '专业创意团队', icon: 'el-icon-magic-stick' },
            { id: 2, title: '个性定制', description: '完全个性定制', icon: 'el-icon-setting' },
            { id: 3, title: '独特体验', description: '独特体验设计', icon: 'el-icon-star-on' },
            { id: 4, title: '灵活服务', description: '灵活调整服务', icon: 'el-icon-refresh' }
        ],
        contactTitle: '获取个性定制服务',
        contactIntro: '如需了解详情或预约个性定制服务，请联系我们的专属顾问'
    },
    '地接地陪服务': {
        heroTitle: '地接地陪服务',
        heroDesc: '地接地陪服务',
        features: ['地接地陪服务', '地接地陪服务', '地接地陪服务', '地接地陪服务', '地接地陪服务'],
        packagesTitle: '地接地陪服务',
        packages: [
            { id: 1, title: '地接地陪服务', description: '地接地陪服务' },
            { id: 2, title: '地接地陪服务', description: '地接地陪服务' },
            { id: 3, title: '地接地陪服务', description: '地接地陪服务' }
        ],
        advantagesTitle: '地接地陪服务',
        advantages: [
            { id: 1, title: '地接地陪服务', description: '地接地陪服务', icon: 'el-icon-magic-stick' },
            { id: 2, title: '地接地陪服务', description: '地接地陪服务', icon: 'el-icon-setting' },
            { id: 3, title: '地接地陪服务', description: '地接地陪服务', icon: 'el-icon-star-on' },
            { id: 4, title: '地接地陪服务', description: '地接地陪服务', icon: 'el-icon-refresh' }
        ],
        contactTitle: '获取地接地陪服务',
        contactIntro: '如需了解详情或预约地接地陪服务，请联系我们的专属顾问'
    },
    '代订门票及旅游项目': {
        heroTitle: '让等待不再是旅行难题，高效管理时间',
        heroDesc: '在塔斯马尼亚，每一分钟都该属于美景，而非等待。TTO代订门票及旅游项目，为您省下宝贵的旅行时间：省下的1小时入住等待，换来一次海岸线的悠闲漫步；省下的30分钟餐厅等位，成就日落时分的品酒时光。一切琐事交给TTO，把您的等待留给霍巴特港的夕阳，把时间赠予菲欣纳的徒步，将惊喜托付给与野生动物的邂逅。选择代订门票及旅游项目，让塔斯马尼亚之旅只剩下纯粹的美好体验。',
        features: ['酒店免等入住', '餐厅预留就座', '行程无缝对接', '全程无忧代办'],
        packagesTitle: '代订门票及旅游项目',
        packages: [
            { id: 1, title: '代订门票及旅游项目', description: '代订门票及旅游项目' },
            { id: 2, title: '代订门票及旅游项目', description: '代订门票及旅游项目' },
            { id: 3, title: '代订门票及旅游项目', description: '代订门票及旅游项目' }
        ],
        advantagesTitle: '代订门票及旅游项目',
        advantages: [
            { id: 1, title: '代订门票及旅游项目', description: '代订门票及旅游项目', icon: 'el-icon-magic-stick' },
            { id: 2, title: '代订门票及旅游项目', description: '代订门票及旅游项目', icon: 'el-icon-setting' },
            { id: 3, title: '代订门票及旅游项目', description: '代订门票及旅游项目', icon: 'el-icon-star-on' },
            { id: 4, title: '代订门票及旅游项目', description: '代订门票及旅游项目', icon: 'el-icon-refresh' }
        ],
        contactTitle: '获取代订门票及旅游项目',
        contactIntro: '如需了解详情或预约代订门票及旅游项目，请联系我们的专属顾问'
    },
}

// 当前显示的服务配置
const currentServiceConfig = ref(null)
const isDialogVisible = ref(false)

// 标签激活与文案数据
const activeTag = ref(popularTags.value[0])

// 子导航（仅用于“自助游/自驾游免费信息”）
// - 需求：在景点列表上方显示横向导航（景点/餐厅/住宿/特别活动）和搜索框，默认“景点”
// - 点击切换：
//   1) 选“景点”：下方维持原有景点网格
//   2) 选“餐厅/住宿”：下方卡片标题改为对应文案（不改子标题，作为示例）
//   3) 选“特别活动”：不显示网格，仅显示“待修改”占位
const subNavTabs = ['景点', '餐厅', '住宿', '特别活动']
const subTab = ref('景点')
const subSearch = ref('')
const committedKeyword = ref('')

// 仅当激活标签为“自助游/自驾游免费信息”且未展示服务组件时，才显示子导航
const showFreeTripSubnav = computed(() => activeTag.value === '自助游/自驾游免费信息' && !currentServiceConfig.value)

function onClickSubTab(tab) {
    subTab.value = tab

    // 保存用户选择的子导航
    useNavStore().saveSelectedSubNav(tab)
}

// 网格数据与筛选逻辑由 TripsGrid 组件内部维护

// 地点-列表弹窗
const isPlaceListVisible = ref(false)
const listPlaceName = ref('')
const listItemType = ref('餐厅')
const listItems = ref([])

// 地点分组网格改由 TripsGrid 内部数据驱动

function openPlaceList(placeName, itemType) {
    listPlaceName.value = placeName
    listItemType.value = itemType
    const baseImg = itemType === '餐厅'
        ? new URL('@/assets/img/footer2.jpg', import.meta.url).href
        : new URL('@/assets/img/footer3.jpg', import.meta.url).href
    const items = []
    for (let i = 0; i < 24; i++) {
        // 字母在此-------------------------------------------------------------
        const label = String.fromCharCode(65 + (i % 26))
        const title = itemType === '餐厅' ? `餐厅名${label}` : `住宿名${label}`
        //英文标题
        const enTitle = itemType === '餐厅' ? `Restaurant${label}` : `Hotel${label}`
        items.push({ title, img: baseImg, enTitle })
    }
    listItems.value = items
    isPlaceListVisible.value = true
}

function onSelectPlaceItem(item) {
    dialogTitle.value = `${listPlaceName.value} · ${item.title}`
    dialogBanner.value = listItemType.value === '餐厅'
        ? new URL('@/assets/img/footer2.jpg', import.meta.url).href
        : new URL('@/assets/img/footer3.jpg', import.meta.url).href
    isTourDialogVisible.value = true
}

// 一日游子导航
const dayTripTabs = ['景点一日游', '主题一日游', '定制一日游']
const dayTripTab = ref(dayTripTabs[0])
// const dayTripCopyMap = {
//     '景点一日游': '精选经典景点路线，省心直达热门目的地',
//     '主题一日游': '围绕自然、人文、美食等主题深度体验',
//     '定制一日游': '按需定制专属行程，灵活时间与路线',
// }
function onClickDayTripTab(t) {
    dayTripTab.value = t

    // 保存用户选择的子导航
    useNavStore().saveSelectedSubNav(t)
}
const showDayTripSubnav = computed(() => !currentServiceConfig.value && activeTag.value === '一日游（固定行程）')
// const activityItems = ref(
//     scenicPlaces.slice(5, 33).map((name, i) => ({ title: `${name} 特别活动`, sub: ['徒步体验', '观星之旅', '直升机游览', '葡萄酒品鉴'][i % 4] }))
// )
// 一日游网格数据已迁移到 TripsGrid.vue，由 dayTripTab 控制

// 特别活动网格数据交由 TripsGrid 组件维护

// 搜索：在选中子导航时对相应分组执行包含匹配；若无结果则弹窗提示，不改变原网格
// const scenicFiltered = computed(() =>
//     (committedKeyword.value || '').trim()
//         ? gridItems.value.filter(it => it.title.includes(committedKeyword.value.trim()))
//         : gridItems.value
// )
// const restaurantFiltered = computed(() =>
//     (committedKeyword.value || '').trim()
//         ? restaurantItems.value.filter(it => it.title.includes(committedKeyword.value.trim()))
//         : restaurantItems.value
// )
// const hotelFiltered = computed(() =>
//     (committedKeyword.value || '').trim()
//         ? hotelItems.value.filter(it => it.title.includes(committedKeyword.value.trim()))
//         : hotelItems.value
// )
// 过滤与网格渲染交由 TripsGrid 组件维护

function doSubSearch() {
    const kw = (subSearch.value || '').trim()
    if (!kw) {
        // 清空搜索时重置
        committedKeyword.value = ''
        return
    }
    committedKeyword.value = kw
}

function onClickTag(tag) {
    activeTag.value = tag
    searchText.value = tag

    // 检查是否是服务类型标签（排除一日游和多日游）
    if (serviceConfigs[tag] && tag !== '一日游（固定行程）' && tag !== '多日游（固定行程）') {
        currentServiceConfig.value = { ...serviceConfigs[tag], serviceName: tag }
    } else {
        // 非服务型标签，显示网格（交由 TripsGrid 渲染）
        currentServiceConfig.value = null
    }

    // 路由跳转
    const routeName = tagToRouteName[tag]
    if (routeName) {
        router.push({ name: routeName })
    }
}

// 弹窗控制
const isTourDialogVisible = ref(false)
const dialogTitle = ref('大堡礁单日游')
const dialogBanner = ref(new URL('@/assets/img/footer2.jpg', import.meta.url).href)

// function openTourDialog(item,url) {
function openTourDialog(item) {
    dialogTitle.value = item?.title || '大堡礁单日游'
    // 轮换几张本地图片作为示意
    // const pics = [
    //     new URL('@/assets/img/footer1.jpg', import.meta.url).href,
    //     new URL('@/assets/img/footer2.jpg', import.meta.url).href,
    //     new URL('@/assets/img/footer3.jpg', import.meta.url).href,
    //     new URL('@/assets/img/footer4.jpg', import.meta.url).href,
    // ]
    // const idx = Math.floor(Math.random() * pics.length)
    // dialogBanner.value = pics[idx]
    // dialogBanner.value = url
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

// 组件挂载时执行
onMounted(() => {
    useNavStore().markFirstVisitDone()

    // 根据当前路由设置初始状态
    if (route.name === 'Service') {
        activeTag.value = '代订门票及旅游项目'
        currentServiceConfig.value = { ...serviceConfigs['代订门票及旅游项目'], serviceName: '代订门票及旅游项目' }
    } else if (route.name === 'Trips') {
        activeTag.value = '自助游/自驾游免费信息'
        currentServiceConfig.value = null
    }

    selectSlides()
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResizeForSlides)
    }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResizeForSlides)
    }
})

</script>

<template>
    <el-main>
        <!-- 轮播图 -->
        <div class="carousel-container" @touchstart.passive="onTouchStart" @touchmove.passive="onTouchMove"
            @touchend="onTouchEnd">
            <!-- 背景图片层 -->
            <div class="carousel-background">
                <img :src="slidesRef[currentSlideIndex]" alt="background" class="background-img"
                    :key="currentSlideIndex" />
            </div>
            <!-- 毛玻璃层 -->
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
        </div>

        <!-- 固定搜索框 - 使用ServicesNav组件 -->
        <ServicesNav v-model="searchText" :popular-tags="popularTags" :active-tag="activeTag" @tag-click="onClickTag"
            @search="isDialogVisible = true" />
        <!-- 内容区域 -->
        <div class="content-box">
            <!-- 服务组件区域
            <ServiceShowcase v-if="currentServiceConfig" :config="currentServiceConfig" /> -->

            <!-- 路由视图 -->
            <router-view :active-tag="activeTag" :sub-tab="subTab" :keyword="committedKeyword"
                :day-trip-tab="dayTripTab" @open-tour-dialog="openTourDialog"
                @open-place-list="({ placeName, itemType }) => openPlaceList(placeName, itemType)" />

            <!-- 自助游/自驾游免费信息：子导航（横向Tab + 搜索） -->
            <div v-if="showFreeTripSubnav" class="free-trip-subnav center">
                <!-- 横向Tab列表 -->
                <ul class="free-subnav-tabs">
                    <li v-for="t in subNavTabs" :key="t" class="free-subnav-tab" :class="{ active: subTab === t }"
                        @click="onClickSubTab(t)" :data-tab="t">{{ t }}</li>
                </ul>
                <!-- 搜索框 -->
                <div class="free-subnav-search">
                    <el-input v-model="subSearch" placeholder="搜索景点/餐厅/住宿/特别活动..." size="large" clearable
                        @keyup.enter="doSubSearch" @clear="doSubSearch" />
                </div>
                <el-button type="primary" class="free-subnav-search-btn" size="large" @click="doSubSearch">
                    <el-icon>
                        <Search />
                    </el-icon>
                    搜索
                </el-button>
            </div>

            <!-- 网格区统一由 TripsGrid 承担渲染 -->
            <!-- <TripsGrid v-if="showFreeTripSubnav" :active-tag="activeTag" :sub-tab="subTab" :keyword="committedKeyword"
                @open-tour-dialog="openTourDialog"
                @open-place-list="({ placeName, itemType }) => openPlaceList(placeName, itemType)" /> -->

            <!-- 一日游子导航 -->
            <template v-if="showDayTripSubnav">
                <!-- 简化的子导航，只有标签切换 -->
                <!-- <div class="free-trip-subnav center" style="margin-top:-10px;"> -->
                <div class="free-trip-subnav center">
                    <ul class="free-subnav-tabs">
                        <li v-for="t in dayTripTabs" :key="t" class="free-subnav-tab"
                            :class="{ active: dayTripTab === t }" @click="onClickDayTripTab(t)" :data-tab="t">
                            {{ t }}
                        </li>
                    </ul>
                </div>

                <!-- 一日游内容网格由 TripsGrid 渲染 -->
                <!-- <TripsGrid :active-tag="activeTag" :sub-tab="subTab" :keyword="committedKeyword"
                    :day-trip-tab="dayTripTab" @open-tour-dialog="openTourDialog"
                    @open-place-list="({ placeName, itemType }) => openPlaceList(placeName, itemType)" /> -->
            </template>

            <!-- 多日游由 TripsGrid 内部处理，无需在此重复渲染 -->

            <!-- 一日游、多日游网格显示
            <div v-if="!currentServiceConfig && (activeTag === '一日游（固定行程）' || activeTag === '多日游（固定行程）')"
                class="coming-grid">
                <div v-for="(item, i) in gridItems" :key="'day-trip-' + i" class="coming-card"
                    @click="openTourDialog(item)">
                    <img src="@/assets/img/footer1.jpg" alt="" class="w100">
                    <div class="card-title">{{ item.title }}</div>
                    <div class="card-sub">{{ item.sub }}</div>
                </div>
            </div> -->

            <TourDialog v-model:visible="isTourDialogVisible" :title="dialogTitle" :banner="dialogBanner" />
            <PlaceListDialog v-model="isPlaceListVisible" :place-name="listPlaceName" :item-type="listItemType"
                :items="listItems" @select="onSelectPlaceItem" />
        </div>
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
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 0 20px;
        }

        /* 横向Tab列表 */
        .free-subnav-tabs {
            // display: flex;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
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

        .free-subnav-tab.active {
            background: linear-gradient(180deg, #4f86ff 0%, #3a6ff2 100%);
            color: #fff;
            border-color: transparent;
            box-shadow: 0 6px 16px rgba(63, 111, 242, 0.26);
        }

        /* 子搜索框：与Tab在同一行，右对齐 */
        .free-subnav-search {
            flex: 0 0 320px;
        }

        .free-subnav-search-btn {
            flex: 0 0 auto;
            height: 40px;
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