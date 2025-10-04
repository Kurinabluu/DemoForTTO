<script setup>
import { computed, ref } from 'vue'
import ContactDialog from './ContactDialog.vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    title: { type: String, default: '塔斯马尼亚一日游' },
    banner: { type: String, default: '' },
})

const emit = defineEmits(['update:visible'])

const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
})

const contactDialogVisible = ref(false)

const openContactDialog = () => {
    contactDialogVisible.value = true
}

// 景点一日游弹窗数据
const scenicDayTripDialogData = {
    '菲欣拿国家公园一日游': {
        route: '菲欣拿国家公园生态探索之旅',
        desc: '探索塔斯马尼亚最古老的国家公园，体验原始雨林、瀑布和丰富的野生动物。',
        features: [
            { icon: '#22c55e', title: '雨林徒步', desc: '漫步于古老的温带雨林中，感受千年古树的魅力' },
            { icon: '#3b82f6', title: '瀑布观景', desc: '欣赏壮观的罗素瀑布和马蹄瀑布' },
            { icon: '#f59e0b', title: '野生动物', desc: '观察袋鼠、袋熊等澳洲特有动物' }
        ],
        tags: ['全程约6小时', '含专业导游', '霍巴特出发', '中英文讲解']
    },
    '摇篮山一日游': {
        route: '摇篮山国家公园一日游',
        desc: '探访世界遗产摇篮山，体验高山湖泊、原始森林和壮丽山景。',
        features: [
            { icon: '#22c55e', title: '多芬湖环游', desc: '乘坐游船环游多芬湖，欣赏倒影山景' },
            { icon: '#3b82f6', title: '高山徒步', desc: '挑战摇篮山步道，俯瞰塔斯马尼亚全景' },
            { icon: '#f59e0b', title: '自然摄影', desc: '捕捉塔斯马尼亚最经典的自然风光' }
        ],
        tags: ['全程约8小时', '含午餐', '朗塞斯顿出发', '专业摄影指导']
    }
    // ... 其他景点一日游数据
}

// 主题一日游弹窗数据
const themeDayTripDialogData = {
    '美食美酒之旅': {
        route: '塔玛谷美食美酒探索之旅',
        desc: '探访塔斯马尼亚著名的葡萄酒产区，品尝当地美酒和特色美食。',
        features: [
            { icon: '#22c55e', title: '酒庄参观', desc: '参观精品酒庄了解酿酒工艺' },
            { icon: '#3b82f6', title: '品酒体验', desc: '品尝多种塔斯马尼亚特色葡萄酒' },
            { icon: '#f59e0b', title: '美食搭配', desc: '学习葡萄酒与当地美食的完美搭配' }
        ],
        tags: ['全程约6小时', '含品酒费', '朗塞斯顿出发', '美食专家']
    },
    '野生动物探寻': {
        route: '塔斯马尼亚野生动物观察之旅',
        desc: '专为野生动物爱好者设计，近距离观察塔斯马尼亚独有的野生动物和鸟类。',
        features: [
            { icon: '#22c55e', title: '夜间观察', desc: '在专业向导带领下夜间观察野生动物' },
            { icon: '#3b82f6', title: '塔斯马尼亚恶魔', desc: '近距离观察濒危的塔斯马尼亚恶魔' },
            { icon: '#f59e0b', title: '小企鹅归巢', desc: '观赏小企鹅傍晚归巢的可爱场景' }
        ],
        tags: ['全程约8小时', '含保护区门票', '多个出发地', '野生动物专家']
    }
    // ... 其他主题一日游数据
}

// 定制一日游弹窗数据
const customDayTripDialogData = {
    '家庭亲子定制游': {
        route: '家庭亲子专属定制行程',
        desc: '专为家庭设计的亲子行程，包含适合各年龄段儿童的互动体验和安全活动。',
        features: [
            { icon: '#22c55e', title: '儿童活动', desc: '安排适合儿童的趣味互动活动' },
            { icon: '#3b82f6', title: '安全第一', desc: '全程注重儿童安全和舒适度' },
            { icon: '#f59e0b', title: '教育体验', desc: '在游玩中学习自然和历史知识' }
        ],
        tags: ['灵活时长', '儿童专属活动', '安全车辆', '亲子专家']
    },
    '情侣浪漫定制游': {
        route: '情侣浪漫专属定制行程',
        desc: '为情侣量身定制的浪漫之旅，包含私密观景点和特色餐饮体验。',
        features: [
            { icon: '#22c55e', title: '私密景点', desc: '安排人少景美的私密观景点' },
            { icon: '#3b82f6', title: '浪漫餐饮', desc: '精心安排浪漫的餐饮体验' },
            { icon: '#f59e0b', title: '专业摄影', desc: '为情侣记录美好旅行时光' }
        ],
        tags: ['私密行程', '浪漫体验', '专业跟拍', '定制餐饮']
    }
    // ... 其他定制一日游数据
}

// 根据一日游标题获取对应的路线信息
const getDayTripRouteInfo = (title) => {
    // 检查是否在景点一日游数据中
    if (scenicDayTripDialogData[title]) {
        return scenicDayTripDialogData[title]
    }
    // 检查是否在主题一日游数据中
    if (themeDayTripDialogData[title]) {
        return themeDayTripDialogData[title]
    }
    // 检查是否在定制一日游数据中
    if (customDayTripDialogData[title]) {
        return customDayTripDialogData[title]
    }

    // 默认返回通用信息
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
const routeInfo = computed(() => getDayTripRouteInfo(props.title))
</script>

<template>
    <el-dialog v-model="dialogVisible" :show-close="true" width="980px" class="tour-dialog" align-center :z-index="9500"
        :append-to-body="true" :lock-scroll="true">
        <template #header>
            <div class="dlg-title">{{ title }}</div>
        </template>

        <div class="dlg-banner">
            <img :src="banner" alt="banner" />
        </div>

        <div class="dlg-section">
            <div class="section-title">推荐路线：{{ routeInfo.route }}</div>
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
                <el-button type="primary" size="large" @click="openContactDialog">立刻咨询此行程</el-button>
            </div>
        </template>
    </el-dialog>

    <!-- 联系方式弹窗 -->
    <ContactDialog v-model:visible="contactDialogVisible" />
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
}
</style>
