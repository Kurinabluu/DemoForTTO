<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Z_INDEX } from '@/constants/zIndex'

defineProps({
    asPage: { type: Boolean, default: false },
    title: { type: String, required: true },
})

const visible = defineModel('visible', { type: Boolean, default: false })
const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)

function handleResize() {
    isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<template>
    <article v-if="asPage" class="legal-article">
        <h1 class="legal-page-title">{{ title }}</h1>
        <div class="policy-text policy-text--page">
            <slot />
        </div>
    </article>
    <el-dialog v-else v-model="visible" :title="title" width="800" max-width="500px" :fullscreen="isMobile"
        :close-on-click-modal="false" align-center center :z-index="Z_INDEX.dialog.base">
        <div class="policy-text">
            <slot />
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="visible = false">确定</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.legal-article {
    color: #1f2937;
}

.legal-page-title {
    margin: 0 0 16px;
    font-size: 32px;
    line-height: 1.3;
    color: #111;
}

.policy-text--page {
    height: auto !important;
    overflow: visible !important;
    font-size: 16px;
    line-height: 1.85;
}

.policy-text {
    font-size: 14px;
    line-height: 1.8;
    color: #333;
    text-align: justify;
    padding: 10px 0;
    height: 600px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #dcdfe6 #f5f7fa;
}

.policy-text::-webkit-scrollbar {
    width: 6px;
}

.policy-text::-webkit-scrollbar-track {
    background: #f5f7fa;
    border-radius: 3px;
}

.policy-text::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
}

.dialog-footer {
    text-align: center;
}

@media (min-width: 769px) and (max-width: 1024px) {
    .policy-text {
        height: 600px;
        font-size: 15px;
    }
}

@media (max-width: 768px) {
    .policy-text {
        height: 100%;
        font-size: 13px;
        padding: 5px 0;
    }
}
</style>
