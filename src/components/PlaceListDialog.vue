<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    placeName: { type: String, default: '' },
    itemType: { type: String, default: '餐厅' }, // 餐厅 | 住宿
    items: { type: Array, default: () => [] }, // [{ title, img }]
})

// 处理图片URL的函数
const getImageUrl = (imagePath) => {
    if (!imagePath) return ''
    const normalizedPath = String(imagePath).trim()
        // 兼容误写的 ../assetes
        .replace(/^(\.\.\/)assetes\//, '$1assets/')

    // 如果已经是完整的URL，直接返回
    if (normalizedPath.startsWith('http') || normalizedPath.startsWith('data:')) {
        return normalizedPath
    }

    const candidates = [normalizedPath]
    if (normalizedPath.startsWith('@/')) {
        candidates.push(`../${normalizedPath.slice(2)}`)
    }
    if (normalizedPath.startsWith('../assets/')) {
        candidates.push(normalizedPath.replace('../assets/', '@/assets/'))
    }

    for (const candidate of candidates) {
        try {
            if (candidate.startsWith('@/')) continue
            return new URL(candidate, import.meta.url).href
        } catch (error) {
            // continue
        }
    }
    return normalizedPath
}

const emits = defineEmits(['update:modelValue', 'select'])

const dialogVisible = computed({
    get() {
        return props.modelValue
    },
    set(v) {
        emits('update:modelValue', v)
    }
})

function onSelect(item) {
    emits('select', item)
}

function closeDialog() {
    emits('update:modelValue', false)
}

function closeOnOverlay() {
    // 不关闭，保持与原有行为一致
}

// 根据设备宽度限制可见项数量，避免出现滚动条
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1920)
function handleResize() {
    if (typeof window !== 'undefined') viewportWidth.value = window.innerWidth
}
onMounted(() => {
    if (typeof window !== 'undefined') window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
    if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize)
})

const visibleLimit = computed(() => {
    const w = viewportWidth.value
    if (w <= 768) return 8 // 移动端：2列*4行
    if (w <= 1024) return 20 // 平板：4列*5行
    return 24 // 桌面：4列*6行
})
const visibleItems = computed(() => props.items.slice(0, visibleLimit.value))
</script>

<template>
    <!-- 自定义弹窗遮罩 -->
    <Teleport to="body">
        <div v-if="dialogVisible" class="custom-modal-overlay" @click="closeOnOverlay">
            <div class="custom-modal" @click.stop>
                <!-- 标题栏 -->
                <div class="modal-header">
                    <h3 class="modal-title">{{ placeName }} · {{ itemType }}列表</h3>
                    <button class="close-btn" @click="closeDialog">×</button>
                </div>

                <!-- 内容区域 -->
                <div class="modal-body">
                    <div class="grid">
                        <div class="grid-item" v-for="(it, idx) in visibleItems" :key="idx" @click="onSelect(it)">
                            <img :src="getImageUrl(it.img)" alt="thumb" class="thumb" />
                            <div class="name">{{ it.title }}</div>
                            <div class="en-name">{{ it.enTitle }}</div>
                        </div>
                    </div>
                </div>

                <!-- 底部 -->
                <div class="modal-footer">
                    <div class="footer-box">
                        <span class="tip">共 {{ items.length }} 项</span>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped lang="scss">
// 自定义弹窗样式
.custom-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9000;
    padding: 20px;
}

.custom-modal {
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 12px 32px 4px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
    width: 100%;
    max-width: 1080px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    // border-bottom: 1px solid #e5e7eb;
    margin-bottom: 0;
}

.modal-title {
    height: 50px;
    line-height: 50px;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    // padding-bottom: 20px;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
    line-height: 1;
    transition: color 0.2s;

    &:hover {
        color: #6b7280;
    }
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    max-height: calc(85vh - 120px); // 减去header和footer的高度
}

.modal-footer {
    padding: 20px
}

.grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

.grid-item {
    cursor: pointer;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: all 0.2s ease;

    &:hover {
        border-color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        transform: translateY(-2px);
    }
}

.thumb {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
}

.name {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
}

.footer-box {
    display: flex;
    justify-content: flex-end;
}

.tip {
    color: #6b7280;
    font-size: 12px;
}

/* 平板 */
@media (min-width: 769px) and (max-width: 1024px) {
    .grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .custom-modal {
        max-width: 90vw;
    }
}

/* 移动端 */
@media (max-width: 768px) {
    .custom-modal-overlay {
        padding: 10px;
    }

    .custom-modal {
        max-width: 95vw;
        max-height: 90vh;
    }

    .modal-header {
        padding: 15px 15px 0;
    }

    .modal-title {
        font-size: 16px;
        padding-bottom: 15px;
    }

    .modal-body {
        padding: 15px;
        max-height: calc(90vh - 100px);
    }

    .modal-footer {
        padding: 15px;
    }

    .grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .thumb {
        height: 100px;
    }

    .grid-item {
        padding: 8px;
    }

    .name {
        font-size: 13px;
    }
}
</style>
