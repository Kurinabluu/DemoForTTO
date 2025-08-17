import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: "/DemoForTTO/",
    component: () => import("../views/HomeView.vue")
  }
]
const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;