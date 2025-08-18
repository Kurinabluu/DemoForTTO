<script setup>
import { ref, onMounted } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import Layout from './layouts/Layout.vue'

// 电梯导航相关
const showElevator = ref(false)
const isAtBottom = ref(false)

// 滚动处理函数
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const carouselHeight = 800 // 轮播图高度
  const threshold = carouselHeight * 2 / 3 // 约533px

  // 滚动超过2/3轮播图高度时显示电梯导航
  const shouldShow = scrollTop > threshold
  showElevator.value = shouldShow

  // 检查是否到达底部（距离底部10px以内）
  const isNearBottom = scrollTop + windowHeight >= documentHeight - 10
  isAtBottom.value = isNearBottom
}

// 回到顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 跳到底部
const scrollToBottom = () => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth'
  })
}


//温馨提示弹窗
const showTipsModal = ref(false)
const acceptTips = () => {
  showTipsModal.value = false
}

onMounted(() => {
  // 首次渲染完成后展示弹窗
  // showDisclaimerModal.value = true
  showTipsModal.value = true
})

</script>

<template>
  <!-- <div class="common-layout"> -->
  <!-- <Layout /> -->
  <RouterView />

  <!-- 温馨提示声明弹窗 -->
  <el-dialog v-model="showTipsModal" append-to-body align-center width="520px" :close-on-click-modal="false"
    :show-close="false">
    <template #header>
      <div style="font-weight:700; letter-spacing:2px; color:#101010;">温馨提示</div>
    </template>
    <div style="color:#333; line-height:1.8; text-align:justify;">
      温馨提示，由于本网站仍在建立之中，内容仍未完善，因此本网站的内容不构成任何建议，敬请谅解。
    </div>
    <template #footer>
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <el-button type="primary" @click="acceptTips">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 电梯导航 -->
  <div class="elevator-nav" :class="{ show: showElevator }">
    <div class="elevator-btn" :class="{ show: showElevator }" @click="scrollToTop">
      <el-icon>
        <ArrowUp />
      </el-icon>
    </div>
    <div class="elevator-btn" :class="{ show: showElevator && !isAtBottom }" @click="scrollToBottom">
      <el-icon>
        <ArrowDown />
      </el-icon>
    </div>
  </div>

  <!-- 敬请期待对话框 -->
  <el-dialog v-model="isDialogVisible" append-to-body align-center width="420px">
    <div style="text-align: center; font-size: 18px; padding: 8px 0;">敬请期待</div>
    <template #footer>
      <el-button type="primary" @click="isDialogVisible = false">我知道了</el-button>
    </template>
  </el-dialog>
  <!-- </div> -->
</template>

<style scoped lang="scss">
// 电梯导航样式 - 全局作用域
.elevator-nav {
  position: fixed !important;
  right: 30px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 9999 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 10px !important;
  opacity: 0 !important;
  visibility: hidden !important;
  transition: opacity 0.3s ease, visibility 0.3s ease !important;

  &.show {
    opacity: 1 !important;
    visibility: visible !important;
  }

  .elevator-btn {
    width: 50px !important;
    height: 50px !important;
    background-color: #fff !important;
    border-radius: 8px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.3s ease !important;
    border: 1px solid #e0e0e0 !important;
    opacity: 0 !important;
    transition: opacity 0.3s ease, transform 0.3s ease !important;

    &.show {
      opacity: 1 !important;
    }

    &:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15) !important;
    }

    .el-icon {
      font-size: 20px !important;
      color: #609AB1 !important;
    }
  }
}
</style>
