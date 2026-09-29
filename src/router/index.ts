import { createRouter, createWebHashHistory } from 'vue-router'
import PracticeView from '../views/PracticeView.vue'

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/practice/shape' },
    {
      path: '/practice/:category(shape|sound|meaning|single|words|idioms|article)?',
      name: 'practice',
      component: PracticeView,
      meta: { title: '開始練習' },
    },
    {
      path: '/roots',
      name: 'roots',
      component: () => import('../views/RootsView.vue'),
      meta: { title: '字根表' },
    },
    {
      path: '/lookup',
      name: 'lookup',
      component: () => import('../views/LookupView.vue'),
      meta: { title: '字碼查詢' },
    },
    {
      path: '/notebook',
      name: 'notebook',
      component: () => import('../views/NotebookView.vue'),
      meta: { title: '我的字本' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { title: '偏好設定' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/practice/shape' },
  ],
  scrollBehavior: (_to, _from, savedPosition) => savedPosition || { top: 0 },
})
router.afterEach((to) => {
  document.title = `${String(to.meta.title || '嘸蝦米練習')}｜蝦米練習室`
})
