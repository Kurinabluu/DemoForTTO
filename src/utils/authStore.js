import { computed, ref } from 'vue'
import {
  fetchAuthSession,
  isApiEnabled,
  login as apiLogin,
  logoutAccount as apiLogout,
  registerTokenRefreshHandler,
  registerAccount as apiRegister,
} from '@/utils/ttoApi'

const AUTH_SYNC_CHANNEL = 'tto-auth-sync'
const AUTH_TOKEN_STORAGE_KEY = 'tto_auth_token'
const authSyncChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(AUTH_SYNC_CHANNEL) : null

export const isLoggedIn = ref(false)
const username = ref('')
const userId = ref(null)
const authToken = ref(loadStoredToken())
let bootstrapPromise = null

function loadStoredToken() {
  if (typeof localStorage === 'undefined') return ''
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function persistToken(token) {
  authToken.value = token || ''
  if (typeof localStorage === 'undefined') return
  try {
    if (authToken.value) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authToken.value)
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    }
  } catch {
    // ignore storage errors
  }
}

function getCurrentSession() {
  return {
    username: username.value || '',
    userId: userId.value,
    token: authToken.value,
  }
}

function broadcastAuthSession(type, session = null) {
  if (!authSyncChannel) return
  authSyncChannel.postMessage({ type, session })
}

function applyAuthSession(session, { broadcast = false } = {}) {
  const nextUsername = session?.username ? String(session.username).trim() : ''
  const nextUserId = session?.userId != null && session.userId !== ''
    ? Number(session.userId)
    : null
  const nextToken = session?.token ? String(session.token).trim() : authToken.value

  isLoggedIn.value = Boolean(nextUsername || Number.isFinite(nextUserId))
  username.value = nextUsername
  userId.value = Number.isFinite(nextUserId) ? nextUserId : null
  persistToken(isLoggedIn.value ? nextToken : '')

  if (broadcast) {
    broadcastAuthSession(isLoggedIn.value ? 'auth-session' : 'auth-clear', isLoggedIn.value ? getCurrentSession() : null)
  }
}

export async function bootstrapAuthSession() {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    try {
      if (!isApiEnabled()) {
        return null
      }
      const session = await fetchAuthSession(getAuthToken())
      applyAuthSession(session, { broadcast: Boolean(session) })
      return session
    } catch {
      applyAuthSession(null, { broadcast: false })
      return null
    } finally {
      bootstrapPromise = null
    }
  })()

  return bootstrapPromise
}

export function getAuthToken() {
  return authToken.value || ''
}

export function getAuthUsername() {
  return username.value || ''
}

export function getAuthUserId() {
  return userId.value
}

export function shouldUseRemoteFavorites() {
  return isApiEnabled() && isLoggedIn.value
}

export function setAuthSession(session) {
  applyAuthSession(session, { broadcast: true })
}

export function clearAuthSession() {
  applyAuthSession(null, { broadcast: true })
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

export async function logout() {
  clearAuthSession()
  if (!isApiEnabled()) return
  try {
    await apiLogout()
  } catch {
    // ignore logout network errors; local state already cleared
  }
}

if (authSyncChannel) {
  authSyncChannel.addEventListener('message', (event) => {
    const message = event.data || {}
    if (message.type === 'auth-request') {
      if (isLoggedIn.value) {
        broadcastAuthSession('auth-session', getCurrentSession())
      }
      return
    }
    if (message.type === 'auth-session') {
      applyAuthSession(message.session, { broadcast: false })
      return
    }
    if (message.type === 'auth-clear') {
      applyAuthSession(null, { broadcast: false })
    }
  })

  Promise.resolve().then(() => {
    broadcastAuthSession('auth-request')
  })
}

registerTokenRefreshHandler((token) => {
  if (token) {
    persistToken(String(token).trim())
  }
})

void bootstrapAuthSession()
