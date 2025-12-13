<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
// Element Plus已在main.js中全局注册
import { ElIcon } from 'element-plus'
import { Back, Right, ZoomOut, ZoomIn, RefreshRight, RefreshLeft, Refresh } from '@element-plus/icons-vue'
import ContactDialog from '@/components/ContactDialog.vue'
import dataJson from '@/data/data.json'
// 从data.json中获取私人定制服务的数据
const privateCustomService = dataJson.find(item => item.tagName === '私人定制')
const showcaseDataFromJson = privateCustomService?.serviceConfig?.showcaseData || []

// 接收配置（保持向后兼容）
const props = defineProps({
    config: { type: Object, default: null },
    serviceName: { type: String, default: '代订门票及旅游项目' }
})

// 响应式检测屏幕宽度，用于移动端适配
const screenWidth = ref(window.innerWidth)
// const isMobile = computed(() => screenWidth.value <= 768) 
const isMobile = computed(() => screenWidth.value <= 820)
const isTablet = computed(() => screenWidth.value <= 1024)

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

// 从data.json获取isTrip为false的服务数据
const getServiceData = () => {
    try {
        if (!dataJson) return null
        const services = dataJson.filter(item => item.isTrip === false)
        return services || []
    } catch (error) {
        return []
    }
}

// 根据服务名称获取特定服务数据
const getServiceByName = (serviceName) => {
    const services = getServiceData()
    return services.find(service => service.tagName === serviceName)
}

// 注释掉之前的动态导入函数，使用require方式替代


// 直接使用静态导入，这是Vue 3 + Vite中最可靠的方式
// 导入所有需要的图片，使用@别名
import car1FrontRight from '@/assets/img/carService/car1_front_right.jpg';
import car1Right from '@/assets/img/carService/car1_right.jpg';
import car1Inside from '@/assets/img/carService/car1_inside.jpg';
import car1InsideTop from '@/assets/img/carService/car1_inside_top.jpg';
import car1InsideBack from '@/assets/img/carService/car1_inside_back.jpg';
import car1BackWithSpace from '@/assets/img/carService/car1_back_with_space.jpg';
import car1BackWithNoSpace from '@/assets/img/carService/car1_back_with_no_space.jpg';
// import car2CarType from '@/assets/img/carService/car2_carType.png';
import carType from '@/assets/img/carService/carType.png';
import defaultCarType from '@/assets/img/carService/carType.png';
// 导入私人定制服务的图片
import startFromZero from '@/assets/img/startFromZero.png';
import capable from '@/assets/img/capable.png';
import createFreely from '@/assets/img/createFreely.png';
import finalPlan from '@/assets/img/finalPlan.png';
// 导入car2的所有图片
import car2Left from '@/assets/img/carService/car2_left.jpg';
import car2FrontLeft from '@/assets/img/carService/car2_front_left.jpg';
import car2LeftOpen from '@/assets/img/carService/car2_left_open.jpg';
import car2Inside from '@/assets/img/carService/car2_inside.jpg';
import car2InsideTop from '@/assets/img/carService/car2_inside_top.jpg';
import car2BackRight from '@/assets/img/carService/car2_back_right.jpg';
import car2Back from '@/assets/img/carService/car2_back.jpg';

// 创建图片映射表
const carImagesMap = {
    'car1_front_right.jpg': car1FrontRight,
    'car1_right.jpg': car1Right,
    'car1_inside.jpg': car1Inside,
    'car1_inside_top.jpg': car1InsideTop,
    'car1_inside_back.jpg': car1InsideBack,
    'car1_back_with_space.jpg': car1BackWithSpace,
    'car1_back_with_no_space.jpg': car1BackWithNoSpace,
    'carType.png': defaultCarType,
    // car2的图片映射
    'car2_left.jpg': car2Left,
    'car2_front_left.jpg': car2FrontLeft,
    'car2_left_open.jpg': car2LeftOpen,
    'car2_inside.jpg': car2Inside,
    'car2_inside_top.jpg': car2InsideTop,
    'car2_back_right.jpg': car2BackRight,
    'car2_back.jpg': car2Back,
    // 私人定制服务的图片映射
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

    // 完整URL直接返回
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // 从映射表中获取图片，如果不存在则返回默认图片
    const image = carImagesMap[imagePath];
    return image || defaultCarType;
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

// 使用从data.json获取的数据，如果没有则使用默认的mock数据
const mockShowcaseData = showcaseDataFromJson.length > 0 ? showcaseDataFromJson : [
    {
        id: 1,
        title: '家庭亲子定制游111',
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
    },
    {
        id: 6,
        title: '特殊需求定制',
        description: '专为有特殊需求的游客设计的行程，包含无障碍设施和特殊饮食安排。',
        image: 'https://picsum.photos/seed/special/400/300',
        features: ['无障碍设施', '特殊饮食', '贴心服务'],
        tag: '个性化服务'
    }
]

// 初始化展示列表数据
const initShowcaseData = () => {
    // 优先使用currentConfig中的showcaseData，如果存在且有内容
    const dataToUse = currentConfig?.showcaseData && currentConfig.showcaseData.length > 0
        ? currentConfig.showcaseData
        : mockShowcaseData;

    showcaseItems.value = dataToUse.map(item => ({
        ...item,
        imageUrl: getImageUrl(item.image)
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

// 获取服务数据的函数
const loadServiceData = (serviceName) => {
    if (serviceName) {
        const data = getServiceByName(serviceName)
        if (data) {
            serviceData.value = data
            currentServiceName.value = data.tagName
        }
    }
}

// 组件挂载时获取数据
onMounted(() => {
    // 优先使用传入的serviceName
    if (props.serviceName) {
        loadServiceData(props.serviceName)
    } else if (props.config?.serviceName) {
        // 如果有传入的config，尝试根据serviceName获取对应数据
        loadServiceData(props.config.serviceName)
    }

    // 初始化展示数据
    initShowcaseData()

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
    // 移除滚动事件监听器
    if (scrollContainerRef.value) {
        scrollContainerRef.value.removeEventListener('scroll', onScroll)
    }
})

// 监听serviceName变化，重新加载数据
watch(() => props.serviceName, (newServiceName) => {
    if (newServiceName) {
        loadServiceData(newServiceName)
    }
})
</script>

<template>
    <div class="service-showcase">
        <!-- 顶部服务标题（左上角） -->
        <!-- <h1 class="service-title fowe7" v-if="titleText">{{ titleText }}</h1> -->
        <!-- 主要服务介绍区域 -->
        <div class="hero-section">
            <div class="hero-content">

                <div class="hero-text w100">
                    <h2 class="subtitle center">{{ currentConfig?.heroTitle }}</h2>
                    <p class="description center">{{ currentConfig?.heroDesc }}</p>
                    <ul class="features-list">
                        <li class="feature-item" v-for="(f, i) in currentConfig?.features" :key="i">
                            <span class="feature-dot center fff fowe7">√</span>
                            {{ f }}
                        </li>
                    </ul>
                </div>
                <!-- <div class="hero-image w100">
                    <div class="image-placeholder center fff fowe7" v-for="text in currentConfig?.imgText">{{ text }}
                    </div>

                </div> -->

                <!-- 横向自动播放展示列表 -->
                <div v-if="currentConfig?.showcaseData && currentConfig.showcaseData.length > 0"
                    class="showcase-section w100">
                    <h3 v-if="currentConfig?.showcaseTitle" class="showcase-title center">{{ currentConfig.showcaseTitle
                    }}</h3>

                    <!-- 左侧滚动按钮 -->
                    <button class="scroll-btn scroll-btn-left" @click="scrollLeftClick" :disabled="!canScrollLeft">
                        <svg viewBox="0 0 24 24">
                            <path d="M15 6l-6 6 6 6" />
                        </svg>
                    </button>

                    <!-- 滚动容器 -->
                    <div ref="scrollContainerRef" class="showcase-scroll-container"
                        @mouseenter="handleUserInteraction(true)" @mousedown="startDrag" @mousemove="drag"
                        @mouseup="endDrag" @mouseleave="endDrag" @touchstart="startDrag" @touchmove="drag"
                        @touchend="endDrag" @touchcancel="endDrag" @selectstart.prevent @dragstart.prevent>
                        <div class="showcase-items-wrapper">
                            <div v-for="item in showcaseItems" :key="item.id" class="showcase-item">
                                <div class="showcase-card">
                                    <div class="showcase-image">
                                        <img :src="item.imageUrl" :alt="item.title" class="showcase-img">
                                        <div class="showcase-tag">{{ item.tag }}</div>
                                    </div>
                                    <div class="showcase-content">
                                        <h4 class="showcase-item-title">{{ item.title }}</h4>
                                        <p class="showcase-description">{{ item.description }}</p>
                                        <button class="consult-btn" @click="openConsultationDialog">立即咨询</button>
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
            </div>
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
        <div class="advantages-section">
            <h2 class="section-title center">{{ currentConfig?.advantagesTitle }}</h2>

            <template v-if="currentConfig?.packagesTitle === '包车服务'">
                <template v-for="advantage in (currentConfig?.advantages || [])" :key="advantage?.id">
                    <el-card :class="advantage.carClass || 'car1'">
                        <template #header>{{ advantage.title }}</template>
                        <div class="carousel-container w100">
                            <el-carousel trigger="click" :height="isTablet ? '300px' : '500px'" :interval="5000"
                                type="card" indicator-position="outside"
                                :direction="isMobile ? 'vertical' : 'horizontal'">
                                <el-carousel-item v-for="(url, index) in (advantage.urls || [])" :key="index">
                                    <el-image :src="getImageUrl(url, advantage)" alt="车辆详情"
                                        class="carousel-img w100 h100 pointer"
                                        :fit="isTablet ? 'scale-down' : 'contain'"
                                        :preview-src-list="advantage.urls?.map(imgUrl => getImageUrl(imgUrl, advantage))"
                                        :zoom-rate="1.2" :max-scale="7" :min-scale="0.2" show-progress
                                        :initial-index="index" fit="cover" show-close show-toolbar show-index
                                        :preview-teleported="true" :z-index="9888">
                                        <!-- 在保留原有工具栏功能的基础上添加左右切换按钮 -->
                                        <template #toolbar="{ actions, prev, next, reset, activeIndex, setActiveItem }">
                                            <!-- 新增左右切换按钮 -->
                                            <ElIcon @click="prev">
                                                <Back />
                                            </ElIcon>
                                            <ElIcon @click="next">
                                                <Right />
                                            </ElIcon>

                                            <!-- 保留原始工具栏功能 -->
                                            <ElIcon @click="actions('zoomOut')">
                                                <ZoomOut />
                                            </ElIcon>
                                            <ElIcon @click="actions('zoomIn')">
                                                <ZoomIn />
                                            </ElIcon>
                                            <!-- 修改旋转按钮的实现方式 -->
                                            <el-icon @click="
                                                actions('clockwise')
                                                ">
                                                <RefreshRight />
                                            </el-icon>
                                            <el-icon @click="actions('anticlockwise')">
                                                <RefreshLeft />
                                            </el-icon>
                                            <!-- <ElIcon @click="reset">
                                                <Refresh />
                                            </ElIcon> -->
                                        </template>
                                    </el-image>
                                </el-carousel-item>
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
                    <!-- <div class="advantage-condition" v-if="a.conTitle">
                        <div class="advantage-icon">
                            <img v-if="a.conUrl" :src="getImageUrl(a.conUrl)" alt="条件图标" class="advantage-img">
                            <img v-else src="@/assets/img/carService/condition.png" alt="默认条件图标" class="advantage-img">
                        </div>
                        <h3 class="advantage-title">{{ a.conTitle }}</h3>
                        <p class="advantage-description">{{ a.conDes }}</p>
                    </div> -->
                </div>
            </div>
        </div>

        <!-- 服务提示信息 -->
        <div class="service-tips" v-if="currentConfig?.tips">
            <div class="tips-icon">⚠️</div>
            <div class="tips-content">
                <h4 class="tips-title">重要提示</h4>
                <p class="tips-text" v-html="currentConfig.tips"></p>
            </div>
        </div>

        <!-- 联系方式区域 -->
        <div class="contact-section" v-if="currentConfig?.contactTitle">
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
        <ContactDialog v-model:visible="consultationDialogVisible" />
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

    .service-title {
        font-size: 30px;
        color: #111827;
        margin: 0 0 16px 0;
    }

    .hero-content {
        display: flex;
        gap: 40px;
        align-items: center;
        flex-direction: column;

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
        height: 400px;
        line-height: 400px;
        background-color: #39c5bb;
        font-size: 32px;
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
        width: 300px;
        height: auto;
    }

    .hero-text {
        flex: 0 0 50%;
    }

    .subtitle {
        // font-size: 28px;
        font-size: 42px;
        font-weight: 700;
        color: #333;
        margin-bottom: 30px;
        letter-spacing: 0;
    }

    .description {
        font-size: 20px;
        line-height: 1.8;
        color: #444;
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
        font-size: 16px;
        color: #333;
    }

    .feature-dot {
        width: 20px;
        height: 20px;
        line-height: 20px;
        font-size: 10px;
        background-color: #3dc7be;
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
        font-size: 32px;
        flex-shrink: 0;
    }

    .tips-content {
        flex: 1;
    }

    .tips-title {
        color: #856404;
        font-size: 18px;
        font-weight: bold;
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .tips-text {
        color: #721c24;
        font-size: 16px;
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

    .section-title {
        // font-size: 26px;
        font-size: 42px;
        font-weight: 700;
        color: #111;
        // margin: 0 0 20px 0;
        margin: 0 0 30px 0;
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
        height: 200px;
    }

    .package-content {
        padding: 24px;

        .package-price {
            .package-num {
                font-size: 24px;
                margin-right: 5px;
            }
        }
    }

    .package-title {
        font-size: 18px;
        font-weight: 700;
        color: #111;
        margin-bottom: 8px;
        letter-spacing: 0;
        text-align: left;
    }

    .package-description {
        font-size: 14px;
        color: #555;
        line-height: 1.6;
        margin-bottom: 16px;
        text-align: left;
    }

    .consult-btn {
        padding: 5px 20px;
        background: #3dc7be;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color .3s;
        margin-bottom: 20px;
    }

    .consult-btn:hover {
        background: #2da099;
    }

    .advantages-section {
        margin-bottom: 40px;
        margin-top: 60px;

        .car2 {
            margin-top: 60px;
        }

        .carousel-container {
            // width: 100%;
            // max-width: 800px;
            margin: 0 auto;

            /* 增强预览体验的样式 */
            :deep(.el-image__inner) {
                transition: transform 0.3s ease;
            }

            :deep(.el-image:hover .el-image__inner) {
                transform: scale(1.05);
            }
        }

        .carousel-img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            margin: 0 auto;
        }

    }

    .advantages-flex {
        // display: flex;
        // justify-content: space-between;
        // justify-content: space-around;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 30px;
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
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233dc7be'%3E%3Cpath d='M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z'/%3E%3C/svg%3E");
    }

    .contact-icon.email-icon {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233dc7be'%3E%3Cpath d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'/%3E%3C/svg%3E");
    }

    .contact-icon.wechat-icon {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233dc7be'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3.5-9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'/%3E%3C/svg%3E");
    }

    /* 展示列表样式 */
    .showcase-section {
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
        fill: #3dc7be;
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
        background: #3dc7be;
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
        color: #3dc7be;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
    }

    .consult-btn {
        background: #3dc7be;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 16px;
        margin-bottom: 0;
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
        font-size: 24px;
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
