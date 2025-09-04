<script setup>
import { computed } from 'vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    title: { type: String, default: '大堡礁单日游' },
    banner: { type: String, default: '' },
})

const emit = defineEmits(['update:visible'])

const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
})
</script>

<template>
    <el-dialog v-model="dialogVisible" :show-close="true" width="980px" class="tour-dialog" align-center>
        <template #header>
            <div class="dlg-title">{{ title }}</div>
        </template>

        <div class="dlg-banner">
            <img :src="banner" alt="banner" />
        </div>

        <div class="dlg-section">
            <div class="section-title">推荐路线： 绿岛生态探索之旅</div>
            <div class="section-desc">
                这条经典路线将带您探索大堡礁最美丽的岛屿之一——绿岛。全程由专业导游带领，您将有机会体验浮潜、玻璃底船观光
                和热带雨林徒步，全面感受大堡礁的自然魅力。
            </div>

            <div class="feature-grid">
                <div class="feature-card">
                    <div class="icon" style="background:#22c55e"></div>
                    <div class="f-title">珊瑚礁浮潜</div>
                    <div class="f-desc">在专业教练指导下探索五彩斑斓的珊瑚礁世界，与热带鱼群共游，近距离感受超过150种珊瑚的壮丽。</div>

                </div>

                <div class="feature-card">
                    <div class="icon" style="background:#3b82f6"></div>
                    <div class="f-title">玻璃底船观光</div>
                    <div class="f-desc">乘坐特殊玻璃底船，无需下水即可欣赏海底，不会游泳也能轻松看到海洋奇观的生机与灵动，并提供专业讲解。</div>

                </div>

                <div class="feature-card">
                    <div class="icon" style="background:#f59e0b"></div>
                    <div class="f-title">雨林徒步探险</div>
                    <div class="f-desc">漫步于绿岛郁郁葱葱的热带雨林中，了解岛上丰富的生态系统和原住民文化。徒步路线轻松，适合所有年龄。</div>

                </div>

            </div>
            <div class="tag-row">
                <span class="mini-tag">全程约8小时</span>
                <span class="mini-tag">含午餐软饮水</span>
                <span class="mini-tag">凯恩斯港口出发</span>
                <span class="mini-tag">专业中英文导游</span>

            </div>
        </div>

        <template #footer>
            <div class="dlg-footer">
                <el-button type="primary" size="large">立刻咨询此行程</el-button>
            </div>
        </template>
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
