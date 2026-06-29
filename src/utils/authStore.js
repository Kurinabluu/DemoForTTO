import { ref, computed } from 'vue'
import { isApiEnabled, login as apiLogin, registerAccount as apiRegister, registerTokenRefreshHandler } from '@/utils/ttoApi'

const STORAGE_KEY = 'tto_auth_token'
const USERNAME_KEY = 'tto_auth_username'
const USER_ID_KEY = 'tto_auth_user_id'

function readStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  try {
    if (value == null || value === '') {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  } catch {
    // ignore
  }
}

function updateTokenOnly(nextToken) {
  token.value = nextToken || ''
  writeStorage(STORAGE_KEY, token.value)
}

const token = ref(readStorage(STORAGE_KEY))
const username = ref(readStorage(USERNAME_KEY))
const userId = ref(readStorage(USER_ID_KEY))

export const isLoggedIn = computed(() => Boolean(token.value))

export function getAuthToken() {
  return token.value || ''
}

export function getAuthUsername() {
  return username.value || ''
}

export function getAuthUserId() {
  const raw = userId.value
  if (raw == null || raw === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export function shouldUseRemoteFavorites() {
  return isApiEnabled() && isLoggedIn.value
}

export function setAuthSession(session) {
  token.value = session?.token || ''
  username.value = session?.username || ''
  userId.value = session?.userId != null ? String(session.userId) : ''

  writeStorage(STORAGE_KEY, token.value)
  writeStorage(USERNAME_KEY, username.value)
  writeStorage(USER_ID_KEY, userId.value)
}

registerTokenRefreshHandler((nextToken) => {
  if (!nextToken) return
  updateTokenOnly(nextToken)
})

export function clearAuthSession() {
  setAuthSession(null)
}

export async function authenticateLogin(usernameInput, passwordInput) {
  return apiLogin(usernameInput, passwordInput)
}

export async function authenticateRegister(usernameInput, passwordInput, { displayName, email } = {}) {
  const body = {
    username: usernameInput,
    password: passwordInput,
  }
  const nickname = (displayName || '').trim()
  const mail = (email || '').trim()
  if (nickname) body.displayName = nickname
  if (mail) body.email = mail
  return apiRegister(body)
}

export async function login(usernameInput, passwordInput) {
  const data = await authenticateLogin(usernameInput, passwordInput)
  setAuthSession({
    token: data?.token,
    username: data?.username,
    userId: data?.userId,
  })
  return data
}

export async function register(usernameInput, passwordInput, { displayName, email } = {}) {
  const data = await authenticateRegister(usernameInput, passwordInput, { displayName, email })
  setAuthSession({
    token: data?.token,
    username: data?.username,
    userId: data?.userId,
  })
  return data
}

export function logout() {
  clearAuthSession()
}

// 监听其他标签页的 localStorage 变更，同步登录状态
// 修复：A 标签页退出登录后，B 标签页不刷新仍保持登录态的问题
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    if (!event.newValue) {
      // 其他标签页清除了 token（退出登录）
      token.value = ''
      username.value = ''
      userId.value = ''
    } else if (event.newValue !== token.value) {
      // 其他标签页更新了 token（登录/刷新）
      token.value = event.newValue
    }
  }
  if (event.key === USERNAME_KEY) {
    username.value = event.newValue || ''
  }
  if (event.key === USER_ID_KEY) {
    userId.value = event.newValue || ''
  }
})
