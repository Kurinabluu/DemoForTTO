import { createRouter, createWebHistory } from 'vue-router'
import { isSearchEngineReferrer, isSiteRootPath, isRestorableAppPath, normalizeAppPath } from '@/utils/appPath'

const DEFAULT_FREEINFO_LOCATION = {
  path: '/trips/freeinfo',
  query: { subNavName: '景点' },
}

function processHashRedirect() {
  try {
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      const hashContent = window.location.hash.substring(1)
      window.location.hash = ''
      return normalizeAppPath(hashContent)
    }
  } catch {
    // ignore
  }
  return null
}

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
      const target = pendingHashRedirect
      pendingHashRedirect = null
      if (target && target !== to.fullPath) {
        return next(target)
      }
    }

    const firstVisit = !localStorage.getItem('tto_first_visit_done')
    if (firstVisit) {
      localStorage.setItem('tto_first_visit_done', '1')
      localStorage.setItem('tto_selected_subnav', '景点')
    }

    if (!isSiteRootPath(to.path)) {
      return next()
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
