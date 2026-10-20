import { createRouter, createWebHistory } from 'vue-router'
import { useNavStore } from '@/stores/nav'
import { isSearchEngineReferrer, isSiteRootPath, isRestorableAppPath, normalizeAppPath } from '@/utils/appPath'

const DEFAULT_FREEINFO_LOCATION = {
  path: '/trips/freeinfo',
  query: { subNavName: '景点' },
}

function processHashRedirect() {
  try {
    // 检查现在地址栏里的hash是否存在，且是否以#/开头。
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      //  砍掉#
      const hashContent = window.location.hash.substring(1)
      // 清掉哈希，URL会变干净
      window.location.hash = ''
      return normalizeAppPath(hashContent)
    }
  } catch {
    // ignore
  }
  return null
}
// 模块加载时处理哈希重定向
let pendingHashRedirect = typeof window !== 'undefined' ? processHashRedirect() : null

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/Layout.vue'),
    children: [
      {
        path: '',
        component: () => import('@/views/HomeView.vue'),
        children: [
          {
            path: 'trips/freeinfo',
            name: 'FreeInfo',
            component: () => import('@/views/TripsGrid.vue'),
            props: (route) => ({
              activeTag: '自助游/自驾游免费参考信息',
              subTab: route.query.subNavName || '景点',
            }),
          },
          {
            path: 'trips/routes',
            name: 'Routes',
            component: () => import('@/views/TripsGrid.vue'),
            props: (route) => ({
              activeTag: '一日游/多日游',
              dayTripTab: route.query.dayTripTab || '1',
            }),
          },
          {
            path: 'favorites',
            name: 'Favorites',
            component: () => import('@/views/Favorites.vue'),
          },
          {
            path: 'service/ticket',
            name: 'TicketBooking',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '热门项目' },
          },
          {
            path: 'service/car',
            name: 'CarService',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '包车服务' },
          },
          {
            path: 'service/steward',
            name: 'StewardService',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '行程管家' },
          },
          {
            path: 'service/guide',
            name: 'GuideService',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '地接地陪' },
          },
          {
            path: 'service/custom',
            name: 'CustomService',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '专属定制' },
          },
          {
            path: 'service/pickup',
            name: 'PickUp',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '商务接送' },
          },
          {
            path: 'search',
            name: 'GlobalSearch',
            component: () => import('@/views/SearchResults.vue'),
          },
          {
            path: 'info/:itemKey(.*)',
            name: 'ContentDetail',
            component: () => import('@/views/ContentDetailView.vue'),
          },
        ],
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/company/AboutView.vue'),
      },
      {
        path: 'contact',
        name: 'Contact',
        component: () => import('@/views/company/ContactView.vue'),
      },
      {
        path: 'privacy',
        name: 'Privacy',
        component: () => import('@/views/company/LegalPageView.vue'),
        props: { doc: 'privacy' },
      },
      {
        path: 'terms',
        name: 'Terms',
        component: () => import('@/views/company/LegalPageView.vue'),
        props: { doc: 'terms' },
      },
      {
        path: 'refund',
        name: 'Refund',
        component: () => import('@/views/company/LegalPageView.vue'),
        props: { doc: 'refund' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 发版后旧 hash 的 chunk 文件会被删除，仍停留在旧页面上的用户点击导航时，
// 动态 import 会 404（Failed to fetch dynamically imported module）。
// 整页跳到目标地址一次即可拿到新的 index.html 与新 chunk。
// 用 sessionStorage 时间戳做一次性保护，避免刷新后仍失败时陷入无限刷新。
const CHUNK_RELOAD_KEY = 'tto_chunk_reload_at'
const CHUNK_RELOAD_GUARD_MS = 10000

function isChunkLoadError(error) {
  const message = String(error?.message || error || '')
  return /dynamically imported module|importing a module script|loading (css )?chunk/i.test(message)
}

function readChunkReloadStamp() {
  try {
    return Number(sessionStorage.getItem(CHUNK_RELOAD_KEY)) || 0
  } catch {
    return 0
  }
}

router.onError((error, to) => {
  if (!isChunkLoadError(error)) return

  // 刚刷新过仍失败（断网、部署本身损坏等），放弃自动刷新，避免无限循环
  if (Date.now() - readChunkReloadStamp() < CHUNK_RELOAD_GUARD_MS) return

  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  } catch {
    // 隐私模式等场景下 sessionStorage 不可用，仍尝试跳转刷新
  }

  // 动态 import 失败时浏览器地址栏尚未切换，直接 reload 会停在旧页面，
  // 因此显式跳到目标路由的完整地址（含 BASE_URL 前缀）
  if (to?.fullPath) {
    window.location.assign(router.resolve(to.fullPath).href)
  } else {
    window.location.reload()
  }
})

// 新页面正常启动后清除标记，之后再遇到 chunk 失效仍可自动恢复一次
router.isReady().then(() => {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  } catch {
    // ignore
  }
}).catch(() => {
  // 首次导航本身失败时保留标记，由上面的时间戳保护拦截循环
})

function readLastPath() {
  try {
    return normalizeAppPath(localStorage.getItem('tto_last_path') || '')
  } catch {
    return ''
  }
}

router.beforeEach((to, from, next) => {
  try {
    if (pendingHashRedirect) {
      const target = pendingHashRedirect  //目标路径存进局部变量
      pendingHashRedirect = null  //清空，保证转换只发生一次，因为下面的next()会触发新的导航，新导航还会进这个守卫，导致无限重定向
      if (target && target !== to.fullPath) { //后者是保证目标和当前要去的地址不一样，才跳，否则没必要
        return next(target) //放行到新目标路由，导航中止，后面的首次访问分流和lastPath恢复都不执行
      }
    }

    // const firstVisit = !localStorage.getItem('tto_first_visit_done')
    // localStorage.setItem('tto_first_visit_done', '1')
    // localStorage.setItem('tto_selected_subnav', '景点')
    const nav = useNavStore()
    const firstVisit = nav.isFirstVisit()
    if (firstVisit) {
      nav.markFirstVisitDone()
      nav.saveSelectedSubNav('景点')
    }

    if (!isSiteRootPath(to.path)) {
      return next() // 放行
    }

    if (firstVisit || isSearchEngineReferrer()) {
      return next(DEFAULT_FREEINFO_LOCATION)
    }

    const lastPath = readLastPath()
    if (isRestorableAppPath(lastPath)) {
      return next(lastPath)
    }

    return next(DEFAULT_FREEINFO_LOCATION)
  } catch {
    next()
  }
})

export default router
