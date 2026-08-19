<template>
  <div class="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
    <!-- Content -->
    <div class="relative z-20 flex-1 flex flex-col items-center justify-center px-8 py-12">
      <!-- Icon -->
      <div class="text-7xl mb-6">🧘</div>

      <!-- Main heading -->
      <h1 class="text-3xl font-bold text-content mb-3 text-center">
        休息提醒
      </h1>

      <!-- Sub message -->
      <p class="text-lg text-content-secondary text-muted text-center mb-10 max-w-md leading-relaxed">
        劳逸结合，保持高效。定时提醒你离开座位，活动身体
      </p>

      <!-- Settings Card -->
      <div class="w-full max-w-md bg-surface/80 backdrop-blur rounded-2xl shadow-lg border border-sky-200 border-divider px-8 py-6 space-y-6">
        <!-- Toggle Switch -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-content">开启休息提醒</p>
            <p class="text-xs text-content-tertiary mt-0.5">{{ enabled ? '已开启，将定时提醒你休息' : '已关闭' }}</p>
          </div>
          <button
            @click="toggleEnabled"
            class="relative w-12 h-6 rounded-full transition-colors duration-300"
            :class="enabled ? 'bg-sky-500' : 'bg-control'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300"
              :class="enabled ? 'translate-x-6' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <!-- Interval Setting -->
        <div v-if="enabled" class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-content">提醒间隔</p>
            <span class="text-sm font-bold text-sky-500">{{ interval }} 分钟</span>
          </div>

          <!-- Slider -->
          <div class="relative">
            <input
              v-model.number="interval"
              type="range"
              min="15"
              max="120"
              step="15"
              class="w-full h-2 rounded-full appearance-none cursor-pointer bg-control"
              style="accent-color: #0ea5e9"
              @input="onIntervalChange"
            />
            <div class="flex justify-between mt-1.5">
              <span class="text-[10px] text-content-tertiary">15分钟</span>
              <span class="text-[10px] text-content-tertiary">30分钟</span>
              <span class="text-[10px] text-content-tertiary">60分钟</span>
              <span class="text-[10px] text-content-tertiary">90分钟</span>
              <span class="text-[10px] text-content-tertiary">120分钟</span>
            </div>
          </div>

          <!-- Quick select buttons -->
          <div class="flex gap-2">
            <button
              v-for="m in [15, 30, 45, 60, 90]"
              :key="m"
              @click="setIntervalVal(m)"
              class="flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              :class="interval === m ? 'border-sky-400 bg-sky-50 text-sky-600' : 'border-border text-content-tertiary hover:border-content-tertiary'"
            >
              {{ m }}分钟
            </button>
          </div>
        </div>

        <!-- Next reminder info -->
        <div v-if="enabled" class="pt-3 border-t border-border">
          <div class="flex items-center gap-2 text-xs text-content-tertiary">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>下次提醒：{{ nextReminderLabel }}</span>
          </div>
        </div>

        <!-- Test button -->
        <div class="flex justify-center pt-2">
          <button
            @click="sendTestNotification"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-sky-500 border border-sky-200 hover:bg-sky-50 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            发送测试通知
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as db from '../utils/db'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification'
import { useAppStore } from '../stores/app'

const store = useAppStore()

// ─── State ───────────────────────────────────────────────
const enabled = ref(false)
const interval = ref(45)

// ─── Encouraging messages ────────────────────────────────
const messages = [
  '起来活动一下吧！伸个懒腰，让身体放松放松 ',
  '你已经工作很久了，看看远处，让眼睛休息一下 👀',
  '该喝水啦！保持水分，保持活力 💧',
  '站起来走走，活动一下脖子和肩膀 🚶',
  '深呼吸三次，让大脑充充电 ️',
  '远眺窗外，看看绿色的植物，放松眼睛 🌿',
  '做几个扩胸运动，改善血液循环 💪',
  '站起来接杯水，顺便活动一下双腿 🥛',
  '闭上眼睛，休息30秒，让大脑清空一下 🧠',
  '扭扭脖子，转转肩膀，缓解久坐疲劳 🔄',
  '你已经很棒了！休息一会儿，回来更高效 ',
  '起来伸展一下身体，预防颈椎和腰椎问题 🏃',
]

function getRandomMessage() {
  return messages[Math.floor(Math.random() * messages.length)]
}

// ── Notification ───────────────────────────────────────
async function ensurePermission() {
  try {
    const granted = await isPermissionGranted()
    if (!granted) {
      const permission = await requestPermission()
      return permission === 'granted'
    }
    return true
  } catch {
    return false
  }
}

async function sendTestNotification() {
  const ok = await ensurePermission()
  if (!ok) {
    alert('通知权限未授予，请在系统设置中允许 DailyDo 发送通知')
    return
  }
  sendNotification({
    title: 'DailyDo 休息提醒',
    body: getRandomMessage(),
  })
}

// ─── Settings persistence ───────────────────────────────
async function loadSettings() {
  try {
    const rawEnabled = await db.getSetting('rest_reminder_enabled')
    if (rawEnabled !== null && rawEnabled !== undefined) {
      enabled.value = rawEnabled === 'true'
    }
  } catch {
    /* use default */
  }

  try {
    const rawInterval = await db.getSetting('rest_reminder_interval')
    if (rawInterval) {
      const val = parseInt(rawInterval, 10)
      if (val >= 15 && val <= 120) {
        interval.value = val
      }
    }
  } catch {
    /* use default */
  }
}

async function saveEnabled() {
  try {
    await db.setSetting('rest_reminder_enabled', enabled.value ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

async function saveInterval() {
  try {
    await db.setSetting('rest_reminder_interval', String(interval.value))
  } catch {
    /* ignore */
  }
}

// ─── Actions ─────────────────────────────────────────────
function toggleEnabled() {
  enabled.value = !enabled.value
  saveEnabled()
  store.restReminderEnabled = enabled.value
  store.resetRestReminderTimer()
}

function setIntervalVal(minutes) {
  interval.value = minutes
  saveInterval()
  store.restReminderInterval = minutes
  store.resetRestReminderTimer()
}

function onIntervalChange() {
  if (interval.value < 15) interval.value = 15
  if (interval.value > 120) interval.value = 120
  saveInterval()
  store.restReminderInterval = interval.value
  store.resetRestReminderTimer()
}

// ─── Computed ────────────────────────────────────────────
const nextReminderLabel = computed(() => {
  // Read from store if available, otherwise show based on interval
  return `约${interval.value}分钟后`
})

// ─── Lifecycle ───────────────────────────────────────────
onMounted(async () => {
  await loadSettings()
})
</script>
