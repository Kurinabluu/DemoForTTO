<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import {
  searchAllContent,
  persistSearchSession,
  getStoredSearchSession,
  SEARCH_PAGE_SIZE
} from '@/utils/searchService'
import { withLoading } from '@/utils/loadingUtils'

const route = useRoute()
const router = useRouter()

const searchInput = ref(route.query.s ? String(route.query.s) : '')
const keyword = ref(searchInput.value)
const results = ref([])
const currentPage = ref(Number(route.query.page) || 1)
const totalResults = ref(0)
const isLoading = ref(false)
const hydratedFromStore = ref(false)
let searchRequestSeq = 0
let lastSearchSignature = ''

const hasResults = computed(() => totalResults.value > 0)
const pageSize = SEARCH_PAGE_SIZE

const pagedResults = computed(() => results.value)

// 搜索关键字归一化与高亮分段（用于 result-title）
const normalizeForSearch = (str) => (str || '').toLowerCase()

const tokenizeForSearch = (str) =>
  normalizeForSearch(str)
    .split(/[\s,./\\\-+()'"“”‘’!?;:]+/)
    .filter(Boolean)

const matchesKeyword = (text, kw) => {
  const kwRaw = (kw || '').trim()
  if (!kwRaw) return true

  const kwNorm = normalizeForSearch(kwRaw)
  const textNorm = normalizeForSearch(text)

  // 有中文或其他非 ASCII 时，用简单包含匹配
  if (/[^\x00-\x7f]/.test(kwNorm) || /[^\x00-\x7f]/.test(textNorm)) {
    return textNorm.includes(kwNorm)
  }

  const kwTokens = tokenizeForSearch(kwNorm)
  if (!kwTokens.length) return true

  const word = textNorm // 这里传入的是单个片段（通常是一个词）

  // 宽松匹配：只要关键字中的任意一个词，与当前这个词是同根（单复数）就高亮
  return kwTokens.some((kwTok) => {
    if (word === kwTok) return true
    if (word === kwTok + 's') return true
    if (word + 's' === kwTok) return true
    return false
  })
}

// 通用的高亮分段函数（用于 title、summary、snippet）
const getHighlightSegments = (text, kw) => {
  const raw = text || ''
  const kwRaw = (kw || '').trim()
  if (!kwRaw) return [{ text: raw, highlight: false }]

  const kwNorm = normalizeForSearch(kwRaw)
  const textNorm = normalizeForSearch(raw)

  // 如果包含非 ASCII 字符（如中文），使用简单包含匹配
  if (/[^\x00-\x7f]/.test(kwNorm) || /[^\x00-\x7f]/.test(textNorm)) {
    const index = textNorm.indexOf(kwNorm)
    if (index === -1) return [{ text: raw, highlight: false }]
    return [
      { text: raw.slice(0, index), highlight: false },
      { text: raw.slice(index, index + kwRaw.length), highlight: true },
      { text: raw.slice(index + kwRaw.length), highlight: false }
    ].filter(seg => seg.text)
  }

  // 英文：精确匹配字符，搜 wonder 只高亮 wonder 部分
  const kwTokens = tokenizeForSearch(kwNorm)
  if (!kwTokens.length) return [{ text: raw, highlight: false }]

  const segments = []
  let lastIndex = 0
  const textLower = raw.toLowerCase()

  for (const kwTok of kwTokens) {
    let foundIndex = textLower.indexOf(kwTok, lastIndex)
    if (foundIndex === -1) {
      // 尝试单复数变体
      if (kwTok.endsWith('s')) {
        foundIndex = textLower.indexOf(kwTok.slice(0, -1), lastIndex)
      } else {
        foundIndex = textLower.indexOf(kwTok + 's', lastIndex)
      }
    }

    if (foundIndex !== -1) {
      if (foundIndex > lastIndex) {
        segments.push({ text: raw.slice(lastIndex, foundIndex), highlight: false })
      }
      const matchLength = kwTok.length
      segments.push({ text: raw.slice(foundIndex, foundIndex + matchLength), highlight: true })
      lastIndex = foundIndex + matchLength
    }
  }

  if (lastIndex < raw.length) {
    segments.push({ text: raw.slice(lastIndex), highlight: false })
  }

  return segments.length > 0 ? segments : [{ text: raw, highlight: false }]
}

const updateRoute = ({ queryKeyword, page }) => {
  const query = {}
  if (queryKeyword) {
    query.s = queryKeyword
  }
  if (page && page > 1) {
    query.page = page
  }
  const currentKeyword = route.query.s ? String(route.query.s) : ''
  const currentPage = Number(route.query.page) || 1
  if (currentKeyword === (query.s || '') && currentPage === (page || 1)) {
    return
  }
  router.replace({ path: route.path, query })
}

const applyStoredSession = (stored) => {
  if (!stored) return
  keyword.value = stored.query || ''
  searchInput.value = stored.query || ''
  results.value = stored.results || []
  currentPage.value = stored.currentPage || 1
  totalResults.value = Number(stored.totalResults || stored.total || stored.results?.length || 0)
}

const performSearch = async ({ page = currentPage.value } = {}) => {
  const requestId = ++searchRequestSeq
  const query = (keyword.value || '').trim()
  const signature = `${query}::${Number(page) || 1}`

  if (signature === lastSearchSignature) {
    return
  }
  lastSearchSignature = signature

  if (!query) {
    const stored = getStoredSearchSession()
    if (stored) {
      applyStoredSession(stored)
    } else {
      results.value = []
      currentPage.value = 1
      totalResults.value = 0
    }
    return
  }

  isLoading.value = true
  try {
    const payload = await withLoading(
      () => searchAllContent(query, page, pageSize),
      { text: '正在搜索，请稍候...' }
    )
    if (requestId !== searchRequestSeq) {
      return
    }
    results.value = payload.results
    currentPage.value = payload.pageNum || page || 1
    totalResults.value = Number(payload.total || 0)
    persistSearchSession({
      query: payload.query,
      results: payload.results,
      totalResults: payload.total,
      currentPage: currentPage.value,
      pageSize: payload.pageSize,
    })
  } finally {
    if (requestId === searchRequestSeq) {
      isLoading.value = false
    }
  }
}

const hydrateFromStoreIfPossible = () => {
  const stored = getStoredSearchSession()
  if (!stored) return false

  const routeKeyword = (keyword.value || '').trim()
  const storedKeyword = (stored.query || '').trim()
  const routePage = Number(route.query.page) || 1
  const storedPage = Number(stored.currentPage || 1)

  if (routeKeyword && storedKeyword && routeKeyword === storedKeyword && routePage === storedPage) {
    applyStoredSession(stored)
    return true
  }

  return false
}

const handleSubmit = () => {
  keyword.value = (searchInput.value || '').trim()
  updateRoute({ queryKeyword: keyword.value, page: 1 })
}

const handlePageChange = (page) => {
  if (page === currentPage.value) return
  currentPage.value = page
  updateRoute({ queryKeyword: keyword.value, page })
}

const openResult = (result) => {
  if (!result?.targetUrl) return

  // 确保 targetUrl 是绝对路径（以 / 开头）
  let targetPath = result.targetUrl
  if (!targetPath.startsWith('/')) {
    targetPath = '/' + targetPath
  }

  // 解析查询参数，构建完整的路径
  const url = new URL(targetPath, window.location.origin)
  const fullPath = url.pathname + url.search

  // 在新窗口打开前，更新 localStorage 中的 tto_last_path
  // 这样可以确保新窗口打开后，路由守卫不会重定向回搜索结果页
  try {
    localStorage.setItem('tto_last_path', fullPath.split('#')[0])
  } catch (e) {
    // 忽略 localStorage 错误
  }

  // 构建完整的URL，直接使用正确的路由路径
  const currentUrl = new URL(window.location.href)
  const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`

  // 带上全站搜索词：目标页搜索框预填；有 dialogItemId 时仅定位条目，不缩小列表
  const targetUrl = new URL(fullPath, baseUrl)
  if (route.query.s) {
    targetUrl.searchParams.set('s', String(route.query.s))
  }

  const fullUrl = targetUrl.href

  // 打开新窗口
  window.open(fullUrl, '_blank', 'noopener')
}

watch(
  () => [route.query.s, route.query.page],
  ([newKeyword, newPage], [oldKeyword, oldPage] = []) => {
    const normalizedKeyword = newKeyword ? String(newKeyword) : ''
    const normalizedPage = Number(newPage) || 1
    if (newKeyword === oldKeyword && newPage === oldPage) return

    keyword.value = normalizedKeyword
    searchInput.value = normalizedKeyword
    currentPage.value = normalizedPage
    hydratedFromStore.value = false

    if (normalizedKeyword) {
      void performSearch({ page: normalizedPage })
    }
  }
)

onMounted(() => {
  if (hydrateFromStoreIfPossible()) {
    hydratedFromStore.value = true
    return
  }
  if (keyword.value) {
    void performSearch({ page: currentPage.value })
  } else {
    const stored = getStoredSearchSession()
    if (stored) {
      applyStoredSession(stored)
      updateRoute({ queryKeyword: stored.query, page: stored.currentPage })
    }
  }
})
</script>

<template>
  <div class="search-results-page">
    <div class="search-header">
      <div class="search-title">
        <h1>全站搜索</h1>
        <p v-if="keyword">“{{ keyword }}” 的搜索结果，共 {{ totalResults }} 条</p>
        <p v-else>输入关键词，探索内容</p>
      </div>
      <!-- <div class="search-bar">
        <el-input v-model="searchInput" placeholder="输入目的地、景点或关键词" size="large" @keyup.enter="handleSubmit">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
</el-input>
<el-button type="primary" size="large" class="search-btn" @click="handleSubmit">搜索</el-button>
</div> -->
    </div>

    <div v-if="isLoading" class="loading-state">正在搜索，请稍候...</div>

    <div v-else class="results-section">
      <div v-if="hasResults" class="results-list">
        <article v-for="result in pagedResults" :key="result.id" class="result-card">
          <div class="result-meta">
            <span class="meta-tag">{{ result.sectionTag }}</span>
            <span v-if="result.subNavName" class="meta-sub">{{ result.subNavName }}</span>
            <span v-if="result.groupName" class="meta-sub">{{ result.groupName }}</span>
          </div>
          <h3 class="result-title">
            <span v-for="(seg, idx) in getHighlightSegments(result.title, keyword)" :key="idx">
              <span v-if="seg.highlight" class="result-title-highlight">{{ seg.text }}</span>
              <span v-else>{{ seg.text }}</span>
            </span>
          </h3>
          <p v-if="result.summary" class="result-summary">
            <span v-for="(seg, idx) in getHighlightSegments(result.summary, keyword)" :key="idx">
              <span v-if="seg.highlight" class="result-title-highlight">{{ seg.text }}</span>
              <span v-else>{{ seg.text }}</span>
            </span>
          </p>
          <p class="result-snippet">
            <span v-for="(seg, idx) in getHighlightSegments(result.snippet, keyword)" :key="idx">
              <span v-if="seg.highlight" class="result-title-highlight">{{ seg.text }}</span>
              <span v-else>{{ seg.text }}</span>
            </span>
          </p>
          <div class="result-actions">
            <el-button type="primary" text @click="openResult(result)">新窗口打开</el-button>
          </div>
        </article>
      </div>
      <div v-else class="empty-state">
        <p>未找到匹配的内容，可以尝试更换关键词。</p>
      </div>

      <div class="pagination-wrapper" v-if="hasResults && totalResults > pageSize">
        <el-pagination :current-page="currentPage" :page-size="pageSize" :total="totalResults"
          layout="prev, pager, next" background @current-change="handlePageChange" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-results-page {
  width: 90%;
  margin: 60px auto 80px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  color: #111827;
}

.search-header {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  box-shadow: 0 10px 30px rgba(148, 163, 184, 0.2);
}

.search-title h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: #0f172a;
}

.search-title p {
  margin: 8px 0 0;
  color: #475569;
  font-size: 14px;
}

.search-bar {
  display: flex;
  gap: 12px;
}

.search-btn {
  padding: 0 28px;
}

.loading-state,
.empty-state {
  text-align: center;
  font-size: 14px;
  color: #64748b;
  padding: 40px 0;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.meta-tag {
  background: #eef2ff;
  color: #4338ca;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 600;
}

.meta-sub {
  background: #ecfeff;
  color: #0f766e;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 500;
}

.result-title {
  font-size: 20px;
  margin: 0;
  color: #0f172a;
}

.result-title-highlight {
  color: #33b1a3;
  font-weight: 700;
}

.result-summary {
  display: -webkit-box;
  margin: 0;
  color: #475569;
  font-size: 13px;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-snippet {
  margin: 0;
  color: #1f2937;
  font-size: 12px;
  line-height: 1.6;
}

.result-actions {
  margin-top: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

@media (max-width: 768px) {
  .search-results-page {
    width: 95%;
    margin-top: 40px;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-btn {
    width: 100%;
  }
}
</style>
