import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/image-generator'
  },
  {
    path: '/image-generator',
    name: 'ImageGenerator',
    component: () => import('@/pages/ImageGenerator/index.vue')
  },
  {
    path: '/sci-chart',
    name: 'SciChart',
    component: () => import('@/pages/SciChart/index.vue')
  },
  {
    path: '/literature',
    name: 'Literature',
    component: () => import('@/pages/Literature/index.vue')
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('@/pages/Help.vue')
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: () => import('@/pages/Wallet.vue')
  },
  {
    path: '/canvas',
    name: 'Canvas',
    component: () => import('@/pages/Canvas.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
