<script setup>

</script>

<template>
    <el-dialog title="信息来源" :visible.sync="visible" width="50%">
        测试测试测试
        <template #footer>
            <el-button type="primary" @click="visible = false">确定</el-button>
        </template>
    </el-dialog>
</template>

<style scoped></style>