import { createRouter, createWebHistory } from 'vue-router'
import TodayView from '../views/TodayView.vue'

const routes = [
  { path: '/', redirect: '/today' },
  { path: '/today', name: 'today', component: TodayView },
  { path: '/list', name: 'list', component: () => import('../views/ListView.vue') },
  { path: '/calendar', name: 'calendar', component: () => import('../views/CalendarView.vue') },
  { path: '/analytics', name: 'analytics', component: () => import('../views/AnalyticsView.vue') },
  { path: '/gantt', name: 'gantt', component: () => import('../views/GanttView.vue') },
  { path: '/tags', name: 'tags', component: () => import('../views/TagsView.vue') },
  { path: '/recurrences', name: 'recurrences', component: () => import('../views/RecurrencesView.vue') },
  { path: '/templates', name: 'templates', component: () => import('../views/TemplatesView.vue') },
  { path: '/attachments', name: 'attachments', component: () => import('../views/AttachmentsView.vue') },
  { path: '/payday', name: 'payday', component: () => import('../views/PaydayView.vue') },
  { path: '/salary-timer', name: 'salary-timer', component: () => import('../views/SalaryTimerView.vue') },
  { path: '/rest-reminder', name: 'rest-reminder', component: () => import('../views/RestReminderView.vue') },
  { path: '/trash', name: 'trash', component: () => import('../views/TrashView.vue') },
  { path: '/custom-fields', name: 'custom-fields', component: () => import('../views/CustomFieldsView.vue') },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
