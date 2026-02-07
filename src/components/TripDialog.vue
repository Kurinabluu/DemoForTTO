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
    tripType: { type: String, default: '一日游' },
    tripData: { type: Object, default: () => ({}) }
})

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

const getTripRouteInfo = (title, tripType) => {
    try {
        if (!title || !dataJson || !Array.isArray(dataJson)) {
            return getDefaultTripInfo(title)
        }

        if (tripType === '多日游') {
            const multiDaySection = dataJson.find(item => item?.tagName === '多日游（固定行程）')
            const tripItem = multiDaySection?.tripConfig?.find(item => item?.title === title)
            if (tripItem?.tripData) {
                return tripItem.tripData
            }
        }

        const dayTripSection = dataJson.find(item => item?.tagName === '一日游（固定行程）')
        if (dayTripSection?.subNav && Array.isArray(dayTripSection.subNav)) {
            for (const subNav of dayTripSection.subNav) {
                if (subNav?.items && Array.isArray(subNav.items)) {
                    const tripItem = subNav.items.find(item => item?.title === title)
                    if (tripItem?.tripData) {
                        return tripItem.tripData
                    }
                }
            }
        }

        return getDefaultTripInfo(title)
    } catch (error) {
        return getDefaultTripInfo(title)
    }
}

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

const routeInfo = computed(() => {
    if (props.tripData && Object.keys(props.tripData).length > 0) {
        return props.tripData;
    }
    return getTripRouteInfo(props.title, props.tripType);
})
</script>

<template>
    <el-dialog v-model="dialogVisible" :show-close="true" width="980px" class="trip-dialog" align-center :z-index="9300"
        :append-to-body="true" :lock-scroll="true">
        <template #header>
            <div class="dlg-header">
                <div class="dlg-title">{{ title }}<span v-if="enTitle">（{{ enTitle }}）</span></div>
                <div class="dlg-header-actions">
                    <el-button type="primary" size="large" @click="openContactDialog">立刻咨询此行程</el-button>
                </div>
            </div>
        </template>

        <div class="dlg-section">
            <div class="dlg-banner " v-if="banner">
                <img :src="banner" alt="banner" class="w100 h100" />
            </div>

            <div class="dlg-text">
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

                <div class="price-section">
                    <h3 class="price-title">行程价格</h3>
                    <div class="price-items">
                        <div class="price-item">Adult $170</div>
                        <div class="price-item">Concession $160</div>
                        <div class="price-item">Child $85</div>
                    </div>
                    <div class="price-note">*Annual price increase applied 01 April</div>
                </div>

                <div class="tag-row">
                    <span class="mini-tag" v-for="(tag, index) in routeInfo.tags" :key="index">{{ tag }}</span>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dlg-footer">
                <div class="info-disclaimer" @click="routeInfo.source ? openInfoDialog() : null">
                    <el-icon class="info-icon">
                        <InfoFilled />
                    </el-icon>
                    <template v-if="routeInfo.source">
                        本页信息来源：{{ routeInfo.source[0].desc }}
                    </template>
                    <template v-else>
                        本页信息来源：TasTrips.Online原创
                    </template>
                </div>
            </div>
        </template>
    </el-dialog>

    <ContactDialog v-model:visible="contactDialogVisible" />

    <el-dialog v-model="infoDialogVisible" :z-index="9999" :append-to-body="true" title="信息参考来源" align-center
        width="80%" class="source-dia">
        <el-table :data="tripData.source" border>
            <el-table-column prop="title" label="条目/文章标题" width="200" />
            <el-table-column prop="desc" label="来源名称" width="200" />
            <el-table-column prop="url" label="永久链接">
                <template #default="scope">
                    <el-link :href="scope.row.url" target="_blank">{{ scope.row.url }}</el-link>
                </template>
            </el-table-column>
        </el-table>
    </el-dialog>
</template>

<style lang="scss" scoped>
.dlg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.dlg-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.dlg-title {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #111827;
}

.dlg-section {
    letter-spacing: normal;
    text-align: left;
    max-height: 550px;
    overflow-y: auto;

    .dlg-banner {
        height: 220px;

        img {
            display: block;
            object-fit: cover;
        }
    }

    .dlg-text {
        padding: 18px 20px 10px;
    }
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

.price-section {
    margin-top: 24px;
    padding: 16px;
    background-color: #f8fafc;
    border-radius: 8px;

    .price-title {
        font-size: 18px;
        font-weight: 700;
        color: #33b1a3;
        margin-bottom: 12px;
    }

    .price-items {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;

        .price-item {
            font-size: 16px;
            color: #5dd0c9;
        }
    }

    .price-note {
        font-size: 12px;
        color: #9ee2dc;
        font-style: italic;
    }
}

.dlg-footer {
    position: relative;
    padding: 0 12px 12px;
    margin-top: 10px;
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

.dlg-footer .el-button {
    margin-top: 24px;
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
