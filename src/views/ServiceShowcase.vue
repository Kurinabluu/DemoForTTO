<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
// Element Plus已在main.js中全局注册
import { ElIcon } from 'element-plus'
import { Back, Right, ZoomOut, ZoomIn, RefreshRight, RefreshLeft, Refresh } from '@element-plus/icons-vue'
import ContactDialog from '@/components/ContactDialog.vue'
import TripDialog from '@/components/TripDialog.vue'
import { loadServiceByName } from '@/utils/contentRepository'
import { isApiEnabled } from '@/utils/ttoApi'
// 直接使用静态导入，这是Vue 3 + Vite中最可靠的方式
// 导入所有需要的图片，使用@别名
import car1FrontRight from '@/assets/img/carService/car1_front_right.jpg';
import car1Right from '@/assets/img/carService/car1_right.jpg';
import car1Inside from '@/assets/img/carService/car1_inside.jpg';
import car1InsideTop from '@/assets/img/carService/car1_inside_top.jpg';
import car1InsideBack from '@/assets/img/carService/car1_inside_back.jpg';
import car1BackWithSpace from '@/assets/img/carService/car1_back_with_space.jpg';
import car1BackWithNoSpace from '@/assets/img/carService/car1_back_with_no_space.jpg';
import car1BackWithSuitcases from '@/assets/img/carService/car1_back_with_suitcases.jpg';
import seats22 from '@/assets/img/carService/22seats_front_left.png';
import seats22Left from '@/assets/img/carService/22seats_left.jpg';
import seats22Inside from '@/assets/img/carService/22seats_inside.jpg';

// import car2CarType from '@/assets/img/carService/car2_carType.png';
import carType from '@/assets/img/carService/carType.png';
import defaultCarType from '@/assets/img/carService/carType.png';
// 导入专属定制服务的图片
import startFromZero from '@/assets/img/startFromZero.png';
import capable from '@/assets/img/capable.png';
import createFreely from '@/assets/img/createFreely.png';
import finalPlan from '@/assets/img/finalPlan.png';
import { resolveDataImage } from '@/utils/dataImageResolver'
// 导入car2的所有图片
import car2Left from '@/assets/img/carService/car2_left.jpg';
import car2FrontLeft from '@/assets/img/carService/car2_front_left.jpg';
import car2LeftOpen from '@/assets/img/carService/car2_left_open.jpg';
import car2Inside from '@/assets/img/carService/car2_inside.jpg';
import car2InsideTop from '@/assets/img/carService/car2_inside_top.jpg';
import car2BackRight from '@/assets/img/carService/car2_back_right.jpg';
import car2Back from '@/assets/img/carService/car2_back.jpg';
import hiaceFront from '@/assets/img/carService/hiace_front.jpg';
import hiaceLeftFront from '@/assets/img/carService/hiace_left_front.jpg';
import { Z_INDEX } from '@/constants/zIndex'
import { COMPANY, getServiceFaqs } from '@/data/companyProfile'
import {
    applyBreadcrumbJsonLd,
    applyFaqJsonLd,
    applyJsonLd,
    applyPageSeo,
    ENTITY_JSONLD_ID,
    removeFaqJsonLd,
    resetPageSeo,
} from '@/utils/pageSeo'

// 接收配置（保持向后兼容）
const props = defineProps({
    config: { type: Object, default: null },
    serviceName: { type: String, default: '热门项目' }
})
const route = useRoute()

const serviceFaqOpen = ref('0')

// 响应式检测屏幕宽度，用于移动端适配
const screenWidth = ref(window.innerWidth)
const isPhone = computed(() => screenWidth.value <= 767)
const isMobile = computed(() => screenWidth.value <= 820)
const isTablet = computed(() => screenWidth.value <= 1024)
const serviceLoading = ref(false)
const serviceLoadError = ref('')

// 监听窗口大小变化
const handleResize = () => {
    screenWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})

// 声明变量存储服务数据
let serviceData = ref(null)
let currentServiceName = ref('')

const resolveServiceName = () => props.serviceName || props.config?.serviceName || ''

const carImagesMap = {
    'car1_front_right.jpg': car1FrontRight,
    'car1_right.jpg': car1Right,
    'car1_inside.jpg': car1Inside,
    'car1_inside_top.jpg': car1InsideTop,
    'car1_inside_back.jpg': car1InsideBack,
    'car1_back_with_space.jpg': car1BackWithSpace,
    'car1_back_with_no_space.jpg': car1BackWithNoSpace,
    'car1_back_with_suitcases.jpg': car1BackWithSuitcases,
    'carType.png': defaultCarType,
    // car2的图片映射
    'car2_left.jpg': car2Left,
    'car2_front_left.jpg': car2FrontLeft,
    'car2_left_open.jpg': car2LeftOpen,
    'car2_inside.jpg': car2Inside,
    'car2_inside_top.jpg': car2InsideTop,
    'car2_back_right.jpg': car2BackRight,
    'car2_back.jpg': car2Back,
    // 丰田海狮12座
    'hiace_front.jpg': hiaceFront,
    'hiace_left_front.jpg': hiaceLeftFront,
    //丰田考斯特22座
    '22seats_front_left.png': seats22,
    '22seats_inside.jpg': seats22Inside,
    '22seats_left.jpg': seats22Left,
    // 专属定制服务的图片映射
    '@/assets/img/startFromZero.png': startFromZero,
    '@/assets/img/capable.png': capable,
    '@/assets/img/createFreely.png': createFreely,
    '@/assets/img/finalPlan.png': finalPlan
};

const getImageUrl = (imagePath, advantage = null) => {
    // 基础验证
    if (!imagePath || typeof imagePath !== 'string') {
        return defaultCarType;
    }
    const normalizedPath = imagePath.trim()
        // 兼容误写的 ../assetes
        .replace(/^(\.\.\/)assetes\//, '$1assets/')

    // 完整URL直接返回
    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
        return normalizedPath;
    }

    // 将 ../assets 或 ../assetes 风格转换为映射表统一键
    let lookupKey = normalizedPath
    if (lookupKey.startsWith('../assets/')) {
        lookupKey = `@/${lookupKey.slice(3)}`
    }

    // 从映射表中获取图片，如果不存在则返回默认图片
    const image = carImagesMap[lookupKey] || carImagesMap[normalizedPath];
    return image || resolveDataImage(normalizedPath, defaultCarType);
}


// 获取默认图片 - 直接返回导入的默认图片
const getDefaultImage = () => {
    return defaultCarType;
}

const consultationDialogVisible = ref(false)
const openConsultationDialog = () => {
    consultationDialogVisible.value = true
}

// 新展示列表数据和逻辑
const showcaseItems = ref([])
const scrollContainerRef = ref(null)
const autoScrollTimer = ref(null)
const isAutoScrolling = ref(true)
const isUserInteracting = ref(false)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const scrollDirection = ref(1) // 1 表示向右滚动，-1 表示向左滚动
// 滚动按钮状态
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// 默认展示兜底（专属定制无 API 数据时）
const mockShowcaseData = [
    {
        id: 1,
        title: '家庭亲子定制游',
        description: '专为家庭设计的亲子行程，包含适合各年龄段儿童的互动体验和安全活动。',
        image: 'https://picsum.photos/seed/family/400/300',
        features: ['儿童活动', '安全第一', '教育体验'],
        tag: '亲子游'
    },
    {
        id: 2,
        title: '情侣浪漫定制游',
        description: '为情侣量身定制的浪漫之旅，包含私密观景点和特色餐饮体验。',
        image: 'https://picsum.photos/seed/couple/400/300',
        features: ['私密景点', '浪漫餐饮', '专业摄影'],
        tag: '浪漫体验'
    },
    {
        id: 3,
        title: '朋友结伴定制游',
        description: '专为朋友团体设计的行程，包含适合多人参与的互动活动和精彩体验。',
        image: 'https://picsum.photos/seed/friends/400/300',
        features: ['团体活动', '灵活行程', '精彩体验'],
        tag: '团体游'
    },
    {
        id: 4,
        title: '摄影爱好者定制',
        description: '专为摄影爱好者设计的行程，包含最佳摄影点和黄金拍摄时段。',
        image: 'https://picsum.photos/seed/photography/400/300',
        features: ['黄金时段', '隐秘景点', '专业指导'],
        tag: '摄影之旅'
    },
    {
        id: 5,
        title: '商务考察定制',
        description: '专为商务团队设计的考察行程，包含专业导览和商务接待服务。',
        image: 'https://picsum.photos/seed/business/400/300',
        features: ['专业导览', '商务设施', '高效安排'],
        tag: '商务游'
    }
]

// 初始化展示列表数据
const initShowcaseData = () => {
    // 优先使用currentConfig中的showcaseData，如果存在且有内容
    const config = currentConfig.value || {}
    const dataToUse = config.showcaseData && config.showcaseData.length > 0
        ? config.showcaseData
        : mockShowcaseData;

    showcaseItems.value = dataToUse.map(item => ({
        ...item,
        imageUrl: resolveDataImage(item.image, defaultCarType, { variant: 'thumb' })
    }))
}

// 自动滚动函数
const autoScroll = () => {
    if (!scrollContainerRef.value || !isAutoScrolling.value || isUserInteracting.value) return

    const container = scrollContainerRef.value
    const scrollAmount = 2 // 每次滚动像素
    const maxScrollLeft = container.scrollWidth - container.clientWidth
    const scrollInterval = 30 // 正常滚动间隔时间(ms)

    // 计算新的滚动位置
    const newScrollLeft = container.scrollLeft + (scrollAmount * scrollDirection.value)

    // 检查是否到达边界并改变滚动方向
    if (newScrollLeft <= 0) {
        // 到达左侧边界，开始向右滚动
        scrollDirection.value = 1
        container.scrollLeft = 0

        // 清除当前定时器
        clearInterval(autoScrollTimer.value)

        // 延迟1.5秒后重新开始滚动，使用正常的滚动间隔
        setTimeout(() => {
            if (isAutoScrolling.value && !isUserInteracting.value) {
                autoScrollTimer.value = setInterval(autoScroll, scrollInterval)
            }
        }, 1500)
    } else if (newScrollLeft >= maxScrollLeft) {
        // 到达右侧边界，开始向左滚动
        scrollDirection.value = -1
        container.scrollLeft = maxScrollLeft

        // 清除当前定时器
        clearInterval(autoScrollTimer.value)

        // 延迟1.5秒后重新开始滚动，使用正常的滚动间隔
        setTimeout(() => {
            if (isAutoScrolling.value && !isUserInteracting.value) {
                autoScrollTimer.value = setInterval(autoScroll, scrollInterval)
            }
        }, 1500)
    } else {
        // 正常滚动
        container.scrollLeft = newScrollLeft
    }
}

// 开始自动滚动
const startAutoScroll = () => {
    if (autoScrollTimer.value) {
        clearInterval(autoScrollTimer.value)
    }

    autoScrollTimer.value = setInterval(autoScroll, 30)
}

// 停止自动滚动
const stopAutoScroll = () => {
    if (autoScrollTimer.value) {
        clearInterval(autoScrollTimer.value)
        autoScrollTimer.value = null
    }
}

// 处理用户交互
const handleUserInteraction = (isInteracting) => {
    isUserInteracting.value = isInteracting

    if (isInteracting) {
        stopAutoScroll()
    } else {
        // 延迟1秒后恢复自动滚动
        setTimeout(() => {
            if (!isUserInteracting.value && isAutoScrolling.value) {
                startAutoScroll()
            }
        }, 1000)
    }
}

// 左右滚动按钮方法
const scrollLeftClick = () => {
    if (scrollContainerRef.value && canScrollLeft.value) {
        const scrollAmount = 340 // 滚动一个卡片的宽度加上间距
        const container = scrollContainerRef.value

        // 平滑滚动，不超过容器边界
        const newScrollLeft = Math.max(0, container.scrollLeft - scrollAmount)
        container.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        })

        updateScrollButtonsState()
        handleUserInteraction(true)
    }
}

const scrollRightClick = () => {
    if (scrollContainerRef.value && canScrollRight.value) {
        const scrollAmount = 340 // 滚动一个卡片的宽度加上间距
        const container = scrollContainerRef.value
        const maxScrollLeft = container.scrollWidth - container.clientWidth

        // 平滑滚动，不超过容器边界
        const newScrollLeft = Math.min(maxScrollLeft, container.scrollLeft + scrollAmount)
        container.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        })

        updateScrollButtonsState()
        handleUserInteraction(true)
    }
}

// 更新滚动按钮状态
const updateScrollButtonsState = () => {
    if (!scrollContainerRef.value) return

    const container = scrollContainerRef.value
    const maxScrollLeft = container.scrollWidth - container.clientWidth

    // 当滚动到最左侧时，禁用左滚动按钮
    canScrollLeft.value = container.scrollLeft > 5 // 添加小的容差

    // 当滚动到最右侧时，禁用右滚动按钮
    canScrollRight.value = container.scrollLeft < maxScrollLeft - 5 // 添加小的容差
}

// 开始拖拽
const startDrag = (e) => {
    if (!scrollContainerRef.value) return

    isDragging.value = true
    handleUserInteraction(true)

    // 获取初始触摸/鼠标位置和当前滚动位置
    startX.value = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX
    scrollLeft.value = scrollContainerRef.value.scrollLeft
}

// 拖拽中
const drag = (e) => {
    if (!isDragging.value || !scrollContainerRef.value) return
    e.preventDefault()

    // 计算移动距离
    const x = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX
    const walk = (x - startX.value) * 1.5 // 滚动速度倍数

    // 应用滚动
    scrollContainerRef.value.scrollLeft = scrollLeft.value - walk
}

// 结束拖拽
const endDrag = () => {
    isDragging.value = false
    updateScrollButtonsState()
    handleUserInteraction(false)
}

// 监听滚动事件更新按钮状态
const onScroll = () => {
    updateScrollButtonsState()
}

// 计算属性：优先使用从data.json获取的数据，否则使用传入的config
const currentConfig = computed(() => {
    if (serviceData.value) {
        return serviceData.value.serviceConfig
    }
    return props.config
})

// 优先显示服务名；若未提供则回退到主标题
const titleText = computed(() => {
    if (serviceData.value) {
        return serviceData.value.tagName || currentConfig.value?.heroTitle || ''
    }
    return props.config?.serviceName || props.config?.heroTitle || ''
})

// 将 heroDesc 规范为数组：data 中可能是字符串（热门项目/商务接送/地接地陪/行程管家）或数组（包车/专属定制），v-for 遍历字符串会按字符迭代导致每字一个 p
const heroDescLines = computed(() => {
    const desc = currentConfig.value?.heroDesc
    if (desc == null) return []
    return Array.isArray(desc) ? desc : [desc]
})

const serviceFaqs = computed(() => getServiceFaqs(resolveServiceName() || currentServiceName.value))

function applyServiceSeo() {
    const name = resolveServiceName() || currentServiceName.value || '服务'
    const desc = heroDescLines.value.filter(Boolean).join(' ').replace(/\s+/g, ' ').slice(0, 180)
    applyPageSeo({
        title: name,
        description: desc || `${name}由 TASMANIA TRIPS PTY LTD 提供，服务区域为塔斯马尼亚。`,
    })
    applyFaqJsonLd(serviceFaqs.value)
    applyJsonLd(ENTITY_JSONLD_ID, {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name,
        description: desc || `${name}由 ${COMPANY.legalName} 提供，服务区域为${COMPANY.region}。`,
        areaServed: COMPANY.region,
        provider: {
            '@type': 'TravelAgency',
            name: COMPANY.brand,
            legalName: COMPANY.legalName,
            email: COMPANY.email,
            telephone: COMPANY.phone,
        },
    })
    applyBreadcrumbJsonLd([
        { name: '首页', path: '/trips/freeinfo' },
        { name, path: route.path },
    ])
}

// 获取服务数据的函数（API 优先）
const loadServiceData = async (serviceName) => {
    if (!serviceName) return
    serviceLoading.value = true
    serviceLoadError.value = ''
    try {
        const data = await loadServiceByName(serviceName)
        if (data) {
            serviceData.value = data
            currentServiceName.value = data.tagName || serviceName
            initShowcaseData()
        } else {
            serviceData.value = null
            serviceLoadError.value = isApiEnabled()
                ? '暂时无法加载该服务，请稍后再试'
                : '未找到该服务配置'
        }
    } catch (error) {
        serviceData.value = null
        serviceLoadError.value = error?.message || '加载服务失败'
    } finally {
        serviceLoading.value = false
        applyServiceSeo()
    }
}

// 组件挂载时获取数据
onMounted(() => {
    // 优先使用传入的serviceName
    void loadServiceData(resolveServiceName())

    // 延迟启动自动滚动，确保DOM已经渲染
    setTimeout(() => {
        if (isAutoScrolling.value) {
            startAutoScroll()
        }
        // 添加滚动事件监听器
        if (scrollContainerRef.value) {
            scrollContainerRef.value.addEventListener('scroll', onScroll)
            // 初始化滚动按钮状态
            setTimeout(() => {
                updateScrollButtonsState()
            }, 100)
        }
    }, 1000)
})

// 组件卸载时清理定时器
onUnmounted(() => {
    stopAutoScroll()
    if (scrollContainerRef.value) {
        scrollContainerRef.value.removeEventListener('scroll', onScroll)
    }
    resetPageSeo()
    removeFaqJsonLd()
})

// 监听serviceName变化，重新加载数据
watch(() => props.serviceName, (newServiceName) => {
    if (newServiceName) {
        void loadServiceData(newServiceName)
    }
})

// 可订购项目静态数据（热门项目专属）
const orderableItems = ref([
    {
        id: 1,
        title: 'Tahune AirWalk 空中步道',
        description: '在塔斯马尼亚南部森林中体验独特的空中步道，漫步于树冠之上，俯瞰胡恩河的壮丽景色。',
        price: '35',
        groupPrice: '30',
        currency: 'A$',
        priceUnit: '/人',
        image: '@/assets/img/places/TahuneAirWalk.jpg',
        tag: '门票',
        features: ['树冠漫步', '胡恩河景', '适合全家'],
        preparation: ['舒适的步行鞋', '防晒霜和帽子', '相机', '水和零食'],
        personalInfo: '无需特殊个人信息，请携带有效护照',
        feeBasis: '门票价格基于成人标准票价，2-16岁儿童享受儿童价',
        notes: ['请提前15分钟到达入口', '空中步道全长约20米', '部分路段较窄，请注意安全', '雨天候客可能会关闭']
    },
    {
        id: 2,
        title: 'Port Arthur Historic Site 亚瑟港历史遗址',
        description: '探索澳大利亚最著名的历史遗址，了解塔斯马尼亚的殖民历史，体验夜间幽灵之旅。',
        price: '45',
        groupPrice: '38',
        currency: 'A$',
        priceUnit: '/人',
        image: '@/assets/img/places/PortArthur.jpg',
        tag: '门票',
        features: ['历史遗址', '夜间幽灵之旅', '导览服务'],
        preparation: ['舒适的步行鞋', '防晒/雨具', '相机', '保暖外套'],
        personalInfo: '无需特殊个人信息，请携带有效护照',
        feeBasis: '门票包含主监狱建筑、岛屿游船和花园门票',
        notes: ['建议预留3-4小时参观', '可参加免费导览活动', '幽灵之旅需额外购票', '餐厅和咖啡厅需另行付费']
    },
    {
        id: 3,
        title: 'Cradle Mountain 摇摇篮山国家公园',
        description: '塔斯马尼亚最著名的国家公园，体验世界遗产级的自然风光，徒步穿越原始荒野。',
        price: '25',
        groupPrice: '20',
        currency: 'A$',
        priceUnit: '/人',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        tag: '门票',
        features: ['世界遗产', '徒步路线', '野生动物'],
        preparation: ['防水徒步鞋', '保暖衣物', '雨具', '充足的饮用水和食物'],
        personalInfo: '无需特殊个人信息，请携带有效护照',
        feeBasis: '门票有效期为24小时，可在园区内多次使用',
        notes: ['徒步线路多样，请选择适合自己体力的路线', '部分路线需要预订', '可以看到塔斯马尼亚恶魔等特有动物', '冬季可能有雪，注意防滑']
    },
    {
        id: 4,
        title: 'Wineglass Bay 酒杯湾游船',
        description: '乘坐游船探索菲欣纳国家公园最美的酒杯湾，欣赏粉红色花岗岩山脉与碧蓝海水的完美结合。',
        price: '120',
        groupPrice: '105',
        currency: 'A$',
        priceUnit: '/人',
        image: '@/assets/img/places/wineglassbay.jpg',
        tag: '游船',
        features: ['酒杯湾', '游船体验', '海景风光'],
        preparation: ['防晒霜和帽子', '晕船药（如易晕车）', '保暖外套', '相机'],
        personalInfo: '无需特殊个人信息，请携带有效护照',
        feeBasis: '游船价格包含船上午餐和饮品',
        notes: ['全程约3.5小时', '提供素食选择，请提前告知', '可能看到海豚和鲸鱼', '风大浪急时请注意安全']
    },
    {
        id: 5,
        title: 'Bonorong Wildlife Sanctuary 野生动物保护区',
        description: '近距离接触塔斯马尼亚独有的野生动物，包括袋熊、袋獾和考拉，了解野生动物保护工作。',
        price: '32',
        groupPrice: '27',
        currency: 'A$',
        priceUnit: '/人',
        image: '@/assets/img/places/MariaIsland.jpg',
        tag: '门票',
        features: ['袋熊', '袋獾', '夜间游览'],
        preparation: ['舒适的步行鞋', '防晒用品', '相机', '驱蚊液'],
        personalInfo: '无需特殊个人信息，请携带有效护照',
        feeBasis: '门票包含园区入场和每日喂食表演',
        notes: ['每天有固定的动物喂食时间', '夜间游览需额外购票', '可以亲手喂袋鼠', '请勿在园区内饮食']
    },
    {
        id: 6,
        title: 'MONA 现代艺术博物馆',
        description: '参观澳大利亚最具争议性的私人博物馆，体验独特的地下建筑设计与前卫艺术作品。',
        price: '28',
        groupPrice: '23',
        currency: 'A$',
        priceUnit: '/人',
        image: '@/assets/img/places/MONA/2.jpg',
        tag: '门票',
        features: ['现代艺术', '地下建筑', '独特体验'],
        preparation: ['舒适的步行鞋（需走很多路）', '相机', '开放的心态'],
        personalInfo: '无需特殊个人信息，请携带有效护照',
        feeBasis: '门票包含地下博物馆全部展览和船上往返',
        notes: ['馆内禁止拍照的部分请遵守规定', '建议预留4-5小时参观', '可下载MONA App获得更好的导览体验', '博物馆商店有独特的纪念品']
    }
])

// 可订购项目弹窗相关
const orderableDialogVisible = ref(false)
const orderableDialogData = ref({
    title: '',
    enTitle: '',
    banner: '',
    tripType: '热门项目',
    tripData: {}
})

const openOrderableDialog = (item) => {
    // 构建兼容 TripDialog 的 tripData 格式
    const tripData = {
        displaySubNav: '热门项目',
        desc: item.description,
        route: item.title,
        features: item.features?.map((f, idx) => ({
            icon: ['#22c55e', '#3b82f6', '#f59e0b'][idx % 3] || '#22c55e',
            title: f,
            desc: ''
        })) || [],
        tags: item.tags || [],
        orderableInfo: {
            singlePriceLabel: '标准价格',
            singlePrice: item.price,
            groupPriceLabel: '团购价格',
            groupPrice: item.groupPrice,
            currency: item.currency,
            priceUnit: item.priceUnit,
            preparation: item.preparation || [],
            personalInfo: item.personalInfo || '',
            feeBasis: item.feeBasis || '',
            notes: item.notes || []
        }
    }

    orderableDialogData.value = {
        title: item.title,
        enTitle: item.enTitle || '',
        banner: item.image,
        tripType: '热门项目',
        tripData
    }
    orderableDialogVisible.value = true
}
</script>

<template>
    <div class="service-showcase">
        <div v-if="serviceLoading" class="service-load-state">正在加载服务内容…</div>
        <div v-else-if="serviceLoadError" class="service-load-state service-load-error">{{ serviceLoadError }}</div>
        <!-- 包车服务介绍 -->
        <div class="charter-intro w100" v-if="currentConfig?.packagesTitle === '包车服务'">
            <div class="charter-content">
                <h1 class="section-title">我们提供如下车型的包车服务：</h1>
                <template v-for="advantage in (currentConfig?.advantages || [])" :key="advantage?.id">
                    <div class="carousel-container w100">
                        <el-carousel trigger="click" :height="isTablet ? '400px' : '600px'" :interval="5000" type="card"
                            indicator-position="outside" :direction="isMobile ? 'vertical' : 'horizontal'">
                            <el-carousel-item v-for="(url, index) in (advantage.urls || [])" :key="index">
                                <el-image :src="getImageUrl(url, advantage)" :alt="advantage?.title || '车辆详情'"
                                    class="carousel-img w100 h100 pointer" :fit="isTablet ? 'scale-down' : 'contain'"
                                    :preview-src-list="advantage.urls?.map(imgUrl => getImageUrl(imgUrl, advantage))"
                                    :zoom-rate="1.2" :max-scale="7" :min-scale="0.2" show-progress
                                    :initial-index="index" show-close show-toolbar show-index :preview-teleported="true"
                                    :z-index="Z_INDEX.dialog.imagePreview">
                                    <template #toolbar="{ actions, prev, next }">
                                        <ElIcon @click="prev">
                                            <Back />
                                        </ElIcon>
                                        <ElIcon @click="next">
                                            <Right />
                                        </ElIcon>
                                        <ElIcon @click="actions('zoomOut')">
                                            <ZoomOut />
                                        </ElIcon>
                                        <ElIcon @click="actions('zoomIn')">
                                            <ZoomIn />
                                        </ElIcon>
                                        <el-icon @click="actions('clockwise')">
                                            <RefreshRight />
                                        </el-icon>
                                        <el-icon @click="actions('anticlockwise')">
                                            <RefreshLeft />
                                        </el-icon>
                                    </template>
                                </el-image>
                            </el-carousel-item>
                        </el-carousel>
                    </div>
                    <div class="car-info-container">
                        <div class="car-name">{{ advantage?.title || '' }}</div>
                        <div class="car-name-row">
                            <p class="car-price fs20">{{ advantage?.titlePrice || '' }}</p>
                            <button class="consult-btn consult-btn-large fs14 pointer"
                                @click="openConsultationDialog">立即咨询</button>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- 顶部服务标题（左上角） -->
        <!-- <h1 class="service-title fowe7" v-if="titleText">{{ titleText }}</h1> -->
        <!-- 主要服务介绍区域 -->
        <div class="hero-section" v-if="currentConfig?.packagesTitle !== '包车服务'">
            <div class="hero-content">

                <div class="hero-text w100">
                    <!-- <h2 class="subtitle center">{{ currentConfig?.heroTitle }}</h2> -->
                    <h1 class="section-title">{{ currentConfig?.heroTitle }}</h1>
                    <p class="description center" v-for="(desc, idx) in heroDescLines" :key="idx">{{ desc }}</p>


                    <!-- <h2 class="section-title">{{ currentConfig?.heroTitle }}</h2>
                    <p class="description center" v-for="desc in currentConfig?.heroDesc">{{ desc }}</p> -->

                    <!-- <ul class="features-list">
                        <li class="feature-item" v-for="(f, i) in currentConfig?.features" :key="i">
                            <span class="feature-dot center fff fowe7">√</span>
                            {{ f }}
                        </li>
                    </ul> -->
                </div>
                <template v-if="currentConfig?.heroTitle === '专属于你的私人旅行定制'">
                    <div class="hero-text w100">
                        <h2 class="section-title">3种私人订制方式</h2>
                        <p class="description">
                            1）只委托本公司定制行程表，行程表中不包含酒店和餐饮，也不在本公司执行行程。
                            (此方式定制费30澳元/天，具体收费标准是30X天数，此费用在定制之前全额支付到本公司账户。)

                        </p>
                        <p class="description">
                            2）定制行程同时包括酒店和餐饮(也可以只包含其中一种)(此方案收费A$35一天，具体收费标准是A$35X天数)
                        </p>
                        <p class="description">
                            3）委托本公司定制行程(方案1或方案2)同时雇佣本公司执行行程。(采用此方案，定制费以2的金额抵扣行程费用)
                        </p>
                    </div>
                </template>

                <!-- <div class="hero-image w100">
                    <div class="image-placeholder center fff fowe7" v-for="text in currentConfig?.imgText">{{ text }}
                    </div>
                </div> -->
            </div>
        </div>

        <div v-if="currentConfig?.packagesTitle !== '包车服务' && currentConfig?.stepsTitle && (currentConfig?.steps?.length > 0)"
            class="steps-box">
            <div class="section-title">{{ currentConfig?.stepsTitle }}</div>
            <el-steps :active="currentConfig?.steps?.length || 0" align-center :space=80 direction="vertical">
                <el-step v-for="(step, i) in currentConfig?.steps" :key="i"
                    :title="typeof step === 'object' ? step.title : step"
                    :description="typeof step === 'object' ? step.description : ''" />
                <!-- <el-step title="咨询沟通，根据需求定制方案" />
                <el-step title="透明报价，确认预定" />
                <el-step title="行前对接，安心确认" />
                <el-step title="行程结束，便捷结算尾款" />
                <el-step title="服务反馈，持续优化" /> -->
                <!-- <el-step title="提出你对旅行的任何想法" />
                <el-step title="选择你的方案，深度定制or现有方案调整" />
                <el-step title="获得专属方案与透明报价" />
                <el-step title="签约支付" />
                <el-step title="行程结束，完成尾款" />
                <el-step title="服务反馈，持续优化" /> -->
            </el-steps>
            <div class="order-now fowe7 fs14 pointer" @click="openConsultationDialog">立即咨询 >></div>
        </div>

        <!-- 可订购项目版块（热门项目专属） -->
        <div v-if="props.serviceName === '热门项目'" class="orderable-section">
            <h2 class="section-title">热门景点门票与活动项目</h2>
            <p class="orderable-intro">以下项目可通过TTO代订，省去排队购票烦恼，让你专心享受旅程</p>
            <div class="orderable-grid">
                <div v-for="item in orderableItems" :key="item.id" class="orderable-card"
                    @click="openOrderableDialog(item)">
                    <div class="orderable-image">
                        <img :src="getImageUrl(item.image)" :alt="item.title" class="orderable-img" loading="lazy"
                            decoding="async">
                        <div class="orderable-tag">{{ item.tag }}</div>
                    </div>
                    <div class="orderable-content">
                        <h3 class="orderable-title">{{ item.title }}</h3>
                        <p class="orderable-description">{{ item.description }}</p>
                        <div class="orderable-features">
                            <span v-for="(feature, idx) in item.features" :key="idx" class="feature-tag">{{ feature
                            }}</span>
                        </div>
                        <div class="orderable-price-row">
                            <div class="price-info">
                                <span class="price-item">
                                    <span class="price-label">单人价</span>
                                    <span class="price-value">
                                        <span class="price-currency">{{ item.currency }}</span>
                                        <span class="price-num">{{ item.price }}</span>
                                        <span class="price-unit">{{ item.priceUnit }}</span>
                                    </span>
                                </span>
                                <span class="price-item group">
                                    <span class="price-label">团购价</span>
                                    <span class="price-value">
                                        <span class="price-currency">{{ item.currency }}</span>
                                        <span class="price-num group-price-num">{{ item.groupPrice }}</span>
                                        <span class="price-unit">{{ item.priceUnit }}</span>
                                    </span>
                                </span>
                            </div>
                            <button class="consult-btn fs14 pointer">查看详情</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!--  横向自动播放展示列表 -->
        <div v-if="currentConfig?.packagesTitle !== '包车服务' && currentConfig?.showcaseData && currentConfig.showcaseData.length > 0"
            class="showcase-section w100">
            <!-- <h3 v-if="currentConfig?.showcaseTitle" class="showcase-title center">{{ currentConfig.showcaseTitle
            }}</h3> -->
            <h3 v-if="currentConfig?.showcaseTitle" class="section-title">{{ currentConfig.showcaseTitle
                }}</h3>

            <!-- 左侧滚动按钮 -->
            <button class="scroll-btn scroll-btn-left" @click="scrollLeftClick" :disabled="!canScrollLeft">
                <svg viewBox="0 0 24 24">
                    <path d="M15 6l-6 6 6 6" />
                </svg>
            </button>

            <!-- 滚动容器 -->
            <div ref="scrollContainerRef" class="showcase-scroll-container" @mouseenter="handleUserInteraction(true)"
                @mousedown="startDrag" @mousemove="drag" @mouseup="endDrag" @mouseleave="endDrag"
                @touchstart="startDrag" @touchmove="drag" @touchend="endDrag" @touchcancel="endDrag"
                @selectstart.prevent @dragstart.prevent>
                <div class="showcase-items-wrapper">
                    <div v-for="item in showcaseItems" :key="item.id" class="showcase-item">
                        <div class="showcase-card">
                            <div class="showcase-image">
                                <img :src="item.imageUrl" :alt="item.title" class="showcase-img" loading="lazy"
                                    decoding="async" fetchpriority="low">
                                <div class="showcase-tag">{{ item.tag }}</div>
                            </div>
                            <div class="showcase-content">
                                <h4 class="showcase-item-title">{{ item.title }}</h4>
                                <p class="showcase-description">{{ item.description }}</p>
                                <button class="consult-btn fs14 pointer" @click="openConsultationDialog">立即咨询</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧滚动按钮 -->
            <button class="scroll-btn scroll-btn-right" @click="scrollRightClick" :disabled="!canScrollRight">
                <svg viewBox="0 0 24 24">
                    <path d="M9 6l6 6-6 6" />
                </svg>
            </button>
        </div>
        <!-- 服务套餐区域 -->
        <!-- <div class="packages-section" v-if="currentConfig?.packages">
            <h2 class="section-title">{{ currentConfig.packagesTitle }}</h2>
            <div class="packages-grid">
                <div class="package-card" v-for="p in currentConfig.packages" :key="p.id">
                    <div class="package-image">
                        <img v-if="p.img" :src="getImageUrl(p.img)" alt="套餐图片" class="package-img">
                        <div v-else class="image-placeholder"></div>
                    </div>
                    <div class="package-content">
                        <h3 class="package-title">{{ p.title }}</h3>
                        <p class="package-description">{{ p.description }}</p>
                        <span class="package-price" v-if="p.price">

                            <i class="package-text">{{ p.currency }} <i class="package-num">{{ p.price }}</i>
                                {{ p.amount }}{{ p.info }}</i>
                        </span>
                        <button class="consult-btn flri" @click="openConsultationDialog">立即咨询</button>
                    </div>
                </div>
            </div>
        </div> -->

        <!-- 服务优势区域 - 轮播图展示 -->
        <!-- <div class="advantages-section">
            <h2 class="section-title">{{ currentConfig?.advantagesTitle }}</h2>
           

        <template v-if="currentConfig?.packagesTitle === '包车服务'">
            <template v-for="advantage in (currentConfig?.advantages || [])" :key="advantage?.id">
                <el-card :class="['car-pics', advantage.carClass || 'car1']">
                    <template #header>{{ advantage.title }}</template>
                    <div class="carousel-container w100">
                        <el-carousel trigger="click" :height="isTablet ? '300px' : '500px'" :interval="5000" type="card"
                            indicator-position="outside" :direction="isMobile ? 'vertical' : 'horizontal'">
                            <el-carousel-item v-for="(url, index) in (advantage.urls || [])" :key="index">
                                <el-image :src="getImageUrl(url, advantage)" :alt="advantage?.title || '车辆详情'"
                                    class="carousel-img w100 h100 pointer" :fit="isTablet ? 'scale-down' : 'contain'"
                                    :preview-src-list="advantage.urls?.map(imgUrl => getImageUrl(imgUrl, advantage))"
                                    :zoom-rate="1.2" :max-scale="7" :min-scale="0.2" show-progress
                                    :initial-index="index" fit="cover" show-close show-toolbar show-index
                                    :preview-teleported="true" :z-index="Z_INDEX.dialog.imagePreview">
                                    <template #toolbar="{ actions, prev, next, reset, activeIndex, setActiveItem }">
                                        <ElIcon @click="prev">
                                            <Back />
                                        </ElIcon>
                                        <ElIcon @click="next">
                                            <Right />
                                        </ElIcon>
                                        <ElIcon @click="actions('zoomOut')">
                                            <ZoomOut />
                                        </ElIcon>
                                        <ElIcon @click="actions('zoomIn')">
                                            <ZoomIn />
                                        </ElIcon>
                                        <el-icon @click="actions('clockwise')">
                                            <RefreshRight />
                                        </el-icon>
                                        <el-icon @click="actions('anticlockwise')">
                                            <RefreshLeft />
                                        </el-icon>
                                    </template>
                                </el-image>
                            </el-carousel-item>
                            <div class="car-price-bottom center w100 fowe7">包车价：{{ advantage.currency }} {{
                                advantage.price }}/日</div>
                        </el-carousel>
                    </div>
                </el-card>
            </template>
        </template>

        <div v-else class="advantages-flex">
            <div class="advantage-item" v-for="a in (currentConfig?.advantages || [])" :key="a?.id">
                <div class="advantage-detail">
                    <div class="advantage-icon">
                        <img v-if="a.url" :src="getImageUrl(a.url)" alt="优势图标" class="advantage-img">
                        <img v-else :src="defaultCarType" alt="默认图标" class="advantage-img">
                    </div>
                    <h3 class="advantage-title">{{ a.title }}</h3>
                    <p class="advantage-description">{{ a.description }}</p>
                </div>
            </div>
        </div>
    </div> -->

        <!-- 服务提示信息 -->
        <!-- <div class="service-tips" v-for="tip in (currentConfig?.tips || [])" :key="tip">
            <div class="tips-icon">⚠️</div>
            <div class="tips-content">
                <h4 class="tips-title">重要提示</h4>
                <p class="tips-text" v-html="tip"></p>
            </div>
        </div> -->

        <section v-if="serviceFaqs.length" class="service-faq">
            <h2 class="section-title">常见问题</h2>
            <el-collapse v-model="serviceFaqOpen" accordion>
                <el-collapse-item v-for="(faq, index) in serviceFaqs" :key="faq.q" :name="String(index)">
                    <template #title>
                        <span class="service-faq-q">{{ faq.q }}</span>
                    </template>
                    <p class="service-faq-a">{{ faq.a }}</p>
                </el-collapse-item>
            </el-collapse>
            <p class="service-faq-links">
                <RouterLink :to="{ path: '/trips/freeinfo', query: { subNavName: '景点' } }">免费参考信息</RouterLink>
                ·
                <RouterLink to="/refund">退款政策</RouterLink>
                ·
                <RouterLink to="/about">关于我们</RouterLink>
            </p>
        </section>

        <!-- 联系方式区域 -->
        <div class="contact-section" v-if="currentConfig?.packagesTitle !== '包车服务' && currentConfig?.contactTitle">
            <h2 class="section-title">{{ currentConfig.contactTitle }}</h2>
            <p class="contact-intro">{{ currentConfig.contactIntro }}</p>
            <div class="contact-info">
                <div class="contact-item"><i class="contact-icon phone-icon"></i><span>(+61)0488 388 188</span></div>
                <div class="contact-item"><i class="contact-icon email-icon"></i><span>tto.advisory@gmail.com</span>
                </div>
                <div class="contact-item"><i class="contact-icon wechat-icon"></i><span>Tasmania Trips(欢迎加微咨询)</span>
                </div>
            </div>
        </div>

        <!-- 咨询弹窗 -->
        <ContactDialog v-model:visible="consultationDialogVisible" source-page="服务展示页"
            :source-module="currentConfig?.packagesTitle === '包车服务' ? '包车服务' : currentConfig?.packagesTitle === '专属定制' ? '专属定制' : currentConfig?.packagesTitle || '服务咨询'"
            source-page-key="service-showcase"
            :source-module-key="currentConfig?.packagesTitle === '包车服务' ? 'charter-service' : currentConfig?.packagesTitle === '专属定制' ? 'custom-service' : 'service-consultation'"
            source-entry-key="" inquiry-type="contact" />

        <!-- 可订购项目详情弹窗 - 使用TripDialog组件 -->
        <TripDialog v-if="orderableDialogVisible" v-model:visible="orderableDialogVisible"
            :title="orderableDialogData.title" :en-title="orderableDialogData.enTitle"
            :banner="orderableDialogData.banner" :trip-type="orderableDialogData.tripType"
            :trip-data="orderableDialogData.tripData" />
    </div>
</template>
<style lang="scss">
.el-carousel__indicators--outside {
    position: sticky;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    width: 100% !important;
    margin: 0 auto !important;
    padding: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    transform: none !important;
}
</style>
<style lang="scss" scoped>
.service-showcase {
    width: 90%;
    margin: 0 auto;
    background: #fff;
    color: #333;
    letter-spacing: 0;
    /* 全局去除字距 */

    .service-load-state {
        padding: 48px 16px;
        text-align: center;
        color: #666;
        font-size: 15px;
    }

    .service-load-error {
        color: #a94442;
    }

    .service-title {
        font-size: 28px;
        color: #111827;
        margin: 0 0 16px 0;
    }

    .top-intro-section {
        text-align: center;
        padding: 40px 20px 30px;

        .top-intro-phone {
            font-size: 26px;
            font-weight: 700;
            color: #111;
            margin: 0 0 8px 0;
        }

        .top-intro-title {
            font-size: 24px;
            font-weight: 700;
            color: #111;
            margin: 0 0 10px 0;
        }

        .top-intro-desc {
            font-size: 12px;
            color: #666;
            margin: 0;
        }
    }

    .hero-section {
        .hero-content {
            display: flex;
            gap: 40px;
            align-items: center;
            flex-direction: column;
        }
    }

    .charter-intro {
        margin-bottom: 60px;

        .charter-content {
            .carousel-container {
                position: relative;

                .carousel-img {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    margin: 0 auto;
                    scale: 1.1;
                }

                .car-price-bottom {
                    position: absolute;
                    bottom: 0;
                    margin-top: 10px;
                    font-size: 18px;
                }
            }
        }

        .charter-main-title {
            font-size: 26px;
            font-weight: 700;
            color: #111;
            margin: 0 0 15px 0;
        }

        .about-us-link {
            color: #33b1a3;
            cursor: pointer;
            text-decoration: underline;
            font-weight: 500;
            transition: color 0.3s;

            &:hover {
                color: #2a9e93;
            }
        }

        .car-info-container {
            border-bottom: 2px solid #33b1a3;
            margin: 30px 0 0;
            padding-bottom: 60px;

            .car-name {
                font-size: 18px;
                font-weight: 700;
                color: #111;
            }

            .car-name-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 20px;

                .car-name {
                    margin: 0;
                    padding-bottom: 0;
                    border-bottom: none;
                }

                .consult-btn-large {
                    padding: 10px 25px;
                    font-weight: 600;
                }
            }

            .car-image {
                font-size: 14px;
                color: #999;
                margin: 0 0 20px 0;
            }
        }
    }

    .steps-box {
        margin-top: 60px;

        .order-now {
            // display: block;
            width: fit-content;
            margin: 20px 0 40px auto;
            font-style: italic;
            color: #555;
            border: 1px solid transparent;
        }

        .order-now:hover {
            color: #2da099;
            border-bottom: 1px solid #2da099;
        }

        // 修改el-steps的title文字大小
        :deep(.el-step__title) {
            font-size: 18px !important;
        }

        :deep(.el-step__desciption) {
            font-size: 13px !important;
        }
    }

    // 可订购项目版块样式
    .orderable-section {
        margin-top: 60px;
        padding: 40px 0;

        .orderable-intro {
            font-size: 16px;
            color: #666;
            text-align: center;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .orderable-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin-top: 20px;
        }

        .orderable-card {
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid #eee;

            &:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            }
        }

        .orderable-image {
            position: relative;
            width: 100%;
            height: 180px;
            overflow: hidden;

            .orderable-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }

            .orderable-tag {
                position: absolute;
                top: 12px;
                right: 12px;
                background: #279486;
                color: #fff;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
            }
        }

        .orderable-content {
            padding: 16px;

            .orderable-title {
                font-size: 16px;
                font-weight: 700;
                color: #333;
                margin-bottom: 8px;
                line-height: 1.4;
            }

            .orderable-description {
                font-size: 13px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 12px;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .orderable-features {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 12px;

                .feature-tag {
                    background: #f0f9f8;
                    color: #279486;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 11px;
                    border: 1px solid #d4e8e5;
                }
            }

            .orderable-price-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-top: 12px;

                .price-info {
                    display: flex;
                    gap: 16px;
                    align-items: flex-end;

                    .price-item {
                        display: flex;
                        align-items: baseline;
                        gap: 6px;

                        .price-label {
                            font-size: 12px;
                            color: #999;
                        }

                        .price-value {
                            display: flex;
                            align-items: baseline;
                            gap: 1px;

                            .price-currency {
                                font-size: 12px;
                                color: #666;
                                font-weight: 500;
                            }

                            .price-num {
                                font-size: 18px;
                                color: #666;
                                font-weight: 700;
                            }

                            .price-unit {
                                font-size: 11px;
                                color: #999;
                            }
                        }

                        &.group {
                            .price-value {

                                .price-currency,
                                .price-num {
                                    color: #279486;
                                }

                                .group-price-num {
                                    font-size: 22px;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    .hero-image {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 20px;
        // flex: 0 0 50%;
        // background-color: #39c5bb;
        /* 直接给容器上色，确保可见 */
        overflow: hidden;
        margin-bottom: 40px;
    }

    .image-placeholder {
        width: 100%;
        height: 398px;
        line-height: 398px;
        background-color: #39c5bb;
        font-size: 30px;
        border-radius: 8px;
    }

    .hero-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .package-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .advantage-img {
        width: 298px;
        height: auto;
    }

    .hero-text {
        flex: 0 0 50%;
    }

    .subtitle {
        // font-size: 28px;
        font-size: 40px;
        font-weight: 700;
        color: #333;
        margin-bottom: 30px;
        letter-spacing: 0;
    }

    .description {
        font-size: 18px;
        line-height: 1.8;
        color: #363030;
        margin-bottom: 24px;
        letter-spacing: 0;
    }

    .features-list {
        display: flex;
        justify-content: space-between;
        padding: 0;
        margin: 0;
    }

    .feature-item {
        display: flex;
        float: none;
        align-items: center;
        margin-bottom: 12px;
        font-size: 14px;
        color: #333;
    }

    .feature-dot {
        width: 18px;
        height: 18px;
        line-height: 18px;
        font-size: 8px;
        background-color: #33b1a3;
        border-radius: 50%;
        margin-right: 5px;
        flex-shrink: 0;
    }

    /* 服务提示样式 - 醒目设计 */
    .service-tips {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border: 2px solid #ffc107;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 40px;
        display: flex;
        align-items: flex-start;
        gap: 15px;
        box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        animation: pulse 3s infinite;
    }

    .service-tips:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(255, 193, 7, 0.3);
    }

    @keyframes pulse {
        0% {
            box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
        }

        50% {
            box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
        }

        100% {
            box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
        }
    }

    .tips-icon {
        font-size: 30px;
        flex-shrink: 0;
    }

    .tips-content {
        flex: 1;
    }

    .tips-title {
        color: #856404;
        font-size: 16px;
        font-weight: bold;
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .tips-text {
        color: #721c24;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
        font-weight: 500;
    }

    .packages-section {
        margin-bottom: 80px;
    }

    .contact-section {
        background-color: #e6f7f6;
        padding: 20px;
        margin-bottom: 60px;
        border-radius: 5px;
    }

    .service-faq {
        width: 100%;
        margin: 0 0 60px;
        padding: 8px 0 0;
    }

    .service-faq :deep(.el-collapse) {
        border: none;
    }

    .service-faq :deep(.el-collapse-item) {
        border-bottom: 1px solid #e5efec;
    }

    .service-faq :deep(.el-collapse-item:last-child) {
        border-bottom: none;
    }

    .service-faq :deep(.el-collapse-item__header),
    .service-faq :deep(.el-collapse-item__wrap) {
        border-bottom: none;
    }

    .service-faq-q {
        font-size: 16px;
        font-weight: 700;
        color: #111;
        white-space: normal;
        line-height: 1.5;
    }

    .service-faq-a {
        margin: 0;
        color: #374151;
        line-height: 1.7;
    }

    .service-faq-links {
        margin: 16px 0 0;
        color: #6b7280;
        font-size: 14px;
    }

    .service-faq-links a {
        color: #1a7a6f;
        font-weight: 700;
        text-decoration: none;
    }

    .section-title {
        // font-size: 26px;
        //font-size: 42px;
        font-size: 22px;
        font-weight: 700;
        color: #111;
        // margin: 0 0 20px 0;
        margin: 20px 0 30px 0;
        // margin-top: 20px;
        letter-spacing: 0;
    }

    .packages-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 60px;
    }

    .package-card {
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 5px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, .1);
        transition: transform .3s, box-shadow .3s;
    }

    .package-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, .15);
    }

    .package-image {
        height: 198px;
    }

    .package-content {
        padding: 24px;

        .package-price {
            .package-num {
                font-size: 22px;
                margin-right: 5px;
            }
        }
    }

    .package-title {
        font-size: 16px;
        font-weight: 700;
        color: #111;
        margin-bottom: 8px;
        letter-spacing: 0;
        text-align: left;
    }

    .package-description {
        font-size: 12px;
        color: #555;
        line-height: 1.6;
        margin-bottom: 16px;
        text-align: left;
    }

    .car-price-bottom {
        position: absolute;
        bottom: 0;
        margin-top: 10px;
        font-size: 18px;
    }

    .advantages-flex {
        // display: flex;
        // justify-content: space-between;
        // justify-content: space-around;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 50px;
    }

    .advantage-item {
        text-align: center;

        .advantage-condition {
            margin-top: 20px
        }
    }

    .advantage-icon {
        // width: 80px;
        // height: 80px;
        // background: #3b82f6;
        // background: url('../assets/img/carType.png') no-repeat center;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;

        img {
            width: 300px;
        }
    }

    .advantage-icon i {
        font-size: 32px;
        color: #fff;
    }

    .advantage-title {
        // font-size: 16px;
        font-size: 25px;
        font-weight: 700;
        color: #111;
        margin-bottom: 8px;
        letter-spacing: 0;
    }

    .advantage-description {
        // font-size: 13px;
        font-size: 20px;
        color: #555;
        line-height: 1.5;
    }

    .contact-intro {
        font-size: 14px;
        color: #555;
        text-align: left;
        margin-bottom: 20px;
    }

    .contact-info {
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-width: 600px;
    }

    .contact-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: #333;
    }

    .contact-icon {
        width: 20px;
        height: 20px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
    }

    .contact-icon.phone-icon {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2333b1a3'%3E%3Cpath d='M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z'/%3E%3C/svg%3E");
    }

    .contact-icon.email-icon {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2333b1a3'%3E%3Cpath d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'/%3E%3C/svg%3E");
    }

    .contact-icon.wechat-icon {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2333b1a3'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3.5-9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'/%3E%3C/svg%3E");
    }

    /* 展示列表样式 */
    .showcase-section {
        margin-top: 60px;
        margin-bottom: 80px;
    }

    .showcase-title {
        font-size: 42px;
        font-weight: 700;
        color: #333;
        margin-bottom: 30px;
        // text-align: center;
    }

    .showcase-scroll-container {
        position: relative;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        padding: 10px 0;
        cursor: grab;
    }

    .showcase-scroll-container:active {
        cursor: grabbing;
    }

    /* 隐藏底部滚动条 */
    .showcase-scroll-container::-webkit-scrollbar {
        display: none;
    }

    /* 左右滚动按钮容器 */
    .showcase-section {
        position: relative;
    }

    /* 滚动按钮样式 */
    .scroll-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #e0e0e0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s ease;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .scroll-btn:hover {
        background: #fff;
        transform: translateY(-50%) scale(1.1);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    }

    .scroll-btn-left {
        left: -20px;
    }

    .scroll-btn-right {
        right: -20px;
    }

    .scroll-btn svg {
        width: 20px;
        height: 20px;
        fill: #33b1a3;
    }

    .scroll-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: translateY(-50%) scale(1);
    }

    .showcase-items-wrapper {
        display: flex;
        gap: 24px;
        min-width: max-content;
        padding: 0 10px;
    }

    .showcase-item {
        flex-shrink: 0;
        width: 320px;
        transition: transform 0.3s ease;
    }

    .showcase-item:hover {
        transform: translateY(-5px);
    }

    .showcase-card {
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.3s ease;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .showcase-card:hover {
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }

    .showcase-image {
        position: relative;
        height: 200px;
        overflow: hidden;
    }

    .showcase-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
    }

    .showcase-card:hover .showcase-img {
        transform: scale(1.05);
    }

    .showcase-tag {
        position: absolute;
        top: 12px;
        left: 12px;
        background: #33b1a3;
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .showcase-content {
        padding: 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .showcase-item-title {
        font-size: 20px;
        font-weight: 700;
        color: #333;
        margin: 0 0 12px 0;
        line-height: 1.4;
    }

    .showcase-description {
        font-size: 14px;
        color: #666;
        line-height: 1.6;
        // margin: 0 0 16px 0;
        flex: 1;
    }

    .showcase-features {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .feature-badge {
        background: #e6f7f6;
        color: #33b1a3;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
    }

    .consult-btn {
        background: #33b1a3;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.3s ease;
        // align-self: flex-start;
    }

    .consult-btn:hover {
        background: #2da099;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(61, 199, 190, 0.4);
    }
}

@media (max-width: 1024px) {
    .service-showcase {
        // .features-list {
        //     display: block;
        // }

        .feature-dot {
            margin-right: 12px;
        }

        .showcase-item {
            width: 280px;
        }

        .showcase-title {
            font-size: 28px;
        }
    }

    .scroll-btn {
        width: 36px;
        height: 36px;
    }

    .scroll-btn-left {
        left: -18px;
    }

    .scroll-btn-right {
        right: -18px;
    }

    .scroll-btn svg {
        width: 18px;
        height: 18px;
    }
}

@media (min-width: 768px) and (max-width: 1024px) {
    .service-showcase {
        padding: 30px 15px;
        margin-top: 20px;

        .orderable-section {
            margin-top: 40px;

            .orderable-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
            }

            .orderable-price-row {
                flex-direction: column;
                align-items: stretch;
                gap: 10px;

                .price-info {
                    width: 100%;
                }

                .consult-btn {
                    align-self: flex-end;
                }
            }
        }

        .advantages-section {
            .advantages-flex {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
            }
        }

        // .showcase-section {
        //     // margin-bottom: 40px;
        // }

        .showcase-items-wrapper {
            gap: 16px;
        }
    }

    // .service-showcase .hero-image {
    //     height: 350px;
    // }

    .service-showcase .subtitle {
        font-size: 22px;
    }

    .service-showcase .packages-grid {
        grid-template-columns: repeat(1, 1fr);
        gap: 20px;
    }
}

@media (max-width: 768px) {
    .service-showcase {
        // padding: 20px 15px;
        padding: 0 15px 20px;

        // margin-top: 20px;

        .steps-box,
        .advantages-section {
            margin-top: 20px;
        }

        .orderable-section {
            margin-top: 30px;
            padding: 20px 0;

            .orderable-intro {
                font-size: 14px;
                margin-bottom: 20px;
            }

            .orderable-grid {
                grid-template-columns: repeat(1, 1fr);
                gap: 16px;
            }

            .orderable-card {
                .orderable-image {
                    height: 160px;
                }

                .orderable-content {
                    padding: 12px;

                    .orderable-title {
                        font-size: 15px;
                    }

                    .orderable-description {
                        font-size: 12px;
                    }

                    .orderable-features {
                        gap: 6px;

                        .feature-tag {
                            font-size: 10px;
                            padding: 2px 6px;
                        }
                    }

                    .orderable-price-row {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 10px;

                        .price-info {
                            width: 100%;
                            gap: 12px;
                            align-items: flex-end;

                            .price-item {
                                gap: 4px;

                                .price-num {
                                    font-size: 18px;
                                }

                                .group-price-num {
                                    font-size: 20px;
                                }
                            }
                        }

                        .consult-btn {
                            align-self: flex-end;
                        }
                    }
                }
            }
        }

        .advantages-section {
            .advantages-flex {
                display: grid;
                grid-template-columns: repeat(1, 1fr);

                img {
                    width: 260px;
                }
            }
        }

        .showcase-section {
            // margin-bottom: 30px;
            padding-left: 20px;
            padding-right: 20px;
        }

        .showcase-title {
            font-size: 24px;
            margin-bottom: 20px;
        }

        .showcase-item {
            width: 260px;
        }

        .showcase-card {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .showcase-content {
            padding: 16px;
        }

        .showcase-item-title {
            font-size: 18px;
        }

        .showcase-description {
            font-size: 13px;
        }
    }

    // 移动设备上的滚动按钮样式
    .scroll-btn {
        width: 32px;
        height: 32px;
    }

    .scroll-btn-left {
        left: 0;
    }

    .scroll-btn-right {
        right: 0;
    }

    .scroll-btn svg {
        width: 16px;
        height: 16px;
    }

    .service-showcase .features-list {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
    }

    .service-showcase .hero-content {
        // flex-direction: column;
        gap: 20px;
    }

    .service-showcase .hero-image {
        // width: 100%;
        // height: 250px;
        // flex: none;
        grid-template-columns: repeat(1, 1fr);
    }

    .service-showcase .subtitle {
        font-size: 22px;
        text-align: center;
    }

    .service-showcase .description {
        font-size: 14px;
        text-align: center;
    }

    .service-showcase .packages-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }
}

@media (max-width: 375px) {
    .service-showcase {
        padding: 15px 10px;
        margin-top: 20px;

        .showcase-item {
            width: 240px;
        }

        .showcase-image {
            height: 160px;
        }

        .showcase-features {
            gap: 6px;
        }

        .feature-badge {
            font-size: 11px;
            padding: 3px 10px;
        }
    }

    // .service-showcase .hero-image {
    // height: 200px;
    // }

    .service-showcase .section-title {
        font-size: 22px;
    }
}
</style>
