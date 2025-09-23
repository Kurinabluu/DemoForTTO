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

// 根据景点名称生成对应的路线信息
const getRouteInfo = (title) => {
    const routeMap = {
        '菲欣拿国家公园': {
            route: '菲欣拿国家公园生态探索之旅',
            desc: '探索塔斯马尼亚最古老的国家公园，体验原始雨林、瀑布和丰富的野生动物。',
            features: [
                { icon: '#22c55e', title: '雨林徒步', desc: '漫步于古老的温带雨林中，感受千年古树的魅力' },
                { icon: '#3b82f6', title: '瀑布观景', desc: '欣赏壮观的罗素瀑布和马蹄瀑布' },
                { icon: '#f59e0b', title: '野生动物', desc: '观察袋鼠、袋熊等澳洲特有动物' }
            ],
            tags: ['全程约6小时', '含专业导游', '霍巴特出发', '中英文讲解']
        },
        '摇篮山': {
            route: '摇篮山国家公园一日游',
            desc: '探访世界遗产摇篮山，体验高山湖泊、原始森林和壮丽山景。',
            features: [
                { icon: '#22c55e', title: '多芬湖环游', desc: '乘坐游船环游多芬湖，欣赏倒影山景' },
                { icon: '#3b82f6', title: '高山徒步', desc: '挑战摇篮山步道，俯瞰塔斯马尼亚全景' },
                { icon: '#f59e0b', title: '自然摄影', desc: '捕捉塔斯马尼亚最经典的自然风光' }
            ],
            tags: ['全程约8小时', '含午餐', '朗塞斯顿出发', '专业摄影指导']
        },
        '火焰湾': {
            route: '火焰湾海岸风光之旅',
            desc: '探索塔斯马尼亚东海岸的红色花岗岩海岸，感受大自然的鬼斧神工。',
            features: [
                { icon: '#22c55e', title: '海岸徒步', desc: '沿着火焰湾海岸线徒步，欣赏红色岩石奇观' },
                { icon: '#3b82f6', title: '海滩探索', desc: '探访隐秘的海滩和海湾' },
                { icon: '#f59e0b', title: '日落观景', desc: '在最佳观景点欣赏海上日落' }
            ],
            tags: ['全程约7小时', '含下午茶', '圣海伦斯出发', '专业导游']
        },
        '酒杯湾': {
            route: '酒杯湾经典一日游',
            desc: '探访世界十大最美海滩之一的酒杯湾，体验白色沙滩和清澈海水。',
            features: [
                { icon: '#22c55e', title: '观景台徒步', desc: '徒步至酒杯湾观景台，俯瞰完美弧形海滩' },
                { icon: '#3b82f6', title: '海滩休闲', desc: '在酒杯湾海滩享受阳光和海水' },
                { icon: '#f59e0b', title: '海鸟观察', desc: '观察海鸟和海洋生物' }
            ],
            tags: ['全程约6小时', '含轻食', '科尔斯湾出发', '自然向导']
        },
        '威灵顿山': {
            route: '威灵顿山观景之旅',
            desc: '登顶霍巴特最高峰威灵顿山，俯瞰整个霍巴特城市和德文特河美景。',
            features: [
                { icon: '#22c55e', title: '山顶观景', desc: '在威灵顿山顶俯瞰霍巴特全景' },
                { icon: '#3b82f6', title: '缆车体验', desc: '乘坐缆车欣赏沿途风光' },
                { icon: '#f59e0b', title: '徒步探索', desc: '探索山间步道和自然景观' }
            ],
            tags: ['全程约4小时', '含缆车票', '霍巴特出发', '专业导游']
        },
        '萨拉曼卡市场': {
            route: '萨拉曼卡市场文化体验',
            desc: '探访塔斯马尼亚最著名的周末市场，体验当地文化和手工艺品。',
            features: [
                { icon: '#22c55e', title: '手工艺品', desc: '购买当地艺术家制作的精美手工艺品' },
                { icon: '#3b82f6', title: '美食体验', desc: '品尝塔斯马尼亚特色美食和小吃' },
                { icon: '#f59e0b', title: '文化互动', desc: '与当地艺术家和商贩交流' }
            ],
            tags: ['全程约3小时', '含市场导览', '萨拉曼卡出发', '文化向导']
        },
        '塔斯马尼亚皇家植物园': {
            route: '皇家植物园自然探索',
            desc: '漫步于塔斯马尼亚皇家植物园，欣赏丰富的植物种类和优美景观。',
            features: [
                { icon: '#22c55e', title: '植物观赏', desc: '观赏各种珍稀植物和花卉' },
                { icon: '#3b82f6', title: '温室探索', desc: '探索热带植物温室' },
                { icon: '#f59e0b', title: '自然摄影', desc: '在优美的环境中进行自然摄影' }
            ],
            tags: ['全程约2小时', '含门票', '霍巴特出发', '植物专家']
        },
        '卡斯卡德啤酒厂': {
            route: '卡斯卡德啤酒厂参观体验',
            desc: '参观澳洲最古老的啤酒厂，了解啤酒制作工艺并品尝精酿啤酒。',
            features: [
                { icon: '#22c55e', title: '工厂参观', desc: '参观啤酒制作车间和工艺流程' },
                { icon: '#3b82f6', title: '啤酒品尝', desc: '品尝各种精酿啤酒' },
                { icon: '#f59e0b', title: '历史了解', desc: '了解啤酒厂的历史和文化' }
            ],
            tags: ['全程约1.5小时', '含啤酒品尝', '霍巴特出发', '专业讲解']
        }
    }

    return routeMap[title] || {
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

const routeInfo = computed(() => getRouteInfo(props.title))
</script>

<template>
    <el-dialog v-model="dialogVisible" :show-close="true" width="980px" class="tour-dialog" align-center
        :z-index="9500">
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
    overflow: hidden;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
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
