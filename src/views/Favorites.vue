<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated } from 'vue';
import { ElPagination, ElInput, ElButton } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { favorites, removeFavoriteAsync, refreshRemoteFavorites } from '@/utils/favoritesStore';
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

const getThumbImageUrl = (imgPath) => {
  return resolveDataImage(imgPath, '', { variant: 'thumb' });
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
  return resolveDataImage('');
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
    item?.image,
    item?.banner,
    item?.img,
  ].flatMap((group) => (Array.isArray(group) ? group : group ? [group] : []));

  for (const imagePath of fallbackPaths) {
    const resolvedImage = resolveDataImage(imagePath, '');
    if (resolvedImage) return resolvedImage;
  }

  return resolveDataImage('');
};

// 搜索相关
const searchInput = ref('');
const searchKeyword = ref('');
const currentPage = ref(1);
const windowWidth = ref(window.innerWidth);
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
// 当前收藏数据（响应式，登录后远程同步会更新）
const currentFavorites = computed(() => {
  let data = favorites.value;
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    data = data.filter(item => item.title.toLowerCase().includes(keyword) ||
      (item.region || '').toLowerCase().includes(keyword) ||
      (item.town && item.town.toLowerCase().includes(keyword)));
  }
  return data;
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
  return Math.ceil(currentFavorites.value.length / itemsPerPage.value);
});
// 分页数据
const paginatedFavorites = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return currentFavorites.value.slice(start, end);
});
// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};
// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
// 执行搜索（点击搜索按钮或按回车键后执行）
const executeSearch = () => {
  searchKeyword.value = searchInput.value;
  currentPage.value = 1;
};
// 清除搜索（点击清除按钮后执行）
const clearSearch = () => {
  searchKeyword.value = '';
  currentPage.value = 1;
};
// 打开弹窗
const openDialog = async (item) => {
  let enriched = item
  if (isApiEnabled() && item?.id != null) {
    const detail = await loadCatalogItemDetail(item.id)
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
  event.stopPropagation();
  await removeFavoriteAsync(item.id, item.itemType || item.type, item.title, item.favoriteId);
  notifyFavoriteResult('removed');
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value);
  }
};
// 监听收藏变化（弹窗内取消收藏时关闭弹窗）
const handleFavoriteChange = (result) => {
  if (result === 'removed') {
    closeDialog();
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value);
    }
  }
};

async function syncFavorites() {
  await refreshRemoteFavorites(true);
}

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  await syncFavorites();
});

onActivated(async () => {
  await syncFavorites();
});
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="favorites-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">收藏项目</h1>
      <div class="search-box">
        <ElInput v-model="searchInput" placeholder="搜索收藏..." prefix-icon="Search" clearable class="search-input"
          @keyup.enter="executeSearch" @clear="clearSearch" />
        <ElButton type="primary" class="search-btn" @click="executeSearch">
          <el-icon>
            <Search />
          </el-icon>
        </ElButton>
      </div>
    </div>

    <!-- 收藏列表网格 -->
    <div class="favorites-grid">
      <div v-for="item in paginatedFavorites" :key="item.favoriteId || item.uniqueKey || item.id" class="favorite-card" @click="openDialog(item)">
        <img :src="getCoverImageUrl(item)" :alt="item.title" class="card-image" loading="lazy" decoding="async"
          fetchpriority="low" />
        <div class="card-content">
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-region">{{ item.region }}</p>
          <div class="card-actions">
            <span class="remove-btn" @click="handleRemoveFavorite(item, $event)">
              ★ 点击取消收藏
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="currentFavorites.length === 0" class="empty-state">
      <div class="empty-icon">⭐</div>
      <p>暂无收藏内容</p>
    </div>

    <!-- 分页组件 -->
    <div v-if="totalPages > 1" class="pagination-container">
      <ElPagination v-model:current-page="currentPage" :page-size="itemsPerPage" :total="currentFavorites.length"
        layout="prev, pager, next, jumper" :disabled="currentFavorites.length === 0"
        @current-change="handlePageChange" />
    </div>

    <!-- 详情弹窗 -->
    <TripDialog v-if="dialogVisible && isDayTripFavorite(currentItem)" v-model:visible="dialogVisible"
      :title="currentItem?.title || ''" :en-title="currentItem?.enTitle || ''" :banner="currentDialogBanner"
      :trip-data="currentItem?.tripData || {}" :trip-type="currentItem?.itemType || currentItem?.type || '一日游'"
      :item-id="currentItem?.id || null" :item-type="currentItem?.itemType || currentItem?.type || '一日游'"
      @update:visible="closeDialog"
      @favorite-change="handleFavoriteChange" />
    <FreeInfoDialog v-else-if="dialogVisible" v-model:visible="dialogVisible" :title="currentItem?.title || ''"
      :en-title="currentItem?.enTitle || ''" :banner="currentDialogBanner" :trip-data="currentItem?.tripData || {}"
      :item-id="currentItem?.id || null" :item-type="currentItem?.itemType || currentItem?.type || 'scenic'"
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
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
