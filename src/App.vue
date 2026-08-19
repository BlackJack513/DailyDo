<template>
  <div :class="{ dark: isDark }">
    <!-- Mini mode: dedicated compact view -->
    <MiniModeView v-if="store.isMiniMode" />
    <!-- Normal mode: full layout -->
    <div v-else class="app-wrapper flex h-screen overflow-hidden relative">
      <!-- Background image layer -->
      <div
        v-if="store.backgroundImage"
        class="absolute inset-0 z-0"
        :class="store.backgroundMode === 'tile' ? 'bg-repeat' : 'bg-cover bg-center bg-no-repeat'"
        :style="{ backgroundImage: `url('${store.backgroundImage}')` }"
      ></div>
      <div
        v-if="store.backgroundImage"
        class="absolute inset-0 z-0"
        :class="isDark ? 'bg-black/50' : 'bg-surface/60'"
      ></div>
      <!-- App content -->
      <div class="relative z-10 flex h-full w-full">
        <Sidebar />
        <main class="flex-1 overflow-y-auto">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from './stores/app'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification'
import { getPendingReminders } from './utils/db'
import Sidebar from './components/Sidebar.vue'
import MiniModeView from './components/MiniModeView.vue'

const store = useAppStore()
const isDark = computed(() => store.isDarkTheme)

// Reminder tracking
const notifiedReminderIds = new Set()
let reminderTimer = null

async function checkReminders() {
  try {
    const granted = await isPermissionGranted()
    if (!granted) {
      const permission = await requestPermission()
      if (permission !== 'granted') return
    }
    const reminders = await getPendingReminders()
    for (const todo of reminders) {
      if (!notifiedReminderIds.has(todo.id)) {
        notifiedReminderIds.add(todo.id)
        sendNotification({
          title: 'DailyDo \u63d0\u9192',
          body: `\u23f0 ${todo.title}`,
        })
      }
    }
  } catch (e) {
    console.warn('Reminder check failed:', e)
  }
}

// ─── Rest Reminder ────────────────────────────────────────
const restReminderMessages = [
  '起来活动一下吧！伸个懒腰，让身体放松放松 ',
  '你已经工作很久了，看看远处，让眼睛休息一下 ',
  '该喝水啦！保持水分，保持活力 ',
  '站起来走走，活动一下脖子和肩膀 ',
  '深呼吸三次，让大脑充充电 ',
  '远眺窗外，看看绿色的植物，放松眼睛 ',
  '做几个扩胸运动，改善血液循环 ',
  '站起来接杯水，顺便活动一下双腿 ',
  '闭上眼睛，休息30秒，让大脑清空一下 ',
  '扭扭脖子，转转肩膀，缓解久坐疲劳 ',
  '你已经很棒了！休息一会儿，回来更高效 ',
  '起来伸展一下身体，预防颈椎和腰椎问题 ',
]

let restReminderTimer = null

async function checkRestReminder() {
  if (!store.restReminderEnabled) return
  const intervalMs = store.restReminderInterval * 60 * 1000
  const now = Date.now()
  if (now - store.lastRestReminderAt < intervalMs) return

  try {
    const granted = await isPermissionGranted()
    if (!granted) {
      const permission = await requestPermission()
      if (permission !== 'granted') return
    }
    const msg = restReminderMessages[Math.floor(Math.random() * restReminderMessages.length)]
    sendNotification({
      title: 'DailyDo 休息提醒',
      body: msg,
    })
    store.lastRestReminderAt = now
  } catch (e) {
    console.warn('Rest reminder failed:', e)
  }
}

onMounted(async () => {
  try {
    await store.loadSettings()
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  store.applyTheme()
  // Load holiday data for current year (non-blocking)
  const currentYear = new Date().getFullYear()
  store.loadHolidaysIfNeeded(currentYear)
  // Check for overdue/missing recurrences on startup
  store.checkOverdueRecurrences()
  // Check reminders immediately, then every 30 seconds
  checkReminders()
  reminderTimer = setInterval(checkReminders, 30000)
  // Initialize rest reminder timer: set lastRestReminderAt to now so first reminder fires after full interval
  if (store.restReminderEnabled) {
    store.lastRestReminderAt = Date.now()
  }
  restReminderTimer = setInterval(checkRestReminder, 30000)
})

onUnmounted(() => {
  if (reminderTimer) clearInterval(reminderTimer)
  if (restReminderTimer) clearInterval(restReminderTimer)
})
</script>
