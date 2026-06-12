import { useLoadingStore } from '@/stores/loadingStore'

const clampNumber = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const getRandomDelay = (min = 80, max = 300) => {
  const safeMin = Math.max(0, clampNumber(min, 80))
  const safeMax = Math.max(safeMin, clampNumber(max, 300))
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)))

// 保留一个可选的随机等待，主要用于减少极短请求导致的 loading 闪烁。
const waitRandomDelay = async (min = 80, max = 300) => {
  const delayMs = getRandomDelay(min, max)
  await sleep(delayMs)
}

const withLoading = async (task, options = {}) => {
  const { text = '加载中...' } = options
  const loadingStore = useLoadingStore()
  loadingStore.startLoading(text)
  try {
    await Promise.resolve(typeof task === 'function' ? task() : undefined)
  } finally {
    loadingStore.stopLoading()
  }
}

const withLoadingWithDelay = async (task, options = {}) => {
  const { min = 80, max = 300, text = '加载中...' } = options
  const loadingStore = useLoadingStore()
  loadingStore.startLoading(text)
  try {
    const taskPromise = typeof task === 'function' ? Promise.resolve(task()) : Promise.resolve()
    const [result] = await Promise.all([taskPromise, waitRandomDelay(min, max)])
    return result
  } finally {
    loadingStore.stopLoading()
  }
}

export { withLoading, withLoadingWithDelay, waitRandomDelay, getRandomDelay }
