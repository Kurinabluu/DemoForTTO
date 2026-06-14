import { ElMessage, ElMessageBox } from 'element-plus'
import { MAX_FAVORITES, MAX_LOCAL_FAVORITES } from '@/utils/favoritesStore'
import { requestOpenLoginDialog } from '@/utils/loginDialogBridge'

export async function notifyFavoriteResult(result) {
  if (result === 'success') {
    ElMessage.success('已加入收藏')
    return
  }
  if (result === 'removed') {
    ElMessage.info('已取消收藏')
    return
  }
  if (result === 'local_limit') {
    try {
      await ElMessageBox.confirm(
        `未登录状态下最多收藏 ${MAX_LOCAL_FAVORITES} 个项目。注册或登录账号后，可将收藏同步至云端（上限 ${MAX_FAVORITES} 个），换设备也能继续查看。`,
        '收藏已达上限',
        {
          confirmButtonText: '注册 / 登录',
          cancelButtonText: '稍后再说',
          type: 'warning',
          distinguishCancelAndClose: true,
        },
      )
      requestOpenLoginDialog()
    } catch {
      // 用户取消
    }
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
  if (result === 'busy') {
    ElMessage.info('收藏正在同步或处理中，请稍候')
    return
  }
  if (result === 'error') {
    ElMessage.error('操作失败，请稍后再试')
  }
}
