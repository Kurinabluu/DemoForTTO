<script setup>
import { ref, defineExpose } from 'vue'

const showAboutUsDialog = ref(false)

defineExpose({
    showAboutUsDialog
})
</script>

<template>
    <el-dialog v-model="showAboutUsDialog" title="关于我们" width="580" align-center>
        <div class="about-us-content">
            <p class="about-intro">
                塔斯马尼亚旅行有限公司（TASMANIA TRIPS PTY
                LTD）是一家专注于塔斯马尼亚地区旅游服务的公司。我们致力于为每一位游客提供专业、贴心的旅行服务，让你在塔斯马尼亚拥有难忘的旅行体验。主营业务包括：包车服务、景点门票预订、一日游行程规划等。
                我们的团队熟悉塔斯马尼亚的每一个角落，致力于为你打造专属的旅行方案。
            </p>
            <p class="about-slogan">
                诚会天下游者，祝您旅途愉快！
            </p>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="showAboutUsDialog = false">
                    确定
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.about-us-content {
    text-align: justify;
    line-height: 2;
    // color: #333;

    .about-intro {
        margin-bottom: 16px;
        text-indent: 2em;
        font-size: 15px;

        &:last-of-type {
            margin-bottom: 20px;
        }
    }

    .about-slogan {
        text-align: center;
        margin-top: 24px;
        font-weight: bold;
        color: #3dc7be;
        font-size: 16px;
    }
}
</style>
