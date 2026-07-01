<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useNavStore } from '@/stores/nav'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import data from '@/data/split/nav.json'
import ComingSoonDialog from '@/components/ComingSoonDialog.vue';
import { getStoredSearchSession } from '@/utils/searchService'
import { markSearchPageReset } from '@/utils/searchNavigation'
import { notifyApiError } from '@/utils/apiFeedback'

const comingSoonDialogRef = ref(null);

// 显示ComingSoonDialog
function showComingSoonDialog() {
  if (comingSoonDialogRef.value) {
    comingSoonDialogRef.value.showComingDialog = true;
  }
}

// 从data.json中提取所有导航tagName（恢复8大导航）
const tags = data.map(item => item.tagName)

// 本地搜索输入值（用于占位显示当前标签）
const searchInput = ref('')
// 实际搜索关键词
const searchKeyword = ref('')
const committedSearchKeyword = ref('')
const searchKeywordEdited = ref(false)
const isSearching = ref(false)

const localActiveTag = ref('')

// 本地存储键名
const STORAGE_KEY = 'services_nav_active_tag'

// 使用导航store
const navStore = useNavStore()
const router = useRouter()
const route = useRoute()

const isSearchPath = (path) => typeof path === 'string' && path.includes('/search')
const isFavoritesPath = (path) => typeof path === 'string' && path.includes('/favorites')
const isSearchRoute = computed(() => isSearchPath(router.currentRoute.value.path))

function syncCommittedSearchFromRoute() {
  if (!isSearchPath(route.path)) return
  const queryKeyword = route.query.s ? String(route.query.s).trim() : ''
  if (!queryKeyword) return
  searchKeyword.value = queryKeyword
  committedSearchKeyword.value = queryKeyword
  searchKeywordEdited.value = false
}

function markSearchInputEdited() {
  searchKeywordEdited.value = true
}

// 当前激活的标签（组件内部独立实现）
if (tags.length > 0 && !localActiveTag.value) {
  localActiveTag.value = tags[0]
}

const activeTag = computed(() => {
  if (isSearchRoute.value) {
    return ''
  }
  if (isFavoritesPath(router.currentRoute.value.path)) {
    return ''
  }
  // 优先使用组件内部的激活标签状态
  if (localActiveTag.value) {
    return localActiveTag.value
  }
  return ''
})

// 在标签点击事件中添加路由跳转
function onClickTag(tag, event) {
  try {
    // 阻止默认的链接行为
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // 保存到本地存储（在新窗口打开前更新）
    localStorage.setItem(STORAGE_KEY, tag)

    // 重置子导航为默认值
    navStore.saveSelectedSubNav('景点')

    // 根据data.json中的path配置进行路由跳转
    const tagData = data.find(item => item.tagName === tag)

    if (tagData && tagData.path) {
      let fullPath = `/DemoForTTO/${tagData.path}`

      // 如果是freeinfo路径，添加subNavName参数
      if (tagData.path === 'trips/freeinfo') {
        fullPath = `/DemoForTTO/${tagData.path}?subNavName=景点`
      }
      // 如果是一日游/多日游路径（trips/routes），添加dayTripTab参数
      else if (tagData.path === 'trips/routes') {
        fullPath = `/DemoForTTO/${tagData.path}?dayTripTab=1`
      }

      // 在新窗口打开前，更新 tto_last_path，确保新窗口能正确渲染内容
      localStorage.setItem('tto_last_path', fullPath)
      // 同时更新 navStore
      navStore.savePath(fullPath)

      // 在新窗口打开
      const baseUrl = window.location.origin
      const newUrl = `${baseUrl}${fullPath}`
      window.open(newUrl, '_blank')
    }
  } catch (error) {
  }
}

// 根据路由路径同步标签状态
function syncTagWithRoute(forceUseStorage = false) {
  try {
    // 获取当前路径（不包含#top锚点）
    const currentPath = router.currentRoute.value.path
    if (isSearchPath(currentPath)) {
      localActiveTag.value = ''
      searchInput.value = ''
      return
    }
    const savedActiveTag = localStorage.getItem(STORAGE_KEY)

    // 如果强制使用本地存储（新窗口打开时），优先使用本地存储的值
    if (forceUseStorage && savedActiveTag) {
      if (tags.includes(savedActiveTag)) {
        localActiveTag.value = savedActiveTag
        searchInput.value = savedActiveTag
      }
      return
    }

    // 根据当前路由路径找到对应的标签
    const matchedTag = data.find(item => {
      if (item.path) {
        return currentPath.includes(item.path)
      }
      return false
    })

    // 如果本地存储的标签和路由匹配的标签一致，或者路由匹配到了标签，则使用路由匹配的标签
    if (matchedTag) {
      // 如果本地存储的标签和路由匹配的标签一致，优先使用本地存储（保持用户选择）
      if (savedActiveTag === matchedTag.tagName) {
        localActiveTag.value = savedActiveTag
        searchInput.value = savedActiveTag
      } else {
        // 否则使用路由匹配的标签
        localActiveTag.value = matchedTag.tagName
        searchInput.value = matchedTag.tagName
        // 同时更新本地存储
        localStorage.setItem(STORAGE_KEY, matchedTag.tagName)
      }
      return
    }

    // 如果路由没有匹配到标签，但本地存储有值，则使用本地存储的值
    if (savedActiveTag && tags.includes(savedActiveTag)) {
      localActiveTag.value = savedActiveTag
      searchInput.value = savedActiveTag
      return
    }

    // 如果都没有，使用默认标签
    if (tags.length > 0 && !localActiveTag.value) {
      localActiveTag.value = tags[0]
      searchInput.value = tags[0]
    }
  } catch (error) {
  }
}

// 组件挂载时初始化
onMounted(() => {
  const currentPath = router.currentRoute.value.path
  if (isSearchPath(currentPath) || isFavoritesPath(currentPath)) {
    localActiveTag.value = ''
    searchInput.value = ''
    if (isSearchPath(currentPath)) {
      const storedSearch = getStoredSearchSession()
      searchKeyword.value = storedSearch?.query || ''
      committedSearchKeyword.value = searchKeyword.value.trim()
      searchKeywordEdited.value = false
    } else {
      searchKeyword.value = ''
    }
    return
  }
  searchKeyword.value = ''
  syncTagWithRoute()

  // 如果同步后仍然没有激活标签，则使用默认值
  if (!localActiveTag.value) {
    // 首次访问，默认选中"包车服务"
    const defaultTag = data.find(item => item.tagName === '包车服务')
    if (defaultTag) {
      localActiveTag.value = defaultTag.tagName
      searchInput.value = defaultTag.tagName
    } else if (tags.length > 0) {
      // 备选方案：如果找不到指定的默认标签，则使用第一个标签
      localActiveTag.value = tags[0]
      searchInput.value = tags[0]
    }
  }

})

watch(() => [router.currentRoute.value.path, router.currentRoute.value.query.s], () => {
  syncCommittedSearchFromRoute()
})

// 监听路由变化，同步标签状态
watch(() => router.currentRoute.value.path, () => {
  // 根据路由路径找到对应的标签
  const currentPath = router.currentRoute.value.path
  if (isSearchPath(currentPath) || isFavoritesPath(currentPath)) {
    localActiveTag.value = ''
    searchInput.value = ''
    if (isSearchPath(currentPath)) {
      const storedSearch = getStoredSearchSession()
      searchKeyword.value = storedSearch?.query || ''
      committedSearchKeyword.value = searchKeyword.value.trim()
      searchKeywordEdited.value = false
    } else {
      searchKeyword.value = ''
    }
    return
  }
  searchKeyword.value = ''
  const matchedTag = data.find(item => {
    if (item.path) {
      return currentPath.includes(item.path)
    }
    return false
  })

  const savedActiveTag = localStorage.getItem(STORAGE_KEY)

  // 如果路由匹配到了标签
  if (matchedTag) {
    // 如果本地存储的值和路由匹配的标签一致，使用本地存储的值
    if (savedActiveTag === matchedTag.tagName) {
      localActiveTag.value = savedActiveTag
      searchInput.value = savedActiveTag
    } else {
      // 如果路由匹配到了不同的标签，根据路由更新（用户在新窗口内导航）
      localActiveTag.value = matchedTag.tagName
      searchInput.value = matchedTag.tagName
      localStorage.setItem(STORAGE_KEY, matchedTag.tagName)
    }
    return
  }

  // 如果路由没有匹配到标签，但本地存储有值，则使用本地存储的值
  if (savedActiveTag) {
    const isValidTag = tags.includes(savedActiveTag)
    if (isValidTag) {
      localActiveTag.value = savedActiveTag
      searchInput.value = savedActiveTag
      return
    }
  }

  // 如果都没有，根据路由同步
  syncTagWithRoute()
})

// 搜索：未改词且未编辑输入框时，第 1 页不请求；其他页只回到第 1 页并用缓存
async function onSearch() {
  const keyword = (searchKeyword.value || '').trim()
  if (!keyword || isSearching.value) return

  isSearching.value = true
  try {
    const onSearchPage = route.path.endsWith('/search')
    const currentPage = Number(route.query.page) || 1
    const unchangedQuery = keyword === committedSearchKeyword.value && !searchKeywordEdited.value

    if (unchangedQuery && onSearchPage) {
      if (currentPage === 1) return
      markSearchPageReset()
      await router.replace({
        path: '/DemoForTTO/search',
        query: { s: keyword },
      })
      return
    }

    committedSearchKeyword.value = keyword
    searchKeywordEdited.value = false

    await router.push({
      path: '/DemoForTTO/search',
      query: { s: keyword },
    })
  } catch (error) {
    notifyApiError(error, { action: '搜索', dedupeKey: 'search:nav' })
  } finally {
    isSearching.value = false
  }
}
</script>

<template>
  <div>
    <div class="search-fixed">
      <el-card class="search-card" shadow="hover">
        <div class="search-tags">
          <a v-for="(tag, index) in tags" :key="tag" class="tag-pill pointer fs16" :class="{
            active: activeTag === tag,
            disabled: !data[index].available || data[index].available === false
          }"
            @click="(data[index].available !== false && data[index].available !== undefined) && onClickTag(tag, $event)"
            :data-service="tag" href="javascript:void(0)">
            <span class="tag-content">
              <template v-if="tag.includes('免费参考信息')">
                {{ tag.split('免费参考信息')[0] }}
                <br />
                免费参考信息
              </template>
              <template v-else>
                {{ tag }}
              </template>
            </span>
          </a>
        </div>
        <div class="search-container">
          <el-input v-model="searchKeyword" placeholder="搜索全站..." class="search-input" size="large" clearable
            @input="markSearchInputEdited" @clear="markSearchInputEdited" @keyup.enter="onSearch">
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
          <el-button type="primary" size="large" class="search-btn fs14" :loading="isSearching" :disabled="isSearching"
            @click="onSearch">
            <el-icon>
              <Search />
            </el-icon>
            搜索
          </el-button>
        </div>
      </el-card>
    </div>

    <ComingSoonDialog ref="comingSoonDialogRef" />
  </div>
</template>

<style lang="scss" scoped>
.search-fixed {
  display: flex;
  justify-content: center;
  position: relative;
  // top: 40px;
  top: 25px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  padding: 0 20px;

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .search-card {
    border-radius: 12px;
    border: none;

    .search-container {
      display: flex;
      gap: 12px;
      // width: 800px;
      width: 1200px;
      margin-top: 30px;

      .search-input {
        flex: 1;

        :deep(.el-input__wrapper) {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          height: 46px;
          padding: 6px 14px;
          font-size: 13px;
        }
      }

      .search-btn {
        border-radius: 8px;
        padding: 0 24px;
        font-weight: 500;
        height: 46px;
      }
    }

    .search-tags {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      // grid-template-columns: repeat(8, 1fr);
      gap: 12px;
      // width: 1200px;
      width: 800px;

      .tag-pill {
        display: flex;
        border-radius: 10px;
        transition: all 0.2s ease;
        // height: auto;
        height: 73px;
        padding: 8px 10px;
        align-items: center;
        justify-content: center;
        background: linear-gradient(180deg, #ffffff 0%, #e6f7f6 100%);
        color: #33b1a3;
        user-select: none;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.03) inset;
        text-decoration: none;
        width: 100%;
        box-sizing: border-box;
        line-height: 1.4;
        white-space: pre-line;

        .tag-content {
          display: inline;
          text-align: center;
          width: 100%;
        }

        br {
          display: block;
          height: 8px;
          content: '';
          margin: 4px 0;
        }

        .small-text {
          // font-size: 15px;
          line-height: 1.2;
        }
      }

      .active {
        display: flex;
        height: auto;
        padding: 8px 10px;
        align-items: center;
        justify-content: center;
        background: linear-gradient(180deg, #33b1a3 0%, #279486 100%);
        color: #fff;
        box-shadow: 0 6px 16px rgba(61, 199, 190, 0.26);
        width: 100%;
        box-sizing: border-box;
        line-height: 1.4;
        white-space: pre-line;

        .tag-content {
          display: inline;
          text-align: center;
          width: 100%;
        }

        .small-text {
          color: #fff;
        }
      }

      .disabled {
        // display: flex;
        // height: auto;
        padding: 8px 10px;
        // align-items: center;
        // justify-content: center;
        background: linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%);
        color: #9ca3af;
        cursor: not-allowed;
        box-shadow: none;
        width: 100%;
        box-sizing: border-box;
        line-height: 1.4;
        white-space: pre-line;

        .tag-content {
          display: inline;
          text-align: center;
          width: 100%;
        }

        .small-text {
          color: #9ca3af;
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .search-fixed {
    .search-card {
      .search-container {
        width: 100%;
        max-width: 1000px;
      }
    }
  }
}

/* 响应式适配：平板（768px-1024px） */
@media (min-width: 768px) and (max-width: 1024px) {
  .el-container {
    .el-main {
      .search-fixed {
        display: flex;
        justify-content: center;
        bottom: 16px;
        margin-bottom: 20px;

        .search-card {
          max-width: 720px;
        }

        .search-container {
          width: 100%;
        }

        .search-tags {
          grid-template-columns: repeat(4, 1fr);
          width: 100%;

          .tag-pill {
            width: 160px;
          }
        }

        .tag-pill,
        .active,
        .disabled {
          font-size: 11px;
          padding: 6px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1.4;
          white-space: pre-line;
        }

        .tag-pill .tag-content,
        .active .tag-content,
        .disabled .tag-content {
          display: inline;
          text-align: center;
          width: 100%;
        }

        .tag-pill br,
        .active br,
        .disabled br {
          height: 4px;
          margin: 2px 0;
        }
      }
    }
  }
}

@media (max-width: 767px) {
  .el-container {
    .el-main {
      .search-fixed {
        position: static;
        transform: none;
        z-index: auto;
        width: 100%;
        padding: 8px 12px 20px;
        top: auto;

        .search-card {
          max-width: 95vw;
          margin-top: 8px;
        }

        .search-container {
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .search-input {
          width: 100%;
        }

        .search-btn {
          width: 100%;
        }

        .search-tags {
          width: 100%;
          // gap: 6px 0px;
          gap: 6px;
          grid-template-columns: repeat(2, 1fr);

          .tag-pill {
            font-size: 16px;
            width: 150px;
          }
        }

        .tag-pill,
        .active,
        .disabled {
          padding: 6px 10px;
          line-height: 1.4;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: pre-line;
        }

        .tag-pill .tag-content,
        .active .tag-content,
        .disabled .tag-content {
          display: inline;
          text-align: center;
          width: 100%;
        }

        .tag-pill br,
        .active br,
        .disabled br {
          height: 6px;
          margin: 3px 0;
        }
      }
    }
  }
}

@media (max-width: 1024px) {
  .el-container {
    .el-main {
      .search-fixed {
        .search-card {
          .search-tags {
            .small-text {
              font-size: 12px;
            }
          }
        }
      }
    }
  }
}

/* 超小屏幕设备适配（iPhone 4、iPhone 5、iPhone SE等，<=375px） */
@media (max-width: 375px) {
  .el-container {
    .el-main {
      .search-fixed {
        padding: 6px 8px 20px;

        .search-card {
          max-width: 98vw;
        }

        .tag-pill,
        .active,
        .disabled {
          padding: 4px 8px;
          line-height: 1.4;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: pre-line;
        }

        .tag-pill .tag-content,
        .active .tag-content,
        .disabled .tag-content {
          display: inline;
          text-align: center;
          width: 100%;
        }

        .tag-pill br,
        .active br,
        .disabled br {
          height: 4px;
          margin: 2px 0;
        }

      }
    }
  }
}

/* 极超小屏幕设备适配（iPhone 4等，<=320px） */
@media (max-width: 320px) {
  .el-container {
    .el-main {
      .search-fixed {
        padding: 4px 6px 0;

        .search-card {
          max-width: 99vw;
        }

        .search-tags {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 3px;

          .tag-pill,
          .active,
          .disabled {
            padding: 3px 4px;
            font-size: 11px;
            line-height: 1.4;
            display: flex;
            align-items: center;
            justify-content: center;
            white-space: pre-line;
          }

          .tag-pill {
            width: 130px;
            min-width: 0;
          }

          .tag-pill .tag-content,
          .active .tag-content,
          .disabled .tag-content {
            display: inline;
            text-align: center;
            width: 100%;
          }

          .tag-pill br,
          .active br,
          .disabled br {
            height: 4px;
            margin: 2px 0;
          }
        }
      }
    }
  }
}
</style>