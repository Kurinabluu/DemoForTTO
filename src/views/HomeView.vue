<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import TourDialog from '@/components/TourDialog.vue'
import ServiceShowcase from '@/views/ServiceShowcase.vue'

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
    // '独立成团（不限人数）',
    '代订门票及旅游项目',
    '包车服务（独立成团+专车+司导）',
    '全程旅游管家服务',
    '待定',
    '一日游（固定行程）',
    '多日游（固定行程）',
    '个性定制服务'
    // '有偿行程定制',
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
        heroTitle: '专车包车服务体验',
        heroDesc: '专车+司导，舒适便捷，贴心相伴，安全省心。',
        features: ['专业司机导游服务', '舒适豪华车辆', '灵活路线规划', '24小时服务支持', '全程贴心服务'],
        packagesTitle: '包车服务套餐',
        packages: [
            { id: 1, title: '经济包车', description: '经济型车辆，专业司机，基础保障' },
            { id: 2, title: '舒适包车', description: '舒适型车辆，经验司导，贴心服务' },
            { id: 3, title: '豪华包车', description: '豪华车型，资深司导，尊享体验' }
        ],
        advantagesTitle: '包车服务优势',
        advantages: [
            { id: 1, title: '专业司机', description: '经验丰富的专业司机', icon: 'el-icon-user' },
            { id: 2, title: '舒适车辆', description: '多种车型选择', icon: 'el-icon-truck' },
            { id: 3, title: '灵活路线', description: '根据需求定制路线', icon: 'el-icon-location' },
            { id: 4, title: '贴心服务', description: '全程贴心专业服务', icon: 'el-icon-service' }
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
    }
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
const subTab = ref(null)
const subSearch = ref('')
const committedKeyword = ref('')

// 仅当激活标签为“自助游/自驾游免费信息”且未展示服务组件时，才显示子导航
const showFreeTripSubnav = computed(() => activeTag.value === '自助游/自驾游免费信息' && !currentServiceConfig.value)

function onClickSubTab(tab) {
    subTab.value = tab
}

// 当切换到非“自助游/自驾游免费信息”时，重置子导航到默认“景点”
watch(activeTag, (next) => {
    if (next !== '自助游/自驾游免费信息') {
        subTab.value = '景点'
        subSearch.value = ''
    }
})

// 当进入“自助游/自驾游免费信息”时，默认不选中任何分组
watch(activeTag, (next) => {
    if (next === '自助游/自驾游免费信息') {
        subTab.value = null
    }
})

const scenicPlaces = [
    '菲欣拿国家公园', '摇篮山', '火焰湾', '酒杯湾', '玛丽亚岛', '塔斯曼半岛', '布鲁尼岛', '霍巴特海滨',
    '朗塞斯顿峡谷', '圣海伦斯', '比切诺', '斯坦利小镇', '里士满古桥', '亚瑟港', '德文波特', '塔拉娜自然保护区',
    '罗斯小镇', '塔基恩森林', '哈兹山脉', '高登大坝', '湖区自驾环线', '塔斯曼拱门', '魔鬼厨房', '蜜蜂农场',
    '小企鹅栖息地', '薰衣草庄园', '亚麻湾步道', '月亮湾', '海角灯塔', '西海岸公路', '蓝湖', '荒野步道',
    '威灵顿山', '萨拉曼卡市场', '塔斯马尼亚皇家植物园', '卡斯卡德啤酒厂', '塔斯马尼亚博物馆', '萨拉曼卡艺术中心',
    '塔斯马尼亚海事博物馆', '塔斯马尼亚艺术画廊', '塔斯马尼亚野生动物园', '塔斯马尼亚薰衣草农场', '塔斯马尼亚蜂蜜农场',
    '塔斯马尼亚奶酪工厂', '塔斯马尼亚威士忌酒厂', '塔斯马尼亚苹果园', '塔斯马尼亚樱桃园', '塔斯马尼亚草莓园'
]

function seededRandom(seed) {
    let x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

function generateItemsByTag(tag) {
    const items = []
    for (let i = 0; i < 32; i++) {
        const r = seededRandom(i + tag.length)
        const idx = Math.floor(r * scenicPlaces.length) % scenicPlaces.length
        const place = scenicPlaces[idx]

        let subTitle = ''
        if (tag.includes('一日游')) {
            const dayTripThemes = ['经典一日游', '自然探索', '文化体验', '海岸风光', '山景徒步', '历史遗迹']
            const themeIdx = Math.floor(seededRandom(idx + i + 100) * dayTripThemes.length) % dayTripThemes.length
            subTitle = dayTripThemes[themeIdx]
        } else if (tag.includes('多日游')) {
            const multiDayThemes = ['深度探索', '环岛之旅', '自然奇观', '文化深度游', '摄影之旅', '生态体验']
            const themeIdx = Math.floor(seededRandom(idx + i + 200) * multiDayThemes.length) % multiDayThemes.length
            subTitle = multiDayThemes[themeIdx]
        } else {
            const driveThemes = ['自驾环线', '观景台', '徒步步道', '日落观景点', '海岸公路', '森林小径', '瀑布探秘', '轻装徒步']
            const themeIdx = Math.floor(seededRandom(idx + i) * driveThemes.length) % driveThemes.length
            subTitle = driveThemes[themeIdx]
        }

        items.push({
            title: `${place}`,
            sub: subTitle,
        })
    }
    return items
}

const gridItems = ref(generateItemsByTag(activeTag.value))

// 衍生出餐厅/住宿/特别活动的示例数据（与景点同样基于 scenicPlaces 派生，便于演示真实搜索）
const restaurantItems = ref(
    scenicPlaces.slice(0, 28).map((name, i) => ({ title: `${name} 美食餐厅`, sub: ['当地特色', '海鲜料理', '家庭餐馆', '酒庄餐厅'][i % 4] }))
)
const hotelItems = ref(
    scenicPlaces.slice(10, 38).map((name, i) => ({ title: `${name} 舒适民宿`, sub: ['海景房', '市中心', '亲子友好', '度假小屋'][i % 4] }))
)
const activityItems = ref(
    scenicPlaces.slice(5, 33).map((name, i) => ({ title: `${name} 特别活动`, sub: ['徒步体验', '观星之旅', '直升机游览', '葡萄酒品鉴'][i % 4] }))
)

// 搜索：在选中子导航时对相应分组执行包含匹配；若无结果则弹窗提示，不改变原网格
const scenicFiltered = computed(() =>
    (committedKeyword.value || '').trim()
        ? gridItems.value.filter(it => it.title.includes(committedKeyword.value.trim()))
        : gridItems.value
)
const restaurantFiltered = computed(() =>
    (committedKeyword.value || '').trim()
        ? restaurantItems.value.filter(it => it.title.includes(committedKeyword.value.trim()))
        : restaurantItems.value
)
const hotelFiltered = computed(() =>
    (committedKeyword.value || '').trim()
        ? hotelItems.value.filter(it => it.title.includes(committedKeyword.value.trim()))
        : hotelItems.value
)
const activityFiltered = computed(() =>
    (committedKeyword.value || '').trim()
        ? activityItems.value.filter(it => it.title.includes(committedKeyword.value.trim()))
        : activityItems.value
)

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

    // 检查是否是服务类型标签
    if (serviceConfigs[tag]) {
        currentServiceConfig.value = { ...serviceConfigs[tag], serviceName: tag }
    } else {
        // 显示景点网格
        currentServiceConfig.value = null
        gridItems.value = generateItemsByTag(tag)
    }
}

// 弹窗控制
const isTourDialogVisible = ref(false)
const dialogTitle = ref('大堡礁单日游')
const dialogBanner = ref(new URL('@/assets/img/footer2.jpg', import.meta.url).href)

function openTourDialog(item) {
    dialogTitle.value = item?.title || '大堡礁单日游'
    // 轮换几张本地图片作为示意
    const pics = [
        new URL('@/assets/img/footer1.jpg', import.meta.url).href,
        new URL('@/assets/img/footer2.jpg', import.meta.url).href,
        new URL('@/assets/img/footer3.jpg', import.meta.url).href,
        new URL('@/assets/img/footer4.jpg', import.meta.url).href,
    ]
    const idx = Math.floor(Math.random() * pics.length)
    dialogBanner.value = pics[idx]
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

// 组件挂载时初始化轮播图
onMounted(() => {
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

        <!-- 固定搜索框 -->
        <div class="search-fixed">
            <el-card class="search-card" shadow="hover">
                <div class="search-container">
                    <el-input v-model="searchText" placeholder="搜索目的地、景点、路线..." class="search-input" size="large"
                        clearable>
                        <template #prefix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                    <el-button type="primary" size="large" class="search-btn" @click="isDialogVisible = true">
                        <el-icon>
                            <Search />
                        </el-icon>
                        搜索
                    </el-button>
                </div>
                <div class="search-tags">
                    <div v-for="tag in popularTags" :key="tag" class="tag-pill" :class="{ active: activeTag === tag }"
                        @click="onClickTag(tag)">
                        {{ tag }}
                    </div>
                </div>
            </el-card>
        </div>
        <!-- 内容区域 -->
        <div class="content-box">
            <!-- 服务组件区域 -->
            <ServiceShowcase v-if="currentServiceConfig" :config="currentServiceConfig" />

            <!-- 自助游/自驾游免费信息：子导航（横向Tab + 搜索） -->
            <div v-if="showFreeTripSubnav" class="free-trip-subnav">
                <!-- 横向Tab列表 -->
                <ul class="free-subnav-tabs">
                    <!-- 默认不选中：提供“全部”入口使状态清晰 -->
                    <li class="free-subnav-tab" :class="{ active: !subTab }" @click="onClickSubTab(null)">全部</li>
                    <li v-for="t in subNavTabs" :key="t" class="free-subnav-tab" :class="{ active: subTab === t }"
                        @click="onClickSubTab(t)">{{ t }}</li>
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

            <!-- 默认未选择分组且未搜索：渲染四个分区，带标题（不影响下方原有网格） -->
            <div v-if="showFreeTripSubnav && !subTab && !(committedKeyword?.trim())" class="search-result-wrapper">
                <div class="result-section">
                    <h3 class="section-heading">景点</h3>
                    <div class="coming-grid">
                        <div v-for="(item, i) in gridItems" :key="'sc-d-' + i" class="coming-card"
                            @click="openTourDialog(item)">
                            <img src="@/assets/img/footer1.jpg" alt="" class="w100">
                            <div class="card-title">{{ item.title }}</div>
                            <div class="card-sub">{{ item.sub }}</div>
                        </div>
                    </div>
                </div>
                <div class="result-section">
                    <h3 class="section-heading">餐厅</h3>
                    <div class="coming-grid">
                        <div v-for="(item, i) in restaurantItems" :key="'rt-d-' + i" class="coming-card"
                            @click="openTourDialog(item)">
                            <img src="@/assets/img/footer2.jpg" alt="" class="w100">
                            <div class="card-title">{{ item.title }}</div>
                            <div class="card-sub">{{ item.sub }}</div>
                        </div>
                    </div>
                </div>
                <div class="result-section">
                    <h3 class="section-heading">住宿</h3>
                    <div class="coming-grid">
                        <div v-for="(item, i) in hotelItems" :key="'ht-d-' + i" class="coming-card"
                            @click="openTourDialog(item)">
                            <img src="@/assets/img/footer3.jpg" alt="" class="w100">
                            <div class="card-title">{{ item.title }}</div>
                            <div class="card-sub">{{ item.sub }}</div>
                        </div>
                    </div>
                </div>
                <div class="result-section">
                    <h3 class="section-heading">特别活动</h3>
                    <div class="coming-grid">
                        <div v-for="(item, i) in activityItems" :key="'ac-d-' + i" class="coming-card"
                            @click="openTourDialog(item)">
                            <img src="@/assets/img/footer4.jpg" alt="" class="w100">
                            <div class="card-title">{{ item.title }}</div>
                            <div class="card-sub">{{ item.sub }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 搜索结果区：不影响下方原有景点网格 -->
            <div v-if="showFreeTripSubnav && (committedKeyword?.trim())" class="search-result-wrapper">
                <!-- 未选中任何：渲染四个分区，带标题 -->
                <template v-if="!subTab">
                    <div class="result-section">
                        <h3 class="section-heading">景点</h3>
                        <template v-if="scenicFiltered.length">
                            <div class="coming-grid">
                                <div v-for="(item, i) in scenicFiltered" :key="'sc-' + i" class="coming-card"
                                    @click="openTourDialog(item)">
                                    <img src="@/assets/img/footer1.jpg" alt="" class="w100">
                                    <div class="card-title">{{ item.title }}</div>
                                    <div class="card-sub">{{ item.sub }}</div>
                                </div>
                            </div>
                        </template>
                        <div v-else class="empty-tip">没有搜索结果</div>
                    </div>
                    <div class="result-section">
                        <h3 class="section-heading">餐厅</h3>
                        <template v-if="restaurantFiltered.length">
                            <div class="coming-grid">
                                <div v-for="(item, i) in restaurantFiltered" :key="'rt-' + i" class="coming-card"
                                    @click="openTourDialog(item)">
                                    <img src="@/assets/img/footer2.jpg" alt="" class="w100">
                                    <div class="card-title">{{ item.title }}</div>
                                    <div class="card-sub">{{ item.sub }}</div>
                                </div>
                            </div>
                        </template>
                        <div v-else class="empty-tip">没有搜索结果</div>
                    </div>
                    <div class="result-section">
                        <h3 class="section-heading">住宿</h3>
                        <template v-if="hotelFiltered.length">
                            <div class="coming-grid">
                                <div v-for="(item, i) in hotelFiltered" :key="'ht-' + i" class="coming-card"
                                    @click="openTourDialog(item)">
                                    <img src="@/assets/img/footer3.jpg" alt="" class="w100">
                                    <div class="card-title">{{ item.title }}</div>
                                    <div class="card-sub">{{ item.sub }}</div>
                                </div>
                            </div>
                        </template>
                        <div v-else class="empty-tip">没有搜索结果</div>
                    </div>
                    <div class="result-section">
                        <h3 class="section-heading">特别活动</h3>
                        <template v-if="activityFiltered.length">
                            <div class="coming-grid">
                                <div v-for="(item, i) in activityFiltered" :key="'ac-' + i" class="coming-card"
                                    @click="openTourDialog(item)">
                                    <img src="@/assets/img/footer4.jpg" alt="" class="w100">
                                    <div class="card-title">{{ item.title }}</div>
                                    <div class="card-sub">{{ item.sub }}</div>
                                </div>
                            </div>
                        </template>
                        <div v-else class="empty-tip">没有搜索结果</div>
                    </div>
                </template>
                <!-- 已选中某类：仅渲染该分区，带标题 -->
                <template v-else>
                    <div class="result-section" v-if="subTab === '景点'">
                        <h3 class="section-heading">景点</h3>
                        <template v-if="scenicFiltered.length">
                            <div class="coming-grid">
                                <div v-for="(item, i) in scenicFiltered" :key="'sc2-' + i" class="coming-card"
                                    @click="openTourDialog(item)">
                                    <img src="@/assets/img/footer1.jpg" alt="" class="w100">
                                    <div class="card-title">{{ item.title }}</div>
                                    <div class="card-sub">{{ item.sub }}</div>
                                </div>
                            </div>
                        </template>
                        <div v-else class="empty-tip">没有搜索结果</div>
                    </div>
                    <div class="result-section" v-else-if="subTab === '餐厅'">
                        <h3 class="section-heading">餐厅</h3>
                        <template v-if="restaurantFiltered.length">
                            <div class="coming-grid">
                                <div v-for="(item, i) in restaurantFiltered" :key="'rt2-' + i" class="coming-card"
                                    @click="openTourDialog(item)">
                                    <img src="@/assets/img/footer2.jpg" alt="" class="w100">
                                    <div class="card-title">{{ item.title }}</div>
                                    <div class="card-sub">{{ item.sub }}</div>
                                </div>
                            </div>
                        </template>
                        <div v-else class="empty-tip">没有搜索结果</div>
                    </div>
                    <div class="result-section" v-else-if="subTab === '住宿'">
                        <h3 class="section-heading">住宿</h3>
                        <template v-if="hotelFiltered.length">
                            <div class="coming-grid">
                                <div v-for="(item, i) in hotelFiltered" :key="'ht2-' + i" class="coming-card"
                                    @click="openTourDialog(item)">
                                    <img src="@/assets/img/footer3.jpg" alt="" class="w100">
                                    <div class="card-title">{{ item.title }}</div>
                                    <div class="card-sub">{{ item.sub }}</div>
                                </div>
                            </div>
                        </template>
                        <div v-else class="empty-tip">没有搜索结果</div>
                    </div>
                    <div class="result-section" v-else>
                        <h3 class="section-heading">特别活动</h3>
                        <template v-if="activityFiltered.length">
                            <div class="coming-grid">
                                <div v-for="(item, i) in activityFiltered" :key="'ac2-' + i" class="coming-card"
                                    @click="openTourDialog(item)">
                                    <img src="@/assets/img/footer4.jpg" alt="" class="w100">
                                    <div class="card-title">{{ item.title }}</div>
                                    <div class="card-sub">{{ item.sub }}</div>
                                </div>
                            </div>
                        </template>
                        <div v-else class="empty-tip">没有搜索结果</div>
                    </div>
                </template>
            </div>

            <!-- 底部网格：仅在未进入"自助游/自驾游免费信息"或当前子选项为景点时展示，避免重复 -->
            <!-- <div v-if="!showFreeTripSubnav || subTab === '景点'" class="coming-grid">
                <div v-for="(item, i) in gridItems" :key="i" class="coming-card" @click="openTourDialog(item)">
                    <img src="@/assets/img/footer1.jpg" alt="" class="w100">
                    <div class="card-title">{{ item.title }}</div>
                    <div class="card-sub">{{ item.sub }}</div>
                </div>
            </div> -->

            <!-- 餐厅网格：仅在选中餐厅时显示 -->
            <div v-if="showFreeTripSubnav && subTab === '餐厅' && !(committedKeyword?.trim())" class="coming-grid">
                <div v-for="(item, i) in restaurantItems" :key="'rt-bottom-' + i" class="coming-card"
                    @click="openTourDialog(item)">
                    <img src="@/assets/img/footer2.jpg" alt="" class="w100">
                    <div class="card-title">{{ item.title }}</div>
                    <div class="card-sub">{{ item.sub }}</div>
                </div>
            </div>

            <!-- 住宿网格：仅在选中住宿时显示 -->
            <div v-if="showFreeTripSubnav && subTab === '住宿' && !(committedKeyword?.trim())" class="coming-grid">
                <div v-for="(item, i) in hotelItems" :key="'ht-bottom-' + i" class="coming-card"
                    @click="openTourDialog(item)">
                    <img src="@/assets/img/footer3.jpg" alt="" class="w100">
                    <div class="card-title">{{ item.title }}</div>
                    <div class="card-sub">{{ item.sub }}</div>
                </div>
            </div>
            <!-- 特别活动：不展示网格，仅显示"待修改" -->
            <div v-if="showFreeTripSubnav && subTab === '特别活动'" class="special-activities-placeholder">
                待修改
            </div>

            <TourDialog v-model:visible="isTourDialogVisible" :title="dialogTitle" :banner="dialogBanner" />
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

    .search-fixed {
        display: flex;
        justify-content: center;
        // position: absolute;
        position: relative;
        // bottom: 20px;
        top: 40px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        // width: 100%;
        padding: 0 20px;

        :deep(.el-card__body) {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .search-card {
            // max-width: 1000px;
            // margin: 0 auto;
            border-radius: 12px;
            border: none;
            // box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

            .search-container {
                display: flex;
                gap: 12px;
                width: 800px;
                margin-bottom: 30px;

                .search-input {
                    flex: 1;

                    :deep(.el-input__wrapper) {
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        height: 48px;
                        padding: 6px 14px;
                        font-size: 15px;
                    }
                }

                .search-btn {
                    border-radius: 8px;
                    padding: 0 24px;
                    font-weight: 500;
                    height: 48px;
                }
            }

            .search-tags {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                width: 1200px;

                .tag-pill {
                    cursor: pointer;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 10px;
                    text-align: center;
                    background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
                    // color: #1f2937;
                    color: #3b82f6;
                    user-select: none;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.03) inset;
                }

                .active {
                    background: linear-gradient(180deg, #4f86ff 0%, #3a6ff2 100%);
                    color: #fff;
                    box-shadow: 0 6px 16px rgba(63, 111, 242, 0.26);
                }
            }
        }
    }

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

        .tourism-title {
            font-size: 48px;
            font-weight: 700;
            font-style: italic;
        }

        .coming-grid {
            width: 90%;
            // max-width: 1200px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            // padding: 8px 20px 40px;
            padding: 8px 0 40px;

            img {
                height: 90%;
            }
        }

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

        .coming-card {
            // height: 160px;
            border-radius: 12px;
            // background: #fff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            // align-items: center;
            // text-align: center;
            padding: 12px;
            // box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
            cursor: pointer;
        }

        .card-title {
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 2px;
            color: #1f2937;
            margin-bottom: 6px;
        }

        .card-sub {
            font-size: 12px;
            color: #6b7280;
            letter-spacing: 2px;
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
            display: flex;
            list-style: none;
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

        .search-result-wrapper {
            width: 90%;
            padding: 0 0 10px;
            display: flex;
            flex-direction: column;
            gap: 16px;

            .coming-grid {
                width: auto;
                padding-bottom: 0;
            }
        }

        .result-section {
            width: 100%;
        }

        .section-heading {
            margin: 10px 0 8px 4px;
            font-size: 18px;
            font-weight: 700;
            color: #111827;
        }

        .empty-tip {
            text-align: center;
            color: #6b7280;
            font-size: 18px;
            padding: 16px 0 8px;
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

            .search-fixed {
                display: flex;
                justify-content: center;
                bottom: 16px;
                margin-bottom: 20px;

                .search-card {
                    max-width: 720px;
                }

                .search-container {
                    width: 100%;
                }

                .search-tags {
                    grid-template-columns: repeat(4, 1fr);
                    width: 100%;
                }
            }

            .content-box {
                // height: 240px;

                .tourism-title {
                    font-size: 36px;
                }

                .coming-soon {
                    font-size: 28px;

                    .free-trip-subnav {
                        width: 100%;
                        padding: 0 16px;
                        gap: 12px;
                    }

                    .free-subnav-search {
                        flex-basis: 260px;
                    }

                    .free-subnav-search-btn {
                        height: 40px;
                        padding: 0 12px;
                    }
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

            .search-fixed {
                position: static;
                transform: none;
                z-index: auto;
                width: 100%;
                padding: 8px 12px 20px;
                top: auto;
                // margin-bottom: 20px;

                .search-card {
                    max-width: 95vw;
                    margin-top: 8px;
                }

                .search-container {
                    flex-direction: column;
                    gap: 8px;
                    width: 100%;
                }

                .search-input {
                    width: 100%;
                }

                .search-btn {
                    width: 100%;
                }

                .search-tags {
                    gap: 6px;
                    grid-template-columns: repeat(2, 1fr);
                    width: 100%;
                }

                .tag-pill {
                    padding: 6px 10px;
                    line-height: 1.3;
                    font-size: 12px;
                }
            }

            .content-box {
                height: auto;
                margin-top: 0;
                padding-top: 20px;
                /* 移动端减少间距 */

                .tourism-title {
                    font-size: 28px;
                }

                .coming-soon {
                    font-size: 22px;

                    /* 子导航：移动端折两行（上：Tabs，下：搜索） */
                    .free-trip-subnav {
                        width: 100%;
                        flex-direction: column;
                        align-items: stretch;
                        gap: 10px;
                        padding: 0 12px;
                    }

                    .free-subnav-tabs {
                        overflow-x: auto;
                        padding-bottom: 4px;
                        scrollbar-width: thin;
                    }

                    .free-subnav-search {
                        flex: none;
                    }

                    .free-subnav-search-btn {
                        width: 100%;
                        height: 40px;
                    }
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

            .search-fixed {
                padding: 6px 8px 20px;
                margin-bottom: 20px;

                .search-card {
                    max-width: 98vw;
                }

                .search-tags {
                    grid-template-columns: repeat(2, 1fr);
                }

                .tag-pill {
                    padding: 4px 8px;
                    font-size: 11px;
                    line-height: 1.2;
                }
            }

            .content-box {
                height: auto;
                margin-top: 30px;
                padding-top: 20px;
                gap: 16px;

                .tourism-title {
                    font-size: 24px;
                    // letter-spacing: 10px;
                }

                .coming-soon {
                    font-size: 18px;

                    // letter-spacing: 10px;
                    .free-trip-subnav {
                        padding: 0 10px;
                        gap: 8px;
                    }

                    .free-subnav-tab {
                        padding: 8px 12px;
                        font-size: 12px;
                    }
                }
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

            .search-fixed {
                padding: 4px 6px 20px;
                margin-bottom: 20px;

                .search-card {
                    max-width: 99vw;
                }

                .search-tags {
                    grid-template-columns: repeat(2, 1fr);
                }

                .tag-pill {
                    padding: 3px 6px;
                    font-size: 10px;
                    line-height: 1.1;
                }
            }

            .content-box {
                height: auto;
                margin-top: 30px;
                padding-top: 20px;
                gap: 12px;

                .tourism-title {
                    font-size: 20px;
                    letter-spacing: 8px;
                }

                .coming-soon {
                    font-size: 16px;
                    letter-spacing: 8px;

                    .free-subnav-tab {
                        padding: 6px 10px;
                        font-size: 11px;
                    }

                    .free-subnav-search-btn {
                        height: 36px;
                        font-size: 12px;
                    }
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