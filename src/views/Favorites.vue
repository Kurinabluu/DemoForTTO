<script setup>
import { ref, computed, watch, onMounted, onUnmounted, onActivated } from 'vue';
import { ElPagination, ElInput, ElButton, ElSelect, ElOption, ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import {
  favorites,
  removeFavoriteAsync,
  prepareMigrationTestLocalFavorites,
  switchToLocalFavorites,
  refreshRemoteFavorites,
  getPostLoginSyncPromise,
  isRemoteFavoritesLoaded,
  isPostLoginSyncing,
  MAX_FAVORITES,
} from '@/utils/favoritesStore';
import { notifyFavoriteResult } from '@/utils/favoriteMessages';
import { resolveDataImage } from '@/utils/dataImageResolver';
import FreeInfoDialog from '@/components/FreeInfoDialog.vue';
import TripDialog from '@/components/TripDialog.vue';
import {
  buildFreeInfoDialogPayload,
  findFreeInfoSourceItem,
  getFreeInfoGridImagePath,
  resolveOriginalImages,
  getFreeInfoDialogImagePaths,
} from '@/utils/freeInfoImageUtils';
import { loadCatalogItemDetail } from '@/utils/contentRepository';
import { isApiEnabled } from '@/utils/ttoApi';
import { shouldUseRemoteFavorites, logout } from '@/utils/authStore';
import { withLoading } from '@/utils/loadingUtils';
import { getApiErrorMessage, notifyApiError } from '@/utils/apiFeedback';

const ALL_SOURCE_VALUE = '__all__';

const FAVORITE_DEFAULT_IMAGE =
  resolveDataImage('@/assets/img/default.png', '', { variant: 'thumb' })
  || resolveDataImage('@/assets/img/default.png');

const getThumbImageUrl = (imgPath) => {
  const raw = String(imgPath || '').trim();
  if (!raw) return '';
  return resolveDataImage(raw, '', { variant: 'thumb' });
};

const getCoverImageUrl = (item) => {
  const matched = findFreeInfoSourceItem(item?.title);
  const subNavName = matched?.subNavName || item?.subNavName || item?.tripData?.displaySubNav || '';
  if (matched?.sourceItem) {
    const gridPath = getFreeInfoGridImagePath(matched.sourceItem, subNavName);
    if (gridPath) {
      const resolved = getThumbImageUrl(gridPath);
      if (resolved) return resolved;
    }
  }

  const tripDataImageGroups = [
    item?.tripData?.cover ? [item.tripData.cover] : [],
    item?.tripData?.images,
    item?.tripData?.banners,
    item?.tripData?.bannerList,
    item?.tripData?.imgs,
    item?.tripData?.img
  ];
  const tripDataImage = tripDataImageGroups
    .flatMap((group) => {
      if (Array.isArray(group)) return group;
      if (group) return [group];
      return [];
    })
    .map((path) => getThumbImageUrl(path))
    .find(Boolean);
  if (tripDataImage) return tripDataImage;

  if (item?.image) {
    const resolvedImage = getThumbImageUrl(item.image);
    if (resolvedImage) return resolvedImage;
  }
  if (item?.banner) {
    const resolvedImage = getThumbImageUrl(item.banner);
    if (resolvedImage) return resolvedImage;
  }
  if (item?.img) {
    if (Array.isArray(item.img) && item.img.length > 0) {
      const resolvedImage = getThumbImageUrl(item.img[0]);
      if (resolvedImage) return resolvedImage;
    } else {
      const resolvedImage = getThumbImageUrl(item.img);
      if (resolvedImage) return resolvedImage;
    }
  }
  return FAVORITE_DEFAULT_IMAGE;
};

const getOriginalDialogImageUrl = (item) => {
  const matched = findFreeInfoSourceItem(item?.title);
  const subNavName = matched?.subNavName || item?.subNavName || item?.tripData?.displaySubNav || '';
  const imagePaths = getFreeInfoDialogImagePaths(
    matched?.sourceItem,
    subNavName,
    item?.tripData || {},
  );
  const resolved = resolveOriginalImages(imagePaths);
  if (resolved.length) return resolved[0];

  const fallbackPaths = [
    item?.tripData?.cover,
    item?.banner,
    item?.image,
    item?.banner,
    item?.img,
  ].flatMap((group) => (Array.isArray(group) ? group : group ? [group] : []));

  for (const imagePath of fallbackPaths) {
    const resolvedImage = resolveDataImage(imagePath, '');
    if (resolvedImage) return resolvedImage;
  }

  return FAVORITE_DEFAULT_IMAGE;
};

// 搜索相关
const searchInput = ref('');
const searchKeyword = ref('');
const sourceFilter = ref(ALL_SOURCE_VALUE);
const currentPage = ref(1);
const windowWidth = ref(window.innerWidth);
const remoteFavorites = ref([]);
const remoteFavoritesTotal = ref(0);
const remoteFavoritesLoading = ref(false);
const remoteLoadError = ref('');
const migrationTestLoading = ref(false);
const useRemoteFavorites = computed(() => shouldUseRemoteFavorites());
const isFavoritesSyncing = computed(() => isPostLoginSyncing.value);
const isPageInteractionDisabled = computed(() => isFavoritesSyncing.value || remoteFavoritesLoading.value);
// 弹窗相关
const dialogVisible = ref(false);
const currentItem = ref(null);
// 根据屏幕尺寸动态计算每页显示数量
const itemsPerPage = computed(() => {
  if (windowWidth.value <= 768) {
    return 3;
  }
  else if (windowWidth.value <= 1024) {
    return 8;
  }
  else {
    return 12;
  }
});
const getSourceName = (item) => {
  return String(item?.subNavName || item?.tripData?.displaySubNav || item?.tripData?.subNavName || '').trim();
};

const compareFavoriteOrder = (left, right) => {
  const leftId = Number(left?.favoriteId);
  const rightId = Number(right?.favoriteId);
  const leftHasId = Number.isFinite(leftId);
  const rightHasId = Number.isFinite(rightId);

  if (leftHasId && rightHasId) {
    return leftId - rightId;
  }

  const leftTime = Date.parse(left?.createdAt || left?.tripData?.createdAt || '');
  const rightTime = Date.parse(right?.createdAt || right?.tripData?.createdAt || '');
  const leftHasTime = Number.isFinite(leftTime);
  const rightHasTime = Number.isFinite(rightTime);

  if (leftHasTime && rightHasTime) {
    return leftTime - rightTime;
  }

  return 0;
};

const sortedFavoriteItems = computed(() => {
  return [...favorites.value].sort(compareFavoriteOrder);
});

const filteredFavoriteSourceItems = computed(() => {
  let data = [...sortedFavoriteItems.value];
  const activeSource = sourceFilter.value || ALL_SOURCE_VALUE;
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    data = data.filter(item => item.title.toLowerCase().includes(keyword) ||
      (item.region || '').toLowerCase().includes(keyword) ||
      (item.town && item.town.toLowerCase().includes(keyword)));
  }
  if (activeSource !== ALL_SOURCE_VALUE) {
    data = data.filter((item) => getSourceName(item) === activeSource);
  }
  return data;
});

// 当前收藏数据（响应式，登录后远程同步会更新）
const localCurrentFavorites = computed(() => {
  return filteredFavoriteSourceItems.value.map((item) => {
    if (findFreeInfoSourceItem(item?.title)) {
      return buildFreeInfoDialogPayload(item);
    }
    return item;
  });
});

const displayedFavorites = computed(() => {
  if (useRemoteFavorites.value) {
    if (isFavoritesSyncing.value) {
      return [];
    }
    return remoteFavorites.value;
  }
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return localCurrentFavorites.value.slice(start, end);
});

const sourceOptions = computed(() => {
  const options = new Set();
  sortedFavoriteItems.value.forEach((item) => {
    const source = getSourceName(item);
    if (source) {
      options.add(source);
    }
  });
  return Array.from(options);
});

const isDayTripFavorite = (item) => {
  const type = String(item?.itemType || item?.type || '').trim();
  return type === '一日游' || type === '多日游' || type.includes('日游') || type.includes('行程') || type === 'trip';
};

const currentDialogBanner = computed(() => {
  if (!currentItem.value) return '';
  return getOriginalDialogImageUrl(currentItem.value);
});
// 总页数
const totalPages = computed(() => {
  const total = useRemoteFavorites.value ? remoteFavoritesTotal.value : localCurrentFavorites.value.length;
  return Math.max(1, Math.ceil(total / itemsPerPage.value));
});
const favoriteTotalCount = computed(() => {
  return useRemoteFavorites.value ? remoteFavoritesTotal.value : localCurrentFavorites.value.length;
});
// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};
// 处理分页变化
const handlePageChange = (page) => {
  if (isFavoritesSyncing.value) return;
  currentPage.value = page;
  if (useRemoteFavorites.value) {
    applyRemoteFavoritesView();
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
// 执行搜索（点击搜索按钮或按回车键后执行）
const executeSearch = async () => {
  if (isFavoritesSyncing.value) return;
  searchKeyword.value = searchInput.value;
  currentPage.value = 1;
  if (useRemoteFavorites.value) {
    applyRemoteFavoritesView();
  }
};
// 清除搜索（点击清除按钮后执行）
const clearSearch = async () => {
  if (isFavoritesSyncing.value) return;
  searchInput.value = '';
  searchKeyword.value = '';
  currentPage.value = 1;
  if (useRemoteFavorites.value) {
    applyRemoteFavoritesView();
  }
};
const handleSourceChange = async () => {
  if (isFavoritesSyncing.value) return;
  currentPage.value = 1;
  if (useRemoteFavorites.value) {
    applyRemoteFavoritesView();
  }
};
// 打开弹窗
const openDialog = async (item) => {
  if (isFavoritesSyncing.value) return;
  let enriched = item
  if (isApiEnabled() && item?.id != null) {
    try {
      const detail = await withLoading(
        () => loadCatalogItemDetail(item.id),
        { text: '正在加载详情...' }
      )
      if (detail) {
        enriched = {
          ...item,
          ...detail,
          title: detail.title || item.title,
          enTitle: detail.enTitle ?? item.enTitle,
          itemType: item.itemType || item.type || detail.itemType || detail.tripType,
          tripData: {
            ...(item.tripData && typeof item.tripData === 'object' ? item.tripData : {}),
            ...(detail.tripData && typeof detail.tripData === 'object' ? detail.tripData : {}),
          },
        }
      }
    } catch (error) {
      notifyApiError(error, { action: '详情', dedupeKey: 'favorites:detail' })
    }
  }
  currentItem.value = buildFreeInfoDialogPayload(enriched)
  dialogVisible.value = true
};
// 关闭弹窗
const closeDialog = () => {
  dialogVisible.value = false;
  currentItem.value = null;
};
// 取消收藏
const handleRemoveFavorite = async (item, event) => {
  if (isFavoritesSyncing.value) return;
  event.stopPropagation();
  try {
    await withLoading(async () => {
      await removeFavoriteAsync(item.id, item.itemType || item.type, item.title, item.favoriteId, item.itemKey);
      notifyFavoriteResult('removed');
      if (useRemoteFavorites.value) {
        applyRemoteFavoritesView();
        return;
      }
    }, { text: '正在取消收藏...' });
  } catch (error) {
    notifyApiError(error, { action: '取消收藏', dedupeKey: 'favorites:remove' })
    return
  }
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value);
  }
};
// 监听收藏变化（弹窗内取消收藏时关闭弹窗）
const handleFavoriteChange = (result) => {
  if (result === 'removed') {
    closeDialog();
    if (useRemoteFavorites.value) {
      applyRemoteFavoritesView();
      return;
    }
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value);
    }
  }
};

async function handleMigrationTestPrep() {
  if (migrationTestLoading.value) return
  if (!isApiEnabled()) {
    ElMessage.warning('请先开启 API 模式后再使用迁移测试')
    return
  }
  migrationTestLoading.value = true
  try {
    logout()
    switchToLocalFavorites()
    const count = await prepareMigrationTestLocalFavorites(MAX_FAVORITES - 5)
    currentPage.value = 1
    remoteLoadError.value = ''
    ElMessage.success(`已退出登录，并写入 ${count} 条本地收藏，请重新登录测试迁移`)
  } catch (error) {
    notifyApiError(error, { action: '准备迁移测试', dedupeKey: 'favorites:migration-test' })
  } finally {
    migrationTestLoading.value = false
  }
}

function applyRemoteFavoritesView() {
  const all = localCurrentFavorites.value;
  remoteFavoritesTotal.value = all.length;

  const totalPageCount = Math.max(1, Math.ceil(remoteFavoritesTotal.value / itemsPerPage.value));
  if (currentPage.value > totalPageCount) {
    currentPage.value = totalPageCount;
  }

  const start = (currentPage.value - 1) * itemsPerPage.value;
  remoteFavorites.value = all.slice(start, start + itemsPerPage.value);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function syncRemoteFavoritesView({ showLoading = false, forceRefresh = false } = {}) {
  if (!useRemoteFavorites.value) {
    remoteFavoritesLoading.value = false;
    return;
  }

  const pendingLoginSync = getPostLoginSyncPromise();
  const showSyncLoading = isPostLoginSyncing.value || (showLoading && !pendingLoginSync);

  if (showSyncLoading) {
    remoteFavoritesLoading.value = true;
  }
  remoteLoadError.value = '';

  try {
    if (pendingLoginSync) {
      const result = await pendingLoginSync;
      if (!useRemoteFavorites.value || result?.cancelled) {
        return;
      }
    } else if (!isRemoteFavoritesLoaded() || forceRefresh) {
      if (showLoading) {
        await withLoading(() => refreshRemoteFavorites(true), { text: '正在同步收藏...' });
      } else {
        await refreshRemoteFavorites(true);
      }
    }
    if (useRemoteFavorites.value) {
      applyRemoteFavoritesView();
    }
  } catch (error) {
    remoteFavorites.value = [];
    remoteFavoritesTotal.value = 0;
    remoteLoadError.value = getApiErrorMessage(error);
    notifyApiError(error, { action: '加载收藏', dedupeKey: 'favorites:list' });
  } finally {
    remoteFavoritesLoading.value = false;
  }
}

async function syncFavorites() {
  if (useRemoteFavorites.value) {
    await syncRemoteFavoritesView({ showLoading: true });
    return;
  }

  const totalPagesCount = Math.max(1, Math.ceil(localCurrentFavorites.value.length / itemsPerPage.value));
  if (currentPage.value > totalPagesCount) {
    currentPage.value = totalPagesCount;
  }
}

async function retryLoadFavorites() {
  await syncRemoteFavoritesView({ showLoading: true, forceRefresh: true });
}

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  await syncFavorites();
});

onActivated(async () => {
  await syncFavorites();
});
watch(useRemoteFavorites, async (useRemote) => {
  if (!useRemote) {
    remoteFavorites.value = [];
    remoteFavoritesTotal.value = 0;
    remoteLoadError.value = '';
    remoteFavoritesLoading.value = false;
    return;
  }
  await syncRemoteFavoritesView();
});
watch([itemsPerPage, currentPage, searchKeyword, sourceFilter], () => {
  if (useRemoteFavorites.value) {
    applyRemoteFavoritesView();
  }
});
watch(favorites, () => {
  if (useRemoteFavorites.value && isRemoteFavoritesLoaded() && !isPostLoginSyncing.value) {
    applyRemoteFavoritesView();
  }
}, { deep: true });
watch(isFavoritesSyncing, (syncing, wasSyncing) => {
  if (wasSyncing && !syncing && useRemoteFavorites.value) {
    void syncRemoteFavoritesView();
  }
});
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="favorites-page" :class="{ 'is-syncing': isFavoritesSyncing }">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title-row">
        <h1 class="page-title">收藏项目</h1>
        <ElButton
          class="migration-test-btn"
          size="small"
          text
          :loading="migrationTestLoading"
          @click="handleMigrationTestPrep"
        >
          迁移测试
        </ElButton>
      </div>
      <div class="search-box">
        <ElSelect v-model="sourceFilter" class="source-select" placeholder="来源筛选" clearable :disabled="isPageInteractionDisabled" @change="handleSourceChange">
          <ElOption :label="'全部来源'" :value="ALL_SOURCE_VALUE" />
          <ElOption v-for="source in sourceOptions" :key="source" :label="source" :value="source" />
        </ElSelect>
        <ElInput v-model="searchInput" placeholder="搜索收藏..." prefix-icon="Search" clearable class="search-input"
          :disabled="isPageInteractionDisabled"
          @keyup.enter="executeSearch" @clear="clearSearch" />
        <ElButton type="primary" class="search-btn" :disabled="isPageInteractionDisabled" @click="executeSearch">
          <el-icon>
            <Search />
          </el-icon>
        </ElButton>
      </div>
    </div>

    <!-- 收藏列表网格 -->
    <div class="favorites-grid">
      <div v-for="item in displayedFavorites" :key="item.favoriteId || item.itemKey || item.uniqueKey || item.id" class="favorite-card" @click="openDialog(item)">
        <img :src="getCoverImageUrl(item)" :alt="item.title" class="card-image" loading="lazy" decoding="async"
          fetchpriority="low" />
        <div class="card-content">
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-region">{{ item.region || item.tripData?.route || item.tripData?.desc || item.subNavName || item.town || '' }}</p>
          <div class="card-actions">
            <span class="remove-btn" @click="handleRemoveFavorite(item, $event)">
              ★ 点击取消收藏
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载失败 -->
    <div v-if="remoteLoadError && useRemoteFavorites" class="error-state">
      <p>{{ remoteLoadError }}</p>
      <ElButton type="primary" @click="retryLoadFavorites">重试</ElButton>
    </div>

    <!-- 空状态 -->
    <div v-else-if="favoriteTotalCount === 0 && !remoteFavoritesLoading && !isFavoritesSyncing" class="empty-state">
      <div class="empty-icon">⭐</div>
      <p>暂无收藏内容</p>
    </div>

    <!-- 分页组件 -->
    <div v-if="totalPages > 1" class="pagination-container">
      <ElPagination v-model:current-page="currentPage" :page-size="itemsPerPage" :total="favoriteTotalCount"
        layout="prev, pager, next, jumper" :disabled="favoriteTotalCount === 0 || isPageInteractionDisabled"
        @current-change="handlePageChange" />
    </div>

    <!-- 详情弹窗 -->
    <TripDialog v-if="dialogVisible && isDayTripFavorite(currentItem)" v-model:visible="dialogVisible"
      :title="currentItem?.title || ''" :en-title="currentItem?.enTitle || ''" :banner="currentDialogBanner"
      :trip-data="currentItem?.tripData || {}" :trip-type="currentItem?.itemType || currentItem?.type || '一日游'"
      :item-id="currentItem?.id || null" :item-key="currentItem?.itemKey || ''" :item-type="currentItem?.itemType || currentItem?.type || '一日游'"
      @update:visible="closeDialog"
      @favorite-change="handleFavoriteChange" />
    <FreeInfoDialog v-else-if="dialogVisible" v-model:visible="dialogVisible" :title="currentItem?.title || ''"
      :en-title="currentItem?.enTitle || ''" :banner="currentDialogBanner" :trip-data="currentItem?.tripData || {}"
      :item-id="currentItem?.id || null" :item-key="currentItem?.itemKey || ''" :item-type="currentItem?.itemType || currentItem?.type || 'scenic'"
      @update:visible="closeDialog"
      @favorite-change="handleFavoriteChange" />
  </div>
</template>

<style scoped lang="scss">
.favorites-page {
  width: 90%;
  // padding: 40px 20px;
  margin-bottom: 40px;
}

.favorites-page.is-syncing {
  .page-header,
  .favorites-grid,
  .pagination-container {
    pointer-events: none;
    user-select: none;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.migration-test-btn {
  color: #94a3b8;
  font-size: 12px;
  padding: 0 4px;

  &:hover {
    color: #33b1a3;
  }
}

.page-title {
  font-size: 30px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.search-box {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.source-select {
  width: 160px;
  flex-shrink: 0;
}

.search-input {
  width: 280px;
}

.search-btn {
  flex-shrink: 0;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.favorite-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.card-image {
  width: 100%;
  height: 198px;
  object-fit: cover;
}

.card-content {
  padding: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-region {
  font-size: 12px;
  color: #666;
  margin: 0 0 10px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
}

.remove-btn {
  font-size: 10px;
  color: #f59e0b;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover:not(.disabled) {
    background-color: #fef3c7;
  }

  &.disabled {
    color: #ccc;
    cursor: not-allowed;
  }
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.error-state {
  text-align: center;
  padding: 40px;
  color: #b45309;

  p {
    margin: 0 0 16px;
    line-height: 1.6;
  }
}

.empty-icon {
  font-size: 46px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  color: #999;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

/* 响应式适配 */
@media (max-width: 1024px) {
  .favorites-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .favorites-page {
    padding: 20px 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-title {
    font-size: 24px;
    text-align: center;
  }

  .search-box {
    width: 100%;
  }

  .source-select {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .favorites-grid {
    grid-template-columns: repeat(1, 1fr);
    gap: 16px;
  }

  .card-image {
    height: 180px;
  }
}

@media (max-width: 480px) {
  .card-image {
    height: 160px;
  }

  .card-content {
    padding: 12px;
  }

  .card-title {
    font-size: 15px;
  }
}
</style>
