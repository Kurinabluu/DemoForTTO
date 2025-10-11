<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import Layout from './layouts/Layout.vue'
import { useNavStore } from '@/stores/nav'
import { useRouter } from 'vue-router'

// 电梯导航相关
const showElevator = ref(false)
const isAtBottom = ref(false)

const router = useRouter()

// 滚动处理函数
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const carouselHeight = 800 // 轮播图高度
  const threshold = carouselHeight * 2 / 3 // 约533px

  // 移动端和平板端不显示电梯导航
  const isMobileOrTablet = window.innerWidth <= 1024
  if (isMobileOrTablet) {
    showElevator.value = false
    return
  }

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

//敬请期待对话框
// const isDialogVisible = ref(false)

// 定义获取导航状态存储
const navStore = useNavStore()

// 窗口大小变化处理
const handleResize = () => {
  // 窗口大小变化时重新判断是否显示电梯导航
  handleScroll()
}

onMounted(() => {
  // 首次渲染完成后展示弹窗
  // showDisclaimerModal.value = true
  showTipsModal.value = true

  // 添加滚动事件监听器
  window.addEventListener('scroll', () => {
    handleScroll()
    // 保存滚动位置
    navStore.saveScroll(window.scrollY)
  })
  // 添加窗口大小变化监听器
  window.addEventListener('resize', handleResize)

  // 非首次进入时，恢复用户上次选择的服务、子导航和滚动位置
  if (!navStore.isFirstVisit()) {
    // 无需延迟，使用nextTick确保DOM已渲染
    nextTick(() => {
      const lastPath = navStore.lastPath
      const selectedSubNav = navStore.selectedSubNav
      const savedScrollY = navStore.lastScrollY

      // 获取设备类型，用于适配导航栏高度
      const isMobile = window.innerWidth <= 768
      const navHeight = isMobile ? 60 : 80 // 移动端导航栏高度较小

      // 如果有保存的完整路径，则直接导航到该路径
      if (lastPath && lastPath !== '/DemoForTTO') {
        // 使用replace确保URL与实际内容一致
        router.replace(lastPath)

        // 如果有保存的滚动位置，在路由跳转完成后由router.afterEach恢复
      } else {
        // 默认跳转到免费信息并选择景点子导航
        navStore.saveSelectedSubNav('景点')
        router.replace('/DemoForTTO/trips/freeinfo')
      }
    })
  }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
})

</script>

<template>
  <!-- <div class="common-layout"> -->
  <!-- <Layout /> -->
  <RouterView />

  <!-- 温馨提示声明弹窗 -->
  <el-dialog v-model="showTipsModal" append-to-body align-center width="520px" :close-on-click-modal="false"
    :show-close="false" :append-to-body="true">
    <template #header>
      <div style="font-weight:700; letter-spacing:2px; color:#101010;">温馨提示</div>
    </template>
    <div style="color:#333; line-height:1.8; text-align:justify;">
      【免责声明】由于本网站仍在建立之中，内容仍未完善，因此本网站的内容不构成任何建议，敬请谅解。
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

// 移动端和平板端隐藏电梯导航
@media (max-width: 1024px) {
  .elevator-nav {
    display: none !important;
  }
}
</style>
