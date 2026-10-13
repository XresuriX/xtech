import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    component: () => import('@/layouts/blank.vue'),
    children: [
      {
        path: '',
        redirect: () => '/auth/login',
      },
      {
        path: 'login',
        name: 'login',
        component: () => import('@/pages/auth/login.vue'),
      },
    ],
  },
  {
    path: '/error',
    name: 'error',
    component: () => import('@/pages/error.vue'),
  },
  {
    path: '/members',
    name: 'members',
    component: () => import('@/pages/members/index.vue'),
    meta: { requireAuth: true },
  },
  {
    path: '/economy',
    name: 'economy',
    component: () => import('@/pages/economy/index.vue'),
    meta: { requireAuth: true },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/pages/admin/index.vue'),
  },
  {
    path: '/',
    component: () => import('@/layouts/landing.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/landing/index.vue'),
      },
      {
        path: 'features',
        name: 'features',
        component: () => import('@/pages/landing/features.vue'),
      },
      {
        path: '/',
        name: '',
        component: () => import('@/pages/landing/blog.vue'),
      },
      {
        path: 'blog/blank',
        name: 'blog-blank',
        component: () => import('@/pages/landing/blog-blank.vue'),
      },
      {
        path: 'blog/3d',
        name: 'blog-3d',
        component: () => import('@/pages/landing/blog-3d.vue'),
      },
      {
        path: 'blog/player',
        name: 'blog-player',
        component: () => import('@/pages/landing/blog-player.vue'),
      },
      {
        path: 'blog/filler',
        name: 'blog-filler',
        component: () => import('@/pages/landing/blog-filler.vue'),
      },
      {
        path: '/',
        name: '',
        component: () => import('@/pages/landing/babylonjs.vue'),
      },
      {
        path: 'demo',
        name: 'demo',
        component: () => import('@/pages/landing/demo.vue'),
      },
      {
        path: 'contact',
        name: 'contact',
        component: () => import('@/pages/landing/contact.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/error-404.vue'),
  },
];

export default routes;