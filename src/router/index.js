import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import { useNavStore } from '@/stores/nav'

// const BATH_PATH = 
const routes = [
  //首页
  {
    path: '',
    component: () => import('@/layouts/Layout.vue'),
    children: [
      {
        path: '/',
        redirect: { name: 'Home' }
      }, {
        path: 'index',
        redirect: { name: 'Home' }
      },
      {
        path: 'home',
        redirect: { name: 'Home' }
      },
      {
        path: 'DemoForTTO',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        children: [
          // 待修改，改成根据本地存储而决定显示哪个组件
          { path: '', component: () => import('@/views/ServiceShowcase.vue') },
          // 服务相关路由
          { path: 'service', name: 'Service', component: () => import('@/views/ServiceShowcase.vue') },
          { path: 'trips', name: 'Trips', component: () => import('@/views/TripsGrid.vue') },
        ]
      },

    ]
  }

]
const router = createRouter({
  history: createWebHistory(),
  // history: createWebHashHistory(),
  routes
});

// 恢复逻辑：首次进入强制首页，非首次回到上次停留页面，并恢复滚动
router.beforeEach((to, from, next) => {
  try {
    const nav = useNavStore();
    const first = !localStorage.getItem('tto_first_visit_done');
    if (first) {
      nav.markFirstVisitDone();
      // 强制进入首页（布局里首页路由为 path: 'DemoForTTO' 名称 Home）
      if (to.name !== 'Home') return next({ name: 'Home' });
      return next();
    }
    // 非首次：如果直接到了根或默认页，跳转到上次页面
    const lastPath = nav.lastPath;
    if ((to.path === '/' || to.name === undefined) && lastPath) {
      return next(lastPath);
    }
  } catch (e) {
    // ignore
  }
  next();
});

router.afterEach((to) => {
  // 进入页面后，尝试恢复滚动（多重回调，兼容移动端渲染时序）
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