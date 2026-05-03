// 收藏状态管理
import { ref, watch } from 'vue';
const STORAGE_KEY = 'tto_favorites';
const MAX_FAVORITES = 500; // TODO: 测试用，修改此值可调整收藏上限
// 从localStorage加载收藏数据
const loadFavorites = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    }
    catch (e) {
        console.error('加载收藏数据失败:', e);
    }
    return [];
};
// 保存收藏数据到localStorage
const saveFavorites = (favorites) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
    catch (e) {
        console.error('保存收藏数据失败:', e);
    }
};
// 收藏列表
const favorites = ref(loadFavorites());
// 监听变化并保存
watch(favorites, (newVal) => {
    saveFavorites(newVal);
}, { deep: true });
// 获取唯一标识符（如果没有id，使用type+title组合）
const getUniqueKey = (item) => {
    return item.id || `${item.type}_${item.title}`;
};
// 添加收藏
const addFavorite = (item) => {
    const uniqueKey = getUniqueKey(item);
    const exists = favorites.value.some(fav => getUniqueKey(fav) === uniqueKey);
    if (exists) {
        return 'exists';
    }
    if (favorites.value.length >= MAX_FAVORITES) {
        return 'limit';
    }
    favorites.value.push({ ...item, uniqueKey });
    return 'success';
};
// 移除收藏
const removeFavorite = (id, type, title) => {
    const uniqueKey = id || `${type}_${title}`;
    const index = favorites.value.findIndex(fav => getUniqueKey(fav) === uniqueKey);
    if (index > -1) {
        favorites.value.splice(index, 1);
    }
};
// 检查是否已收藏
const isFavorite = (id, type, title) => {
    const uniqueKey = id || `${type}_${title}`;
    return favorites.value.some(fav => getUniqueKey(fav) === uniqueKey);
};
// 切换收藏状态
const toggleFavorite = (item) => {
    const uniqueKey = getUniqueKey(item);
    if (isFavorite(item.id, item.type, item.title)) {
        removeFavorite(item.id, item.type, item.title);
        return 'removed';
    }
    else {
        return addFavorite(item);
    }
};
// 获取所有收藏
const getFavorites = () => favorites.value;
// 获取收藏数量
const getFavoritesCount = () => favorites.value.length;
// 清空所有收藏
const clearFavorites = () => {
    favorites.value = [];
};
export { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite, getFavorites, getFavoritesCount, clearFavorites, MAX_FAVORITES };
