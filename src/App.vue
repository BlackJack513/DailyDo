<template>
 <div :class="{ dark: isDark }">
 <!-- Mini mode: dedicated compact view -->
 <MiniModeView v-if="store.isMiniMode" />
 <!-- Normal mode: full layout -->
 <div v-else class="app-wrapper flex h-screen overflow-hidden relative">
 <!-- Background image layer -->
 <div
 v-if="store.backgroundImage"
 class="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
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
const isDark = computed(() => store.theme === 'dark')

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

onMounted(async () => {
 try {
 await store.loadSettings()
 } catch (e) {
 console.error('Failed to load settings:', e)
 }
 store.applyTheme()
 // Check reminders immediately, then every 30 seconds
 checkReminders()
 reminderTimer = setInterval(checkReminders, 30000)
})

onUnmounted(() => {
 if (reminderTimer) clearInterval(reminderTimer)
})
</script>
