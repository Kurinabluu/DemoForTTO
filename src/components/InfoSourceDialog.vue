<script setup>
import { computed } from 'vue'
import { Z_INDEX } from '@/constants/zIndex'

const props = defineProps({
    visible: { type: Boolean, default: false },
    sourceData: { type: Array, default: () => [] },
    entryTitle: { type: String, default: '该条目' }
})

const emit = defineEmits(['update:visible'])

const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
})
</script>

<template>
    <el-dialog v-model="dialogVisible" :z-index="Z_INDEX.dialog.overlay" :append-to-body="true" align-center width="80%" class="source-dia">
        <template #header>
            <div class="source-dialog-header">
                <span class="source-dialog-title">信息参考来源</span>
                <span class="source-dialog-note">
                    ※ 本描述基于维基百科贡献者创建的{{ entryTitle }}，采用
                    <el-link href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank"
                        rel="noopener noreferrer" class="source-license-link">
                        CC BY-SA 4.0
                    </el-link>
                    授权。
                </span>
            </div>
        </template>

        <el-table :data="sourceData" border>
            <el-table-column prop="title" label="条目/文章标题" width="200" />
            <el-table-column prop="desc" label="来源名称" width="200" />
            <el-table-column prop="url" label="永久链接">
                <template #default="scope">
                    <el-link v-if="scope.row?.url" :href="scope.row.url" target="_blank">{{ scope.row.url }}</el-link>
                    <span v-else>-</span>
                </template>
            </el-table-column>
        </el-table>
    </el-dialog>
</template>

<style scoped lang="scss">
.source-dialog-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.source-dialog-title {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
}

.source-dialog-note {
    font-size: 12px;
    line-height: 1.7;
    color: #6b7280;
}

.source-license-link {
    color: #33b1a3;
    font-weight: 600;
    vertical-align: baseline;
}

@media (max-width: 768px) {
    .source-dialog-title {
        font-size: 16px;
    }

    .source-dialog-note {
        font-size: 11px;
        line-height: 1.6;
        word-break: break-word;
    }
}
</style>