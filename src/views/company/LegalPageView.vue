<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import PrivacyPolicy from '@/components/PrivacyPolicy.vue'
import TermsandConditionsDialog from '@/components/TermsandConditionsDialog.vue'
import RefundPolicy from '@/components/RefundPolicy.vue'
import { isCompanyAboutEntry } from '@/data/companyProfile'
import { applyBreadcrumbJsonLd, applyPageSeo, removeFaqJsonLd, resetPageSeo } from '@/utils/pageSeo'
import { useNavStore } from '@/stores/nav'

const props = defineProps({
  doc: { type: String, default: 'privacy' },
})

const route = useRoute()
const router = useRouter()
const navStore = useNavStore()

const showBack = computed(() => isCompanyAboutEntry(route.query))

const meta = computed(() => {
  if (props.doc === 'terms') {
    return {
      title: '服务条款与条件',
      description: 'TasTrips.Online 服务条款，说明预订、付款、取消、用户责任与适用法律。',
    }
  }
  if (props.doc === 'refund') {
    return {
      title: '退款政策',
      description: 'TasTrips.Online 取消与退款标准、申请流程和特殊情形说明。',
    }
  }
  return {
    title: '隐私政策',
    description: 'TasTrips.Online 如何收集、使用和保护个人信息。',
  }
})

function applyLegalSeo() {
  removeFaqJsonLd()
  applyPageSeo(meta.value)
  applyBreadcrumbJsonLd([
    { name: '首页', path: '/trips/freeinfo' },
    { name: '关于我们', path: '/about' },
    { name: meta.value.title, path: route.path },
  ])
}

onMounted(() => {
  if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  navStore.saveScroll(0, route.fullPath)
  applyLegalSeo()
})

watch(() => props.doc, () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  applyLegalSeo()
})

onUnmounted(() => {
  resetPageSeo()
})
</script>

<template>
  <div class="company-doc legal-page">
    <button v-if="showBack" type="button" class="company-doc__back" @click="router.push('/about')">
      <el-icon><ArrowLeft /></el-icon>
      <span>返回关于我们</span>
    </button>
    <div class="legal-panel">
      <PrivacyPolicy v-if="doc === 'privacy'" as-page />
      <TermsandConditionsDialog v-else-if="doc === 'terms'" as-page />
      <RefundPolicy v-else as-page />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.company-doc {
  width: 90%;
  box-sizing: border-box;
  margin: 24px auto 64px;
  color: #333;
  line-height: 1.8;
}

.company-doc__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  margin-bottom: 18px;
  padding: 0 14px 0 10px;
  border: 1px solid #33b1a3;
  border-radius: 5px;
  background: #fff;
  color: #1a7a6f;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.company-doc__back:hover {
  background: #33b1a3;
  color: #fff;
}

.legal-panel {
  box-sizing: border-box;
  overflow-x: auto;
}

:deep(.legal-page-title) {
  font-size: 32px;
  line-height: 1.3;
  margin: 0 0 12px;
  color: #111;
}

:deep(.policy-text--page) {
  width: 100%;
  font-size: 16px;
  line-height: 1.85;
}

:deep(.policy-section h2) {
  font-size: 22px;
  color: #1a7a6f;
  margin: 28px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #33b1a3;
}

:deep(.policy-section:first-child h2) {
  margin-top: 8px;
}

:deep(.refund-table) {
  width: 100%;
  max-width: 100%;
}

:deep(.el-table) {
  width: 100% !important;
}

@media (max-width: 640px) {
  :deep(.legal-page-title) {
    font-size: 26px;
  }
}
</style>
