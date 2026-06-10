import { ElMessage } from 'element-plus'
import { MAX_FAVORITES } from '@/utils/favoritesStore'

export function notifyFavoriteResult(result) {
  if (result === 'success') {
    ElMessage.success('已加入收藏')
    return
  }
  if (result === 'removed') {
    ElMessage.info('已取消收藏')
    return
  }
  if (result === 'limit') {
    ElMessage.warning(`收藏数量已达上限（${MAX_FAVORITES}个），请先取消部分收藏后再添加`)
    return
  }
  if (result === 'exists') {
    ElMessage.info('该项目已在收藏列表中')
    return
  }
  if (result === 'error') {
    ElMessage.error('收藏操作失败，请确认已登录且后端服务可用')
  }
}
