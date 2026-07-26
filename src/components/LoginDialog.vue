<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getApiErrorMessage } from '@/utils/apiFeedback'
import {
  buildRegisterPayload,
  createLoginRules,
  createRegisterRules,
} from '@/utils/authFormValidation'
import { User, Lock, Star, Monitor, Message, Loading } from '@element-plus/icons-vue'
import { authenticateLogin, authenticateRegister, setAuthSession, isLoggedIn, getAuthUsername, logout } from '@/utils/authStore'
import {
  switchToLocalFavorites,
  reservePostLoginSync,
  releasePostLoginSync,
  previewMigrationOverflow,
  MAX_FAVORITES,
} from '@/utils/favoritesStore'
import { Z_INDEX } from '@/constants/zIndex'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'logged-in'])

const authMode = ref('login')
const loading = ref(false)
const submitError = ref('')
const authFormRef = ref(null)
const migrationWarningVisible = ref(false)
const migrationOverflowInfo = ref(null)
const pendingSuccessMessage = ref('')
const pendingAuthSession = ref(null)

const formState = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  displayName: '',
  email: '',
})

const loginRules = createLoginRules()
const registerRules = createRegisterRules(() => formState.password)
const formRules = computed(() => (authMode.value === 'register' ? registerRules : loginRules))

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

const dialogTitle = computed(() => {
  if (migrationWarningVisible.value) return '收藏同步确认'
  if (isLoggedIn.value) return '账号信息'
  return authMode.value === 'register' ? '注册新账号' : '用户登录'
})

const dialogSubtitle = computed(() => {
  if (migrationWarningVisible.value) {
    return '本地收藏与账号收藏合计将超过上限，请确认后再登录'
  }
  if (isLoggedIn.value) return ''
  return authMode.value === 'register'
    ? '创建账号后即可同步收藏与行程偏好'
    : '登录后可同步收藏，跨设备查看行程偏好'
})

function clearFormValidation() {
  nextTick(() => {
    authFormRef.value?.clearValidate()
  })
}

function resetGuestForm() {
  formState.password = ''
  formState.confirmPassword = ''
  submitError.value = ''
  clearFormValidation()
}

function resetMigrationWarning() {
  migrationWarningVisible.value = false
  migrationOverflowInfo.value = null
  pendingSuccessMessage.value = ''
  pendingAuthSession.value = null
}

function resetAllGuestFields() {
  formState.username = ''
  formState.password = ''
  formState.confirmPassword = ''
  formState.displayName = ''
  formState.email = ''
  submitError.value = ''
  resetMigrationWarning()
  clearFormValidation()
}

function switchAuthMode(mode) {
  if (authMode.value === mode) return
  authMode.value = mode
  resetGuestForm()
}

watch(dialogVisible, (visible) => {
  if (!visible) {
    authMode.value = 'login'
    resetAllGuestFields()
  }
})

async function finishAuthSuccess(message, migrationResult) {
  ElMessage.success(message)
  if (migrationResult?.localDiscarded) {
    ElMessage.warning('本地收藏未同步到云端，已保留账号中的云端收藏。')
  } else if (migrationResult?.skipped && migrationResult?.remainingCount > 0) {
    ElMessage.info(`已登录。本地仍有 ${migrationResult.remainingCount} 条收藏暂未同步，可稍后在收藏页处理。`)
  } else if (migrationResult?.remainingCount > 0) {
    const tip = migrationResult.limitReached
      ? `已有收藏接近上限，已迁移 ${migrationResult.migratedCount} 条，剩余 ${migrationResult.remainingCount} 条保留在本地。`
      : `已迁移 ${migrationResult.migratedCount} 条本地收藏，仍有 ${migrationResult.remainingCount} 条未完成同步。`
    ElMessage.warning(tip)
  }
  emit('logged-in')
  resetAllGuestFields()
}

async function commitAuthSessionAndSync(session, syncMode, successMessage) {
  dialogVisible.value = false
  setAuthSession(session)
  reservePostLoginSync()
  const migrationResult = await releasePostLoginSync(syncMode)
  await finishAuthSuccess(successMessage, migrationResult)
}

async function handleMigrationLater() {
  resetMigrationWarning()
  dialogVisible.value = false
  resetGuestForm()
  ElMessage.info('已取消登录，本地收藏已保留，可稍后再试')
}

async function handleMigrationForce() {
  if (!pendingAuthSession.value) return

  const session = pendingAuthSession.value
  const successMessage = pendingSuccessMessage.value || '登录成功'
  resetMigrationWarning()
  dialogVisible.value = false

  loading.value = true
  try {
    await commitAuthSessionAndSync(session, 'discard_local', successMessage)
  } catch (error) {
    submitError.value = getApiErrorMessage(error)
    migrationWarningVisible.value = true
    pendingAuthSession.value = session
    pendingSuccessMessage.value = successMessage
    dialogVisible.value = true
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  submitError.value = ''
  const valid = await authFormRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const authData = await authenticateLogin(formState.username.trim(), formState.password)
    const session = {
      token: authData?.token,
      username: authData?.username,
      userId: authData?.userId,
    }
    const overflow = await previewMigrationOverflow(session.token)
    if (overflow.wouldOverflow) {
      pendingAuthSession.value = session
      pendingSuccessMessage.value = '登录成功'
      migrationOverflowInfo.value = overflow
      migrationWarningVisible.value = true
      return
    }
    await commitAuthSessionAndSync(session, 'migrate', '登录成功')
  } catch (error) {
    submitError.value = getApiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  submitError.value = ''
  const valid = await authFormRef.value?.validate().catch(() => false)
  if (!valid) return

  const payload = buildRegisterPayload(formState)
  loading.value = true
  try {
    const authData = await authenticateRegister(payload.username, payload.password, {
      displayName: payload.displayName,
      email: payload.email,
    })
    const session = {
      token: authData?.token,
      username: authData?.username,
      userId: authData?.userId,
    }
    const overflow = await previewMigrationOverflow(session.token)
    if (overflow.wouldOverflow) {
      pendingAuthSession.value = session
      pendingSuccessMessage.value = '注册成功，已自动登录'
      migrationOverflowInfo.value = overflow
      migrationWarningVisible.value = true
      return
    }
    await commitAuthSessionAndSync(session, 'migrate', '注册成功，已自动登录')
  } catch (error) {
    submitError.value = getApiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function handleSubmit() {
  if (authMode.value === 'register') {
    void handleRegister()
    return
  }
  void handleLogin()
}

function handleLogout() {
  logout()
  switchToLocalFavorites()
  ElMessage.success('已退出登录')
  dialogVisible.value = false
}
</script>

<template>
  <el-dialog v-model="dialogVisible" width="520px" align-center append-to-body class="login-dialog" :show-close="true"
    :close-on-click-modal="true" :z-index="Z_INDEX.dialog.high">
    <template #header>
      <div class="login-dialog-header">
        <span class="login-dialog-title">{{ dialogTitle }}</span>
        <span v-if="dialogSubtitle" class="login-dialog-subtitle">{{ dialogSubtitle }}</span>
      </div>
    </template>

    <div v-if="migrationWarningVisible && migrationOverflowInfo" class="login-body migration-warning-panel">
        <el-alert type="warning" :closable="false" show-icon title="收藏数量将超过上限">
          <p>
            您的账号已有 {{ migrationOverflowInfo.remoteCount }} 个收藏，本地还有
            {{ migrationOverflowInfo.localCount }} 个，合计将超过 {{ MAX_FAVORITES }} 个上限。
          </p>
          <p class="migration-warning-tip">选择「稍后操作」将取消本次登录并保留本地收藏；选择「继续登录」后将登录账号并仅保留云端收藏。</p>
        </el-alert>
    </div>

    <div v-else-if="isLoggedIn" class="login-body">
      <div class="user-card">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-meta">
          <div class="user-name">{{ loggedInLabel }}</div>
          <div class="user-status">已登录 · TasTrips 会员</div>
        </div>
      </div>
      <div class="benefit-list">
        <div class="benefit-item">
          <el-icon>
            <Star />
          </el-icon>
          <span>收藏已同步至云端，换设备登录即可恢复</span>
        </div>
        <div class="benefit-item">
          <el-icon>
            <Monitor />
          </el-icon>
          <span>可在电脑与手机端继续使用同一账号</span>
        </div>
      </div>
    </div>

    <div v-else class="login-body">
      <div class="auth-mode-switch">
        <button type="button" class="auth-mode-btn" :class="{ active: authMode === 'login' }"
          @click="switchAuthMode('login')">
          登录
        </button>
        <button type="button" class="auth-mode-btn" :class="{ active: authMode === 'register' }"
          @click="switchAuthMode('register')">
          注册
        </button>
      </div>

      <el-form
        ref="authFormRef"
        :model="formState"
        :rules="formRules"
        :validate-on-rule-change="false"
        label-position="top"
        class="login-form"
        @submit.prevent="handleSubmit"
      >
        <el-alert
          v-if="submitError"
          class="submit-error-alert"
          :title="submitError"
          type="error"
          :closable="false"
          show-icon
        />

        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formState.username"
            placeholder="3-32 位，支持中文、字母、数字、下划线"
            autocomplete="username"
            size="large"
            :prefix-icon="User"
            @input="submitError = ''"
          />
        </el-form-item>

        <el-form-item v-if="authMode === 'register'" label="昵称（选填）" prop="displayName">
          <el-input
            v-model="formState.displayName"
            placeholder="用于展示的称呼"
            size="large"
            :prefix-icon="User"
            @input="submitError = ''"
          />
        </el-form-item>

        <el-form-item v-if="authMode === 'register'" label="邮箱（选填）" prop="email">
          <el-input
            v-model="formState.email"
            placeholder="用于接收通知"
            autocomplete="email"
            size="large"
            :prefix-icon="Message"
            @input="submitError = ''"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="formState.password"
            type="password"
            :placeholder="authMode === 'register' ? '至少 6 位' : '请输入密码'"
            show-password
            :autocomplete="authMode === 'register' ? 'new-password' : 'current-password'"
            size="large"
            :prefix-icon="Lock"
            @input="submitError = ''"
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-form-item v-if="authMode === 'register'" label="确认密码" prop="confirmPassword">
          <el-input
            v-model="formState.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            show-password
            autocomplete="new-password"
            size="large"
            :prefix-icon="Lock"
            @input="submitError = ''"
            @keyup.enter="handleSubmit"
          />
        </el-form-item>
      </el-form>

      <div class="login-tips">
        <span class="tip-dot"></span>
        <span v-if="authMode === 'register'">注册成功后将自动登录，并尝试迁移本地收藏</span>
        <span v-else>还没有账号？点击上方「注册」创建新账号</span>
      </div>
    </div>

    <template #footer>
      <div class="login-dialog-footer" :class="{ 'migration-footer': migrationWarningVisible }">
        <el-button v-if="isLoggedIn && !migrationWarningVisible" class="footer-btn danger" plain @click="handleLogout">
          退出登录
        </el-button>
        <template v-else-if="migrationWarningVisible">
          <el-button class="footer-btn migration-action-btn" :disabled="loading" @click="handleMigrationLater">稍后操作</el-button>
          <el-button type="danger" class="footer-btn migration-action-btn force-login-btn" :disabled="loading" @click="handleMigrationForce">
            <span class="auth-button-content">
              <span>继续登录</span>
              <el-icon v-if="loading" class="auth-button-loading-icon"><Loading /></el-icon>
            </span>
          </el-button>
        </template>
        <template v-else>
          <el-button class="footer-btn" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="footer-btn primary" :disabled="loading" @click="handleSubmit">
            <span class="auth-button-content">
              <span>{{ authMode === 'register' ? '注册并登录' : '登录' }}</span>
              <el-icon v-if="loading" class="auth-button-loading-icon"><Loading /></el-icon>
            </span>
          </el-button>
        </template>
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

.auth-mode-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  padding: 4px;
  border-radius: 8px;
  background: #f3f4f6;
}

.migration-warning-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;

  p {
    margin: 0 0 8px;
    line-height: 1.6;
    color: #666;
    font-size: 14px;
  }

  .migration-warning-tip {
    margin-bottom: 0;
    color: #c45656;
    font-weight: 500;
  }
}

.login-dialog-footer.migration-footer {
  gap: 8px;

  :deep(.migration-action-btn) {
    min-width: 88px;
    border-radius: 8px;
  }

  :deep(.force-login-btn) {
    min-width: 108px;
  }
}

.force-login-btn {
  min-width: 108px;
}

.auth-mode-btn {
  flex: 1;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    color: #fff;
    background: linear-gradient(135deg, #33b1a3 0%, #279486 100%);
    box-shadow: 0 4px 12px rgba(51, 177, 163, 0.24);
  }
}

.login-form {
  .submit-error-alert {
    margin-bottom: 16px;
  }

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

.auth-button-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.auth-button-loading-icon {
  font-size: 14px;
  animation: auth-button-spin 1s linear infinite;
}

@keyframes auth-button-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
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
