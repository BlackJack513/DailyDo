import { createRouter, createWebHistory } from 'vue-router'
import TodayView from '../views/TodayView.vue'

const routes = [
  { path: '/', redirect: '/today' },
  { path: '/today', name: 'today', component: TodayView },
  { path: '/calendar', name: 'calendar', component: () => import('../views/CalendarView.vue') },
  { path: '/analytics', name: 'analytics', component: () => import('../views/AnalyticsView.vue') },
  { path: '/tags', name: 'tags', component: () => import('../views/TagsView.vue') },
  { path: '/recurrences', name: 'recurrences', component: () => import('../views/RecurrencesView.vue') },
  { path: '/templates', name: 'templates', component: () => import('../views/TemplatesView.vue') },
  { path: '/attachments', name: 'attachments', component: () => import('../views/AttachmentsView.vue') },
  { path: '/trash', name: 'trash', component: () => import('../views/TrashView.vue') },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
