<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElPagination, ElInput, ElButton } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { getFavorites, removeFavorite, toggleFavorite } from '@/utils/favoritesStore';
import { resolveDataImage } from '@/utils/dataImageResolver';
import FreeInfoDialog from '@/components/FreeInfoDialog.vue';
import TripDialog from '@/components/TripDialog.vue';
import freeInfoData from '@/data/split/freeinfo.json';

const getThumbImageUrl = (imgPath) => {
  return resolveDataImage(imgPath, '', { variant: 'thumb' });
};

const getOriginalImageUrl = (imgPath) => {
  return resolveDataImage(imgPath, '');
};

const findFreeInfoSourceItem = (title) => {
  const normalizedTitle = String(title || '').trim();
  if (!normalizedTitle) return null;
  const subNavList = freeInfoData?.subNav;
  if (!Array.isArray(subNavList)) return null;

  for (const subNav of subNavList) {
    if (!Array.isArray(subNav?.items)) continue;
    const matchedItem = subNav.items.find((entry) => String(entry?.title || '').trim() === normalizedTitle);
    if (matchedItem) {
      return { subNavName: String(subNav?.subNavName || '').trim(), sourceItem: matchedItem };
    }
  }
  return null;
};

// 和 TripsGrid 保持一致：餐厅优先第二张，景点/住宿优先第一张，其它按顺序取图
const getFreeInfoGridImageUrl = (sourceItem, subNavName = '') => {
  if (!sourceItem || typeof sourceItem !== 'object') return '';

  const hasCoverField = Object.prototype.hasOwnProperty.call(sourceItem, 'cover');
  if (hasCoverField) {
    const coverPath = String(sourceItem?.cover || '').trim();
    if (coverPath) {
      const resolvedCover = getThumbImageUrl(coverPath);
      if (resolvedCover) return resolvedCover;
    }
  }

  const rawImg = sourceItem?.img;
  if (!rawImg) return '';

  if (Array.isArray(rawImg)) {
    if (subNavName === '餐厅' && rawImg.length >= 2) {
      const secondImagePath = String(rawImg[1] || '').trim();
      if (secondImagePath) {
        const resolvedSecond = getThumbImageUrl(secondImagePath);
        if (resolvedSecond) return resolvedSecond;
      }
    }
    for (const imagePath of rawImg) {
      const normalizedPath = String(imagePath || '').trim();
      if (!normalizedPath) continue;
      const resolvedImage = getThumbImageUrl(normalizedPath);
      if (resolvedImage) return resolvedImage;
    }
    return '';
  }

  return getThumbImageUrl(rawImg);
};

const getCoverImageUrl = (item) => {
  const matched = findFreeInfoSourceItem(item?.title);
  if (matched?.sourceItem) {
    const resolvedByGridRule = getFreeInfoGridImageUrl(matched.sourceItem, matched.subNavName);
    if (resolvedByGridRule) return resolvedByGridRule;
  }

  // 找不到原始条目时，退回收藏记录中的图字段
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
  // 返回默认图片
  return resolveDataImage('');
};

const extractCandidateImagePaths = (groups = []) => {
  return groups
    .flatMap((group) => {
      if (Array.isArray(group)) return group;
      if (group) return [group];
      return [];
    })
    .map((path) => String(path || '').trim())
    .filter(Boolean);
};

const getOriginalDialogImageUrl = (item) => {
  const matched = findFreeInfoSourceItem(item?.title);
  if (matched?.sourceItem) {
    const sourceImagePaths = extractCandidateImagePaths([
      matched.sourceItem?.cover ? [matched.sourceItem.cover] : [],
      matched.sourceItem?.img,
      matched.sourceItem?.images,
      matched.sourceItem?.banners,
      matched.sourceItem?.bannerList
    ]);
    for (const imagePath of sourceImagePaths) {
      const resolved = getOriginalImageUrl(imagePath);
      if (resolved) return resolved;
    }
  }

  const tripDataImagePaths = extractCandidateImagePaths([
    item?.tripData?.cover ? [item.tripData.cover] : [],
    item?.tripData?.images,
    item?.tripData?.banners,
    item?.tripData?.bannerList,
    item?.tripData?.imgs,
    item?.tripData?.img
  ]);
  for (const imagePath of tripDataImagePaths) {
    const resolved = getOriginalImageUrl(imagePath);
    if (resolved) return resolved;
  }

  const fallbackPaths = extractCandidateImagePaths([
    item?.image,
    item?.banner,
    item?.img
  ]);
  for (const imagePath of fallbackPaths) {
    const resolved = getOriginalImageUrl(imagePath);
    if (resolved) return resolved;
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
// 当前收藏数据
const currentFavorites = computed(() => {
  const userFavorites = getFavorites();
  let data = userFavorites;
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    data = data.filter(item => item.title.toLowerCase().includes(keyword) ||
      item.region.toLowerCase().includes(keyword) ||
      (item.town && item.town.toLowerCase().includes(keyword)));
  }
  return data;
});

const isDayTripFavorite = (item) => {
  const type = String(item?.type || '').trim();
  return type.includes('日游') || type.includes('行程') || type === 'trip';
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
const openDialog = (item) => {
  currentItem.value = item;
  dialogVisible.value = true;
};
// 关闭弹窗
const closeDialog = () => {
  dialogVisible.value = false;
  currentItem.value = null;
};
// 取消收藏
const handleRemoveFavorite = (item, event) => {
  event.stopPropagation();
  removeFavorite(item.id, item.type, item.title);
};
// 监听收藏变化
const handleFavoriteChange = () => {
  // 收藏状态变化后的处理
};
onMounted(() => {
  window.addEventListener('resize', handleResize);
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
      <div v-for="item in paginatedFavorites" :key="item.id" class="favorite-card" @click="openDialog(item)">
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
      :trip-data="currentItem?.tripData || {}" :trip-type="currentItem?.type || '一日游'"
      :item-id="currentItem?.id || null" :item-type="currentItem?.type || '一日游'" @update:visible="closeDialog"
      @favorite-change="handleFavoriteChange" />
    <FreeInfoDialog v-else-if="dialogVisible" v-model:visible="dialogVisible" :title="currentItem?.title || ''"
      :en-title="currentItem?.enTitle || ''" :banner="currentDialogBanner" :trip-data="currentItem?.tripData || {}"
      :item-id="currentItem?.id || null" :item-type="currentItem?.type || 'scenic'" @update:visible="closeDialog"
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
