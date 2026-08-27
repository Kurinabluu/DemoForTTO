<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import {
  COMPANY,
  COMPANY_ABOUT_ENTRY,
  COMPANY_SERVICES,
  FREE_INFO_ENTRY,
  isCompanyNavEntry,
} from '@/data/companyProfile'
import { applyBreadcrumbJsonLd, applyJsonLd, applyPageSeo, ORG_JSONLD_ID, resetPageSeo, toAbsoluteUrl } from '@/utils/pageSeo'
import { useNavStore } from '@/stores/nav'

const route = useRoute()
const router = useRouter()
const navStore = useNavStore()

const showBack = computed(() => {
  const from = String(route.query.from || '')
  return Boolean(from) && !isCompanyNavEntry(route.query)
})

const jsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: COMPANY.brand,
  legalName: COMPANY.legalName,
  areaServed: COMPANY.region,
  email: COMPANY.email,
  telephone: COMPANY.phone,
  url: toAbsoluteUrl('/about'),
  description: `${COMPANY.legalNameZh}运营${COMPANY.brand}，服务区域为${COMPANY.region}。`,
}))

function openHref(path, query = {}) {
  return router.resolve({ path, query }).href
}

onMounted(() => {
  if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  navStore.saveScroll(0, route.fullPath)
  applyPageSeo({
    title: '关于我们',
    description: `${COMPANY.legalNameZh}（${COMPANY.legalName}）运营${COMPANY.brand}。服务区域为${COMPANY.region}，提供一日游、包车、地陪、行程管家、专属定制及免费参考信息。`,
  })
  applyJsonLd(ORG_JSONLD_ID, jsonLd.value)
  applyBreadcrumbJsonLd([
    { name: '首页', path: '/trips/freeinfo' },
    { name: '关于我们', path: '/about' },
  ])
})

onUnmounted(() => {
  resetPageSeo()
})
</script>

<template>
  <article class="company-doc about-page">
    <button v-if="showBack" type="button" class="company-doc__back" @click="router.push('/trips/freeinfo')">
      <el-icon><ArrowLeft /></el-icon>
      <span>返回首页</span>
    </button>

    <header class="hero">
      <h1>关于我们</h1>
      <p class="lead">
        {{ COMPANY.legalNameZh }}（{{ COMPANY.legalName }}）运营 {{ COMPANY.brand }}。
        服务区域为{{ COMPANY.region }}。
      </p>
    </header>

    <section class="panel">
      <h2>公司信息</h2>
      <dl class="facts">
        <div><dt>公司名称</dt><dd>{{ COMPANY.legalNameZh }} / {{ COMPANY.legalName }}</dd></div>
        <div><dt>网站</dt><dd>{{ COMPANY.brand }}</dd></div>
        <div><dt>服务区域</dt><dd>{{ COMPANY.region }}</dd></div>
        <div><dt>电话</dt><dd>{{ COMPANY.phone }}</dd></div>
        <div><dt>邮箱</dt><dd>{{ COMPANY.email }}</dd></div>
        <div><dt>微信</dt><dd>{{ COMPANY.wechat }}</dd></div>
        <div><dt>工作时间</dt><dd>{{ COMPANY.hoursAu }}；{{ COMPANY.hoursCn }}</dd></div>
      </dl>
    </section>

    <section class="panel">
      <h2>我们提供什么</h2>
      <p>
        七项收费服务，外加一项免费参考信息。免费信息用于规划，收费服务需咨询确认档期和报价。
        <strong>点击标题可在新窗口打开对应页面。</strong>
      </p>
      <ul class="service-list">
        <li v-for="(item, index) in COMPANY_SERVICES" :key="item.path" class="service-card">
          <span class="service-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <div class="service-body">
            <a class="service-title" :href="openHref(item.path, item.query || {})" target="_blank" rel="noopener noreferrer">
              {{ item.name }}
            </a>
            <p>{{ item.desc }}</p>
          </div>
        </li>
        <li class="service-card service-card--free">
          <span class="service-index">免费</span>
          <div class="service-body">
            <a class="service-title" :href="openHref(FREE_INFO_ENTRY.path, FREE_INFO_ENTRY.query)" target="_blank" rel="noopener noreferrer">
              {{ FREE_INFO_ENTRY.name }}
            </a>
            <p>{{ FREE_INFO_ENTRY.desc }}</p>
          </div>
        </li>
      </ul>
    </section>

    <section class="panel">
      <h2>我们如何做</h2>
      <p>
        有感客人多是远道而来，本站设立「自助游/自驾游免费参考信息」，整理本地公开资料，减少行程中找信息的时间。
        服务项目、收费口径、付款与退款尽量公开。公司发展可以走得慢，但要走得稳。
      </p>
      <blockquote class="quote">欲稳须慢，慢即是快。<cite>——创始人寄语</cite></blockquote>
    </section>

    <section class="panel">
      <h2>政策与条款</h2>
      <div class="legal-links">
        <RouterLink class="legal-chip" :to="{ path: '/refund', query: COMPANY_ABOUT_ENTRY }">退款政策</RouterLink>
        <RouterLink class="legal-chip" :to="{ path: '/privacy', query: COMPANY_ABOUT_ENTRY }">隐私政策</RouterLink>
        <RouterLink class="legal-chip" :to="{ path: '/terms', query: COMPANY_ABOUT_ENTRY }">服务条款与条件</RouterLink>
      </div>
    </section>
  </article>
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

.about-page {
  h1 {
    font-size: 32px;
    line-height: 1.3;
    margin: 0 0 12px;
    color: #111;
  }

  h2 {
    font-size: 22px;
    color: #1a7a6f;
    margin: 36px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #33b1a3;
  }

  p {
    font-size: 16px;
    margin: 0 0 14px;
  }
}

.hero {
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.lead {
  color: #374151;
}

.panel {
  margin-bottom: 8px;
}

.facts {
  display: grid;
  gap: 0;
  margin: 0;
}

.facts div {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.facts div:last-child {
  border-bottom: 0;
}

dt {
  font-weight: 700;
  color: #279486;
}

dd {
  margin: 0;
}

.service-list {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  display: grid;
  gap: 0;
}

.service-card {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 12px;
  align-items: start;
  padding: 14px 0;
  border-bottom: 1px solid #eee;
}

.service-card:last-child {
  border-bottom: 0;
}

.service-index {
  font-size: 13px;
  font-weight: 700;
  color: #1a7a6f;
  padding-top: 2px;
}

.service-card--free .service-index {
  color: #8a5a12;
}

.service-body p {
  margin: 4px 0 0;
  color: #555;
  font-size: 15px;
}

.service-title {
  color: #1a7a6f;
  font-weight: 700;
  text-decoration: none;
}

.service-title:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.quote {
  margin: 8px 0 0;
  padding: 12px 0 12px 14px;
  border-left: 3px solid #33b1a3;
  color: #333;
  font-weight: 600;
}

.quote cite {
  display: block;
  margin-top: 6px;
  font-style: normal;
  font-weight: 500;
  color: #666;
  text-align: right;
}

.legal-links {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.legal-chip {
  color: #1a7a6f;
  font-weight: 700;
  text-decoration: none;
}

.legal-chip:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 640px) {
  .facts div {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .service-card {
    grid-template-columns: 40px 1fr;
  }
}
</style>
