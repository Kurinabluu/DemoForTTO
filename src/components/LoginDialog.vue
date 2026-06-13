<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Star, Monitor } from '@element-plus/icons-vue'
import { login, isLoggedIn, getAuthUsername, logout } from '@/utils/authStore'
import {
  migrateLocalFavoritesToRemote,
  switchToLocalFavorites,
} from '@/utils/favoritesStore'
import { Z_INDEX } from '@/constants/zIndex'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'logged-in'])

const username = ref('')
const password = ref('')
const loading = ref(false)

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

const loggedInLabel = computed(() => {
  if (!isLoggedIn.value) return ''
  return getAuthUsername()
})

const userInitial = computed(() => {
  const name = loggedInLabel.value
  return name ? name.charAt(0).toUpperCase() : 'U'
})

async function handleLogin() {
  const name = username.value.trim()
  const pwd = password.value.trim()
  if (!name || !pwd) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    await login(name, pwd)
    const migrationResult = await migrateLocalFavoritesToRemote()
    ElMessage.success('登录成功')
    if (migrationResult?.remainingCount > 0) {
      const message = migrationResult.limitReached
        ? `已有收藏接近上限，已迁移 ${migrationResult.migratedCount} 条，剩余 ${migrationResult.remainingCount} 条保留在本地。`
        : `已迁移 ${migrationResult.migratedCount} 条本地收藏，仍有 ${migrationResult.remainingCount} 条未完成同步。`
      ElMessage.warning(message)
    }
    emit('logged-in')
    dialogVisible.value = false
    password.value = ''
  } catch (error) {
    ElMessage.error(error?.message || '登录失败')
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  logout()
  switchToLocalFavorites()
  ElMessage.success('已退出登录')
  dialogVisible.value = false
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    width="520px"
    align-center
    append-to-body
    class="login-dialog"
    :show-close="true"
    :close-on-click-modal="true"
    :z-index="Z_INDEX.dialog.high"
  >
    <template #header>
      <div class="login-dialog-header">
        <span class="login-dialog-title">{{ isLoggedIn ? '账号信息' : '用户登录' }}</span>
        <span v-if="!isLoggedIn" class="login-dialog-subtitle">登录后可同步收藏，跨设备查看行程偏好</span>
      </div>
    </template>

    <div v-if="isLoggedIn" class="login-body">
      <div class="user-card">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-meta">
          <div class="user-name">{{ loggedInLabel }}</div>
          <div class="user-status">已登录 · TasTrips 会员</div>
        </div>
      </div>
      <div class="benefit-list">
        <div class="benefit-item">
          <el-icon><Star /></el-icon>
          <span>收藏已同步至云端，换设备登录即可恢复</span>
        </div>
        <div class="benefit-item">
          <el-icon><Monitor /></el-icon>
          <span>可在电脑与手机端继续使用同一账号</span>
        </div>
      </div>
    </div>

    <div v-else class="login-body">
      <el-form label-position="top" class="login-form" @submit.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input
            v-model="username"
            placeholder="请输入用户名"
            autocomplete="username"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            show-password
            autocomplete="current-password"
            size="large"
            :prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
      </el-form>

      <div class="login-tips">
        <span class="tip-dot"></span>
        <span>登录后本地收藏将自动迁移至云端</span>
      </div>
    </div>

    <template #footer>
      <div class="login-dialog-footer">
        <el-button
          v-if="isLoggedIn"
          class="footer-btn danger"
          plain
          @click="handleLogout"
        >
          退出登录
        </el-button>
        <el-button
          v-else
          type="primary"
          class="footer-btn primary"
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.login-dialog-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login-dialog-title {
  font-weight: 700;
  letter-spacing: 2px;
  color: #33b1a3;
  font-size: 18px;
  line-height: 1.3;
}

.login-dialog-subtitle {
  font-size: 13px;
  color: #888;
  letter-spacing: 0;
  font-weight: 400;
  line-height: 1.5;
}

.login-body {
  color: #333;
}

.login-form {
  :deep(.el-form-item__label) {
    color: #555;
    font-weight: 500;
    padding-bottom: 4px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #e5e7eb inset;
    transition: box-shadow 0.2s ease;
  }

  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px rgba(51, 177, 163, 0.45) inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #33b1a3 inset !important;
  }

  :deep(.el-input__prefix .el-icon) {
    color: #33b1a3;
  }
}

.login-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.tip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #33b1a3;
  flex-shrink: 0;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 12px;
  background: #fafafa;
  border-left: 4px solid #33b1a3;
  margin-bottom: 16px;
}

.user-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #33b1a3 0%, #279486 100%);
  box-shadow: 0 6px 16px rgba(51, 177, 163, 0.28);
  flex-shrink: 0;
}

.user-meta {
  min-width: 0;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #222;
  line-height: 1.3;
  word-break: break-all;
}

.user-status {
  margin-top: 4px;
  font-size: 13px;
  color: #888;
}

.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.benefit-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #f0f0f0;
  font-size: 13px;
  color: #666;
  line-height: 1.55;

  .el-icon {
    margin-top: 2px;
    font-size: 16px;
    color: #33b1a3;
    flex-shrink: 0;
  }
}

.login-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.footer-btn {
  min-width: 88px;
  border-radius: 8px;
}

.footer-btn.primary {
  border: none;
  background: linear-gradient(135deg, #33b1a3 0%, #279486 100%);
  box-shadow: 0 4px 12px rgba(51, 177, 163, 0.28);

  &:hover,
  &:focus {
    background: linear-gradient(135deg, #3bc4b3 0%, #2da595 100%);
  }
}

.footer-btn.danger {
  color: #e06c6c;
  border-color: #f0caca;

  &:hover {
    color: #fff;
    background: #e06c6c;
    border-color: #e06c6c;
  }
}

:deep(.login-dialog) {
  border-radius: 12px;
  overflow: hidden;

  .el-dialog__header {
    margin-right: 0;
    padding: 20px 24px 12px;
  }

  .el-dialog__body {
    padding: 8px 24px 4px;
  }

  .el-dialog__footer {
    padding: 12px 24px 20px;
  }

  .el-dialog__headerbtn {
    top: 18px;
    right: 18px;

    .el-dialog__close {
      color: #999;
      font-size: 18px;

      &:hover {
        color: #33b1a3;
      }
    }
  }
}

@media (max-width: 768px) {
  :deep(.login-dialog) {
    width: calc(100vw - 32px) !important;
    max-width: 520px;

    .el-dialog__header,
    .el-dialog__body,
    .el-dialog__footer {
      padding-left: 16px;
      padding-right: 16px;
    }
  }

  .login-dialog-title {
    font-size: 16px;
  }

  .user-card {
    padding: 14px;
  }
}
</style>
