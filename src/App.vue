<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ArrowUp, ArrowDown, Switch } from '@element-plus/icons-vue'
import Layout from './layouts/Layout.vue'
import { useNavStore } from '@/stores/nav'
import { useRouter } from 'vue-router'
import { useLoadingStore } from '@/stores/loadingStore'
import { withLoading } from '@/utils/loadingUtils'
import { Z_INDEX } from '@/constants/zIndex'

// 电梯导航相关
const showElevator = ref(false)
const isAtBottom = ref(false)
const isLeftPosition = ref(false) // 控制电梯导航位置，false为右侧，true为左侧

const router = useRouter()
const loadingStore = useLoadingStore()
const { fullscreenLoading, loadingText } = storeToRefs(loadingStore)
const loadingState = computed(() => fullscreenLoading.value)

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

// 切换电梯导航和滚动条位置
const togglePosition = () => {
  isLeftPosition.value = !isLeftPosition.value
}

const goToFavorites = () => {
  void withLoading(undefined, { text: '正在打开收藏夹...' })
  const href = router.resolve({ name: 'Favorites' }).href
  window.open(href, '_blank', 'noopener,noreferrer')
}

const showTipsModal = ref(false)
const dontShowAgain = ref(false)
const acceptTips = () => {
  if (dontShowAgain.value) {
    localStorage.setItem('tto_dont_show_tips', 'true')
  }
  showTipsModal.value = false
}

//敬请期待对话框
const isDialogVisible = ref(false)

// 定义获取导航状态存储
const navStore = useNavStore()

// 窗口大小变化处理
const handleResize = () => {
  // 窗口大小变化时重新判断是否显示电梯导航
  handleScroll()
}

onMounted(() => {
  // 检查用户是否设置了不再显示提示
  const shouldNotShow = localStorage.getItem('tto_dont_show_tips') === 'true'
  if (!shouldNotShow) {
    showTipsModal.value = true
  }

  // 原代码：只有首次访问时才显示弹窗
  /*
  if (navStore.isFirstVisit()) {
    showTipsModal.value = true
    navStore.markFirstVisitDone()
  } else {
    showTipsModal.value = false
  }
  */

  // 添加滚动事件监听器
  const onScroll = () => {
    handleScroll()
    navStore.saveScroll(window.scrollY, router.currentRoute.value.fullPath || router.currentRoute.value.path)
  }
  window.addEventListener('scroll', onScroll)
  // 添加窗口大小变化监听器
  window.addEventListener('resize', handleResize)

  // 非首次进入时，恢复用户上次选择的服务、子导航和滚动位置
  if (!navStore.isFirstVisit()) {
    const restoreLastSession = async () => {
      await router.isReady()

      const currentFullPath = router.currentRoute.value.fullPath || router.currentRoute.value.path || ''
      const lastPath = navStore.lastPath
      const isRootPath = !currentFullPath || currentFullPath === '/' || currentFullPath === '/DemoForTTO'

      if (!isRootPath && currentFullPath.startsWith('/DemoForTTO/')) {
        return
      }

      if (lastPath && lastPath !== '/DemoForTTO') {
        router.replace(lastPath)
      } else {
        router.replace({ path: '/DemoForTTO/service/car' })
      }
    }

    restoreLastSession()
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
  <div v-loading.fullscreen="loadingState" :element-loading-text="loadingText"
    element-loading-spinner-color="#33b1a3" element-loading-background="rgba(255, 255, 255, 0.8)"></div>

  <!-- 温馨提示声明弹窗 -->
  <el-dialog v-model="showTipsModal" append-to-body align-center width="520px" :close-on-click-modal="false"
    :show-close="false" :z-index="Z_INDEX.dialog.overlay">
    <template #header>
      <div style="font-weight:700; letter-spacing:2px; color:#101010;">温馨提示</div>
    </template>
    <div style="color:#333; line-height:1.8; text-align:justify;">
      温馨提示，本网站仍在建立之中，内容仍未完善，TTO正在尽全力建设中，敬请期待。
    </div>
    <template #footer>
      <div style="display:flex; justify-content:flex-end; gap:16px; align-items:center;">
        <div style="display:flex; align-items:center; gap:4px;">
          <el-checkbox v-model="dontShowAgain" label="不再提示" size="small"></el-checkbox>
        </div>
        <el-button type="primary" @click="acceptTips">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 电梯导航 -->
  <div class="elevator-nav" :class="{ show: showElevator, 'left-position': isLeftPosition }">
    <div class="elevator-btn pointer" :class="{ show: showElevator }" @click="scrollToTop">
      <el-icon>
        <ArrowUp />
      </el-icon>
    </div>
    <div class="elevator-btn pointer" :class="{ show: showElevator }" @click="scrollToBottom">
      <el-icon>
        <ArrowDown />
      </el-icon>
    </div>
    <div class="elevator-btn pointer" :class="{ show: showElevator }" @click="goToFavorites">
      <span style="font-size: 20px;">⭐</span>
    </div>
    <div class="elevator-btn pointer" :class="{ show: showElevator }" @click="togglePosition">
      <el-icon>
        <Switch />
      </el-icon>
    </div>
  </div>

  <!-- 敬请期待对话框 -->
  <el-dialog v-model="isDialogVisible" append-to-body align-center width="420px" :z-index="Z_INDEX.dialog.base">
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
  display: flex;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 500;
  flex-direction: column;
  gap: 10px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;

  &.show {
    opacity: 1;
    visibility: visible;
  }

  &.left-position {
    right: auto;
    left: 20px;
  }

  .elevator-btn {
    display: flex;
    width: 50px;
    height: 50px;
    background-color: #fff;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border: 1px solid #e0e0e0;
    // opacity: 0;
    transition: display 0.3s ease;

    // &.show {
    //   display: flex;
    // }

    &:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15) !important;
    }

    .el-icon {
      font-size: 20px !important;
      color: #33b1a3 !important;
    }
  }
}

// 移动端和平板端：电梯导航位置下移到 70%
@media (max-width: 1024px) {
  .elevator-nav {
    top: 70% !important;
  }
}
</style>
