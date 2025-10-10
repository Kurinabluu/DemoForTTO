import { createRouter, createWebHistory } from 'vue-router'
import { useNavStore } from '@/stores/nav'

const routes = [
  {
    path: '',
    component: () => import('@/layouts/Layout.vue'),
    children: [
      {
        path: '/',
        redirect: '/DemoForTTO/trips/freeinfo' // 默认重定向到自助游页面
      },
      {
        path: '/DemoForTTO',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        children: [
          // Trips 路由组 - 使用 TripsGrid.vue
          {
            path: 'trips/freeinfo',
            name: 'FreeInfo',
            component: () => import('@/views/TripsGrid.vue'),
            props: (route) => (
              {
                activeTag: '自助游/自驾游免费信息',
                subTab: route.query.subNavName || '景点'
              }
            )
          },
          {
            path: 'trips/oneday',
            name: 'OneDayTour',
            component: () => import('@/views/TripsGrid.vue'),
            props: {
              activeTag: '一日游（固定行程）',
              dayTripTab: '景点一日游'
            }
          },
          {
            path: 'trips/multiday',
            name: 'MultiDayTour',
            component: () => import('@/views/TripsGrid.vue'),
            props: {
              activeTag: '多日游（固定行程）'
            }
          },
          // Service 路由组 - 使用 ServiceShowcase.vue
          {
            path: 'service/ticket',
            name: 'TicketBooking',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '代订门票及旅游项目' }
          },
          {
            path: 'service/car',
            name: 'CarService',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '包车服务（独立成团+专车+司导）' }
          },
          {
            path: 'service/steward',
            name: 'StewardService',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '全程旅游管家服务' }
          },
          {
            path: 'service/guide',
            name: 'GuideService',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '地接地陪服务' }
          },
          {
            path: 'service/custom',
            name: 'CustomService',
            component: () => import('@/views/ServiceShowcase.vue'),
            props: { serviceName: '个性定制服务' }
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

// 恢复逻辑：首次进入默认路由，非首次回到上次停留页面
router.beforeEach((to, from, next) => {
  try {
    const nav = useNavStore();
    const first = !localStorage.getItem('tto_first_visit_done');

    if (first) {
      nav.markFirstVisitDone();
      // 首次访问，重定向到默认路由
      if (to.path === '/' || to.path === '/DemoForTTO') {
        return next('/DemoForTTO/trips/freeinfo');
      }
      return next();
    }

    // 非首次：如果直接到了根或默认页，跳转到上次页面
    const lastPath = nav.lastPath;
    if ((to.path === '/' || to.path === '/DemoForTTO') && lastPath) {
      return next(lastPath);
    }
  } catch (e) {
    // ignore
  }
  next();
});

router.afterEach((to) => {
  // 进入页面后，尝试恢复滚动
  const restore = () => {
    try {
      const nav = useNavStore();
      // 记录本次路径
      nav.savePath(to.fullPath || to.path || '')
      const y = Number(nav.lastScrollY || 0);
      if (typeof window !== 'undefined') {
        const scrollTop = Math.max(0, y)
        window.scrollTo(0, scrollTop)
      }
    } catch (e) {
      // ignore
    }
  }
  requestAnimationFrame(() => {
    setTimeout(restore, 0)
  })
});

export default router;