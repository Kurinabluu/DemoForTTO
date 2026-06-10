import { ref, computed } from 'vue'
import { isApiEnabled, login as apiLogin } from '@/utils/ttoApi'

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

export function clearAuthSession() {
  setAuthSession(null)
}

export async function login(usernameInput, passwordInput) {
  const data = await apiLogin(usernameInput, passwordInput)
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
