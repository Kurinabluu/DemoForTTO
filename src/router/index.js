import { createRouter, createWebHistory } from 'vue-router';

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

      },
      {
        path: 'DemoForTTO/disclaimer',
        component: () => import('@/views/Disclaimer.vue'),
      }
    ]
  }

]
const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;