<script setup>
import { ref, defineExpose } from 'vue'

const showComingDialog = ref(false)

defineExpose({
    showComingDialog
})
</script>

<template>
    <!-- <div> -->
    <el-dialog v-model="showComingDialog" title="提示" width="500" align-center>
        <span>正在开发中，敬请期待！</span>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="showComingDialog = false">
                    确定
                </el-button>
            </div>
        </template>
    </el-dialog>
    <!-- </div> -->
</template>

<style lang="scss" scoped></style>