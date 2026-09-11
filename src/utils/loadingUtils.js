import { useLoadingStore } from '@/stores/loadingStore'
import { isCompanyPagePath } from '@/utils/appPath'

const COMPANY_PAGE_LOADING_TEXT = {
  '/about': '关于我们加载中...',
  '/contact': '联系我们加载中...',
  '/privacy': '隐私政策加载中...',
  '/terms': '服务条款加载中...',
  '/refund': '退款政策加载中...',
}

/**
 * 公司页是懒加载路由，导航期间走同一个 loadingStore（App.vue 全屏 v-loading）。
 * 不额外加定时器：开始于 beforeEach，结束于 afterEach / onError（实际 chunk 加载时长）。
 */
const bindCompanyPageRouteLoading = (router) => {
  let companyPageLoadingActive = false

  const startCompanyPageLoading = (path) => {
    if (companyPageLoadingActive) return
    companyPageLoadingActive = true
    useLoadingStore().startLoading(COMPANY_PAGE_LOADING_TEXT[path] || '加载中...')
  }

  const stopCompanyPageLoading = () => {
    if (!companyPageLoadingActive) return
    companyPageLoadingActive = false
    useLoadingStore().stopLoading()
  }

  router.beforeEach((to, from) => {
    if (!isCompanyPagePath(to.path) || (from.path === to.path && from.matched.length)) return
    startCompanyPageLoading(to.path)
  })

  router.afterEach(() => {
    stopCompanyPageLoading()
  })

  router.onError(() => {
    stopCompanyPageLoading()
  })
}

const withLoading = async (task, options = {}) => {
  const { text = '加载中...' } = options
  const loadingStore = useLoadingStore()
  loadingStore.startLoading(text)
  try {
    const result = await Promise.resolve(typeof task === 'function' ? task() : undefined)
    return result
  } finally {
    loadingStore.stopLoading()
  }
}

export { withLoading, bindCompanyPageRouteLoading }
