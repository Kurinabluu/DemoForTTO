import { createRouter, createWebHistory } from 'vue-router'
import { useNavStore } from '@/stores/nav'
import data from '@/data/data.json'

const DEFAULT_FREEINFO_SUBNAV = (() => {
  try {
    const freeInfoSection = data.find((item) => item.tagName === '自助游/自驾游免费参考信息')
    if (freeInfoSection?.subNav?.length) {
      return freeInfoSection.subNav[0].subNavName || '景点'
    }
  } catch (e) {
    // ignore
  }
  return '景点'
})()

// 处理404重定向的hash路径
export function processHashRedirect() {
  try {
    // 检查URL hash中是否包含路径信息（来自404页面的重定向）
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      // 提取hash中的完整路径部分（去掉#），包括查询参数
      const hashContent = window.location.hash.substring(1);
      // 清空hash，然后跳转
      window.location.hash = '';
      return hashContent;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// 创建路由实例前检查是否需要重定向
const redirectPath = typeof window !== 'undefined' ? processHashRedirect() : null;

const routes = [
  {
    path: '',
    component: () => import('@/layouts/Layout.vue'),
    children: [
      {
        path: '/',
        // redirect: '/DemoForTTO/trips/freeinfo' // 默认重定向到自助游页面
        redirect: '/DemoForTTO/service/car' // 默认重定向到自助游页面
      },
      // 兼容直接访问 /DemoForTTO/index.html 的情况（例如静态托管 404 回退）
      // 无论本地存储是否有记录，都先跳转到默认首页或上次访问页面
      {
        path: '/DemoForTTO/index.html',
        redirect: () => {
          try {
            if (typeof window !== 'undefined') {
              const saved = localStorage.getItem('tto_last_path')
              if (saved && saved !== '/DemoForTTO' && saved !== '/') {
                return saved
              }
            }
          } catch (e) {
            // ignore
          }
          // 如果没有保存记录，则跳到默认自助游页面
          // return '/DemoForTTO/trips/freeinfo'
          return '/DemoForTTO/service/car'
        }
      },
      {
        path: '/DemoForTTO',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        redirect: () => {
          try {
            if (typeof window !== 'undefined') {
              const saved = localStorage.getItem('tto_last_path')
              if (saved && saved !== '/DemoForTTO' && saved !== '/') {
                return saved
              }
            }
          } catch (e) {
            // ignore
          }
          // return '/DemoForTTO/trips/freeinfo'
          return '/DemoForTTO/service/car'
        }, // 添加默认重定向
        // redirect: '/DemoForTTO/service/car', // 添加默认重定向
        children: [
          // Trips 路由组 - 使用 TripsGrid.vue
          {
            path: 'trips/freeinfo',
            name: 'FreeInfo',
            component: () => import('@/views/TripsGrid.vue'),
            props: (route) => (
              {
                activeTag: '自助游/自驾游免费参考信息',
                subTab: route.query.subNavName || '景点'
              }
            )
          },
          {
            path: 'trips/routes',
            name: 'Routes',
            component: () => import('@/views/TripsGrid.vue'),
            props: (route) => ({
              activeTag: '一日游/多日游',
              dayTripTab: route.query.dayTripTab || '1日行程'
            })
          },
          // {
          //   path: 'trips/multiday',
          //   name: 'MultiDayTour',
          //   component: () => import('@/views/TripsGrid.vue'),
          //   props: {
          //     activeTag: '多日游'
          //   }
          // },
          // Service 路由组 - 使用 ServiceShowcase.vue
          // {
          //   path: 'service/ticket',
          //   name: 'TicketBooking',
          //   component: () => import('@/views/ServiceShowcase.vue'),
          //   props: { serviceName: '热门项目' }
          // },
          {
            path: 'service/car',
            name: 'CarService',
            component: () => import('@/views/ServiceShowcase.vue'),
            // props: { serviceName: '包车服务（独立成团+专车+司导）' }
            props: { serviceName: '包车服务' }
          },
          // {
          //   path: 'service/steward',
          //   name: 'StewardService',
          //   component: () => import('@/views/ServiceShowcase.vue'),
          //   props: { serviceName: '全程旅游管家服务' }
          // },
          // {
          //   path: 'service/guide',
          //   name: 'GuideService',
          //   component: () => import('@/views/ServiceShowcase.vue'),
          //   props: { serviceName: '地接地陪服务' }
          // },
          {
            path: 'service/custom',
            name: 'CustomService',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '私人定制' }
          },
          {
            path: 'search',
            name: 'GlobalSearch',
            component: () => import('@/views/SearchResults.vue')
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
});

const detectReloadNavigation = () => {
  try {
    if (typeof window === 'undefined') return false
    if (typeof performance?.getEntriesByType === 'function') {
      const entries = performance.getEntriesByType('navigation')
      if (entries && entries.length > 0) {
        return entries[0].type === 'reload'
      }
    }
    if (performance && 'navigation' in performance) {
      return performance.navigation.type === 1 // TYPE_RELOAD
    }
  } catch (e) {
    // ignore
  }
  return false
}

let shouldSkipFirstAfterEach = detectReloadNavigation()

// 恢复逻辑：首次进入默认路由，非首次回到上次停留页面
router.beforeEach((to, from, next) => {
  try {
    // 首先检查是否有从404页面重定向过来的路径
    if (redirectPath && to.path === '/DemoForTTO/index.html') {
      return next(redirectPath);
    }

    // 在beforeEach中直接使用localStorage，避免依赖Pinia实例
    const first = !localStorage.getItem('tto_first_visit_done');

    if (first) {
      // 直接设置localStorage，不依赖Pinia
      localStorage.setItem('tto_first_visit_done', '1');
      localStorage.setItem('tto_selected_subnav', DEFAULT_FREEINFO_SUBNAV);
      // 首次访问，重定向到默认路由
      if (to.path === '/' || to.path === '/DemoForTTO' || to.path === '/DemoForTTO/index.html') {
        return next('/DemoForTTO/service/car');
        // return next('/DemoForTTO/trips/freeinfo');
      }
      return next();
    }

    // 非首次：如果直接到了根或默认页，跳转到上次页面
    const lastPath = localStorage.getItem('tto_last_path') || '';
    if ((to.path === '/' || to.path === '/DemoForTTO' || to.path === '/DemoForTTO/index.html') && lastPath) {
      return next(lastPath);
    }
  } catch (e) {
    // ignore
  }
  next();
});



export default router;