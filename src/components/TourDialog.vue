<script setup>
import { computed, ref } from 'vue'
import ContactDialog from './ContactDialog.vue'
import dataJson from '@/data/data.json'
import { InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    title: { type: String, default: '塔斯马尼亚一日游' },
    enTitle: { type: String, default: 'Tasmania Day Trip' },
    banner: { type: String, default: '' },
    tripType: { type: String, default: '一日游' }, // 添加tripType属性来区分一日游和多日游
    tripData: { type: Object, default: () => ({}) }, // 添加tripData属性来接收完整的行程数据

})

// 响应式检测屏幕宽度，用于移动端适配
const screenWidth = ref(window.innerWidth)
// const isMobile = computed(() => screenWidth.value <= 768) 
const isMobile = computed(() => screenWidth.value <= 820)//100%
const isTablet = computed(() => screenWidth.value <= 1200)//80%
const isPhone = computed(() => screenWidth.value <= 767)//改变弹窗内容的样式

// 监听窗口大小变化
window.addEventListener('resize', () => {
    screenWidth.value = window.innerWidth
})

// 处理图片URL的函数
const getImageUrl = (imagePath) => {
    if (!imagePath) return ''

    // 如果已经是完整的URL，直接返回
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
        return imagePath
    }

    // 如果是@/assets路径，使用import.meta.url处理
    if (imagePath.startsWith('@/assets/')) {
        try {
            return new URL(imagePath.replace('@/', '../'), import.meta.url).href
        } catch (error) {
            console.warn('图片路径处理失败:', imagePath, error)
            return ''
        }
    }

    // 其他情况直接返回
    return imagePath
}

// 计算处理后的banner图片URL
const bannerUrl = computed(() => getImageUrl(props.banner))

const emit = defineEmits(['update:visible'])

const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
})

const contactDialogVisible = ref(false)
const infoDialogVisible = ref(false)

const openContactDialog = () => {
    contactDialogVisible.value = true
}

const openInfoDialog = () => {
    infoDialogVisible.value = true
}

// 从data.json中获取行程信息
const getTripRouteInfo = (title, tripType) => {
    try {
        // 确保title和dataJson已声明且不为空
        if (!title || !dataJson || !Array.isArray(dataJson)) {
            return getDefaultTripInfo(title)
        }

        // 如果是多日游，从多日游数据中查找
        if (tripType === '多日游') {
            const multiDaySection = dataJson.find(item => item?.tagName === '多日游（固定行程）')
            const tripItem = multiDaySection?.tripConfig?.find(item => item?.title === title)
            if (tripItem?.tripData) {
                return tripItem.tripData
            }
        }

        // 否则从一日游数据中查找
        const dayTripSection = dataJson.find(item => item?.tagName === '一日游（固定行程）')
        if (dayTripSection?.subNav && Array.isArray(dayTripSection.subNav)) {
            // 遍历所有一日游子导航
            for (const subNav of dayTripSection.subNav) {
                if (subNav?.items && Array.isArray(subNav.items)) {
                    const tripItem = subNav.items.find(item => item?.title === title)
                    if (tripItem?.tripData) {
                        return tripItem.tripData
                    }
                }
            }
        }

        // 默认返回通用信息
        return getDefaultTripInfo(title)
    } catch (error) {
        console.error('获取行程信息失败:', error)
        return getDefaultTripInfo(title)
    }
}

// 获取默认行程信息
function getDefaultTripInfo(title = '未知行程') {
    return {
        route: `${title}探索之旅`,
        desc: `深度探索${title}的自然美景和文化内涵，体验塔斯马尼亚独特的魅力。`,
        features: [
            { icon: '#22c55e', title: '自然探索', desc: '深入了解当地的自然环境和生态系统' },
            { icon: '#3b82f6', title: '文化体验', desc: '感受塔斯马尼亚的历史文化' },
            { icon: '#f59e0b', title: '摄影记录', desc: '记录美好的旅行时光' }
        ],
        tags: ['全程约6小时', '含专业导游', '灵活出发', '中英文服务']
    }
}

// 计算路线信息
const routeInfo = computed(() => {
    // 如果传入了tripData，优先使用传入的数据
    if (props.tripData && Object.keys(props.tripData).length > 0) {
        return props.tripData;
    }
    // 否则使用原有的查找逻辑
    return getTripRouteInfo(props.title, props.tripType);
})
</script>

<template>
    <el-dialog v-model="dialogVisible" :show-close="true" width="980px" class="tour-dialog" align-center :z-index="9500"
        :append-to-body="true" :lock-scroll="true">
        <template #header>
            <div class="dlg-title">{{ title }}（{{ enTitle }}）</div>
        </template>

        <div class="dlg-banner" v-if="bannerUrl">
            <img :src="bannerUrl" alt="banner" />
        </div>

        <div class="dlg-section">
            <div class="section-title" v-if="routeInfo.route">{{ routeInfo.route }}</div>
            <div class="section-desc">
                {{ routeInfo.desc }}
            </div>

            <div class="feature-grid">
                <div class="feature-card" v-for="(feature, index) in routeInfo.features" :key="index">
                    <div class="icon" :style="{ background: feature.icon }"></div>
                    <div class="f-title">{{ feature.title }}</div>
                    <div class="f-desc">{{ feature.desc }}</div>
                </div>
            </div>
            <div class="tag-row">
                <span class="mini-tag" v-for="(tag, index) in routeInfo.tags" :key="index">{{ tag }}</span>
            </div>
        </div>

        <template #footer>
            <div class="dlg-footer">
                <div class="info-disclaimer" @click="routeInfo.source ? openInfoDialog() : null">
                    <!-- <span class="warning-icon">!</span> -->
                    <el-icon class="info-icon">
                        <InfoFilled />
                    </el-icon>
                    <template v-if="routeInfo.source">
                        本页信息来源：{{ routeInfo.source[0].desc }}
                    </template>
                    <template v-else>
                        本页信息来源：TasTrips.Online
                    </template>
                </div>
                <el-button type="primary" size="large" @click="openContactDialog">立刻咨询此行程</el-button>
            </div>
        </template>
    </el-dialog>

    <!-- 联系方式弹窗 -->
    <ContactDialog v-model:visible="contactDialogVisible" />

    <!-- 信息来源弹窗 -->
    <el-dialog v-model="infoDialogVisible" :z-index="9999" :append-to-body="true" title="信息参考来源" align-center
        :width="isMobile ? '100%' : '80%'" class="source-dia">
        <!-- <template v-if="!isPhone"> -->
        <el-table :data="tripData.source" border>
            <el-table-column prop="title" label="条目/文章标题" :width="isPhone ? '160' : '200'" />
            <el-table-column prop="desc" label="来源名称" :width="isPhone ? '160' : '200'" />
            <!-- <el-table-column prop="url" label="永久链接" /> -->
            <!-- <el-table-column prop="url" label="永久链接" fixed="right"> -->
            <el-table-column prop="url" label="永久链接" :width="isPhone ? '360' : ''">
                <template #default="scope">
                    <el-link :href="scope.row.url" target="_blank">{{ scope.row.url }}</el-link>
                </template>
            </el-table-column>
        </el-table>
        <!-- </template> -->
    </el-dialog>


</template>

<style lang="scss" scoped>
.tour-dialog {
    :deep(.el-dialog__header) {
        margin-right: 0;
        padding: 16px 20px 12px;
        border-bottom: 1px solid #f2f4f8;
    }

    :deep(.el-dialog__body) {
        padding: 0 0 8px 0;
    }


}

.dlg-title {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #111827;
}

.dlg-banner {
    width: 100%;
    height: 220px;
    // overflow: hidden;

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.dlg-section {
    padding: 18px 20px 10px;
    letter-spacing: normal;
    text-align: left;
}

.section-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #1f2937;
}

.section-desc {
    line-height: 1.8;
    color: #4b5563;
    margin-bottom: 16px;
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
    // box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
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
}

.tag-row {
    letter-spacing: normal;
    margin-top: 20px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.mini-tag {
    background: #f3f4f6;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    color: #374151;
}

.dlg-footer {
    padding: 0 12px 12px;
    position: relative;
}

.info-disclaimer {
    position: absolute;
    bottom: 12px;
    left: 12px;
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        text-decoration: underline;
    }

    .info-icon {
        color: #9ca3af;
        font-size: 14px;
        transition: all 0.2s;
    }

    &:hover .info-icon {
        color: #6b7280;
    }
}

.warning-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: #f3f4f6;
    color: #9ca3af;
    font-size: 10px;
    font-weight: bold;
    line-height: 1;
}

/* 确保按钮不被提示文字遮挡 */
.dlg-footer .el-button {
    margin-top: 24px;
}

.source-list {
    // list-style: disc;
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 15px;
}

@media (max-width: 768px) {
    .feature-grid {
        grid-template-columns: repeat(1, 1fr);
    }

    .info-disclaimer {
        position: relative;
        bottom: 0;
    }
}
</style>
